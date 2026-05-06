import json
import math
import sys
from typing import Any, Dict, List


AXES = ["vata", "pitta", "kapha"]
THERAPIES = {
    "Abhyanga": {"vata": 0.95, "pitta": 0.45, "kapha": 0.55, "stress": 0.9, "pain": 0.8, "digestion": 0.4},
    "Shirodhara": {"vata": 0.9, "pitta": 0.8, "kapha": 0.35, "stress": 1, "sleep": 0.95, "pain": 0.3},
    "Basti": {"vata": 1, "pitta": 0.35, "kapha": 0.3, "digestion": 0.9, "pain": 0.65},
    "Nasya": {"vata": 0.55, "pitta": 0.45, "kapha": 0.85, "congestion": 1, "stress": 0.4},
    "Vamana": {"vata": 0.2, "pitta": 0.35, "kapha": 1, "congestion": 0.95, "digestion": 0.55},
    "Virechana": {"vata": 0.25, "pitta": 1, "kapha": 0.45, "digestion": 0.85, "skin": 0.85},
    "Swedana": {"vata": 0.7, "pitta": 0.25, "kapha": 0.9, "pain": 0.8, "congestion": 0.8},
    "Udvartana": {"vata": 0.35, "pitta": 0.45, "kapha": 1, "weight": 0.95, "circulation": 0.8},
}
THERAPY_SPECIALIZATION = {
    "Abhyanga": "massage",
    "Shirodhara": "stress",
    "Basti": "detox",
    "Nasya": "respiratory",
    "Vamana": "detox",
    "Virechana": "detox",
    "Swedana": "steam",
    "Udvartana": "massage",
}


def title(value: str) -> str:
    return value[:1].upper() + value[1:]


def normalize_answers(answers: Any) -> List[Any]:
    if isinstance(answers, list):
        return answers
    if isinstance(answers, dict):
        return list(answers.values())
    return []


def score_prakriti_answers(payload: Dict[str, Any]) -> Dict[str, float]:
    answers = normalize_answers(payload.get("answers", payload))
    scores = {axis: 0.0 for axis in AXES}

    for index, answer in enumerate(answers):
        if isinstance(answer, str):
            axis = answer.lower()
            if axis in scores:
                scores[axis] += 5.0

        if isinstance(answer, dict):
            weight = float(answer.get("weight", 1) or 1)
            for axis in AXES:
                scores[axis] += float(answer.get(axis, 0) or 0) * weight

        scores[AXES[index % 3]] += 0.2

    return scores


def build_prakriti_features(scores: Dict[str, float]) -> Dict[str, Any]:
    total = sum(scores.values()) or 1.0
    ranked = sorted(
        [
            {
                "axis": axis,
                "score": scores[axis],
                "pct": round((scores[axis] / total) * 100),
            }
            for axis in AXES
        ],
        key=lambda item: item["score"],
        reverse=True,
    )
    score_map = {item["axis"]: item["pct"] for item in ranked}
    return {
        "ranked": ranked,
        "scores": {
            "vata": score_map["vata"],
            "pitta": score_map["pitta"],
            "kapha": score_map["kapha"],
        },
        "top_axis": ranked[0]["axis"],
        "second_axis": ranked[1]["axis"],
        "top_pct": ranked[0]["pct"],
        "second_pct": ranked[1]["pct"],
        "third_pct": ranked[2]["pct"],
        "top_gap": ranked[0]["pct"] - ranked[1]["pct"],
        "low_gap": ranked[1]["pct"] - ranked[2]["pct"],
    }


