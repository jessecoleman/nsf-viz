let cells = [
    {
        pos: [0, 0],
        title: (p) => "Grants in SELECTED divisions per year " + (p ? "(%)" : "(#)"),
        tip: (v, p, name, norm) => {
            return `<table class="striped">
                <tbody>
                    <tr>
                        <td>SELECTED divisions</td>
                        <td>${(p ? d3.format(".2%")(norm) : d3.format(",")(norm) + " grants")}</td>
                    </tr>
                    <tr>
                        <td>${name}</td>
                        <td>${(p ? d3.format(".2%")(v) : d3.format(",")(v) + " grants")}</td>
                    </tr>
                </tbody>
            </table>`;
        },
        tick: (p) => p ? d3.format(".2%") : d3.format(".2s"),
        amount: false,
        filtered: true,
        total: 0,
        value: (value, key, norm=1) => {
            if (value[key]) {
                return value[key].match_grants / norm;
            } else {
                return 0;
            }
        }
    },
    {
        pos: [1, 0],
        title: (p) => "ALL grants per year " + (p ? "(%)" : "(#)"),
        tip: (v, p) => {
            return `<span style="padding: 8px">
                ${p ? d3.format(".2%")(v) : d3.format(",")(v) + " grants"}
            </span>`;
        },
        tick: (p) => p ? d3.format(".2%") : d3.format(".2s"),
        amount: false,
        filtered: false,
        total: 0,
        value: (value, key, norm=1) => {
            if (value[key]) {
                return value[key].match_grants / norm;
            } else {
                return 0;
            }
        }
    },
    {
        pos: [0, 1],
        title: (p) => "Grant funding in SELECTED divisions per year " + (p ? "(%)" : "($)"),
        tip: (v, p, name, norm) => {
            return `<table class="striped">
                <tbody>
                    <tr>
                        <td>SELECTED divisions</td>
                        <td>${(p ? d3.format(".2%")(norm) : d3.format("$,")(norm))}</td>
                    </tr>
                    <tr>
                        <td>${name}</td>
                        <td>${(p ? d3.format(".2%")(v) : d3.format("$,")(v))}</td>
                    </tr>
                </tbody>
            </table>`;
        },
        tick: (p) => p ? d3.format(".2%") : d3.format("$.2s"),
        amount: true,
        filtered: true,
        total: 0,
        value: (value, key, norm=1) => {
            if (value[key]) {
                return value[key].match_amount / norm;
            } else {
                return 0;
            }
        }
    },
    {
        pos: [1, 1],
        title: (p) => "ALL grant funding per year " + (p ? "(%)" : "($)"),
        tip: (v, p) => {
            return `<span style="padding: 8px">
                ${p ? d3.format(".2%")(v) : d3.format("$,")(v)}
            </span>`;
        },
        tick: (p) => p ? d3.format(".2%") : d3.format("$.2s"),
        amount: true,
        filtered: false,
        total: 0,
        value: (value, key, norm=1) => {
            if (value[key]) {
                return value[key].match_amount / norm;
            } else {
                return 0;
            }
        }
     },
]

let visPercent = true;
let visDivisions = null;
let visData = null;

