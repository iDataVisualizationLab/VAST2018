const linePlotDiv = "linePlotDiv";
const mapDiv = "mapDiv";
let plotData = {
    measures: [],
    locations: [],
    months: [],
    scales: null,
    data: [],
    groups: [],
    streamInformation: []
};
let plotLayout = {
    boxWidth: 6,
    boxHeight: 6,
    separatorHeight: 1,
    outlierRadius: 1,
    outlierStrokeWidth: 2,
    measureLabelWidth: 150,
    title: null,
    colorScales: d3.scaleLinear().domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
        .range(["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"]),
    groupByLocation: true,
    timeLabelHeight: 20
};
let allCells = {};
let allRows = {};
let allRowLocations = {};
let allColors = {};
let discreteHeatMapPlotter = {
    graph: null,
    svg: null,
    graphWidth: null,
    graphHeight: null,
    graphLabels: null,
    arcs: null,
    clonedGroup: null,
    plot: function (theDivId) {
        let numberOfMeasures = plotData.measures.length;
        let numberOfLocations = plotData.locations.length;
        let graphWidth = plotData.months.length * plotLayout.boxWidth;
        this.graphWidth = graphWidth;
        let graphHeight = numberOfMeasures * numberOfLocations * plotLayout.boxHeight + plotLayout.separatorHeight * plotData.groups.length;
        this.graphHeight = graphHeight;
        let svgWidth = graphWidth + plotLayout.measureLabelWidth;
        let svgHeight = graphHeight + plotLayout.timeLabelHeight;

        //Process the graph
        let graphDiv = d3.select("#" + theDivId);
        graphDiv.selectAll("*").remove();
        let svg = graphDiv.append("svg").attr("width", svgWidth).attr("height", svgHeight);
        this.svg = svg;
        this.clonedGroup = d3.select("body").append("svg").attr("id", "clonedGroup").attr("overflow", "visible").append("g");
        let graphWrapper = svg.append("g").attr("class", "graphWrapper").attr("transform", "translate(0, " + plotLayout.timeLabelHeight + ")");
        let graph = graphWrapper.append("g").attr("class", "graph");
        this.graph = graph;
        var div = setupToolTip();
        generateTimeLabels();
        //Generate cells
        generateCells();
        this.calculateRowPositions();
        this.setRowPositions();
        calculateColors();
        setColors();
        this.generateGroupLabels();
        this.generateArcs();
        d3.select("#" + linePlotDiv).style("left", (graphWidth + plotLayout.measureLabelWidth + 10) + "px").style("top", (this.svg.node().getBoundingClientRect().y + plotLayout.timeLabelHeight) + "px").style("width", "600px").style("height", "300px");
        d3.select("#" + mapDiv).style("left", (graphWidth + plotLayout.measureLabelWidth + 10) + "px").style("top", (this.svg.node().getBoundingClientRect().y + plotLayout.timeLabelHeight + 320) + "px").style("width", "600px").style("height", "600px");

        function calculateColors() {
            plotData.measures.forEach(measure => {
                let measureScale = plotData.scales["$" + measure];
                plotData.locations.forEach(location => {
                    plotData.months.forEach(month => {
                        let key = measure + "_" + location + "_" + month;
                        let cell = allCells['$' + key];
                        if (cell) {
                            let d = cell.datum();
                            if (d.hasOutlier === false) {
                                allColors['$' + key] = {
                                    fill: plotLayout.colorScales(measureScale(d.average))
                                };
                            } else {
                                let strokeColor = null;
                                let fillColor = null;
                                if (d.outlierType.indexOf("lower") >= 0) {
                                    fillColor = 'white';
                                    strokeColor = 'green';//1 for green
                                }
                                if (d.outlierType.indexOf("upper") >= 0) {
                                    fillColor = 'white';
                                    strokeColor = 'black';
                                }
                                if (d.outlierType.indexOf("lower") >= 0 && d.outlierType.indexOf("upper") >= 0) {
                                    fillColor = 'green';
                                    strokeColor = 'black';
                                }
                                allColors['$' + key] = {
                                    fill: fillColor,
                                    stroke: strokeColor
                                };
                            }
                        }
                    });
                });
            });
        }

        function setColors() {
            let keys = d3.keys(allCells);
            keys.forEach(key => {
                let cell = allCells[key];
                let color = allColors[key];
                cell.attr("fill", color.fill);
                if (color.stroke) {
                    cell.attr("stroke", color.stroke);
                }
            });
        }

        function onClickShow(d) {
            div
                .style("opacity", .9);
            let msg = d.data[0][COL_MEASURE] + ' at ' + d.data[0][COL_LOCATION];
            d.data.forEach(row => {
                msg += "<br/>" + d3.timeFormat('%Y-%m-%d')(row[COL_SAMPLE_DATE]) + ":" + row[COL_VALUE];
            });

            div.html(msg)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");

        }

        function onClickHide(d) {
            if (d3.event.target.classList[0] !== 'cell') {
                div.style("opacity", 0);
            }
        }

        function generateCells() {
            let strokeWidthRange = [0.1, plotLayout.boxHeight / 4];
            let measureCountDomain = [1, 37];//Calculated from the data=>then fix this to improve performance.
            let strokeScale = d3.scaleLinear().domain(measureCountDomain).range(strokeWidthRange);

            plotData.measures.forEach(measure => {
                plotData.locations.forEach(location => {
                    let rowKey = measure + "_" + location;
                    let row = graph.append("g");
                    plotData.months.forEach(month => {
                        let key = measure + "_" + location + "_" + month;
                        let curr = plotData.data['$' + key];
                        if (curr) {
                            if (curr.hasOutlier === false) {
                                let strokeWidth = strokeScale(curr.data.length);
                                let w = plotLayout.boxWidth - strokeWidth;
                                let h = plotLayout.boxHeight - strokeWidth;
                                //Need to +strokeWidth/2 because the position is counted at the middle of the stroke
                                allCells['$' + key] = row.append("rect").attr("x", month * plotLayout.boxWidth + strokeWidth / 2).attr("y", 0 + strokeWidth / 2).attr("width", w).attr("height", h).attr("fill", "steelblue")
                                    .attr("stroke-width", strokeWidth).attr("stroke", "black").attr("stroke-opacity", 0.8)
                                    .datum(curr)
                                    .attr("class", "cell")
                            } else {
                                let strokeWidth = strokeScale(curr.outlierCount);
                                let r = (plotLayout.boxHeight - strokeWidth) / 2;
                                allCells['$' + key] = row.append("circle").attr("cx", month * plotLayout.boxWidth + plotLayout.boxWidth / 2).attr("cy", plotLayout.boxHeight / 2).attr("r", r).attr("stroke-width", strokeWidth).attr("class", "cell").attr("fill", "steelblue").attr("opacity", 0)
                                    .datum(curr);
                            }
                            allCells['$' + key].on("click", onClickShow);
                        }
                    });
                    row.call(d3.drag()
                        .on("start", rowDragStarted)
                        .on("drag", rowDragged)
                        .on("end", rowDragEnded)
                        .subject(this.clonedGroup)
                    );
                    allRows['$' + rowKey] = row;
                });
            });
        }

        function generateTimeLabels() {
            var timeSvg = d3.select("#mapHeaderSVG");
            timeSvg.attr("width", plotData.months.length * plotLayout.boxWidth + plotLayout.measureLabelWidth);
            timeSvg.attr("height", plotLayout.timeLabelHeight);
            let firstYear = myDataProcessor.monthIndexToYear(0);
            plotData.months.forEach(month => {
                let year = myDataProcessor.monthIndexToYear(month);
                timeSvg.append("text").text(year).attr("transform", "translate(" + ((year - firstYear) * 12 * plotLayout.boxWidth) + ", " + (plotLayout.timeLabelHeight / 2) + ")")
                    .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font: 8px sans-serif");
            });
        }

        function setupToolTip() {
            var div = d3.select("div.tooltip");
            if (div.node() == null) {
                div = d3.select("body").append("div")
                    .attr("class", "tooltip")
                    .style("opacity", 0);
            }
            d3.select("body").on("click", onClickHide);
            return div;
        }
    },
    calculateRowPositions: function () {
        //Default outers and inners
        let outers = plotData.locations;
        let inners = plotData.measures;
        if (plotLayout.groupByLocation === false) {
            outers = plotData.measures;
            inners = plotData.locations;
        }
        let innerNumber = inners.length;
        outers.forEach((outer, outerI) => {
            inners.forEach((inner, innerI) => {
                let measure = plotLayout.groupByLocation ? inner : outer;
                let location = plotLayout.groupByLocation ? outer : inner;
                let rowKey = measure + "_" + location;
                allRowLocations['$' + rowKey] = {
                    y: ((outerI * innerNumber + innerI) * plotLayout.boxHeight + (outerI + 1) * plotLayout.separatorHeight)
                }
            });
        });
    },
    setRowPositions: function () {
        let keys = d3.keys(allRows);
        keys.forEach(key => {
            setInterval(function () {
                allRows[key].transition().duration(1000).attr("transform", "translate(0, " + allRowLocations[key].y + ")");
                allRows[key].attr("initial-x", 0);
                allRows[key].attr("initial-y", allRowLocations[key].y);
            });
        });
    },
    generateGroupLabels: function () {
        if (!this.graphLabels) {
            this.graphLabels = this.graph.append("g");
        }
        this.graphLabels.selectAll("*").remove();
        let numberOfLocations = plotData.locations.length;
        let numberOfMeasures = plotData.measures.length;
        let boxHeight = plotLayout.boxHeight;
        let measureLabelWidth = plotLayout.measureLabelWidth;
        let graphWidth = this.graphWidth;
        let numberOfElementsInGroup = numberOfLocations * numberOfMeasures / plotData.groups.length;
        let labelHeight = numberOfElementsInGroup * boxHeight + plotLayout.separatorHeight;
        plotData.groups.forEach((group, i) => {
            this.graphLabels.append("text").datum({
                key: group,
                value: {x: graphWidth, y: i * labelHeight + labelHeight / 2}
            }).attr("x", 0).attr("y", (labelHeight / 2)).text(group).attr("text-anchor", "start").attr("alignment-baseline", "middle")
                .attr("transform", "translate(" + graphWidth + ", " + i * labelHeight + ")").attr("fill", "black").attr("style", "font: 10px sans-serif");

            this.graphLabels.append("rect").attr("x", 0).attr("y", i * labelHeight).attr("width", graphWidth + measureLabelWidth).attr("height", plotLayout.separatorHeight).attr("class", "separatorRect").attr("stroke-width", 0);
        });
        //Recalculate the svg height based on new number of groups
        let graphHeight = numberOfMeasures * numberOfLocations * boxHeight + plotLayout.separatorHeight * plotData.groups.length;
        this.graphHeight = graphHeight;
        let svgHeight = graphHeight + plotLayout.timeLabelHeight;
        this.svg.attr("height", svgHeight);
    },

    /**
     * toggleOutlier
     * @param {boolean}  value   true will display the outlier, false will not
     */
    toggleOutlier: function (value) {
        if (value === true) {
            this.graph.selectAll("circle").attr("opacity", 1e-6).transition().duration(1000).attr("opacity", 1.0);
        } else {
            this.graph.selectAll("circle").attr("opacity", 1.0).transition().duration(1000).attr("opacity", 1e-6);
        }
    },
    generateArcs: function () {
        if (!this.arcs) {
            this.arcs = this.graph.append("g");
        }
        this.arcs.selectAll("*").remove();
        let locationPositions = this.graphLabels.selectAll("text").data();
        let streamInformation = plotData.streamInformation;
        let maxRadius = 0;
        let minRadius = 0;
        streamInformation.forEach(streamLocation => {
            let source = streamLocation.source;
            let destination = streamLocation.destination;
            let startPoint = locationPositions.filter(d => d.key === source)[0].value;
            let endPoint = locationPositions.filter(d => d.key === destination)[0].value;
            let radius = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2)) / 2;
            if (radius > maxRadius) maxRadius = radius;
            if (radius < minRadius) minRadius = radius;
        });
        let xRadiusScale = d3.scaleLinear().domain([minRadius, maxRadius]).range([plotLayout.measureLabelWidth + 8, 2 * plotLayout.measureLabelWidth - 8])
        streamInformation.forEach(streamLocation => {
            let source = streamLocation.source;
            let destination = streamLocation.destination;
            let startPoint = locationPositions.filter(d => d.key === source)[0].value;
            let endPoint = locationPositions.filter(d => d.key === destination)[0].value;
            let radius = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2)) / 2;
            let xRadius = xRadiusScale(radius);
            this.generateArc(this.arcs, source + destination, startPoint, endPoint);
        });
        //Adjust the graph width.
        let svgWidth = this.graphWidth + Math.max(plotLayout.measureLabelWidth, maxRadius + 8);//8 is for the arrow
        this.svg.attr("width", svgWidth);
    },
    /**
     * generateArc
     * @param {svg element} container The container that you will attach this arc
     * @param {string}  id  ID of the arc to create
     * @param {object{x, y}}  startPoint    The start point of the arc
     * @param {object{x, y}}  endPoint  The end point of the arc
     * @return {g}  g   group element which contains this arc
     */
    generateArc: function (container, id, startPoint, endPoint, xRadius) {
        let swap = false;
        if (startPoint.y > endPoint.y) {
            let temp = startPoint;
            startPoint = endPoint;
            endPoint = temp;
            swap = true;
        }
        let radius = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2)) / 2;
        let arcStr = "M" + startPoint.x + " " + startPoint.y + " A" + (xRadius ? xRadius : radius) + " " + (radius) +
            ", 0, 0, 1, " + endPoint.x + " " + endPoint.y;
        let g = container.append("g");
        g.append("path")
            .attr("id", id)
            .attr("d", arcStr)
            .attr("fill", "none")
            .attr("stroke", 'black')
            .attr("stroke-width", 0.3)
            .attr("opacity", 0.6);
        g.append("text")
            .append("textPath")
            .attr("dominant-baseline", "central")
            .attr("xlink:href", "#" + id).attr("startOffset", "50%").attr("font-size", 6)
            .attr("font-weight", "bold")
            .text(swap ? "<" : ">");
        return g;
    },
    removeArcs: function () {
        this.arcs.selectAll("*").remove();
    },
    plotLineGraph: function (location, measure) {
        myDataProcessor.plotLineGraph(location, measure, this.plotLineGraphHandler);
    },
    plotLineGraphHandler: function (location, measure, x, y) {
        let data = [{
            x: x,
            y: y,
            name: location + "-" + measure,
            mode: 'lines+markers'
        }];
        var layout = {
            title: "Line graph view",
            xaxis: {
                title: "Time"
            },
            yaxis: {
                title: "Measure"
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                family: "Georgia,Times,serif",
                size: 8
            },
            margin: {
                l: 50,
                r: 150,
                t: 70,
                b: 50,
                pad: 0,
                autoexpand: false
            }
        }
        Plotly.plot(linePlotDiv, data, layout);
    },
    //Used this to get the data then remove it to improve performance.
    getMaxMeasureCount: function () {
        let maxCount = 1;
        plotData.data.keys().forEach(key => {
            let measureCount = plotData.data["$" + key].data.length;
            if (maxCount < measureCount) maxCount = measureCount;
        });
        return maxCount;
    },
    setHeight: function (newBoxHeight) {
        plotLayout.boxHeight = newBoxHeight;
        let strokeWidthRange = [0.1, plotLayout.boxHeight / 4];
        let measureCountDomain = [1, 37];//Calculated from the data=>then fix this to improve performance.
        let strokeScale = d3.scaleLinear().domain(measureCountDomain).range(strokeWidthRange);
        //Now set all the cells to lower height
        plotData.measures.forEach(measure => {
            plotData.locations.forEach(location => {
                plotData.months.forEach(month => {
                    let key = measure + "_" + location + "_" + month;
                    let cell = allCells["$" + key];
                    if (cell) {
                        let curr = cell.datum();
                        if (curr.hasOutlier === false) {
                            let strokeWidth = strokeScale(curr.data.length);
                            let w = plotLayout.boxWidth - strokeWidth;
                            let h = plotLayout.boxHeight - strokeWidth;
                            //Need to +strokeWidth/2 because the position is counted at the middle of the stroke
                            cell.attr("x", month * plotLayout.boxWidth + strokeWidth / 2).attr("y", 0 + strokeWidth / 2).attr("width", w).attr("height", h)
                                .attr("stroke-width", strokeWidth);
                        } else {
                            let strokeWidth = strokeScale(curr.outlierCount);
                            let r = (plotLayout.boxHeight - strokeWidth) / 2;
                            cell.attr("cx", month * plotLayout.boxWidth + plotLayout.boxWidth / 2).attr("cy", plotLayout.boxHeight / 2).attr("r", r).attr("stroke-width", strokeWidth);
                        }
                    }
                });
            });
        });
        this.calculateRowPositions();
        this.setRowPositions();
        this.generateGroupLabels();
        this.generateArcs();
    }
}
let draggedLocation = null;
let draggedMeasure = null;

