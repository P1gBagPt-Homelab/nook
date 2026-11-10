# Core Services Reference Guide

This document is the complete developer and agent handbook for consuming Project Janus's shared infrastructure.

---

## 1. PostgreSQL 18 (Multi-Tenant Relational Database)

Project Janus operates a central PostgreSQL 18 instance. Every application receives its own isolated database and restricted user.

### Provisioning a New Database
Run the included helper script on the Janus host or via SSH:
```bash
# On Janus host terminal:
./scripts/provision-db.sh <app_name>
```

Or manually via `psql`:
```sql
CREATE USER my_app_user WITH ENCRYPTED PASSWORD 'GeneratedStrongPassword';
CREATE DATABASE my_app_db OWNER my_app_user;
GRANT ALL PRIVILEGES ON DATABASE my_app_db TO my_app_user;

\c my_app_db
GRANT ALL ON SCHEMA public TO my_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO my_app_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO my_app_user;
```

### Connection Code Snippets

#### Python (SQLAlchemy + AsyncPG):
```python
import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql+asyncpg://my_app_user:password@postgres:5432/my_app_db"
)

engine = create_async_engine(DATABASE_URL, pool_size=10, max_overflow=20)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

#### Node.js (Prisma / Drizzle / pg):
```typescript
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // postgresql://my_app_user:pass@postgres:5432/my_app_db
  max: 10,
  idleTimeoutMillis: 30000,
});
```

#### C# / .NET (Entity Framework Core):
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

---

## 2. Redis 7.2 (Cache, Queues & Fast Storage)

* **Internal Endpoint**: `redis:6379`
* **Network**: Attached to `coolify` network.

### Multi-Tenant Database Number Scheme
To prevent key collisions between projects, allocate a distinct Redis database index (0 to 15):

| DB Index | Project / Application |
| :---: | :--- |
| `0` | Docmost Wiki |
| `1` | JanusDeck Portal |
| `2` | GlitchTip Background Worker |
| `3` | *Available for next project* |
| `4` | *Available for next project* |

#### Python (redis-py):
```python
import redis
import os

r = redis.Redis.from_url(os.getenv("REDIS_URL", "redis://:SharedPassword@redis:6379/3"))
r.set("user:session:100", "active", ex=3600)
```

#### Node.js (ioredis):
```typescript
import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);
await redis.set("counter", 1);
```

---

## 3. MinIO S3 Object Storage

* **Internal Endpoint (Containers)**: `http://minio:9000`
* **Public Web Console / Presigned URLs**: `https://s3.janus-lab.duckdns.org`
* **Physical Storage**: Backed by 1TB HDD pool (`/data/storage/minio`).

### Setup Project Bucket & IAM Key
1. Open `https://s3.janus-lab.duckdns.org` and log in with master credentials.
2. Under **Buckets**, click **Create Bucket** (e.g. `my-app-data`).
3. Under **Access Keys**, click **Create Access Key**. Restrict policy to the `my-app-data` bucket.

### Code Snippets

#### Python (boto3):
```python
import boto3
import os

s3_client = boto3.client(
    "s3",
    endpoint_url=os.getenv("S3_ENDPOINT", "http://minio:9000"),
    aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
    aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
    region_name=os.getenv("S3_REGION", "us-east-1")
)

# Upload file
s3_client.upload_file("local.png", "my-app-data", "images/avatar.png")

# Generate Presigned Download URL (valid for 1 hour)
download_url = s3_client.generate_presigned_url(
    "get_object",
    Params={"Bucket": "my-app-data", "Key": "images/avatar.png"},
    ExpiresIn=3600
)
```

#### Node.js (@aws-sdk/client-s3):
```typescript
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3 = new S3Client({
  endpoint: process.env.S3_ENDPOINT, // http://minio:9000
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true,
});
```

---

## 4. RabbitMQ (AMQP Message Broker)

* **Internal Endpoint**: `amqp://rabbitmq:5672`
* **Management Console**: `https://queue.janus-lab.duckdns.org`
* **Prometheus Metrics**: `http://rabbitmq:15692/metrics`

### Creating a Virtual Host (vhost):
In the Management UI under **Admin > Virtual Hosts**, create `/my-app`. Assign permissions to your project's user.

#### Python (pika producer):
```python
import pika
import json
import os

params = pika.URLParameters(os.getenv("RABBITMQ_URL", "amqp://user:pass@rabbitmq:5672/my_app"))
connection = pika.BlockingConnection(params)
channel = connection.channel()

channel.queue_declare(queue="tasks", durable=True)
channel.basic_publish(
    exchange="",
    routing_key="tasks",
    body=json.dumps({"task_id": 42, "action": "generate_report"}),
    properties=pika.BasicProperties(delivery_mode=2) # Persistent message
)
connection.close()
```

---

## 5. Local Ollama AI (RTX 2070 GPU Acceleration)

* **Internal Endpoint**: `http://ollama:11434`
* **GPU**: NVIDIA RTX 2070 (8GB GDDR6 VRAM) pass-through.
* **Available Models**:
  * `llama3.1:8b` (general reasoning, summarization, tool calling)
  * `mistral:7b` (fast code and chat)
  * `phi3:mini` (ultra-light 3.8B model, lightning fast)
  * `nomic-embed-text` (vector embeddings for search/RAG)

### OpenAI-Compatible API (Universal Drop-in)
Ollama natively supports the OpenAI API specification! Any library built for OpenAI works out of the box with zero modifications:

#### Python (Standard `openai` SDK):
```python
from openai import OpenAI

client = OpenAI(
    base_url="http://ollama:11434/v1",
    api_key="ollama" # Required parameter by client, value ignored by Ollama
)

response = client.chat.completions.create(
    model="llama3.1:8b",
    messages=[
        {"role": "system", "content": "You are a concise data extraction assistant."},
        {"role": "user", "content": "Extract the total amount from: 'Receipt: $42.50 at Supermart'"}
    ],
    temperature=0.1
)

print(response.choices[0].message.content)
```

---

## 6. GlitchTip / Sentry (Error & Crash Forensics)

* **Public Web UI**: `https://errors.janus-lab.duckdns.org`
* **SDK Compatibility**: 100% standard Sentry SDK.

#### Python Setup:
```bash
pip install sentry-sdk
```
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

---

## 7. Prometheus & Grafana Observability

Expose metrics on your container's `/metrics` path. Prometheus scrapes targets automatically when configured.

#### Python (FastAPI):
```bash
pip install prometheus-fastapi-instrumentator
```
```python
from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator

app = FastAPI()
Instrumentator().instrument(app).expose(app)
```
Now Prometheus tracks total requests, latencies, status codes, and CPU time automatically at `http://<your-container>:3000/metrics`.
