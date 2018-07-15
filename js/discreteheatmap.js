const linePlotDiv = "linePlotDiv";
const linePlotContainer = "linePlotContainer";
const mapDivContainer = "mapDivContainer";
const controlPanelContainer = "controlPanelContainer";
const transitionDuration = 500;
let plotData = {
    measures: [],
    locations: [],
    months: [],
    scales: null,
    data: [],
    groups: [],
    streamInformation: [],
    mapLocations: null,
    mapSize: null,

};
let plotLayout = {
    expandedBoxHeight: 6,
    animated: true,
    boxWidth: 6,
    boxHeight: 6,
    minBoxHeight: 1,
    separatorHeight: 1,
    measureLabelWidth: 400,//put this as 400 to have clearer display of the signature.
    title: null,
    pinSize: {width: 28, height: 38},
    colorScales: d3.scaleLinear().domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1])
        .range(["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"]).interpolate(d3.interpolateHsl),
    // colorScales: d3.scaleLinear().domain([0, 0.03, 0.06, 0.15, 0.3, 0.5, 0.7, 0.85, 0.94, 0.97, 1])
    //     .range(["#9dbee6", "#afcae6", "#c8dce6", "#e6e6e6", "#e6e6d8", "#e6d49c", "#e6b061", "#e6852f", "#e6531a", "#e61e1a"]).interpolate(d3.interpolateHsl),
    groupByLocation: true,
    timeLabelHeight: 20,
    groupColors: d3.schemeDark2,
    groupColorCounter: 0,
};
let allCells = {};
let allRows = {};
let allGroups = {};
let allSeparators = {};
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
    clonedInGraph: null,
    dataOverviews: null,
    overviewImages: {},
    allHeights: d3.range(plotLayout.minBoxHeight, plotLayout.expandedBoxHeight + 1, 1),
    expandedGroup: "",
    mouseoverGroup: "",
    groupHeight: 0,
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
        let svg = graphDiv.append("svg").attr("width", svgWidth).attr("height", svgHeight).attr("overflow", "visible");
        this.svg = svg;
        let graphWrapper = svg.append("g").attr("class", "graphWrapper").attr("transform", "translate(0, 0)");
        let graph = graphWrapper.append("g").attr("class", "graph");
        this.graph = graph;
        var detailDiv = setupDetailDiv();
        generateTimeLabels();
        this.clonedGroup = d3.select("body").append("svg").attr("id", "clonedGroup")
            .append("g").attr("id", "clonedGroup");
        this.clonedInGraph = this.svg.append("g").attr("id", "clonedInGraph");
        this.generateGroupLabels();
        //Generate cells
        generateCells();
        this.calculateRowPositions();
        this.setRowPositions();
        calculateColors();
        setColors();
        this.generateDataOverviews();
        this.setDataOverviewsPostionsAndVisibility();

        //this.generateArcs();
        //TODO: May need to remove this to a different place.
        let leftPanel = graphWidth + plotLayout.measureLabelWidth;
        // let leftPanel = 0;
        d3.select("#" + controlPanelContainer).style("left", (leftPanel + 20) + "px").style("top", (plotLayout.timeLabelHeight + 15) + "px").style("opacity", 0);//+10 is for the default top margin
        d3.select("#" + linePlotContainer).style("left", (leftPanel + 20) + "px").style("top", (plotLayout.timeLabelHeight + 120 + 15) + "px").style("opacity", 0);//120 is the height of the control panel
        d3.select("#" + mapDivContainer).style("left", (leftPanel + 20) + "px").style("top", (plotLayout.timeLabelHeight + 440 + 15) + "px").style("opacity", 0);//320 is the height of the line plot div
        d3.select("#btnControlPanel").style("top", 0 + "px").style("opacity", "1");
        d3.select("#btnLineGraph").style("top", ($("#btnControlPanel").width() + 40) + "px").style("opacity", "1");
        d3.select("#btnMap").style("top", ($("#btnControlPanel").width() + 40 + $("#btnLineGraph").width() + 40) + "px").style("opacity", "1");
        this.setupPins();
        this.setVisibePin("Dump.");

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
                                let strokeColor = "black";
                                let fillColor = "red";
                                // if (d.outlierType.indexOf("lower") >= 0) {
                                //     fillColor = 'red';
                                //     strokeColor = 'black';//1 for green
                                // }
                                // if (d.outlierType.indexOf("upper") >= 0) {
                                //     fillColor = 'red';
                                //     strokeColor = 'black';
                                // }
                                // if (d.outlierType.indexOf("lower") >= 0 && d.outlierType.indexOf("upper") >= 0) {
                                //     fillColor = 'red';
                                //     strokeColor = 'black';
                                // }
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
            detailDiv
                .style("opacity", 1.0).style("left", (d3.event.clientX) + "px")
                .style("top", (d3.event.clientY - 28) + "px")
                .style("display", "block")
                .style("z-index", 10);

            let msg = d.data[0][COL_MEASURE] + ' at ' + d.data[0][COL_LOCATION];
            msg += "<table style='width: 100%; margin-top: 5px;'>";
            d.data.forEach(row => {
                msg += "<tr>";
                msg += "<td>" + d3.timeFormat('%Y-%m-%d')(row[COL_SAMPLE_DATE]) + "</td>";
                msg += "<td><span style='text-align: right;'>" + row[COL_VALUE] + "</span></td>";
                msg += "</tr>"
            });
            msg += "</table>"
            detailDiv.select(".content").html(msg);
        }

        function generateCells() {
            allGroups = {};
            let strokeWidthRange = [0.1, plotLayout.boxHeight / 4];
            let measureCountDomain = [1, 37];//Calculated from the data=>then fix this to improve performance.
            let strokeScale = d3.scalePow().exponent(1 / 3).domain(measureCountDomain).range(strokeWidthRange);

            plotData.measures.forEach(measure => {
                plotData.locations.forEach(location => {
                    let rowKey = measure + "_" + location;
                    let row = graph.append("g").attr("rowKey", rowKey);
                    plotData.months.forEach(month => {
                        let key = measure + "_" + location + "_" + month;
                        let curr = plotData.data['$' + key];
                        if (curr) {
                            if (curr.hasOutlier === false) {
                                let strokeWidth = strokeScale(curr.data.length);
                                let w = plotLayout.boxWidth - strokeWidth;
                                let h = plotLayout.boxHeight - strokeWidth;
                                //Need to +strokeWidth/2 because the position is counted at the middle of the stroke
                                curr.x = month * plotLayout.boxWidth + strokeWidth / 2;
                                curr.y = strokeWidth / 2;
                                curr.width = w;
                                curr.height = h;
                                curr.rowKey = rowKey;
                                curr.strokeWidth = strokeWidth;
                                allCells['$' + key] = row.append("rect").attr("x", month * plotLayout.boxWidth + strokeWidth / 2).attr("y", 0 + strokeWidth / 2).attr("width", w).attr("height", h).attr("fill", "steelblue")
                                    .attr("stroke-width", strokeWidth).attr("stroke", "black").attr("stroke-opacity", 0.8)
                                    .datum(curr)
                                    .attr("class", "cell")
                            } else {
                                let strokeWidth = strokeScale(curr.outlierCount);
                                let r = (plotLayout.boxHeight - strokeWidth) / 2;
                                curr.x = month * plotLayout.boxWidth + plotLayout.boxWidth / 2;
                                curr.y = plotLayout.boxHeight / 2;
                                curr.r = r;
                                curr.rowKey = rowKey;
                                curr.strokeWidth = strokeWidth;
                                allCells['$' + key] = row.append("circle").attr("cx", month * plotLayout.boxWidth + plotLayout.boxWidth / 2).attr("cy", plotLayout.boxHeight / 2).attr("r", r).attr("stroke-width", strokeWidth).attr("class", "cell").attr("fill", "steelblue")
                                    .datum(curr);
                            }
                            allCells['$' + key]
                                .on("click", onClickShow)
                                .on("mouseover", () => {
                                    discreteHeatMapPlotter.setVisibePin(location);
                                });
                        }
                    });
                    row.call(d3.drag()
                        .on("start", rowDragStarted)
                        .on("drag", rowDragged)
                        .on("end", rowDragEnded)
                        .subject(this.clonedGroup)
                    );
                    allRows['$' + rowKey] = row;
                    //Put the row to its group.
                    if (!allGroups['$' + measure]) allGroups['$' + measure] = [];
                    allGroups['$' + measure].push(row);
                    if (!allGroups['$' + location]) allGroups['$' + location] = [];
                    allGroups['$' + location].push(row);
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
                    .attr("text-anchor", "start").attr("alignment-baseline", "middle").attr("style", "font: 10px sans-serif");
            });
        }

        function setupDetailDiv() {
            var detailDiv = d3.select("#detailDiv").style("opacity", 0);
            d3.select("body").on("click", discreteHeatMapPlotter.onClickHide);
            return detailDiv;
        }
    },
    pins: null,
    setupPins() {
        this.pins = d3.select("#mapDiv").selectAll('.mapPin')
            .data(plotData.mapLocations).enter()
            .append('img').attr("src", 'images/locationpin.png')
            .style("position", "absolute")
            .style("margin", 0 + "px")
            .style('left', d => ((d.x - plotLayout.pinSize.width / 2)) + "px")
            .style('top', d => (((d.y - plotLayout.pinSize.height / 2))) + "px");
    },
    setVisibePin(location) {
        this.pins.transition().duration(transitionDuration).style("opacity", d => d.name === location ? 1 : 0);
    },
    onClickHide: function () {
        if (!d3.event || (d3.event.target.classList[0] !== 'cell' && !d3.event.target.classList.contains('floatingBox'))) {
            var detailDiv = d3.select("#detailDiv");
            if (+detailDiv.style("opacity") === 1) {
                detailDiv.style("opacity", 0);
                detailDiv.style("display", "none")
            } else {
                //Disable the expanded group
                discreteHeatMapPlotter.resetExpandedGroup();
                //cleanup the cloned group
                discreteHeatMapPlotter.clonedGroup.selectAll("*").transition().duration(transitionDuration).attr("opacity", 0).remove();
                discreteHeatMapPlotter.clonedInGraph.selectAll("*").transition().duration(transitionDuration).attr("opacity", 0).remove();
            }
        }
    },
    setFishEye: function () {
        let fishEyeRadius = 100;
        var fisheye = d3.fisheye.circular()
            .radius(fishEyeRadius)
            .distortion(2);
        let svg = discreteHeatMapPlotter.svg;
        svg.on("mousemove", function () {
            if (d3.event.target.nodeName === "rect" || d3.event.target.nodeName === "circle") {
                let mouseCoords = d3.mouse(this);
                fisheye.focus(mouseCoords);
                let cells = d3.values(allCells);
                for (let i = 0; i < cells.length; i++) {
                    let cell = cells[i];
                    let datum = cell.datum();
                    let rowY = allRowLocations["$" + datum.rowKey].y;
                    //Change the y position.
                    let d = {
                        x: datum.x,
                        y: datum.y + rowY
                    };
                    let fisheyed = fisheye(d);
                    if (cell.node().nodeName === 'rect') {
                        cell.attr("x", fisheyed.x)
                            .attr("y", fisheyed.y - rowY)
                            .attr("width", fisheyed.z * datum.width)
                            .attr("height", fisheyed.z * datum.height);
                    } else if (cell.node().nodeName === 'circle') {
                        cell.attr("cx", fisheyed.x)
                            .attr("cy", fisheyed.y - rowY)
                            .attr("r", fisheyed.z * datum.r);
                    }
                }
            }

        });
    },
    disableFishEye: function () {
        let svg = discreteHeatMapPlotter.svg;
        svg.on("mousemove", null);
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
        let func = plotLayout.animated ? changePositionWithAnimation : changePosition;
        keys.forEach(key => {
            func(key);
        });

        function changePosition(key) {
            allRows[key].attr("transform", "translate(0, " + allRowLocations[key].y + ")");
        }

        function changePositionWithAnimation(key) {
            allRows[key].transition().duration(transitionDuration).attr("transform", "translate(0, " + allRowLocations[key].y + ")");
        }
    },

    generateGroupLabels: function () {
        if (!this.graphLabels) {
            this.graphLabels = this.graph.append("g");
        }
        this.graphLabels.selectAll("*").remove();
        allSeparators = {};
        let numberOfLocations = plotData.locations.length;
        let numberOfMeasures = plotData.measures.length;
        let boxHeight = plotLayout.boxHeight;
        let measureLabelWidth = plotLayout.measureLabelWidth;
        let graphWidth = this.graphWidth;
        let numberOfElementsInGroup = numberOfLocations * numberOfMeasures / plotData.groups.length;
        let labelHeight = numberOfElementsInGroup * boxHeight + plotLayout.separatorHeight;
        this.groupHeight = labelHeight;
        plotData.groups.forEach((group, i) => {
            allSeparators['$' + i] = this.graphLabels.append("rect").attr("x", 0).attr("y", i * labelHeight).attr("width", graphWidth + measureLabelWidth).attr("height", plotLayout.separatorHeight).attr("class", "separatorRect").attr("stroke-width", 0);
        });
        //Print the last line
        allSeparators['$' + plotData.groups.length] = this.graphLabels.append("rect").attr("x", 0).attr("y", plotData.groups.length * labelHeight).attr("width", graphWidth + measureLabelWidth).attr("height", plotLayout.separatorHeight).attr("class", "separatorRect").attr("stroke-width", 0);
        //Create the background rect

        //Recalculate the svg height based on new number of groups
        let graphHeight = numberOfMeasures * numberOfLocations * boxHeight + plotLayout.separatorHeight * (plotData.groups.length + 1);
        this.graphHeight = graphHeight;
        let svgHeight = graphHeight + plotLayout.timeLabelHeight + (plotLayout.expandedBoxHeight - plotLayout.boxHeight) * numberOfElementsInGroup;
        this.svg.attr("height", svgHeight);
    },
    resetExpandedGroup: function () {
        //Reset the shifted locations
        let allExpandedRows = discreteHeatMapPlotter.graph.selectAll(".expandedRow");
        allExpandedRows.selectAll("rect").transition().duration(transitionDuration).attr("stroke-width", d => d.strokeWidth).attr("height", d => d.height);
        allExpandedRows.selectAll("circle").transition().duration(transitionDuration).attr("stroke-width", d => d.strokeWidth).attr("r", d => d.r).attr("cy", plotLayout.boxHeight / 2);
        allExpandedRows.classed("expandedRow", false);
        //The shifted down image
        let allShiftedOverviews = discreteHeatMapPlotter.graph.selectAll(".shiftedDownOverview");
        allShiftedOverviews.attr("x", d => d.x).attr("y", d => d.y).classed("shiftedDownOverview", false);
        //The expanded image
        let expandedOverview = discreteHeatMapPlotter.graph.select(".expandedImage");
        expandedOverview.attr("height", d => d.height);
        expandedOverview.attr("xlink:href", d => discreteHeatMapPlotter.overviewImages["$" + discreteHeatMapPlotter.expandedGroup + (d.height + plotLayout.separatorHeight)]);
        expandedOverview.classed("expandedImage", false);
        discreteHeatMapPlotter.generateGroupLabels();
        discreteHeatMapPlotter.setRowPositions();
        discreteHeatMapPlotter.expandedGroup = "";
    }, generateDataOverviews: function () {
        if (!discreteHeatMapPlotter.dataOverviews) {
            discreteHeatMapPlotter.dataOverviews = {};
            //Also need to remove all the existing group overviews (if there is)
            discreteHeatMapPlotter.graph.selectAll(".overview").remove();
        } else {
            return;
        }
        generateOverviewForGroup('location');
        generateOverviewForGroup('measure');

        //Generate for the Location
        function generateOverviewForGroup(groupBy) {
            let locationData = myDataProcessor.getOverviewByLocationMonth();
            let measureData = myDataProcessor.getOverviewByMeasureMonth();
            let overviewData = (groupBy === "location") ? locationData : measureData;
            let numberOfLocations = plotData.locations.length;
            let numberOfMeasures = plotData.measures.length;
            let boxHeight = plotLayout.boxHeight;
            let overviewWidth = plotLayout.measureLabelWidth;
            let groups = (groupBy === "location") ? plotData.locations : plotData.measures;
            let numberOfElementsInGroup = numberOfLocations * numberOfMeasures / groups.length;
            let groupHeight = numberOfElementsInGroup * boxHeight + plotLayout.separatorHeight;
            var x = plotData.months;
            groups.forEach((group) => {
                let y = overviewData["$" + group];
                let curr = {
                    x: 0,
                    y: plotLayout.separatorHeight,
                    width: overviewWidth,
                    height: groupHeight - plotLayout.separatorHeight,
                    class: "overview",
                    id: group
                };
                let overview = discreteHeatMapPlotter.graph.append("image").datum(curr)
                    .attr("x", d => d.x).attr("y", d => d.y)
                    .attr("id", d => d.id).attr("width", d => d.width).attr("height", d => d.height)
                    .attr("opacity", 1)
                    .attr("class", d => d.class)
                    .on("mouseover", () => {
                        if (plotLayout.groupByLocation) {
                            discreteHeatMapPlotter.setVisibePin(group);
                        }
                        discreteHeatMapPlotter.mouseoverGroup = group;
                        if (discreteHeatMapPlotter.expandedGroup === group) {
                            return;
                        }
                        if (plotLayout.expandedBoxHeight === plotLayout.boxHeight) {
                            return;
                        }
                        //This section reset the previously expanded/shifted cells/rows/section
                        discreteHeatMapPlotter.resetExpandedGroup();

                        //Start processing the on mouseover
                        if (plotLayout.expandedBoxHeight === plotLayout.boxHeight) {
                            return;
                        }
                        let expandedRatio = plotLayout.expandedBoxHeight / plotLayout.boxHeight;
                        let numberOfElementsInGroup = plotLayout.groupByLocation ? plotData.measures.length : plotData.locations.length;
                        let shiftDown = numberOfElementsInGroup * (plotLayout.expandedBoxHeight - plotLayout.boxHeight) + plotLayout.separatorHeight;
                        let difference = plotLayout.expandedBoxHeight - plotLayout.boxHeight;
                        //Set all size to the new size
                        let rows = allGroups["$" + group];
                        //Need to sort since the locations of the expanded cells will be shifted down differently according to its y position.
                        rows.sort((a, b) => {
                            return allRowLocations["$" + a.attr("rowKey")].y - allRowLocations["$" + b.attr("rowKey")].y;
                        });
                        rows.forEach((row, i) => {
                            row.selectAll("rect")
                                .attr("stroke-width", d => d.strokeWidth * expandedRatio)
                                .attr("height", d => plotLayout.expandedBoxHeight - d.strokeWidth * expandedRatio);
                            row.selectAll("circle")
                                .transition()
                                .attr("stroke-width", d => d.strokeWidth * expandedRatio)
                                .attr("r", d => plotLayout.expandedBoxHeight / 2 - d.strokeWidth * expandedRatio / 2)
                                .attr("cy", plotLayout.expandedBoxHeight / 2);
                            row.transition().duration(transitionDuration).attr("transform", `translate(0,${allRowLocations["$" + row.attr("rowKey")].y + i * difference})`);
                            row.classed("expandedRow", true);
                        });

                        //Expand the overview image
                        let theOverview = discreteHeatMapPlotter.dataOverviews["$" + group];
                        let expandedOverviewHeight = (numberOfElementsInGroup * plotLayout.expandedBoxHeight + plotLayout.separatorHeight);
                        theOverview.attr("height", expandedOverviewHeight - plotLayout.separatorHeight);
                        discreteHeatMapPlotter.generateOverviewImage(x, y, group, plotLayout.measureLabelWidth, expandedOverviewHeight, theOverview);
                        theOverview.classed("expandedImage", true);
                        //shift all the others down.
                        for (let i = plotData.groups.indexOf(group) + 1; i < plotData.groups.length; i++) {
                            let rows = allGroups["$" + plotData.groups[i]];
                            rows.forEach(row => {
                                // let aCell = row.select("rect").empty() ? row.select("circle") : row.select("rect");
                                // if (!aCell.empty()) {
                                //     row.transition().duration(transitionDuration).attr("transform", `translate(0,${allRowLocations["$" + aCell.datum().rowKey].y + shiftDown})`)
                                // }
                                row.transition().duration(transitionDuration).attr("transform", `translate(0,${allRowLocations["$" + row.attr("rowKey")].y + shiftDown})`);
                            });
                            let separator = allSeparators["$" + i];
                            separator.attr("y", +separator.attr("y") + shiftDown);
                            //Shift the overview.
                            let dataOverview = discreteHeatMapPlotter.dataOverviews["$" + plotData.groups[i]];
                            dataOverview.attr("y", +dataOverview.attr("y") + shiftDown).classed("shiftedDownOverview", true);
                        }
                        //Shift the last separator too
                        let separator = allSeparators["$" + plotData.groups.length];
                        separator.transition().duration(transitionDuration).attr("y", +separator.attr("y") + shiftDown).attr("class", "shiftedDownRow");
                        //The expandedGroup is the current group.
                        discreteHeatMapPlotter.expandedGroup = group;
                    }).call(d3.drag()
                        .on("start", groupDragStarted)
                        .on("drag", groupDragged)
                        .on("end", groupDragEnded)
                        .subject(discreteHeatMapPlotter.clonedGroup));
                discreteHeatMapPlotter.dataOverviews["$" + group] = overview;
                discreteHeatMapPlotter.generateOverviewImage(x, y, group, overviewWidth, groupHeight, overview);
            });
        }
    },
    generateOverviewImage: function (x, y, group, overviewWidth, overviewHeight, overview) {
        let existingImage = discreteHeatMapPlotter.overviewImages["$" + group + overviewHeight];
        if (existingImage) {
            overview.attr("xlink:href", existingImage);
            return;
        }
        let groupSamplingRatio = myDataProcessor.samplingRatio["$"+group];
        let ratioStr = "(" +(Math.round(groupSamplingRatio.ratio*100)/100)+ " = "+ groupSamplingRatio.totalSamples+"/"+ groupSamplingRatio.totalPoints+ ")";
        let layout = {
            annotations: [
                {
                    x: 0,
                    y: 1.0,
                    xshift: 2,
                    yshift: -2,
                    showarrow: false,
                    text: group + ratioStr,
                    xref: "paper",
                    yref: "paper",
                    font: {
                        size: 10,
                        color: 'white',
                        weight: 'bold',
                    },
                },
                {
                    x: 0,
                    y: 1.0,
                    showarrow: false,
                    text: group + ratioStr,
                    xref: "paper",
                    yref: "paper",
                    font: {
                        size: 10,
                        color: 'black',
                    }
                }],
            // title: '',
            // titlefont: {
            //     size: 8,
            //     color: '#7f7f7f',
            // },
            displayModeBar: false,
            xaxis: {
                autorange: true,
                showgrid: false,
                zeroline: false,
                showline: false,
                autotick: true,
                ticks: '',
                showticklabels: false
            },
            yaxis: {
                autorange: true,
                showgrid: false,
                zeroline: false,
                showline: false,
                autotick: true,
                ticks: '',
                showticklabels: false
            },
            margin: {
                l: 0,
                r: 0,
                t: 0,
                b: 0,
                pad: 0,
                autoexpand: false
            },
            paper_bgcolor: 'rgb(233, 233, 233)',
            plot_bgcolor: 'rgb(233, 233, 233)'
        };
        let overviewPlotData = [
            {
                x: x,
                y: y,
                type: 'lines',
                line: {
                    width: 0.5,
                    color: "rgba(0, 0, 0, 1)"
                }
            }
        ];
        let aDiv = document.createElement("div");
        Plotly.plot(aDiv, overviewPlotData, layout).then(
            function (gd) {
                Plotly.toImage(gd, {
                    format: 'svg',
                    width: overviewWidth,
                    height: overviewHeight
                }).then(function (svgData) {
                    discreteHeatMapPlotter.overviewImages["$" + group + overviewHeight] = svgData;
                    overview.attr("xlink:href", svgData);
                });
            }
        );
    },
    setDataOverviewsPostionsAndVisibility: function () {
        let notGroups = (plotLayout.groupByLocation) ? plotData.measures : plotData.locations;
        notGroups.forEach(notGroup => {
            //Need to change visibility here since otherwise it will be activated when mouse over (if only changed the opacity)
            this.dataOverviews["$" + notGroup].style("visibility", "hidden");
        });
        plotData.groups.forEach(group => {
            this.dataOverviews["$" + group].style("visibility", "visible");
        });

        let numberOfLocations = plotData.locations.length;
        let numberOfMeasures = plotData.measures.length;
        let boxHeight = plotLayout.boxHeight;
        let graphWidth = this.graphWidth;
        let numberOfElementsInGroup = numberOfLocations * numberOfMeasures / plotData.groups.length;
        let groupHeight = numberOfElementsInGroup * boxHeight + plotLayout.separatorHeight;

        //Change position
        plotData.groups.forEach((group, i) => {
            let theGraph = this.dataOverviews["$" + group];
            theGraph.attr("transform", "translate(" + graphWidth + ", " + i * groupHeight + ")");
            //set the plot
            theGraph.attr("xlink:href", discreteHeatMapPlotter.overviewImages["$" + group + groupHeight]);
        });
    },
    /**
     * toggleOutlier
     * @param {boolean}  value   true will display the outlier, false will not
     */
    toggleOutlier: function (value) {
        if (value === true) {
            this.graph.selectAll("circle").attr("opacity", 1e-6).transition().duration(transitionDuration).attr("opacity", 1.0);
        } else {
            this.graph.selectAll("circle").attr("opacity", 1.0).transition().duration(transitionDuration).attr("opacity", 1e-6);
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
        let xRadiusScale = d3.scaleLinear().domain([minRadius, maxRadius]).range([plotLayout.measureLabelWidth / 4 + 8, 2 * plotLayout.measureLabelWidth - 8])

        streamInformation.forEach(streamLocation => {
            let source = streamLocation.source;
            let destination = streamLocation.destination;
            let startPoint = locationPositions.filter(d => d.key === source)[0].value;
            let endPoint = locationPositions.filter(d => d.key === destination)[0].value;
            let radius = Math.sqrt(Math.pow(startPoint.x - endPoint.x, 2) + Math.pow(startPoint.y - endPoint.y, 2)) / 2;
            let xRadius = xRadiusScale(radius);
            this.generateArc(this.arcs, source + destination, startPoint, endPoint, radius, xRadius);
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
    generateArc: function (container, id, startPoint, endPoint, radius, xRadius) {
        let swap = false;
        if (startPoint.y > endPoint.y) {
            let temp = startPoint;
            startPoint = endPoint;
            endPoint = temp;
            swap = true;
        }
        // let arcStr = "M" + startPoint.x + "," + startPoint.y + " C" + (startPoint.x+xRadius) + "," + (startPoint.y) +
        //     " " + (endPoint.x + xRadius) + "," + (endPoint.y) + " "+ endPoint.x + "," + endPoint.y;
        let arcStr = "M" + startPoint.x + "," + startPoint.y + " Q" + (startPoint.x + xRadius) + "," + (startPoint.y + radius) +
            " " + endPoint.x + "," + endPoint.y;
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
    plotLineGraph: function (location, measure, color, showLegend) {
        myDataProcessor.plotLineGraph(location, measure, this.plotLineGraphHandler, color, showLegend);
    },
    plotLineGraphHandler: function (location, measure, x, y, color, showLegend) {
        let trace = {
            x: x,
            y: y,
            name: location + "-" + measure,
            mode: 'markers+lines',
            type: 'scatter',
            marker: {
                opacity: 0.3,
                size: 4
            },
            line: {
                width: 0.5
            },
            connectgaps: false
        };
        var layout = {
            xaxis: {
                title: "time"
            },
            yaxis: {
                title: "value"
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: {
                family: "Georgia,Times,serif",
                size: 11
            },
            margin: {
                l: 50,
                r: 150,
                t: 50,
                b: 50,
                pad: 0,
                autoexpand: false
            },
            showlegend: true
        }
        if (color >= 0) {
            trace.line.color = plotLayout.groupColors[color];
            trace.name = plotLayout.groupByLocation ? location : measure;
            trace.legendgroup = trace.name;
            trace.showlegend = showLegend;
        }

        let data = [trace];

        Plotly.plot(linePlotDiv, data, layout);

    },
    //Used this to get the data then remove it to improve performance.
    // getMaxMeasureCount: function () {
    //     let maxCount = 1;
    //     plotData.data.keys().forEach(key => {
    //         let measureCount = plotData.data["$" + key].data.length;
    //         if (maxCount < measureCount) maxCount = measureCount;
    //     });
    //     return maxCount;
    // },
    setHeight: function (newBoxHeight) {
        plotLayout.boxHeight = +newBoxHeight;
        let strokeWidthRange = [0.1, plotLayout.boxHeight / 4];
        let measureCountDomain = [1, 37];//Calculated from the data=>then fix this to improve performance.
        let strokeScale = d3.scalePow().exponent(1 / 2).domain(measureCountDomain).range(strokeWidthRange);
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
                            curr.width = w;
                            curr.height = h;
                            curr.strokeWidth = strokeWidth;
                            //Need to +strokeWidth/2 because the position is counted at the middle of the stroke
                            cell.attr("x", month * plotLayout.boxWidth + strokeWidth / 2).attr("y", 0 + strokeWidth / 2).attr("width", w).attr("height", h)
                                .attr("stroke-width", strokeWidth);
                        } else {
                            let strokeWidth = strokeScale(curr.outlierCount);
                            let r = (plotLayout.boxHeight - strokeWidth) / 2;
                            curr.strokeWidth = strokeWidth;
                            curr.r = r;
                            cell.attr("cx", month * plotLayout.boxWidth + plotLayout.boxWidth / 2).attr("cy", plotLayout.boxHeight / 2).attr("r", r).attr("stroke-width", strokeWidth);
                        }
                    }
                });
            });
        });
        this.calculateRowPositions();
        this.setRowPositions();
        //Need to replot the graph overview (since size changes).
        this.generateGroupLabels();
        this.dataOverviews = null;
        this.generateDataOverviews();
        this.setDataOverviewsPostionsAndVisibility();
        //this.generateArcs();
    }

}
let draggedGroup = null;
let groupY = 0;

