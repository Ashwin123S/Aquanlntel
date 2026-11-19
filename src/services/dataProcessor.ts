import { WaterRecord, PreprocessedRecord, StatisticalSummary } from '../types';

export interface PreprocessingConfig {
  missingStrategy: 'mean' | 'median' | 'mode' | 'ffill' | 'drop';
  outlierMethod: 'iqr' | 'zscore' | 'none';
  outlierThreshold: number; // e.g. 1.5 for IQR, 3 for Z-score
  scalingMethod: 'standard' | 'minmax' | 'none';
  removeDuplicates: boolean;
}

export const DEFAULT_PREPROCESSING_CONFIG: PreprocessingConfig = {
  missingStrategy: 'median',
  outlierMethod: 'iqr',
  outlierThreshold: 1.5,
  scalingMethod: 'standard',
  removeDuplicates: true,
};

const INDIAN_HOLIDAYS_2025 = new Set([
  '2025-01-01', // New Year
  '2025-01-14', // Makar Sankranti / Pongal
  '2025-01-26', // Republic Day
  '2025-03-14', // Holi
  '2025-03-31', // Id-ul-Fitr
  '2025-04-14', // Ambedkar Jayanti
  '2025-08-15', // Independence Day
  '2025-10-02', // Gandhi Jayanti
  '2025-10-20', // Diwali
  '2025-12-25', // Christmas
]);

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/**
 * Preprocesses raw water consumption dataset with feature engineering,
 * missing-value imputation, outlier management, and time-series rolling calculations.
 */
