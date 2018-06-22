let plotData = {
    measures: [],
    locations: [],
    months: [],
    scales: null,
    data: []
}
let plotLayout ={
    boxWidth: 5,
    boxHeight: 1,
    measureLabelWidth: 150,
    title: null,
    colorScales: d3.interpolateRdYlGn
}
let discreteHeatMapPlotter = {
    plot: function(theDivId){
        let boxWidth = plotLayout.boxWidth;
        let boxHeight = plotLayout.boxHeight;
        let numberOfMeasures = plotData.measures.length;
        let numberOfLocations = plotData.locations.length;
        let numberOfMonths = plotData.months.length;
        let measureLabelWidth = plotLayout.measureLabelWidth;
        let measureLabelHeight = numberOfLocations * boxHeight;
        let graphWidth = numberOfMonths*boxWidth;
        let graphHeight = numberOfMeasures*measureLabelHeight;
        let svgWidth = graphWidth+measureLabelWidth;
        let svgHeight = graphHeight;
        // Define the div for the tooltip
        var div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

        //Process the graph
        let graphDiv = d3.select("#"+theDivId);
        graphDiv.selectAll("*").remove();
        let svg = graphDiv.append("svg").attr("width", svgWidth).attr("height", svgHeight);
        let graph = svg.append("g").attr("class", "graph");
        let graphMeasures = graph.selectAll(".measure").data(plotData.measures).enter().append("g").attr("transform", (d, i) => "translate(0,"+(i*boxHeight*numberOfLocations)+")");
        graphMeasures.append("rect").attr("x", 0).attr("y", 0).attr("width", graphWidth+measureLabelWidth).attr("height", measureLabelHeight).attr("class","measureRect");

        let graphMeasureLocations = graphMeasures.selectAll(".location").data(measure=>plotData.locations.map(location=>measure+"_"+location)).enter().append("g").attr("transform", (d, i) => "translate(0,"+(i*boxHeight)+")");
        let graphCells = graphMeasureLocations.selectAll(".month").data(measure_location=>plotData.months.map(month=>measure_location+"_"+month)).enter().append("g").attr("transform", d=>"translate("+((+d.split("_")[2])*boxWidth) + ", 0)");
        let graphRecs = graphCells.selectAll(".rect").data(d=>plotData.data["$"+d]?[plotData.data["$"+d]]:[]).enter().append("rect").attr("x", 0).attr("y", 0).attr("width", boxWidth).attr("height", boxHeight)
            .attr("fill", d=>plotLayout.colorScales(plotData.scales["$"+d.data[0]["measure"]](d.average)));
        graphRecs.on("mouseover", function(d) {
                div.transition()
                    .style("opacity", .9);
                div	.html("Measure: " + d.data[0]["measure"] + "<br/>Location: " + d.data[0]["location"] +"<br/>Average: " + d.average + "<br/>" + "Date: " + utils.monthFormat(d.data[0]["sample date"]))
                    .style("left", (d3.event.pageX) + "px")
                    .style("top", (d3.event.pageY - 28) + "px");
            })
            .on("mouseout", function(d) {
                div.transition()
                    .style("opacity", 0);
            });
        let graphMeasureLabels = graph.selectAll(".measureLabel").data(plotData.measures).enter().append("g").attr("transform", (d, i) => "translate("+graphWidth+","+(i*boxHeight*numberOfLocations)+")").attr("class", "measureLabel");
        let graphMeasureLabelTexts = graphMeasureLabels.append("text").attr("x", 0).attr("y", (measureLabelHeight/2)).text(d=>d).attr("text-anchor", "start").attr("alignment-baseline", "middle");
        let graphMeasureLabelLines = graphMeasureLabels.append("line").attr("x1", 0).attr("y1", 0.5).attr("x2", measureLabelWidth).attr("y2", 0.5);

        var zoomHandler = d3.zoom()
            .on("zoom", zoomActions);

        zoomHandler(svg);


        function zoomActions() {
            graph.attr("transform", d3.event.transform);
        }
    }
}