function groupDragStarted() {
    //Clean the clonedGroup
    discreteHeatMapPlotter.clonedGroup.selectAll("*").remove();
    dragOffset = d3.event.x;
    let obj = d3.select(this);
    let group = obj.node().id;
    draggedGroup = group;
    //Select all rows of that group.
    let groupRowIds = d3.keys(allRows).filter(d => d.indexOf(group) >= 0);
    //Put all these into one html ms.
    //clean the existing nodes
    discreteHeatMapPlotter.clonedGroup.selectAll("*").remove();
    groupY = getMinGroupY(group);
    groupRowIds.forEach(rowId => {
        let row = allRows[rowId].node();
        discreteHeatMapPlotter.clonedGroup.node().appendChild(row.cloneNode(true));
        discreteHeatMapPlotter.clonedGroup.attr("opacity", 0);
    });
}

function getMinGroupY(group) {
    let groupRowIds = d3.keys(allRows).filter(d => d.indexOf(group) >= 0);
    let minY = Number.MAX_SAFE_INTEGER;
    groupRowIds.forEach(id => {
        let rowY = allRowLocations[id].y;
        if (minY > rowY) minY = rowY;
    });
    return minY;
}

function groupDragged() {
    discreteHeatMapPlotter.clonedGroup
        .style("display", "block")
        .attr("opacity", 1.0)
        .attr("transform", "translate(" + (d3.event.sourceEvent.clientX - dragOffset) + ","
            + (d3.event.sourceEvent.clientY - groupY - discreteHeatMapPlotter.groupHeight / 2) + ")");
}

