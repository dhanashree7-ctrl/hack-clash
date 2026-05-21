def calculate_cvi(posts: list) -> dict:
    if not posts:
        return {'score': 0, 'level': 'LOW', 'neg_rate': 0, 'velocity': 0}

    total = len(posts)
    negative_emotions = ['anger', 'disgust', 'fear']
    neg_count = sum(
        1 for p in posts
        if p.get('emotion_scores') and
        max(p['emotion_scores'], key=p['emotion_scores'].get) in negative_emotions
    )

    neg_rate = neg_count / total
    velocity = min(total / 10.0, 3.0)
    spike_factor = 1.0

    raw_cvi = (neg_rate * 0.45) + (velocity * 0.35) + (spike_factor * 0.20)
    score = round(min(100, raw_cvi * 100), 1)

    if score >= 90:   level = 'CRITICAL'
    elif score >= 75: level = 'HIGH'
    elif score >= 60: level = 'MEDIUM'
    elif score >= 40: level = 'WATCH'
    else:             level = 'LOW'

    return {
        'score': score,
        'level': level,
        'neg_rate': round(neg_rate, 3),
        'velocity': round(velocity, 3)
    }
