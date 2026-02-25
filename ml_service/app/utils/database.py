import sqlite3
import json
from pathlib import Path
from typing import Optional, Dict, List, Any

from ..config import DATA_DIR

# Database path
DB_PATH = DATA_DIR / "predictions.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


class PredictionDatabase:
    """SQLite database for storing resume predictions"""
    
    def __init__(self, db_path: str = str(DB_PATH)):
        self.db_path = db_path
        self.init_db()
    
    def init_db(self):
        """Initialize database tables"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # Predictions table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS predictions (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                resume_filename TEXT NOT NULL,
                resume_content TEXT,
                career_path TEXT,
                confidence REAL,
                ats_score REAL,
                prediction_data TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        
        # Jobs table (for storing related job listings)
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS prediction_jobs (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                prediction_id TEXT NOT NULL,
                job_data TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (prediction_id) REFERENCES predictions(id)
            )
        """)
        
        conn.commit()
        conn.close()
    
    def create_prediction(
        self,
        prediction_id: str,
        resume_filename: str,
        resume_content: Optional[str] = None,
        career_path: str = "",
        confidence: float = 0.0,
        ats_score: float = 0.0,
        prediction_data: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = None,
        jobs: Optional[List[Dict[str, Any]]] = None
    ) -> Dict[str, Any]:
        """Store prediction in database"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Store prediction
            cursor.execute("""
                INSERT INTO predictions 
                (id, user_id, resume_filename, resume_content, career_path, 
                 confidence, ats_score, prediction_data)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                prediction_id,
                user_id,
                resume_filename,
                resume_content[:1000] if resume_content else None,  # Store first 1000 chars
                career_path,
                confidence,
                ats_score,
                json.dumps(prediction_data) if prediction_data else None
            ))
            
            # Store associated jobs
            if jobs:
                for job in jobs:
                    cursor.execute("""
                        INSERT INTO prediction_jobs (prediction_id, job_data)
                        VALUES (?, ?)
                    """, (prediction_id, json.dumps(job)))
            
            conn.commit()
            
            return self.get_prediction(prediction_id)
        finally:
            conn.close()
    
    def get_prediction(self, prediction_id: str) -> Optional[Dict[str, Any]]:
        """Retrieve prediction by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM predictions WHERE id = ?
            """, (prediction_id,))
            
            row = cursor.fetchone()
            if not row:
                return None
            
            # Get associated jobs
            cursor.execute("""
                SELECT job_data FROM prediction_jobs WHERE prediction_id = ?
            """, (prediction_id,))
            
            jobs = [json.loads(job_row[0]) for job_row in cursor.fetchall()]
            
            prediction_dict = dict(row)
            if prediction_dict.get('prediction_data'):
                prediction_dict['prediction_data'] = json.loads(prediction_dict['prediction_data'])
            prediction_dict['jobs'] = jobs
            
            return prediction_dict
        finally:
            conn.close()
    
    def get_user_predictions(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """Get all predictions for a user"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM predictions 
                WHERE user_id = ? 
                ORDER BY created_at DESC 
                LIMIT ?
            """, (user_id, limit))
            
            rows = cursor.fetchall()
            predictions = []
            
            for row in rows:
                prediction_dict = dict(row)
                
                # Get associated jobs
                cursor.execute("""
                    SELECT job_data FROM prediction_jobs WHERE prediction_id = ?
                """, (prediction_dict['id'],))
                
                jobs = [json.loads(job_row[0]) for job_row in cursor.fetchall()]
                
                if prediction_dict.get('prediction_data'):
                    prediction_dict['prediction_data'] = json.loads(prediction_dict['prediction_data'])
                prediction_dict['jobs'] = jobs
                
                predictions.append(prediction_dict)
            
            return predictions
        finally:
            conn.close()
    
    def update_prediction(
        self,
        prediction_id: str,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """Update prediction fields"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            # Build update query
            allowed_fields = [
                'career_path', 'confidence', 'ats_score', 'prediction_data'
            ]
            updates = []
            values = []
            
            for field, value in kwargs.items():
                if field in allowed_fields:
                    if field == 'prediction_data':
                        value = json.dumps(value) if isinstance(value, dict) else value
                    updates.append(f"{field} = ?")
                    values.append(value)
            
            if not updates:
                return self.get_prediction(prediction_id)
            
            updates.append("updated_at = CURRENT_TIMESTAMP")
            values.append(prediction_id)
            
            query = f"UPDATE predictions SET {', '.join(updates)} WHERE id = ?"
            cursor.execute(query, values)
            conn.commit()
            
            return self.get_prediction(prediction_id)
        finally:
            conn.close()
    
    def delete_prediction(self, prediction_id: str) -> bool:
        """Delete prediction"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        try:
            cursor.execute("DELETE FROM prediction_jobs WHERE prediction_id = ?", (prediction_id,))
            cursor.execute("DELETE FROM predictions WHERE id = ?", (prediction_id,))
            conn.commit()
            return True
        finally:
            conn.close()
    
    def list_predictions(self, limit: int = 100, offset: int = 0) -> List[Dict[str, Any]]:
        """List all predictions with pagination"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()
        
        try:
            cursor.execute("""
                SELECT * FROM predictions 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            """, (limit, offset))
            
            rows = cursor.fetchall()
            predictions: list[dict[str, Any]] = []
            for row in rows:
                record = dict(row)
                if record.get("prediction_data"):
                    record["prediction_data"] = json.loads(record["prediction_data"])
                predictions.append(record)
            return predictions
        finally:
            conn.close()


# Global database instance
db = PredictionDatabase()
