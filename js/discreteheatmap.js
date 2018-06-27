let plotData = {
    measures: [],
    locations: [],
    months: [],
    scales: null,
    data: []
}
let plotLayout = {
    boxWidth: 3,
    boxHeight: 2,
    measureLabelWidth: 150,
    title: null,
    colorScales: d3.interpolateRdYlGn
}
let discreteHeatMapPlotter = {
    plot: function (theDivId) {
        let boxWidth = plotLayout.boxWidth;
        let boxHeight = plotLayout.boxHeight;
        let numberOfMeasures = plotData.measures.length;
        let numberOfLocations = plotData.locations.length;
        let numberOfMonths = plotData.months.length;
        let measureLabelWidth = plotLayout.measureLabelWidth;
        let separatorHeight = 2;
        let measureLabelHeight = numberOfLocations * (boxHeight + separatorHeight);
        let timeLabelHeight = 20;
        let graphWidth = numberOfMonths * boxWidth;
        let graphHeight = numberOfMeasures * measureLabelHeight;
        let svgWidth = graphWidth + measureLabelWidth;
        let svgHeight = graphHeight + timeLabelHeight;

        // Define the div for the tooltip
        var div = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        //Process the graph
        let graphDiv = d3.select("#" + theDivId);
        graphDiv.selectAll("*").remove();
        let svg = graphDiv.append("svg").attr("width", svgWidth).attr("height", svgHeight);
        //Time label
        let firstYear = myDataProcessor.monthIndexToYear(0);
        plotData.months.forEach(month => {
            let year = myDataProcessor.monthIndexToYear(month);
            svg.append("text").text(year).attr("transform", "translate(" + ((year - firstYear) * 12 * boxWidth) + ", " + (timeLabelHeight / 2) + ")")
                .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font: 8px sans-serif");
        });
        let graphWrapper = svg.append("g").attr("class", "graphWrapper").attr("transform", "translate(0, " + timeLabelHeight + ")");
        let graph = graphWrapper.append("g").attr("class", "graph");
        //Now location first
        let labelHeight = numberOfMeasures * boxHeight;

        plotData.locations.forEach((location, li) => {
            //For the background
            graph.append("rect").attr("x", 0).attr("y", (li * (numberOfMeasures * boxHeight + separatorHeight))).attr("width", graphWidth + measureLabelWidth).attr("height", labelHeight).attr("class", "locationRect");
            plotData.measures.forEach((measure, mi) => {
                setInterval(function () {
                    plotData.months.forEach((month, ti) => {
                        let key = measure + "_" + location + "_" + month;
                        if (plotData.data['$' + key]) {
                            let curr = plotData.data['$' + measure + '_' + location + '_' + (month)];
                            if (curr.hasOutlier === false) {
                                graph.append("rect").attr("x", 0).attr("y", 0).attr("width", boxWidth).attr("height", boxHeight)
                                    .attr("transform", "translate(" + (ti * boxWidth) + "," + ((li * numberOfMeasures + mi) * boxHeight + li * separatorHeight) + ")")
                                    .attr("fill", plotLayout.colorScales(plotData.scales["$" + measure](plotData.data['$' + key].average)))
                                    .datum(curr)
                                    .on("mouseover", onMouseOver)
                                    .on("mouseout", onMouseOut);
                            } else {
                                let strokeColor = null;
                                let fillColor = null;
                                if (curr.outlierType.indexOf("lower") >= 0) {
                                    fillColor = 'white';
                                    strokeColor = plotLayout.colorScales(0);
                                }
                                if (curr.outlierType.indexOf("upper") >= 0) {
                                    fillColor = 'white';
                                    strokeColor = plotLayout.colorScales(1);
                                }
                                if (curr.outlierType.indexOf("lower") >= 0 && curr.outlierType.indexOf("upper") >= 0) {
                                    fillColor = plotLayout.colorScales(0);
                                    strokeColor = plotLayout.colorScales(1);
                                }
                                graph.append("circle").attr("x", 0).attr("y", 0).attr("r", 1)
                                    .attr("transform", "translate(" + (ti * boxWidth + boxWidth / 2) + "," + ((li * numberOfMeasures + mi) * boxHeight + li * separatorHeight + boxHeight / 2) + ")")
                                    .attr("stroke-width", 1)
                                    .style("stroke", strokeColor)
                                    .style("fill", fillColor)
                                    .datum(curr)
                                    .on("mouseover", onMouseOver)
                                    .on("mouseout", onMouseOut);
                            }
                        }
                    });
                }, 0);
            });
            graph.append("text").attr("x", 0).attr("y", (labelHeight / 2)).text(location).attr("text-anchor", "start").attr("alignment-baseline", "middle")
                .attr("transform", "translate(" + graphWidth + ", " + (li * numberOfMeasures * boxHeight + li * separatorHeight) + ")").attr("fill", "black").attr("style", "font: 10px sans-serif");
            graph.append("rect").attr("x", 0).attr("y", (li * (numberOfMeasures * boxHeight + separatorHeight))).attr("width", graphWidth + measureLabelWidth).attr("height", separatorHeight).attr("class", "separatorRect");
        });


        var zoomHandler = d3.zoom()
            .on("zoom", zoomActions);

        zoomHandler(svg);


        function zoomActions() {
            graph.attr("transform", d3.event.transform);
        }

        function onMouseOver(d) {
            div.transition()
                .style("opacity", .9);
            let msg = d.data[0]['measure'];
            d.data.forEach(row=>{
                msg += "<br/>" + d3.timeFormat('%Y-%m-%d')(row['sample date']) + ":" + row['value'];
            });

            div.html(msg)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
        }
        function onMouseOut(d) {
            div.transition().style("opacity", 0);
        }
    }
}
