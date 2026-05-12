# Google Cloud Platform (GCP) Deployment Guide

This guide outlines the steps to deploy the AirAsia Ticketing System Backend to Google Cloud, utilizing **Cloud Run** for compute, **Cloud SQL** for the PostgreSQL database, and **MemoryStore** for Redis.

## 🏗 GCP Architecture

*   **Compute:** Google Cloud Run (Serverless, auto-scaling containers)
*   **Database:** Google Cloud SQL (Managed PostgreSQL)
*   **Cache/Queue:** Google Cloud MemoryStore (Managed Redis)
*   **Image Storage:** Google Artifact Registry
*   **Networking:** Serverless VPC Access Connector (Allows Cloud Run to communicate with Cloud SQL and MemoryStore privately)

---

## 🛠 Step 1: Prerequisites & Initial Setup

1.  **Install Google Cloud SDK:** Make sure you have the `gcloud` CLI installed and initialized.
    ```bash
    gcloud auth login
    gcloud config set project [YOUR_PROJECT_ID]
    ```
2.  **Enable Required APIs:**
    ```bash
    gcloud services enable \
      run.googleapis.com \
      sqladmin.googleapis.com \
      redis.googleapis.com \
      artifactregistry.googleapis.com \
      vpcaccess.googleapis.com \
      cloudbuild.googleapis.com
    ```

---

## 🗄 Step 2: Provision Infrastructure

### 2.1 Set up Cloud SQL (PostgreSQL)
```bash
# Create a Cloud SQL instance (this takes a few minutes)
gcloud sql instances create ticketing-db-instance \
    --database-version=POSTGRES_16 \
    --tier=db-f1-micro \
    --region=asia-southeast1

# Set the password for the default 'postgres' user
gcloud sql users set-password postgres \
    --instance=ticketing-db-instance \
    --password=[YOUR_SECURE_PASSWORD]

# Create the database
gcloud sql databases create ticketing_db \
    --instance=ticketing-db-instance
```

### 2.2 Set up MemoryStore (Redis)
```bash
gcloud redis instances create ticketing-redis \
    --size=1 \
    --region=asia-southeast1 \
    --redis-version=redis_7_0
```
*Note the IP address and port returned by this command.*

### 2.3 Set up Serverless VPC Access Connector
Since MemoryStore is on a private IP, Cloud Run needs a VPC connector to talk to it.
```bash
gcloud compute networks vpc-access connectors create ticketing-vpc-connector \
    --network=default \
    --region=asia-southeast1 \
    --range=10.8.0.0/28
```

---

## 📦 Step 3: Build & Push Docker Image

### 3.1 Create Artifact Registry Repository
```bash
gcloud artifacts repositories create ticketing-repo \
    --repository-format=docker \
    --location=asia-southeast1 \
    --description="Docker repository for Ticketing Backend"
```

### 3.2 Configure Docker to authenticate with Artifact Registry
```bash
gcloud auth configure-docker asia-southeast1-docker.pkg.dev
```

### 3.3 Build and Push
From the `backend` directory containing your `Dockerfile`:
```bash
# Set your image URL
IMAGE_URL="asia-southeast1-docker.pkg.dev/[YOUR_PROJECT_ID]/ticketing-repo/ticketing-backend:latest"

# Build using Cloud Build (recommended) or local Docker
gcloud builds submit --tag $IMAGE_URL .
```

---

## 🚀 Step 4: Database Migrations

Before deploying the main app, you need to run Prisma migrations. The safest way in a serverless environment is to run a one-off Cloud Run job.

```bash
gcloud run jobs create migrate-db \
    --image $IMAGE_URL \
    --region asia-southeast1 \
    --vpc-connector ticketing-vpc-connector \
    --set-env-vars DATABASE_URL="postgresql://postgres:[PASSWORD]@[CLOUD_SQL_PRIVATE_IP]:5432/ticketing_db" \
    --command="npm,run,db:migrate"

# Execute the job
gcloud run jobs execute migrate-db --wait
```

---

## 🌐 Step 5: Deploy to Cloud Run

Deploy the application, connecting it to the VPC, Cloud SQL, and setting the environment variables.

