"""
AquaIntel: Preprocessing Module (Module 1)
Handles CSV/Excel ingestion, validation, missing value imputation,
outlier detection/clipping, and time-series feature engineering.
"""

import pandas as pd
import numpy as np
import os

def load_and_validate_dataset(file_path: str) -> pd.DataFrame:
    """
    Loads CSV or Excel dataset and validates required column schema.
    """
    if file_path.endswith('.csv'):
        df = pd.read_csv(file_path)
    elif file_path.endswith(('.xls', '.xlsx')):
        df = pd.read_excel(file_path)
    else:
        raise ValueError("Unsupported file format. Please upload CSV or Excel.")

    required_columns = [
        'Date', 'Zone_ID', 'Population', 'Temperature', 'Rainfall',
        'Humidity', 'Number_of_Households', 'Domestic_Usage',
        'Commercial_Usage', 'Industrial_Usage', 'Previous_Day_Consumption',
        'Previous_Week_Consumption', 'Total_Consumption'
    ]

    missing_cols = [col for col in required_columns if col not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    return df

def clean_and_impute(df: pd.DataFrame, strategy: str = 'median') -> pd.DataFrame:
    """
    Handles missing values and duplicates.
    """
    df = df.copy()
    # Remove duplicate date-zone records
    df = df.drop_duplicates(subset=['Date', 'Zone_ID'])

    numeric_cols = [
        'Population', 'Temperature', 'Rainfall', 'Humidity',
        'Number_of_Households', 'Domestic_Usage', 'Commercial_Usage',
        'Industrial_Usage', 'Previous_Day_Consumption',
        'Previous_Week_Consumption', 'Total_Consumption'
    ]

    for col in numeric_cols:
        if col in df.columns:
            if strategy == 'mean':
                df[col] = df[col].fillna(df[col].mean())
            elif strategy == 'median':
                df[col] = df[col].fillna(df[col].median())
            elif strategy == 'mode':
                df[col] = df[col].fillna(df[col].mode()[0] if not df[col].mode().empty else 0)
            elif strategy == 'ffill':
                df[col] = df[col].ffill().bfill()
            elif strategy == 'drop':
                df = df.dropna(subset=[col])

    return df

def handle_outliers_iqr(df: pd.DataFrame, column: str = 'Total_Consumption', threshold: float = 1.5) -> pd.DataFrame:
    """
    Detects and clips statistical outliers using the Interquartile Range (IQR) method.
    """
    df = df.copy()
    q1 = df[column].quantile(0.25)
    q3 = df[column].quantile(0.75)
    iqr = q3 - q1
    lower_bound = q1 - threshold * iqr
    upper_bound = q3 + threshold * iqr

    df[column] = np.clip(df[column], lower_bound, upper_bound)
    return df

def engineer_time_series_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Extracts time components and computes lag and rolling window features per zone.
    """
    df = df.copy()
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values(by=['Date', 'Zone_ID']).reset_index(drop=True)

    # Time-based features
    df['Year'] = df['Date'].dt.year
    df['Month'] = df['Date'].dt.month
    df['Day'] = df['Date'].dt.day
    df['Day_of_Week'] = df['Date'].dt.dayofweek
    df['Week_of_Year'] = df['Date'].dt.isocalendar().week.astype(int)
    df['Is_Weekend'] = df['Day_of_Week'].apply(lambda x: 1 if x in [5, 6] else 0)
    df['Is_Holiday'] = 0  # Can be mapped to specific calendar dates

    # Compute Zone-wise Lags and Rolling Means to avoid cross-zone leakage
    processed_zones = []
    for zone, group in df.groupby('Zone_ID'):
        g = group.sort_values(by='Date').copy()
        g['Lag_1'] = g['Total_Consumption'].shift(1).fillna(g['Previous_Day_Consumption'])
        g['Lag_7'] = g['Total_Consumption'].shift(7).fillna(g['Previous_Week_Consumption'])
        g['Rolling_Mean_7'] = g['Total_Consumption'].rolling(window=7, min_periods=1).mean()
        g['Rolling_Mean_30'] = g['Total_Consumption'].rolling(window=30, min_periods=1).mean()
        processed_zones.append(g)

    final_df = pd.concat(processed_zones).sort_values(by='Date').reset_index(drop=True)
    return final_df

def run_preprocessing_pipeline(input_path: str, output_path: str = None) -> pd.DataFrame:
    """
    End-to-end execution of the Data Collection & Preprocessing pipeline.
    """
    raw_df = load_and_validate_dataset(input_path)
    clean_df = clean_and_impute(raw_df, strategy='median')
    featured_df = engineer_time_series_features(clean_df)

    if output_path:
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        featured_df.to_csv(output_path, index=False)
        print(f"Preprocessed dataset saved to {output_path}")

    return featured_df

if __name__ == '__main__':
    raw_csv = os.path.join(os.path.dirname(__file__), '../data/raw/water_consumption.csv')
    processed_csv = os.path.join(os.path.dirname(__file__), '../data/processed/water_consumption_processed.csv')
    if os.path.exists(raw_csv):
        run_preprocessing_pipeline(raw_csv, processed_csv)
