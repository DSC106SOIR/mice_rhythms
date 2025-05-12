# Processed Data — Metadata

This folder contains **eight pre-aggregated datasets** derived from the raw mouse body temperature and activity data. These files are used in the interactive visualization to support zooming across different time resolutions and to animate physiological signals.

---

## Files

Each variable (temperature and activity) is saved at four levels of aggregation:

| Filename              | Aggregation Level | Rows   | Description                                |
|-----------------------|-------------------|--------|--------------------------------------------|
| `temp_minutes.csv`    | Minute-level       | 20160  | Raw temperature data (1 row per minute)    |
| `temp_hours.csv`      | Hour-level         | 336    | Averaged over 60-minute blocks             |
| `temp_halfdays.csv`   | 12-hour cycles     | 28     | Averaged over light/dark cycles            |
| `temp_days.csv`       | Day-level          | 14     | One row per day                            |
| `act_minutes.csv`     | Minute-level       | 20160  | Raw activity data                          |
| `act_hours.csv`       | Hour-level         | 336    | Averaged activity per hour                 |
| `act_halfdays.csv`    | 12-hour cycles     | 28     | Averaged activity per 12-hour window       |
| `act_days.csv`        | Day-level          | 14     | One row per day                            |

---

## Columns (Shared Across All Files)

- `time`:  
  - Minute-level: 1–20160  
  - Hour-level: 1–336  
  - Half-day: 1–28  
  - Day: 1–14

- `F1`, `F2`, ..., `F13`:  
  - Data for female mice (from original `female_temp.csv` / `female_act.csv`)

- `M1`, `M2`, ..., `M13`:  
  - Data for male mice (from original `male_temp.csv` / `male_act.csv`)

- `estrus`:  
  - Boolean value  
  - `True` on Days 2, 6, 10, 14 and their respective intervals  
  - Used to highlight ovulation-related phases for female mice  

---

## Notes

- Temperature and activity are **kept in separate files** to allow independent control over visual encodings (brightness vs. jitter).
- Estrus day labeling is based on the biological cycle: one estrus day every 4 days, starting from Day 2.
- These datasets are structured to support interaction and multiscale zoom in the D3 visualization.  
  By pre-aggregating at different levels, we avoid heavy computation in the browser.
