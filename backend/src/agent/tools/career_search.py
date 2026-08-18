"""AWS Career Agent - Job Search + Skills Matching.

Uses CockroachDB vector search to find real job opportunities,
then performs skill extraction and gap analysis against the
citizen's stated skills.

All data comes from the existing job_opportunities table.
No fake jobs, skills, or scores are ever generated.
"""

import json
import logging
import time
from typing import List, Dict, Any, Optional, Set
from strands import tool

from src.db.connection import get_cursor
from src.vector.search import get_vector_search

logger = logging.getLogger(__name__)

# Known cloud/DevOps/tech skills for extraction from free-text input
KNOWN_SKILLS = {
    # AWS
    "aws", "ec2", "s3", "lambda", "iam", "rds", "dynamodb", "cloudformation",
    "cloudwatch", "ecs", "eks", "fargate", "sqs", "sns", "api gateway",
    "route53", "vpc", "elastic beanstalk", "sagemaker", "bedrock", "aurora",
    "redshift", "glue", "athena", "step functions", "codepipeline",
    "codecommit", "codebuild", "codedeploy",
    # Cloud General
    "cloud", "gcp", "azure", "multi-cloud",
    # DevOps / Infra
    "docker", "kubernetes", "k8s", "terraform", "ansible", "jenkins",
    "ci/cd", "helm", "prometheus", "grafana", "nginx", "linux",
    "git", "github actions", "gitlab ci", "circleci", "argocd",
    # Programming
    "python", "go", "golang", "java", "javascript", "typescript",
    "node.js", "nodejs", "react", "rest apis", "graphql", "rust", "c++",
    # Data / ML
    "sql", "postgresql", "cockroachdb", "mongodb", "redis", "elasticsearch",
    "kafka", "spark", "hadoop", "tensorflow", "pytorch", "machine learning",
    "data engineering", "etl", "airflow", "dbt",
    # General
    "microservices", "serverless", "devops", "sre", "security",
    "networking", "observability", "monitoring", "logging", "tracing",
    "agile", "scrum", "statistics", "excel", "tableau",
}


def extract_skills_from_text(text: str) -> List[str]:
    """Extract recognized skills from free-text user input.

    Performs case-insensitive matching against known skill keywords.
    Returns skills in their canonical form.
    """
    text_lower = text.lower()
    found_skills: List[str] = []

    # Sort by length descending so longer matches take priority
    # e.g. "api gateway" before "api"
    sorted_skills = sorted(KNOWN_SKILLS, key=len, reverse=True)

    for skill in sorted_skills:
        if skill in text_lower:
            # Capitalize nicely
            canonical = skill.upper() if skill in ("aws", "ec2", "s3", "iam", "rds",
                                                     "ecs", "eks", "sqs", "sns", "vpc",
                                                     "gcp", "sql", "etl", "sre", "dbt",
                                                     "k8s") else skill.title()
            # Special cases
            if skill == "ci/cd":
                canonical = "CI/CD"
            elif skill == "rest apis":
                canonical = "REST APIs"
            elif skill == "node.js":
                canonical = "Node.js"
            elif skill == "nodejs":
                canonical = "Node.js"
            elif skill == "graphql":
                canonical = "GraphQL"
            elif skill == "cockroachdb":
                canonical = "CockroachDB"
            elif skill == "mongodb":
                canonical = "MongoDB"
            elif skill == "postgresql":
                canonical = "PostgreSQL"
            elif skill == "elasticsearch":
                canonical = "Elasticsearch"
            elif skill == "tensorflow":
                canonical = "TensorFlow"
            elif skill == "pytorch":
                canonical = "PyTorch"
            elif skill == "golang":
                canonical = "Go"
            elif skill == "javascript":
                canonical = "JavaScript"
            elif skill == "typescript":
                canonical = "TypeScript"
            elif skill == "github actions":
                canonical = "GitHub Actions"
            elif skill == "gitlab ci":
                canonical = "GitLab CI"
            elif skill == "api gateway":
                canonical = "API Gateway"

            if canonical not in found_skills:
                found_skills.append(canonical)

    return found_skills


def normalize_skill(skill: str) -> str:
    """Normalize a skill name for comparison."""
    s = skill.strip().lower()
    # Handle common aliases
    aliases = {
        "k8s": "kubernetes",
        "golang": "go",
        "nodejs": "node.js",
        "node": "node.js",
        "postgres": "postgresql",
        "pg": "postgresql",
        "tf": "terraform",
        "js": "javascript",
        "ts": "typescript",
        "ml": "machine learning",
    }
    return aliases.get(s, s)


def compare_skills(
    user_skills: List[str],
    job_skills: List[str],
) -> Dict[str, Any]:
    """Compare user skills against job required skills.

    Returns matching skills, missing/gap skills, and match percentage.
    """
    user_normalized: Set[str] = {normalize_skill(s) for s in user_skills}
    job_normalized: Dict[str, str] = {}  # normalized -> original
    for s in job_skills:
        job_normalized[normalize_skill(s)] = s

    matching = []
    missing = []

    for norm, original in job_normalized.items():
        if norm in user_normalized:
            matching.append(original)
        else:
            missing.append(original)

    match_percentage = (len(matching) / len(job_skills) * 100) if job_skills else 0

    return {
        "matching_skills": matching,
        "missing_skills": missing,
        "match_percentage": round(match_percentage, 1),
        "total_required": len(job_skills),
        "total_matching": len(matching),
        "total_missing": len(missing),
    }


