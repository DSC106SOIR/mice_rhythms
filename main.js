import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { renderGranularity } from './granularity.js';
import { renderTime } from './time.js';

// === Constants ===
const maxPoints = 600; // Maximum number of points to display
const granularityLevels = ["minute", "hour", "12hour", "day"]; // Granularity levels

// File mappings for temperature and activity data
const fileMap = {
    minute: 'data/json/temp_minutes.json',
    hour: 'data/json/temp_hours.json',
    '12hour': 'data/json/temp_halfdays.json',
    day: 'data/json/temp_days.json'
};

const actFileMap = {
    minute: 'data/json/act_minutes.json',
    hour: 'data/json/act_hours.json',
    '12hour': 'data/json/act_halfdays.json',
    day: 'data/json/act_days.json'
};

// === Globals ===
let tempDataMap = {}, actDataMap = {};
let chartComponents = {};  // To hold SVG + axis elements

// === Helpers ===
// Function to set up the chart container and SVG elements
function setupChart(containerId = "#granularity-container") {
    const container = document.querySelector(containerId);

    // Clear old chart wrapper but preserve controls
    const oldWrapper = container.querySelector(".chart-wrapper");
    if (oldWrapper) oldWrapper.remove();

    // Create a new chart wrapper
    const wrapper = document.createElement("div");
    wrapper.className = "chart-wrapper";
    container.appendChild(wrapper);

    // Set up SVG
    const svg = d3.select(wrapper)
        .append("svg")
        .attr("viewBox", "0 0 1000 600")
        .attr("preserveAspectRatio", "xMidYMid meet");

    const margin = { top: 40, right: 30, bottom: 50, left: 60 };
    const width = 1000 - margin.left - margin.right;
    const height = 600 - margin.top - margin.bottom;

    const chartArea = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    const xAxisG = chartArea.append("g")
        .attr("transform", `translate(0,${height})`);

    const yAxisG = chartArea.append("g");

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

    return { svg, chartArea, xAxisG, yAxisG, xLabel, yLabel, width, height };
}

// Function to load all data files
async function loadAllData() {
    const data = await Promise.all([
        ...granularityLevels.map(g => d3.json(fileMap[g])),
        ...granularityLevels.map(g => d3.json(actFileMap[g]))
    ]);

    granularityLevels.forEach((g, i) => {
        tempDataMap[g] = data[i];
        actDataMap[g] = data[i + 4];
    });
}

// Function to draw the chart based on the selected mode and granularity
function drawChart(mode, granularity, view = "all") {
    // Show/hide containers based on the mode
    const granularityDiv = document.getElementById("granularity-container");
    const timeDiv = document.getElementById("time-container");

    granularityDiv.style.display = mode === "granularity" ? "block" : "none";
    timeDiv.style.display = mode === "time" ? "block" : "none";

    if (mode === "granularity") {
        chartComponents = setupChart("#granularity-container");
        renderGranularity({
            granularity,
            view,
            tempData: tempDataMap[granularity],
            activityData: actDataMap[granularity],
            ...chartComponents
        });
    } else if (mode === "time") {
        renderTime(null, tempDataMap["minute"], actDataMap["minute"]);
    }
}

// Expose the drawChart function globally for event handlers
window.drawChart = drawChart;

// === Bootstrap ===
(async () => {
    await loadAllData();
    chartComponents = setupChart("#granularity-container");

    let currentMode = "granularity";
    drawChart("granularity", "minute", "all");

    const granularitySlider = document.getElementById("granularity-slider");
    const viewSelect = document.getElementById("view-select");

    // Event listeners for granularity slider and view selector
    granularitySlider.addEventListener("input", e => {
        if (currentMode !== "granularity") return;
        const granularity = granularityLevels[e.target.value];
        const view = viewSelect.value;
        drawChart("granularity", granularity, view);
    });

    viewSelect.addEventListener("change", e => {
        if (currentMode !== "granularity") return;
        const view = e.target.value;
        const granularity = granularityLevels[granularitySlider.value];
        drawChart("granularity", granularity, view);
    });

    // Event listeners for mode toggle buttons
    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            const selectedMode = btn.dataset.mode;

            // Update visual state
            document.querySelectorAll(".mode-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");

            // Toggle UI logic
            const granularity = granularityLevels[granularitySlider.value];
            const view = viewSelect.value;

            if (selectedMode === "granularity") {
                granularitySlider.disabled = false;
                viewSelect.disabled = false;
                drawChart("granularity", granularity, view);
            } else if (selectedMode === "time") {
                granularitySlider.disabled = true;
                viewSelect.disabled = true;
                drawChart("time");
            }
        });
    });
})();

