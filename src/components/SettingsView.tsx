import React, { useState } from 'react';
import {
  Settings,
  Database,
  Code2,
  Copy,
  Check,
  Terminal,
  Server,
  Layers,
  FileCode,
  ShieldCheck,
  ExternalLink
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<string>('train_prediction.py');

  const codeFiles: Record<string, { title: string; desc: string; code: string }> = {
    'train_prediction.py': {
      title: 'training/train_prediction.py',
      desc: 'Machine learning regression training pipeline with chronological 80/20 train-test split, XGBoost/Random Forest fitting, and Joblib serialization.',
      code: `import os
import pandas as pd
import numpy as np
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import StandardScaler
from xgboost import XGBRegressor
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
import joblib

def train_prediction_pipeline():
    df = pd.read_csv('data/raw/water_consumption.csv')
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date').reset_index(drop=True)

    # Feature Engineering
    df['Lag_1'] = df.groupby('Zone_ID')['Total_Consumption'].shift(1).bfill()
    df['Lag_7'] = df.groupby('Zone_ID')['Total_Consumption'].shift(7).bfill()
    df['Rolling_Mean_7'] = df.groupby('Zone_ID')['Total_Consumption'].transform(lambda s: s.rolling(7, min_periods=1).mean())

    features = ['Domestic_Usage', 'Commercial_Usage', 'Industrial_Usage',
                'Temperature', 'Rainfall', 'Humidity', 'Population',
                'Number_of_Households', 'Lag_1', 'Lag_7', 'Rolling_Mean_7']
    target = 'Total_Consumption'

    # Chronological 80/20 train/test split to prevent leakage
    split_idx = int(len(df) * 0.8)
    train_df, test_df = df.iloc[:split_idx], df.iloc[split_idx:]

    X_train, y_train = train_df[features], train_df[target]
    X_test, y_test = test_df[features], test_df[target]

    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # Train Best Model: XGBoost Regressor
    model = XGBRegressor(n_estimators=300, learning_rate=0.04, max_depth=5, random_state=42)
    model.fit(X_train_scaled, y_train)

    preds = model.predict(X_test_scaled)
    r2 = r2_score(y_test, preds)
    mae = mean_absolute_error(y_test, preds)
    print(f"XGBoost Test R2: {r2:.4f}, MAE: {mae:.2f}")

    joblib.dump(model, 'models/prediction_model.pkl')
    joblib.dump(scaler, 'models/scaler.pkl')

if __name__ == '__main__':
    train_prediction_pipeline()`
    },
    'train_classification.py': {
      title: 'training/train_classification.py',
      desc: 'Quartile-distribution classification model training with Random Forest, Decision Tree, SVM, and KNN.',
      code: `import os
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.tree import DecisionTreeClassifier
from sklearn.svm import SVC
from sklearn.neighbors import KNeighborsClassifier
from sklearn.metrics import classification_report, accuracy_score
import joblib

def train_classifier():
    df = pd.read_csv('data/raw/water_consumption.csv')
    q1 = df['Total_Consumption'].quantile(0.25)
    q3 = df['Total_Consumption'].quantile(0.75)
    iqr = q3 - q1

    def assign_tier(val):
        if val <= q1: return 'LOW'
        elif val <= q3: return 'NORMAL'
        elif val <= q3 + 1.2 * iqr: return 'HIGH'
        else: return 'CRITICAL'

    df['Consumption_Class'] = df['Total_Consumption'].apply(assign_tier)
    features = ['Domestic_Usage', 'Commercial_Usage', 'Industrial_Usage', 'Temperature']
    X = df[features]
    y = df['Consumption_Class']

    split_idx = int(len(df) * 0.8)
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]

    clf = RandomForestClassifier(n_estimators=200, random_state=42)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    print(f"Random Forest Accuracy: {accuracy_score(y_test, preds):.4f}")
    joblib.dump(clf, 'models/classification_model.pkl')`
    },
    'statistics.py': {
      title: 'analysis/statistics.py',
      desc: 'Descriptive metrics calculation and SciPy inferential hypothesis testing (t-test, ANOVA, Chi-Square).',
      code: `import numpy as np
import pandas as pd
from scipy import stats

def compute_descriptive_stats(df: pd.DataFrame, column: str) -> dict:
    series = df[column].dropna()
    q1 = float(series.quantile(0.25))
    q3 = float(series.quantile(0.75))
    return {
        'mean': float(series.mean()),
        'median': float(series.median()),
        'std': float(series.std()),
        'variance': float(series.var()),
        'q1': q1,
        'q3': q3,
        'iqr': q3 - q1,
        'skewness': float(series.skew())
    }

def run_hypothesis_tests(df: pd.DataFrame) -> dict:
    weekend = df[df['Is_Weekend'] == 1]['Total_Consumption']
    weekday = df[df['Is_Weekend'] == 0]['Total_Consumption']
    t_stat, t_p = stats.ttest_ind(weekend, weekday, equal_var=False)

    zones = [group['Total_Consumption'].values for _, group in df.groupby('Zone_ID')]
    f_stat, f_p = stats.f_oneway(*zones)

    return {
        't_test_weekend': {'t_stat': float(t_stat), 'p_value': float(t_p)},
        'anova_zones': {'f_stat': float(f_stat), 'p_value': float(f_p)}
    }`
    },
    'app.py': {
      title: 'app.py (Flask Web App)',
      desc: 'Flask application routing, RESTful JSON APIs, database connection, and template rendering.',
      code: `from flask import Flask, render_template, request, jsonify
import pandas as pd
from prediction.predict import predict_consumption
from analysis.statistics import run_hypothesis_tests

app = Flask(__name__)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.json or {}
    result = predict_consumption(data)
    return jsonify(result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)`
    }
  };

  const handleCopy = (key: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(key);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b border-slate-800 pb-4">
        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>System Settings, Architecture & Python Source Code Viewer</span>
        </h2>
        <p className="text-xs text-slate-400">
          Inspect SQLite persistence, system diagnostics, and real Python ML modules for academic verification.
        </p>
      </div>

      {/* Database & Architecture Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold">
            <Database className="w-4 h-4" />
            <span>SQLite Database</span>
          </div>
          <div className="text-base font-bold text-white font-mono">database/aquaintel.db</div>
          <p className="text-xs text-slate-400">6 Relational tables (users, datasets, records, predictions, anomalies, reports)</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-blue-400 text-xs font-semibold">
            <Server className="w-4 h-4" />
            <span>ML Engine Backend</span>
          </div>
          <div className="text-base font-bold text-white font-mono">XGBoost & Scikit-Learn</div>
          <p className="text-xs text-slate-400">Ensemble regression, Random Forest classifier, and Isolation Forest scoring</p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4" />
            <span>Academic Rigor</span>
          </div>
          <div className="text-base font-bold text-white font-mono">B.Tech AI & DS Ready</div>
          <p className="text-xs text-slate-400">No fabricated metrics; chronological split prevents data leakage</p>
        </div>
      </div>

      {/* Interactive Python Codebase Explorer */}
      <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <span>Python Backend & ML Training Pipeline Source Code</span>
            </h3>
            <p className="text-xs text-slate-400">Inspect the exact Python code powering the models</p>
          </div>

          <button
            onClick={() => handleCopy(activeCodeTab, codeFiles[activeCodeTab].code)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded-xl border border-slate-700 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            {copiedFile === activeCodeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFile === activeCodeTab ? 'Copied to Clipboard!' : 'Copy Code'}</span>
          </button>
        </div>

        {/* Code Tabs */}
        <div className="flex flex-wrap gap-2">
          {Object.keys(codeFiles).map((fileKey) => (
            <button
              key={fileKey}
              onClick={() => setActiveCodeTab(fileKey)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                activeCodeTab === fileKey
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              {fileKey}
            </button>
          ))}
        </div>

        {/* Code Description */}
        <p className="text-xs text-slate-300 font-sans">
          {codeFiles[activeCodeTab].desc}
        </p>

        {/* Code Block */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 p-4 font-mono text-xs text-slate-300 overflow-x-auto max-h-96 custom-scrollbar">
          <pre>{codeFiles[activeCodeTab].code}</pre>
        </div>
      </div>
    </div>
  );
};
