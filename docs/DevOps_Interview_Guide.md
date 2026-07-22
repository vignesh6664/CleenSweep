# CleanSweep DevOps Interview Master Guide 🚀

This document is your preparation bible for DevOps/Infrastructure interviews. It uses the CleanSweep project as the primary case study to demonstrate senior-level engineering principles.

---

## 1. Architecture Overview (The "Big Picture")
**The Question:** *"Walk me through the DevOps architecture of CleanSweep. How does code go from your machine to production?"*
*   **The Senior-Level Answer:** 
    > "I've built a full-lifecycle DevOps environment for CleanSweep. I use **Docker** with multi-stage builds to ensure a minimal and secure production image. My **GitHub Actions** pipeline serves as the 'Quality Gatekeeper,' automatically running linters, unit tests, and a **Trivy security scan** on every push. For infrastructure, I use **Terraform** to provision a Zero-Trust VPC on AWS with isolated private subnets for the DB and Backend. Finally, I deploy to **Kubernetes** using **Kustomize** for environment-specific overlays and an **Ingress Controller** for path-based traffic routing."

---

## 2. Observability (Loki, Grafana, Prometheus)
**The Question:** *"It's 2:00 AM. The frontend is loading fine, but the 'Waste Scanner' is failing. How do you find the root cause?"*
*   **The Senior-Level Answer:** 
    > "I follow a 3-step 'Observability Pipeline.' First, I check my **Grafana Dashboard** for 'Golden Signals' like Error Rates and Latency. Second, I look at **Prometheus** metrics to see if there's a resource bottleneck (CPU/RAM) or a spike in 5xx errors. Finally, I pivot to **Loki** to read the exact stack trace from the failing container logs. This correlation between metrics and logs allows me to identify the root cause in seconds."

---

## 3. Infrastructure as Code (Terraform)
**The Question:** *"A developer accidentally manually deleted a Security Group in the AWS Console. How do you fix this 'Drift'?"*
*   **The Senior-Level Answer:** 
    > "I'd run **`terraform plan`**. Terraform will automatically detect the 'Drift' by comparing my code to the actual cloud state. I'd then run **`terraform apply`** to recreate the missing resource. To prevent this, I implement **IAM Least Privilege**: developers get Read-Only access to the console, and only our **CI/CD Service Account** has the permission to modify the cloud."

---

## 4. Orchestration & Scaling (Kubernetes)
**The Question:** *"How do you handle a sudden viral traffic spike in CleanSweep?"*
*   **The Senior-Level Answer:** 
    > "I implement a two-tier scaling strategy. First, the **Horizontal Pod Autoscaler (HPA)** adds more backend replicas based on real-time CPU/Memory usage. If the cluster runs out of physical space, the **Cluster Autoscaler** detects 'Pending' pods and triggers an **AWS Auto Scaling Group** to provision new EC2 Worker Nodes. This ensures that software scaling isn't blocked by hardware limitations."

---

## 5. Security & Secrets Management (DevSecOps)
**The Question:** *"How do you handle sensitive AWS keys and database passwords in this app?"*
*   **The Senior-Level Answer:** 
    > "I practice 'Zero-Trust' secrets management. I never check secrets into Git. In the app, I encrypt AWS keys at rest using **AES-256-CBC**. For the infrastructure, I use **GitHub Secrets** for CI/CD and **AWS Secrets Manager** for production environment variables. I also implement **Shift-Left Security** by running **Trivy** scans in my pipeline to catch vulnerabilities before they reach the registry."

---

## 6. Artifacts & Performance (Docker)
**The Question:** *"Why did you choose an 'Alpine' base image and Multi-Stage builds for your Docker containers?"*
*   **The Senior-Level Answer:** 
    > "I use **Alpine** images to minimize the **Attack Surface**; they contain only the bare essentials. I combine this with **Multi-Stage builds** to keep build-time dependencies (like source code and compilers) out of the final production image. This results in faster deployments, lower storage costs, and a more secure production environment."

---

