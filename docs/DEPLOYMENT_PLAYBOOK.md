# Deployment Playbook & Checklist

This playbook guides you step-by-step through deploying your application on Project Janus using Coolify and Traefik.

---

## 1. Coolify Registration

1. Log into your Coolify dashboard:
   * Local LAN: `http://192.168.1.68:8000`
   * Over WireGuard: `http://10.8.0.1:8000`
2. Open your project folder (or create one, e.g. `Projects`).
3. Click **+ New Resource**.
4. Select **Public Repository** or **Private Repository (via GitHub App `daniel-github`)**.
5. Select your repository: `P1gBagPt-Homelab/<project-name>`.
6. Select the branch: `main`.
7. Set **Build Pack**:
   * If using a Dockerfile: Choose **Dockerfile**.
   * If using multiple services (e.g. API + Worker): Choose **Docker Compose**.

---

## 2. Network & Domain Configuration

1. In the application settings:
   * Under **Network**, ensure **Network Attachment** is set to **`Attach to predefined network`** (`coolify`).
2. In the left sidebar, click **Domains > + Add Domain**:
   * **Domain**: `https://<app-name>.janus-lab.duckdns.org`
   * **Port**: Enter the internal container port (e.g. `3000` or `8000`).
   * Click **Save**.

---

## 3. Environment Variables

Under the application's **Environment Variables** tab, paste the variables from your `.env` file:
* `DATABASE_URL`
* `REDIS_URL`
* `SENTRY_DSN`
* `S3_ENDPOINT`, `S3_BUCKET`, `S3_ACCESS_KEY`, `S3_SECRET_KEY`
* `RABBITMQ_URL`

Click **Save**.

---

## 4. Setup Automated Push-to-Deploy (CI/CD)

To enable GitHub pushes to trigger instant redeployments via your self-hosted runner:

1. In Coolify, under your application's **Webhooks** or **General Settings**:
   * Copy the **Application UUID** (e.g. `b4g6a...`).
   * Under **Keys & Tokens > API Tokens**, copy your Coolify API Token.
2. In GitHub, go to your repository:
   * **Settings > Secrets and variables > Actions > New repository secret**:
     * `COOLIFY_HOST`: `http://192.168.1.68:8000` (or `http://10.8.0.1:8000`)
     * `COOLIFY_UUID`: `<your-application-uuid>`
     * `COOLIFY_TOKEN`: `<your-coolify-api-token>`
3. From this point onward, every `git push origin main` will run `.github/workflows/deploy.yml` on the local runner and queue a build in Coolify in under 5 seconds!

---

## 5. Post-Deployment Checklist

### 1. Register in Uptime Kuma (Uptime Monitoring)
1. Open `https://status.janus-lab.duckdns.org`.
2. Click **+ Add New Monitor**:
   * **Monitor Type**: `HTTP(s)`
   * **Friendly Name**: `<App Name>`
   * **URL**: `https://<app-name>.janus-lab.duckdns.org/health`
   * **Heartbeat Interval**: 60 seconds
3. Click **Save**. You will now receive instant Discord/Telegram alerts if the app goes down.

### 2. Register in JanusDeck (Command Center)
If your app has a frontend or dashboard, add a launch card to JanusDeck (`https://janus.janus-lab.duckdns.org`):
* Edit `/data/projects/janusdeck/config/services.json` on the server to add your new service card with icon, title, and link.
