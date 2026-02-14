# CleanSweep Project

This project is initialized with the following components:

## Components

- **Backend**: NestJS application initialized in `/server`.
- **Frontend**: React (Vite) application initialized in `/client` with Tailwind CSS v4.
- **Database**: PostgreSQL configuration in `docker-compose.yml`.

## Getting Started

### Backend

The NestJS backend runs on port 3000. To start it:

```bash
cd server
npm install
npm run start:dev
```

### Frontend

The React frontend runs on port 5173. To start it:

```bash
cd client
npm install
npm run dev
```

### Database

To start the PostgreSQL database:

```bash
docker-compose up -d
```

## Maintenance

This README.md serves as a living document for the project. Please update it as new features are added.