document.addEventListener("DOMContentLoaded", function() {

    let sidenav = document.querySelector("#side-bar");
    let modal = document.querySelector("#grant-data");
    let select = document.querySelector("#select-division");
    let keywordChips = document.querySelector("#keywords-autocomplete");

    // delayed chip search
    let searchTime;
    let searchTimeout = false;
    let searchDelta = 50;

    function sTimeout() {
        searchTime = new Date();
        if (searchTimeout == false) {
            searchTimeout = true;
            function callback() {

                let spinner = d3.select("#spin")
                    .style("display", "block");

                svg.transition().duration(200).style("opacity", 0.4);

                if (new Date() - searchTime < searchDelta) {
                    setTimeout(callback, searchDelta);
                } else {
                    searchTimeout = false;
                    getSuggestions(keywordInstance.chipsData);
                    getData();
                }
            }
            setTimeout(callback, searchDelta);
        }
    }

     // initialize materialize elements
    let sidenavInstance = M.Sidenav.init(sidenav);
    let modalInstance = M.Modal.init(modal, null);
    let keywordInstance = M.Chips.init(keywordChips, {
        onChipAdd: function(e, c) {
            terms = c.firstChild.nodeValue.split(",");
            if (terms.length > 1) {
                keywordInstance.deleteChip(keywordInstance.chipsData.length - 1);
                terms.forEach((t) => {
                    keywordInstance.addChip({tag: t});
                });
            }
            sTimeout();
        },
        onChipDelete: function(e, c) {
            sTimeout();
        }
    });

    d3.select("#keywords-autocomplete input").property("placeholder", "enter search terms").style("color", "white")

    let keywordContainer = d3.select("#keyword-container");
    let divisionContainer = d3.select("#division-container");
    let keywordInput = d3.select("#keywords-autocomplete input");
    let divisionInput = d3.select("#divisions-autocomplete");
    let keywordDropdown = d3.select("#keywords-dropdown")
    let keywordFocused = false;
    let divisionFocused = false;

    // TODO clean this up
    let divisionDropdown = d3.select("#divisions-dropdown")
        .style("position", "absolute")

    keywordInput.on("focus", function(e) {
        // TODO
        keywordDropdown.style("display", "block")
            .style("position", "fixed")
            .style("top", d3.select("#nav-top").node().getBoundingClientRect().height + "px")
    });

    keywordInput.on("focusout", function(e) {
        if (!keywordFocused) {
            keywordDropdown.style("display", "none");
        } else {
            keywordInput.node().focus();
        }
    });

    divisionInput.on("focus", function(e) {
        divisionDropdown
            .style("display", "block")
            .style("position", "fixed")
    });

    divisionInput.on("focusout", function(e) {
        if (!divisionFocused) {
            divisionDropdown.style("display", "none");
        } else {
            divisionInput.node().focus();
        }
    });

    divisionInput.on("keyup", (e) => {
        let query = divisionInput.node().value;
        divisionList.classed("hide", (d) => {
            return d.name.toLowerCase().indexOf(query.toLowerCase()) == -1;
        });
    });

    keywordDropdown.on("mouseover", function() {
        keywordFocused = true;
    });

    keywordDropdown.on("mouseout", function(event) {
        let e = d3.event.toElement || d3.event.relatedTarget;
        if (!this.contains(e)) {
            keywordFocused = false;
        }
    });

    divisionContainer.on("mouseover", function() {
        divisionFocused = true;
    });

    divisionContainer.on("mouseout", function(event) {
        let e = d3.event.toElement || d3.event.relatedTarget;
        if (!this.contains(e)) {
            divisionFocused = false;
        }
    });

    let auto = document.querySelector("#divisions-autocomplete");
    let autoInstance = M.Autocomplete.init({data: {"test": null, "test2": null, "test3": null},
    limit: 20, minLength: 0});

    let divisionList;
    let divisionItems;

    url_terms.forEach(d => {
        keywordInstance.addChip({tag: d});
    });

    divisionList = d3.select("#divisions-table tbody")
        .selectAll("tr")
        .data(function () { return this.dataset; })
        .enter().append("tr")
        .style("font-weight", d => {
            if (d.checked = d.default) return "bold";
            else return "normal";
        })
        .on("click", function(d) {
            d3.select(this).style("font-weight", d => d.checked ? "normal" : "bold")
            d.checked = !d.checked;
            plot(visData, visPercent, d3.select(this).attr("data-index"), d.checked);
        })

    divisionList.append("td")
        .attr("class", "name")
        .text(d => d.name);

    divisionList.append("td")
        .attr("class", "amount")

    let sortName = d3.select("#divisions-table").select("#sort-name")
        .on("click", () => {
            let order = sortName.classed("sort-desc") ? 1 : -1;
            sortVal.classed("sort-desc sort-asc", false);
            sortName.classed("sort-desc", true);
            reorder(visData, "name", order);
        });

    let sortVal = d3.select("#divisions-table").select("#sort-val")
        .on("click", () => {
            if (sortVal.text() === "grants") {
                sortVal.text("funding");
                sortName.classed("sort-desc sort-asc", false);
                sortVal.classed("sort-desc", true);
                reorder(visData, "amount", 1);
            } else {
                sortVal.text("grants");
                sortName.classed("sort-desc sort-asc", false);
                sortVal.classed("sort-desc", true);
                reorder(visData, "grants", 1);
            }
        });

    getData();

    let toggleButton = d3.select("#toggle-view").on("click", () => {
        toggleButton.text(visPercent ? "% view percent" : "# view counts");
        visPercent = !visPercent;
        plot(visData, visPercent);
    });

    d3.select("#clear-terms").on("click", (e) => {
        let l = keywordInstance.chipsData.length;
        for (let i = 0; i < l; i++) {
            keywordInstance.deleteChip(0);
        }
        getSuggestions([]);
    });

    let clearDivisions = d3.select("#clear-divisions")
        .on("click", (e) => {
            allDivisions.style("display", "block");
            clearDivisions.style("display", "none");

            divisionList.style("font-weight", (d) => {
                    d.checked = false;
                    return "normal";
                })

            plot(visData, visPercent);
        });

    let allDivisions = d3.select("#select-all")
        .style("display", "none")
        .on("click", (e) => {
            clearDivisions.style("display", "block");
            allDivisions.style("display", "none");

            divisionList.style("font-weight", (d) => {
                    d.checked = true
                    return "bold";
                })

            plot(visData, visPercent);
        })

    let toggle = d3.select("#any-all").on("change", getData);

    d3.select("#display-grants").on("click", getGrants);

    let tooltip = d3.select("body").append("div")
        .attr("class", "tooltip z-depth-3")
        .style("opacity", 0);

    function getColor(i, amount) {
        let green = ["#A5D6A7", "#81C784", "#66BB6A", "#4CAF50", "#43A047", "#388E3C", "#2E7D32", "#1B5E20"];
        let blue = ["#9FA8DA", "#7986CB", "#5C6BC0", "#3F51B5", "#3949AB", "#303F9F", "#283593", "#1A237E"];

        if (amount) {
            return green[i % green.length];
        } else {
            return blue[i % blue.length];
        }
    }

    let svg = d3.select("#viz").append("svg")

    let charts = svg.selectAll(".chart")
        .data(cells)
        .enter().append("g")
        .attr("class", "chart")

    let titles = charts.append("text")
        .attr("class", "title")

    let xAxes = charts.append("g")
        .attr("class", "axis axis-x")

    let yAxes = charts.append("g")
        .attr("class", "axis axis-y")

    function redraw() {

        // TODO
        let bbox = divisionInput.node().getBoundingClientRect();
        //let divisionBox = document.querySelector("#divisions-autocomplete")
        divisionDropdown
            .style("width", divisionInput.node().getBoundingClientRect().width + "px")
            .style("max-height", (d) => {
                let wHeight = document.querySelector("body").clientHeight
                    //- document.querySelector("#nav-bottom").clientHeight;
                return (wHeight - (bbox.y + bbox.height) - 24) + "px";
            })
            .style("top", (d) => (bbox.y + bbox.height) + "px")
            .style("left", (d) => bbox.x + "px")

        keywordDropdown
            .style("max-width", keywordContainer.node().getBoundingClientRect().width + "px");

        let m = {left: 24, right: 24, top: 24, bottom: 24};

        let width = document.querySelector("#viz").clientWidth - m.left - m.right;
        let height = document.querySelector("#viz").clientHeight - m.left - m.right;
        svg.attr("width", width)
            .attr("height", height);

        let margin = {top: 30, right: 30, bottom: 20, left: 40};

        charts.attr("transform", (c) => "translate("
                + (c.pos[0]*width/2 + margin.left) + ","
                + (c.pos[1]*height/2 + margin.top) + ")")

        let chartWidth = width/2 - margin.left - margin.right;
        let chartHeight = height/2 - margin.top - margin.bottom;

        titles.text((c) => c.title(visPercent))
            .attr("x", chartWidth / 2)
            .attr("y", -5)
            .attr("text-anchor", "middle");

        xAxes.attr("transform", "translate(0, " + chartHeight + ")")
            .call((c) => d3.axisBottom(c.x).tickFormat(d3.format("d")));

        yAxes.call((c) => d3.axisLeft(c.y).ticks(5));
        // initialize visualization
        cells.forEach((cell, i) => {

            cell.chart = d3.select(charts.nodes()[i])

            let data = [2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017]

            cell.x = d3.scaleBand()
                    .rangeRound([0, chartWidth])
                    .domain(data)
                    .padding(0.1);

            // TODO
            //cell.oldY = cell.y;
            //console.log(cell.oldY)
            cell.y = d3.scaleLinear()
                    .rangeRound([chartHeight, 0])
                    .domain([1, 0]);

            // let bars = cell.chart.selectAll(".bar")
            //     .data(data)
            //     .enter().append("rect")
            //     .attr("class", "bar")
            //     .attr("x", (d) => { return cell.x(d.year); })
            //     .attr("width", cell.x.bandwidth())
            //     .attr("y", (d) => { return cell.chartHeight; })
            //     .attr("height", (d) => { return 0; })
        });

    }

    redraw();

    let rtime;
    let timeout = false;
    let delta = 100;

    d3.select(window).on("resize", () => {
        rtime = new Date();
        if (timeout == false) {
            timeout = true;
            setTimeout(resizeEnd, delta);
        }
    });

    function resizeEnd() {
        if (new Date() - rtime < delta) {
            setTimeout(resizeEnd, delta);
        } else {
            timeout = false;
            redraw();
            plot(visData, visPercent);
        }
    };

    function getData() {

        let spinner = d3.select("#spin")
            .style("display", "block");

        svg.transition().duration(200).style("opacity", 0.4);

        let toggleVal = (d3.select("#any-all").property("checked") == true) ? "all" : "any";
        let terms = keywordInstance.chipsData.map((c) => encodeURIComponent(c.tag)).join(",");
        let route = `/${toggleVal}/${terms}`;
        window.history.pushState({}, document.title, route);

        let searchResult = new XMLHttpRequest();

        searchResult.open("GET", "/search" + route, true);
        searchResult.setRequestHeader("Content-Type", "application/json;charset=UTF-8");

        searchResult.onload = function() {
            spinner.style("display", "none");
            svg.transition().duration(200).style("opacity", 1);
            visData = JSON.parse(searchResult.response);
            reorder(visData, "grants", 1);
            plot(visData, visPercent);
        };

        searchResult.send();
    };

    function reorder(data, val, order, p) {

        if (!data.total_grants) return;

        if (val === "amount") {
            data = data.total_amount;
            format = p ? d3.format(".2%") : d3.format("$.2s");
        }
        else if (val === "grants") {
            data = data.total_grants;
            format = p ? d3.format(".2%") : d3.format(".2s");
        }

        if (val === "name") {
            divisionList = divisionList.sort((a, b) => {
                return a.name
                    .toLowerCase()
                    .localeCompare(b.name.toLowerCase());
            })
        } else {
            divisionList = divisionList.sort((a, b) => {
                aVal = data[a.name];
                if (!aVal) aVal = 0;
                bVal = data[b.name];
                if (!bVal) bVal = 0;
                return order * (bVal - aVal);
            })
            divisionList
                .classed("hide", d => !data[d.name])
                .attr("data-index", (d, i) => i)
                .select(".amount")
                .text(d => format(data[d.name]));
        }
    }


    function plot(data, percent, updateIdx, enter) {

        let toggleButton = d3.select("#toggle-view");

        d3.selectAll(".chart")
            .data(cells)
            .select(".title")
            .text((d) => d.title(percent));

        let prev;

        let filteredDivs = divisionList.data().filter(d => d.checked).map(d => {
            let div = data[2007][d.name];
            if (updateIdx && div && div.index > -1 && div.index < updateIdx) prev = d;
            return d.name;
        })

        console.log(prev);

        cells.forEach((cell, i) => {

            if (cell.filtered) divs = filteredDivs;
            else divs = ["all"];

            cell.prevTotals = cell.totals;
            cell.totals = [];
            cell.stacked = d3.stack()
                .keys(divs)
                .value((value, key) => cell.value(value.data, key, value.norm))
                (Object.keys(data).filter(y => !isNaN(y)).map((y) => {
                    let total = divs.map((d) => {
                        if (!data[y][d]) return 0;
                        else if (cell.amount) return data[y][d].match_amount;
                        else return data[y][d].match_grants;
                    }).reduce((a, b) => a + b, 0);
                    let norm;
                    if (percent) {
                        norm = divs.map((d) => {
                            if (!data[y][d]) return 0;
                            else if (cell.amount) return data[y][d].total_amount;
                            else return data[y][d].total_grants;
                        }).reduce((a, b) => a + b, 0);
                    } else {
                        norm = 1;
                    }
                    cell.totals.push(total);
                    return {year: y, total: total, norm: norm, data: data[y]};
                }));

            if (cell.stacked.length == 0) return 0;
            cell.maxData = Math.max.apply(null,
                cell.stacked[cell.stacked.length - 1].map((d) => {
                    return d[1];
                })
            );

            if (i % 2 == 1) {
                if (cells[i-1].maxData > cell.maxData) {
                    cell.maxData = cells[i-1].maxData;
                } else {
                    cells[i-1].maxData = cell.maxData;
                }
            }
        });

        cells.forEach((cell, i) => {

            cell.x.domain(Object.keys(data).filter(y => !isNaN(y)).sort());
            cell.y.domain([0, cell.maxData]);

            cell.chart.select(".axis-x")
                .transition()
                .duration(500)
                .call(d3.axisBottom(cell.x).tickFormat(d3.format("d")));

            cell.chart.select(".axis-y")
                .transition()
                .duration(500)
                .call(d3.axisLeft(cell.y).ticks(5).tickFormat(cell.tick(percent)));

            let barGroup = cell.chart.selectAll(".bar-group")
                .data(cell.stacked, (d) => d.key);

            barGroup.exit()
                .transition()
                .duration(500)
                .remove()
                .selectAll(".bar")
                .attr("y", (d, i) => cell.y(d[0]))
                //.attr("y", (d, i) => { console.log(i); return cell.y((cell.prevTotals[i] / cell.totals[i]) * d[0]); })
                //.attr("y", (d, i) => { console.log(i); return cell.y((cell.totals[i] - d[0]) / (cell.prevTotals[i] - d[0]) * d[0]); })
                //.attr("y", (d) => {
                //    if (y2.length) return cell.y(y2[i]);
                //    else return cell.y(d[0]);
                //})
                .attr("height", (d) => 0);

            barGroup = barGroup.enter().append("g")
                .merge(barGroup)
                .attr("class", "bar-group")

            let oldY = {}
            let y2 = []

            let bars = barGroup.selectAll(".bar")
                .data(div => div.map(d => {
                   let data = {
                        0: d[0],
                        1: d[1],
                        total: d.data.total,
                        norm: d.data.norm,
                        year: +d.data.year,
                        key: div.key,
                        index: d.data.data[div.key] ? d.data.data[div.key].index : -1
                    };
                    if (prev && data.key === prev.name) {
                        oldY[data.year] = data[1];
                        y2.push(data[1]);
                    }
                    return data;
                }), d => d.year);

            bars.transition().duration(500)
                .attr("x", (d) => cell.x(d.year))
                .attr("width", cell.x.bandwidth())
                .attr("y", (d) => cell.y(d[1]))
                .attr("height", (d) => cell.y(d[0]) - cell.y(d[1]))

            let barsEnter = bars.enter().append("rect")
                .attr("class", "bar")
                .attr("x", (d) => cell.x(d.year))
                //.attr("y", (d, i) => { console.log(i); return cell.y((cell.totals[i] - d[0]) / (cell.prevTotals[i] - d[0]) * d[0]); })
                //.attr("y", (d, i) => cell.y(d[0]))
                .attr("y", (d, i) => {
                    //console.log(y2);
                    if (y2.length) return cell.y(y2[i]);
                    else return cell.y(d[0]);
                })
                .attr("width", cell.x.bandwidth())
                .attr("height", (d) => 0)

            barsEnter
                .transition().duration(500)
                .attr("y", (d) => cell.y(d[1]))
                .attr("height", (d) => cell.y(d[0]) - cell.y(d[1]))

            bars = barsEnter.merge(bars)
                .attr("fill", (d) => getColor(d.index, cell.amount))
                .on("mouseover", (d) => {
                    tooltip.transition()
                        .duration(200)
                        .style("opacity", 1);
                    tooltip.html(() => cell.tip(d[1] - d[0], percent, d.key, d.total/d.norm))
                })
                .on("mousemove", (d) => {
                   let bbox = tooltip.node().getBoundingClientRect();
                    tooltip.style("left", (d3.event.pageX - bbox.width / 2) + "px")
                        .style("top", (d3.event.pageY - bbox.height - 8) + "px");
                })
                .on("mouseout", (d) => {
                    tooltip.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
      });

    }

    function getSuggestions(data) {
        if(data.length == 0) {
            d3.select("#suggested-keywords")
                .selectAll(".chip")
                .remove();
            return;
        }

        keywords = data.map(d => d.tag);

        let searchResult = new XMLHttpRequest();
        searchResult.open("POST", "/suggestions", true);
        searchResult.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        searchResult.onload = function() {
            let chips = searchResult.response.split(",");

            let suggested = d3.select("#suggested-keywords")
                .selectAll(".chip")
                .data(chips, (d) => d);

            suggested.exit().remove()

            suggested.enter().append("div")
                .attr("class", "chip")
                .attr("vertical-align", "middle")
                .text((d) => d)
                .append("i")
                .attr("class", "close material-icons")
                .text("add")
                .on("mousedown", (d) => {
                    keywordInstance.addChip({tag: d});
                });

        };
        searchResult.send(JSON.stringify(keywords));
    }

    function getGrants() {

        d3.select("#grant-table tbody").selectAll("tr").remove();
        let message = d3.select("#table-message")
        message.style("display", "inline");

        let terms = keywordInstance.chipsData.map((c) => c.tag);

        let divisions = divisionList.data().filter(d => d.checked).map(d => d.name);

        if (divisions.length === 0) {
            message.text("Please select some divisions from the filter dropdown before downloading");
            return;
        }

        let toggleState = toggle.property("checked");

        message.text("Loading data...");
        d3.select("#grant-table tbody").selectAll("tr").remove();

        let searchResult = new XMLHttpRequest();
        searchResult.open("POST", "/grants", true);
        searchResult.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
        searchResult.onload = function() {
            message.style("display", "none");
            displayData(d3.csvParse(searchResult.response));
            d3.select("#csv-download").attr("href",
                    URL.createObjectURL(
                        new Blob(["\ufeff", searchResult.response])));
            d3.select("#csv-download").attr("download", "grants.csv");
        };
        searchResult.send(JSON.stringify({
            "terms": terms,
            "divisions": divisions,
            "toggle": toggleState
        }));
    };

    function displayData(data) {
        let dateFormat = d3.timeFormat("%b %Y");
        let dateParse = d3.timeParse("%Y-%m-%d");

        data.forEach(d => {
            d.date = dateParse(d.date);
            d.value = +d.value;
        })

        let rows = d3.select("#grant-table tbody").selectAll("tr")
            .data(data)
            .enter()
            .append("tr")

        rows.selectAll("td")
            .data((d) => {
                return ["title", "date", "value", "division"].map((c) => {
                    if (c == "value") return { column: c, value: "$" + d3.format(",")(d[c]) };
                    else if (c == "date") {
                        return { column: c, value: dateFormat(d[c]) }; }
                    else return { column: c, value: d[c] };
                });
            })
            .enter()
            .append('td')
            .text((d) => d.value);

        d3.selectAll("#grant-table thead th").on("click", function() {
            let tag = d3.select(this)
            d3.selectAll("#grant-table thead th").filter(function(d) { return this.innerText !== tag.text(); })
                .classed("sort-asc sort-desc", false);
            tag.attr("class", (d) => tag.classed("sort-desc") ? "sort-asc" : "sort-desc")

            let order = tag.classed("sort-desc") ? -1 : 1;

            if (tag.text() === "Grant Title") {
                rows = rows.sort((a, b) => -1 * order * a.title.toLowerCase().localeCompare(b.title.toLowerCase()))
            } else if (tag.text() === "Date") {
                rows = rows.sort((a, b) => {
                    if (a.date && b.date) return order*(a.date.getTime() - b.date.getTime());
                    else if (a.date) return order*1;
                    else if (b.date) return order*(-1);
                    else return 0;
                });
            } else if (tag.text() === "Amount") {
                rows = rows.sort((a, b) => {
                    if (a.value && b.value) return order * (a.value - b.value);
                    else if (a.value) return order * 1;
                    else if (b.value) return order * (-1);
                    else return 0;
                })
            } else if (tag.text() === "Division") {
                rows = rows.sort((a, b) => -1 * order * a.division.toLowerCase().localeCompare(b.division.toLowerCase()))
            }
        })
    }

});
