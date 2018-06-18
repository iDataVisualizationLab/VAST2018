function loadData(){
    myDataProcessor.readData("mc2/Boonsong Lekagul waterways readings.csv");
}
$(document).ready(()=>{
    loadData();
});
function populateComBoBoxes(){
    populateLocations();
    populateMeasures();
}
function populateLocations(){
    myDataProcessor.populateComboBox("location", populateComboBoxHandler("locations"));
}
function populateMeasures(){
    myDataProcessor.populateComboBox("measure", populateComboBoxHandler("measures"));
}
function populateComboBoxHandler(selectId){
    return function(options){
        let select = document.getElementById(selectId);
        options.forEach(opt=>{
           let el = document.createElement("option");
           el.value = opt;
           el.textContent = opt;
           select.appendChild(el);
        });
    }
}
function plotLineGraph(){
    let location = $("#locations").val();
    let measure = $("#measures").val();
    myDataProcessor.plotLineGraph(location, measure, plotLineGraphHandler);
}
function plotLineGraphHandler(location, measure, x, y){
    let data = [{
        x: x,
        y: y,
        name: location + "-" + measure
    }];
    Plotly.plot("scatterDiv", data);
    if(x.length==0 || y.length == 0){
        alert("No data to plot");
    }
}
function drawParallelCoordinates(){
    myDataProcessor.drawParallelCoordinates(drawParallelCoordinateHandler);
}
function drawParallelCoordinateHandler(data){
    let layout = {
        height: 1600
    }
    Plotly.plot('parallelCoordinatesDiv', data, layout);
}