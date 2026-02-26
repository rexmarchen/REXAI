import httpx
import re
import time
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
        self.enable_fallback = settings.jsearch_enable_fallback
        self.cache_ttl_seconds = settings.jsearch_cache_ttl_seconds
        self.base_url = f"https://{self.api_host}"
        self.arbeitnow_url = "https://www.arbeitnow.com/api/job-board-api"
        self.timeout = httpx.Timeout(settings.jsearch_timeout_seconds)
        self.last_provider = "uninitialized"
        self.last_error: Optional[str] = None
        self._cache: dict[str, tuple[float, list[dict]]] = {}

    def _set_status(self, provider: str, error: Optional[str] = None) -> None:
        self.last_provider = str(provider or "").strip() or "unknown"
        clean_error = str(error or "").strip()
        self.last_error = clean_error or None

    def status_meta(self) -> Dict:
        return {
            "provider": self.last_provider,
            "jsearch_configured": bool(self.api_key),
            "fallback_enabled": bool(self.enable_fallback),
            "error": self.last_error,
        }

    @staticmethod
    def _clone_jobs(jobs: list[dict]) -> list[dict]:
        return [dict(row) for row in jobs]

    def _cache_key(
        self,
        query: str,
        location: Optional[str],
        page: int,
        num_pages: int,
        remote_jobs_only: Optional[bool],
        salary_min: Optional[int],
        salary_max: Optional[int],
    ) -> str:
        return "|".join(
            [
                str(query or "").strip().lower(),
                str(location or "").strip().lower(),
                str(page or 1),
                str(num_pages or 1),
                str(bool(remote_jobs_only)).lower() if remote_jobs_only is not None else "none",
                str(salary_min or ""),
                str(salary_max or ""),
            ]
        )

    def _get_cached_jobs(self, key: str, allow_expired: bool = False) -> Optional[list[dict]]:
        entry = self._cache.get(key)
        if not entry:
            return None
        created_at, jobs = entry
        age_seconds = max(0.0, time.time() - float(created_at))
        if not allow_expired and age_seconds > float(self.cache_ttl_seconds):
            return None
        return self._clone_jobs(jobs)

    def _set_cached_jobs(self, key: str, jobs: list[dict]) -> None:
        self._cache[key] = (time.time(), self._clone_jobs(jobs))

    @staticmethod
    def _raw_text(job: Dict) -> str:
        return " ".join(
            [
                str(job.get("job_title") or ""),
                str(job.get("job_description") or ""),
                str(job.get("job_employment_type") or ""),
                str(job.get("job_location") or ""),
                str(job.get("job_city") or ""),
                str(job.get("job_state") or ""),
                str(job.get("job_country") or ""),
            ]
        ).lower()

    @classmethod
    def _is_remote_raw(cls, job: Dict) -> bool:
        if bool(job.get("job_is_remote")):
            return True
        corpus = cls._raw_text(job)
        return bool(re.search(r"\bremote\b|\bwork from home\b|\bwfh\b|\banywhere\b", corpus))

    @classmethod
    def _matches_location_raw(cls, job: Dict, location: str) -> bool:
        location_text = str(location or "").strip().lower()
        if not location_text:
            return True
        corpus = cls._raw_text(job)
        if location_text in corpus:
            return True
        if location_text == "india":
            return bool(
                re.search(
                    r"\bindia\b|\bbengaluru\b|\bbangalore\b|\bhyderabad\b|\bpune\b|\bmumbai\b|\bchennai\b|\bgurgaon\b|\bgurugram\b|\bnoida\b|\bdelhi\b",
                    corpus,
                )
            )
        return False

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
            message = (
                "JSearch API key is not configured. Set JSEARCH_API_KEY (or RAPIDAPI_KEY/RAPID_API_KEY)."
            )
            logger.warning(message)
            if self.enable_fallback:
                self._set_status("arbeitnow", message)
                return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)
            self._set_status("none", message)
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
        cache_key = self._cache_key(
            query=query,
            location=effective_location,
            page=page,
            num_pages=num_pages,
            remote_jobs_only=effective_remote,
            salary_min=salary_min,
            salary_max=salary_max,
        )
        fresh_cache = self._get_cached_jobs(cache_key)
        if fresh_cache is not None:
            self._set_status("jsearch-cache")
            return fresh_cache
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
                    if effective_location:
                        jobs = [
                            job for job in jobs if self._matches_location_raw(job, str(effective_location))
                        ]
                    if effective_remote:
                        jobs = [job for job in jobs if self._is_remote_raw(job)]
                    formatted_jobs = self._format_jobs(jobs)
                    self._set_cached_jobs(cache_key, formatted_jobs)
                    logger.info(f"Found {len(formatted_jobs)} jobs for query '{query}'")
                    self._set_status("jsearch")
                    return formatted_jobs

                message = f"JSearch API returned non-OK response for query '{query}'."
                logger.error(f"{message} Payload: {data}")
                stale_cache = self._get_cached_jobs(cache_key, allow_expired=True)
                if stale_cache is not None:
                    self._set_status("jsearch-cache", message)
                    return stale_cache
                if self.enable_fallback:
                    self._set_status("arbeitnow", message)
                    return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)
                self._set_status("jsearch", message)
                return []

        except Exception as e:
            message = f"JSearch request failed ({type(e).__name__}): {str(e) or 'no details'}"
            logger.error(message)
            stale_cache = self._get_cached_jobs(cache_key, allow_expired=True)
            if stale_cache is not None:
                self._set_status("jsearch-cache", message)
                return stale_cache
            if self.enable_fallback:
                self._set_status("arbeitnow", message)
                return await self._search_arbeitnow(query, location, num_pages, remote_jobs_only)
            self._set_status("jsearch", message)
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
                "is_remote": self._is_remote_raw(job),
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
            self._set_status("arbeitnow", f"Arbeitnow fallback failed: {error}")
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