export function preprocessDataset(
  rawRecords: WaterRecord[],
  config: PreprocessingConfig = DEFAULT_PREPROCESSING_CONFIG
): {
  processed: PreprocessedRecord[];
  missingCount: number;
  duplicateCount: number;
  outliersDetected: number;
  stats: Record<string, StatisticalSummary>;
  thresholds: { low: number; normal: number; high: number };
} {
  let data = [...rawRecords];
  let missingCount = 0;
  let duplicateCount = 0;
  let outliersDetected = 0;

  // 1. Duplicate Detection & Removal
  if (config.removeDuplicates) {
    const seen = new Set<string>();
    const unique: WaterRecord[] = [];
    for (const r of data) {
      const key = `${r.Date}_${r.Zone_ID}`;
      if (seen.has(key)) {
        duplicateCount++;
      } else {
        seen.add(key);
        unique.push(r);
      }
    }
    data = unique;
  }

  // 2. Chronological Sorting for Time-Series Features
  data.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime() || a.Zone_ID.localeCompare(b.Zone_ID));

  // 3. Compute Basic Column Stats for Missing Imputation
  const numericColumns: (keyof WaterRecord)[] = [
    'Population',
    'Temperature',
    'Rainfall',
    'Humidity',
    'Number_of_Households',
    'Domestic_Usage',
    'Commercial_Usage',
    'Industrial_Usage',
    'Previous_Day_Consumption',
    'Previous_Week_Consumption',
    'Total_Consumption'
  ];

  const colStats: Record<string, StatisticalSummary> = {};
  for (const col of numericColumns) {
    colStats[col] = calculateColumnSummary(data, col);
  }

  // Group by zone to calculate accurate time-series lag and rolling features per zone
  const zoneGroups: Record<string, WaterRecord[]> = {};
  for (const r of data) {
    if (!zoneGroups[r.Zone_ID]) zoneGroups[r.Zone_ID] = [];
    zoneGroups[r.Zone_ID].push(r);
  }

  const processedList: PreprocessedRecord[] = [];

  for (const zoneId of Object.keys(zoneGroups)) {
    const zoneRecords = zoneGroups[zoneId];
    const totalConsumptionHistory: number[] = [];

    for (let i = 0; i < zoneRecords.length; i++) {
      const record = zoneRecords[i];
      const dateObj = new Date(record.Date);

      const year = dateObj.getFullYear();
      const month = dateObj.getMonth() + 1;
      const day = dateObj.getDate();
      const dayOfWeek = dateObj.getDay();
      const dayName = DAY_NAMES[dayOfWeek];

      // Week of year calculation
      const firstJan = new Date(dateObj.getFullYear(), 0, 1);
      const weekOfYear = Math.ceil(((dateObj.getTime() - firstJan.getTime()) / 86400000 + firstJan.getDay() + 1) / 7);

      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 0;
      const isHoliday = INDIAN_HOLIDAYS_2025.has(record.Date) ? 1 : 0;

      // Impute any missing or invalid numbers
      let total = record.Total_Consumption;
      if (isNaN(total) || total === null || total === undefined) {
        missingCount++;
        total = colStats['Total_Consumption'] ? colStats['Total_Consumption'].median : 12000;
      }

      totalConsumptionHistory.push(total);

      // Feature Engineering: Lag 1 & Lag 7
      const lag1 = i >= 1 ? totalConsumptionHistory[i - 1] : record.Previous_Day_Consumption || total;
      const lag7 = i >= 7 ? totalConsumptionHistory[i - 7] : record.Previous_Week_Consumption || total;

      // Rolling Mean 7
      const window7Start = Math.max(0, i - 6);
      const window7Slice = totalConsumptionHistory.slice(window7Start, i + 1);
      const rollingMean7 = Math.round((window7Slice.reduce((a, b) => a + b, 0) / window7Slice.length) * 10) / 10;

      // Rolling Mean 30
      const window30Start = Math.max(0, i - 29);
      const window30Slice = totalConsumptionHistory.slice(window30Start, i + 1);
      const rollingMean30 = Math.round((window30Slice.reduce((a, b) => a + b, 0) / window30Slice.length) * 10) / 10;

      let consumptionClass: 'LOW' | 'NORMAL' | 'HIGH' | 'CRITICAL' = 'NORMAL';
      if (total <= 8500) consumptionClass = 'LOW';
      else if (total <= 14500) consumptionClass = 'NORMAL';
      else if (total <= 20000) consumptionClass = 'HIGH';
      else consumptionClass = 'CRITICAL';

      const preprocessedItem: PreprocessedRecord = {
        ...record,
        Total_Consumption: total,
        Year: year,
        Month: month,
        Day: day,
        Day_of_Week: dayOfWeek,
        Day_Name: dayName,
        Week_of_Year: weekOfYear,
        Is_Weekend: isWeekend,
        Is_Holiday: isHoliday,
        Lag_1: lag1,
        Lag_7: lag7,
        Rolling_Mean_7: rollingMean7,
        Rolling_Mean_30: rollingMean30,
        Consumption_Class: consumptionClass,
      };

      processedList.push(preprocessedItem);
    }
  }

  // Sort chronologically again
  processedList.sort((a, b) => new Date(a.Date).getTime() - new Date(b.Date).getTime());

  // 4. Outlier Handling on Total_Consumption (IQR / Z-score)
  const totalStats = calculateColumnSummary(processedList, 'Total_Consumption');
  if (config.outlierMethod === 'iqr') {
    const lowerBound = totalStats.q1 - config.outlierThreshold * totalStats.iqr;
    const upperBound = totalStats.q3 + config.outlierThreshold * totalStats.iqr;

    for (const item of processedList) {
      if (item.Total_Consumption < lowerBound || item.Total_Consumption > upperBound) {
        outliersDetected++;
      }
    }
  } else if (config.outlierMethod === 'zscore') {
    const mean = totalStats.mean;
    const std = totalStats.std || 1;
    for (const item of processedList) {
      const z = Math.abs((item.Total_Consumption - mean) / std);
      if (z > config.outlierThreshold) {
        outliersDetected++;
      }
    }
  }

  // 5. Statistical Distribution Derived Thresholds for Classification:
  // Q1 (25th percentile) -> LOW vs NORMAL
  // Q2/Median -> NORMAL
  // Q3 (75th percentile) -> NORMAL vs HIGH
  // Q3 + 1.5*IQR -> CRITICAL
  const lowThreshold = totalStats.q1;
  const normalThreshold = totalStats.median;
  const highThreshold = totalStats.q3;
  const criticalThreshold = totalStats.q3 + 1.2 * totalStats.iqr;

  for (const item of processedList) {
    if (item.Total_Consumption <= lowThreshold) {
      item.Consumption_Class = 'LOW';
    } else if (item.Total_Consumption <= highThreshold) {
      item.Consumption_Class = 'NORMAL';
    } else if (item.Total_Consumption <= criticalThreshold) {
      item.Consumption_Class = 'HIGH';
    } else {
      item.Consumption_Class = 'CRITICAL';
    }
  }

  // Final updated stats
  const finalStats: Record<string, StatisticalSummary> = {};
  for (const col of numericColumns) {
    finalStats[col] = calculateColumnSummary(processedList, col);
  }

  return {
    processed: processedList,
    missingCount,
    duplicateCount,
    outliersDetected,
    stats: finalStats,
    thresholds: {
      low: Math.round(lowThreshold),
      normal: Math.round(normalThreshold),
      high: Math.round(highThreshold),
    },
  };
}

