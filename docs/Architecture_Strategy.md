# CleanSweep - Architecture & Strategy

This document serves as the living record of CleanSweep's architectural state, identified strengths, and the strategic roadmap for future enhancements. It is intended to be updated as new insights are gained or as the system evolves.

---

## 🏗️ Current Architectural State (March 2026)

### Core Strengths
*   **Security & Data Isolation**: Strict multi-tenancy is enforced via Kinde JWT `userId` integration across all database queries. AWS credentials are encrypted at rest using **AES-256-CBC** with unique IVs.
*   **Modular Backend**: Domain-driven NestJS modules (`Scanner`, `Scheduler`, `Aws`, `Accounts`) ensure clear separation of concerns and high testability.
*   **Standardized Time Management**: All schedules are synchronized in **UTC** while maintaining user-specific IANA timezones for accurate local execution.
*   **Responsive State**: **React Query** handles the frontend data lifecycle, providing robust caching and seamless UI updates.

---

## 🚀 Strategic Roadmap & Future Improvements

The following items represent the current "To-Do" list for architectural maturation and feature precision.

### 1. Asynchronous Scanning & Task Processing
*   **Problem**: Synchronous AWS scans across multiple regions can hit API Gateway timeouts and block the main event loop.
*   **Goal**: Transition resource-heavy operations to a background job queue.
*   **Proposed Stack**: BullMQ + Redis.
*   **Status**: 🗓️ Planned

### 2. Dynamic Cloud Pricing Integration
*   **Problem**: Current cost estimations use hardcoded static values which lack regional and volume-type (gp2 vs gp3) accuracy.
*   **Goal**: Integrate with the **AWS Price List Query API** for real-time, precision FinOps reporting.
*   **Status**: 🗓️ Planned

### 3. Comprehensive Audit & Compliance Logging
*   **Problem**: Destructive actions (deletions, stops) are not permanently logged for user accountability or troubleshooting.
*   **Goal**: Implement a centralized `AuditLog` system to track every state-changing event.
*   **Status**: 🗓️ Planned

### 4. Advanced Error Diagnostics
*   **Problem**: Silent failures in service methods make it difficult for users to diagnose AWS permission or connectivity issues.
*   **Goal**: Implement a global NestJS Exception Filter to translate low-level SDK errors into user-friendly, actionable diagnostic messages.
*   **Status**: 🗓️ Planned

---

## 📝 Architecture Decision Records (ADR)

*Future architectural decisions should be documented here using the ADR format.*

### ADR Template
```markdown
### ADR-XXX: [Title]
**Status**: [Proposed | Accepted | Superseded]
**Context**: What problem are we solving?
**Decision**: What is the proposed change?
**Consequences**: What are the trade-offs (easier vs. harder)?
```
