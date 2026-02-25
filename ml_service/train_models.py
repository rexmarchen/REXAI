"""
Train ML models for career prediction
Usage: python train_models.py
"""
import os
import joblib
from pathlib import Path
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression

from app.models.feature_extractor import FeatureExtractor
from app.models.predictor import CareerPredictor

# Training data
SAMPLE_RESUMES = [
    {
        "text": "Python Django FastAPI REST API backend SQL MongoDB Docker Kubernetes AWS microservices",
        "career": "Backend Developer"
    },
    {
        "text": "React TypeScript JavaScript frontend Vue Angular CSS HTML responsive design UI/UX",
        "career": "Frontend Developer"
    },
    {
        "text": "Python Machine Learning TensorFlow PyTorch data analysis NumPy pandas deep learning NLP",
        "career": "Data Scientist"
    },
    {
        "text": "AWS Docker Kubernetes Terraform infrastructure cloud DevOps CI/CD Jenkins GitLab",
        "career": "DevOps Engineer"
    },
    {
        "text": "Java Spring Boot microservices REST API backend databases SQL distributed systems",
        "career": "Backend Developer"
    },
    {
        "text": "React Native mobile iOS Android Flutter cross-platform JavaScript native development",
        "career": "Mobile Developer"
    },
    {
        "text": "Product management strategy roadmap user experience metrics analytics stakeholder management",
        "career": "Product Manager"
    },
    {
        "text": "SQL PostgreSQL MySQL database design normalization optimization indexes queries",
        "career": "Database Administrator"
    },
    {
        "text": "Full stack JavaScript Node.js Express React MongoDB complete application development",
        "career": "Full Stack Developer"
    },
    {
        "text": "C++ systems programming embedded Linux network optimization performance critical",
        "career": "Systems Engineer"
    },
    {
        "text": "Python Django REST API backend PostgreSQL task automation scripting data processing",
        "career": "Backend Developer"
    },
    {
        "text": "React TypeScript state management Redux context API component architecture patterns",
        "career": "Frontend Developer"
    },
]

def train_models():
    """Train and save models"""
    
    # Create data directory if it doesn't exist
    model_dir = Path(__file__).parent / "data" / "models"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    # Extract texts and labels
    texts = [item["text"] for item in SAMPLE_RESUMES]
    labels = [item["career"] for item in SAMPLE_RESUMES]
    
    print(f"Training on {len(texts)} samples...")
    print(f"Classes: {set(labels)}")
    
    # Train feature extractor (TF-IDF)
    print("\n1. Training TF-IDF vectorizer...")
    vectorizer = TfidfVectorizer(
        max_features=1000,
        min_df=1,
        max_df=10,
        ngram_range=(1, 2)
    )
    X = vectorizer.fit_transform(texts)
    
    # Save vectorizer
    vectorizer_path = model_dir / "tfidf_vectorizer.pkl"
    joblib.dump(vectorizer, str(vectorizer_path))
    print(f"   ✓ Saved to {vectorizer_path}")
    print(f"   Features: {X.shape[1]}")
    
    # Train classifier
    print("\n2. Training logistic regression classifier...")
    classifier = LogisticRegression(
        max_iter=1000,
        class_weight='balanced',
        random_state=42
    )
    classifier.fit(X, labels)
    
    # Save classifier
    model_path = model_dir / "career_model.pkl"
    joblib.dump(classifier, str(model_path))
    print(f"   ✓ Saved to {model_path}")
    print(f"   Classes: {classifier.classes_}")
    print(f"   Training accuracy: {classifier.score(X, labels):.2%}")
    
    print("\n✅ Model training complete!")
    print(f"\nModels saved to: {model_dir}")
    
    return model_path, vectorizer_path

if __name__ == "__main__":
    train_models()
