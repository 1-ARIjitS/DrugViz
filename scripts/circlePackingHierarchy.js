const width = 400;
const height = 400;

const color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(200, 74.00%, 84.90%)", "hsl(220, 71.90%, 22.40%)"]) // Lighter colors
    .interpolate(d3.interpolateHcl);

const highlightColor = "pink"; // Lighter highlight
const subcategoryHighlightColor = "lightgreen";

const pack = data => d3.pack()
    .size([width, height])
    .padding(3)
    (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));

d3.csv("data/TDI_categories_aggregated.csv").then(data => {
    const categories = {
        "GENDER": ["Males", "Females"],
        "FREQUENCY OF USE": ["Daily", "4 to 6 days per week", "2 to 3 days per week", "Once a week or less", "Not used in the last 30 days"],
        "MODE OF ADMINISTRATION": ["Inject", "Smoke / inhale", "Eat / drink", "Sniff"],
        "EMPLOYMENT STATUS": ["Occasionally employed", "Regularly employed", "Student", "Unemployed / discouraged", "Receiving social benefits / pensioners / house-makers / disable"],
        "LEVEL OF EDUCATION": ["Never went to school / never completed primary school (ISCED 0)", "Primary level of education (ISCED 1)", "Secondary level of education (ISCED 2 and ISCED 3)", "Higher education (ISCED 4 to ISCED 6)"]
    };

    const shortNames = {
        "4 to 6 days per week": "4-6 days/week",
        "2 to 3 days per week": "2-3 days/week",
        "Once a week or less": "Once/week or less",
        "Not used in the last 30 days": "monthly",
        "Smoke / inhale": "Smoke",
        "Eat / drink": "Eat/Drink",
        "Occasionally employed": "Occasional",
        "Regularly employed": "Regular",
        "Unemployed / discouraged": "Unemployed",
        "Receiving social benefits / pensioners / house-makers / disable": "Receiving benefits",
        "Never went to school / never completed primary school (ISCED 0)": "Never went to school",
        "Primary level of education (ISCED 1)": "Primary",
        "Secondary level of education (ISCED 2 and ISCED 3)": "Secondary",
        "Higher education (ISCED 4 to ISCED 6)": "Higher education"
    };

    const fullNames = {
        "4-6 days/week": "4 to 6 days per week",
        "2-3 days/week": "2 to 3 days per week",
        "Once/week or less": "Once a week or less",
        "monthly": "Not used in the last 30 days",
        "Smoke": "Smoke / inhale",
        "Eat/Drink": "Eat / drink",
        "Occasional": "Occasionally employed",
        "Regular": "Regularly employed",
        "Unemployed": "Unemployed / discouraged",
        "Receiving benefits": "Receiving social benefits / pensioners / house-makers / disable",
        "Never went to school": "Never went to school / never completed primary school (ISCED 0)",
        "Primary": "Primary level of education (ISCED 1)",
        "Secondary": "Secondary level of education (ISCED 2 and ISCED 3)",
        "Higher education": "Higher education (ISCED 4 to ISCED 6)"
    };
    
    const createHierarchy = (category) => ({
        name: "root",
        children: categories[category].map(subcategory => ({
            name: subcategory, // full subcategory name
            displayName: shortNames[subcategory] || subcategory, 
            children: data.map(d => ({
                name: d.Country,
                value: +d[subcategory] || 0 // Fallback to 0 if undefined
            }))
        }))
    });

    const hierarchies = {
        "GENDER": createHierarchy("GENDER"),
        "FREQUENCY OF USE": createHierarchy("FREQUENCY OF USE"),
        "MODE OF ADMINISTRATION": createHierarchy("MODE OF ADMINISTRATION"),
        "EMPLOYMENT STATUS": createHierarchy("EMPLOYMENT STATUS"),
        "LEVEL OF EDUCATION": createHierarchy("LEVEL OF EDUCATION")
    };

    const countries = Array.from(new Set(data.map(d => d.Country)));

    const countrySelect = d3.select("#country-select");
    const genderSelect = d3.select("#gender-select");
    const frequencySelect = d3.select("#frequency-select");
    const modeSelect = d3.select("#mode-select");
    const employmentSelect = d3.select("#employment-select");
    const educationSelect = d3.select("#education-select");

    countries.forEach(country => {
        countrySelect.append("option").text(country).attr("value", country);
    });

    countrySelect.on("change", function() {
        const selectedCountry = this.value;
        const isEnabled = selectedCountry !== "";
        genderSelect.property("disabled", !isEnabled);
        frequencySelect.property("disabled", !isEnabled);
        modeSelect.property("disabled", !isEnabled);
        employmentSelect.property("disabled", !isEnabled);
        educationSelect.property("disabled", !isEnabled);
        updateButtonState();
    });

    const dropdowns = [genderSelect, frequencySelect, modeSelect, employmentSelect, educationSelect];

    // New helper function to check selections and enable the button
    function updateButtonState() {
        const allSelected = dropdowns.every(d => d.property("value") !== "");
        button.property("disabled", !allSelected);
    }

    // Remove highlightSelection call from dropdown changes; just update button state
    dropdowns.forEach(dropdown => {
        dropdown.on("change", function() {
            updateButtonState();
        });
    });

    const svgContainers = {
        "GENDER": d3.select("#circle-packing-gender"),
        "FREQUENCY OF USE": d3.select("#circle-packing-frequency"),
        "MODE OF ADMINISTRATION": d3.select("#circle-packing-mode"),
        "EMPLOYMENT STATUS": d3.select("#circle-packing-employment"),
        "LEVEL OF EDUCATION": d3.select("#circle-packing-education")
    };

    const tooltip = d3.select("body").append("div")
        .attr("class", "tooltip")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("background", "white")
        .style("border", "1px solid #ccc")
        .style("border-radius", "5px")
        .style("padding", "10px")
        .style("box-shadow", "0px 4px 6px rgba(0, 0, 0, 0.1)")
        .style("pointer-events", "none");

    const showTooltip = (event, d) => {
        tooltip.style("opacity", 0.8)
            .html(getTooltipContent(d))
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
    };

    const hideTooltip = () => {
        tooltip.style("opacity", 0);
    };

    const getTooltipContent = (d) => {
        let content = `<strong>${fullNames[d.data.name] || d.data.name}</strong><br>Value: ${d.value}`;
        if (d.depth > 0) {
            const parentValue = d.parent.value;
            const percentage = ((d.value / parentValue) * 100).toFixed(2);
            content += `<br>Percentage: ${percentage}%`;
        }
        const path = d.ancestors().reverse().slice(1).map(d => d.data.name).join(" → ");
        content += `<br>Path: ${path}`;
        return content;
    };

    const renderChart = (data, container, categoryName) => {
        container.selectAll("*").remove();

        const root = pack(data);
        let focus = root;
        let view;
        const nodes = root.descendants();

        const svg = container.append("svg")
            .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
            .attr("width", width)
            .attr("height", height)
            .style("cursor", "pointer");

        // Optionally wrap SVG in a container with a class for subtle styling
        // For example, after "const svg = container.append("svg") { ... }":
        svg.style("box-shadow", "0 2px 5px rgba(0,0,0,0.1)");

        const circle = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("fill", d => {
                if (d.data && d.data.highlight) {
                    return d.data.highlight === "country" ? highlightColor : subcategoryHighlightColor;
                }
                return d.children ? color(d.depth) : "white";
            })
            .attr("pointer-events", "all")
            .on("mouseover", function (event, d) {
                d3.select(this).attr("stroke", "#000");
                showTooltip(event, d);
            })
            .on("mouseout", function () {
                d3.select(this).attr("stroke", null);
                hideTooltip();
            })
            .on("click", function (event, d) {
                if (focus !== d) zoom(event, d), event.stopPropagation();
            });

        const text = svg.append("g")
            .attr("pointer-events", "none")
            .selectAll("text")
            .data(nodes)
            .join("text")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            .style("display", d => d.parent === root ? "inline" : "none")
            .style("font-size", d => `${Math.min(16, Math.max(6, d.r / 4))}px`)
            .text(d => d.data.displayName || d.data.name);

        const zoomTo = v => {
            const k = width / v[2];

            view = v;

            circle.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            circle.attr("r", d => d.r * k);

            text.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            text.style("font-size", d => `${Math.min(16, Math.max(6, d.r * k / 4))}px`);
        };

        const zoom = (event, d) => {
            focus = d;

            const transition = svg.transition()
                .duration(750)
                .tween("zoom", () => {
                    const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                    return t => zoomTo(i(t));
                });

            text
                .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
                .transition(transition)
                .style("fill-opacity", d => d.parent === focus ? 1 : 0)
                .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
                .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
        };

        svg.on("click", (event) => zoom(event, root));

        zoomTo([root.x, root.y, root.r * 2]);

        container.append("div")
            .attr("class", "category-name")
            .text(categoryName);
    };

    function highlightSelection(country, gender, frequency, modes, employment, education) {
        window.selectedCountryForBarChart = country; // Make it globally accessible

        let allNodes = [];
        Object.keys(hierarchies).forEach(key => {
            const root = d3.hierarchy(hierarchies[key])
                .sum(d => d.value);
            const nodes = root.descendants();
            allNodes = allNodes.concat(nodes);

            // Clear previous highlights
            nodes.forEach(n => { n.data.highlight = null; });

            // Determine which user choice applies
            let chosenSubcat = "";
            if (key === "GENDER") chosenSubcat = gender;
            else if (key === "FREQUENCY OF USE") chosenSubcat = frequency;
            else if (key === "MODE OF ADMINISTRATION") chosenSubcat = modes;
            else if (key === "EMPLOYMENT STATUS") chosenSubcat = employment;
            else if (key === "LEVEL OF EDUCATION") chosenSubcat = education;

            // Find the selected subcategory node (trim if needed)
            const subCatNode = nodes.find(n => n.depth === 1 && n.data.name.trim() === chosenSubcat.trim());
            if (subCatNode) {
                subCatNode.data.highlight = "subcategory";
                // Highlight the selected country under that subcategory
                if (subCatNode.children) {
                    const countryNode = subCatNode.children.find(c => c.data.name === country);
                    if (countryNode) {
                        countryNode.data.highlight = "country";
                    }
                }
            }
            renderChart(hierarchies[key], svgContainers[key], key);
        });

        // Compute percentage
        const selectedNodes = allNodes.filter(n => n.data.highlight);
        const totalValue = selectedNodes.reduce((sum, node) => sum + (node.value || 0), 0);
        // Sum each category's root node
        const rootNodes = allNodes.filter(n => n.depth === 0);
        const totalAll = rootNodes.reduce((acc, n) => acc + (n.value || 0), 0);
        const totalPercentage = totalAll ? ((totalValue / totalAll) * 100).toFixed(2) : 0;

        const chancesElement = d3.select("#treatment-chances")
            .style("font-size", "40px") // Increase font size
            .text(`Your chance of getting treated: ${totalPercentage}%`);

        // Apply color coding
        if (totalPercentage < 20) chancesElement.style("color", "red");
        else if (totalPercentage < 50) chancesElement.style("color", "orange");
        else chancesElement.style("color", "green");
    }

    const button = d3.select("#calculate-button");
    // Initially remain disabled
    button.property("disabled", true);

    button.on("click", function() {
        const selectedCountry = fullNames[countrySelect.property("value")] || countrySelect.property("value");
        const selectedGender = fullNames[genderSelect.property("value")] || genderSelect.property("value");
        const selectedFrequency = fullNames[frequencySelect.property("value")] || frequencySelect.property("value");
        const selectedModes = fullNames[modeSelect.property("value")] || modeSelect.property("value");
        const selectedEmployment = fullNames[employmentSelect.property("value")] || employmentSelect.property("value");
        const selectedEducation = fullNames[educationSelect.property("value")] || educationSelect.property("value");

        const allSelected = [selectedCountry, selectedGender, selectedFrequency, selectedModes, selectedEmployment, selectedEducation].every(value => value !== "");

        if (allSelected) {
            countrySelect.property("disabled", true); // Also freeze country dropdown

            highlightSelection(selectedCountry, selectedGender, selectedFrequency, selectedModes, selectedEmployment, selectedEducation);
            dropdowns.forEach(d => d.property("disabled", true));
            button.property("disabled", true);
            d3.select("#reset-button").property("disabled", false);
            d3.select("#get-help-button").property("disabled", false);
            d3.select("#treatment-chances").style("display", "block"); // Ensure the card is displayed
        }
    });

    // Add event listener for the "Get Help" button
    d3.select("#get-help-button").on("click", function() {
        window.location.href = "https://find-a-drug-treatment-center.vercel.app/";
    });

    // Replace the reset logic
    const resetButton = d3.select("#reset-button");
    resetButton.on("click", function() {
        // Reset dropdowns
        dropdowns.forEach(d => {
            d.property("value", "");
            d.property("disabled", true);
        });
        countrySelect.property("value", "").property("disabled", false);

        // Remove highlights from circles
        Object.keys(hierarchies).forEach(key => {
            const root = d3.hierarchy(hierarchies[key]).sum(d => d.value);
            root.descendants().forEach(n => { n.data.highlight = null; });
            renderChart(hierarchies[key], svgContainers[key], key);
        });

        // Remove highlights from bar chart
        window.selectedCountryForBarChart = null;

        // Clear treatment chances display
        d3.select("#treatment-chances")
          .text("")
          .style("color", null)
          .style("font-size", null)
          .style("display", "none");

        // Ensure bar chart race, play button, and text are visible
        d3.select("#bar-chart-race-container").style("display", "block");
        d3.select("#control-button").style("display", "block");
        d3.select("#bar-chart-race-container p").style("display", "block");

        // Re-enable "Get Help" button
        d3.select("#get-help-button").property("disabled", false);

        // Clear highlights from circle chart and bar chart
        d3.selectAll("#circle-packings svg").each(function() {
            d3.select(this).selectAll("circle").attr("fill", function(d) {
                return d.children ? color(d.depth) : "white";
            });
        });
        d3.selectAll("#bar-chart-race svg").remove();
        showBarChartRace();
    });

    Object.keys(hierarchies).forEach(key => {
        renderChart(hierarchies[key], svgContainers[key], key);
    });
});