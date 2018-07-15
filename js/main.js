function loadData() {
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings2005.csv", dataHandler);
}

$(document).ready(() => {
    d3.select("#loaderDiv").style("display", "block").style("opacity", 1.0);
    d3.select("#contentDiv").style("visibility", "hidden");
    loadData(dataHandler);
    d3.selectAll(".floatingBox").call(d3.drag().on("start", boxDragStarted).on("drag", boxDragged).on("end", boxDragEnded));
    $(document).keyup(function (e) {
        if (e.keyCode == 27) {
            discreteHeatMapPlotter.onClickHide();
        }
    });
});

function dataHandler() {
    plotDiscreteHeatMap();
    toggleLoader();
}

let rankedLocations = null;
let rankedMeasures = null;
let streamInformation = [
    {source: "Kannika", destination: "Chai", stream: 1},
    {source: "Kannika", destination: "Busarakhan", stream: 1},
    {source: "Kannika", destination: "Kohsoom", stream: 1},
    {source: "Kannika", destination: "Boonsri", stream: 1},
    {source: "Chai", destination: "Kohsoom", stream: 1},
    {source: "Chai", destination: "Boonsri", stream: 1},
    {source: "Sakda", destination: "Somchair", stream: 2},
    {source: "Sakda", destination: "Achara", stream: 2},
];
let downStreamLocationData = [
    {name: "Kannika", stream: 1},
    {name: "Chai", stream: 1},
    {name: "Busarakhan", stream: 1},
    {name: "Kohsoom", stream: 1},
    {name: "Boonsri", stream: 1},
    {name: "Sakda", stream: 2},
    {name: "Somchair", stream: 2},
    {name: "Achara", stream: 2},
    {name: "Tansanee", stream: 2},
    {name: "Decha", stream: 4}];
let streamAndDistanceLocationData = [
    {name: "Kohsoom", stream: 1},
    {name: "Boonsri", stream: 1},
    {name: "Busarakhan", stream: 1},
    {name: "Chai", stream: 1},
    {name: "Kannika", stream: 1},
    {name: "Achara", stream: 2},
    {name: "Somchair", stream: 2},
    {name: "Sakda", stream: 2},
    {name: "Tansanee", stream: 3},
    {name: "Decha", stream: 4}];

let mapLocations = [
    {name: "Dump.", stream: 0, x: 473, y: 76},
    {name: "Kohsoom", stream: 1, x: 477, y: 176},
    {name: "Boonsri", stream: 1, x: 330, y: 86},
    {name: "Busarakhan", stream: 1, x: 475, y: 245},
    {name: "Chai", stream: 1, x: 385, y: 290},
    {name: "Kannika", stream: 1, x: 420, y: 453},
    {name: "Achara", stream: 2, x: 246, y: 189},
    {name: "Somchair", stream: 2, x: 180, y: 275},
    {name: "Sakda", stream: 2, x: 330, y: 560},
    {name: "Tansanee", stream: 3, x: 182, y: 432},
    {name: "Decha", stream: 4, x: 46, y: 367}];
let mapSize = {width: 885, height: 885};

function plotDiscreteHeatMap() {
    plotData.streamInformation = streamInformation;
    plotData.locations = myDataProcessor.getAllLocations();
    plotData.mapLocations = mapLocations;
    plotData.mapSize = mapSize;
    //Order alphabeticall
    plotData.locations.sort((a, b) => a.localeCompare(b));
    plotData.measures = myDataProcessor.getAllMeasures();
    plotData.measures.sort((a, b) => a.localeCompare(b));
    //By default group by location
    plotLayout.groupByLocation = true;
    plotData.groups = plotData.locations;
    //Get the months
    plotData.months = d3.range(0, myDataProcessor.getMonthNumber(), 1);
    plotData.data = myDataProcessor.getNestedByMeasureLocationMonth();
    //Calculate the correlations
    calculateLocationCorrelations();
    rankedLocations = rankBySimilarity(locationSimilarities);
    calculateMeasureCorrelations();
    rankedMeasures = rankBySimilarity(measureSimilarities);

    plotData.scales = myDataProcessor.getNestedScales();
    discreteHeatMapPlotter.plot("discreteHeatMapDiv");

    enableSelections();
}

