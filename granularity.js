import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// Function to render the granularity chart
export function renderGranularity({
    granularity,
    view = "all",
    tempData,
    activityData,
    chartArea,
    xAxisG,
    yAxisG,
    xLabel,
    yLabel,
    width,
    height,
    maxPoints = 600
}) {
    const container = document.querySelector(".chart-wrapper");

    // Ensure controls are not duplicated
    let controlsWrapper = document.getElementById("granularity-controls");
    if (!controlsWrapper) {
        controlsWrapper = document.createElement("div");
        controlsWrapper.id = "granularity-controls";
        controlsWrapper.style.display = "flex"; // force flex layout
        controlsWrapper.style.gap = "2rem";
        container.prepend(controlsWrapper);
    }

    // Populate controls
    controlsWrapper.innerHTML = `
        <div id="slider-container">
            <label for="granularity-slider">Granularity:</label>
            <input type="range" id="granularity-slider" min="0" max="3" step="1" value="${["minute", "hour", "12hour", "day"].indexOf(granularity)}" />
            <div id="granularity-labels">
                <span>Minute</span>
                <span>Hour</span>
                <span>12-Hour</span>
                <span>Day</span>
            </div>
        </div>
        <div id="view-toggle" style="margin-top: 0.5em">
            <label for="view-select">View:</label>
            <select id="view-select">
                <option value="all" ${view === "all" ? "selected" : ""}>All Days</option>
                <option value="estrus" ${view === "estrus" ? "selected" : ""}>Estrus Days</option>
                <option value="non-estrus" ${view === "non-estrus" ? "selected" : ""}>Non-Estrus Days</option>
            </select>
        </div>
        <div id="legend-container"></div>
    `;

    // Event listeners for slider and view selection
    document.getElementById("granularity-slider").addEventListener("input", e => {
        const granularity = ["minute", "hour", "12hour", "day"][e.target.value];
        const view = document.getElementById("view-select").value;
        window.drawChart("granularity", granularity, view);
    });

    document.getElementById("view-select").addEventListener("change", e => {
        const view = e.target.value;
        const granularity = ["minute", "hour", "12hour", "day"][document.getElementById("granularity-slider").value];
        window.drawChart("granularity", granularity, view);
    });

    // Define scales and axes
    const labelMap = {
        minute: 'Time (minutes)',
        hour: 'Time (hours)',
        '12hour': 'Time (12-hour intervals)',
        day: 'Time (days)'
    };

    const getRadius = g => ({ minute: 1.2, hour: 2, '12hour': 4, day: 6 }[g] || 2);
    const jitterScale = { minute: 0.1, hour: 0.15, "12hour": 0.3, day: 0.4 }[granularity];

    const activityLookup = new Map(activityData.map(d => [`${d.id}-${d.time}`, d.value]));

    let data = tempData.map(d => {
        const activity = activityLookup.get(`${d.id}-${d.time}`) || 0;
        const isVisible = view === "estrus" ? d.estrus :
            view === "non-estrus" ? !d.estrus : true;
        return {
            ...d,
            activity,
            _opacity: isVisible ? null : 0.1
        };
    });

    if (granularity === "minute") {
        const step = Math.ceil(d3.max(data, d => d.time) / maxPoints);
        data = data.filter(d => d.time % step === 0);
    }

    const xExtent = d3.extent(tempData, d => d.time);
    const xPadding = (xExtent[1] - xExtent[0]) * 0.01;


    const xDomainStart = Math.floor(xExtent[0] / 1) * 1; // or Math.floor(xExtent[0])
    const xDomainEnd = Math.ceil(xExtent[1] / 1) * 1;

    const xScale = d3.scaleLinear()
        .domain([xDomainStart, xDomainEnd])
        .range([0, width]);
    const buffer = (xDomainEnd - xDomainStart) * 0.035;
    xScale.domain([xDomainStart - buffer, xDomainEnd + buffer]);

    // === Day/Night Background Bands ===
    chartArea.selectAll(".day-night-band").remove();


    if (granularity !== "day") {
        const timeMultiplier = {
            minute: 1 / 60,
            hour: 1,
            "12hour": 12
        }[granularity];

        const xMin = xExtent[0] * timeMultiplier;
        const xMax = xExtent[1] * timeMultiplier;
        const period = 12;

        const firstBandStart = Math.floor(xMin / period) * period;
        const bands = [];

        const timeSet = new Set(data.filter(d => d._opacity !== 0.1).map(d => d.time));
        for (let t = firstBandStart; t <= xMax; t += period) {
            const isDay = Math.floor((t - firstBandStart) / period) % 2 === 1;

            // Check if any time from this band exists in the visible dataset
            const bandStart = t / timeMultiplier;
            const bandEnd = (t + period) / timeMultiplier;
            const hasVisiblePoints = [...timeSet].some(time => time >= bandStart && time < bandEnd);

            bands.push({
                x0: t,
                x1: t + period,
                isDay,
                fill: isDay ? "#2596be" : "#1a1a40",
                opacity: hasVisiblePoints ? (isDay ? 0.08 : 0.3) : 0.01
            });
        }



        chartArea.selectAll(".day-night-band")
            .data(bands)
            .enter()
            .append("rect")
            .attr("class", "day-night-band")
            .attr("x", d => xScale(d.x0 / timeMultiplier))
            .attr("y", 0)
            .attr("width", d => xScale(d.x1 / timeMultiplier) - xScale(d.x0 / timeMultiplier))
            .attr("height", height)
            .attr("fill", d => d.fill)
            .attr("opacity", d => d.opacity)
            .lower();

    }


    const yScale = d3.scaleLinear()
        .domain([34.5, 39.5])
        .range([height, 0]);

    const colorScale = d => d.sex === "female" ? "#FF6F61" : "#6CA0DC";
    const opacityScale = d3.scaleLinear()
        .domain(d3.extent(tempData, d => d.value))
        .range([0.2, 0.9]);

    // Update axes
    xAxisG.transition().duration(500).call(d3.axisBottom(xScale).ticks(10));
    yAxisG
        .transition().duration(500)
        .attr("transform", `translate(0, 0)`)
        .call(d3.axisLeft(yScale));

    xLabel.text(labelMap[granularity]);

    // Render circles for data points
    const circles = chartArea.selectAll("circle")
        .data(data, d => d.id + "-" + d.time);


    const timeShift = granularity === "12hour" ? 0.5 : 0;  // Shift by 6 to center the 12-hour intervals

    circles.join(
        enter => enter.append("circle")
            .attr("cx", d => xScale(d.time + timeShift))
            .attr("cy", d => yScale(d.value))
            .attr("r", 0)
            .attr("fill", d => colorScale(d))
            .attr("opacity", 0)
            .call(enter => enter.transition().duration(500)
                .attr("r", getRadius(granularity))
                .attr("opacity", d => d._opacity ?? opacityScale(d.value))
            ),
        update => update.transition().duration(500)
            .attr("cx", d => xScale(d.time + timeShift))
            .attr("cy", d => yScale(d.value))
            .attr("r", getRadius(granularity))
            .attr("fill", d => colorScale(d))
            .attr("opacity", d => d._opacity ?? opacityScale(d.value)),
        exit => exit.remove()
    );

    // Add jitter effect for better visualization
    if (window._wiggleInterval) clearInterval(window._wiggleInterval);

    window._wiggleInterval = setInterval(() => {
        chartArea.selectAll("circle")
            .each(function (d) {
                const jitterX = (Math.random() - 0.5) * d.activity * jitterScale;
                const jitterY = (Math.random() - 0.5) * d.activity * jitterScale;
                d._wiggleX = jitterX;
                d._wiggleY = jitterY;
            })
            .attr("cx", d => xScale(d.time + timeShift) + (d._wiggleX || 0))
            .attr("cy", d => yScale(d.value) + (d._wiggleY || 0));
    }, 100);

    // === Legend Setup ===
    const legendG = d3.select("#legend-container")
        .append("svg")
        .attr("width", 200)
        .attr("height", 100)
        .append("g")
        .attr("transform", "translate(0, 10)");


    // Color scale: Female / Male
    const sexes = [
        { label: "Female", color: "#FF6F61" },
        { label: "Male", color: "#6CA0DC" }
    ];

    legendG.selectAll(".sex")
        .data(sexes)
        .join("g")
        .attr("fill", "#f9f9f9")
        .attr("class", "sex")
        .attr("transform", (d, i) => `translate(0, ${i * 18})`)
        .each(function (d) {
            d3.select(this).append("circle")
                .attr("r", 6)
                .attr("cx", 24)
                .attr("cy", 0)
                .attr("fill", d.color);
            d3.select(this).append("text")
                .attr("x", 40)
                .attr("y", 3)
                .text(d.label)
                .style("font-size", "12px");
        });

    // Day/Night bands
    const bands = [
        { label: "Day", color: "#2596be" },
        { label: "Night", color: "#1a1a40" }
    ];

    legendG.selectAll(".band")
        .data(bands)
        .join("g")
        .attr("class", "band")
        .attr("transform", (d, i) => `translate(0, ${40 + i * 18})`)
        .each(function (d) {
            d3.select(this).append("rect")
                .attr("x", 15)
                .attr("y", -10)
                .attr("width", 20)
                .attr("height", 12)
                .attr("fill", d.color)
                .attr("opacity", d.label === "Day" ? 0.2 : 0.5);

            d3.select(this).append("text")
                .attr("x", 40)
                .attr("y", 0)
                .text(d.label)
                .style("font-size", "12px")
                .attr("fill", "#f9f9f9");
        });


    // Activity level jitter explanation (using lines or arrows)
    legendG.append("text")
        .attr("x", 15)
        .attr("y", 78)
        .text("More jitter → higher activity")
        .style("font-size", "12px");
}
