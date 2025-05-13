import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// === Constants ===
// Maximum number of points to display for high granularity (minute-level data)
const maxPoints = 1000;

// Mapping of granularity levels to their respective CSV files
const fileMap = {
    minute: 'temp_minutes.csv',
    hour: 'temp_hours.csv',
    '12hour': 'temp_halfdays.csv',
    day: 'temp_days.csv'
};

// Mapping of granularity levels to axis labels
const labelMap = {
    minute: 'Time (minutes)',
    hour: 'Time (hours)',
    '12hour': 'Time (12-hour intervals)',
    day: 'Time (days)'
};

// === Data Variables ===
// Temperature data for different granularities
let tempMinute, tempHour, temp12Hour, tempDay;
// Activity data for different granularities
let actMinute, actHour, act12Hour, actDay;

// === Chart Dimensions ===
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 800 - margin.top - margin.bottom;

// === SVG and Chart Area Setup ===
const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Axis groups
const xAxisG = chartArea.append("g").attr("transform", `translate(0,${height})`);
const yAxisG = chartArea.append("g");

// Axis labels
const xLabel = chartArea.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .attr("text-anchor", "middle");

const yLabel = chartArea.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -45)
    .attr("x", -height / 2)
    .attr("text-anchor", "middle")
    .text("Temperature");

// === Helpers ===

/**
 * Transforms raw CSV data into a long format suitable for visualization.
 * @param {Array} data - Raw data from the CSV file.
 * @returns {Array} Transformed data in long format.
 */
function transformToLongFormat(data) {
    const result = [];
    data.forEach(d => {
        const time = +d.time; // Convert time to a number
        Object.keys(d).forEach(key => {
            if (key !== "time" && key !== "estrus") { // Exclude non-data columns
                result.push({
                    time,
                    value: +d[key], // Convert value to a number
                    id: key, // Identifier for the data point
                    sex: key.startsWith("f") || key.startsWith("F") ? "female" : "male" // Determine sex
                });
            }
        });
    });
    return result;
}

/**
 * Determines the radius of circles based on granularity.
 * @param {string} granularity - The current granularity level.
 * @returns {number} The radius of the circles.
 */
function getRadius(granularity) {
    const radiusMap = {
        minute: 1,
        hour: 2,
        '12hour': 3,
        day: 4
    };
    return radiusMap[granularity] || 2; // Default radius is 2
}

/**
 * Determines the granularity level based on the zoom scale.
 * @param {number} scale - The current zoom scale.
 * @returns {string} The granularity level.
 */
function getGranularity(scale) {
    if (scale < 1.1) return "day";
    if (scale < 1.6) return "12hour";
    if (scale < 2.5) return "hour";
    return "minute";
}

/**
 * Draws the chart based on the selected granularity.
 * @param {string} granularity - The current granularity level.
 */
async function drawChart(granularity) {
    // Select the appropriate temperature and activity data
    let tempData = {
        minute: tempMinute,
        hour: tempHour,
        "12hour": temp12Hour,
        day: tempDay
    }[granularity];


    // =========================================
    // TODO: Use this data for point vibrations
    // =========================================
    let activityData = {
        minute: actMinute,
        hour: actHour,
        "12hour": act12Hour,
        day: actDay
    }[granularity];




    // Reduce the number of points for minute-level data
    if (granularity === "minute") {
        const step = Math.ceil(d3.max(tempData, d => d.time) / maxPoints);
        tempData = tempData.filter(d => d.time % step === 0);
    }

    // Define scales
    const xExtent = d3.extent(tempData, d => d.time);
    const xPadding = (xExtent[1] - xExtent[0]) * 0.01;
    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1]])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([34, 40]) // Temperature range
        .range([height, 0]);

    const colorScale = d => d.sex === "female" ? "#FF6F61" : "#6CA0DC"; // Color by sex
    const opacityScale = d3.scaleLinear()
        .domain(d3.extent(tempData, d => d.value))
        .range([0.4, 0.9]); // Opacity based on value

    const shouldSpread = (granularity === "12hour" || granularity === "day");
    const spreadAmount = shouldSpread ? (xScale(xExtent[1]) - xScale(xExtent[0])) / 100 : 0;

    // Update axes
    xAxisG.transition().duration(500).call(d3.axisBottom(xScale).ticks(10));
    yAxisG.transition().duration(500).call(d3.axisLeft(yScale));
    xLabel.text(labelMap[granularity]);

    // Bind data to circles
    const circles = chartArea.selectAll("circle")
        .data(tempData, d => d.id + "-" + d.time);

    // Enter selection
    circles.enter()
        .append("circle")
        .attr("cx", d => xScale(d.time) + (shouldSpread ? (Math.random() - 0.5) * spreadAmount : 0))
        .attr("cy", d => yScale(d.value))
        .attr("r", 0)
        .attr("fill", d => colorScale(d))
        .attr("opacity", 0)
        .transition()
        .duration(400)
        .attr("r", getRadius(granularity))
        .attr("opacity", d => opacityScale(d.value));

    // Update selection
    circles.transition()
        .duration(400)
        .attr("cx", d => xScale(d.time) + (shouldSpread ? (Math.random() - 0.5) * spreadAmount : 0))
        .attr("cy", d => yScale(d.value))
        .attr("r", getRadius(granularity))
        .attr("fill", d => colorScale(d))
        .attr("opacity", d => opacityScale(d.value));

    // Exit selection
    circles.exit()
        .transition()
        .duration(300)
        .attr("opacity", 0)
        .attr("r", 0)
        .remove();
}

// === Load All Data Once ===
(async () => {
    // Load temperature and activity data for all granularities
    const [
        minRaw, hourRaw, halfRaw, dayRaw,
        actMinRaw, actHourRaw, actHalfRaw, actDayRaw
    ] = await Promise.all([
        d3.csv("data/temp_minutes.csv"),
        d3.csv("data/temp_hours.csv"),
        d3.csv("data/temp_halfdays.csv"),
        d3.csv("data/temp_days.csv"),
        d3.csv("data/act_minutes.csv"),
        d3.csv("data/act_hours.csv"),
        d3.csv("data/act_halfdays.csv"),
        d3.csv("data/act_days.csv")
    ]);

    // Transform raw data into long format
    tempMinute = transformToLongFormat(minRaw);
    tempHour = transformToLongFormat(hourRaw);
    temp12Hour = transformToLongFormat(halfRaw);
    tempDay = transformToLongFormat(dayRaw);

    actMinute = transformToLongFormat(actMinRaw);
    actHour = transformToLongFormat(actHourRaw);
    act12Hour = transformToLongFormat(actHalfRaw);
    actDay = transformToLongFormat(actDayRaw);

    // Draw the initial chart with the highest granularity
    zoom.currentGranularity = "minute";
    drawChart("minute");
})();

// === Slider for Granularity Control ===
const granularityLevels = ["minute", "hour", "12hour", "day"];
const slider = document.getElementById("granularity-slider");
slider.addEventListener("input", () => {
    const granularity = granularityLevels[slider.value];
    drawChart(granularity);
});

// === Zoom Functionality ===
const zoom = d3.zoom()
    .scaleExtent([1, 20])
    .on("zoom", ({ transform }) => {
        const newScale = transform.k;
        const newGranularity = getGranularity(newScale);
        if (newGranularity !== zoom.currentGranularity) {
            zoom.currentGranularity = newGranularity;
            drawChart(newGranularity);
        }
    });

svg.call(zoom);
