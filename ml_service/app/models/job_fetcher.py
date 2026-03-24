import httpx
from app.config import settings

class JobFetcher:
    def __init__(self):
        self.base_url = settings.job_api_url
        self.api_key = settings.job_api_key
        self.app_id = settings.job_api_app_id

    async def search(self, query: str, location: str = "us", max_results: int = 10):
        params = {
            "app_id": self.app_id,
            "app_key": self.api_key,
            "what": query,
            "where": location,
            "results_per_page": max_results,
            "content-type": "application/json"
        }
        async with httpx.AsyncClient() as client:
            resp = await client.get(self.base_url, params=params)
            resp.raise_for_status()
            data = resp.json()
            return data.get("results", [])