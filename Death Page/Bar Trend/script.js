document.addEventListener('DOMContentLoaded', function() {
    const years = ["2010", "2011", "2012", "2013", "2014", "2015", "2016", "2017", "2018", "2019", "2020", "2021"];
    const countrySelect = d3.select("#country-select");

    function loadCSV() {
        Promise.all([
            d3.csv("DRD1.csv"),
            d3.csv("DRD2.csv"),
            d3.csv("DRD3.csv")
        ]).then(function([overallData, maleData, femaleData]) {
            countrySelect.selectAll("option.country-option").remove();
            countrySelect.append("option")
                .attr("value", "Overall")
                .text("Overall");

            countrySelect.selectAll("option.country-option")
                .data(overallData.filter(d => d.Country !== "Overall"))
                .enter()
                .append("option")
                .attr("class", "country-option")
                .attr("value", d => d.Country)
                .text(d => d.Country);

            const margin = { top: 20, right: 100, bottom: 30, left: 40 },
                  width = 960 - margin.left - margin.right,
                  height = 500 - margin.top - margin.bottom;

            const svg = d3.select("#chart").append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
                .append("g")
                .attr("transform", `translate(${margin.left},${margin.top})`);

            const x = d3.scalePoint()
                .domain(years)
                .range([0, width]);

            const y = d3.scaleLinear()
                .range([height, 0]);

            const xAxis = d3.axisBottom(x);
            const yAxis = d3.axisLeft(y);

            svg.append("g")
                .attr("class", "x axis")
                .attr("transform", `translate(0,${height})`)
                .call(xAxis);

            svg.append("g")
                .attr("class", "y axis")
                .call(yAxis);

            const tooltip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0);

            function filterZeroValues(values) {
                return values.map((d, i) => d === 0 ? null : { value: d, year: years[i] }).filter(d => d !== null);
            }

            function updateChart(country) {
                const overallValues = filterZeroValues(years.map(year => +overallData.find(d => d.Country === country)[year + ".0"]));
                const maleValues = filterZeroValues(years.map(year => +maleData.find(d => d.Country === country)[year + ".0"]));
                const femaleValues = filterZeroValues(years.map(year => +femaleData.find(d => d.Country === country)[year + ".0"]));

                y.domain([0, d3.max([...overallValues, ...maleValues, ...femaleValues].map(d => d.value))]);

                svg.select(".y.axis").transition().duration(1000).call(yAxis);

                const line = d3.line()
                    .defined(d => d !== null)
                    .x(d => x(d.year))
                    .y(d => y(d.value));

                svg.selectAll(".line").remove();
                svg.selectAll(".dot").remove();

                const colors = {
                    "Overall": "black",
                    "Male": "blue",
                    "Female": "red"
                };

                const data = [
                    { values: overallValues, color: colors.Overall, gender: "Overall" },
                    { values: maleValues, color: colors.Male, gender: "Male" },
                    { values: femaleValues, color: colors.Female, gender: "Female" }
                ];

                data.forEach(d => {
                    const path = svg.append("path")
                        .datum(d.values)
                        .attr("class", "line")
                        .attr("d", line)
                        .style("stroke", d.color)
                        .style("stroke-width", d.gender === "Overall" ? "3" : "2")
                        .style("fill", "none");

                    const totalLength = path.node().getTotalLength();

                    path
                        .attr("stroke-dasharray", totalLength + " " + totalLength)
                        .attr("stroke-dashoffset", totalLength)
                        .transition()
                        .duration(1500)
                        .ease(d3.easeLinear)
                        .attr("stroke-dashoffset", 0);

                    svg.selectAll(`.dot-${d.color}`).remove();

                    svg.selectAll(`.dot-${d.color}`)
                        .data(d.values)
                        .enter().append("circle")
                        .attr("class", `dot-${d.color}`)
                        .attr("cx", d => x(d.year))
                        .attr("cy", d => y(d.value))
                        .attr("r", 5)
                        .style("fill", d.color)
                        .on("mouseover", function(event, value) {
                            tooltip.transition()
                                .duration(200)
                                .style("opacity", .9);
                            tooltip.html(`Country: ${country}<br>Year: ${value.year}<br>Gender: ${d.gender}<br>Number of drug-induced deaths: ${value.value}`)
                                .style("left", (event.pageX + 5) + "px")
                                .style("top", (event.pageY - 28) + "px");
                        })
                        .on("mouseout", function() {
                            tooltip.transition()
                                .duration(500)
                                .style("opacity", 0);
                        });
                });

                // Add legend
                svg.selectAll(".legend").remove();
                const legend = svg.selectAll(".legend")
                    .data(data)
                    .enter().append("g")
                    .attr("class", "legend")
                    .attr("transform", (d, i) => `translate(${width + 20},${i * 20})`);

                legend.append("rect")
                    .attr("x", 0)
                    .attr("width", 18)
                    .attr("height", 18)
                    .style("fill", d => d.color);

                legend.append("text")
                    .attr("x", 24)
                    .attr("y", 9)
                    .attr("dy", ".35em")
                    .style("text-anchor", "start")
                    .text(d => d.gender);
            }

            countrySelect.on("change", function() {
                const selectedCountry = d3.select(this).property("value");
                updateChart(selectedCountry);
            });

            updateChart("Overall");
        });
    }

    loadCSV();
});
