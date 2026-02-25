import httpx
from typing import List, Dict, Optional
from loguru import logger

from ..config import settings


class JobFetcher:
    """Fetch live job listings using JSearch API (RapidAPI)"""

    def __init__(self):
        self.api_key = settings.jsearch_api_key
        self.api_host = settings.jsearch_api_host
        self.default_remote = settings.jsearch_default_remote
        self.default_location = settings.jsearch_default_location
        self.base_url = "https://jsearch.p.rapidapi.com"
        self.timeout = httpx.Timeout(15.0)

    async def search_jobs(
        self,
        query: str,
        location: Optional[str] = None,
        page: int = 1,
        num_pages: int = 1,
        remote_jobs_only: Optional[bool] = None,
        salary_min: Optional[int] = None,
        salary_max: Optional[int] = None,
    ) -> List[Dict]:
        """
        Search for jobs using JSearch API

        Args:
            query: Job title or keywords (e.g., "Software Engineer")
            location: Location (city, state, or "remote")
            page: Page number (starts at 1)
            num_pages: Number of pages to fetch
            remote_jobs_only: Filter for remote positions only
            salary_min: Minimum annual salary
            salary_max: Maximum annual salary

        Returns:
            List of job postings
        """
        if not self.api_key:
            logger.warning("JSearch API key is not configured. Returning no jobs.")
            return []

        headers = {"X-RapidAPI-Key": self.api_key, "X-RapidAPI-Host": self.api_host}

        params = {
            "query": query,
            "page": str(page),
            "num_pages": str(num_pages),
        }

        effective_location = location or self.default_location
        if effective_location:
            params["location"] = effective_location
        effective_remote = (
            self.default_remote if remote_jobs_only is None else bool(remote_jobs_only)
        )
        if effective_remote:
            params["remote_jobs_only"] = "true"
        if salary_min:
            params["salary_min"] = str(salary_min)
        if salary_max:
            params["salary_max"] = str(salary_max)

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.get(
                    f"{self.base_url}/search",
                    headers=headers,
                    params=params
                )
                response.raise_for_status()
                data = response.json()

                if data.get("status") == "OK":
                    jobs = data.get("data", [])
                    logger.info(f"Found {len(jobs)} jobs for query '{query}'")
                    return self._format_jobs(jobs)
                else:
                    logger.error(f"API error: {data}")
                    return []

        except Exception as e:
            logger.error(f"Job search failed: {str(e)}")
            return []

    def _format_jobs(self, raw_jobs: List[Dict]) -> List[Dict]:
        """Format jobs for consistent API response"""
        formatted = []
        for job in raw_jobs:
            formatted.append({
                "title": job.get("job_title"),
                "company": job.get("employer_name"),
                "location": job.get("job_location"),
                "description": job.get("job_description"),
                "salary": job.get("job_salary"),
                "posted_date": job.get("job_posted_at_datetime_utc"),
                "apply_link": job.get("job_apply_link"),
                "employment_type": job.get("job_employment_type"),
                "is_remote": job.get("job_is_remote"),
                "source": job.get("job_publisher"),
                "company_logo": job.get("employer_logo"),
                "required_skills": job.get("job_required_skills", []),
                "required_experience": job.get("job_required_experience"),
                "required_education": job.get("job_required_education"),
            })
        return formatted
