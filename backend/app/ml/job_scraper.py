import os
from tavily import TavilyClient

client = TavilyClient(api_key=os.environ.get("TAVILY_API_KEY"))


def scrape_jobs(
    job_title: str,
    location: str = "Remote",
    num_results: int = 5,
) -> list:
    query = f"{job_title} jobs {location} 2025 hiring"

    try:
        response = client.search(
            query=query,
            search_depth="basic",
            max_results=num_results,
            include_answer=False,
        )

        jobs = []
        for result in response.get("results", []):
            jobs.append(
                {
                    "title": result.get("title", ""),
                    "url": result.get("url", ""),
                    "description": result.get("content", "")[:300],
                    "source": result.get("url", "").split("/")[2]
                    if result.get("url")
                    else "",
                }
            )

        return jobs

    except Exception as e:
        print("Tavily error:", e)
        return []


def search_jobs_for_resume(
    job_titles: list,
    skills: list,
    location: str = "Remote",
) -> dict:
    all_jobs = []

    # Top 2 job titles এর জন্য search করো
    for title in job_titles[:2]:
        jobs = scrape_jobs(title, location, num_results=3)
        for job in jobs:
            job["searched_for"] = title
        all_jobs.extend(jobs)

    # Skills based search
    if skills:
        skill_query = " ".join(skills[:3])
        skill_jobs = scrape_jobs(
            f"{skill_query} developer engineer",
            location,
            num_results=3,
        )
        for job in skill_jobs:
            job["searched_for"] = "skills_based"
        all_jobs.extend(skill_jobs)

    # Deduplicate by URL
    seen = set()
    unique_jobs = []
    for job in all_jobs:
        if job["url"] not in seen:
            seen.add(job["url"])
            unique_jobs.append(job)

    return {
        "jobs": unique_jobs[:8],
        "total": len(unique_jobs),
        "search_queries": job_titles[:2],
    }
