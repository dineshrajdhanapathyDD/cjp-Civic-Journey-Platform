"""Vector embedding generation using Amazon Bedrock Titan."""

import json
import boto3
import numpy as np
from typing import List, Optional
from src.config import get_settings


class EmbeddingService:
    """Generate embeddings using Amazon Bedrock Titan Embed."""

    def __init__(self):
        settings = get_settings()
        self.client = boto3.client("bedrock-runtime", region_name=settings.aws_region)
        self.model_id = settings.embedding_model_id
        self.dimensions = settings.embedding_dimensions

    def generate_embedding(self, text: str) -> List[float]:
        """Generate a single embedding vector for text."""
        body = json.dumps({
            "inputText": text[:8000],  # Titan limit
            "dimensions": self.dimensions,
            "normalize": True,
        })

        response = self.client.invoke_model(
            modelId=self.model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )

        result = json.loads(response["body"].read())
        return result["embedding"]

    def generate_embeddings_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts."""
        return [self.generate_embedding(text) for text in texts]

    def cosine_similarity(self, vec_a: List[float], vec_b: List[float]) -> float:
        """Compute cosine similarity between two vectors."""
        a = np.array(vec_a)
        b = np.array(vec_b)
        return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))


# Singleton instance
_embedding_service: Optional[EmbeddingService] = None


def get_embedding_service() -> EmbeddingService:
    global _embedding_service
    if _embedding_service is None:
        _embedding_service = EmbeddingService()
    return _embedding_service