function groupDragEnded() {
    //If it is dropped to the line plot area
    let linePlotDivBox = d3.select("#" + linePlotDiv).node().getBoundingClientRect();
    let x = linePlotDivBox.x;
    let y = linePlotDivBox.y;
    let width = linePlotDivBox.width;
    let height = linePlotDivBox.height;
    let mouseX = d3.event.sourceEvent.clientX;
    let mouseY = d3.event.sourceEvent.clientY;
    if (mouseX > x && mouseX < x + width && mouseY > y && mouseY < y + height) {
        let locations = [];
        let measures = [];
        if (plotLayout.groupByLocation) {
            locations = [draggedGroup];
            measures = plotData.measures;
        } else {
            measures = [draggedGroup];
            locations = plotData.locations;
        }
        let legendShown = false;
        locations.forEach((location, i) => {
            measures.forEach(measure => {
                //Only set the group for the first time.
                let showLegend = false;
                if(!legendShown){
                    let hasData = myDataProcessor.data.filter(d => d.location === location && d.measure===measure).length > 0;
                    if(hasData){
                        showLegend = true;
                        legendShown = true;
                    }
                }
                discreteHeatMapPlotter.plotLineGraph(location, measure, plotLayout.groupColorCounter, showLegend);
            });
        });
        plotLayout.groupColorCounter++;
        plotLayout.groupColorCounter = plotLayout.groupColorCounter % 10;//max 10 colors
        discreteHeatMapPlotter.clonedGroup.selectAll("*").remove();
        //If we haven't got the clear button, add it.
        if (d3.select("#clearBtn").empty()) {
            addClearButton();
            addToggleInfoButton();
        }
    } else {
        let droppedY = getMinGroupY(discreteHeatMapPlotter.mouseoverGroup);
        discreteHeatMapPlotter.clonedInGraph.html(discreteHeatMapPlotter.clonedGroup.html());
        //Remove the old one
        discreteHeatMapPlotter.clonedGroup.selectAll("*").remove();
        discreteHeatMapPlotter.clonedInGraph.attr("opacity", 1.0).transition().duration(transitionDuration).attr("transform", `translate(0, ${droppedY - groupY})`);
        discreteHeatMapPlotter.clonedInGraph.selectAll("*").transition().duration(transitionDuration)
        // .attr("fill", "blue");
            .attr("opacity", 0.8);
        //Alert the similarity
        let droppedGroup = discreteHeatMapPlotter.mouseoverGroup;
        let similarities = plotLayout.groupByLocation ? locationSimilarities : measureSimilarities;
        let similarity = getSimilarity(similarities, draggedGroup, droppedGroup);
        if (similarity) {
            let detailDiv = d3.select("#detailDiv");
            detailDiv
                .style("opacity", 1.0).style("left", (d3.event.sourceEvent.clientX) + "px")
                .style("top", (d3.event.sourceEvent.clientY - 28) + "px")
                .style("display", "block")
                .style("z-index", 10);
            let msg = "Two group similarity is: " + similarity;
            detailDiv.select(".content").html(msg);
        }

        function getSimilarity(similarities, item1, item2) {
            let theSimilarity = similarities.filter(s => (s.item1 === item1 && s.item2 === item2) || (s.item1 === item2 && s.item2 === item1))[0];
            return theSimilarity ? theSimilarity.value : null;
        }
    }

}

