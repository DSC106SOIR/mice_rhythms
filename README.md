# 🐭 Mice Rhythms: Exploring Temperature & Activity Patterns  
**Team SOIR** (Son, Owen, Ishita, Ryota)  
DSC 106 — Interactive Visualization

---

## 💡 Main Idea

**Mice Rhythms** is an interactive data visualization project designed to explore rhythmic body temperature patterns in female and male mice, incorporating contextual information from their activity levels and estrus cycle status. The project helps users visually uncover patterns related to **biological rhythms**, **day/night cycles**, and **hormonal variations** across different time granularities.

---

## ❓ Central Question

> **How do body temperature rhythms differ between male and female mice over time, in relation to circadian light cycles and the female estrus cycle?**

---

## 🎨 Visual Encoding (Marks & Channels)

| Variable             | Visual Encoding                                           |
|----------------------|------------------------------------------------------------|
| **Time**             | X-axis in Granularity Mode; vertical scrubber in Time Mode |
| **Temperature**      | Y-axis                                                     |
| **Sex**              | Color (Coral for Female, Blue for Male)                    |
| **Activity**         | Jitter intensity (wiggling motion of circles)              |
| **Temperature**      | Brightness / Opacity of circles                            |
| **Day/Night**        | Background shading (dark = day, light = night)             |
| **Estrus**           | Filter toggle: Estrus / Non-Estrus / All                   |
| **Time Scrubber**    | Vertical slider in Time Mode                               |
| **Granularity Slider** | Horizontal slider in Granularity Mode                   |

---

## 📊 Dataset

### 🔹 Raw Data

- 14 days × 1440 minutes = **20,160 time points**
- Four files:  
  - `female_temp.csv`  
  - `female_act.csv`  
  - `male_temp.csv`  
  - `male_act.csv`  
- Time = minute index since start  
- Estrus occurs on Days 2, 6, 10, and 14

---

### 🔹 Processed Data

To support smooth interaction, we pre-aggregated the raw data into four levels of granularity for both temperature and activity:

| File                | Granularity        | Rows |
|---------------------|--------------------|------|
| `temp_minutes.csv`  | Minute             | 20160 |
| `temp_hours.csv`    | Hour               | 336   |
| `temp_halfdays.csv` | 12-Hour (Half-Day) | 28    |
| `temp_days.csv`     | Day                | 14    |
| `act_minutes.csv`   | Minute             | 20160 |
| `act_hours.csv`     | Hour               | 336   |
| `act_halfdays.csv`  | 12-Hour (Half-Day) | 28    |
| `act_days.csv`      | Day                | 14    |

Each file contains:
- `time`: Time index
- Mouse columns (e.g., `F1` to `F13`, `M1` to `M13`)
- `estrus`: Boolean (`True` on Days 2, 6, 10, 14 for females)

---

## ✨ Key Features

### 🔁 Two Interactive Modes

**Granularity Mode**
- Switch between Minute, Hour, 12-Hour, and Day levels
- Filter by estrus cycle (All / Estrus / Non-Estrus)
- Explore broad and zoomed-out trends

**Time Mode**
- Use a vertical **slider** to scrub minute-by-minute
- Circle **size encodes activity**, background shows day vs. night

---

### 🎛️ Smooth Interactions

- **Debounced** granularity slider input reduces jitter and improves responsiveness  
- Smooth transitions across resolutions

---

### 🌈 Visual Design Highlights

- **Color-coded** by sex (pink = female, blue = male)  
- **Jitter animation** reveals activity variation  
- **Day/night bands** clarify circadian phase transitions

---

## ✅ Summary

Mice Rhythms offers an intuitive, interactive interface for exploring biological rhythms. Through thoughtful encoding and interactive design, users can investigate individual and group-level patterns related to **sex**, **activity**, **hormonal cycles**, and **circadian rhythms**.
