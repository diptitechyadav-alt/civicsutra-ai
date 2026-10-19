import re
from typing import Set, Dict, Any, Optional
from services.geospatial_service import calculate_haversine_distance
from core.config import settings

ENGLISH_STOP_WORDS = {
    "the", "a", "an", "and", "or", "in", "on", "at", "to", "for", "of", "with",
    "by", "is", "are", "was", "were", "it", "this", "that", "there", "near", "very",
    "road", "street", "lane", "facing", "opposite", "beside"
}

HINDI_STOP_WORDS = {
    "hai", "hain", "ko", "par", "se", "mein", "aur", "ya", "yeh", "voh", "bhi",
    "tha", "the", "thi", "ka", "ki", "ke", "liye", "paas", "sammukh"
}

CIVIC_SYNONYM_GROUPS = [
    {"pothole", "crater", "cavity", "gaddha", "hole", "damaged", "asphalt", "tar", "toota", "depression"},
    {"garbage", "waste", "trash", "kachra", "dump", "overflow", "litter", "filth", "badbu"},
    {"waterlogging", "flooding", "waterlog", "paani", "jalbharaav", "stagnant", "submerged", "underpass"},
    {"drain", "gutter", "drainage", "naali", "sewer", "clogged", "choked", "sewage"},
    {"streetlight", "pole", "dark", "light", "andhera", "batti", "lamp", "bulb", "darkness"},
    {"pipeline", "pipe", "leak", "leakage", "burst", "supply", "peyjal", "flow", "gushing"},
    {"traffic", "jam", "block", "obstruction", "stuck", "congestion", "rukavat"},
]

def tokenize_civic_text(text: str) -> Set[str]:
    """Tokenizes both English and Hindi Romanized/Unicode words with stop word removal."""
    clean = re.sub(r"[^\w\s]", " ", text.lower(), flags=re.UNICODE)
    words = clean.split()
    tokens = {
        w for w in words
        if len(w) > 2 and w not in ENGLISH_STOP_WORDS and w not in HINDI_STOP_WORDS
    }
    return tokens

def calculate_semantic_similarity(text1: str, text2: str) -> float:
    """
    Computes lexical and semantic overlap between two texts.
    Leverages synonym grouping for domain-specific civic terms.
    Returns percentage between 0.0 and 100.0.
    """
    tokens1 = tokenize_civic_text(text1)
    tokens2 = tokenize_civic_text(text2)

    if not tokens1 or not tokens2:
        return 0.0

    intersection = len(tokens1.intersection(tokens2))
    union = len(tokens1.union(tokens2))
    jaccard = (intersection / union) if union > 0 else 0.0

    # Synonym matching bonus
    synonym_matched = False
    for group in CIVIC_SYNONYM_GROUPS:
        has1 = any(w in group for w in tokens1)
        has2 = any(w in group for w in tokens2)
        if has1 and has2:
            synonym_matched = True
            break

    bonus = 0.25 if synonym_matched else 0.0
    score = min(1.0, (jaccard * 0.75) + bonus)
    return round(score * 100.0, 1)

def evaluate_duplicate_candidate(
    source: Dict[str, Any], candidate: Dict[str, Any]
) -> Optional[Dict[str, Any]]:
    """
    Evaluates whether two reports represent candidate duplicates of the same underlying defect.
    Computes explainable signals: geographic proximity, semantic overlap, and category agreement.
    """
    if source.get("id") == candidate.get("id"):
        return None

    s_lat = source.get("latitude")
    s_lon = source.get("longitude")
    c_lat = candidate.get("latitude")
    c_lon = candidate.get("longitude")

    if s_lat is None or s_lon is None or c_lat is None or c_lon is None:
        return None

    distance_meters = calculate_haversine_distance(s_lat, s_lon, c_lat, c_lon)

    # Exclude reports farther than 350 meters
    if distance_meters > 350.0:
        return None

    # Semantic similarity across title and description
    source_text = f"{source.get('title', '')} {source.get('description', '')}"
    cand_text = f"{candidate.get('title', '')} {candidate.get('description', '')}"
    text_sim = calculate_semantic_similarity(source_text, cand_text)

    # Category agreement
    cat_match = source.get("category") == candidate.get("category")

    # Image similarity heuristic (handles missing images without failing)
    s_has_img = bool(source.get("image_reference"))
    c_has_img = bool(candidate.get("image_reference"))
    image_sim = 75.0 if (s_has_img and c_has_img) else (40.0 if (s_has_img or c_has_img) else 20.0)

    # Spatial score: 100 at 0m, 50 at 175m, 0 at 350m
    spatial_score = max(0.0, 100.0 - ((distance_meters / 350.0) * 100.0))

    # Combined calibrated score: 40% spatial + 35% text + 15% category + 10% image
    combined = (
        (spatial_score * 0.40)
        + (text_sim * 0.35)
        + (15.0 if cat_match else 0.0)
        + (image_sim * 0.10)
    )
    combined_score = round(min(98.0, max(15.0, combined)), 1)

    # Filter out weak signals unless very close (< 60m with category match)
    if combined_score < settings.semantic_similarity_threshold_pct and not (distance_meters <= 60.0 and cat_match):
        return None

    explanation = (
        f"{distance_meters}m geographic separation; {text_sim}% semantic text overlap; "
        f"{'matching' if cat_match else 'different'} category. Human verification required."
    )

    return {
        "source_report_id": source["id"],
        "candidate_report_id": candidate["id"],
        "location_similarity": distance_meters,
        "text_similarity": text_sim,
        "image_similarity": image_sim,
        "category_agreement": cat_match,
        "combined_score": combined_score,
        "explanation": explanation,
        "review_status": "PENDING_REVIEW",
    }
