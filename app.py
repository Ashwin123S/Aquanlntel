"""
AquaIntel: Full-Stack Flask Web Application (app.py)
Intelligent Water Consumption Monitoring, Prediction, Classification, and Anomaly Detection System.
Provides Web routes, RESTful APIs, SQLite connectivity, and ML pipeline integration.
"""

from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
import os
import sqlite3
import pandas as pd
import json

from preprocessing.preprocess import run_preprocessing_pipeline, load_and_validate_dataset
from analysis.eda import generate_eda_summary
from analysis.statistics import compute_descriptive_stats, run_hypothesis_tests
from prediction.predict import predict_consumption
from anomaly.anomaly_detection import diagnose_anomaly
from database.init_db import init_database, hash_password, DB_PATH

app = Flask(__name__)
app.secret_key = 'aquaintel_secret_key_production_2025'

# Initialize DB on startup
init_database()

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

@app.route('/')
def index():
    return redirect(url_for('dashboard'))

@app.route('/dashboard')
def dashboard():
    return render_template('dashboard.html', page='dashboard')

@app.route('/data-management')
def data_management():
    return render_template('data.html', page='data')

@app.route('/preprocessing')
def preprocessing():
    return render_template('preprocessing.html', page='preprocessing')

@app.route('/analysis')
def analysis():
    return render_template('analysis.html', page='analysis')

@app.route('/statistics')
def statistics():
    return render_template('statistics.html', page='statistics')

@app.route('/prediction')
def prediction():
    return render_template('prediction.html', page='prediction')

@app.route('/classification')
def classification():
    return render_template('classification.html', page='classification')

@app.route('/anomaly')
def anomaly():
    return render_template('anomaly.html', page='anomaly')

@app.route('/visualizations')
def visualizations():
    return render_template('visualization.html', page='visualizations')

@app.route('/reports')
def reports():
    return render_template('reports.html', page='reports')

# ==================== API ENDPOINTS ====================

@app.route('/api/kpi-summary', methods=['GET'])
def api_kpi_summary():
    raw_csv = os.path.join(os.path.dirname(__file__), 'data/raw/water_consumption.csv')
    if os.path.exists(raw_csv):
        df = pd.read_csv(raw_csv)
        summary = generate_eda_summary(df)
        return jsonify(summary)
    return jsonify({'error': 'Dataset not loaded'}), 404

@app.route('/api/predict', methods=['POST'])
def api_predict():
    data = request.json or {}
    result = predict_consumption(data)
    return jsonify(result)

@app.route('/api/stats', methods=['GET'])
def api_stats():
    raw_csv = os.path.join(os.path.dirname(__file__), 'data/raw/water_consumption.csv')
    if os.path.exists(raw_csv):
        df = pd.read_csv(raw_csv)
        descriptive = compute_descriptive_stats(df, 'Total_Consumption')
        hypothesis = run_hypothesis_tests(df)
        return jsonify({'descriptive': descriptive, 'hypothesis_tests': hypothesis})
    return jsonify({'error': 'Dataset not loaded'}), 404

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
