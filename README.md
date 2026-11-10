# Base Project Template — Project Janus Homelab

[![Homelab](https://img.shields.io/badge/Homelab-Project_Janus-blue.svg)](https://github.com/P1gBagPt-Homelab)
[![PaaS](https://img.shields.io/badge/Deploy-Coolify-purple.svg)](https://coolify.io)
[![CI/CD](https://img.shields.io/badge/CI%2FCD-Self--Hosted_GitHub_Runner-black.svg)]()
[![Observability](https://img.shields.io/badge/Observability-Grafana_%2B_Loki_%2B_GlitchTip-orange.svg)]()

This repository is the **official foundation template** for all new software projects and microservices deployed to **Project Janus** (Ubuntu Server 24.04 LTS bare-metal homelab).

It provides ready-to-use Docker blueprints, CI/CD pipelines, shared infrastructure integration patterns (PostgreSQL 18, Redis 7.2, MinIO S3, RabbitMQ, Ollama GPU AI, GlitchTip Sentry), and instructions for AI agents building on this stack.

---

## 🚀 Quickstart: Starting a New Project

When creating a new application from this template, follow these steps:

### 1. Initialize from Template
1. Create a new repository under the **`P1gBagPt-Homelab`** GitHub organization using this repository as the template.
2. Clone your new repository locally:
   ```bash
   git clone https://github.com/P1gBagPt-Homelab/<your-project-name>.git
   cd <your-project-name>
   ```

### 2. Configure Environment
1. Copy the example environment configuration:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and configure your project name, target DuckDNS subdomain (`https://<app>.janus-lab.duckdns.org`), and required shared services credentials.

### 3. Provision Shared Services (On Janus)
Janus operates centralized shared services. Do not run private database containers:
* **PostgreSQL 18**: Run `./scripts/provision-db.sh <app_name>` or execute the SQL commands in [docs/CORE_SERVICES_REFERENCE.md](docs/CORE_SERVICES_REFERENCE.md).
* **Redis 7.2**: Pick an unused Redis DB index (e.g. `DB 3`).
* **MinIO S3**: Create a project bucket (e.g. `<app_name>-data`) and assign an access key via the MinIO Web Console (`https://s3.janus-lab.duckdns.org`).
* **GlitchTip (Sentry)**: Create your project in GlitchTip (`https://errors.janus-lab.duckdns.org`) to generate your `SENTRY_DSN`.

### 4. Select Your Tech Stack & Dockerfile
Choose the relevant Dockerfile template from `templates/` and copy it to the root as `Dockerfile`:
```bash
# For Python / FastAPI / AI Workers:
cp templates/Dockerfile.python Dockerfile

# For Node.js / Next.js / TypeScript:
cp templates/Dockerfile.nodejs Dockerfile

# For .NET 8 / C#:
cp templates/Dockerfile.dotnet Dockerfile
```

### 5. Deploy to Coolify
1. In Coolify (`http://192.168.1.68:8000`), click **+ New Resource > GitHub App > Select your repo**.
2. Assign your public domain: `https://<app>.janus-lab.duckdns.org`.
3. In Coolify environment variables, paste your `.env` contents.
4. Set GitHub repository secrets (`COOLIFY_HOST`, `COOLIFY_UUID`, `COOLIFY_TOKEN`) to enable automated push-to-deploy via the self-hosted runner.
5. Push to `main` branch to trigger your first live deployment!

---

## 🏛️ Centralized Infrastructure Reference

All projects deployed on Project Janus run on the shared external Docker network named **`coolify`**. Within this network, containers resolve each other directly by service name:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Traefik Reverse Proxy                           │
│                https://<app>.janus-lab.duckdns.org (Port 443)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Your Application Container                        │
│                 (Attached to 'coolify' Docker Network)                 │
└───────┬──────────────┬──────────────┬──────────────┬────────────┬──────┘
        │              │              │              │            │
        ▼              ▼              ▼              ▼            ▼
┌──────────────┐┌──────────────┐┌──────────────┐┌───────────┐┌───────────┐
│  Postgres 18 ││  Redis 7.2   ││   MinIO S3   ││ RabbitMQ  ││ Ollama AI │
│  port 5432   ││  port 6379   ││  port 9000   ││ port 5672 ││port 11434 │
│ (Multi-Tenant)│ (Key-Value)  ││(Object Store)││  (Broker) ││(RTX 2070) │
└──────────────┘└──────────────┘└──────────────┘└───────────┘└───────────┘
```

| Service | Internal Host & Port | Public Web UI | Reference Guide |
| :--- | :--- | :--- | :--- |
| **PostgreSQL 18** | `postgres:5432` | — | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **Redis 7.2** | `redis:6379` | — | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **MinIO S3** | `http://minio:9000` | `https://s3.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **RabbitMQ** | `amqp://rabbitmq:5672` | `https://queue.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **Ollama AI** | `http://ollama:11434` | `https://ai.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **GlitchTip** | `http://glitchtip-web:8000` | `https://errors.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **Grafana / Prometheus** | `http://prometheus:9090` | `https://grafana.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |
| **Uptime Kuma** | `http://uptime-kuma:3001`| `https://status.janus-lab.duckdns.org` | [Core Services Reference](docs/CORE_SERVICES_REFERENCE.md) |

---

## 📁 Repository Structure

```text
.
├── .github/
│   └── workflows/
│       ├── deploy.yml            # Automated Coolify trigger via self-hosted runner
│       └── test.yml              # Standard linting & unit test CI pipeline
├── .env.example                  # Exhaustive environment variable template
├── .gitignore                    # Multi-language Git ignore rules
├── AGENT_INSTRUCTIONS.md         # Operational rules & directives for AI agents
├── README.md                     # This file
├── docker-compose.template.yml   # Multi-service compose blueprint with 'coolify' network
├── docs/
│   ├── ARCHITECTURE.md           # Homelab networking, proxying, and SSL architecture
│   ├── CORE_SERVICES_REFERENCE.md# Connection guides, scripts & code snippets for all services
│   ├── DEPLOYMENT_PLAYBOOK.md     # Step-by-step Coolify registration & DNS setup
│   └── STORAGE_AND_BACKUP.md     # Storage tiering rules (SSD vs HDD) and backup strategy
├── scripts/
│   ├── provision-db.sh           # Non-interactive script to provision Postgres database
│   └── verify-connections.py     # Python diagnostic script to test service connectivity
└── templates/
    ├── Dockerfile.python         # Production multi-stage FastAPI/Python container
    ├── Dockerfile.nodejs         # Production multi-stage Next.js/Node container
    └── Dockerfile.dotnet         # Production multi-stage ASP.NET Core container
```

---

## 🤖 For AI Agents

If you are an AI assistant (Antigravity, Cursor, Copilot, Claude) working on this repository, you **must read and adhere to [AGENT_INSTRUCTIONS.md](AGENT_INSTRUCTIONS.md)**. 

Never violate the core invariants:
1. Never spin up dedicated Postgres, Redis, or S3 containers.
2. Always attach services to the external `coolify` network.
3. Always expose `/health`, `/metrics`, and connect `SENTRY_DSN`.
