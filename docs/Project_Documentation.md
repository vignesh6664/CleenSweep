# CleanSweep - Project Documentation

## 1. Executive Summary

**CleanSweep** is a cloud financial operations (FinOps) dashboard designed to help developers and organizations visualize, manage, and reduce their AWS cloud costs. It specifically targets "zombie" resources—assets that are accruing charges but providing no value—such as unattached EBS volumes and idle EC2 instances.

The application features a secure, multi-tenant architecture where users can connect their own AWS accounts, scan for waste, and take action directly from a unified interface.

---

## 2. Core Features

### 🔐 Authentication & Security
- **Kinde Auth Integration**: Enterprise-grade authentication supporting passwordless login and social sign-ins.
- **JWT Validation**: Backend endpoints are secured using JSON Web Tokens (RS256 signature verification).
- **Data Isolation**: Strict multi-tenancy ensures users can only access their own cloud accounts and resources.
- **Encryption**: AWS secret keys are encrypted at rest using AES-256-CBC.

### ☁️ Cloud Connect
- **Multi-Account Support**: Users can connect multiple AWS accounts.
- **Credential Validation**: Validates AWS credentials upon connection.
- **Region Agnostic**: Scans resources across multiple global AWS regions.

### 🕵️‍♂️ Waste Scanner
- **EBS Volume Scanner**: Identifies `available` (unattached) volumes that are billing hourly.
- **Idle Instance Scanner**: Analyzes CloudWatch metrics to find instances with < 5% CPU utilization over 7 days.
- **Cost Estimation**: Calculates monthly waste based on resource type, size, and region.

### ⏱️ Power Scheduler
- **Automated Scheduling**: Define start/stop schedules for non-production instances.
- **Cost Optimization**: Reduce costs by ~70% by running instances only during business hours (e.g., 9 AM - 6 PM).
- **Timezone Aware**: Schedules respect local timezones.

---

## 3. Technology Stack

### Frontend (Client)
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS, Lucide React (Icons)
- **State Management**: React Query (TanStack Query)
- **Animation**: Framer Motion
- **Authentication**: `@kinde-oss/kinde-auth-react`
- **Charts**: Recharts

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: NestJS (Modular Architecture)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cloud SDK**: AWS SDK v3 (Modular packages)
- **Validation**: `class-validator`, `class-transformer`

---

## 4. Architecture & Database Schema

### Database Models

#### User
Represents the authenticated user from Kinde.
- `id`: String (Kinde ID)
- `email`: String (Unique)
- `name`: String (Optional)
- Relation: Has many `CloudAccount`

#### CloudAccount
Represents a connected AWS account.
- `id`: UUID
- `accountName`: String
- `accessKey`: String
- `secretKey`: String (Encrypted)
- `userId`: String (Foreign Key)

#### ScanResult
Stores detected waste items.
- `id`: UUID
- `resourceId`: String (AWS ID)
- `resourceType`: Enum (EBS, EC2, etc.)
- `monthlyCost`: Float
- `accountId`: String (Foreign Key)

#### Schedule
Defines automation rules for instances.
- `id`: UUID
- `instanceId`: String
- `startTime`: String (HH:mm)
- `stopTime`: String (HH:mm)
- `isEnabled`: Boolean
- `accountId`: String (Foreign Key)

---

## 5. API Endpoints

### Authentication
- handled via Kinde SDK and `KindeAuthGuard` on backend.

### Cloud Accounts
- `POST /api/accounts`: Connect a new AWS account.
- `GET /api/accounts`: List all connected accounts for the user.
- `DELETE /api/accounts/:id`: Remove a connected account.

### Scanner
- `GET /api/scanner/run/:accountId`: Trigger a scan for orphaned volumes.
- `GET /api/scanner/idle-instances/:accountId`: Scan for idle EC2 instances.
- `DELETE /api/scanner/volume/:accountId/:region/:volumeId`: Delete a zombie volume.

### Scheduler
- `POST /api/scheduler`: Create a new start/stop schedule.
- `GET /api/scheduler/:accountId`: List schedules for an account.
- `PATCH /api/scheduler/:id`: Update schedule (enable/disable).
- `DELETE /api/scheduler/:id`: Delete a schedule.

---

## 6. Security Implementation

### Authentication Flow
1. **Frontend**: User clicks "Sign In", redirects to Kinde.
2. **Kinde**: User authenticates, redirects back with code.
3. **Frontend**: Exchanges code for Access Token (JWT).
4. **API Request**: Frontend sends `Authorization: Bearer <token>` header.
5. **Backend Guard**:
   - Verifies JWT signature using Kinde's JWKS.
   - Validates claims (expiry, issuer).
   - Extracts `sub` (User ID).
   - **Auto-Provisioning**: Checks if User exists in DB; creates if not.
   - Attaches User to Request object.

### Data Isolation
All service methods enforce ownership checks:
```typescript
// Example: Only delete volume if the account belongs to the user
const account = await prisma.cloudAccount.findFirst({
  where: { id: accountId, userId: currentUser.id }
});
if (!account) throw new ForbiddenException();
```

---

## 7. Configuration

### Environment Variables

**Server (`/server/.env`)**
```env
DATABASE_URL="postgres://user:pass@localhost:5432/db"
ENCRYPTION_KEY="32-char-random-string"
KINDE_DOMAIN="https://your-app.kinde.com"
```

**Client (`/client/.env`)**
```env
VITE_KINDE_DOMAIN="https://your-app.kinde.com"
VITE_KINDE_CLIENT_ID="your-client-id"
VITE_KINDE_REDIRECT_URI="http://localhost:5173"
VITE_KINDE_LOGOUT_REDIRECT_URI="http://localhost:5173"
VITE_API_BASE_URL="http://localhost:3000"
```
