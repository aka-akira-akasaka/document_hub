# CLAUDE.md — AI Assistant Guide for document_hub

> This file is the authoritative guide for AI assistants (Claude Code, Copilot, etc.) working
> in this repository. Keep it up-to-date as the project evolves.

---

## Repository Overview

**Project:** document_hub
**Purpose:** A centralized hub for storing, indexing, searching, and managing documents.
**Status:** Freshly initialized — no source code committed yet.
**Remote:** `aka-akira-akasaka/document_hub`

---

## Git Workflow

### Branch Naming

| Purpose | Pattern | Example |
|---|---|---|
| Features | `feature/<short-description>` | `feature/pdf-upload` |
| Bug fixes | `fix/<short-description>` | `fix/search-timeout` |
| Claude sessions | `claude/<session-id>` | `claude/claude-md-mm1ibblnvezi04o8-9qvH5` |
| Releases | `release/<version>` | `release/1.2.0` |

### Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short summary>

[optional body]

[optional footer]
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Examples:
```
feat(api): add document search endpoint
fix(storage): handle empty file upload gracefully
docs(claude): update CLAUDE.md with new conventions
test(parser): add unit tests for PDF extraction
```

### Push Protocol

```bash
# Always target the correct branch
git push -u origin <branch-name>

# Retry on network failure (exponential backoff: 2s, 4s, 8s, 16s)
# Claude Code session branches must follow: claude/<session-id>
```

**Never push to `main`/`master` directly.** Use pull requests.

---

## Project Structure (Planned)

As the project is built out, maintain this structure:

```
document_hub/
├── CLAUDE.md                  # This file — keep updated
├── README.md                  # Human-facing project overview
├── .env.example               # Template for environment variables (never commit .env)
├── Makefile                   # Developer shortcuts (make test, make lint, make run)
│
├── src/                       # Application source code
│   └── document_hub/
│       ├── __init__.py
│       ├── main.py            # Application entry point
│       ├── config.py          # Configuration loading
│       ├── api/               # HTTP API layer (routes, request/response models)
│       ├── core/              # Business logic (pure, framework-agnostic)
│       ├── models/            # Database models / ORM definitions
│       ├── services/          # External integrations (storage, email, etc.)
│       └── utils/             # Shared helpers and utilities
│
├── tests/                     # All tests mirror the src/ structure
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── docs/                      # Project documentation
│   ├── architecture.md
│   ├── api.md
│   └── adr/                   # Architecture Decision Records (ADR-NNNN-title.md)
│
├── scripts/                   # One-off and maintenance scripts
├── .github/
│   └── workflows/             # CI/CD pipeline definitions
└── docker/                    # Dockerfile and compose files
```

---

## Development Environment

### Prerequisites

Document here once finalized. Typical requirements:
- Python 3.11+ (if Python) / Node.js 20+ (if JS/TS)
- Docker & Docker Compose
- `make` (for Makefile shortcuts)

### Setup

```bash
# 1. Clone and enter repo
git clone <repo-url>
cd document_hub

# 2. Copy environment template
cp .env.example .env
# Edit .env with your local values — NEVER commit .env

# 3. Install dependencies (update this section as stack is chosen)
# Python: pip install -e ".[dev]"
# Node:   npm install

# 4. Run the application
make run
# or: docker compose up
```

---

## Testing

### Running Tests

```bash
# All tests
make test

# Unit tests only
make test-unit

# Integration tests
make test-integration

# With coverage
make test-cov
```

### Test Conventions

- **Mirrors source structure:** `tests/unit/api/` matches `src/document_hub/api/`
- **File naming:** `test_<module>.py` or `<module>.test.ts`
- **Function naming:** `test_<behaviour>_when_<condition>`
- **No live external calls in unit tests** — mock all I/O and network
- **Integration tests** may use local Docker services (database, object storage)
- **Every bug fix must include a regression test**

---

## Code Conventions

### General

- **Readability over cleverness.** Write code for the next person to maintain.
- **Minimal complexity.** Three similar lines beats a premature abstraction.
- **No speculative features.** Implement only what is currently required.
- **No dead code.** Remove unused variables, functions, and imports immediately.

