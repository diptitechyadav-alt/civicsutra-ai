import os
from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    environment: str = os.getenv("ENVIRONMENT", "development")
    port: int = int(os.getenv("PORT", "8000"))
    host: str = os.getenv("HOST", "0.0.0.0")
    cors_origins: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS",
            "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
        ).split(",")
    ]

    # Database
    database_url: str = os.getenv("DATABASE_URL", "sqlite:///civicsutra.db")

    # AI Configuration
    ai_provider: str = os.getenv("AI_PROVIDER", "demo")
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")
    openai_api_key: str = os.getenv("OPENAI_API_KEY", "")

    # Similarity thresholds
    duplicate_distance_threshold_meters: float = float(os.getenv("DUPLICATE_DISTANCE_THRESHOLD_METERS", "150.0"))
    semantic_similarity_threshold_pct: float = float(os.getenv("SEMANTIC_SIMILARITY_THRESHOLD_PCT", "60.0"))
    auto_cluster_min_reports: int = int(os.getenv("AUTO_CLUSTER_MIN_REPORTS", "2"))

    # Priority Scoring Weights (Documented default weights summing to 100%)
    weight_severity: int = int(os.getenv("WEIGHT_SEVERITY", "30"))
    weight_related_reports: int = int(os.getenv("WEIGHT_RELATED_REPORTS", "20"))
    weight_location_impact: int = int(os.getenv("WEIGHT_LOCATION_IMPACT", "20"))
    weight_unresolved_duration: int = int(os.getenv("WEIGHT_UNRESOLVED_DURATION", "15"))
    weight_recurrence: int = int(os.getenv("WEIGHT_RECURRENCE", "10"))
    weight_evidence_quality: int = int(os.getenv("WEIGHT_EVIDENCE_QUALITY", "5"))

settings = Settings()
