import re
import joblib
from sklearn.feature_extraction.text import TfidfVectorizer

class FeatureExtractor:
    def __init__(self, vectorizer_path: str = None):
        self.vectorizer = None
        if vectorizer_path:
            self.vectorizer = joblib.load(vectorizer_path)

    @staticmethod
    def clean_text(text: str) -> str:
        # Lowercase, remove special chars, extra spaces
        text = text.lower()
        text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
        text = re.sub(r'\s+', ' ', text).strip()
        return text

    def fit(self, texts, **kwargs):
        self.vectorizer = TfidfVectorizer(**kwargs)
        self.vectorizer.fit([self.clean_text(t) for t in texts])
        return self

    def transform(self, texts):
        if self.vectorizer is None:
            raise ValueError("Vectorizer not fitted.")
        cleaned = [self.clean_text(t) for t in texts]
        return self.vectorizer.transform(cleaned)

    def save(self, path):
        joblib.dump(self.vectorizer, path)