function loadData() {
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings 2.csv", dataHandler);
}
$(document).ready(() => {
    loadData(dataHandler);
});

function dataHandler() {
    plotDiscreteHeatMap();
}

function plotDiscreteHeatMap() {
    let locationData = [
        {name: "Kohsoom", stream: 1},
        {name: "Boonsri", stream: 1},
        {name: "Chai", stream: 1},
        {name: "Kannika", stream: 1},
        {name: "Busarakhan", stream: 1},
        {name: "Achara", stream: 2},
        {name: "Somchair", stream: 2},
        {name: "Sakda", stream: 2},
        {name: "Tansanee", stream: 3},
        {name: "Decha", stream: 4}];
    plotData.locations = locationData.map(d => d.name);
    plotData.measures = myDataProcessor.getAllMeasures();

    //By default group by location
    plotLayout.groupByLocation = true;
    plotData.groups = plotData.locations;

    //Test ordering the measures
    plotData.measures.sort((a, b) => a.localeCompare(b));
    plotData.months = d3.range(0, myDataProcessor.getMonthNumber(), 1);
    plotData.data = myDataProcessor.getNestedByMeasureLocationMonth();
    plotData.scales = myDataProcessor.getNestedScales();
    discreteHeatMapPlotter.plot("discreteHeatMapDiv");
    $("#groupSelect").attr("disabled", false);
}

function changeOrder() {
    let group = $("#groupSelect").val();
    $("#groupSelect").attr("disabled", true);
    if(group==='location'){
        plotLayout.groupByLocation = true;
        plotData.groups = plotData.locations;
    }
    if(group==='measure'){
        plotLayout.groupByLocation = false;
        plotData.groups = plotData.measures;
    }
    discreteHeatMapPlotter.calculatePositions();
    discreteHeatMapPlotter.setPositions();
    discreteHeatMapPlotter.generateGroupLabels();
    $("#groupSelect").attr("disabled", false);
}