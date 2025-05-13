import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export function renderTime(svgParent, tempData, actData) {
    const container = d3.select("#time-container");
    container.selectAll("*").remove(); // Clear old content

    const width = 1000;
    const height = 600;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto");

    svg.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height / 2)
        .attr("y", 20)
        .attr("text-anchor", "middle")
        .attr("fill", "#eee")
        .text("Temperature");

    const margin = { top: 30, right: 80, bottom: 30, left: 60 };

    const plotHeight = (height - margin.top - margin.bottom - 60) / 2;
    const plotWidth = width - margin.left - margin.right;

    const femaleG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    const maleG = svg.append("g").attr("transform", `translate(${margin.left},${margin.top + plotHeight + 60})`);

    const xLabels = d3.range(1, 14).map(String);
    const xScale = d3.scalePoint().domain(xLabels).range([0, plotWidth]).padding(0.5);
    const yExtent = d3.extent(tempData, d => d.value); // auto-range
    const yScale = d3.scaleLinear().domain(yExtent).range([plotHeight, 0]);
    const rScale = d3.scaleLinear().domain([0, 100]).range([1.5, 12]);

    const actLookup = new Map(actData.map(d => [`${d.id}-${d.time}`, d.value]));
    const timeSteps = Array.from(new Set(tempData.map(d => d.time))).sort((a, b) => a - b);

    const sliderScale = d3.scaleLinear()
        .domain(d3.extent(timeSteps))
        .range([height - margin.bottom, margin.top]);

    const slider = svg.append("g")
        .attr("transform", `translate(${width - 40},0)`);

    slider.append("line")
        .attr("y1", sliderScale.range()[1])
        .attr("y2", sliderScale.range()[0])
        .attr("stroke", "#999");

    const handle = slider.append("circle")
        .attr("r", 8)
        .attr("fill", "#ccc");

    const timeText = svg.append("text")
        .attr("class", "time-label")
        .attr("x", width - 45)
        .attr("y", margin.top - 10)
        .attr("fill", "#eee")
        .attr("text-anchor", "end");

    // === Axes ===
    femaleG.append("g").call(d3.axisLeft(yScale));
    femaleG.append("g").attr("transform", `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));
    maleG.append("g").call(d3.axisLeft(yScale));
    maleG.append("g").attr("transform", `translate(0,${plotHeight})`).call(d3.axisBottom(xScale));

    function formatTimeLabel(t) {
        const day = Math.floor((t - 1) / 1440) + 1;
        return `${t} minute (Day ${day})`;
    }

    function updatePlot(time) {
        handle.attr("cy", sliderScale(time));
        timeText.text(formatTimeLabel(time));

        const points = tempData.filter(d => d.time === time);
        const female = points.filter(d => d.sex === "female").sort((a, b) => a.id.localeCompare(b.id));
        const male = points.filter(d => d.sex === "male").sort((a, b) => a.id.localeCompare(b.id));

        const fData = female.map((d, i) => ({
            id: (i + 1).toString(),
            temp: d.value,
            activity: actLookup.get(`${d.id}-${d.time}`) || 0
        }));

        const mData = male.map((d, i) => ({
            id: (i + 1).toString(),
            temp: d.value,
            activity: actLookup.get(`${d.id}-${d.time}`) || 0
        }));

        femaleG.selectAll("circle").data(fData)
            .join("circle")
            .attr("cx", d => xScale(d.id))
            .attr("cy", d => yScale(d.temp))
            .attr("r", d => rScale(d.activity))
            .attr("fill", "#e78ac3");

        maleG.selectAll("circle").data(mData)
            .join("circle")
            .attr("cx", d => xScale(d.id))
            .attr("cy", d => yScale(d.temp))
            .attr("r", d => rScale(d.activity))
            .attr("fill", "#8da0cb");
    }

    handle.call(d3.drag().on("drag", event => {
        const y = Math.max(sliderScale.range()[1], Math.min(sliderScale.range()[0], event.y));
        const t = Math.round(sliderScale.invert(y));
        updatePlot(t);
    }));

    updatePlot(timeSteps[0]);
}