def career_search(
    query: str,
    user_skills: Optional[List[str]] = None,
    location: Optional[str] = None,
    experience_level: Optional[str] = None,
    limit: int = 10,
) -> Dict[str, Any]:
    """Perform AWS Career Agent search with skill matching.

    1. Extract skills from query if not provided explicitly
    2. Use CockroachDB vector search to find relevant jobs
    3. Compare user skills with each job's required skills
    4. Return results with match/gap analysis

    All data comes from the real job_opportunities table.
    """
    start_time = time.time()
    steps: List[Dict[str, Any]] = []

    # Step 1: Extract skills from user input
    steps.append({
        "step": "skill_extraction",
        "tool": "AWS Career Agent",
        "status": "running",
    })

    extracted_skills = extract_skills_from_text(query)
    all_user_skills = list(set((user_skills or []) + extracted_skills))

    steps[-1]["status"] = "completed"
    steps[-1]["result"] = f"Extracted {len(extracted_skills)} skills from query"

    # Step 2: Vector search for relevant jobs
    steps.append({
        "step": "vector_search",
        "tool": "CockroachDB Vector Search",
        "status": "running",
    })

    vector_search = get_vector_search()
    jobs = vector_search.search_job_opportunities(
        query=query,
        skills=all_user_skills if all_user_skills else None,
        location=location,
        experience_level=experience_level,
        limit=limit,
        threshold=0.05,  # Lower threshold to get more results from real data
    )

    steps[-1]["status"] = "completed"
    steps[-1]["result"] = f"Found {len(jobs)} matching opportunities"

    # Step 3: Skill matching and gap analysis
    steps.append({
        "step": "skill_matching",
        "tool": "AWS Career Agent",
        "status": "running",
    })

    results = []
    for job in jobs:
        job_skills = job.get("skills") or []

        # Compare skills
        skill_analysis = compare_skills(all_user_skills, job_skills)

        results.append({
            "id": str(job["id"]),
            "title": job["title"],
            "company": job["company"],
            "description": job.get("description", "")[:300],
            "location": job.get("location"),
            "work_type": job.get("work_type"),
            "employment_type": job.get("employment_type"),
            "experience_level": job.get("experience_level"),
            "salary_range": job.get("salary_range"),
            "apply_url": job.get("apply_url"),
            "source": job.get("source"),
            "source_url": job.get("source_url"),
            "posted_at": str(job.get("posted_at")) if job.get("posted_at") else None,
            "similarity_score": round(job.get("similarity", 0), 3),
            "required_skills": job_skills,
            "matching_skills": skill_analysis["matching_skills"],
            "missing_skills": skill_analysis["missing_skills"],
            "match_percentage": skill_analysis["match_percentage"],
        })

    # Sort by match percentage first, then similarity
    results.sort(key=lambda x: (x["match_percentage"], x["similarity_score"]), reverse=True)

    steps[-1]["status"] = "completed"
    steps[-1]["result"] = f"Completed skill analysis for {len(results)} jobs"

    duration_ms = int((time.time() - start_time) * 1000)

    return {
        "success": True,
        "query": query,
        "user_skills": all_user_skills,
        "extracted_skills": extracted_skills,
        "jobs": results,
        "total_found": len(results),
        "duration_ms": duration_ms,
        "steps": steps,
    }


@tool
def aws_career_search(
    query: str,
    skills: str = "",
    location: str = "",
    experience_level: str = "",
    limit: int = 10,
) -> str:
    """AWS Career Agent: Search for cloud/DevOps/AWS job opportunities with skill matching.

    Uses CockroachDB vector search to find real job opportunities matching
    the user's career interests. Extracts skills from the query, finds
    relevant positions, and performs skill gap analysis.

    IMPORTANT: Only returns real verified job listings from the database.
    Never fabricates jobs, skills, scores, or application links.

    Args:
        query: Natural language career search (e.g. "AWS Cloud DevOps jobs").
        skills: Comma-separated list of user's skills (e.g. "AWS,Python,Docker").
        location: Preferred location filter.
        experience_level: Level filter ('entry', 'mid', 'senior', 'lead').
        limit: Maximum results to return.

    Returns:
        JSON string with matched jobs, skill analysis, and gap recommendations.
    """
    try:
        user_skills = [s.strip() for s in skills.split(",") if s.strip()] if skills else None

        result = career_search(
            query=query,
            user_skills=user_skills,
            location=location or None,
            experience_level=experience_level or None,
            limit=limit,
        )

        return json.dumps(result, default=str)

    except Exception as e:
        logger.error(f"AWS Career Agent error: {e}")
        return json.dumps({"success": False, "error": str(e)})
