# 🐭 Mice Rhythms: Exploring Temperature & Activity Patterns
**Team SOIR** (Son, Owen, Ishita, Ryota)  
DSC 106 — Interactive Visualization

---

## Main idea:

Mice Rhythms is an interactive data visualization project built to explore rhythmic temperature patterns in female and male mice, with additional context from their activity levels and estrus cycle status. The project is designed to help users visually uncover patterns in biological rhythms, day/night cycles, and hormone-related variations across different time granularities.

---

## Central Question

> **How do body temperature rhythms differ between male and female mice over time, in relation to circadian light cycles and the female estrus cycle?**

---

## Visual Encoding Design (Marks + Channels)

| Variable        | Visual Encoding                             |
|----------------|----------------------------------------------|
| **Time**        | X-axis                                       |
| **Temperature** | Y-axis                                       |
| **Sex**         | Color (e.g., Coral for Female, Blue for Male)|
| **Activity**    | Jitter intensity (how much point "wiggles")  |
| **Temperature** | Brightness / opacity of the point            |
| **Day/Night**   | Background shade (darker = night, lighter = day) |
| **Estrus**      | Filter to toggle between estrus / non-estrus / all |

---

## Dataset

### Raw data

- 20160 rows = 14 days × 1440 minutes
- Datasets:
  - `female_temp.csv`
  - `female_act.csv`
  - `male_temp.csv`
  - `male_act.csv`
- Time = row index (minutes since start)
- Estrus occurs every 4 days, starting from Day 2 (Days 2, 6, 10, 14)

### Processed data

From the raw temperature and activity files, we created **eight processed datasets** that support zoomable interaction and efficient rendering. Each variable (temperature, activity) is aggregated at four levels of granularity: minute, hour, 12-hour (half-day), and day.

| Filename              | Description                                          |
|-----------------------|------------------------------------------------------|
| `temp_minutes.csv`    | Raw minute-level temperature data (20160 rows)       |
| `temp_hours.csv`      | Hourly-aggregated temperature data (336 rows)        |
| `temp_halfdays.csv`   | 12-hour-aggregated temperature data (28 rows)        |
| `temp_days.csv`       | Daily-aggregated temperature data (14 rows)          |
| `act_minutes.csv`     | Raw minute-level activity data (20160 rows)          |
| `act_hours.csv`       | Hourly-aggregated activity data (336 rows)           |
| `act_halfdays.csv`    | 12-hour-aggregated activity data (28 rows)           |
| `act_days.csv`        | Daily-aggregated activity data (14 rows)             |

Each file contains:
- `time`: Time index (minute, hour, half-day, or day)
- One column per mouse (e.g., `F1`, `F2`, ..., `F13` for females, `M1`, `M2`, ..., `M13` for males)
- `estrus`: Boolean column — `True` for Days 2, 6, 10, 14 (female estrus days), `False` otherwise

---

## ✨ Features
### 🔹 Two Interactive Modes

- Granularity Mode: Allows users to switch between four temporal resolutions — Minute, Hour, 12-Hour, and Day. You can also filter by estrus cycle status (All, Estrus, Non-Estrus).

- Time Mode: Use a vertical scrubber to navigate minute-by-minute across the timeline. Circle size reflects activity, while background shading indicates day or night.

### 🔹 Smooth Visual Transitions

- Debounced slider interactions make transitions responsive and smooth, even at high resolutions.

### 🔹 Visual Enhancements

- Color-coded by sex (pink for female, blue for male)

- Jitter animation reveals how activity contributes to visible motion

- Day/night bands improve temporal readability
