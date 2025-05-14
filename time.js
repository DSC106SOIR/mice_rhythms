import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

export function renderTime(svgParent, tempData, actData) {
    const container = d3.select("#time-container");
    container.selectAll("*").remove(); // Clear old content

    const width = 1000;
    const height = 650;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .style("user-select", "none"); 

    svg.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -height / 2)
        .attr("y", 10)
        .attr("text-anchor", "middle")
        .attr("fill", "#eee")
        .text("Temperature");
    
        const background = svg.insert("rect", ":first-child") 
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#000")  
        .attr("class", "background");
    

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
        const minuteLabel = t === 1 ? "minute" : "minutes";
        const dayNumber = Math.floor((t - 1) / 1440) + 1;
        const timeInDay = t % 1440;
        const isDay = timeInDay >= 720 && timeInDay < 1440;
        const phase = isDay ? "Day" : "Night";

        const isEstrusDay = [2, 6, 10, 14].includes(dayNumber);
        const estrusLabel = isEstrusDay ? " – estrus day" : "";

        return `${t} ${minuteLabel} (${phase} ${dayNumber}${estrusLabel})`;
    }



    function updatePlot(time) {
        handle.attr("cy", sliderScale(time));
        timeText.text(formatTimeLabel(time));

        const timeInDay = time % 1440;
        const brightness = 0.5 + 0.5 * Math.sin((2 * Math.PI * timeInDay) / 1440);

        const dayColor = "#1a1a40";  
        const nightColor = "#2596be"; 
        const interpolate = d3.interpolateRgb(nightColor, dayColor);
        const backgroundColor = interpolate(brightness);

        background
        .attr("fill", backgroundColor)
        .attr("opacity", 0.3); // Already blended, no need for separate opacity


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

        // === Compute mean and draw horizontal lines ===
        const femaleMean = d3.mean(fData, d => d.temp);
        const maleMean = d3.mean(mData, d => d.temp);

        // Draw horizontal line for female mean
        femaleG.selectAll(".mean-line").data([femaleMean])
            .join("line")
            .attr("class", "mean-line")
            .attr("x1", 0)
            .attr("x2", plotWidth)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d))
            .attr("stroke", "#e78ac3")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,2")
            .attr("opacity", 0.5);

        // Draw text label for female mean
        femaleG.selectAll(".mean-label").data([femaleMean])
            .join("text")
            .attr("class", "mean-label")
            .attr("x", plotWidth - 5)
            .attr("y", d => yScale(d) - 5)
            .attr("text-anchor", "end")
            .attr("fill", "#e78ac3")
            .attr("font-size", "0.8rem")
            .attr("opacity", 0.6)
            .text(d => `Mean: ${d.toFixed(2)}°C`);

        // Draw horizontal line for male mean
        maleG.selectAll(".mean-line").data([maleMean])
            .join("line")
            .attr("class", "mean-line")
            .attr("x1", 0)
            .attr("x2", plotWidth)
            .attr("y1", d => yScale(d))
            .attr("y2", d => yScale(d))
            .attr("stroke", "#8da0cb")
            .attr("stroke-width", 1.5)
            .attr("stroke-dasharray", "4,2")
            .attr("opacity", 0.5);

        // Draw text label for male mean
        maleG.selectAll(".mean-label").data([maleMean])
            .join("text")
            .attr("class", "mean-label")
            .attr("x", plotWidth - 5)
            .attr("y", d => yScale(d) - 5)
            .attr("text-anchor", "end")
            .attr("fill", "#8da0cb")
            .attr("font-size", "0.8rem")
            .attr("opacity", 0.6)
            .text(d => `Mean: ${d.toFixed(2)}°C`);

    }

    let lastY = null;
    let velocity = 0;
    let animationId = null;
    let currentT = timeSteps[0];

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function animateMomentum() {
        velocity *= 0.95; // Friction
        if (Math.abs(velocity) < 0.1) {
            cancelAnimationFrame(animationId);
            return;
        }

        const newTime = clamp(currentT + velocity, timeSteps[0], timeSteps[timeSteps.length - 1]);
        currentT = Math.round(newTime);
        updatePlot(currentT);
        animationId = requestAnimationFrame(animateMomentum);
    }

    handle.call(d3.drag()
        .on("start", () => {
            if (animationId) cancelAnimationFrame(animationId);
            velocity = 0;
            lastY = null;
        })
        .on("drag", event => {
            const y = clamp(event.y, sliderScale.range()[1], sliderScale.range()[0]);
            const t = Math.round(sliderScale.invert(y));

            if (lastY !== null) {
                velocity = (lastY - event.y) * 0.01; // Calculate velocity (scaled)
                velocity *= 0.1;
            }
8
            currentT = t;
            updatePlot(t);
            lastY = event.y;
        })
        .on("end", () => {
            lastY = null;
            animationId = requestAnimationFrame(animateMomentum);
        })
    );

    updatePlot(timeSteps[0]);
}
