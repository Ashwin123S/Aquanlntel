"""
AquaIntel: Database Initialization Script
Initializes SQLite database with tables for users, datasets, consumption_records,
predictions, classifications, and anomalies.
"""

import sqlite3
import os
import hashlib

DB_PATH = os.path.join(os.path.dirname(__file__), 'aquaintel.db')

def hash_password(password: str) -> str:
    """Secure SHA-256 password hashing with salt."""
    salt = "aquaintel_salt_2025"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def init_database():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT DEFAULT 'Water Analyst',
        zone_access TEXT DEFAULT 'All',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 2. Datasets Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS datasets (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT NOT NULL,
        row_count INTEGER NOT NULL,
        status TEXT DEFAULT 'processed',
        uploaded_by TEXT,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 3. Consumption Records Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS consumption_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        population INTEGER,
        temperature REAL,
        rainfall REAL,
        humidity REAL,
        households INTEGER,
        domestic_usage REAL,
        commercial_usage REAL,
        industrial_usage REAL,
        prev_day_consumption REAL,
        prev_week_consumption REAL,
        total_consumption REAL,
        consumption_class TEXT,
        is_anomaly INTEGER DEFAULT 0
    )
    ''')

    # 4. Predictions Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS predictions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prediction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        model_used TEXT NOT NULL,
        predicted_consumption REAL NOT NULL,
        features_json TEXT,
        user_id INTEGER
    )
    ''')

    # 5. Classifications Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS classifications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        record_id INTEGER,
        predicted_class TEXT NOT NULL,
        confidence REAL,
        evaluated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
    ''')

    # 6. Anomalies Table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS anomalies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        zone_id TEXT NOT NULL,
        actual_consumption REAL NOT NULL,
        expected_consumption REAL NOT NULL,
        deviation_percentage REAL NOT NULL,
        anomaly_score REAL NOT NULL,
        severity TEXT NOT NULL,
        possible_causes TEXT,
        status TEXT DEFAULT 'detected'
    )
    ''')

    # Seed initial admin user if not exists
    cursor.execute("SELECT id FROM users WHERE username = 'admin'")
    if not cursor.fetchone():
        admin_pass = hash_password("admin123")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role, zone_access) VALUES (?, ?, ?, ?, ?)",
            ('admin', 'admin@aquaintel.gov', admin_pass, 'Admin', 'All')
        )
        analyst_pass = hash_password("analyst123")
        cursor.execute(
            "INSERT INTO users (username, email, password_hash, role, zone_access) VALUES (?, ?, ?, ?, ?)",
            ('analyst', 'analyst@aquaintel.gov', analyst_pass, 'Water Analyst', 'All')
        )

    conn.commit()
    conn.close()
    print(f"AquaIntel SQLite database successfully initialized at {DB_PATH}")

if __name__ == '__main__':
    init_database()
