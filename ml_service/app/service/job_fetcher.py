import httpx
from datetime import datetime, timezone
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
        self.base_url = f"https://{self.api_host}"
        self.arbeitnow_url = "https://www.arbeitnow.com/api/job-board-api"
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
            logger.warning(
                "JSearch API key is not configured. Set JSEARCH_API_KEY (or RAPIDAPI_KEY/RAPID_API_KEY). Falling back to Arbeitnow live jobs."
            )
            return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)

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
                    return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)

        except Exception as e:
            logger.error(f"Job search failed: {str(e)}")
            return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)

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

    async def _search_arbeitnow(
        self,
        query: str,
        location: Optional[str],
        num_pages: int,
        remote_jobs_only: Optional[bool],
    ) -> List[Dict]:
        """
        No-key fallback using Arbeitnow public API.
        This keeps real-time jobs available when RapidAPI key is missing/unavailable.
        """
        effective_remote = self.default_remote if remote_jobs_only is None else bool(remote_jobs_only)
        query_terms = [term.strip().lower() for term in str(query or "").split() if term.strip()]
        location_lower = str(location or "").strip().lower()

        collected: list[dict] = []
        max_pages = max(1, min(int(num_pages or 1), 3))

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                for page in range(1, max_pages + 1):
                    response = await client.get(self.arbeitnow_url, params={"page": str(page)})
                    response.raise_for_status()
                    payload = response.json()
                    rows = payload.get("data", []) if isinstance(payload, dict) else []
                    if not rows:
                        break
                    collected.extend(rows)
        except Exception as error:
            logger.error(f"Arbeitnow fallback job search failed: {error}")
            return []

        filtered: list[dict] = []
        for row in collected:
            title = str(row.get("title") or "").strip().lower()
            description = str(row.get("description") or "").strip().lower()
            company = str(row.get("company_name") or "").strip().lower()
            row_location = str(row.get("location") or "").strip().lower()
            is_remote = bool(row.get("remote"))

            if effective_remote and not is_remote:
                continue
            if location_lower and location_lower not in row_location:
                continue
            if query_terms:
                haystack = f"{title} {description} {company}"
                if not any(term in haystack for term in query_terms):
                    continue
            filtered.append(row)

        formatted = [self._format_arbeitnow_job(row) for row in filtered]
        logger.info(f"Arbeitnow fallback returned {len(formatted)} jobs for query '{query}'")
        return formatted

    def _format_arbeitnow_job(self, job: Dict) -> Dict:
        created = job.get("created_at")
        created_iso = None
        if isinstance(created, (int, float)):
            created_iso = datetime.fromtimestamp(created, tz=timezone.utc).isoformat()

        tags = job.get("tags") if isinstance(job.get("tags"), list) else []
        return {
            "title": job.get("title"),
            "company": job.get("company_name"),
            "location": job.get("location"),
            "description": job.get("description"),
            "salary": None,
            "posted_date": created_iso,
            "apply_link": job.get("url"),
            "employment_type": ", ".join(job.get("job_types", [])) if isinstance(job.get("job_types"), list) else None,
            "is_remote": bool(job.get("remote")),
            "source": "arbeitnow",
            "company_logo": None,
            "required_skills": [str(item) for item in tags if item],
            "required_experience": None,
            "required_education": None,
        }
