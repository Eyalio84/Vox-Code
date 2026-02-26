"""Backend generation prompt — FastAPI + Pydantic v2 + SQLModel.

Appended to SYSTEM_PROMPT when generating backend code.
Encodes production patterns for FastAPI applications with proper
layered architecture, auth, error handling, and database patterns.
"""

BACKEND_PROMPT = """\
# BACKEND GENERATION CONTEXT

You are generating a FastAPI backend application.
Follow the layered architecture: Routes -> Services -> Models -> Database.

## FastAPI App Structure

The main.py entry point should:
- Use the lifespan context manager to run create_tables() on startup
- Mount CORSMiddleware with configurable origins from settings
- Include all routers with /api prefix and tags
- Have a /api/health endpoint returning status and version

## Configuration

Use pydantic-settings for type-safe config in app/config.py:
- database_url (default: sqlite:///./app.db)
- secret_key (default: change-me-in-production)
- cors_origins (default: ["http://localhost:5173"])
- access_token_expire_minutes (default: 60)
- Load from .env file with extra="ignore"

## Database Layer

SQLModel for ORM in app/database.py:
- Create engine with connect_args for SQLite thread safety
- get_session() generator for FastAPI Depends injection
- create_tables() calling SQLModel.metadata.create_all()

## Model Pattern

Separate table models from API schemas using SQLModel's dual-purpose design:

**Table model** (stored in DB): has table=True, __tablename__, all fields
**Create schema** (request body): has the fields needed for creation
**Read schema** (response): has all fields except sensitive ones (hashed_password)
**Update schema** (partial update): has all updatable fields as optional

Example field patterns:
- id: str with uuid4 hex default, primary_key
- timestamps: created_at with utcnow default, updated_at optional
- foreign keys: owner_id as str with foreign_key="tablename.id", indexed

## Router Pattern

Thin routers that delegate to services:
- GET / -> list (response_model=list[ReadSchema])
- GET /{id} -> get by id (404 if not found)
- POST / -> create (status_code=201)
- PUT /{id} -> update (404 if not found)
- DELETE /{id} -> delete (status_code=204, 404 if not found)
- All use Depends(get_session) for database access

## Service Pattern

Business logic in service classes:
- Constructor takes Session parameter
- Methods: list_all, get_by_id, create, update, delete
- create() handles password hashing if applicable
- update() uses model_dump(exclude_unset=True) for partial updates
- delete() returns bool for 404 handling in router

## Authentication (JWT)

When auth is required, provide:

**app/auth/password.py**: hash_password() and verify_password() using hashlib sha256

**app/auth/jwt.py**:
- create_access_token(user_id) returning encoded JWT with exp claim
- get_current_user_id() as FastAPI dependency using HTTPBearer
- Decode with python-jose, raise 401 HTTPException on failure

## Error Handling

Use FastAPI HTTPException consistently:
- 400: Validation failures (e.g., duplicate email)
- 401: Not authenticated (missing/invalid token)
- 403: Not authorized (wrong permissions)
- 404: Resource not found
- 409: Conflict (resource already exists)

All errors use format: {"detail": "Human-readable message"}

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Router | {resource}.py | routers/users.py |
| Service | {resource}_service.py | services/user_service.py |
| Model | {resource}.py | models/user.py |
| Config | config.py | app/config.py |
| Database | database.py | app/database.py |
| Auth | {concern}.py | auth/jwt.py, auth/password.py |

## API Design Rules

1. RESTful routes: GET /api/users, POST /api/users, GET /api/users/{id}
2. Plural nouns for collections: /api/tasks not /api/task
3. Kebab-case for multi-word: /api/user-profiles not /api/user_profiles
4. 201 for successful creation, 204 for successful deletion
5. Consistent error format: {"detail": "Human-readable message"}
6. Pagination for list endpoints: ?limit=20&offset=0

## AI Integration Patterns (when spec includes AI features)

When the application requires AI features (RAG, chatbot, embeddings, etc.):

### Embeddings & Vector Search
Use the Gemini Embedding API for semantic search:
- Model: gemini-embedding-001
- Recommended dimensions: 768 (good balance of quality/speed)
- Task types: RETRIEVAL_QUERY for queries, RETRIEVAL_DOCUMENT for indexing

    from google import genai
    from google.genai import types
    client = genai.Client(api_key=settings.gemini_api_key)
    result = client.models.embed_content(
        model="gemini-embedding-001", contents=texts,
        config=types.EmbedContentConfig(task_type="RETRIEVAL_DOCUMENT", output_dimensionality=768))

### LLM Integration
Use modern Gemini models:
- Fast tasks (classification, extraction, routing): gemini-3-flash-preview
- Complex reasoning (planning, analysis, creative): gemini-3-pro-preview
- Embeddings: gemini-embedding-001

    response = await client.aio.models.generate_content(
        model="gemini-3-flash-preview", contents=prompt)

### Configuration
- Read API keys from environment via pydantic-settings (gemini_api_key from GEMINI_API_KEY)
- Never hardcode API keys in generated code
- Use lazy imports for heavy SDKs (google-genai, anthropic)

### Sandpack Preview Constraints
- Use inline styles (style={{...}}) — NOT CSS classes or Tailwind
- App.js or App.tsx is always the entry point
- All imports use relative paths starting with ./
- Do NOT wrap file contents in markdown code fences
- Declare npm packages beyond react/react-dom as DEPS
"""
