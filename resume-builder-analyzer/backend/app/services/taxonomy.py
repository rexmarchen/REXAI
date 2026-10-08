import json
import os
import re
import math
from typing import Dict, List, Set, Tuple
from collections import Counter
from app.schemas import JobMatchDetails

class SkillsTaxonomy:
    _instance = None
    
    def __init__(self, json_path: str = None):
        if not json_path:
            json_path = os.path.join(os.path.dirname(__file__), "..", "data", "skills_taxonomy.json")
        
        self.skills_by_canonical: Dict[str, List[str]] = {}
        self.lookup: Dict[str, str] = {} # token/synonym -> canonical skill
        self.canonical_list: List[str] = []
        self._load(json_path)

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = SkillsTaxonomy()
        return cls._instance

    def _load(self, json_path: str):
        if not os.path.exists(json_path):
            return
            
        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            
        skills_list = data.get("skills", [])
        if isinstance(data, dict) and not skills_list:
            # Fallback if mapped by category dictionary
            for cat, items in data.items():
                if isinstance(items, list):
                    skills_list.extend(items)

        for item in skills_list:
            if not isinstance(item, dict):
                continue
            canonical = (item.get("name") or item.get("canonical", "")).strip()
            if not canonical:
                continue
            synonyms = [s.strip() for s in item.get("synonyms", []) if isinstance(s, str)]
            self.skills_by_canonical[canonical] = synonyms
            self.canonical_list.append(canonical)
            
            # Register canonical
            self.lookup[canonical.lower()] = canonical
            for syn in synonyms:
                self.lookup[syn.lower()] = canonical

    def extract_skills(self, text: str) -> Set[str]:
        """
        Extracts recognized canonical skills from text using boundary-safe matching.
        """
        if not text:
            return set()
            
        found: Set[str] = set()
        clean_text = " " + text.lower() + " "
        
        # Word boundary safe matching for all lookup tokens
        # Sort tokens by length descending so longer phrases match first (e.g. "machine learning" before "learning")
        sorted_tokens = sorted(self.lookup.keys(), key=len, reverse=True)
        
        for token in sorted_tokens:
            # Match with boundary check: allow dots and pluses (like c++, c#, .net)
            # Escape regex specials except + and #
            escaped = re.escape(token)
            # If token starts or ends with alphanumeric, enforce word boundary
            pattern = r'(?<![a-zA-Z0-9])' + escaped + r'(?![a-zA-Z0-9])'
            if re.search(pattern, clean_text):
                canonical = self.lookup[token]
                found.add(canonical)
                
        return found

    @staticmethod
    def calculate_cosine_similarity(text1: str, text2: str) -> float:
        """
        Computes term-frequency cosine similarity between two texts.
        """
        if not text1 or not text2:
            return 0.0
            
        words1 = re.findall(r'\b[a-zA-Z]{2,}\b', text1.lower())
        words2 = re.findall(r'\b[a-zA-Z]{2,}\b', text2.lower())
        
        if not words1 or not words2:
            return 0.0
            
        vec1 = Counter(words1)
        vec2 = Counter(words2)
        
        intersection = set(vec1.keys()) & set(vec2.keys())
        numerator = sum(vec1[x] * vec2[x] for x in intersection)
        
        sum1 = sum(v ** 2 for v in vec1.values())
        sum2 = sum(v ** 2 for v in vec2.values())
        denominator = math.sqrt(sum1) * math.sqrt(sum2)
        
        if not denominator:
            return 0.0
        return round(float(numerator / denominator) * 100.0, 1)

    def match_job_description(self, resume_text: str, jd_text: str) -> JobMatchDetails:
        if not jd_text or not jd_text.strip():
            return JobMatchDetails(
                matched_skills=[],
                missing_skills=[],
                coverage=100.0,
                similarity=100.0
            )
            
        resume_skills = self.extract_skills(resume_text)
        jd_skills = self.extract_skills(jd_text)
        
        if not jd_skills:
            # If JD has no recognized taxonomy skills, fall back on cosine similarity
            sim = self.calculate_cosine_similarity(resume_text, jd_text)
            return JobMatchDetails(
                matched_skills=sorted(list(resume_skills)),
                missing_skills=[],
                coverage=sim,
                similarity=sim
            )
            
        matched = jd_skills.intersection(resume_skills)
        missing = jd_skills - resume_skills
        
        coverage = round((len(matched) / len(jd_skills)) * 100.0, 1)
        similarity = self.calculate_cosine_similarity(resume_text, jd_text)
        
        return JobMatchDetails(
            matched_skills=sorted(list(matched)),
            missing_skills=sorted(list(missing)),
            coverage=coverage,
            similarity=similarity
        )
