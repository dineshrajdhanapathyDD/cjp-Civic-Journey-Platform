"""CockroachDB Agent Skills Loader.

Discovers, indexes, and serves SKILL.md files from the cockroachdb-skills repository.
Provides semantic skill lookup so the civic agent can consult CockroachDB expertise
on-demand during database operations.

Reference: https://github.com/cockroachlabs/cockroachdb-skills
"""

import os
import re
import logging
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)

# Path to the cloned skills repository relative to backend/
SKILLS_BASE_PATH = Path(__file__).parent.parent.parent / "cockroachdb-skills" / "skills"


@dataclass
class SkillMetadata:
    """Parsed metadata from a SKILL.md frontmatter."""
    name: str
    description: str
    compatibility: str = ""
    author: str = ""
    version: str = ""
    domain: str = ""
    path: str = ""


@dataclass
class Skill:
    """A fully loaded CockroachDB Agent Skill."""
    metadata: SkillMetadata
    content: str
    sections: Dict[str, str] = field(default_factory=dict)


class CockroachDBSkillLoader:
    """Discovers and serves CockroachDB Agent Skills.

    Loads SKILL.md files from the local cockroachdb-skills repo,
    indexes them by domain and keyword, and provides lookup methods
    for the civic agent to consult relevant expertise.
    """

    def __init__(self, skills_path: Optional[Path] = None):
        self.skills_path = skills_path or SKILLS_BASE_PATH
        self._skill_index: Dict[str, SkillMetadata] = {}
        self._domain_index: Dict[str, List[str]] = {}
        self._loaded = False

    def discover_skills(self) -> int:
        """Scan the skills directory and build the index.

        Returns the number of skills discovered.
        """
        if not self.skills_path.exists():
            logger.warning(f"Skills path not found: {self.skills_path}")
            return 0

        count = 0
        for domain_dir in self.skills_path.iterdir():
            if not domain_dir.is_dir() or domain_dir.name.startswith("."):
                continue

            domain_name = domain_dir.name.replace("cockroachdb-", "")

            for skill_dir in domain_dir.iterdir():
                if not skill_dir.is_dir() or skill_dir.name.startswith("."):
                    continue

                skill_file = skill_dir / "SKILL.md"
                if not skill_file.exists():
                    continue

                metadata = self._parse_frontmatter(skill_file)
                if metadata:
                    metadata.domain = domain_name
                    metadata.path = str(skill_file)
                    self._skill_index[metadata.name] = metadata

                    if domain_name not in self._domain_index:
                        self._domain_index[domain_name] = []
                    self._domain_index[domain_name].append(metadata.name)
                    count += 1

        self._loaded = True
        logger.info(f"Discovered {count} CockroachDB skills across {len(self._domain_index)} domains")
        return count

    def _parse_frontmatter(self, skill_file: Path) -> Optional[SkillMetadata]:
        """Parse YAML frontmatter from a SKILL.md file."""
        try:
            content = skill_file.read_text(encoding="utf-8")
            # Match YAML frontmatter between --- delimiters
            match = re.match(r"^---\s*\n(.*?)\n---", content, re.DOTALL)
            if not match:
                return None

            frontmatter = match.group(1)

            # Simple YAML parsing (avoid adding pyyaml dependency)
            def extract_field(text: str, field_name: str) -> str:
                pattern = rf"^{field_name}:\s*[\"']?(.*?)[\"']?\s*$"
                m = re.search(pattern, text, re.MULTILINE)
                if m:
                    value = m.group(1).strip()
                    # Handle quoted strings
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    return value
                return ""

            name = extract_field(frontmatter, "name")
            description = extract_field(frontmatter, "description")

            if not name:
                # Fallback to directory name
                name = skill_file.parent.name

            return SkillMetadata(
                name=name,
                description=description,
                compatibility=extract_field(frontmatter, "compatibility"),
                author=extract_field(frontmatter, "author"),
                version=extract_field(frontmatter, "version"),
            )
        except Exception as e:
            logger.debug(f"Error parsing {skill_file}: {e}")
            return None

    def load_skill(self, skill_name: str) -> Optional[Skill]:
        """Load a full skill by name, including its content and sections."""
        if not self._loaded:
            self.discover_skills()

        metadata = self._skill_index.get(skill_name)
        if not metadata:
            return None

        try:
            content = Path(metadata.path).read_text(encoding="utf-8")

            # Strip frontmatter for the content body
            body = re.sub(r"^---\s*\n.*?\n---\s*\n", "", content, flags=re.DOTALL)

            # Parse major sections (## headings)
            sections = {}
            current_section = "intro"
            current_content = []

            for line in body.split("\n"):
                if line.startswith("## "):
                    if current_content:
                        sections[current_section] = "\n".join(current_content).strip()
                    current_section = line[3:].strip()
                    current_content = []
                else:
                    current_content.append(line)

            if current_content:
                sections[current_section] = "\n".join(current_content).strip()

            return Skill(metadata=metadata, content=body, sections=sections)
        except Exception as e:
            logger.error(f"Error loading skill {skill_name}: {e}")
            return None

    def list_skills(self, domain: Optional[str] = None) -> List[SkillMetadata]:
        """List available skills, optionally filtered by domain."""
        if not self._loaded:
            self.discover_skills()

        if domain:
            # Normalize domain name
            domain_key = domain.replace("cockroachdb-", "").lower()
            skill_names = self._domain_index.get(domain_key, [])
            return [self._skill_index[name] for name in skill_names if name in self._skill_index]

        return list(self._skill_index.values())

    def list_domains(self) -> List[str]:
        """List all available skill domains."""
        if not self._loaded:
            self.discover_skills()
        return list(self._domain_index.keys())

    def search_skills(self, query: str) -> List[SkillMetadata]:
        """Search skills by keyword matching against name and description.

        Simple keyword matching — suitable for agent tool use where the
        agent provides a focused query like "transaction retry" or "vector index".
        """
        if not self._loaded:
            self.discover_skills()

        query_lower = query.lower()
        query_terms = query_lower.split()
        results = []

        for metadata in self._skill_index.values():
            searchable = f"{metadata.name} {metadata.description} {metadata.domain}".lower()
            # Score by number of matching terms
            score = sum(1 for term in query_terms if term in searchable)
            if score > 0:
                results.append((score, metadata))

        # Sort by relevance (highest score first)
        results.sort(key=lambda x: x[0], reverse=True)
        return [metadata for _, metadata in results]

    def get_skill_section(self, skill_name: str, section: str) -> Optional[str]:
        """Get a specific section from a skill (e.g., 'Steps', 'Safety Considerations').

        Useful for the agent to retrieve only the relevant portion of a skill
        without consuming the entire document.
        """
        skill = self.load_skill(skill_name)
        if not skill:
            return None

        # Try exact match first
        if section in skill.sections:
            return skill.sections[section]

        # Try case-insensitive match
        section_lower = section.lower()
        for key, value in skill.sections.items():
            if key.lower() == section_lower:
                return value

        return None


# Singleton
_skill_loader: Optional[CockroachDBSkillLoader] = None


def get_skill_loader() -> CockroachDBSkillLoader:
    """Get the singleton skill loader instance."""
    global _skill_loader
    if _skill_loader is None:
        _skill_loader = CockroachDBSkillLoader()
        _skill_loader.discover_skills()
    return _skill_loader
