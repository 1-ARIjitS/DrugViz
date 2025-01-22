const width = 1000;
const height = 1050;

const color = d3.scaleLinear()
    .domain([0, 5])
    .range(["hsl(190,80%,80%)", "hsl(228,30%,40%)"])
    .interpolate(d3.interpolateHcl);

const pack = data => d3.pack()
    .size([width, height])
    .padding(3)
    (d3.hierarchy(data)
        .sum(d => d.value)
        .sort((a, b) => b.value - a.value));
        
d3.csv("../data/TDI_categories_aggregated.csv").then(data => {
    const categories = {
        "GENDER": ["Males", "Females"],
        "AGE GROUP": ["young adults (Upto 34)", "adults (greater than 34)"],
        "FREQUENCY OF USE": ["Daily", "4 to 6 days per week", "2 to 3 days per week", "Once a week or less", "Not used in the last 30 days"],
        "MODE OF ADMINISTRATION": ["Inject", "Smoke / inhale", "Eat / drink", "Sniff"],
        "EMPLOYMENT STATUS": ["Occasionally employed", "Regularly employed", "Student", "Unemployed / discouraged", "Receiving social benefits / pensioners / house-makers / disable"],
        "LEVEL OF EDUCATION": ["Never went to school / never completed primary school (ISCED 0)", "Primary level of education (ISCED 1)", "Secondary level of education (ISCED 2 and ISCED 3)", "Higher education (ISCED 4 to ISCED 6)"]
    };

    const hierarchy1 = {
        name: "root",
        children: Array.from(d3.group(data, d => d.Country), ([country, records]) => ({
            name: country,
            children: Object.entries(categories).map(([category, subcategories]) => ({
                name: category,
                children: subcategories.map(subcategory => ({
                    name: subcategory,
                    value: +records[0][subcategory]
                }))
            }))
        }))
    };

    const hierarchy2 = {
        name: "root",
        children: Object.entries(categories).map(([category, subcategories]) => ({
            name: category,
            children: subcategories.map(subcategory => ({
                name: subcategory,
                children: data.map(d => ({
                    name: d.Country,
                    value: +d[subcategory]
                }))
            }))
        }))
    };

    let currentRoot = hierarchy1;

    const svg = d3.select("#circle-packing")
        .append("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .style("cursor", "pointer");

    let focus;
    let view;

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
        let content = `<strong>${d.data.name}</strong><br>Value: ${d.value}`;
        if (d.depth > 1) {
            const parentValue = d.parent.value;
            const percentage = ((d.value / parentValue) * 100).toFixed(2);
            content += `<br>Percentage: ${percentage}%`;
        }
        const path = d.ancestors().reverse().slice(1).map(d => d.data.name).join(" → ");
        content += `<br>Path: ${path}`;
        return content;
    };

    const renderChart = (data) => {
        svg.selectAll("*").remove();

        const root = pack(data);
        focus = root;
        const nodes = root.descendants();

        const circle = svg.append("g")
            .selectAll("circle")
            .data(nodes)
            .join("circle")
            .attr("fill", d => d.children ? color(d.depth) : "white")
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
            .style("font-size", d => `${Math.min(20, Math.max(8, d.r / 3))}px`)
            .text(d => d.data.name);

        const zoomTo = v => {
            const k = width / v[2];

            view = v;

            circle.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            circle.attr("r", d => d.r * k);

            text.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
            text.style("font-size", d => `${Math.min(20, Math.max(8, d.r * k / 3))}px`);
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
    };

    document.getElementById('hierarchy1').addEventListener('click', () => {
        currentRoot = hierarchy1;
        renderChart(currentRoot);
    });

    document.getElementById('hierarchy2').addEventListener('click', () => {
        currentRoot = hierarchy2;
        renderChart(currentRoot);
    });

    renderChart(currentRoot);
});