let draggedLocation = null;
let draggedMeasure = null;
let dragOffset;

function rowDragStarted() {
    //Clean the clonedGroup
    discreteHeatMapPlotter.clonedGroup.selectAll("*").remove();
    let obj = d3.select(this);
    //Get the data
    let aCell = obj.select("rect").empty() ? obj.select("circle") : obj.select("rect");
    if (!aCell) {
        return;
    }
    draggedLocation = aCell.datum().data[0].location;
    draggedMeasure = aCell.datum().data[0].measure;
    dragOffset = d3.event.x;
    cloneSelection(obj);
    discreteHeatMapPlotter.clonedGroup
        .style("display", "none") //Display "none" is to prevent it from hiding the underlining element that we can't click.
        .attr("transform", "translate(" + (d3.event.sourceEvent.clientX - dragOffset) + "," + (d3.event.sourceEvent.clientY - plotLayout.boxHeight) + ")");
}

function cloneSelection(selection) {
    let cloned = selection.html();
    discreteHeatMapPlotter.clonedGroup.html(cloned);
    return cloned;
}

function rowDragged() {
    discreteHeatMapPlotter.clonedGroup.style("display", "block").attr("opacity", 1.0).attr("transform", "translate(" + (d3.event.sourceEvent.clientX - dragOffset) + "," + (d3.event.sourceEvent.clientY - plotLayout.boxHeight) + ")");
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
    discreteHeatMapPlotter.clonedGroup.selectAll("*").attr("opacity", 1.0).transition().duration(transitionDuration).attr("opacity", 1e-6).remove();
    draggedLocation = null;
    draggedMeasure = null;
    //If we haven't got the clear button, add it.
    if (d3.select("#clearBtn").empty()) {
        addClearButton();
        addToggleInfoButton();
    }
}