## 7. FinOps & Cost Optimization
**The Question:** *"CleanSweep detects waste, but how do you monitor its own cost?"*
*   **The Senior-Level Answer:** 
    > "I apply FinOps principles to my own infrastructure. For example, I use **AWS Fargate** for ECS to avoid paying for idle EC2 capacity. I also implement **S3 Lifecycle Policies** for my Terraform state backups and Loki logs, automatically moving old data to **Glacier** after 30 days to minimize storage costs."

---

## 8. Database Migrations in CI/CD
**The Question:** *"How do you handle database schema changes in a zero-downtime CI/CD pipeline?"*
*   **The Senior-Level Answer:** 
    > "I use **`prisma migrate deploy`** as a 'Pre-Deployment' job in my GitHub Actions. This ensures the database schema is updated *before* the new code starts running. To achieve zero-downtime, I follow the **'Expand and Contract'** pattern: adding new columns first, deploying code, and removing old columns only after the system is stable."

---

## 9. Disaster Recovery (DR)
**The Question:** *"The entire AWS us-east-1 region just went offline. What is your Recovery strategy?"*
*   **The Senior-Level Answer:** 
    > "Because my infrastructure is defined in **Terraform**, I can redeploy to a different region in minutes. My RTO is determined by the time it takes to spin up the VPC and restore the RDS database from its **Cross-Region Snapshot**. By keeping the state file in S3 with cross-region replication, my 'Blueprint' is always available."

---

## 10. Dealing with "Noisy Neighbors" (Resource Isolation)
**The Question:** *"One of your backend pods has a memory leak. How do you stop it from killing other services?"*
*   **The Senior-Level Answer:** 
    > "I use Kubernetes **Resource Quotas and LimitRanges**. By setting a `memory.limit` on the backend deployment, the Linux OOM (Out Of Memory) Killer will terminate only that specific pod when it exceeds its limit, rather than crashing the entire node. This sandboxes the failure."

---

## 11. Service Mesh & MTLS
**The Question:** *"How do you secure communication BETWEEN your services inside the cluster?"*
*   **The Senior-Level Answer:** 
    > "I move beyond simple firewall rules to **Mutual TLS (mTLS)**. By using a Service Mesh like **Istio or Linkerd**, I can ensure that every service-to-service call is encrypted and authenticated. This prevents traffic 'sniffing' even if one container is compromised."

---

## 12. GitOps vs. CI/CD
**The Question:** *"What is the difference between 'Push-based' and 'Pull-based' deployment?"*
*   **The Senior-Level Answer:** 
    > "We currently use **Push-based** (CI pushes to the cluster). However, for production, I recommend **Pull-based GitOps** (e.g., **ArgoCD**). In the Pull model, the cluster 'watches' Git and pulls changes. This is more secure and automatically fixes 'Config Drift' if someone manually changes a manifest in the cluster."

---

## 13. Spot Instances (Cost Saving)
**The Question:** *"How would you use Spot Instances to reduce costs by 90%? What is the risk?"*
*   **The Senior-Level Answer:** 
    > "I use **AWS Spot Instances** for stateless worker nodes. I configure the **AWS Node Termination Handler** to gracefully 'drain' pods when AWS reclaims the instance. We save 90% on cost, and the orchestrator just moves pods to a different node without downtime."

---

## 14. Right-Sizing (Anti-Waste)
**The Question:** *"How do you use Observability data to 'Right-Size' the infrastructure?"*
*   **The Senior-Level Answer:** 
    > "I use **Vertical Pod Autoscaler (VPA)** in 'Recommendation Mode.' By analyzing Prometheus metrics, VPA identifies the gap between 'Requested' and 'Actual' usage. I then adjust the K8s manifests to ensure we aren't paying for 'Ghost' resources that are never used."

---

## 15. Policy as Code (Governance)
**The Question:** *"How do you prevent a developer from deploying a container that runs as 'Root'?"*
*   **The Senior-Level Answer:** 
    > "I implement **Policy as Code** using tools like **Kyverno or OPA**. These act as 'Admission Controllers.' If a deployment violates security standards (like running as root), Kubernetes will **reject the request** at the API level, enforcing automated governance."

