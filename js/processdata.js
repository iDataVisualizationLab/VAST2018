const COL_MONTH_INDEX = "monthIndex";
const COL_SAMPLE_DATE = "sample date";
const COL_MEASURE = "measure";
const COL_VALUE = "value";
const COL_LOCATION = "location";
const COL_IS_OUTLIER = "isOutlier";
let myDataProcessor = {
    samplingRatio: {},
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
            //TODO: Add this line when we use complete data.
            //myDataProcessor.filterExtremelyHighvalues(1500);
            //myDataProcessor.filterOutByMeasures(myDataProcessor.getChemWithFewMeasures(150));
            myDataProcessor.addMonthIndex();
            myDataProcessor.generateSamplingRatios();
            myDataProcessor.generateSamplingRatios();
            dataHandler();
        });
    },
    countMissingDataPerMonth: function(){
        let locations = this.getAllLocations();
        let measures = this.getAllMeasures();
        let months = this.getMonthNumber();
        let missingCounter = [];
        let data = this.getNestedByMeasureLocationMonth();
        for (let i = 0; i < 12; i++) {
            missingCounter[i] = 0;
        }
        locations.forEach((location)=>{
            measures.forEach((measure)=>{
                for (let i = 0; i < months; i++) {
                    if(!data['$'+measure+'_'+location+"_"+i]){
                        let m = i%12;
                        missingCounter[m] += 1;
                    }
                }
            })
        });
        return missingCounter;
    },
    generateSamplingRatiosForGroup: function(byLocation){
        let data = this.getNestedByMeasureLocationMonth();
        let keys = d3.keys(data);
        let groups = byLocation ? this.getAllLocations(): this.getAllMeasures();

        groups.forEach(group=>{
            let totalPoints = 0;
            let totalSamples = 0;
            keys.forEach(key=>{
                if(key.indexOf(group) >=0){
                    totalPoints+=1;
                    totalSamples += data[key].data.length;
                }
            });
            myDataProcessor.samplingRatio["$"+group] = {totalPoints: totalPoints, totalSamples: totalSamples, ratio: totalSamples/totalPoints}
        });
    },
    generateSamplingRatios: function(){
        this.generateSamplingRatiosForGroup(true);
        this.generateSamplingRatiosForGroup(false);
    },
    calculateSamplingRatioForMeasures: function(){
        return this.calculateSamplingRatioForGroup(false);
    },
    getNestedByMeasureLocationMonthFromData: function (data) {
        //Nest by Measure + Location + Month Index
        let nested = d3.nest().key(d => d[COL_MEASURE] + "_" + d[COL_LOCATION] + "_" + d[COL_MONTH_INDEX]).sortKeys(d3.ascending).map(data);
        let nestedByMeasure = this.getNestedByMeasure();
        let measures = [];
        d3.keys(nestedByMeasure).forEach(key => {
            if (typeof nestedByMeasure[key].map === 'function') {
                measures.push({
                    min: d3.min(nestedByMeasure[key].map(d => d[COL_VALUE])),
                    max: d3.max(nestedByMeasure[key].map(d => d[COL_VALUE])),
                    average: d3.mean(nestedByMeasure[key].map(d => d[COL_VALUE]))
                });
            }
        });
        let keys = nested.keys();
        //Average the value of each month
        keys.forEach(key => {
            let hasOutlier = false;
            let outlierType = '';
            let outlierCount = 0;
            for (let i = 0; i < nested['$' + key].length; i++) {
                if (nested['$' + key][i][COL_IS_OUTLIER] === true) {
                    hasOutlier = true;
                    outlierType += nested['$' + key][i]['outlierType'];
                    outlierCount += 1;
                }
            }
            nested['$' + key] = {
                data: nested['$' + key],
                //TODO: Change these to selectable options.
                //Do the mean but filter out the outliers first
                average: d3.mean(nested['$' + key].filter(d=>d[COL_IS_OUTLIER]===false).map(d => d[COL_VALUE])),
                // average: d3.max(nested['$' + key].map(d => d[COL_VALUE])),
                // average: d3.min(nested['$' + key].map(d => d[COL_VALUE])),
                // average: d3.max(nested['$' + key].map(d => d[COL_VALUE]))-d3.min(nested['$' + key].map(d => d[COL_VALUE])),
                // hasOutlier: false,
                // average: d3.mean(nested['$' + key].map(d => d[COL_VALUE]))-d3.min(nested['$' + key].map(d => d[COL_VALUE])),
                // hasOutlier: false,
                // average: d3.max(nested['$' + key].map(d => d[COL_VALUE]))-d3.min(nested['$' + key].map(d => d[COL_VALUE])),
                // hasOutlier: false,
                // average: Math.max(0, d3.max(nested['$' + key].map(d => d[COL_VALUE])) - d3.mean(nested['$' + key].map(d => d[COL_VALUE]))),
                // hasOutlier: false,
                // average: Math.max(Math.abs(d3.max(nested['$' + key].map(d => d[COL_VALUE])) - d3.mean(nested['$' + key].map(d => d[COL_VALUE]))),Math.abs(d3.min(nested['$' + key].map(d => d[COL_VALUE])) - d3.mean(nested['$' + key].map(d => d[COL_VALUE])))),
                // hasOutlier: false,
                hasOutlier: hasOutlier,
                outlierType: outlierType,
                outlierCount: outlierCount
            };
        });
        return nested;
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
    monthIndexToYear: function (month) {
        let nestedByMonthIndex = d3.nest().key(d => d[COL_MONTH_INDEX]).sortKeys(d3.ascending).map(this.data);
        let year = nestedByMonthIndex["$" + month][0][COL_SAMPLE_DATE].getFullYear();
        return year;
    },
    filterOutByMeasures: function (measures) {
        this.data = this.data.filter(d => !(measures.indexOf(d[COL_MEASURE]) >= 0));
    },
    markExtremelyHighvalues: function(value){
        this.data = this.data.map(d=>{
           if(d[COL_VALUE] >= value){
               d[COL_IS_OUTLIER] = true;
               d['outlierType'] = 'upper';
           }else {
               d[COL_IS_OUTLIER] = false;
           }
           return d;
        });
    },
    filterExtremelyHighvalues: function(value){
        this.data = this.data.filter(d=>d[COL_VALUE] < value);
    },
    getChemWithFewMeasures: function (n) {
        let nestedByMeasures = this.getNestedByMeasure();
        let keys = nestedByMeasures.keys();
        let chemWithFewMeasures = [];
        keys.forEach(measure => {
            if (nestedByMeasures["$" + measure].length < n) {
                chemWithFewMeasures.push(measure);
            }
        });
        return chemWithFewMeasures;
    },
    markOutliers: function () {
        //Find all outliers for measure
        let normalBounds = this.getNestedByMeasure();
        let keys = normalBounds.keys();
        keys.forEach(key => {
            let bound = statistics.normalBound(normalBounds['$' + key].map(d => d[COL_VALUE]));
            normalBounds['$' + key].forEach(d => {
                if ((bound[0] != bound[1]) && (d[COL_VALUE] >= bound[1] || d[COL_VALUE] < bound[0])) {
                    d[COL_IS_OUTLIER] = true;
                    if (d[COL_VALUE] > bound[1]) {
                        d["outlierType"] = "upper";
                    }
                    if (d[COL_VALUE] < bound[0]) {
                        d["outlierType"] = "lower";
                    }
                } else {
                    d[COL_IS_OUTLIER] = false;
                }
            });
        });
        this.data = normalBounds.values().reduce((prev, cur) => prev.concat(cur));
    },
    getOverviewByMeasureMonth: function () {
        let scales = this.getNestedScalesWithOutliers();
        let nested = d3.nest().key(d => d[COL_MEASURE] + "_" + d[COL_MONTH_INDEX]).map(this.data);
        let results = {};
        let months = this.getMonthNumber();
        this.getAllMeasures().forEach(measure => {
            let measureData = [];
            let measureScale = scales["$" + measure];
            for (let i = 0; i < months; i++) {
                let data = nested["$" + measure + "_" + i];
                if (data && data.length > 0) {
                    measureData.push(d3.mean(data.map(d => measureScale(d[COL_VALUE]))));
                } else {
                    measureData.push(null);
                }
            }
            results['$' + measure] = measureData;
        });
        return results;
    },
    filterOutliers: function () {
        this.data = this.data.filter(d=>d[COL_IS_OUTLIER]===false);
    },
    getOverviewByLocationMonth: function () {
        let scales = this.getNestedScalesWithOutliers();
        let nested = d3.nest().key(d => d[COL_LOCATION] + "_" + d[COL_MONTH_INDEX]).map(this.data);
        let results = {};
        let months = this.getMonthNumber()
        this.getAllLocations().forEach(location => {
            let locationData = [];
            for (let i = 0; i < months; i++) {
                let data = nested["$" + location + "_" + i];
                if (data && data.length > 0) {
                    locationData.push(d3.mean(data.map(d => scales["$" + d[COL_MEASURE]](d[COL_VALUE]))));
                } else {
                    locationData.push(null);
                }
            }
            results['$' + location] = locationData;
        });
        return results;
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
        return this.getNestedByMeasureLocationMonthFromData(this.data);
    },
    getNestedScales: function () {
        //Scales by the average of the month.
        var scales = {};
        //Filter the outliers while calculating the range.
        let filteredData = this.data.filter(d => d[COL_IS_OUTLIER]===false);
        let averages = this.getNestedByMeasureLocationMonthFromData(filteredData);
        let measures = this.getAllMeasures();
        measures.forEach(measure => {
            //Get all averaged values for it.
            let averageValues = [];
            averages.keys().forEach(key => {
                if (key.indexOf(measure) >= 0) {
                    averageValues.push(averages['$' + key].average);
                }
            });
            scales["$" + measure] = d3.scaleLinear().domain(d3.extent(averageValues)).range([0, 1]);
        });
        return scales;
    },
    getNestedScalesWithOutliers: function () {
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
            scales["$" + measure] = d3.scaleLinear().domain(d3.extent(averageValues)).range([0, 1]);
        });
        return scales;
    },
    populateComboBox: function (columnName, populateComboBoxHandler) {
        let column = this.unpack(this.data, columnName);
        let uniqueValues = d3.set(column).values();
        uniqueValues.sort((a, b) => a.localeCompare(b));
        populateComboBoxHandler(uniqueValues);
    },
    plotLineGraph: function (location, measure, handler, color, group) {
        let dataForLocation = this.data.filter(d => d.location === location);
        let dataForMeasure = dataForLocation.filter(d => d.measure === measure);
        let dates = this.unpack(dataForMeasure, COL_SAMPLE_DATE);
        let values = this.unpack(dataForMeasure, COL_VALUE);
        handler(location, measure, dates, values, color, group);
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
