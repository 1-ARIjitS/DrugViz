const mapWidth = 1200;
const mapHeight = 700;

const svg = d3.select("#map")
    .attr("width", mapWidth)
    .attr("height", mapHeight);

const tooltip = d3.select(".tooltip")
    .style("font-family", "Arial, sans-serif");

const dataSelect = d3.select("#data-select");
const countrySelect = d3.select("#map-country-select");

const hoverColor = "#FFD700";

let currentDataKey = "prevalence";
let selectedCountry = "overall";

const projection = d3.geoMercator()
    .center([15, 55])
    .scale(500)
    .translate([mapWidth / 2, mapHeight / 2]);

const path = d3.geoPath().projection(projection);

const colorScales = {
    prevalence: d3.scaleSequential().domain([0, 70]).interpolator(d3.interpolateBlues),
    male: d3.scaleSequential().domain([0, 70]).interpolator(d3.interpolateGreens),
    female: d3.scaleSequential()
        .domain([0, 35, 70])
        .interpolator(d3.interpolateRgbBasis(["#FFEBEE", "#FF5252", "#B71C1C"]))
};

let colorScale = colorScales[currentDataKey];

const loadDataAndRenderMap = () => {
    d3.csv("data/dataset.csv").then((data) => {
        const updateCountryDropdown = () => {
            countrySelect.selectAll("option:not(:first-child)").remove();
            countrySelect.selectAll("option")
                .data(data)
                .enter()
                .append("option")
                .attr("value", d => d.Country)
                .text(d => d.Country);
        };

        updateCountryDropdown();

        data.forEach(d => {
            d.prevalence = +d["Prevalence (%)_sum"];
            d.male = +d["Males (%)_sum"];
            d.female = +d["Females (%)_sum"];
        });

        d3.json("https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json").then((geojson) => {
            const updateMap = () => {
                svg.selectAll("path")
                    .data(geojson.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const countryData = data.find(c => c.Country === d.properties.name);
                        return countryData ? colorScale(countryData[currentDataKey]) : "#ccc";
                    })
                    .attr("stroke", "black")
                    .attr("class", "country")
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("fill", hoverColor);
                        const countryData = data.find(c => c.Country === d.properties.name);
                        if (countryData) {
                            tooltip
                                .style("opacity", 1)
                                .style("visibility", "visible")
                                .style("background", "white")
                                .html(`
                                    <strong>Country:</strong> ${countryData.Country}<br>
                                    <strong>${currentDataKey.charAt(0).toUpperCase() + currentDataKey.slice(1)}:</strong> ${countryData[currentDataKey]}%
                                `)
                                .style("left", `${event.pageX + 20}px`)
                                .style("top", `${event.pageY + 10}px`);
                        } else {
                            tooltip
                                .style("opacity", 1)
                                .style("visibility", "visible")
                                .style("background", "white")
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name}<br>
                                    <strong>No Data</strong>
                                `)
                                .style("left", `${event.pageX + 20}px`)
                                .style("top", `${event.pageY + 10}px`);
                        }
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("left", `${event.pageX + 20}px`)
                            .style("top", `${event.pageY + 10}px`)
                            .style("visibility", "visible");
                    })
                    .on("mouseout", function (event, d) {
                        if (selectedCountry === d.properties.name && selectedCountry !== "overall") {
                            return;
                        }
                        const countryData = data.find(c => c.Country === d.properties.name);
                        d3.select(this).attr("fill", countryData ? colorScale(countryData[currentDataKey]) : "#ccc");
                        tooltip.style("opacity", 0)
                            .style("visibility", "hidden");
                    });
            };

            const updateRiskCard = () => {
                const selectedCountryValue = countrySelect.property("value");
                const selectedGenderValue = dataSelect.property("value");
                if (selectedCountryValue !== "overall" && selectedGenderValue !== "prevalence") {
                    const countryData = data.find(c => c.Country === selectedCountryValue);
                    if (countryData) {
                        const riskValue = countryData[selectedGenderValue];
                        d3.select("#risk-value").text(riskValue);
                        d3.select("#risk-card").style("display", "block");
                        d3.select("#risk-card-overlay").style("display", "block"); // Show overlay

                        // 设置文本颜色
                        const riskPercentage = parseFloat(riskValue);
                        const riskCard = d3.select("#risk-card");
                        if (riskPercentage < 20) {
                            riskCard.style("color", "green");
                        } else if (riskPercentage >= 20 && riskPercentage <= 50) {
                            riskCard.style("color", "orange");
                        } else {
                            riskCard.style("color", "red");
                        }
                    }
                } else {
                    d3.select("#risk-card").style("display", "none");
                    d3.select("#risk-card-overlay").style("display", "none"); // Hide overlay
                }
            };

            countrySelect.on("change", () => {
                selectedCountry = countrySelect.property("value");
                if (selectedCountry === "overall") {
                    updateMap();
                    updateRiskCard();
                } else {
                    const countryData = data.find(c => c.Country === selectedCountry);
                    if (countryData) {
                        svg.selectAll("path")
                            .attr("fill", d => {
                                if (d.properties.name === selectedCountry) {
                                    return hoverColor;
                                }
                                const countryData = data.find(c => c.Country === d.properties.name);
                                return countryData ? colorScale(countryData[currentDataKey]) : "#ccc";
                            });

                        const countryPath = svg.selectAll("path").filter(d => d.properties.name === selectedCountry).node();
                        const bbox = countryPath.getBBox();

                        tooltip
                            .style("opacity", 1)
                            .style("background", "white")
                            .html(`
                                <strong>Country:</strong> ${countryData.Country}<br>
                                <strong>${currentDataKey.charAt(0).toUpperCase() + currentDataKey.slice(1)}:</strong> ${countryData[currentDataKey]}%
                            `)
                            .style("left", `${bbox.x + bbox.width / 2 +20}px`) // Move left
                            .style("top", `${bbox.y + bbox.height / 2 + 300}px`) // Move down
                            .style("visibility", "visible");

                        updateRiskCard();
                    }
                }
            });

            dataSelect.on("change", () => {
                currentDataKey = dataSelect.property("value");
                colorScale = colorScales[currentDataKey];
                updateLegend(); // 更新图例颜色
                updateMap();
                if (selectedCountry !== "overall") {
                    countrySelect.dispatch("change");
                }
                updateRiskCard();
            });

            const updateLegend = () => {
                legendSvg.selectAll("*").remove();

                legendScale.domain([0, 70]);

                legendSvg.append("text")
                    .attr("x", 0)
                    .attr("y", -10)
                    .attr("text-anchor", "start")
                    .attr("font-size", "12px")
                    .attr("fill", "black")
                    .style("font-family", "Arial, sans-serif")
                    .text("Prevalence (%):");

                legendSvg.append("g")
                    .selectAll("rect")
                    .data(d3.range(legendHeight))
                    .enter()
                    .append("rect")
                    .attr("x", 0)
                    .attr("y", (d, i) => i)
                    .attr("width", legendWidth)
                    .attr("height", 1)
                    .attr("fill", (d, i) => colorScale(legendScale.invert(i)));

                legendSvg.append("g")
                    .attr("transform", `translate(${legendWidth + 10}, 0)`)
                    .attr("class", "axis")
                    .call(d3.axisRight(legendScale).ticks(7).tickFormat(d => `${d}%`));

                // Add Total, Male, Female labels with corresponding colors
                const labels = [
                    { text: "Total", color: "blue" },
                    { text: "Male", color: "green" },
                    { text: "Female", color: "red" }
                ];

                labels.forEach((label, index) => {
                    legendSvg.append("rect")
                        .attr("x", 0)
                        .attr("y", legendHeight + 20 + index * 20)
                        .attr("width", legendWidth)
                        .attr("height", 10)
                        .attr("fill", label.color);

                    legendSvg.append("text")
                        .attr("x", legendWidth + 15)
                        .attr("y", legendHeight + 30 + index * 20)
                        .attr("text-anchor", "start")
                        .attr("font-size", "12px")
                        .attr("fill", "black")
                        .style("font-family", "Arial, sans-serif")
                        .text(label.text);
                });

                legendSvg.append("rect")
                    .attr("x", 0)
                    .attr("y", legendHeight + 80)
                    .attr("width", legendWidth)
                    .attr("height", 10)
                    .attr("fill", "#ccc");

                legendSvg.append("text")
                    .attr("x", legendWidth + 15)
                    .attr("y", legendHeight + 90)
                    .attr("text-anchor", "start")
                    .attr("font-size", "12px")
                    .attr("fill", "black")
                    .style("font-family", "Arial, sans-serif")
                    .text("No Data");
            };

            const updateRiskText = (value) => {
                d3.select("#risk-text")
                    .style("font-size", "24px")
                    .text(`Your risk of addiction to drugs: ${value}%`);

                // 设置文本颜色
                const riskPercentage = parseFloat(value);
                if (riskPercentage < 20) {
                    d3.select("#risk-text").style("color", "green");
                } else if (riskPercentage >= 20 && riskPercentage <= 50) {
                    d3.select("#risk-text").style("color", "orange");
                } else {
                    d3.select("#risk-text").style("color", "red");
                }
            };

            const legendWidth = 10;
            const legendHeight = 400;

            const legendSvg = svg.append("g")
                .attr("transform", `translate(${mapWidth - 250}, 100)`); // Move left

            const legendScale = d3.scaleLinear()
                .domain([0, 70])
                .range([legendHeight, 0]);

            updateLegend();

            updateMap();
        });
    });
};

loadDataAndRenderMap();