---

## 16. Network Policies (Micro-segmentation)
**The Question:** *"If a hacker breaches your Frontend, how do you stop them from moving to your Database?"*
*   **The Senior-Level Answer:** 
    > "I use **Kubernetes Network Policies**. I apply a 'Deny-All' policy by default and then create specific 'Allow' rules that only permit the Frontend to talk to the Backend, and the Backend to talk to the DB. The attacker is trapped in a network silo."

---

## 17. Supply Chain Security (Image Signing)
**The Question:** *"How do we know that the Docker image running in production is the one that passed our scans?"*
*   **The Senior-Level Answer:** 
    > "I implement **Image Signing** using **Cosign**. During CI/CD, we sign the image after the Trivy scan passes. In Kubernetes, an Admission Controller verifies this signature before the pod starts. If the signature is missing, the cluster refuses to run it."

---

## 18. Runtime Security (Threat Detection)
**The Question:** *"How do you detect a 'live' attack while the app is already running?"*
*   **The Senior-Level Answer:** 
    > "I use a runtime tool like **Falco**. It monitors system calls. If a container tries to run a shell or modify sensitive files, Falco detects the abnormal behavior and sends an immediate alert. This provides visibility into 'Day 2' security threats."

---

## 19. SLOs, SLIs, and Error Budgets (SRE)
**The Question:** *"How do you define 'Success' for CleanSweep reliability?"*
*   **The Senior-Level Answer:** 
    > "I use the SRE framework. I define **SLIs** (e.g., Latency < 200ms) and roll them into an **SLO** (99.9% availability). If we exceed our **Error Budget**, we stop new feature development and prioritize reliability work until the budget is restored."

---

## 20. Canary Deployments (Traffic Routing)
**The Question:** *"How do you deploy a new version without dropping requests?"*
*   **The Senior-Level Answer:** 
    > "I prefer **Canary Deployments**. I use an Ingress Controller to send 5% of traffic to the new version. I monitor Prometheus—if errors stay at zero, I increase traffic to 100%. If errors spike, we roll back instantly with zero impact on the majority of users."

---

## 21. Database High Availability (Multi-AZ)
**The Question:** *"What happens if the primary database server data center goes offline?"*
*   **The Senior-Level Answer:** 
    > "I use RDS in **Multi-AZ mode**. AWS maintains a synchronous standby in a different zone. If the primary fails, AWS performs an automatic DNS failover to the standby in under 60 seconds, ensuring high availability and zero data loss."

---

## 22. Semantic Versioning (Artifact Traceability)
**The Question:** *"Why shouldn't you use the :latest tag in production?"*
*   **The Senior-Level Answer:** 
    > "It's a major risk because `:latest` is non-deterministic. I use **Semantic Versioning** combined with the **Git SHA** (e.g., `v1.2.3-a1b2c3d`). This creates an immutable link between the container and the code, making rollbacks predictable."

---

## 23. Infrastructure Testing (Checkov)
**The Question:** *"How do you test your Terraform code before running apply?"*
*   **The Senior-Level Answer:** 
    > "I use **Checkov** in my CI pipeline. It scans my Terraform code for security flaws (like public S3 buckets) before they ever touch the cloud. This 'Shifts Left' infrastructure security to the Pull Request stage."

---

## 24. Blame-Free Post-Mortems (Process)
**The Question:** *"What is your next step after fixing a major production outage?"*
*   **The Senior-Level Answer:** 
    > "I lead a **Blame-Free Post-Mortem**. We focus on the **Systemic Failure**, not individual mistakes. We document the timeline, the root cause, and create Action Items to prevent recurrence, fostering a culture of continuous improvement."

---

## 25. AWS PrivateLink (Cloud Networking)
**The Question:** *"How do you connect to a client's private VPC without using the public internet?"*
*   **The Senior-Level Answer:** 
    > "I would use **AWS PrivateLink**. It allows us to expose our service to another VPC over the AWS backbone without traversing the public internet. It's the gold standard for secure, private service-to-service communication at scale."
