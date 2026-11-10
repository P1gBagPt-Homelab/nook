# AI Agent Operational Instructions & System Invariants

> **Audience**: AI Coding Agents (Antigravity, Cursor, GitHub Copilot, Claude Code, Aider, etc.)  
> **Target Environment**: Project Janus Homelab Infrastructure (`P1gBagPt-Homelab`)  
> **Deployment Target**: Coolify PaaS on Ubuntu Server 24.04 LTS  

Welcome, Agent. You are tasked with developing, modifying, or deploying an application built upon the **Project Janus** homelab foundation. Project Janus is not a public cloud environment (AWS, GCP, Vercel) where you provision endless managed databases or separate VMs. It is a carefully engineered, high-performance, bare-metal server operating multi-tenant shared core services.

You **MUST** strictly adhere to the architecture rules, naming conventions, and integration patterns described below.

---

## 1. Immutable Rules (Non-Negotiable)

### Rule 1: NEVER Spin Up Standalone Databases
* **Do NOT** add `postgres`, `mysql`, or `redis` service blocks in your application's `docker-compose.yml`.
* Project Janus already operates a centralized, enterprise-grade **PostgreSQL 18** and **Redis 7.2** cluster connected to automated backup pipelines.
* Applications consume a dedicated isolated database, user, and schema on the shared cluster via `DATABASE_URL`.

### Rule 2: ALWAYS Attach to the External `coolify` Network
* All inter-service communication (API -> Postgres, Worker -> RabbitMQ, Scraper -> MinIO) takes place over an internal Docker bridge network named `coolify`.
* Every service in `docker-compose.yml` must include:
  ```yaml
  networks:
    - coolify

  networks:
    coolify:
      external: true
  ```
* Never publish internal database or message broker ports to host `0.0.0.0`. Containers resolve each other by container name over DNS (e.g. `postgres:5432`, `redis:6379`, `minio:9000`, `rabbitmq:5672`, `ollama:11434`).

### Rule 3: Respect Storage Tiering
The host machine has distinct physical storage pools:
1. **Fast SSD LVM Pool (`/data/volumes/<app-name>/`)**:
   * For database tables, search indices, fast caches, configuration files, and critical runtime volumes.
2. **High-Capacity HDD Pool (`/data/storage/<app-name>/`)**:
   * For large media, bulk downloads, cold backups, and raw document dumps.
3. **MinIO S3 (`http://minio:9000`)**:
   * Preferred for application object uploads, avatar pictures, generated PDFs, and exports.
* **Never write persistent data inside container root filesystems (`/app` or `/var/lib/...`)** without a mounted host volume or S3 bucket.

### Rule 4: Zero Hardcoded Secrets
* Never commit `.env` files, database passwords, API tokens, or encryption keys.
* Read all configuration via environment variables with clear fallbacks in local development.
* All production secrets are configured inside Coolify or passed via GitHub Secrets.

### Rule 5: Standard Health & Observability Endpoints
Every backend API or web application you construct must expose:
1. **Health Check**: `GET /health` or `GET /api/health` returning `{"status": "ok", "uptime": ...}` with HTTP 200.
2. **Metrics**: `GET /metrics` in Prometheus format (for automated scraping into Grafana).
3. **Crash Forensics**: Sentry SDK initialized at startup using `SENTRY_DSN` pointing to GlitchTip (`https://errors.janus-lab.duckdns.org`).

---

## 2. Core Services Directory & Internal DNS

When your container is joined to the `coolify` network, the following shared services are available instantly via internal Docker DNS:

| Service | Internal Hostname & Port | Purpose | Authentication |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 18** | `postgres:5432` *(or specific container ID)* | Primary relational storage | User + password per project |
| **Redis 7.2** | `redis:6379` *(or specific container ID)* | Caching, rate limiting, pub/sub | Password + dedicated DB index |
| **MinIO S3** | `http://minio:9000` | S3-compatible Object Storage | Dedicated IAM Access/Secret keys |
| **RabbitMQ** | `amqp://rabbitmq:5672` | Asynchronous message broker | User + password on dedicated vhost |
| **Ollama Local AI**| `http://ollama:11434` | Zero-cost local LLM inference | None (internal network trust) |
| **GlitchTip** | `http://glitchtip-web:8000` | Crash & exception tracking | Project DSN token |
| **Prometheus** | `http://prometheus:9090` | Time-series metrics engine | Internal network |

