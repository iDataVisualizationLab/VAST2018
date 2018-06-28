const COL_MONTH_INDEX = "monthIndex";
const COL_SAMPLE_DATE = "sample date";
const COL_MEASURE = "measure";
const COL_VALUE = "value";
const COL_LOCATION = "location";

let myDataProcessor = {
    data: null, //used to store the read data.
    readData: function (fileName, dataHandler) {
        d3.csv(fileName, function (error, rawData) {
            if (error) throw error;
            myDataProcessor.data = rawData.map(d => {
                d[COL_SAMPLE_DATE] = new Date(d[COL_SAMPLE_DATE]);
                d[COL_VALUE] = +d[COL_VALUE];
                return d;
            });
            myDataProcessor.markOutliers();
            //myDataProcessor.filterOutliers();
            myDataProcessor.addMonthIndex();
            dataHandler();

        });
    },
    unpack: function (data, columnName) {
        return data.map(row => row[columnName]);
    },
    getAllMeasures: function () {
        return d3.set(this.unpack(this.data, COL_MEASURE)).values();
    },
    getAllLocations: function () {
        return d3.set(this.unpack(this.data, COL_LOCATION)).values();
    },
    addMonthIndex: function () {
        let minDate = d3.min(this.unpack(this.data, COL_SAMPLE_DATE));
        this.data = this.data.map(d => {
            d[COL_MONTH_INDEX] = utils.monthdiff(minDate, d[COL_SAMPLE_DATE]);
            return d;
        });
    },
    monthIndexToYear: function(month){
        let nestedByMonthIndex = d3.nest().key(d=>d[COL_MONTH_INDEX]).sortKeys(d3.ascending).map(this.data);
        let year = nestedByMonthIndex["$"+month][0][COL_SAMPLE_DATE].getFullYear();
        return year;
    },
    markOutliers: function () {
        //Find all outliers for measure
        let normalBounds = this.getNestedByMeasure();
        let keys = normalBounds.keys();
        keys.forEach(key => {
            let bound = statistics.normalBound(normalBounds['$' + key].map(d => d[COL_VALUE]));
            normalBounds['$' + key].forEach(d => {
                if (d[COL_VALUE] > bound[1] || d[COL_VALUE] < bound[0]) {
                    d["isOutlier"] = true;
                    if(d[COL_VALUE] > bound[1]){
                        d["outlierType"] = "upper";
                    }
                    if(d[COL_VALUE] < bound[0]){
                        d["outlierType"] = "lower";
                    }
                } else {
                    d["isOutlier"] = false;
                }
            });
        });
        this.data = normalBounds.values().reduce((prev, cur) => prev.concat(cur));
    },
    filterOutliers: function () {
        this.data = this.data.filter(d => !d["isOutlier"]);
    },
    getNestedByMeasure: function () {
        //Nest by Measure
        let nested = d3.nest().key(d => d[COL_MEASURE]).sortKeys(d3.ascending).map(this.data);
        return nested;
    },
    getNestedByMeasureLocation: function () {
        //Nest by Mesure + location
        let nested = d3.nest().key(d => d[COL_MEASURE] + "_" + d[COL_LOCATION]).sortKeys(d3.ascending).map(this.data);
        return nested;
    },
    getNestedByMeasureLocationMonth: function () {
        //Nest by Measure + Location + Month Index
        let nested = d3.nest().key(d => d[COL_MEASURE] + "_" + d[COL_LOCATION] + "_" + d[COL_MONTH_INDEX]).sortKeys(d3.ascending).map(this.data);
        let keys = nested.keys();
        //Average the value of each month
        keys.forEach(key => {
            let hasOutlier = false;
            let outlierType = '';
            for (let i = 0; i < nested['$' + key].length; i++) {
                if(nested['$'+key][i]['isOutlier']===true){
                    hasOutlier=true;
                    outlierType += nested['$'+key][i]['outlierType'];
                }
            }
            nested['$' + key] = {
                data: nested['$' + key],
                average: d3.mean(nested['$' + key].map(d => d[COL_VALUE])),
                hasOutlier: hasOutlier,
                outlierType: outlierType
            };
        });
        return nested;
    },
    getNestedData: function () {
        //Nested by MEASURE
        let nested = d3.nest().key(d => d[COL_MEASURE]).sortKeys(d3.ascending).map(this.data);
        //Inside each measure, nest by location (we don't need to sort).
        let measures = nested.keys();
        let measureData = [];
        measures.forEach(measure => {
            nested["$" + measure] = d3.nest().key(d => d[COL_LOCATION]).map(nested["$" + measure]);
            //Now for each measure nest by months.
            let locations = nested["$" + measure].keys();
            let locationData = [];
            locations.forEach(location => {
                nested["$" + measure]["$" + location] = d3.nest().key(d => d[COL_MONTH_INDEX]).sortKeys(d3.ascending()).map(nested["$" + measure]["$" + location]);
                //Now for each month we take the average
                let months = nested["$" + measure]["$" + location].keys();
                let monthData = [];
                months.forEach(month => {
                    let value = d3.mean(nested["$" + measure]["$" + location]["$" + month].map(d => d[COL_VALUE]));
                    monthData.push({month: month, data: value})
                });
                locationData.push({location: location, data: monthData});
            });
            measureData.push({measure: measure, data: locationData});
        });
        return measureData;
    },
    getNestedScales: function () {
        //This scale is by the individual values => but we print the heatmap with average scales.
        //Nest by location + Measure
        // let scales = this.getNestedByMeasure();
        // let keys = scales.keys();
        // keys.forEach(key=>{
        //     scales['$'+key] = d3.scaleLinear().domain(d3.extent(scales['$'+key].map(d=>d[COL_VALUE]))).range([1, 0.5]);
        // });
        //return scales;

        //Scales by the average of the month.
        var scales = {};
        let averages = this.getNestedByMeasureLocationMonth();
        let measures = this.getAllMeasures();
        measures.forEach(measure => {
            //Get all averaged values for it.
            let averageValues = [];
            averages.keys().forEach(key => {
                if (key.indexOf(measure) >= 0) {
                    averageValues.push(averages['$' + key].average);
                }
            });
            scales["$" + measure] = d3.scaleLinear().domain(d3.extent(averageValues)).range([1, 0]);
        });
        return scales;
    },

    populateComboBox: function (columnName, populateComboBoxHandler) {
        let column = this.unpack(this.data, columnName);
        let uniqueValues = d3.set(column).values();
        uniqueValues.sort((a, b) => a.localeCompare(b));
        populateComboBoxHandler(uniqueValues);
    },
    plotLineGraph: function (location, measure, handler) {
        let dataForLocation = this.data.filter(d => d.location === location);
        let dataForMeasure = dataForLocation.filter(d => d.measure === measure);
        let dates = this.unpack(dataForMeasure, COL_SAMPLE_DATE);
        let values = this.unpack(dataForMeasure, COL_VALUE);
        handler(location, measure, dates, values);
    },
    drawParallelCoordinates: function (parallelCoordinateHandler) {
        //Process location
        let locationColumn = this.unpack(this.data, COL_LOCATION);
        let uniqueLocations = d3.set(locationColumn).values();
        uniqueLocations.sort((a, b) => a.localeCompare(b));

        function locationToIndex(loc) {
            return uniqueLocations.indexOf(loc);
        }

        //Process sample dates
        let sampleDateColumn = this.unpack(this.data, COL_SAMPLE_DATE);
        //Process sample years
        let sampleYears = sampleDateColumn.map(d => d.getFullYear());
        let uniqueYears = d3.set(sampleYears).values();
        uniqueYears.sort((a, b) => a - b);

        //Process measures
        let measureColumn = this.unpack(this.data, COL_MEASURE);
        let uniqueMeasures = d3.set(measureColumn).values();
        uniqueMeasures.sort((a, b) => a.localeCompare(b));

        function measureToIndex(measure) {
            return uniqueMeasures.indexOf(measure);
        }

        //Process the value column
        let valueColumn = this.unpack(this.data, COL_VALUE);
        //Color
        let c20 = d3.schemeCategory20b;
        let colorscale = [];
        uniqueLocations.map((d, i) => {
            colorscale.push([i / (uniqueLocations.length - 1), c20[i]]);
        });
        let data = [{
            type: 'parcoords',
            line: {
                showscale: true,
                colorscale: 'Jet',
                color: valueColumn,
            },
            dimensions: [
                {
                    label: 'Location',
                    values: locationColumn.map(loc => locationToIndex(loc)),
                    tickvals: uniqueLocations.map((d, i) => i),
                    ticktext: uniqueLocations
                }, {
                    label: 'Mesure',
                    values: measureColumn.map(measure => measureToIndex(measure)),
                    tickvals: uniqueMeasures.map((d, i) => i),
                    ticktext: uniqueMeasures
                }, {
                    label: 'Value',
                    values: valueColumn
                }
            ]
        }];
        parallelCoordinateHandler(data);
    },
    getMonthNumber: function () {
        let dateRange = d3.extent(this.unpack(this.data, COL_SAMPLE_DATE));
        return utils.monthdiff(dateRange[0], dateRange[1]);
    },
    plotBoxPlots: function (locations, measures, plotBoxPlotHandler) {
        let columns = [];
        let nested = this.getNestedByMeasureLocation();
        let yValues = [];
        measures.forEach(measure => {
            locations.forEach(location => {
                let column = measure + "_" + location;
                let columnData = nested["$" + column];
                if (columnData) {
                    let singleYValues = columnData.map(d => d['value']);
                    columns.push(column);
                    yValues.push(singleYValues);
                }

            });
        });
        plotBoxPlotHandler(columns, yValues);
    }

};