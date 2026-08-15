# Contributing to CJP

Thank you for your interest in contributing to the Civic Journey Platform! This document provides guidelines for contributing.

## Code of Conduct

Be respectful, inclusive, and constructive. We welcome contributors of all experience levels.

## How to Contribute

### Reporting Issues

1. Check existing issues to avoid duplicates
2. Use the issue template when available
3. Include steps to reproduce, expected behavior, and actual behavior
4. Include your environment (OS, Python version, Node version)

### Submitting Changes

1. **Fork** the repository
2. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test** your changes locally
5. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add semantic search for evidence"
   ```
6. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
7. **Open a Pull Request** against `main`

### Commit Message Format

Use conventional commits:
- `feat:` — New feature
- `fix:` — Bug fix
- `docs:` — Documentation only
- `refactor:` — Code restructuring
- `test:` — Adding tests
- `chore:` — Maintenance tasks

### Pull Request Guidelines

- Describe what the PR does and why
- Link related issues
- Keep PRs focused — one feature/fix per PR
- Ensure the backend tests pass
- Ensure the frontend builds without errors

## Development Setup

See [docs/setup-steps.md](docs/setup-steps.md) for full setup instructions.

### Quick Start

```bash
# Backend
cd backend
python -m venv venv
.\venv\Scripts\activate  # or source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your credentials
python -m uvicorn src.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

## Coding Standards

### Python (Backend)

- Follow PEP 8
- Use type hints
- Maximum line length: 100 characters
- Use docstrings for functions and classes
- Run `ruff check` before committing

### TypeScript (Frontend)

- Use TypeScript strict mode
- Use functional components with hooks
- Follow the existing Tailwind CSS patterns
- Run `npx tsc --noEmit` before committing

## Architecture Guidelines

- **Agent tools** go in `backend/src/agent/tools/`
- **API endpoints** go in `backend/src/api/routes.py`
- **Database queries** use `get_cursor()` context manager
- **Vector operations** go through `backend/src/vector/`
- **Frontend pages** go in `frontend/src/pages/`
- **Reusable components** go in `frontend/src/components/`

## Adding a New Agent Tool

1. Create a new file in `backend/src/agent/tools/`
2. Use the `@tool` decorator from Strands
3. Include a clear docstring (the agent reads this)
4. Register it in `backend/src/agent/tools/__init__.py`
5. Add it to `AGENT_TOOLS` in `backend/src/agent/civic_agent.py`

Example:
```python
from strands import tool

@tool
def my_new_tool(param: str) -> str:
    """Clear description of what this tool does.
    
    Args:
        param: Description of the parameter.
    
    Returns:
        JSON string with the result.
    """
    # Implementation
    return json.dumps({"success": True})
```

## Adding New Database Tables

1. Create a new migration file in `backend/migrations/`
2. Use `CREATE TABLE IF NOT EXISTS`
3. Add vector columns with `VECTOR(1024)` if semantic search is needed
4. Create corresponding vector indexes
5. Update `docs/database.md`

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

## Questions?

Open an issue with the `question` label and we'll help you get started.
