export interface WaterRecord {
  id: string | number;
  Date: string;
  Zone_ID: string;
  Population: number;
  Temperature: number; // Celsius
  Rainfall: number; // mm
  Humidity: number; // %
  Number_of_Households: number;
  Domestic_Usage: number; // m³ or kL
  Commercial_Usage: number; // m³ or kL
  Industrial_Usage: number; // m³ or kL
  Previous_Day_Consumption: number;
  Previous_Week_Consumption: number;
  Total_Consumption: number;
}

export interface PreprocessedRecord extends WaterRecord {
  Year: number;
  Month: number;
  Day: number;
  Day_of_Week: number; // 0 = Sun, 6 = Sat
  Day_Name: string;
  Week_of_Year: number;
  Is_Weekend: number; // 0 or 1
  Is_Holiday: number; // 0 or 1
  Lag_1: number;
  Lag_7: number;
  Rolling_Mean_7: number;
  Rolling_Mean_30: number;
  Consumption_Class?: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  Is_Anomaly?: boolean;
  Anomaly_Score?: number;
  Severity?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  Possible_Cause?: string;
  Expected_Consumption?: number;
  Deviation_Pct?: number;
}

export interface ModelMetrics {
  modelName: string;
  mae: number;
  mse: number;
  rmse: number;
  r2: number;
  mape: number;
  isBest?: boolean;
}

export interface ModelMetric {
  name: string;
  type: 'Regression' | 'Classification' | 'Anomaly';
  mae?: number;
  mse?: number;
  rmse?: number;
  r2?: number;
  mape?: number;
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1?: number;
  isBest?: boolean;
  hyperparameters?: Record<string, any>;
  trainTime?: string;
}

export interface ClassifierMetrics {
  modelName: string;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  isBest?: boolean;
}

export interface StatisticalSummary {
  column: string;
  count: number;
  mean: number;
  median: number;
  mode?: number;
  variance: number;
  std: number;
  min: number;
  max: number;
  q1: number;
  q2?: number;
  q3: number;
  iqr: number;
  skewness: number;
}

export interface HypothesisTestResult {
  testName: string;
  description: string;
  nullHypothesis: string;
  altHypothesis: string;
  testStatisticName: string;
  testStatisticValue: number;
  pValue: number;
  alpha: number;
  isSignificant: boolean;
  interpretation: string;
  conclusion: string;
  sampleSizes?: { group1?: number; group2?: number; total?: number };
}

export interface AnomalyItem {
  id: string | number;
  date: string;
  zone: string;
  actualConsumption: number;
  expectedBaseline: number;
  expectedConsumption?: number;
  deviationPercentage: number;
  anomalyScore: number;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  possibleCauses: string[];
  possibleExplanations?: string[];
}

export interface PredictionFeatures {
  Population?: number;
  Temperature?: number;
  Rainfall?: number;
  Humidity?: number;
  Number_of_Households?: number;
  Domestic_Usage?: number;
  Commercial_Usage?: number;
  Industrial_Usage?: number;
  Previous_Day_Consumption?: number;
  Previous_Week_Consumption?: number;
  Month?: number;
  Day_of_Week?: number;
  Is_Weekend?: number;
  Is_Holiday?: number;
  Lag_1?: number;
  Lag_7?: number;
  Rolling_Mean_7?: number;
  Rolling_Mean_30?: number;
}

export interface PredictionResult {
  predictedConsumption: number;
  confidenceInterval: {
    lower: number;
    upper: number;
  };
  modelUsed: string;
}

export interface ClassificationResult {
  predictedClass: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL';
  probabilities: {
    LOW: number;
    NORMAL: number;
    HIGH: number;
    CRITICAL: number;
  };
  confidence: number;
  thresholds?: {
    low: number;
    normal: number;
    high: number;
  };
}

export interface Recommendation {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  zone: string;
  title: string;
  message: string;
  rationale: string;
  action: string;
  timestamp: string;
}

export interface UserProfile {
  id?: string;
  name: string;
  email: string;
  role: 'Admin' | 'Water Engineer' | 'Data Analyst' | 'Municipal Officer';
  token?: string;
  zoneAccess?: string;
}
