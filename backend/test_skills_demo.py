"""Demo script to showcase CockroachDB Agent Skills integration outputs."""
import sys
sys.path.insert(0, "src")

from skills.skill_loader import get_skill_loader


def main():
    print("=" * 60)
    print("  CockroachDB Agent Skills - Integration Demo")
    print("=" * 60)

    loader = get_skill_loader()

    # --- Overview ---
    print(f"\n[1] SKILL DISCOVERY")
    print(f"    Total skills: {len(loader._skill_index)}")
    print(f"    Total domains: {len(loader._domain_index)}")
    print(f"\n    Domains breakdown:")
    for domain, skills in loader._domain_index.items():
        print(f"      - {domain}: {len(skills)} skills")
        for s in skills:
            print(f"          * {s}")

    # --- Search demos ---
    print(f"\n{'=' * 60}")
    print("[2] SEARCH DEMOS")
    print("=" * 60)

    queries = [
        "transaction retry",
        "vector index performance",
        "cluster health monitoring",
        "security audit compliance",
        "schema migration",
    ]

    for query in queries:
        results = loader.search_skills(query)
        print(f"\n    Query: '{query}'")
        print(f"    Matches: {len(results)}")
        for r in results[:3]:
            print(f"      -> {r.name}")
            print(f"         Domain: {r.domain}")
            desc_short = (r.description[:100] + "...") if len(r.description) > 100 else r.description
            print(f"         Desc: {desc_short}")

    # --- Full skill load ---
    print(f"\n{'=' * 60}")
    print("[3] FULL SKILL LOAD EXAMPLE")
    print("=" * 60)

    skill = loader.load_skill("designing-application-transactions")
    if skill:
        print(f"\n    Skill: {skill.metadata.name}")
        print(f"    Domain: {skill.metadata.domain}")
        print(f"    Compatibility: {skill.metadata.compatibility}")
        print(f"    Author: {skill.metadata.author}")
        print(f"    Version: {skill.metadata.version}")
        print(f"    Total content: {len(skill.content)} chars")
        print(f"\n    Sections ({len(skill.sections)}):")
        for section_name, section_content in skill.sections.items():
            print(f"      - {section_name} ({len(section_content)} chars)")

        # Show a specific section
        print("\n    --- Section: 'When to Use This Skill' ---")
        when_to_use = loader.get_skill_section(
            "designing-application-transactions", "When to Use This Skill"
        )
        if when_to_use:
            for line in when_to_use.split("\n")[:15]:
                print(f"    {line}")
    else:
        print("    ERROR: Could not load skill")

    # --- Domain listing ---
    print(f"\n{'=' * 60}")
    print("[4] DOMAIN: observability-and-diagnostics")
    print("=" * 60)

    obs_skills = loader.list_skills(domain="observability-and-diagnostics")
    for s in obs_skills:
        print(f"\n    {s.name}")
        desc_short = (s.description[:120] + "...") if len(s.description) > 120 else s.description
        print(f"      {desc_short}")

    # --- Simulated agent tool call ---
    print(f"\n{'=' * 60}")
    print("[5] SIMULATED AGENT TOOL CALL")
    print("=" * 60)

    print("\n    Agent calls: consult_cockroachdb_skill('transaction retry patterns')")
    results = loader.search_skills("transaction retry patterns")
    if results:
        skill = loader.load_skill(results[0].name)
        if skill:
            print(f"\n    Result:")
            print(f"      skill_name: {skill.metadata.name}")
            print(f"      domain: {skill.metadata.domain}")
            print(f"      sections: {list(skill.sections.keys())}")
            print(f"      content_preview:")
            preview = skill.content[:600]
            for line in preview.split("\n"):
                print(f"        {line}")
            print("        ...")

    print(f"\n{'=' * 60}")
    print("  INTEGRATION TEST COMPLETE")
    print("=" * 60)


if __name__ == "__main__":
    main()