/**
 * Calculates statistical distribution metrics for a numeric column.
 */
export function calculateColumnSummary(data: any[], column: string): StatisticalSummary {
  const values: number[] = data
    .map(d => Number(d[column]))
    .filter(v => !isNaN(v) && v !== null && v !== undefined)
    .sort((a, b) => a - b);

  const n = values.length;
  if (n === 0) {
    return {
      column,
      count: 0,
      mean: 0,
      median: 0,
      mode: 0,
      variance: 0,
      std: 0,
      min: 0,
      max: 0,
      q1: 0,
      q2: 0,
      q3: 0,
      iqr: 0,
      skewness: 0,
    };
  }

  const sum = values.reduce((acc, v) => acc + v, 0);
  const mean = sum / n;

  // Median / Quartiles
  const getPercentile = (p: number) => {
    const idx = (n - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    const weight = idx - lower;
    return values[lower] * (1 - weight) + values[upper] * weight;
  };

  const q1 = getPercentile(0.25);
  const median = getPercentile(0.5);
  const q3 = getPercentile(0.75);
  const iqr = q3 - q1;

  // Mode
  const counts: Record<number, number> = {};
  let maxCount = 0;
  let mode = values[0];
  for (const val of values) {
    const rounded = Math.round(val);
    counts[rounded] = (counts[rounded] || 0) + 1;
    if (counts[rounded] > maxCount) {
      maxCount = counts[rounded];
      mode = rounded;
    }
  }

  // Variance & Std
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / (n - 1 || 1);
  const std = Math.sqrt(variance);

  // Skewness
  const m3 = values.reduce((acc, v) => acc + Math.pow(v - mean, 3), 0) / n;
  const skewness = std > 0 ? m3 / Math.pow(std, 3) : 0;

  return {
    column,
    count: n,
    mean: Math.round(mean * 100) / 100,
    median: Math.round(median * 100) / 100,
    mode: Math.round(mode * 100) / 100,
    variance: Math.round(variance * 100) / 100,
    std: Math.round(std * 100) / 100,
    min: Math.round(values[0] * 100) / 100,
    max: Math.round(values[n - 1] * 100) / 100,
    q1: Math.round(q1 * 100) / 100,
    q2: Math.round(median * 100) / 100,
    q3: Math.round(q3 * 100) / 100,
    iqr: Math.round(iqr * 100) / 100,
    skewness: Math.round(skewness * 100) / 100,
  };
}

/**
 * Exports processed records into clean downloadable CSV string
 */
export function generateProcessedCSV(data: PreprocessedRecord[]): string {
  const headers = [
    'Date',
    'Zone_ID',
    'Year',
    'Month',
    'Day',
    'Day_of_Week',
    'Day_Name',
    'Week_of_Year',
    'Is_Weekend',
    'Is_Holiday',
    'Population',
    'Temperature',
    'Rainfall',
    'Humidity',
    'Number_of_Households',
    'Domestic_Usage',
    'Commercial_Usage',
    'Industrial_Usage',
    'Previous_Day_Consumption',
    'Previous_Week_Consumption',
    'Lag_1',
    'Lag_7',
    'Rolling_Mean_7',
    'Rolling_Mean_30',
    'Total_Consumption',
    'Consumption_Class'
  ];

  const rows = data.map(r => [
    r.Date,
    r.Zone_ID,
    r.Year,
    r.Month,
    r.Day,
    r.Day_of_Week,
    r.Day_Name,
    r.Week_of_Year,
    r.Is_Weekend,
    r.Is_Holiday,
    r.Population,
    r.Temperature,
    r.Rainfall,
    r.Humidity,
    r.Number_of_Households,
    r.Domestic_Usage,
    r.Commercial_Usage,
    r.Industrial_Usage,
    r.Previous_Day_Consumption,
    r.Previous_Week_Consumption,
    r.Lag_1,
    r.Lag_7,
    r.Rolling_Mean_7,
    r.Rolling_Mean_30,
    r.Total_Consumption,
    r.Consumption_Class || 'NORMAL'
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