function createElementFromHTML(htmlString) {
    var div = document.createElement('div');
    div.innerHTML = htmlString.trim();
    return div.firstChild;
}

function addClearButton() {
    let htmlString =
        '<a id="clearBtn" rel="tooltip" class="modebar-btn" data-title="Clear current graph" data-toggle="false" data-gravity="n">' +
        '<svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">'+
        '<g><path d="M767,973.2H251.7c-45.7,0-83-36.4-84.5-81.7l-67.4-721c-2.5-27.9,18.1-52.5,46-55c27.6-2.3,52.5,18.1,55,46l66.5,710.4h484.1l47.7-524.3c2.5-27.9,27.8-48.2,55-45.9c27.9,2.5,48.4,27.2,45.9,55.1l-48.6,534.9C850,936.8,812.7,973.2,767,973.2z"/><path d="M939.3,214.3H60.7c-28,0-50.7-22.7-50.7-50.7c0-28,22.7-50.7,50.7-50.7h878.6c28,0,50.7,22.7,50.7,50.7C990,191.6,967.3,214.3,939.3,214.3z"/><path d="M700.2,120.7c0,43.2-35,78.3-78.3,78.3H395c-43.2,0-78.3-35-78.3-78.3v-15.7c0-43.2,35-78.3,78.3-78.3h227c43.2,0,78.3,35,78.3,78.3V120.7z"/><path d="M366.5,827c-24.3,0-44.8-18.8-46.5-43.4l-31.1-436.3c-1.8-25.7,17.5-48.1,43.3-49.9c25.6-2,48.1,17.5,49.9,43.3L413.2,777c1.8,25.7-17.5,48.1-43.3,49.9C368.8,827,367.7,827,366.5,827z"/><path d="M516.5,827c-25.8,0-46.7-20.9-46.7-46.7l0-436.3c0-25.8,20.9-46.7,46.7-46.7c25.8,0,46.7,20.9,46.7,46.7v436.3C563.2,806.1,542.2,827,516.5,827z"/><path d="M666.4,827c-1.1,0-2.3,0-3.4-0.1c-25.8-1.8-45.1-24.2-43.3-49.9l31.1-436.3c1.9-25.7,24.6-45.3,49.9-43.3c25.8,1.8,45.1,24.2,43.3,49.9l-31.1,436.3C711.1,808.2,690.6,827,666.4,827z"/></g>'+
        '</svg>'+
        '</a>';
    let theElm = createElementFromHTML(htmlString);
    theElm.addEventListener('click', clearChart, false);
    let downloadBtn = d3.select('[data-title="Download plot as a png"]');
    if (!downloadBtn.empty()) {
        downloadBtn.node().parentNode.insertBefore(theElm, downloadBtn.node());
    }
}