function changeGroupOrder() {
    let groupSelect = $("#groupSelect");
    let locationOrderSelect = $("#locationOrderSelect");
    let measureOrderSelect = $("#measureOrderSelect");
    let group = groupSelect.val();
    let measureOrder = measureOrderSelect.val();
    let locationOrder = locationOrderSelect.val();

    disableSelections();
    //Measure order
    if (measureOrder === "alphabetical") {
        plotData.measures.sort((a, b) => a.localeCompare(b));
    }
    if (measureOrder === "similarity") {
        plotData.measures = rankedMeasures.travel();
    }
    if(measureOrder === "samplingratio"){
        plotData.measures = plotData.measures.sort((a, b) => {
            return myDataProcessor.samplingRatio["$"+a].ratio - myDataProcessor.samplingRatio["$"+b].ratio;
        });
    }
    //Location order
    if (locationOrder === "alphabetical") {
        plotData.locations = plotData.locations.sort((a, b) => a.localeCompare(b));
    }
    if (locationOrder === "similarity") {
        plotData.locations = rankedLocations.travel();
    }
    if (locationOrder === "downstream") {
        plotData.locations = downStreamLocationData.map(d => d.name);
    }
    if (locationOrder === "streamanddistance") {
        plotData.locations = streamAndDistanceLocationData.map(d => d.name);
    }
    if(locationOrder === "samplingratio"){
        plotData.locations = plotData.locations.sort((a, b) => {
            return myDataProcessor.samplingRatio["$"+a].ratio - myDataProcessor.samplingRatio["$"+b].ratio;
        });
    }
    //Group order
    if (group === 'location') {
        plotLayout.groupByLocation = true;
        plotData.groups = plotData.locations;
    }
    if (group === 'measure') {
        plotLayout.groupByLocation = false;
        plotData.groups = plotData.measures;
    }


    discreteHeatMapPlotter.calculateRowPositions();
    discreteHeatMapPlotter.setRowPositions();
    discreteHeatMapPlotter.setDataOverviewsPostionsAndVisibility();
    discreteHeatMapPlotter.generateGroupLabels();
    // if(group==='location'){
    //     discreteHeatMapPlotter.generateArcs();
    // }else{
    //     discreteHeatMapPlotter.removeArcs();
    // }
    enableSelections();
}

/**
 * toggleSelections used to toggle the selections
 * @param {bool}    value   true to disable all selections, false to enable
 */
function toggleSelections(value) {
    $("#groupSelect").attr("disabled", value);
    $("#locationOrderSelect").attr("disabled", value);
    $("#measureOrderSelect").attr("disabled", value);
    $("#outlierCheckbox").attr("disabled", value);
    $("#lensingCheckbox").attr("disabled", value);
}

function disableSelections() {
    toggleSelections(true);
}

function enableSelections() {
    toggleSelections(false);
}

function toggleOutlier() {
    let option = $("#outlierCheckbox").is(":checked");
    discreteHeatMapPlotter.toggleOutlier(option);
}

function toggleLensing() {
    let option = $("#lensingCheckbox").is(":checked");
    if (option) {
        discreteHeatMapPlotter.setFishEye();
    } else {
        discreteHeatMapPlotter.disableFishEye();
    }
}

let xOffset = 0;
let yOffset = 0;

function boxDragStarted() {
    let obj = d3.select(this);
    xOffset = d3.event.x - obj.node().getBoundingClientRect().x;
    yOffset = d3.event.y - obj.node().getBoundingClientRect().y;

}

function boxDragged() {
    d3.event.sourceEvent.stopPropagation();
    let obj = d3.select(this);
    let xCoord = d3.event.x - xOffset;
    let yCoord = d3.event.y - yOffset;
    obj.style("left", xCoord + "px");
    obj.style("top", yCoord + "px");

}

function boxDragEnded() {
    d3.event.sourceEvent.stopPropagation();
}

function changeHeight() {
    d3.select("#loaderDiv").style("display", "block").style("opacity", 1.0);
    d3.select("#contentDiv").style("visibility", "hidden");
    discreteHeatMapPlotter.setHeight($("#boxHeightSlider").val());
    d3.select("#loaderDiv").style("opacity", 1.0).transition().duration(1000).style("opacity", 0).style("display", "none");
    d3.select("#contentDiv").style("visibility", "visible").style("opacity", 1e-6).transition().duration(5000).style("opacity", 1.0);
}

function toggleLoader() {
    let value = +d3.select("#loaderDiv").style("opacity");
    if (value === 0) {
        d3.select("#loaderDiv").style("display", "block").style("opacity", 1.0);
        d3.select("#contentDiv").style("visibility", "hidden");
    } else {
        d3.select("#loaderDiv").style("opacity", 1.0).transition().duration(1000).style("opacity", 0).style("display", "none");
        d3.select("#contentDiv").style("visibility", "visible").style("opacity", 1e-6).transition().duration(5000).style("opacity", 1.0);
    }
}

function openFloatingBox(theButton, theBox) {
    $("#" + theBox).animate({
        opacity: '1.0',
        display: 'block',
        'z-index': 9
    });
    $("#" + theButton).fadeTo(1000, 0);
}

function closeFloatingBox(theButton, theBox) {
    $("#" + theBox).animate({
        opacity: '0.0',
        display: 'none',
        'z-index': 0
    });
    if(theButton){
        $("#" + theButton).fadeTo(1000, 1.0);
    }
}