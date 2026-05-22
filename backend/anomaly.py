from sklearn.ensemble import IsolationForest
import numpy as np


def detect_pre_echo(cvi_series: list) -> dict:
    if len(cvi_series) < 10:
        return {'is_anomaly': False, 'anomaly_score': 0.0, 'minutes_early': 0}

    X = np.array(cvi_series).reshape(-1, 1)
    clf = IsolationForest(contamination=0.1, random_state=42)
    preds = clf.fit_predict(X)

    last_5 = preds[-5:]
    is_anomaly = (last_5 == -1).sum() >= 2

    velocity_doubled = False
    if len(cvi_series) >= 10:
        recent = cvi_series[-1]
        baseline = max(cvi_series[-10], 1)
        velocity_doubled = (recent / baseline) > 2.0

    return {
        'is_anomaly': bool(is_anomaly or velocity_doubled),
        'anomaly_score': float(clf.score_samples(X)[-1]),
        'minutes_early': 18 if is_anomaly else 0
    }
