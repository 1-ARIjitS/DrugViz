const width = 700;
const height = 600;

const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height);

const tooltip = d3.select(".tooltip");
const legendArrow = d3.select(".legend-arrow");
const dataSelect = d3.select("#data-select");
const ageSelect = d3.select("#age-select");
const substanceSelect = d3.select("#substance-select");

let currentDataKey = "prevalence";
let currentDataset = "dataset1.csv";
let currentSubstance = "cannabis";
const highlightColor = "orange"; // Consistent highlight color

// Europe-specific projection
const projection = d3.geoMercator()
    .center([15, 55]) // Centered on Europe
    .scale(500) // Adjusted scale for Europe
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

// Adding a color scale for prevalence
const colorScale = d3.scaleSequential()
    .domain([0, 60]) // Adjust this range based on your data's min and max prevalence
    .interpolator(d3.interpolateReds); // Using red color scheme

const loadDataAndRenderMap = () => {
    d3.csv(currentDataset).then((data) => {
        // Format data
        data.forEach(d => {
            d.prevalence = +d["Prevalence (%)"];
            d.male = +d["Males (%)"];
            d.female = +d["Females (%)"];
        });

        // Load Europe GeoJSON data from new API
        d3.json("https://gist.githubusercontent.com/spiker830/3eab0cb407031bf9f2286f98b9d0558a/raw/7edae936285e77be675366550e20f9166bed0ed5/europe_features.json").then((geojson) => {
            const updateMap = () => {
                svg.selectAll("path")
                    .data(geojson.features)
                    .join("path")
                    .attr("d", path)
                    .attr("fill", d => {
                        const countryData = data.find(c => c.Country === d.properties.name); // Match by `properties.name`
                        return countryData ? colorScale(countryData[currentDataKey]) : "#ccc"; // Default to gray if no data
                    })
                    .attr("stroke", "black")
                    .attr("class", "country")
                    .on("mouseover", function (event, d) {
                        d3.select(this).attr("fill", highlightColor); // Highlight the entire country
                        const countryData = data.find(c => c.Country === d.properties.name);
                        if (countryData) {
                            tooltip
                                .style("opacity", 1)
                                .html(`
                                    <strong>Country:</strong> ${countryData.Country}<br>
                                    <strong>Year:</strong> ${countryData["Survey year"]}<br>
                                    <strong>${currentDataKey.charAt(0).toUpperCase() + currentDataKey.slice(1)}:</strong> ${countryData[currentDataKey]}%
                                `)
                                .style("left", `${event.pageX + 10}px`)
                                .style("top", `${event.pageY + 10}px`)
                                .style("visibility", "visible");

                            const legendX = legendScale(countryData[currentDataKey]);
                            legendArrow
                                .style("left", `${legendX + width / 2 - 280}px`) // Adjusted to move the arrow left
                                .style("top", `${height - legendHeight + 145}px`) // Adjusted to align the bottom of the arrow with the legend
                                .style("visibility", "visible");

                            // Highlight corresponding bar chart
                            d3.selectAll(".bar")
                                .filter(b => b.Country === countryData.Country)
                                .attr("fill", highlightColor);
                        }
                    })
                    .on("mousemove", (event) => {
                        tooltip.style("left", `${event.pageX + 10}px`)
                            .style("top", `${event.pageY + 10}px`)
                            .style("visibility", "visible");
                    })
                    .on("mouseout", function (event, d) {
                        const countryData = data.find(c => c.Country === d.properties.name);
                        d3.select(this).attr("fill", countryData ? colorScale(countryData[currentDataKey]) : "#ccc"); // Reset to original color
                        tooltip.style("opacity", 0)
                            .style("visibility", "hidden");
                        legendArrow.style("visibility", "hidden");

                        // Remove highlight from bar chart
                        d3.selectAll(".bar").attr("fill", "steelblue");
                    })
                    .on("click", function (event, d) {
                        const countryData = data.find(c => c.Country === d.properties.name);
                        if (countryData) {
                            alert(`Country: ${countryData.Country}`);
                        }
                    });
            };

            dataSelect.on("change", () => {
                currentDataKey = dataSelect.property("value");
                updateMap();
                updateLegend();
            });

            ageSelect.on("change", () => {
                currentDataset = ageSelect.property("value");
                loadDataAndRenderMap();
            });

            substanceSelect.on("change", () => {
                currentSubstance = substanceSelect.property("value");
                if (currentSubstance === "cannabis") {
                    ageSelect.selectAll("option")
                        .data([
                            { value: "dataset1.csv", text: "Young adults (15-34)" },
                            { value: "dataset2.csv", text: "All adults (15-64)" }
                        ])
                        .join("option")
                        .attr("value", d => d.value)
                        .text(d => d.text);
                    colorScale.domain([0, 60]); // Adjust color scale for cannabis
                } else {
                    ageSelect.selectAll("option")
                        .data([
                            { value: "dataset3.csv", text: "Young adults (15-34)" },
                            { value: "dataset4.csv", text: "All adults (15-64)" }
                        ])
                        .join("option")
                        .attr("value", d => d.value)
                        .text(d => d.text);
                    colorScale.domain([0, 20]); // Adjust color scale for cocaine
                }
                currentDataset = ageSelect.property("value");
                loadDataAndRenderMap();
                updateLegend();
            });

            const updateLegend = () => {
                legendSvg.selectAll("*").remove(); // Clear existing legend

                legendScale.domain(colorScale.domain());

                legendSvg.append("text")
                    .attr("x", legendWidth / 2)
                    .attr("y", -10)
                    .attr("text-anchor", "middle")
                    .attr("font-size", "12px")
                    .attr("fill", "black")
                    .text("Prevalence (%):");

                legendSvg.append("g")
                    .selectAll("rect")
                    .data(d3.range(legendWidth))
                    .enter()
                    .append("rect")
                    .attr("x", (d, i) => i)
                    .attr("y", 0)
                    .attr("width", 1)
                    .attr("height", legendHeight)
                    .attr("fill", (d, i) => colorScale(legendScale.invert(i)));

                legendSvg.append("g")
                    .attr("transform", `translate(0, ${legendHeight + 10})`) // Move the legend down slightly
                    .attr("class", "axis")
                    .call(legendAxis.scale(legendScale));
            };

            // Adding a legend
            const legendWidth = 300;
            const legendHeight = 10;

            const legendSvg = svg.append("g")
                .attr("transform", `translate(${width / 2 - 280}, ${height + 10})`); // Adjusted to move the legend left and down

            const legendScale = d3.scaleLinear()
                .domain(colorScale.domain())
                .range([0, legendWidth]);

            const legendAxis = d3.axisBottom(legendScale)
                .ticks(5)
                .tickFormat(d => `${d}%`);

            updateLegend(); // Initialize legend

            updateMap();
        });
    });
};