### Python (if applicable)

```python
# Imports: stdlib → third-party → local (separated by blank lines)
import os
from pathlib import Path

import httpx
from pydantic import BaseModel

from document_hub.config import settings
```

- Type hints on all public functions
- `ruff` for linting and formatting
- `mypy` in strict mode for type checking
- `pytest` for tests
- Prefer `pathlib.Path` over `os.path`
- Use `pydantic` for data validation at system boundaries

### TypeScript/JavaScript (if applicable)

- `eslint` + `prettier` for linting and formatting
- `vitest` or `jest` for tests
- Prefer `const` over `let`; never use `var`
- No `any` types — use `unknown` and narrow explicitly

### API Design

- RESTful by default; GraphQL if complexity warrants it
- All endpoints versioned under `/api/v1/`
- JSON request and response bodies
- HTTP status codes used semantically (200, 201, 400, 401, 403, 404, 422, 500)
- Errors return structured JSON: `{ "error": { "code": "...", "message": "..." } }`

---

## Security Conventions

- **Never commit secrets.** Use `.env` (gitignored) or a secrets manager.
- **Validate all user input** at the API boundary before passing to business logic.
- **Sanitize file names and paths** — guard against path traversal.
- **Restrict file types and sizes** on upload endpoints.
- **SQL:** always use parameterized queries; never string-interpolate user data.
- **Dependencies:** pin versions; run `pip audit` / `npm audit` in CI.

---

## Architecture Decision Records (ADRs)

Significant technical decisions are recorded in `docs/adr/`. Use the template:

```
# ADR-NNNN: Title

Date: YYYY-MM-DD
Status: Proposed | Accepted | Deprecated

## Context
What problem are we solving?

## Decision
What did we decide?

## Consequences
What are the trade-offs?
```

---

## AI Assistant Guidelines

When Claude Code or another AI assistant works in this repo:

1. **Read before editing.** Always read a file in full before modifying it.
2. **Match existing conventions.** Follow the patterns already present; don't introduce new ones without discussion.
3. **One task at a time.** Use `TodoWrite` to track multi-step work and mark items complete immediately.
4. **Prefer editing over creating.** Add to existing files before creating new ones.
5. **No speculative improvements.** Only change what was explicitly requested.
6. **Security first.** Never write code with SQL injection, XSS, path traversal, or other OWASP Top 10 vulnerabilities.
7. **Commit on the right branch.** Claude sessions use `claude/<session-id>` branches — never push to `main`.
8. **Write tests for new behaviour.** Every feature or bug fix should be accompanied by tests.
9. **Update this file.** If you discover conventions or structures not documented here, add them.
10. **Ask before destructive actions.** Confirm before deleting files, force-pushing, or dropping data.

---

## Makefile Targets (define as project grows)

| Target | Description |
|---|---|
| `make run` | Start the application locally |
| `make test` | Run the full test suite |
| `make test-unit` | Run unit tests only |
| `make test-cov` | Run tests with coverage report |
| `make lint` | Run linter (ruff / eslint) |
| `make format` | Auto-format code |
| `make typecheck` | Run type checker (mypy / tsc) |
| `make build` | Build production artifact |
| `make docker-up` | Start Docker Compose services |
| `make docker-down` | Stop Docker Compose services |

---

## Environment Variables

Document all variables in `.env.example`. Never commit real values.

| Variable | Required | Description |
|---|---|---|
| `APP_ENV` | Yes | `development`, `staging`, or `production` |
| `SECRET_KEY` | Yes | Application secret key for signing |
| `DATABASE_URL` | Yes | Full database connection string |
| `STORAGE_BACKEND` | Yes | `local`, `s3`, or `gcs` |
| `LOG_LEVEL` | No | `DEBUG`, `INFO`, `WARNING`, `ERROR` (default: `INFO`) |

*(Expand this table as new variables are added)*

---

## Updating This File

Update CLAUDE.md whenever:
- A new tool, framework, or dependency is added
- A new convention is established
- The directory structure changes
- New Make targets are added
- New environment variables are required

Keep entries concise and accurate. Remove stale information.

---

*Last updated: 2026-02-25 — Repository initialized; no source code yet.*
