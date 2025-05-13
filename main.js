import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';

// === Constants ===
// Maximum number of points to display for high granularity (minute-level data)
const maxPoints = 600;

// Mapping of granularity levels to their respective CSV files
// This helps dynamically load the correct dataset based on the selected granularity
const fileMap = {
    minute: 'temp_minutes.csv',
    hour: 'temp_hours.csv',
    '12hour': 'temp_halfdays.csv',
    day: 'temp_days.csv'
};

// Mapping of granularity levels to axis labels
// Used to update the x-axis label dynamically based on the granularity
const labelMap = {
    minute: 'Time (minutes)',
    hour: 'Time (hours)',
    '12hour': 'Time (12-hour intervals)',
    day: 'Time (days)'
};

// === Data Variables ===
// These variables will hold the temperature and activity data for different granularities
let tempMinute, tempHour, temp12Hour, tempDay;
let actMinute, actHour, act12Hour, actDay;

// === Chart Dimensions ===
// Define the dimensions of the chart, including margins for axes and labels
const margin = { top: 40, right: 30, bottom: 50, left: 60 };
const width = 1000 - margin.left - margin.right;
const height = 600 - margin.top - margin.bottom;

// === SVG and Chart Area Setup ===
// Create an SVG element and set its dimensions and responsive behavior
const svg = d3.select("#chart")
    .append("svg")
    .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

// Create a group element (`<g>`) for the chart area, applying margins
const chartArea = svg.append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create groups for the x-axis and y-axis
const xAxisG = chartArea.append("g").attr("transform", `translate(0,${height})`);
const yAxisG = chartArea.append("g");

// Add labels for the x-axis and y-axis
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
 * Each row in the CSV is expanded into multiple rows, one for each data column.
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
 * Larger granularities (e.g., day) have larger circles for better visibility.
 * @param {string} granularity - The current granularity level.
 * @returns {number} The radius of the circles.
 */
function getRadius(granularity) {
    const radiusMap = {
        minute: 1.2,
        hour: 2,
        '12hour': 4,
        day: 8
    };
    return radiusMap[granularity] || 2; // Default radius is 2
}

/**
 * Draws the chart based on the selected granularity.
 * Updates the axes, scales, and circles in the chart.
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

    let activityData = {
        minute: actMinute,
        hour: actHour,
        "12hour": act12Hour,
        day: actDay
    }[granularity];

    // Map activity data to a lookup for fast access
    const activityLookup = new Map(activityData.map(d => [`${d.id}-${d.time}`, d.value]));

    // Downsample if minute-level
    let filteredTempData = tempData;
    if (granularity === "minute") {
        const step = Math.ceil(d3.max(tempData, d => d.time) / maxPoints);
        filteredTempData = tempData.filter(d => d.time % step === 0);
    }

    // Attach activity value to each temperature point
    filteredTempData.forEach(d => {
        d.activity = activityLookup.get(`${d.id}-${d.time}`) || 0;
    });

    // Granularity-based jitter scale
    const jitterScale = {
        minute: 0.1,
        hour: 0.15,
        "12hour": 0.3,
        day: 0.4
    }[granularity];

    // Define scales
    const xExtent = d3.extent(filteredTempData, d => d.time);
    const xPadding = (xExtent[1] - xExtent[0]) * 0.01;
    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1]])
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([34.5, 39.5]) // Temperature range
        .range([height, 0]);

    const colorScale = d => d.sex === "female" ? "#FF6F61" : "#6CA0DC"; // Color by sex
    const opacityScale = d3.scaleLinear()
        .domain(d3.extent(filteredTempData, d => d.value))
        .range([0.2, 0.9]); // Opacity based on temperature value

    // Update axes
    xAxisG.transition().duration(500).call(d3.axisBottom(xScale).ticks(10));
    yAxisG.transition().duration(500).call(d3.axisLeft(yScale));
    xLabel.text(labelMap[granularity]);

    // Bind data to circles
    const circles = chartArea.selectAll("circle")
        .data(filteredTempData, d => d.id + "-" + d.time);

    // Handle enter, update, and exit selections
    circles.join(
        enter => enter.append("circle")
            .attr("cx", d => xScale(d.time))
            .attr("cy", d => yScale(d.value))
            .attr("r", 0)
            .attr("fill", d => colorScale(d))
            .attr("opacity", 0)
            .call(enter => enter.transition().duration(800)
                .attr("r", getRadius(granularity))
                .attr("opacity", d => opacityScale(d.value))
            ),
        update => update
            .transition().duration(900)
            .attr("cx", d => xScale(d.time))
            .attr("cy", d => yScale(d.value))
            .attr("r", getRadius(granularity))
            .attr("fill", d => colorScale(d))
            .attr("opacity", d => opacityScale(d.value)),
        exit => exit
            .transition().duration(100)
            .attr("opacity", 0)
            .attr("r", 0)
            .remove()
    );

    // Clear any previous interval
    if (window._wiggleInterval) clearInterval(window._wiggleInterval);

    // Add jittering (wiggling) effect to circles
    window._wiggleInterval = setInterval(() => {
        chartArea.selectAll("circle")
            .each(function(d) {
                const jitterX = (Math.random() - 0.5) * d.activity * jitterScale;
                const jitterY = (Math.random() - 0.5) * d.activity * jitterScale;

                d._wiggleX = jitterX;
                d._wiggleY = jitterY;
            })
            .attr("cx", d => xScale(d.time) + (d._wiggleX || 0))
            .attr("cy", d => yScale(d.value) + (d._wiggleY || 0));
    }, 100);
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
    drawChart("minute");
})();

// === Slider for Granularity Control ===
// Add an event listener to the slider to update the chart when the granularity changes
const granularityLevels = ["minute", "hour", "12hour", "day"];
const slider = document.getElementById("granularity-slider");
slider.addEventListener("input", () => {
    const granularity = granularityLevels[slider.value];
    drawChart(granularity);
});
