import numpy as np
from sklearn.metrics.pairwise import cosine_similarity

class ATSScorer:
    def __init__(self, vectorizer):
        self.vectorizer = vectorizer

    def score(self, resume_text: str, job_description: str = None) -> float:
        resume_vec = self.vectorizer.transform([resume_text])
        if job_description:
            job_vec = self.vectorizer.transform([job_description])
            sim = cosine_similarity(resume_vec, job_vec)[0][0]
            return float(sim)
        else:
            # If no job description, return a baseline score (e.g., keyword density)
            # For simplicity, return a random-ish score (you can improve)
            return 0.5