function addToggleInfoButton() {
    let htmlString =
        '<a id="clearBtn" rel="tooltip" class="modebar-btn" data-title="Toggle hover info" data-toggle="false" data-gravity="n">' +
        '<svg width="16" height="16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 1000 1000" enable-background="new 0 0 1000 1000" xml:space="preserve">' +
        '<g><g><path d="M846.7,153.7c-191.2-191.5-501.5-191.7-693-0.4c-191.5,191.2-191.7,501.5-0.4,693c191.2,191.5,501.5,191.7,693,0.4C1037.7,655.5,1037.9,345.2,846.7,153.7z M568.4,810.9c0,7.6-6.1,13.7-13.7,13.7H445.3c-7.6,0-13.7-6.1-13.7-13.7V404.6c0-7.6,6.1-13.7,13.7-13.7h109.5c7.6,0,13.7,6.1,13.7,13.7V810.9z M500,334.1c-43.8,0-79.4-35.6-79.4-79.4c0-43.8,35.6-79.4,79.4-79.4c43.8,0,79.4,35.6,79.4,79.4C579.4,298.5,543.8,334.1,500,334.1z"/></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g><g></g></g>' +
        '</svg>'+
        '</a>';
    let theElm = createElementFromHTML(htmlString);
    //Set the opacity = 1 by default. Because by default there is no opacity attribute so we can't change it
    d3.select("g.hoverlayer").attr("opacity", 1);
    theElm.addEventListener('click', () => {
        let opacity = (+d3.select("g.hoverlayer").attr("opacity")) === 1 ? 0 : 1;
        d3.select("g.hoverlayer").attr("opacity", opacity);
    }, false);
    let downloadBtn = d3.select('[data-title="Download plot as a png"]');
    if (!downloadBtn.empty()) {
        downloadBtn.node().parentNode.insertBefore(theElm, downloadBtn.node());
    }

}

function clearChart() {
    Plotly.purge(linePlotDiv);
}
