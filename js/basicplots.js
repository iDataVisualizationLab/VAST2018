let ALL = 'All';

function loadData() {
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings 2.csv", dataHandler);
}

$(document).ready(() => {
    loadData(dataHandler);
});

function dataHandler() {
    populateComBoBoxes();
}

function populateComBoBoxes() {
    populateLocations();
    populateMeasures();
}

function populateLocations() {
    myDataProcessor.populateComboBox("location", populateComboBoxHandler("locations"));
}

function populateMeasures() {
    myDataProcessor.populateComboBox("measure", populateComboBoxHandler("measures"));
}

function populateComboBoxHandler(selectId) {
    return function (options) {
        let select = document.getElementById(selectId);
        //Create an option for all
        options.unshift(ALL);
        options.forEach(opt => {
            let el = document.createElement("option");
            el.value = opt;
            el.textContent = opt;
            select.appendChild(el);
        });
    }
}

function plotLineGraph() {

    let location = $("#locations").val();
    let measure = $("#measures").val();
    var locations = [];
    var measures = [];
    if (location === ALL) {
        $("#locations option").each(function () {
            let location = this.value;
            if (location != ALL) {
                locations.push(location);
            }
        });
    } else {
        locations.push(location);
    }
    if (measure === ALL) {
        $("#measures option").each(function () {
            let measure = this.value;
            if (measure != ALL) {
                measures.push(measure);
            }
        });
    } else {
        measures.push(measure);
    }
    //TODO: change this to style or so.
    d3.select("#scatterDiv").style("height", 1200);
    Plotly.purge("scatterDiv");
    locations.forEach(location => {
        measures.forEach(measure => {
            myDataProcessor.plotLineGraph(location, measure, plotLineGraphHandler);
        });
    });
}

function plotLineGraphHandler(location, measure, x, y) {
    let data = [{
        x: x,
        y: y,
        name: location + "-" + measure,
        mode: 'lines+markers'
    }];
    Plotly.plot("scatterDiv", data);
}

function plotBoxPlots() {
    let location = $("#locations").val();
    let measure = $("#measures").val();
    var locations = [];
    var measures = [];
    if (location === ALL) {
        $("#locations option").each(function () {
            let location = this.value;
            if (location != ALL) {
                locations.push(location);
            }
        });
    } else {
        locations.push(location);
    }
    if (measure === ALL) {
        $("#measures option").each(function () {
            let measure = this.value;
            if (measure != ALL) {
                measures.push(measure);
            }
        });
    } else {
        measures.push(measure);
    }
    //Sort the locations and measures.
    locations.sort((a, b) => a.localeCompare(b));
    measures.sort((a, b) => a.localeCompare(b));
    myDataProcessor.plotBoxPlots(locations, measures, plotBoxPlotHandler);
}

function plotBoxPlotHandler(columns, yValues) {
    let boxNumber = columns.length;
    let boxColor = [];
    let allColors = d3.range(0, 360, 360 / boxNumber);
    let data = [];
    //Colors
    for (var i = 0; i < boxNumber; i++) {
        let result = "hsl(" + allColors[i] + ",50%,50%)";
        boxColor.push(result);
    }
    //Create traces
    for (var i = 0; i < boxNumber; i++) {
        var result = {
            y: yValues[i],
            type: 'box',
            marker: {
                color: boxColor[i]
            },
            name: columns[i]
        };
        data.push(result);
    }
    var layout = {
        xasis: {
            showgrid: false,
            zeroline: false,
            tickangle: 60,
            showticklabels: false
        },
        yaxis: {
            zeroline: false,
            gridcolor: 'white'
        },
        paper_bgcolor: 'rgb(233, 233, 233)',
        plot_bgcolor: 'rgb(233, 233, 233)',
        showlegend: false
    };
    Plotly.newPlot('scatterDiv', data, layout);
}

function drawParallelCoordinates() {
    myDataProcessor.drawParallelCoordinates(drawParallelCoordinateHandler);
}

function drawParallelCoordinateHandler(data) {
    let layout = {
        height: 1600
    }
    Plotly.plot('parallelCoordinatesDiv', data, layout);
}