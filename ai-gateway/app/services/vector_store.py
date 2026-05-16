"""
Vector Store Service
In-memory FAISS vector store for RAG (IS Code retrieval)
"""
import os
import logging
import pickle
from typing import List, Dict, Any, Optional

# Import numpy first to avoid compatibility issues
import numpy as np

logger = logging.getLogger(__name__)

# Try to import faiss, fallback to simple search if not available
FAISS_AVAILABLE = False
try:
    import faiss
    FAISS_AVAILABLE = True
    logger.info("FAISS loaded successfully")
except (ImportError, AttributeError) as e:
    logger.warning(f"FAISS not available: {e}. Using sklearn cosine similarity fallback.")
    FAISS_AVAILABLE = False

from sentence_transformers import SentenceTransformer


class VectorStore:
    """In-memory FAISS vector store with sentence transformers"""
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize vector store
        
        Args:
            model_name: HuggingFace sentence transformer model
        """
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatL2(self.dimension)
        else:
            self.index = None
            self.embeddings = []
        
        self.documents: List[Dict[str, Any]] = []
        logger.info(f"Initialized vector store with {model_name} (dim={self.dimension}, FAISS={'enabled' if FAISS_AVAILABLE else 'disabled'})")
    
    def add_documents(self, documents: List[Dict[str, Any]]) -> None:
        """
        Add documents to vector store
        
        Args:
            documents: List of dicts with 'text' and optional metadata
        """
        if not documents:
            return
        
        texts = [doc.get("text", "") for doc in documents]
        embeddings = self.model.encode(texts, show_progress_bar=False)
        
        if FAISS_AVAILABLE and self.index is not None:
            self.index.add(np.array(embeddings).astype('float32'))
        else:
            self.embeddings.extend(embeddings)
        
        self.documents.extend(documents)
        
        logger.info(f"Added {len(documents)} documents to vector store (total: {len(self.documents)})")
    
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar documents
        
        Args:
            query: Search query
            top_k: Number of results to return
            
        Returns:
            List of documents with similarity scores
        """
        if len(self.documents) == 0:
            logger.warning("Vector store is empty")
            return []
        
        query_embedding = self.model.encode([query], show_progress_bar=False)
        
        if FAISS_AVAILABLE and self.index is not None:
            # Use FAISS for fast search
            distances, indices = self.index.search(
                np.array(query_embedding).astype('float32'),
                min(top_k, len(self.documents))
            )
            
            results = []
            for idx, distance in zip(indices[0], distances[0]):
                if idx < len(self.documents):
                    result = self.documents[idx].copy()
                    result["similarity_score"] = float(1 / (1 + distance))
                    results.append(result)
        else:
            # Fallback to simple cosine similarity
            from sklearn.metrics.pairwise import cosine_similarity
            
            similarities = cosine_similarity(
                query_embedding.reshape(1, -1),
                np.array(self.embeddings)
            )[0]
            
            # Get top_k indices
            top_indices = np.argsort(similarities)[::-1][:top_k]
            
            results = []
            for idx in top_indices:
                if idx < len(self.documents):
                    result = self.documents[idx].copy()
                    result["similarity_score"] = float(similarities[idx])
                    results.append(result)
        
        logger.info(f"Found {len(results)} results for query")
        return results
    
    def save(self, filepath: str) -> None:
        """Save vector store to disk"""
        try:
            if FAISS_AVAILABLE and self.index is not None:
                faiss.write_index(self.index, f"{filepath}.index")
            else:
                with open(f"{filepath}.embeddings", "wb") as f:
                    pickle.dump(self.embeddings, f)
            
            with open(f"{filepath}.docs", "wb") as f:
                pickle.dump(self.documents, f)
            logger.info(f"Saved vector store to {filepath}")
        except Exception as e:
            logger.error(f"Failed to save vector store: {str(e)}")
    
    def load(self, filepath: str) -> None:
        """Load vector store from disk"""
        try:
            if FAISS_AVAILABLE:
                self.index = faiss.read_index(f"{filepath}.index")
            else:
                with open(f"{filepath}.embeddings", "rb") as f:
                    self.embeddings = pickle.load(f)
            
            with open(f"{filepath}.docs", "rb") as f:
                self.documents = pickle.load(f)
            logger.info(f"Loaded vector store from {filepath} ({len(self.documents)} docs)")
        except Exception as e:
            logger.error(f"Failed to load vector store: {str(e)}")
    
    def clear(self) -> None:
        """Clear all documents from vector store"""
        if FAISS_AVAILABLE:
            self.index = faiss.IndexFlatL2(self.dimension)
        else:
            self.embeddings = []
        self.documents = []
        logger.info("Cleared vector store")


# Global vector store instance for IS Codes
is_code_store = VectorStore()


def initialize_is_code_store(is_code_documents: Optional[List[Dict[str, Any]]] = None) -> None:
    """
    Initialize IS Code vector store with documents
    
    Args:
        is_code_documents: List of IS Code documents with text and metadata
    """
    if is_code_documents:
        is_code_store.add_documents(is_code_documents)
    else:
        # Load sample IS Code data (in production, load from database)
        sample_codes = [
            {
                "code": "IS 456:2000",
                "title": "Plain and Reinforced Concrete - Code of Practice",
                "category": "structural",
                "text": "IS 456:2000 covers requirements for plain and reinforced concrete structures. Minimum reinforcement in beams shall be 0.85 bd/fy for Fe 415 steel. Maximum spacing of stirrups shall not exceed 0.75d or 300mm."
            },
            {
                "code": "IS 800:2007",
                "title": "General Construction in Steel - Code of Practice",
                "category": "structural",
                "text": "IS 800:2007 covers design of steel structures. Minimum thickness of steel plates in compression shall be 6mm. Slenderness ratio of compression members shall not exceed 180."
            },
            {
                "code": "IS 1893:2016",
                "title": "Criteria for Earthquake Resistant Design of Structures",
                "category": "seismic",
                "text": "IS 1893:2016 Part 1 covers seismic design criteria. Zone factors: Zone V=0.36, Zone IV=0.24, Zone III=0.16, Zone II=0.10. Response reduction factor for SMRF is 5."
            },
            {
                "code": "IS 875:2015",
                "title": "Design Loads for Buildings and Structures",
                "category": "loads",
                "text": "IS 875 Part 1 covers dead loads. Unit weight of RCC is 25 kN/m³. Part 2 covers live loads: residential 2 kN/m², office 3 kN/m², assembly 5 kN/m². Part 3 covers wind loads."
            },
            {
                "code": "IS 2911:2010",
                "title": "Design and Construction of Pile Foundations",
                "category": "geotechnical",
                "text": "IS 2911 Part 1 covers pile foundations. Safe bearing capacity of piles in clay: Qp = Nc × c × Ap. For driven piles in sand, use SPT N-values. Minimum pile diameter is 200mm."
            },
            {
                "code": "IS 1904:1986",
                "title": "Design and Construction of Foundations in Soils",
                "category": "geotechnical",
                "text": "IS 1904 covers shallow foundations. Safe bearing capacity: q = cNc + γDfNq + 0.5γBNγ. Minimum depth of foundation: 1m for clayey soil, 0.5m for rocky soil. Apply factor of safety 3.0."
            },
        ]
        is_code_store.add_documents(sample_codes)
        logger.info("Initialized IS Code store with sample data")


def search_is_codes(query: str, top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Search IS Code database
    
    Args:
        query: Search query (e.g., "minimum reinforcement in beams")
        top_k: Number of results
        
    Returns:
        List of relevant IS Code sections
    """
    return is_code_store.search(query, top_k)