loadDataAndRenderMap();

// Function to render bar chart
const renderBarChart = (data, selector, maxY) => {
    const margin = { top: 20, right: 30, bottom: 60, left: 80 }; // Adjusted left margin for y-axis label
    const width = 600 - margin.left - margin.right; // Increased width for the bar charts
    const height = 300 - margin.top - margin.bottom;

    const svg = d3.select(selector)
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const x = d3.scaleBand()
        .domain(data.map(d => d.Country))
        .range([0, width])
        .padding(0.1);

    const y = d3.scaleLinear()
        .domain([0, maxY]) // Set the maximum value for the y-axis
        .nice()
        .range([height, 0]);

    svg.append("g")
        .selectAll(".bar")
        .data(data)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => x(d.Country))
        .attr("y", d => y(d["Prevalence (%)"]))
        .attr("width", x.bandwidth())
        .attr("height", d => height - y(d["Prevalence (%)"]))
        .attr("fill", "steelblue")
        .on("mouseover", function (event, d) {
            d3.select(this).attr("fill", highlightColor); // Highlight the bar
            tooltip
                .style("opacity", 1)
                .html(`
                    <strong>Country:</strong> ${d.Country}<br>
                    <strong>Year:</strong> ${d["Survey year"]}<br>
                    <strong>Prevalence:</strong> ${d["Prevalence (%)"]}%
                `)
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .style("visibility", "visible");

            // Highlight corresponding map region
            d3.selectAll(".country")
                .filter(c => c.properties.name === d.Country)
                .attr("fill", highlightColor);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`)
                .style("visibility", "visible");
        })
        .on("mouseout", function (event, d) {
            d3.select(this).attr("fill", "steelblue"); // Remove highlight
            tooltip.style("opacity", 0)
                .style("visibility", "hidden");

            // Remove highlight from map region
            d3.selectAll(".country").attr("fill", d => {
                const countryData = data.find(c => c.Country === d.properties.name);
                return countryData ? colorScale(countryData[currentDataKey]) : "#ccc"; // Reset to original color
            });
        });

    svg.append("g")
        .attr("class", "x-axis")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    svg.append("g")
        .attr("class", "y-axis")
        .call(d3.axisLeft(y));

    // Add labels
    svg.append("text")
        .attr("class", "x-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2) // Center the x-axis label
        .attr("y", height + margin.bottom - 10) // Move the x-axis label down
        .text("Country");

    svg.append("text")
        .attr("class", "y-axis-label")
        .attr("text-anchor", "middle")
        .attr("x", -margin.left + 20) // Move the y-axis label further to the left
        .attr("y", -margin.top - 18)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90)")
        .text("Prevalence (%)");
};

// Load and render bar charts
d3.csv("bar1.csv").then(data => {
    data.forEach(d => {
        d["Prevalence (%)"] = +d["Prevalence (%)"];
    });
    renderBarChart(data, "#bar-chart1", 60); // Set maxY to 60 for the first bar chart
});

d3.csv("bar2.csv").then(data => {
    data.forEach(d => {
        d["Prevalence (%)"] = +d["Prevalence (%)"];
    });
    renderBarChart(data, "#bar-chart2", 20); // Set maxY to 20 for the second bar chart
});