function rowDragStarted() {
    let obj = d3.select(this);
    //Get the data
    let aCell = obj.select("rect") ? obj.select("rect") : obj.select("circle");
    draggedLocation = aCell.datum().data[0].location;
    draggedMeasure = aCell.datum().data[0].measure;

    cloneSelection(obj);
    discreteHeatMapPlotter.clonedGroup
        .style("display", "none") //Display "none" is to prevent it from hiding the underlining element that we can't click.
        .attr("transform", "translate(" + (d3.event.sourceEvent.clientX) + "," + d3.event.sourceEvent.clientY + ")");
}

function cloneSelection(selection) {
    let cloned = selection.html();
    discreteHeatMapPlotter.clonedGroup.html(cloned);
    return cloned;
}

function rowDragged() {
    discreteHeatMapPlotter.clonedGroup.style("display", "block").attr("opacity", 1.0).attr("transform", "translate(" + (d3.event.sourceEvent.clientX) + "," + d3.event.sourceEvent.clientY + ")");
}

function rowDragEnded() {
    let linePlotDivBox = d3.select("#" + linePlotDiv).node().getBoundingClientRect();
    let x = linePlotDivBox.x;
    let y = linePlotDivBox.y;
    let width = linePlotDivBox.width;
    let height = linePlotDivBox.height;
    let mouseX = d3.event.sourceEvent.clientX;
    let mouseY = d3.event.sourceEvent.clientY;
    if (mouseX > x && mouseX < x + width && mouseY > y && mouseY < y + height) {
        if (draggedLocation && draggedMeasure) {
            discreteHeatMapPlotter.plotLineGraph(draggedLocation, draggedMeasure);
        }
    }
    discreteHeatMapPlotter.clonedGroup.selectAll("*").attr("opacity", 1.0).transition().duration(1000).attr("opacity", 1e-6).remove();
    draggedLocation = null;
    draggedMeasure = null;
    //If we haven't got the clear button, add it.
    if (d3.select("#clearBtn").empty()) {
        addClearButton();
    }
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

function addClearButton() {
    let htmlString = '<a id="clearBtn" rel="tooltip" class="modebar-btn" data-title="Clear" data-toggle="false" data-gravity="n"><svg width="20" height="20" xmlns="http://www.w3.org/2000/svg">\n' +
        ' <g>\n' +
        '  <title>Layer 1</title>\n' +
        '  <path stroke-width="0" id="svg_2" d="m3.776302,16.901317c0,1.1 0.9,2 2,2l8,0c1.1,0 2,-0.9 2,-2l0,-12l-12,0l0,12zm2.46,-7.12l1.41,-1.41l2.13,2.12l2.12,-2.12l1.41,1.41l-2.12,2.12l2.12,2.12l-1.41,1.41l-2.12,-2.12l-2.12,2.12l-1.41,-1.41l2.12,-2.12l-2.13,-2.12zm7.04,-7.88l-1,-1l-5,0l-1,1l-3.5,0l0,2l14,0l0,-2l-3.5,0z"/>\n' +
        ' </g>\n' +
        '</svg></a>';
    let theElm = createElementFromHTML(htmlString);
    theElm.addEventListener('click', clearChart, false);
    let downloadBtn = d3.select('[data-title="Download plot as a png"]');
    if (!downloadBtn.empty()) {
        downloadBtn.node().parentNode.insertBefore(theElm, d3.select('[data-title="Download plot as a png"]').node());
    }
}

function clearChart() {
    Plotly.purge(linePlotDiv);
}