def decision_tree_prakriti(features: Dict[str, Any]) -> Dict[str, Any]:
    path = []

    if features["top_pct"] >= 45:
        path.append("top_pct >= 45")
        if features["top_gap"] >= 12:
            path.append("top_gap >= 12")
            return {
                "primary": title(features["top_axis"]),
                "secondary": None,
                "treePath": path,
            }

        path.append("top_gap < 12")
        return {
            "primary": title(features["top_axis"]),
            "secondary": title(features["second_axis"]),
            "treePath": path,
        }

    path.append("top_pct < 45")
    if features["third_pct"] >= 28 and features["low_gap"] <= 8:
        path.append("third_pct >= 28 and low_gap <= 8")
        return {
            "primary": "Tridoshic",
            "secondary": None,
            "treePath": path,
        }

    path.append("dual constitution branch")
    return {
        "primary": title(features["top_axis"]),
        "secondary": title(features["second_axis"]),
        "treePath": path,
    }


def classify_prakriti(payload: Dict[str, Any]) -> Dict[str, Any]:
    scores = score_prakriti_answers(payload)
    features = build_prakriti_features(scores)
    decision = decision_tree_prakriti(features)

    primary = decision["primary"]
    secondary = decision["secondary"]
    top_pct = features["top_pct"]

    return {
        "primary": primary,
        "secondary": secondary,
        "prakriti": f"{primary}-{secondary}" if secondary else primary,
        "confidence": max(55, top_pct),
        "scores": features["scores"],
        "explanation": (
            f"Decision tree classified {primary} from Vata/Pitta/Kapha questionnaire features. "
            f"Top alignment is {top_pct}%; secondary pattern is "
            f"{secondary or 'not selected by the tree'}."
        ),
        "engine": "python",
        "model": "decision-tree-prakriti-classifier-v1",
        "treePath": decision["treePath"],
    }


def cosine(a: Dict[str, float], b: Dict[str, float]) -> float:
    keys = set(a.keys()) | set(b.keys())
    dot = sum((a.get(key, 0) or 0) * (b.get(key, 0) or 0) for key in keys)
    mag_a = math.sqrt(sum((a.get(key, 0) or 0) ** 2 for key in keys))
    mag_b = math.sqrt(sum((b.get(key, 0) or 0) ** 2 for key in keys))
    return dot / ((mag_a * mag_b) or 1)


