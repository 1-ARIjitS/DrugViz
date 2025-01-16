// const width = 1000; // Fixed container width
const barHeight = 500;

// Configuring margins for the EU Youth bar chart
const youthMargin = { top: 80, right: 30, bottom: 40, left: 50 };
const youthBarWidth = width - youthMargin.left - youthMargin.right;

// Configuring margins for the main stacked bar chart
const stackedMargin = { top: 50, right: 100, bottom: 140, left: 350 }; // Increased left margin to shift the stacked bar chart
const stackedBarWidth = width - stackedMargin.left - stackedMargin.right;

// Creating the EU Youth bar chart
const youthBarSvg = d3.select("#youth-bar-chart")
    .append("svg")
    .attr("width", width)
    .attr("height", barHeight);

const youthBarChart = youthBarSvg.append("g")
    .attr("transform", `translate(${youthMargin.left}, ${youthMargin.top})`);

// Creating the main stacked bar chart
const barSvg = d3.select("#bar-chart")
    .append("svg")
    .attr("width", width + 300) // Adding extra width for the legend
    .attr("height", barHeight);

const barChart = barSvg.append("g")
    .attr("transform", `translate(${stackedMargin.left}, ${stackedMargin.top})`);

// Creating the color scale
const colorScale = d3.scaleOrdinal()
    .domain(["<25", "25-44", "45-64", "65+"])
    .range(["#e41a1c", "#ffd92f", "#4daf4a", "#377eb8"]);

// Adding tooltips
const tooltipBarChart = d3.select("#tooltip-bar-chart");
const tooltipYouthChart = d3.select("#tooltip-youth-chart");

// Loading data
d3.csv("../data/dataset1.csv").then(data => {
    // Converting data formats
    data.forEach(d => {
        d["<25"] = +d["<25"];
        d["25-44"] = +d["25-44"];
        d["45-64"] = +d["45-64"];
        d["65+"] = +d["65+"];
    });

    // EU Youth Bar Chart
    const youthXScale = d3.scaleBand()
        .domain(data.map(d => d.Country))
        .range([0, youthBarWidth])
        .padding(0.7); // Increasing bar spacing to make bars thinner

    const youthYScale = d3.scaleLinear()
        .domain([0, 40]) // Ensuring the height range is suitable for the bar chart
        .range([0, barHeight - youthMargin.top - youthMargin.bottom]);

    youthBarChart.selectAll("rect")
        .data(data)
        .enter()
        .append("rect")
        .attr("x", d => youthXScale(d.Country))
        .attr("y", 0)
        .attr("height", d => youthYScale(d["<25"]))
        .attr("width", youthXScale.bandwidth())
        .attr("fill", "darkred")
        .on("mouseover", function (event, d) {
            tooltipYouthChart
                .classed("hidden", false)
                .html(`
                    <strong>Country:</strong> ${d.Country}<br>
                    <strong>Year:</strong> ${d.Year}<br>
                    <strong>Percentage:</strong> ${d["<25"].toFixed(2)}%
                `);
        })
        .on("mousemove", function (event) {
            tooltipYouthChart
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        })
        .on("mouseout", function () {
            tooltipYouthChart.classed("hidden", true);
        });

    youthBarChart.append("g")
        .attr("transform", `translate(0, -20)`)
        .call(d3.axisTop(youthXScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "start");

    youthBarChart.append("g")
        .call(d3.axisLeft(youthYScale));

    // Main Stacked Bar Chart
    const xScale = d3.scaleBand()
        .domain(data.map(d => d.Country))
        .range([0, stackedBarWidth])
        .padding(0.02);

    const yScale = d3.scaleLinear()
        .domain([0, 100]) // Percentage scale
        .range([barHeight - stackedMargin.bottom, 0]);

    const stack = d3.stack()
        .keys(["<25", "25-44", "45-64", "65+"]);

    const stackedSeries = stack(data);

    barChart.selectAll("g")
        .data(stackedSeries)
        .enter()
        .append("g")
        .attr("fill", d => colorScale(d.key))
        .selectAll("rect")
        .data(d => d)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.data.Country))
        .attr("y", d => yScale(d[1]))
        .attr("height", d => yScale(d[0]) - yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .on("mouseover", function (event, d) {
            const dataPoint = d.data;
            const ageGroup = this.parentNode.__data__.key;
            tooltipBarChart
                .classed("hidden", false)
                .html(`
                    <strong>Country:</strong> ${dataPoint.Country}<br>
                    <strong>Year:</strong> ${dataPoint.Year}<br>
                    <strong>Age Group:</strong> ${ageGroup}<br>
                    <strong>Percentage:</strong> ${(d[1] - d[0]).toFixed(2)}%
                `);
        })
        .on("mousemove", function (event) {
            tooltipBarChart
                .style("left", `${event.pageX + 10}px`)
                .style("top", `${Math.max(10, event.pageY - 50)}px`);
        })
        .on("mouseout", function () {
            tooltipBarChart.classed("hidden", true);
        });

    barChart.append("g")
        .attr("transform", `translate(0, ${barHeight - stackedMargin.bottom})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");

    barChart.append("g")
        .call(d3.axisLeft(yScale)
            .tickFormat(d => `${d}%`) // Formatting Y axis as percentage
        );

    // Adding Y-axis title
    barChart.append("text")
        .attr("class", "y-axis-label")
        .attr("transform", "rotate(-90)")
        .attr("x", -(barHeight - stackedMargin.top - stackedMargin.bottom) / 2)
        .attr("y", -stackedMargin.left + 20)
        .attr("text-anchor", "middle")
        .style("font-size", "12px")
        .text("Percentage (%)");

    // Adding legend to the right of the stacked bar chart
    const legend = barSvg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${stackedBarWidth + 400}, 50)`); // Shifting legend to the right

    // Adding legend color squares and corresponding text
    legend.selectAll("rect")
        .data(colorScale.domain())
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", (d, i) => i * 20)
        .attr("width", 15)
        .attr("height", 15)
        .attr("fill", d => colorScale(d));

    legend.selectAll("text")
        .data(colorScale.domain())
        .enter()
        .append("text")
        .attr("x", 20)
        .attr("y", (d, i) => i * 20 + 12)
        .text(d => String(d)); // Ensuring full display of "<25"

}).catch(err => console.error("Error loading CSV:", err));