---

## 3. How to Connect Your Code to Core Services

### A. Connecting to PostgreSQL 18

#### Connection String Syntax:
* Standard: `postgresql://<user>:<password>@postgres:5432/<db_name>`
* Python (SQLAlchemy / asyncpg): `postgresql+asyncpg://<user>:<password>@postgres:5432/<db_name>`

#### Multi-Tenant Database Creation (If provisioning on Janus):
```bash
# Executed via SSH on Janus host:
docker exec -i <POSTGRES_CONTAINER_ID> psql -U postgres << 'EOF'
CREATE USER my_app_user WITH ENCRYPTED PASSWORD 'StrongSecretPassword';
CREATE DATABASE my_app_db OWNER my_app_user;
GRANT ALL PRIVILEGES ON DATABASE my_app_db TO my_app_user;
\c my_app_db
GRANT ALL ON SCHEMA public TO my_app_user;
EOF
```

---

### B. Connecting to Redis 7.2

Always allocate a unique database index (e.g. `0`, `1`, `2`, ..., `15`) so key flushes (`FLUSHDB`) do not erase data belonging to other projects:
* Syntax: `redis://:<password>@redis:6379/<db_number>`
* Example: `redis://:YourSharedRedisPassword@redis:6379/4`

---

### C. Connecting to MinIO S3 Object Storage

Use standard AWS S3 SDKs (`boto3` in Python, `@aws-sdk/client-s3` in Node.js, `AWSSDK.S3` in C#):

#### Python Example:
```python
import boto3
import os

s3 = boto3.client(
    "s3",
    endpoint_url=os.getenv("S3_ENDPOINT", "http://minio:9000"),
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
    region_name=os.getenv("S3_REGION", "us-east-1")
)

# Upload example
s3.upload_file("local_file.pdf", os.getenv("S3_BUCKET"), "uploads/invoice-123.pdf")
```

---

### D. Connecting to Local Ollama AI (RTX 2070 GPU)

You can run local text generation, summarization, embedding generation, or OCR without external cloud API costs.
* Endpoint: `http://ollama:11434`
* Models available: `llama3.1:8b`, `mistral:7b`, `phi3:mini`, `nomic-embed-text`

#### Python Example:
```python
import requests

response = requests.post(
    "http://ollama:11434/api/generate",
    json={
        "model": "llama3.1:8b",
        "prompt": "Summarize the following log entry: ...",
        "stream": False
    }
)
result = response.json()["response"]
```

---

### E. Integrating GlitchTip (Sentry) Crash Forensics

Always wrap backend services with the standard Sentry SDK. When an unexpected exception occurs, it will be automatically captured in GlitchTip with full stack traces and local variable dumps:

#### Python (FastAPI):
```python
import sentry_sdk
import os

sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    traces_sample_rate=1.0,
    send_default_pii=True,
    environment=os.getenv("APP_ENV", "production")
)
```

#### Node.js:
```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.APP_ENV || "production"
});
```

---

## 4. Docker & Containerization Standards

When writing Dockerfiles and compose files:
1. **Multi-Stage Builds**: Keep production images lean. Never ship build toolchains (compilers, npm cache, dev dependencies) in final images.
2. **Non-Root Execution**: Always specify `USER node`, `USER appuser`, or create an unprivileged UID 1000 user. Never run containers as `root`.
3. **Explicit Port Exposure**: Expose only the required application port (e.g. `3000` or `8000`). Traefik automatically discovers it.
4. **Graceful Shutdown**: Handle `SIGTERM` and `SIGINT` signals so in-flight requests or database transactions drain cleanly during redeployments.

---

## 5. Automated CI/CD via GitHub Actions

Every repository under the `P1gBagPt-Homelab` organization inherits the 24/7 **self-hosted GitHub Actions runner** running directly on the Janus server.

* **Workflow File**: `.github/workflows/deploy.yml`
* **Trigger**: Push to `main` branch or manual `workflow_dispatch`.
* **Execution**: The runner invokes the Coolify webhook/API to pull the latest commit and rebuild the container with zero downtime.

Always keep `.github/workflows/deploy.yml` intact in the repository root.
