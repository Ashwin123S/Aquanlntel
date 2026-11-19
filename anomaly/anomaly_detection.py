"""
AquaIntel: Anomaly Diagnostic Engine (anomaly_detection.py)
Computes deviations from dynamic historical baselines and generates
conservative diagnostic hypotheses.
"""

def diagnose_anomaly(zone_id: str, actual: float, expected: float, domestic: float, industrial: float, temp: float) -> dict:
    deviation_pct = round(((actual - expected) / (expected if expected > 0 else 1)) * 100, 2)
    abs_dev = abs(deviation_pct)

    if abs_dev < 20:
        return {'is_anomaly': False, 'severity': 'NORMAL', 'causes': []}

    severity = 'LOW'
    if abs_dev >= 65 or actual > 24000:
        severity = 'CRITICAL'
    elif abs_dev >= 45:
        severity = 'HIGH'
    elif abs_dev >= 30:
        severity = 'MEDIUM'

    causes = []
    if deviation_pct > 50 and domestic > expected * 0.6:
        causes.append("Possible pipeline rupture / major distribution leak")
        causes.append("Sudden residential surge or emergency firefighting load")
    elif deviation_pct > 35 and industrial > 5000:
        causes.append("Industrial facility off-peak batch operations or boiler refill")
    elif deviation_pct < -40:
        causes.append("Telemetry sensor drop / smart meter communication failure")
        causes.append("Upstream valve closure / maintenance supply restriction")
    elif temp > 34 and deviationPct > 20:
        causes.append("Extreme heatwave demand surge in municipal cooling systems")
    else:
        causes.append("Unusual consumption variation requiring field telemetry inspection")

    return {
        'is_anomaly': True,
        'zone_id': zone_id,
        'actual': actual,
        'expected': expected,
        'deviation_percentage': deviation_pct,
        'severity': severity,
        'possible_explanations': causes
    }
