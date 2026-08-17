"""CockroachDB Expertise Tool for the Civic Agent.

Provides the Strands agent with on-demand access to CockroachDB Agent Skills —
structured, production-grade operational knowledge from the cockroachdb-skills repo.

The agent uses this tool to consult CockroachDB expertise before making
database decisions, such as:
- Designing transaction patterns for civic data
- Optimizing vector similarity queries
- Diagnosing performance issues
- Reviewing security configurations

Reference: https://github.com/cockroachlabs/cockroachdb-skills
"""

import json
import logging
from typing import Any, Dict

from strands import tool

from src.skills.skill_loader import get_skill_loader

logger = logging.getLogger(__name__)


@tool
def consult_cockroachdb_skill(query: str, domain: str = "", section: str = "") -> Dict[str, Any]:
    """Consult CockroachDB operational expertise from the Agent Skills library.

    Use this tool when you need guidance on CockroachDB-specific operations,
    transaction design, performance optimization, security configuration,
    observability, or schema design before making database decisions.

    Args:
        query: What you need help with. Examples:
            - "transaction retry patterns"
            - "vector index performance"
            - "schema change risk"
            - "cluster health monitoring"
            - "security audit"
        domain: Optional domain filter. One of:
            - "application-development"
            - "performance-and-scaling"
            - "observability-and-diagnostics"
            - "operations-and-lifecycle"
            - "security-and-governance"
            - "query-and-schema-design"
            - "onboarding-and-migrations"
            - "resilience-and-disaster-recovery"
            - "cost-and-usage-management"
            - "integrations-and-ecosystem"
        section: Optional section to retrieve from the skill.
            Examples: "Steps", "Safety Considerations", "When to Use This Skill"

    Returns:
        Dict with matching skills and their content/guidance.
    """
    loader = get_skill_loader()

    # Search for relevant skills
    if domain:
        skills = loader.list_skills(domain=domain)
        # Further filter by query terms
        query_lower = query.lower()
        query_terms = query_lower.split()
        skills = [
            s for s in skills
            if any(term in f"{s.name} {s.description}".lower() for term in query_terms)
        ]
        # If domain filter was too restrictive, fall back to global search
        if not skills:
            skills = loader.search_skills(query)
    else:
        skills = loader.search_skills(query)

    if not skills:
        return {
            "found": False,
            "message": f"No CockroachDB skills found matching '{query}'. "
                       f"Available domains: {', '.join(loader.list_domains())}",
            "available_domains": loader.list_domains(),
        }

    # Load the top matching skill(s)
    results = []
    for skill_meta in skills[:3]:  # Return top 3 matches
        if section:
            # Return just the requested section
            section_content = loader.get_skill_section(skill_meta.name, section)
            if section_content:
                results.append({
                    "skill_name": skill_meta.name,
                    "domain": skill_meta.domain,
                    "description": skill_meta.description[:200],
                    "section": section,
                    "content": section_content[:4000],  # Cap to avoid token explosion
                })
            else:
                # Fall back to full skill load
                full_skill = loader.load_skill(skill_meta.name)
                if full_skill:
                    results.append({
                        "skill_name": skill_meta.name,
                        "domain": skill_meta.domain,
                        "description": skill_meta.description[:200],
                        "available_sections": list(full_skill.sections.keys()),
                        "content": full_skill.content[:4000],
                    })
        else:
            full_skill = loader.load_skill(skill_meta.name)
            if full_skill:
                results.append({
                    "skill_name": skill_meta.name,
                    "domain": skill_meta.domain,
                    "description": skill_meta.description[:200],
                    "available_sections": list(full_skill.sections.keys()),
                    "content": full_skill.content[:4000],
                })

    return {
        "found": True,
        "total_matches": len(skills),
        "results": results,
        "hint": "Use 'section' parameter to retrieve specific sections like 'Steps' or 'Safety Considerations'.",
    }


@tool
def list_cockroachdb_skills(domain: str = "") -> Dict[str, Any]:
    """List available CockroachDB Agent Skills, optionally filtered by domain.

    Use this tool to discover what CockroachDB expertise is available
    before consulting specific skills.

    Args:
        domain: Optional domain filter. Leave empty to list all domains and skill counts.

    Returns:
        Dict with available skills organized by domain.
    """
    loader = get_skill_loader()

    if domain:
        skills = loader.list_skills(domain=domain)
        return {
            "domain": domain,
            "skill_count": len(skills),
            "skills": [
                {"name": s.name, "description": s.description[:150]}
                for s in skills
            ],
        }

    # Return overview of all domains
    domains = loader.list_domains()
    domain_summary = {}
    for d in domains:
        skills = loader.list_skills(domain=d)
        domain_summary[d] = {
            "skill_count": len(skills),
            "skills": [s.name for s in skills],
        }

    return {
        "total_domains": len(domains),
        "total_skills": sum(info["skill_count"] for info in domain_summary.values()),
        "domains": domain_summary,
    }
