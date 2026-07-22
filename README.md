# 🧹 CleanSweep - FinOps Cloud Waste Manager

CleanSweep is a powerful **FinOps dashboard** designed to detect, visualize, and eliminate cloud waste. It helps developers and organizations reduce their AWS bill by identifying orphaned resources and automating instance scheduling, all wrapped in a secure, modern web application.

![CleanSweep Dashboard](https://via.placeholder.com/1200x600?text=CleanSweep+Dashboard+Preview)

## ✨ Key Features

### 🔐 Secure Authentication & Multi-Tenancy
- **Kinde Authentication**: secure passwordless sign-in/sign-up.
- **Data Isolation**: Multi-tenant architecture ensures users only see and manage their own cloud accounts.
- **Protected Routes**: Comprehensive security prevents unauthorized access to sensitive dashboards and APIs.

### ☁️ Cloud Account Management
- **AWS Integration**: Securely connect multiple AWS accounts using Access/Secret keys.
- **Encryption**: Sensitive credentials are encrypted at rest using AES-256.

### 🕵️‍♂️ Waste Detection Scanner
- **Orphaned EBS Volumes**: Detects unattached Elastic Block Store volumes that are costing money but doing nothing.
- **Idle EC2 Instances**: Identifies running instances with low CPU utilization (< 5%) over the last 7 days.
- **Cost Estimation**: Automatically calculates potential monthly savings based on resource size and type.

### ⏱️ Power Scheduler
- **Automated Start/Stop**: creating schedules to automatically stop instances during off-hours (e.g., nights/weekends) and start them when needed.
- **Timezone Support**: Configure schedules in your local timezone.
- **Cost Savings**: Drastically reduce compute costs for non-production environments.

### 📊 Interactive Dashboard
- **Visual Analytics**: Beautiful charts and graphs showing total savings and resource distribution.
- **Real-time Actions**: Delete zombie resources or stop idle instances directly from the UI.

### 💳 Subscription Tiers
- **Free / Pro Gating**: Tier-based feature access (`subscriptionTier`) backed by Prisma, with Stripe wired in for billing.

### 🔑 Secure Cross-Account Access
- **CloudFormation Onboarding**: A one-click CloudFormation template (`infrastructure/aws/cloudformation`) provisions a least-privilege, External-ID-scoped IAM role so customers can connect their AWS account without sharing long-lived credentials.

## 🚀 DevOps Engineering Showcase

This project is built with a **Production-First** DevOps mindset, moving beyond simple code to a complete, automated, and secure infrastructure lifecycle.

### 🏗️ Infrastructure as Code (Terraform)
- **Zero-Trust Networking**: Implemented a modular VPC architecture (`modules/vpc`) with isolated **Private Subnets** for the Database and Backend.
- **NAT Gateway Integration**: Secure outbound-only internet access for private resources, preventing direct exposure to the public web.
- **RDS & Compute Modules**: Fully automated provisioning of Amazon RDS (PostgreSQL, `modules/database`) and application compute (`modules/compute`) using reusable Terraform modules, deployed per-environment (`environments/prod`).
- **State Management**: Configured S3 remote state storage with **DynamoDB State Locking** for safe, collaborative infrastructure management.

### ⚡ Continuous Integration & Security (GitHub Actions)
- **Shift-Left Security**: Integrated **Trivy Vulnerability Scanning** (Docker images) and **Checkov** (Terraform) directly into the CI pipeline. The build **fails automatically** if CRITICAL vulnerabilities or misconfigurations are detected.
- **Safe Database Migrations**: A dedicated `prisma migrate deploy` job runs only after backend tests pass, gating deploys on schema safety.
- **Advanced Caching**: Optimized pipeline speed by using GitHub Actions caching for npm dependencies and **Docker Layer Caching** (`type=gha`), reducing build times by ~40%.
- **Multi-Stage Builds**: Dockerfiles are optimized to produce minimal, hardened production images by stripping out build-time dependencies.

### ☸️ Container Orchestration (Kubernetes)
- **GitOps Ready**: Organized manifests using **Kustomize**, allowing for clean environment overlays (base/prod) without YAML duplication.
- **Canary Deployments**: A separate canary Deployment/Service/Ingress lets the prod overlay shift a slice of traffic to a new version before a full rollout.
- **Self-Healing Infrastructure**: Configured **Liveness and Readiness Probes** to ensure the orchestrator automatically restarts unhealthy containers.
- **Resource Management**: CPU/memory `requests` & `limits` and namespace `ResourceQuotas` keep workloads predictable and prevent noisy-neighbor issues.
- **Network Policies**: Default-deny **NetworkPolicies** restrict pod-to-pod traffic to only what the client/server/database explicitly need.
- **Ingress Control**: Implemented path-based routing (Layer 7) using an Nginx Ingress Controller to manage traffic flow between the React frontend and NestJS API.

### 📊 Observability & Monitoring (L.G.P. Stack)
- **Metrics (Prometheus)**: Automated scraping of application and system-level metrics.
- **Logging (Loki & Promtail)**: Centralized log aggregation for real-time troubleshooting without SSH-ing into containers.
- **Visualization (Grafana)**: Pre-configured dashboards for a unified "single pane of glass" view of the entire system health.

---

## 🛠️ Technology Stack

**Frontend:**
- **React 19** + **Vite 7**: Blazing fast Single Page Application.
- **Tailwind CSS 4** + **Radix UI / shadcn**: Modern, accessible component styling.
- **TanStack Query**: Server-state fetching, caching, and sync.
- **React Hook Form + Zod**: Type-safe form handling and validation.
- **Framer Motion**: Smooth, professional animations.
- **Recharts**: Data visualization.
- **Kinde Auth React**: Secure authentication SDK.

**Backend:**
- **NestJS 11**: Scalable, enterprise-grade Node.js framework.
- **Prisma ORM**: Type-safe database access.
- **PostgreSQL**: Robust relational database.
- **AWS SDK v3** (EC2, CloudWatch, STS): Scanning + cross-account role assumption.
- **Helmet + Throttler**: Security headers and rate limiting.
- **JWT / JWKS-RSA**: Kinde token verification.
- **Stripe**: Subscription billing for Free/Pro tiers.

**Infrastructure & DevOps:**
- **Terraform**: VPC, RDS, and compute modules across environments.
- **Kubernetes + Kustomize**: Base manifests with prod overlay (canary, network policies, resource quotas).
- **CloudFormation**: Customer-facing cross-account IAM role template.
- **GitHub Actions**: Lint/test, Checkov, Trivy, and gated Prisma migrations.
- **Prometheus + Grafana + Loki/Promtail**: Metrics, dashboards, and log aggregation.

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL
- AWS Account (for scanning)
- Kinde Account (for authentication)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/vignesh6664/cleansweep.git
   cd cleansweep
   ```

2. **Setup Server**
   ```bash
   cd server
   npm install
   
   # Configure Environment Variables
   cp .env.example .env
   # Update .env with your DB credentials, encryption key, and Kinde details
   
   # Run Migrations
   npx prisma migrate dev
   
   # Start Server
   npm run start:dev
   ```

3. **Setup Client**
   ```bash
   cd ../client
   npm install
   
   # Configure Environment Variables
   cp .env.example .env
   # Update .env with your Kinde credentials
   
   # Start Client
   npm run dev
   ```

4. **Access Application**
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 🔒 Environment Configuration

You need to configure **Kinde Authentication** for the app to work.

**Server `.env`**:
```env
KINDE_DOMAIN=https://your-domain.kinde.com
```

**Client `.env`**:
```env
VITE_KINDE_DOMAIN=https://your-domain.kinde.com
VITE_KINDE_CLIENT_ID=your_client_id
VITE_KINDE_REDIRECT_URI=http://localhost:5173
VITE_KINDE_LOGOUT_REDIRECT_URI=http://localhost:5173
```

## 🤝 Contributing
Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License
This project is licensed under the MIT License.
