"""Seed CJP database with demo data."""
import sys
sys.path.insert(0, ".")

from src.db.connection import get_cursor
from src.vector.embeddings import get_embedding_service
import bcrypt as _bcrypt


def seed_demo_user():
    """Create a demo user."""
    pw_hash = _bcrypt.hashpw(b"demo123", _bcrypt.gensalt()).decode()
    with get_cursor() as cursor:
        cursor.execute(
            """
            INSERT INTO users (email, username, password_hash, full_name, location, skills, experience_level)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            ON CONFLICT (username) DO NOTHING
            RETURNING id
            """,
            (
                "demo@cjp.dev",
                "demo",
                pw_hash,
                "Demo Citizen",
                "New York",
                ["Python", "AWS", "Cloud"],
                "entry",
            ),
        )
        result = cursor.fetchone()
        if result:
            print(f"  Demo user created: id={result['id']}")
        else:
            print("  Demo user already exists.")


def seed_jobs():
    """Seed verified job opportunities."""
    jobs = [
        {
            "title": "Junior Cloud Engineer",
            "company": "CloudTech Solutions",
            "description": "Entry-level cloud engineering role working with AWS services. Build and maintain cloud infrastructure using Python, Terraform, and AWS.",
            "location": "Remote",
            "work_type": "remote",
            "employment_type": "full-time",
            "skills": ["AWS", "Python", "Terraform", "Linux", "Docker"],
            "experience_level": "entry",
            "salary_range": "$65,000 - $85,000",
            "source": "LinkedIn",
            "source_url": "https://www.linkedin.com/jobs/",
            "apply_url": "https://www.linkedin.com/jobs/apply/",
        },
        {
            "title": "Software Development Intern",
            "company": "InnovateTech Inc",
            "description": "6-month internship for engineering graduates. Work on real projects using Python, JavaScript, and cloud technologies.",
            "location": "New York, NY",
            "work_type": "hybrid",
            "employment_type": "internship",
            "skills": ["Python", "JavaScript", "Git", "REST APIs"],
            "experience_level": "entry",
            "salary_range": "$25/hour",
            "source": "Indeed",
            "source_url": "https://www.indeed.com/jobs/",
            "apply_url": "https://www.indeed.com/apply/",
        },
        {
            "title": "Junior Backend Developer",
            "company": "DataFlow Systems",
            "description": "Build scalable backend services with Python and PostgreSQL. Experience with cloud platforms a plus.",
            "location": "Austin, TX",
            "work_type": "onsite",
            "employment_type": "full-time",
            "skills": ["Python", "PostgreSQL", "REST APIs", "Docker", "AWS"],
            "experience_level": "entry",
            "salary_range": "$70,000 - $90,000",
            "source": "Glassdoor",
            "source_url": "https://www.glassdoor.com/jobs/",
            "apply_url": "https://www.glassdoor.com/apply/",
        },
        {
            "title": "DevOps Engineer - Early Career",
            "company": "ScaleUp Corp",
            "description": "Join our DevOps team to build CI/CD pipelines and manage cloud infrastructure. AWS certification preferred.",
            "location": "San Francisco, CA",
            "work_type": "hybrid",
            "employment_type": "full-time",
            "skills": ["AWS", "Docker", "Kubernetes", "Python", "CI/CD"],
            "experience_level": "entry",
            "salary_range": "$80,000 - $100,000",
            "source": "LinkedIn",
            "source_url": "https://www.linkedin.com/jobs/",
            "apply_url": "https://www.linkedin.com/jobs/apply/",
        },
        {
            "title": "Full Stack Developer",
            "company": "WebCraft Digital",
            "description": "Build modern web applications using React, Node.js, and PostgreSQL. Remote-friendly team.",
            "location": "Remote",
            "work_type": "remote",
            "employment_type": "full-time",
            "skills": ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS"],
            "experience_level": "mid",
            "salary_range": "$90,000 - $120,000",
            "source": "Indeed",
            "source_url": "https://www.indeed.com/jobs/",
            "apply_url": "https://www.indeed.com/apply/",
        },
        {
            "title": "Data Analyst - Graduate Program",
            "company": "InsightMetrics",
            "description": "Graduate program for data analysts. Work with Python, SQL, and visualization tools.",
            "location": "Chicago, IL",
            "work_type": "hybrid",
            "employment_type": "full-time",
            "skills": ["Python", "SQL", "Tableau", "Statistics", "Excel"],
            "experience_level": "entry",
            "salary_range": "$55,000 - $70,000",
            "source": "Glassdoor",
            "source_url": "https://www.glassdoor.com/jobs/",
            "apply_url": "https://www.glassdoor.com/apply/",
        },
        {
            "title": "ML Engineer Intern",
            "company": "AI Frontier Labs",
            "description": "Work on production ML systems using Python, TensorFlow, and AWS SageMaker. 12-week paid internship.",
            "location": "Seattle, WA",
            "work_type": "onsite",
            "employment_type": "internship",
            "skills": ["Python", "TensorFlow", "AWS", "Machine Learning", "Statistics"],
            "experience_level": "entry",
            "salary_range": "$35/hour",
            "source": "LinkedIn",
            "source_url": "https://www.linkedin.com/jobs/",
            "apply_url": "https://www.linkedin.com/jobs/apply/",
        },
        {
            "title": "Platform Engineer",
            "company": "CloudNative Systems",
            "description": "Design and build platform infrastructure for distributed systems. Work with CockroachDB, Kubernetes, and cloud-native technologies.",
            "location": "Remote",
            "work_type": "remote",
            "employment_type": "full-time",
            "skills": ["CockroachDB", "Kubernetes", "Go", "AWS", "Terraform"],
            "experience_level": "mid",
            "salary_range": "$110,000 - $140,000",
            "source": "Indeed",
            "source_url": "https://www.indeed.com/jobs/",
            "apply_url": "https://www.indeed.com/apply/",
        },
    ]

    embedding_service = get_embedding_service()

    for i, job in enumerate(jobs):
        embed_text = (
            f"{job['title']} at {job['company']}. {job['description']}. "
            f"Skills: {', '.join(job['skills'])}. "
            f"Location: {job['location']}. Level: {job['experience_level']}"
        )
        embedding = embedding_service.generate_embedding(embed_text)
        embedding_str = f"[{','.join(str(x) for x in embedding)}]"

        with get_cursor() as cursor:
            cursor.execute(
                """
                INSERT INTO job_opportunities
                    (title, company, description, location, work_type,
                     employment_type, skills, experience_level, salary_range,
                     source, source_url, apply_url, verification_status, embedding)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, 'verified', %s::VECTOR)
                """,
                (
                    job["title"], job["company"], job["description"],
                    job["location"], job["work_type"], job["employment_type"],
                    job["skills"], job["experience_level"], job["salary_range"],
                    job["source"], job["source_url"], job["apply_url"],
                    embedding_str,
                ),
            )
        print(f"  [{i+1}/{len(jobs)}] {job['title']} at {job['company']}")

    print(f"\nSeeded {len(jobs)} job opportunities with embeddings.")


if __name__ == "__main__":
    print("CJP Seed Data")
    print("=" * 40)
    print("\nSeeding demo user...")
    seed_demo_user()
    print("\nSeeding job opportunities...")
    seed_jobs()
    print("\nDone!")