```bash
gcloud run deploy ticketing-backend \
    --image $IMAGE_URL \
    --region asia-southeast1 \
    --vpc-connector ticketing-vpc-connector \
    --allow-unauthenticated \
    --set-env-vars DATABASE_URL="postgresql://postgres:[PASSWORD]@[CLOUD_SQL_PRIVATE_IP]:5432/ticketing_db" \
    --set-env-vars REDIS_HOST="[MEMORYSTORE_IP]" \
    --set-env-vars REDIS_PORT="6379" \
    --set-env-vars JWT_SECRET="your-production-secret-key" \
    --set-env-vars NODE_ENV="production"
```
*Note: For production, it is highly recommended to use **Google Cloud Secret Manager** instead of plain `--set-env-vars` for passwords and secrets.*

---

# 🤖 GitHub Actions CI/CD Pipeline

To automate the build, migrate, and deploy process, you can use GitHub Actions.

## Prerequisites
1.  Create a **Service Account** in GCP with roles: `Cloud Run Admin`, `Artifact Registry Writer`, `Service Account User`, `Cloud SQL Client`.
2.  Generate a JSON key for the Service Account.
3.  In your GitHub Repository, go to **Settings > Secrets and variables > Actions** and add the following secrets:
    *   `GCP_CREDENTIALS`: The JSON key string.
    *   `GCP_PROJECT_ID`: Your Google Cloud Project ID.
    *   `DATABASE_URL`: Your production database URL.
    *   `REDIS_HOST`: Your Redis IP.
    *   `JWT_SECRET`: Your JWT Secret.

## `.github/workflows/deploy.yml`

Create this file in your repository:

```yaml
name: Deploy to Google Cloud Run

on:
  push:
    branches:
      - main # Trigger deployment on pushes to the main branch

env:
  PROJECT_ID: ${{ secrets.GCP_PROJECT_ID }}
  REGION: asia-southeast1
  REPO_NAME: ticketing-repo
  SERVICE_NAME: ticketing-backend
  IMAGE_NAME: asia-southeast1-docker.pkg.dev/${{ secrets.GCP_PROJECT_ID }}/ticketing-repo/ticketing-backend:${{ github.sha }}

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    defaults:
      run:
        working-directory: ./backend

    steps:
      - name: Checkout Repository
        uses: actions/checkout@v4

      - name: Authenticate to Google Cloud
        uses: google-github-actions/auth@v2
        with:
          credentials_json: ${{ secrets.GCP_CREDENTIALS }}

      - name: Set up Cloud SDK
        uses: google-github-actions/setup-gcloud@v2

      - name: Configure Docker Auth
        run: gcloud auth configure-docker $REGION-docker.pkg.dev --quiet

      - name: Build and Push Docker Image
        run: |
          docker build -t $IMAGE_NAME .
          docker push $IMAGE_NAME

      - name: Run Prisma Migrations via Cloud Run Job
        run: |
          gcloud run jobs update migrate-db \
            --image $IMAGE_NAME \
            --region $REGION
          gcloud run jobs execute migrate-db --wait

      - name: Deploy to Cloud Run
        uses: google-github-actions/deploy-cloudrun@v2
        with:
          service: ${{ env.SERVICE_NAME }}
          region: ${{ env.REGION }}
          image: ${{ env.IMAGE_NAME }}
          env_vars: |
            NODE_ENV=production
            DATABASE_URL=${{ secrets.DATABASE_URL }}
            REDIS_HOST=${{ secrets.REDIS_HOST }}
            REDIS_PORT=6379
            JWT_SECRET=${{ secrets.JWT_SECRET }}
          # Ensure you flag the VPC connector if using MemoryStore
          flags: |
            --vpc-connector=ticketing-vpc-connector
```

### 💡 Pro-Tips for CI/CD:
1.  **Always CPU Allocation for BullMQ:** Since you are running background workers (BullMQ) inside your NestJS app, you must configure your Cloud Run service to keep the CPU allocated always (not just during requests). You can do this in the deploy command by adding `--no-cpu-throttling`.
2.  **Separate Worker Service (Optional but Recommended):** For maximum scale, deploy the identical Docker image as a *second* Cloud Run service or job solely responsible for processing Queues, while the main service handles HTTP requests.
