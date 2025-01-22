// ...existing code...

// Remove the DOMContentLoaded event listener that calls showBarChartRace() immediately
// document.addEventListener("DOMContentLoaded", function() {
//     showBarChartRace();
// });

// Now the bar chart is only displayed when explicitly called (e.g., via "See Past Trends" button).
// ...existing code...

function showBarChartRace() {
    // Set up dimensions and margins
    const margin = { top: 20, right: 200, bottom: 30, left: 200 },
        width = 1350 - margin.left - margin.right,
        height = 800 - margin.top - margin.bottom;

    // Clear any existing SVG to prevent multiple renders
    d3.select("#bar-chart-race").selectAll("*").remove();

    // Create SVG container
    const svg = d3.select("#bar-chart-race")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Load data
    d3.csv("data/TDI_trends.csv").then(data => {
        // Parse data
        const years = data.columns.slice(1);
        const countries = data.map(d => d.Country);

        const dataset = countries.map(country => {
            return years.map(year => {
                return { year: year, value: +data.find(d => d.Country === country)[year], country: country };
            });
        });

        // Flatten data for ease of use
        const flatData = dataset.flat();

        // Set up scales
        const x = d3.scaleLinear()
            .range([0, width]);

        const y = d3.scaleBand()
            .range([0, height])
            .padding(0.2);

        // Initial rendering
        let yearIndex = 0;
        let animation;
        let isPlaying = false;

        function update(year) {
            const yearData = flatData.filter(d => d.year === year)
                .sort((a, b) => b.value - a.value);

            const total = d3.sum(yearData, d => d.value);

            x.domain([0, d3.max(yearData, d => d.value)]);
            y.domain(yearData.map(d => d.country));

            // JOIN new data with old elements.
            const bars = svg.selectAll(".bar")
                .data(yearData, d => d.country);

            // EXIT old elements not present in new data.
            bars.exit().remove();

            // UPDATE old elements present in new data.
            bars.transition()
                .duration(500)
                .attr("y", d => y(d.country))
                .attr("width", d => x(d.value))
                .attr("height", y.bandwidth())
                .attr("fill", (d, i) => {
                    // if it’s the chosen country, highlight in a different color
                    return d.country === window.selectedCountryForBarChart ? "#e74c3c" : "#007acc";
                });

            // ENTER new elements present in new data.
            bars.enter()
                .append("rect")
                .attr("class", "bar")
                .attr("y", d => y(d.country))
                .attr("height", y.bandwidth())
                .attr("x", 0)
                .attr("width", d => x(d.value))
                .attr("fill", (d, i) => {
                    // if it’s the chosen country, highlight in a different color
                    return d.country === window.selectedCountryForBarChart ? "#e74c3c" : "#007acc";
                });

            // Labels
            const labels = svg.selectAll(".label")
                .data(yearData, d => d.country);

            labels.exit().remove();

            labels.transition()
                .duration(500)
                .attr("y", d => y(d.country) + y.bandwidth() / 2 + 5)
                .attr("x", d => x(d.value) + 5)
                .text(d => `${d.value} (${((d.value / total) * 100).toFixed(2)}%)`);

            labels.enter()
                .append("text")
                .attr("class", "label")
                .attr("y", d => y(d.country) + y.bandwidth() / 2 + 5)
                .attr("x", d => x(d.value) + 5)
                .attr("text-anchor", "start")
                .text(d => `${d.value} (${((d.value / total) * 100).toFixed(2)}%)`);

            // Country names
            const countryLabels = svg.selectAll(".country-label")
                .data(yearData, d => d.country);

            countryLabels.exit().remove();

            countryLabels.transition()
                .duration(500)
                .attr("y", d => y(d.country) + y.bandwidth() / 2 + 5)
                .attr("x", -10)
                .text(d => d.country);

            countryLabels.enter()
                .append("text")
                .attr("class", "country-label")
                .attr("y", d => y(d.country) + y.bandwidth() / 2 + 5)
                .attr("x", -10)
                .attr("text-anchor", "end")
                .text(d => d.country);

            // Year label
            svg.selectAll(".year-label").remove();

            svg.append("text")
                .attr("class", "year-label")
                .attr("x", width - 100)
                .attr("y", height - 20)
                .style("font-size", "6em")
                .style("font-weight", "bold")
                .style("opacity", 0.3) // Added opacity
                .text(year);
        }

        // Animation function
        function animate() {
            if (yearIndex < years.length) {
                update(years[yearIndex]);
                yearIndex++;
                animation = setTimeout(animate, 1000);
            } else {
                isPlaying = false;
                document.getElementById("control-button").innerText = "Replay";
            }
        }

        // Control button functionality
        document.getElementById("control-button").addEventListener("click", () => {
            if (isPlaying) {
                clearTimeout(animation);
                isPlaying = false;
                document.getElementById("control-button").innerText = "Play";
            } else {
                if (yearIndex >= years.length) {
                    yearIndex = 0;
                }
                isPlaying = true;
                document.getElementById("control-button").innerText = "Pause";
                animate();
            }
        });

        // Initial update
        update(years[yearIndex]);

        // Highlight selected country
        d3.select("#country-select").on("change", function() {
            window.selectedCountryForBarChart = this.value;
            update(years[yearIndex]);
        });
    });
}