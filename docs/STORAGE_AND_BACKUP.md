# Storage Tiering & Automated Backup Policy

Project Janus uses a multi-tier storage architecture designed to balance NVMe/SSD speed with HDD capacity and off-site cloud disaster recovery.

---

## 1. Storage Tiers

| Storage Tier | Physical Device & Mount | Use Cases | Backup Status |
| :--- | :--- | :--- | :---: |
| **SSD LVM Pool** | `/data/volumes/<app_name>/` | Database files, search indexes, small config files, session state, fast caches. | ✅ Included in Daily Automated Snapshot |
| **HDD Cold Pool** | `/data/storage/<app_name>/` | Large raw video files, archives, multi-gigabyte data sets, media libraries. | ⚠️ Excluded from Cloud (Local storage only) |
| **MinIO S3** | `http://minio:9000` | User uploads, documents, invoices, avatar images, app assets. | ✅ Included in Daily Automated Snapshot |
| **Coolify Cache** | `/data/projects/<app_name>/` | Git repositories, Docker build caches. | ❌ Ephemeral (Re-creatable from Git) |

---

## 2. Directory Permissions & UID Rules

Containers running as non-root users (UID 1000) require appropriate permissions on mounted host volumes:

```bash
# When creating persistent storage on the host:
sudo mkdir -p /data/volumes/<app-name>/data
sudo chown -R 1000:1000 /data/volumes/<app-name>
sudo chmod -R 770 /data/volumes/<app-name>
```

---

## 3. Automated Disaster Recovery (3-2-1 Backup)

Every night at **03:00 UTC**, Project Janus executes automated backup pipelines:
1. **PostgreSQL Dump**: All databases (including your project's database) are dumped using `pg_dumpall`.
2. **Volume Sync**: `/data/volumes` is staged and compressed.
3. **Client-Side Encryption**: Staged backups are encrypted using **Rclone Crypt (AES-256-GCM)** with client-side keys.
4. **Cloud Mirroring**: The encrypted package is pushed to an off-site 5TB Google Drive remote (`gdrive-crypt:`).

Because backups are automated centrally at the platform level, you **do not** need to write backup cron jobs inside your application container.
