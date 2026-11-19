import { WaterRecord } from '../types';

/**
 * Generates a realistic municipal water consumption dataset with over 1,000 records.
 * Incorporates seasonal weather patterns, zone demographics, day-of-week trends,
 * and realistic anomaly events (leakages, demand surges, sensor drops).
 */
export function generateSampleDataset(): WaterRecord[] {
  return generateRealisticDataset();
}

export function generateRealisticDataset(): WaterRecord[] {
  const records: WaterRecord[] = [];
  const zones = [
    { id: 'Zone_1', name: 'Downtown Commercial', basePop: 45000, households: 14000, domBase: 4200, comBase: 6500, indBase: 1200 },
    { id: 'Zone_2', name: 'North Urban Residential', basePop: 85000, households: 28000, domBase: 8900, comBase: 2100, indBase: 900 },
    { id: 'Zone_3', name: 'East Suburban Residential', basePop: 62000, households: 19500, domBase: 6800, comBase: 1400, indBase: 450 },
    { id: 'Zone_4', name: 'South Industrial Corridor', basePop: 22000, households: 6800, domBase: 2400, comBase: 3200, indBase: 9400 },
    { id: 'Zone_5', name: 'West Mixed-Use District', basePop: 51000, households: 16200, domBase: 5400, comBase: 4100, indBase: 2800 },
  ];

  // Generate 220 days x 5 zones = 1100 records
  const startDate = new Date('2025-01-01');
  const totalDays = 225;

  // Track previous consumption for realistic lag generation
  const zoneHistories: Record<string, number[]> = {
    Zone_1: [],
    Zone_2: [],
    Zone_3: [],
    Zone_4: [],
    Zone_5: [],
  };

  let recordId = 1;

  for (let d = 0; d < totalDays; d++) {
    const currentDate = new Date(startDate);
    currentDate.setDate(startDate.getDate() + d);

    const dateStr = currentDate.toISOString().split('T')[0];
    const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const dayOfWeek = currentDate.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Seasonal Weather Simulation (Summer hot peak in mid-year, cooler in winter, rain in monsoon)
    // Sinusoidal temperature curve peaking around June/July
    const seasonalFactor = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
    const baseTemp = 24 + 11 * seasonalFactor; // Range: 13°C to 35°C
    const tempNoise = (Math.sin(d * 1.7) * 2.5) + (Math.cos(d * 0.9) * 1.5);
    const temperature = Math.round((baseTemp + tempNoise) * 10) / 10;

    // Rainfall pattern (more frequent in summer monsoon)
    let rainfall = 0;
    const rainChance = Math.sin((dayOfYear / 365) * 2 * Math.PI + 1.2);
    if (rainChance > 0.3 && Math.sin(d * 3.4) > 0.2) {
      rainfall = Math.round((Math.abs(Math.sin(d * 5.1)) * 38 + 2) * 10) / 10;
    }

    // Humidity inversely related to temp unless raining
    let baseHumidity = 58 - (temperature - 20) * 0.9;
    if (rainfall > 0) baseHumidity += 25;
    const humidity = Math.min(98, Math.max(25, Math.round(baseHumidity + Math.sin(d * 2.1) * 8)));

    for (const zone of zones) {
      const popJitter = 1 + (Math.sin(d * 0.15 + zone.domBase) * 0.02);
      const population = Math.round(zone.basePop * popJitter);
      const households = Math.round(zone.households * popJitter);

      // Temperature demand factor (hotter -> more water needed)
      const tempDemandFactor = 1 + Math.max(0, (temperature - 22) * 0.018);
      // Rainfall reduction factor (rain -> lower outdoor domestic water use)
      const rainReductionFactor = rainfall > 5 ? 0.88 : 1.0;

      // Weekend effect: Residential uses +12% more on weekends, Commercial uses -30% less, Industrial uses -40% less
      const weekendDomFactor = isWeekend ? 1.14 : 0.96;
      const weekendComFactor = isWeekend ? 0.72 : 1.08;
      const weekendIndFactor = isWeekend ? 0.60 : 1.12;

      // Realistic consumption components
      const domNoise = (Math.sin(d * 2.3 + zone.domBase) * 0.05);
      const comNoise = (Math.cos(d * 1.8 + zone.comBase) * 0.06);
      const indNoise = (Math.sin(d * 0.9 + zone.indBase) * 0.07);

      let domestic = Math.round(zone.domBase * tempDemandFactor * rainReductionFactor * weekendDomFactor * (1 + domNoise));
      let commercial = Math.round(zone.comBase * tempDemandFactor * weekendComFactor * (1 + comNoise));
      let industrial = Math.round(zone.indBase * weekendIndFactor * (1 + indNoise));

      // Injected Specific Realistic Anomalies for ML Detection Validation
      // 1. Zone 2 (North Urban Residential) Pipe Burst on Day 45-47
      if (zone.id === 'Zone_2' && d >= 45 && d <= 47) {
        domestic += Math.round(zone.domBase * 0.75); // Major unexplained surge
      }
      // 2. Zone 4 (Industrial) Emergency Continuous Production Overtime Day 112-114
      if (zone.id === 'Zone_4' && d >= 112 && d <= 114) {
        industrial += Math.round(zone.indBase * 0.85); // Industrial surge
      }
      // 3. Zone 3 (East Suburban) Faulty Smart Meter Recording Drop Day 82-84
      if (zone.id === 'Zone_3' && d >= 82 && d <= 84) {
        domestic = Math.round(domestic * 0.35); // Abnormal drop
      }
      // 4. Zone 1 (Downtown) Heatwave & Summer Festival Surge Day 165-167
      if (zone.id === 'Zone_1' && d >= 165 && d <= 167) {
        commercial += Math.round(zone.comBase * 0.65);
        domestic += Math.round(zone.domBase * 0.40);
      }
      // 5. Zone 5 (West District) Pipeline Maintenance Outage Day 190
      if (zone.id === 'Zone_5' && d === 190) {
        domestic = Math.round(domestic * 0.45);
        commercial = Math.round(commercial * 0.50);
      }

      const totalConsumption = domestic + commercial + industrial;

      // History tracking for lags
      const history = zoneHistories[zone.id];
      const prevDay = history.length > 0 ? history[history.length - 1] : Math.round(totalConsumption * 0.98);
      const prevWeek = history.length >= 7 ? history[history.length - 7] : Math.round(totalConsumption * 1.01);

      history.push(totalConsumption);

      records.push({
        id: recordId++,
        Date: dateStr,
        Zone_ID: zone.id,
        Population: population,
        Temperature: temperature,
        Rainfall: rainfall,
        Humidity: humidity,
        Number_of_Households: households,
        Domestic_Usage: domestic,
        Commercial_Usage: commercial,
        Industrial_Usage: industrial,
        Previous_Day_Consumption: prevDay,
        Previous_Week_Consumption: prevWeek,
        Total_Consumption: totalConsumption,
      });
    }
  }

  return records;
}

export const INITIAL_DATASET = generateRealisticDataset();

/**
 * Returns raw CSV string representation of the dataset for local file downloading
 */
export function generateRawCSV(data: WaterRecord[]): string {
  const headers = [
    'Date',
    'Zone_ID',
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

  const rows = data.map(r => [
    r.Date,
    r.Zone_ID,
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
    r.Total_Consumption
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}
