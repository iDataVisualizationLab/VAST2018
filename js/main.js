function loadData() {
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings.csv", dataHandler);
}
$(document).ready(() => {
    loadData(dataHandler);
    d3.select("#linePlotDiv").call(d3.drag().on("start",linePlotDragStarted).on("drag", linePlotDragged).on("end", linePlotDragEnded));
});

function dataHandler() {
    plotDiscreteHeatMap();
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
function plotDiscreteHeatMap() {
    plotData.streamInformation = streamInformation;
    plotData.locations = myDataProcessor.getAllLocations();
    //Order alphabeticall
    plotData.locations.sort((a, b)=> a.localeCompare(b));
    plotData.measures = myDataProcessor.getAllMeasures();
    plotData.measures.sort((a, b)=> a.localeCompare(b));
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
    if(measureOrder === "alphabetical"){
        plotData.measures.sort((a, b)=>a.localeCompare(b));
    }
    if(measureOrder === "similarity"){
        plotData.measures = rankedMeasures.travel();
    }
    if(locationOrder === "alphabetical"){
        plotData.locations = plotData.locations.sort((a, b)=> a.localeCompare(b));
    }
    if(locationOrder==="similarity"){
        plotData.locations = rankedLocations.travel();
    }
    if(locationOrder==="downstream"){
        plotData.locations = downStreamLocationData.map(d=>d.name);
    }
    if(locationOrder==="streamanddistance"){
        plotData.locations = streamAndDistanceLocationData.map(d=>d.name);
    }
    if(group==='location'){
        plotLayout.groupByLocation = true;
        plotData.groups = plotData.locations;
    }
    if(group==='measure'){
        plotLayout.groupByLocation = false;
        plotData.groups = plotData.measures;
    }
    discreteHeatMapPlotter.calculateRowPositions();
    discreteHeatMapPlotter.setRowPositions();
    discreteHeatMapPlotter.generateGroupLabels();
    if(group==='location'){
        discreteHeatMapPlotter.generateArcs();
    }else{
        discreteHeatMapPlotter.removeArcs();
    }
    enableSelections();
}

/**
 * toggleSelections used to toggle the selections
 * @param {bool}    value   true to disable all selections, false to enable
 */
function toggleSelections(value){
    $("#groupSelect").attr("disabled", value);
    $("#locationOrderSelect").attr("disabled", value);
    $("#measureOrderSelect").attr("disabled", value);
    $("#outlierCheckbox").attr("disabled", value);
}
function disableSelections(){
    toggleSelections(true);
}
function enableSelections(){
    toggleSelections(false);
}
function toggleOutlier(){
    let displayOutlier = $("#outlierCheckbox").is(":checked");
    discreteHeatMapPlotter.toggleOutlier(displayOutlier);
}
let xOffset = 0;
let yOffset = 0;

function linePlotDragStarted() {
    let obj = d3.select(this);
    xOffset = d3.event.x - obj.node().getBoundingClientRect().x;
    yOffset = d3.event.y - obj.node().getBoundingClientRect().y;
}

function linePlotDragged() {
    let obj = d3.select(this);
    let xCoord = d3.event.x - xOffset;
    let yCoord = d3.event.y - yOffset;
    obj.style("left", xCoord + "px");
    obj.style("top", yCoord + "px");
}

function linePlotDragEnded() {
}
