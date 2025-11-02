# System Architecture - Job Application Tracker v2.0

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                                │
├──────────────────┬──────────────────────┬──────────────────────────┤
│                  │                      │                           │
│  Web Browser     │  Browser Extension   │     Future: Mobile App   │
│  (React SPA)     │  (Chrome/Firefox)    │     (React Native)       │
│                  │                      │                           │
│  - Dashboard     │  - Popup UI          │                          │
│  - Applications  │  - Content Script    │                          │
│  - Settings      │  - Background Worker │                          │
│                  │                      │                           │
└────────┬─────────┴──────────┬───────────┴──────────────────────────┘
         │                    │
         │  HTTP/REST API     │
         │  (JSON)            │
         │                    │
┌────────▼────────────────────▼──────────────────────────────────────┐
│                       API GATEWAY LAYER                             │
│                                                                      │
│                         FastAPI Backend                             │
│                                                                      │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  Authentication Middleware (JWT)                          │     │
│  └──────────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  CORS Middleware                                          │     │
│  └──────────────────────────────────────────────────────────┘     │
│  ┌──────────────────────────────────────────────────────────┐     │
│  │  API Routers                                              │     │
│  │  - /api/auth/*        (Login, Register, Token)           │     │
│  │  - /api/applications/* (CRUD Operations)                 │     │
│  │  - /api/sync/*        (Gmail, Job Parsing)               │     │
│  │  - /api/settings/*    (User Preferences)                 │     │
│  └──────────────────────────────────────────────────────────┘     │
│                                                                      │
└──────────────────────────────┬───────────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────────┐
│                       BUSINESS LOGIC LAYER                            │
│                                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  Claude AI Service  │  │  Gmail Service      │                   │
│  │                     │  │                     │                   │
│  │  - Parse emails     │  │  - OAuth flow       │                   │
│  │  - Extract job data │  │  - Search emails    │                   │
│  │  - Parse postings   │  │  - Extract content  │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                        │
│  ┌─────────────────────┐  ┌─────────────────────┐                   │
│  │  Auth Service       │  │  Application Service│                   │
│  │                     │  │                     │                   │
│  │  - Password hash    │  │  - CRUD operations  │                   │
│  │  - JWT generation   │  │  - Filtering        │                   │
│  │  - Token validation │  │  - Statistics       │                   │
│  └─────────────────────┘  └─────────────────────┘                   │
│                                                                        │
└──────────────────────────────┬────────────────────────────────────────┘
                               │
┌──────────────────────────────▼────────────────────────────────────────┐
│                       DATA ACCESS LAYER                                │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  SQLAlchemy ORM                                                  │ │
│  │                                                                   │ │
│  │  Models:                                                         │ │
│  │  - User (authentication, profile)                                │ │
│  │  - Application (job tracking data)                               │ │
│  │  - UserSettings (preferences, API keys)                          │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└──────────────────────┬──────────────────────┬─────────────────────────┘
                       │                      │
┌──────────────────────▼──────────┐  ┌────────▼────────────────────────┐
│       DATABASE LAYER             │  │      CACHE LAYER                │
│                                  │  │                                 │
│     PostgreSQL 15                │  │     Redis 7                     │
│                                  │  │                                 │
│  - users table                   │  │  - Session storage              │
│  - applications table            │  │  - Background jobs queue        │
│  - user_settings table           │  │  - Rate limiting                │
│  - Full ACID compliance          │  │  - Temporary data               │
│  - Relational integrity          │  │                                 │
│  - Indexes for performance       │  │                                 │
└──────────────────────────────────┘  └─────────────────────────────────┘
                       │                      │
┌──────────────────────▼──────────────────────▼─────────────────────────┐
│                     EXTERNAL SERVICES                                  │
├────────────────────┬─────────────────────┬──────────────────────────┤
│                    │                     │                           │
│  Anthropic API     │   Gmail API         │   Future Integrations    │
│  (Claude AI)       │   (Google)          │                          │
│                    │                     │   - Calendar API         │
│  - Email parsing   │   - OAuth 2.0       │   - Sheets API           │
│  - Job extraction  │   - Email search    │   - Slack API            │
│  - Data inference  │   - Email read      │   - LinkedIn API         │
│                    │   - Email send      │                          │
└────────────────────┴─────────────────────┴──────────────────────────┘
```

## Data Flow Diagrams

### 1. User Registration Flow

```
User Browser                 FastAPI Backend              PostgreSQL
     │                             │                          │
     │─── POST /api/auth/register ─>                         │
     │    {email, username, pwd}   │                          │
     │                             │                          │
     │                             │─── Check existing ───────>
     │                             │<─── No match ────────────┤
     │                             │                          │
     │                             │─── Hash password         │
     │                             │                          │
     │                             │─── INSERT user ──────────>
     │                             │<─── User created ────────┤
     │                             │                          │
     │                             │─── INSERT settings ──────>
     │                             │<─── Settings created ────┤
     │                             │                          │
     │<─── 201 Created ────────────│                          │
     │    {user data}              │                          │
     │                             │                          │
```

### 2. Gmail Sync Flow

```
User Browser       FastAPI Backend      Gmail API        Claude AI       PostgreSQL
     │                    │                 │                │               │
     │─── Sync Gmail ────>                  │                │               │
     │                    │                 │                │               │
     │                    │── Get settings ─>                │               │
     │                    │<─ API keys ─────┤                │               │
     │                    │                 │                │               │
     │                    │─── Search emails ──────>         │               │
     │                    │<─── 10 emails ────────┤          │               │
     │                    │                 │                │               │
     │                    │                 │                │               │
     │                    │── Parse email 1 ────────────────>│               │
     │                    │<─ Job data ──────────────────────┤               │
     │                    │                 │                │               │
     │                    │─ Check duplicate ───────────────────────────────>
     │                    │<─ Not exists ────────────────────────────────────┤
     │                    │                 │                │               │
     │                    │─ INSERT application ─────────────────────────────>
     │                    │<─ Created ───────────────────────────────────────┤
     │                    │                 │                │               │
     │                    │   [Repeat for remaining emails]  │               │
     │                    │                 │                │               │
     │<─── Sync complete ─┤                 │                │               │
     │    {new: 8, upd: 2}                  │                │               │
     │                    │                 │                │               │
```

### 3. Browser Extension Capture Flow

```
Job Website       Extension       FastAPI Backend      Claude AI      PostgreSQL
     │               │                    │                │              │
     │<─ View job ───┤                    │                │              │
     │               │                    │                │              │
     │               │─ Extract text      │                │              │
     │               │  (content script)  │                │              │
     │               │                    │                │              │
     │               │─── POST /api/sync/parse-job ───────>              │
     │               │    {text, url}     │                │              │
     │               │                    │                │              │
     │               │                    │── Parse job ───>              │
     │               │                    │<─ Parsed data ─┤              │
     │               │                    │                │              │
     │               │<─── Parsed data ───┤                │              │
     │               │                    │                │              │
     │               │─ Show form         │                │              │
     │               │  (pre-filled)      │                │              │
     │               │                    │                │              │
User clicks save    │                    │                │              │
     │               │                    │                │              │
     │               │─── POST /api/applications ──────────>             │
     │               │    {application}   │                │              │
     │               │                    │                │              │
     │               │                    │─── INSERT ──────────────────>
     │               │                    │<─── Created ────────────────┤
     │               │                    │                │              │
     │               │<─── 201 Created ───┤                │              │
     │               │                    │                │              │
     │               │─ Show success      │                │              │
     │               │                    │                │              │
```

## Component Interactions

### Authentication Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │
       │ 1. POST /api/auth/login
       │    {username, password}
       │
┌──────▼──────────────────────────┐
│  FastAPI Authentication Router  │
│                                  │
│  2. Query user from database    │
│  3. Verify password (bcrypt)    │
│  4. Generate JWT token          │
│  5. Return {token, user}        │
└──────┬──────────────────────────┘
       │
       │ 6. Store token in localStorage
       │
┌──────▼──────────────────────────┐
│  All subsequent requests:        │
│  Authorization: Bearer <token>  │
└──────┬──────────────────────────┘
       │
┌──────▼──────────────────────────┐
│  JWT Middleware                  │
│  - Decode token                  │
│  - Verify signature              │
│  - Check expiration              │
│  - Load user from DB             │
│  - Inject into request context   │
└──────────────────────────────────┘
```

### State Management

```
┌─────────────────────────────────────────────────────────────┐
│                      React Application                       │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  AuthContext (Global State)                           │  │
│  │  - user: User | null                                  │  │
│  │  - token: string | null                               │  │
│  │  - login(username, password): Promise<void>           │  │
│  │  - logout(): void                                     │  │
│  │  - register(...): Promise<void>                       │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │  Components (consume context)                         │  │
│  │  - Dashboard                                          │  │
│  │  - Applications                                       │  │
│  │  - Settings                                           │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │  API Client (axios)                                   │  │
│  │  - Adds Authorization header                          │  │
│  │  - Handles 401 errors (auto logout)                   │  │
│  │  - Base URL configuration                             │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

## Deployment Architecture

### Development (Local)

```
┌─────────────────────────────────────────────────────┐
│                  Docker Host                         │
│                                                       │
│  ┌────────────┐  ┌────────────┐  ┌──────────────┐  │
│  │ Frontend   │  │ Backend    │  │  PostgreSQL  │  │
│  │ Container  │  │ Container  │  │  Container   │  │
│  │            │  │            │  │              │  │
│  │ Port: 3000 │  │ Port: 8000 │  │  Port: 5432  │  │
│  └────────────┘  └────────────┘  └──────────────┘  │
│                                                       │
│  ┌────────────┐                                      │
│  │   Redis    │                                      │
│  │  Container │                                      │
│  │            │                                      │
│  │ Port: 6379 │                                      │
│  └────────────┘                                      │
│                                                       │
│  docker-compose.yml                                  │
└─────────────────────────────────────────────────────┘
         ▲
         │
    localhost
```

### Production (Cloud)

```
                    ┌─────────────────┐
                    │   Load Balancer  │
                    │   (HTTPS/SSL)    │
                    └────────┬─────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
   ┌────────▼────────┐  ┌────▼──────┐  ┌─────▼──────┐
   │  Frontend CDN   │  │  Backend  │  │  Backend   │
   │  (Vercel/       │  │  Server 1 │  │  Server 2  │
   │   Netlify)      │  │           │  │            │
   └─────────────────┘  └────┬──────┘  └─────┬──────┘
                             │               │
                   ┌─────────┴───────────────┘
                   │
          ┌────────▼─────────┐      ┌──────────────┐
          │  PostgreSQL RDS  │      │  Redis Cloud │
          │  (Managed DB)    │      │  (Managed)   │
          └──────────────────┘      └──────────────┘
                   │
          ┌────────▼─────────┐
          │  Backups (S3)    │
          └──────────────────┘
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Security Layers                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Layer 1: Network Security                               │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - HTTPS/TLS encryption                           │   │
│  │ - CORS policy (allowed origins only)             │   │
│  │ - Rate limiting (Redis)                          │   │
│  │ - DDoS protection                                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 2: Application Security                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - JWT token authentication                       │   │
│  │ - Password hashing (bcrypt)                      │   │
│  │ - Input validation (Pydantic)                    │   │
│  │ - SQL injection prevention (ORM)                 │   │
│  │ - XSS protection (React escaping)                │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 3: Data Security                                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - API key encryption (in transit)                │   │
│  │ - Database encryption at rest                    │   │
│  │ - Secure environment variables                   │   │
│  │ - No sensitive data in logs                      │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
│  Layer 4: Access Control                                 │
│  ┌─────────────────────────────────────────────────┐   │
│  │ - User owns their data only                      │   │
│  │ - Row-level security (user_id filter)            │   │
│  │ - API endpoint authorization                     │   │
│  │ - Token expiration (30 minutes)                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└───────────────────────────────────────────────────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   Backend 1        Backend 2        Backend 3
        │                │                │
        └────────────────┼────────────────┘
                         │
                ┌────────▼────────┐
                │  Shared Redis   │
                │  (Session/Queue)│
                └─────────────────┘
                         │
                ┌────────▼────────┐
                │  PostgreSQL     │
                │  (Read Replicas)│
                └─────────────────┘
```

### Performance Optimization

- **Database Indexes**: On user_id, status, company, created_at
- **Connection Pooling**: SQLAlchemy pool (10 base, 20 overflow)
- **Caching**: Redis for frequently accessed data
- **CDN**: Static assets served from edge locations
- **API Response**: Pagination, filtering, field selection
- **Background Jobs**: Async processing for Gmail sync

---

Built with modern architecture principles and best practices.
