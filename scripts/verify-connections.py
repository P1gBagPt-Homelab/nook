#!/usr/bin/env python3
"""
Diagnostic Script: verify-connections.py
Purpose: Validates connectivity from your development environment or container
         to each of the Project Janus core services configured in .env.
"""

import os
import sys

def check_postgres(url):
    if not url:
        return None, "Not configured (DATABASE_URL empty)"
    try:
        import psycopg2
        # Clean asyncpg prefix if present
        clean_url = url.replace("postgresql+asyncpg://", "postgresql://")
        conn = psycopg2.connect(clean_url, connect_timeout=3)
        conn.close()
        return True, "Successfully connected to PostgreSQL 18"
    except ImportError:
        return False, "psycopg2 library not installed (run: pip install psycopg2-binary)"
    except Exception as e:
        return False, f"Connection failed: {e}"

def check_redis(url):
    if not url:
        return None, "Not configured (REDIS_URL empty)"
    try:
        import redis
        client = redis.Redis.from_url(url, socket_timeout=3)
        client.ping()
        return True, "Successfully connected to Redis 7.2 (PONG received)"
    except ImportError:
        return False, "redis library not installed (run: pip install redis)"
    except Exception as e:
        return False, f"Connection failed: {e}"

def check_minio(endpoint, access_key, secret_key, bucket):
    if not endpoint or not access_key:
        return None, "Not configured (S3_ENDPOINT / S3_ACCESS_KEY empty)"
    try:
        import boto3
        from botocore.config import Config
        s3 = boto3.client(
            "s3",
            endpoint_url=endpoint,
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            config=Config(connect_timeout=3, retries={"max_attempts": 1})
        )
        s3.list_buckets()
        return True, f"Successfully connected to MinIO S3 (bucket: '{bucket}')"
    except ImportError:
        return False, "boto3 library not installed (run: pip install boto3)"
    except Exception as e:
        return False, f"Connection failed: {e}"

def check_ollama(base_url):
    if not base_url:
        return None, "Not configured (OLLAMA_BASE_URL empty)"
    try:
        import urllib.request
        import json
        req = urllib.request.Request(f"{base_url.rstrip('/')}/api/tags", headers={"User-Agent": "Janus-Tester"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            data = json.loads(resp.read().decode())
            models = [m.get("name") for m in data.get("models", [])]
            return True, f"Successfully connected to Ollama (Models: {', '.join(models) or 'none loaded'})"
    except Exception as e:
        return False, f"Connection failed: {e}"

def check_rabbitmq(url):
    if not url:
        return None, "Not configured (RABBITMQ_URL empty)"
    try:
        import pika
        params = pika.URLParameters(url)
        params.socket_timeout = 3
        conn = pika.BlockingConnection(params)
        conn.close()
        return True, "Successfully connected to RabbitMQ AMQP broker"
    except ImportError:
        return False, "pika library not installed (run: pip install pika)"
    except Exception as e:
        return False, f"Connection failed: {e}"

def main():
    print("==============================================================================")
    print("🔍 PROJECT JANUS — CORE SERVICES CONNECTIVITY CHECK")
    print("==============================================================================")

    # Simple .env loader if python-dotenv not installed
    if os.path.exists(".env"):
        with open(".env", "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))
        print("📄 Loaded .env configuration.")
    else:
        print("⚠️ No .env file found; checking active system environment variables.")

    tests = [
        ("PostgreSQL 18", check_postgres(os.getenv("DATABASE_URL"))),
        ("Redis 7.2", check_redis(os.getenv("REDIS_URL"))),
        ("MinIO S3", check_minio(os.getenv("S3_ENDPOINT"), os.getenv("S3_ACCESS_KEY"), os.getenv("S3_SECRET_KEY"), os.getenv("S3_BUCKET"))),
        ("RabbitMQ", check_rabbitmq(os.getenv("RABBITMQ_URL"))),
        ("Ollama Local AI", check_ollama(os.getenv("OLLAMA_BASE_URL")))
    ]

    print("")
    for name, (status, message) in tests:
        if status is True:
            badge = "✅ PASS"
        elif status is False:
            badge = "❌ FAIL"
        else:
            badge = "⏭️ SKIP"
        print(f"{badge} | {name:<18} | {message}")

    print("==============================================================================")

if __name__ == "__main__":
    main()
