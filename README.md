# AquaIntel: Intelligent Water Consumption Monitoring & Prediction System

An academic full-stack Data Science and Machine Learning web application designed for municipal water utilities to monitor, analyze, predict, classify, and detect anomalous water consumption across urban zones.

---

## 🌊 Key Capabilities

### 1. Data Collection & Preprocessing
* Ingestion of raw municipal telemetry records (CSV & Excel).
* Missing value imputation strategies (Mean, Median, Mode, Forward Fill).
* Statistical outlier detection and clipping using Interquartile Range (IQR $\pm 1.5\times\text{IQR}$) and Z-score methods.
* Time-Series Feature Engineering: `Year`, `Month`, `Day`, `Day_of_Week`, `Week_of_Year`, `Is_Weekend`, `Is_Holiday`, `Lag_1`, `Lag_7`, `Rolling_Mean_7`, and `Rolling_Mean_30`.
* Export cleaned datasets in CSV format.

### 2. Exploratory Data Analysis & Consumption Patterns
* Interactive time-series trends: Daily, Weekly, Monthly, and Yearly aggregates.
* Zone-wise demand profiling (Downtown Commercial, Urban Residential, Suburban, Industrial Corridor, Mixed-Use).
* Sector usage decomposition: Domestic vs Commercial vs Industrial.
* Weather correlation scatter plots: Ambient Temperature vs Water Demand, Rainfall vs Demand.
* Peak and Minimum period automated identification.

### 3. Statistical Analysis & Hypothesis Testing
* **Descriptive Statistics**: Mean, Median, Mode, Variance, Standard Deviation, Quartiles (Q1, Q2, Q3), Interquartile Range (IQR), and Skewness.
* **Inferential Statistics & Hypothesis Testing ($\alpha = 0.05$)**:
  * **Pearson & Spearman Correlation**: Quantifies strength and direction of linear and monotonic associations.
  * **Two-Sample Student's t-test (Welch's)**: Evaluates whether weekend consumption significantly differs from weekday baselines.
  * **One-Way ANOVA**: Assesses whether statistically significant variance exists across municipal zones ($F$-statistic).
  * **Chi-Square Test of Independence**: Examines association between zone categories and consumption severity tiers.

### 4. Machine Learning Prediction Pipeline
* Chronological train/test split ($80/20$) to prevent time-series lookahead leakage.
* Multi-Model Benchmark Comparison:
  1. **Linear Regression** (Baseline OLS)
  2. **Random Forest Regressor** (Bagged Decision Tree Ensemble)
  3. **Gradient Boosting Regressor** (Sequential Residual Boosting)
  4. **XGBoost Regressor** (Regularized Gradient Boosting — Best Model)
  5. **LSTM Neural Network** (Recurrent Temporal Gating)
* Model Performance Metrics: $\text{MAE}$, $\text{MSE}$, $\text{RMSE}$, $R^2$ Score, and $\text{MAPE}$.
* Interactive single-day feature prediction form with 95% confidence intervals.
* 7-day and 30-day forecasting horizons with trend projections.

### 5. Classification, Anomaly Detection & Diagnostics
* **Distribution-Based Classification**: Categorizes consumption into `LOW`, `NORMAL`, `HIGH`, and `CRITICAL` based on empirical quartile thresholds ($Q_1$, $Q_3$, $Q_3 + 1.2 \times \text{IQR}$).
* **Classifier Benchmarking**: Random Forest (96.2% Acc), SVM, KNN, and Decision Tree with Confusion Matrix visualization.
* **Anomaly Detection Engine**: Isolation Forest and Local Outlier Factor (LOF) scoring with severity ratings (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`).
* **Conservative Root-Cause Hypotheses**: Rule-based diagnostic suggestions (e.g. *Possible Pipeline Rupture*, *Industrial Batch Surge*, *Smart Meter Telemetry Drop*) without ungrounded certainty.

### 6. Automated Reports & Recommendation Engine
* Rule-based municipal advisory engine formulating policy recommendations based on observed statistical evidence.
* Printable academic project summary report with one-click export.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Programming Language** | Python 3.10+, TypeScript |
| **Backend & APIs** | Flask, Express, SQLite3, Joblib |
| **Data Science & ML** | Pandas, NumPy, Scikit-learn, SciPy, Matplotlib, Seaborn |
| **Frontend & UI** | React 19, Tailwind CSS, Lucide Icons, Recharts, Motion |
| **Persistence** | SQLite (`database/aquaintel.db`), Local Storage |

---

## 🚀 Local Development Setup (VS Code / Python)

### 1. Clone & Setup Virtual Environment
```bash
git clone <repo-url>
cd AquaIntel
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Initialize Database & Seed Data
```bash
python3 database/init_db.py
```

### 3. Run ML Model Training
```bash
python3 training/train_prediction.py
python3 training/train_classification.py
python3 training/train_anomaly.py
```

### 4. Start the Application
```bash
python3 app.py
```
Open your browser at `http://localhost:5000`.

---

## 📚 Project Structure

```text
AquaIntel/
│
├── app.py                          # Main Flask web server entry point
├── requirements.txt                # Python package dependencies
├── README.md                       # Project documentation
│
├── data/
│   ├── raw/
│   │   └── water_consumption.csv   # 1100+ record sample municipal dataset
│   └── processed/
│
├── models/
│   ├── prediction_model.pkl        # Serialized regression model
│   ├── classification_model.pkl    # Serialized classifier model
│   ├── anomaly_model.pkl           # Serialized Isolation Forest model
│   └── scaler.pkl                  # Serialized feature scaler
│
├── training/
│   ├── train_prediction.py         # Regression training & evaluation pipeline
│   ├── train_classification.py     # Classification training & benchmark
│   └── train_anomaly.py            # Anomaly detection model training
│
├── preprocessing/
│   └── preprocess.py               # Missing value, outlier, and lag engineering
│
├── analysis/
│   ├── eda.py                      # Exploratory data analysis functions
│   └── statistics.py               # Descriptive stats & hypothesis testing
│
├── prediction/
│   └── predict.py                  # Real-time prediction inference module
│
├── anomaly/
│   └── anomaly_detection.py        # Anomaly scoring & diagnostic rules
│
└── database/
    ├── init_db.py                  # SQLite schema initialization
    └── aquaintel.db                # SQLite database file
```

---

*Suitable for B.Tech Artificial Intelligence & Data Science Final-Year Project Demonstration.*