def recommend_therapy(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    profile = payload.get("profile", payload)
    prakriti = profile.get("prakriti") or ""
    vector = {
        "vata": 1 if "vata" in prakriti.lower() else 0.25,
        "pitta": 1 if "pitta" in prakriti.lower() else 0.25,
        "kapha": 1 if "kapha" in prakriti.lower() else 0.25,
    }

    for item in profile.get("medicalConditions") or profile.get("conditions") or []:
        key = str(item).lower()
        if "stress" in key:
            vector["stress"] = 1
        if "sleep" in key:
            vector["sleep"] = 1
        if "digest" in key:
            vector["digestion"] = 1
        if "pain" in key:
            vector["pain"] = 1
        if "skin" in key:
            vector["skin"] = 1
        if "weight" in key:
            vector["weight"] = 1
        if "congest" in key:
            vector["congestion"] = 1

    ranked = []
    for therapy_type, therapy_vector in THERAPIES.items():
        ranked.append({
            "therapyType": therapy_type,
            "confidence": round(cosine(vector, therapy_vector) * 100),
            "reasoning": (
                f"{therapy_type} matches {prakriti or 'the submitted profile'} patterns, "
                "symptom goals, and seasonal balancing heuristics from the seeded Panchakarma outcome matrix."
            ),
            "engine": "python",
            "model": "cosine-therapy-recommender-v1",
        })

    return sorted(ranked, key=lambda item: item["confidence"], reverse=True)[:3]


def predict_progress(payload: Dict[str, Any]) -> Dict[str, Any]:
    points = sorted(payload.get("points", []), key=lambda point: point.get("sessionNumber", 0))
    target = float(payload.get("target", 8) or 8)

    if len(points) < 2:
        return {
            "predictedScore": points[0].get("feedbackScore", 0) if points else 0,
            "trend": "stable",
            "estimatedSessionsToGoal": None,
            "line": points,
            "engine": "python",
            "model": "linear-regression-v1",
        }

    n = len(points)
    sum_x = sum(float(point.get("sessionNumber", 0) or 0) for point in points)
    sum_y = sum(float(point.get("feedbackScore", 0) or 0) for point in points)
    sum_xy = sum(float(point.get("sessionNumber", 0) or 0) * float(point.get("feedbackScore", 0) or 0) for point in points)
    sum_xx = sum(float(point.get("sessionNumber", 0) or 0) ** 2 for point in points)
    denominator = (n * sum_xx - sum_x ** 2) or 1
    slope = (n * sum_xy - sum_x * sum_y) / denominator
    intercept = (sum_y - slope * sum_x) / n
    next_session = float(points[-1].get("sessionNumber", 0) or 0) + 1
    predicted_score = round(slope * next_session + intercept, 1)
    estimated_sessions = max(0, math.ceil((target - intercept) / slope)) if slope > 0 else None

    return {
        "predictedScore": predicted_score,
        "trend": "improving" if slope > 0.15 else "declining" if slope < -0.15 else "stable",
        "estimatedSessionsToGoal": estimated_sessions,
        "slope": slope,
        "intercept": intercept,
        "engine": "python",
        "model": "linear-regression-v1",
    }


def patient_analytics(payload: Dict[str, Any]) -> Dict[str, Any]:
    scores = payload.get("scores") or {}
    appointments = payload.get("appointments") or []
    feedback_points = sorted(payload.get("points") or [], key=lambda point: point.get("sessionNumber", 0))
    recommendations = payload.get("recommendations") or []

    completed_sessions = sum(1 for item in appointments if item.get("status") == "completed")
    booked_sessions = sum(1 for item in appointments if item.get("status") not in ["cancelled"])
    total_recommended = max(6, len(recommendations) * 2, booked_sessions)
    progress_percent = round((booked_sessions / total_recommended) * 100) if total_recommended else 0

    trend = []
    for index, point in enumerate(feedback_points):
        previous = feedback_points[max(0, index - 2):index + 1]
        moving_avg = sum(float(item.get("feedbackScore", 0) or 0) for item in previous) / (len(previous) or 1)
        trend.append({
            "session": point.get("sessionNumber"),
            "improvement": point.get("feedbackScore", 0),
            "severity": point.get("symptomSeverity", 0),
            "movingAverage": round(moving_avg, 2),
        })

    latest = trend[-1]["improvement"] if trend else None
    first = trend[0]["improvement"] if trend else None
    improvement_delta = round(latest - first, 1) if latest is not None and first is not None else 0

    return {
        "radarData": [
            {"axis": "VATA", "score": scores.get("vata", 0)},
            {"axis": "PITTA", "score": scores.get("pitta", 0)},
            {"axis": "KAPHA", "score": scores.get("kapha", 0)},
        ],
        "therapyProgress": {
            "completed": completed_sessions,
            "booked": booked_sessions,
            "totalRecommended": total_recommended,
            "percent": min(100, progress_percent),
        },
        "improvementTrend": trend,
        "insight": (
            f"Health improvement is up by {improvement_delta} points across recorded feedback."
            if trend else
            "Book sessions and submit feedback to generate ML progress insights."
        ),
        "engine": "python",
        "model": "patient-analytics-v1",
    }


def combine_date(day: str, time: str) -> str:
    date_part = (day or "")[:10]
    if not date_part:
        return time
    return f"{date_part}T{time}:00.000Z"


def get_id(item: Dict[str, Any]) -> str:
    return str(item.get("_id") or item.get("id") or item.get("practitionerId") or "")


def score_slots(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    therapy_type = payload.get("therapyType") or ""
    preferred_times = payload.get("preferredTimes") or []
    practitioners = payload.get("practitioners") or []
    booked = payload.get("booked") or []
    day = payload.get("date") or ""
    slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"]
    booked_keys = {
        f"{item.get('practitionerId')}-{str(item.get('scheduledDate') or '')[11:16]}"
        for item in booked
    }
    desired = THERAPY_SPECIALIZATION.get(therapy_type) or therapy_type.lower()
    ranked = []

    for practitioner in practitioners:
        practitioner_id = get_id(practitioner)
        for time in slots:
            if f"{practitioner_id}-{time}" in booked_keys:
                continue

            specializations = practitioner.get("specialization") or []
            preference = 35 if time in preferred_times else 0
            match = 45 if any(desired in str(item).lower() for item in specializations) else 20
            morning = 10 if int(time[:2]) < 12 else 0
            ranked.append({
                "practitionerId": practitioner_id,
                "practitionerName": practitioner.get("name"),
                "scheduledDate": combine_date(day, time),
                "time": time,
                "score": match + preference + morning,
                "engine": "python",
                "model": "slot-ranker-v1",
            })

    return sorted(ranked, key=lambda item: item["score"], reverse=True)[:10]


def find_anomalies(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    feedback = payload.get("feedback", [])
    grouped: Dict[str, List[Dict[str, Any]]] = {}
    for item in feedback:
        grouped.setdefault(item.get("therapyType") or "General", []).append(item)

    anomalies: List[Dict[str, Any]] = []
    for items in grouped.values():
        scores = [float(item.get("symptomImprovement", 0) or 0) for item in items]
        mean = sum(scores) / (len(scores) or 1)
        variance = sum((score - mean) ** 2 for score in scores) / (len(scores) or 1)
        sd = math.sqrt(variance) or 1

        for item in items:
            z_score = (float(item.get("symptomImprovement", 0) or 0) - mean) / sd
            if abs(z_score) > 2:
                row = dict(item)
                row["zScore"] = round(z_score, 2)
                row["engine"] = "python"
                row["model"] = "z-score-anomaly-v1"
                anomalies.append(row)

    return anomalies


def month_key(value: Any) -> str:
    text = str(value or "")
    if len(text) >= 7:
        return text[:7]
    return "unscheduled"


def admin_analytics(payload: Dict[str, Any]) -> Dict[str, Any]:
    appointments = payload.get("appointments") or []
    therapies = payload.get("therapies") or []
    sessions = appointments + therapies

    popular_map: Dict[str, int] = {}
    monthly_map: Dict[str, int] = {}
    status_map: Dict[str, int] = {}

    for item in sessions:
        therapy_type = item.get("therapyType") or "Unknown"
        status = item.get("status") or "unknown"
        date_value = item.get("scheduledDate") or item.get("createdAt")
        popular_map[therapy_type] = popular_map.get(therapy_type, 0) + 1
        monthly_map[month_key(date_value)] = monthly_map.get(month_key(date_value), 0) + 1
        status_map[status] = status_map.get(status, 0) + 1

    return {
        "totalBookings": len(sessions),
        "popularTherapies": [
            {"name": name, "value": value}
            for name, value in sorted(popular_map.items(), key=lambda row: row[1], reverse=True)
        ],
        "monthlySessions": [
            {"month": month, "sessions": monthly_map[month]}
            for month in sorted(monthly_map.keys())
        ],
        "bookingsByStatus": [
            {"name": name, "value": value}
            for name, value in sorted(status_map.items())
        ],
        "engine": "python",
        "model": "admin-analytics-v1",
    }


def main() -> None:
    command = sys.argv[1] if len(sys.argv) > 1 else ""
    payload = json.loads(sys.stdin.read() or "{}")

    if command == "classify-prakriti":
        result = classify_prakriti(payload)
    elif command == "recommend-therapy":
        result = recommend_therapy(payload)
    elif command == "predict-progress":
        result = predict_progress(payload)
    elif command == "patient-analytics":
        result = patient_analytics(payload)
    elif command == "score-slots":
        result = score_slots(payload)
    elif command == "find-anomalies":
        result = find_anomalies(payload)
    elif command == "admin-analytics":
        result = admin_analytics(payload)
    else:
        raise ValueError(f"Unknown ML command: {command}")

    print(json.dumps(result))


if __name__ == "__main__":
    main()
