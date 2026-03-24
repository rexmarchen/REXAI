import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
from app.models.feature_extractor import FeatureExtractor
from app.models.predictor import CareerPredictor

# Load dataset (example: CSV with columns 'resume_text' and 'job_title')
df = pd.read_csv("data/raw/resumes.csv")

# Clean and feature extraction
extractor = FeatureExtractor()
X = extractor.fit_transform(df['resume_text'].tolist())
y = df['job_title'].values

# Split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train predictor
predictor = CareerPredictor()
predictor.train(X_train, y_train)

# Evaluate
y_pred = predictor.predict(X_test)
print(classification_report(y_test, y_pred[0]))

# Save models
extractor.save("data/models/tfidf_vectorizer.pkl")
predictor.save("data/models/career_model.pkl")