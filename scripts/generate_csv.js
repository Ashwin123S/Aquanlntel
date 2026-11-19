import fs from 'fs';
import path from 'path';

const zones = [
  { id: 'Zone_1', basePop: 45000, households: 14000, domBase: 4200, comBase: 6500, indBase: 1200 },
  { id: 'Zone_2', basePop: 85000, households: 28000, domBase: 8900, comBase: 2100, indBase: 900 },
  { id: 'Zone_3', basePop: 62000, households: 19500, domBase: 6800, comBase: 1400, indBase: 450 },
  { id: 'Zone_4', basePop: 22000, households: 6800, domBase: 2400, comBase: 3200, indBase: 9400 },
  { id: 'Zone_5', basePop: 51000, households: 16200, domBase: 5400, comBase: 4100, indBase: 2800 },
];

const totalDays = 225;
const startDate = new Date('2025-01-01');

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

const rows = [headers.join(',')];

const zoneHistories = {
  Zone_1: [],
  Zone_2: [],
  Zone_3: [],
  Zone_4: [],
  Zone_5: [],
};

for (let d = 0; d < totalDays; d++) {
  const currentDate = new Date(startDate);
  currentDate.setDate(startDate.getDate() + d);
  const dateStr = currentDate.toISOString().split('T')[0];
  const dayOfYear = d + 1;
  const dayOfWeek = currentDate.getDay();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  const seasonalFactor = Math.sin(((dayOfYear - 80) / 365) * 2 * Math.PI);
  const baseTemp = 24 + 11 * seasonalFactor;
  const tempNoise = (Math.sin(d * 1.7) * 2.5) + (Math.cos(d * 0.9) * 1.5);
  const temperature = Math.round((baseTemp + tempNoise) * 10) / 10;

  let rainfall = 0;
  const rainChance = Math.sin((dayOfYear / 365) * 2 * Math.PI + 1.2);
  if (rainChance > 0.3 && Math.sin(d * 3.4) > 0.2) {
    rainfall = Math.round((Math.abs(Math.sin(d * 5.1)) * 38 + 2) * 10) / 10;
  }

  let baseHumidity = 58 - (temperature - 20) * 0.9;
  if (rainfall > 0) baseHumidity += 25;
  const humidity = Math.min(98, Math.max(25, Math.round(baseHumidity + Math.sin(d * 2.1) * 8)));

  for (const zone of zones) {
    const popJitter = 1 + (Math.sin(d * 0.15 + zone.domBase) * 0.02);
    const population = Math.round(zone.basePop * popJitter);
    const households = Math.round(zone.households * popJitter);

    const tempDemandFactor = 1 + Math.max(0, (temperature - 22) * 0.018);
    const rainReductionFactor = rainfall > 5 ? 0.88 : 1.0;

    const weekendDomFactor = isWeekend ? 1.14 : 0.96;
    const weekendComFactor = isWeekend ? 0.72 : 1.08;
    const weekendIndFactor = isWeekend ? 0.60 : 1.12;

    const domNoise = (Math.sin(d * 2.3 + zone.domBase) * 0.05);
    const comNoise = (Math.cos(d * 1.8 + zone.comBase) * 0.06);
    const indNoise = (Math.sin(d * 0.9 + zone.indBase) * 0.07);

    let domestic = Math.round(zone.domBase * tempDemandFactor * rainReductionFactor * weekendDomFactor * (1 + domNoise));
    let commercial = Math.round(zone.comBase * tempDemandFactor * weekendComFactor * (1 + comNoise));
    let industrial = Math.round(zone.indBase * weekendIndFactor * (1 + indNoise));

    // Anomalies
    if (zone.id === 'Zone_2' && d >= 45 && d <= 47) domestic += Math.round(zone.domBase * 0.75);
    if (zone.id === 'Zone_4' && d >= 112 && d <= 114) industrial += Math.round(zone.indBase * 0.85);
    if (zone.id === 'Zone_3' && d >= 82 && d <= 84) domestic = Math.round(domestic * 0.35);
    if (zone.id === 'Zone_1' && d >= 165 && d <= 167) {
      commercial += Math.round(zone.comBase * 0.65);
      domestic += Math.round(zone.domBase * 0.40);
    }
    if (zone.id === 'Zone_5' && d === 190) {
      domestic = Math.round(domestic * 0.45);
      commercial = Math.round(commercial * 0.50);
    }

    const totalConsumption = domestic + commercial + industrial;

    const history = zoneHistories[zone.id];
    const prevDay = history.length > 0 ? history[history.length - 1] : Math.round(totalConsumption * 0.98);
    const prevWeek = history.length >= 7 ? history[history.length - 7] : Math.round(totalConsumption * 1.01);
    history.push(totalConsumption);

    rows.push([
      dateStr,
      zone.id,
      population,
      temperature,
      rainfall,
      humidity,
      households,
      domestic,
      commercial,
      industrial,
      prevDay,
      prevWeek,
      totalConsumption
    ].join(','));
  }
}

fs.mkdirSync('./data/raw', { recursive: true });
fs.mkdirSync('./data/processed', { recursive: true });
fs.mkdirSync('./models', { recursive: true });
fs.mkdirSync('./database', { recursive: true });
fs.writeFileSync('./data/raw/water_consumption.csv', rows.join('\n'));
console.log(`Generated ${rows.length - 1} records in ./data/raw/water_consumption.csv`);
