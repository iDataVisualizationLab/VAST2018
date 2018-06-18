let myDataProcessor = {
    data: null, //used to store the read data.
    readData: function (fileName) {
        d3.csv(fileName, function (error, rawData) {
            if (error) throw error;
            myDataProcessor.data = rawData.map(d=>{
                d['sample date'] = new Date(d['sample date']);
                d['value'] = +d['value'];
                return d;
            });
        });
    },
    unpack: function(data, columnName){
        return data.map(row=> row[columnName]);
    },
    populateComboBox: function(columnName, populateComboBoxHandler){
        let column = this.unpack(this.data, columnName);
        let uniqueValues = d3.set(column).values();
        uniqueValues.sort((a, b) => a.localeCompare(b));
        populateComboBoxHandler(uniqueValues);
    },
    plotLineGraph: function(location, measure, handler){
        let dataForLocation = this.data.filter(d => d.location === location);
        let dataForMeasure = dataForLocation.filter(d=>d.measure === measure);
        let dates = this.unpack(dataForMeasure, 'sample date');
        let values = this.unpack(dataForMeasure, 'value');
        handler(location, measure, dates, values);
    },
    drawParallelCoordinates: function (parallelCoordinateHandler) {
        //Process location
        let locationColumn = this.unpack(this.data, 'location');
        let uniqueLocations = d3.set(locationColumn).values();
        uniqueLocations.sort((a, b)=>a.localeCompare(b));
        function locationToIndex(loc){
            return uniqueLocations.indexOf(loc);
        }
        //Process sample dates
        let sampleDateColumn = this.unpack(this.data, 'sample date');
        //Process sample years
        let sampleYears = sampleDateColumn.map(d=>d.getFullYear());
        let uniqueYears = d3.set(sampleYears).values();
        uniqueYears.sort((a, b) => a-b);

        //Process measures
        let measureColumn = this.unpack(this.data, 'measure');
        let uniqueMeasures = d3.set(measureColumn).values();
        uniqueMeasures.sort((a, b)=> a.localeCompare(b));
        function measureToIndex(measure){
            return uniqueMeasures.indexOf(measure);
        }
        //Process the value column
        let valueColumn = this.unpack(this.data, 'value');
        //Color
        let c10 = d3.schemeCategory10;
        let colorscale = [];
        uniqueLocations.map((d, i)=>{
            colorscale.push([i, c10[i]]);
        });

        let data = [{
            type: 'parcoords',
            line:{
                color: locationColumn.map(loc=>locationToIndex(loc)),
                colorscale: colorscale
            },
            dimensions: [
                {
                    label: 'Location',
                    values: locationColumn.map(loc=>locationToIndex(loc)),
                    tickvals: uniqueLocations.map((d, i) => i),
                    ticktext: uniqueLocations
                },{
                    label: 'Mesure',
                    values: measureColumn.map(measure=>measureToIndex(measure)),
                    tickvals: uniqueMeasures.map((d, i) => i),
                    ticktext: uniqueMeasures
                },{
                    label: 'Sample year',
                    values: sampleYears,
                    tickvals: uniqueYears,
                    ticktext: uniqueYears.map(y=>y+"")
                },{
                    label: 'Log10(value)',
                    values: valueColumn.map(value=>Math.log10(value))
                },{
                    label: 'Value',
                    values: valueColumn
                }
            ]
        }];
        parallelCoordinateHandler(data);
    }
};
