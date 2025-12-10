# Project Structure - IBM i Query Runner

## Overview
This document outlines the complete directory structure and file organization for the IBM i Query Runner application. The application is designed to be flexible with configurable database library and IFS installation paths.

## Root Directory Structure

```
ibmi_query_runner/
├── backend/                    # Node.js backend application
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── controllers/       # Route controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # Data models
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   ├── utils/             # Utility functions
│   │   └── app.js             # Express app setup
│   ├── tests/                 # Backend tests
│   ├── package.json
│   └── .env.example           # Environment variables template
│
├── frontend/                   # Vue.js frontend application
│   ├── src/
│   │   ├── assets/            # Static assets
│   │   ├── components/        # Vue components
│   │   ├── views/             # Page views
│   │   ├── router/            # Vue Router config
│   │   ├── stores/            # Pinia stores
│   │   ├── services/          # API service layer
│   │   ├── utils/             # Utility functions
│   │   ├── App.vue            # Root component
│   │   └── main.js            # Entry point
│   ├── public/                # Public assets
│   ├── tests/                 # Frontend tests
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
│
├── database/                   # Database scripts
│   ├── schema/                # DDL scripts
│   ├── migrations/            # Migration scripts
│   └── seeds/                 # Seed data
│
├── docs/                       # Documentation
│   ├── api/                   # API documentation
│   ├── user-guide/            # User documentation
│   └── deployment/            # Deployment guides
│
├── scripts/                    # Utility scripts
│   ├── deploy.sh              # Deployment script
│   └── setup.sh               # Setup script
│
├── ARCHITECTURE.md             # System architecture
├── DATABASE_SCHEMA.md          # Database schema
├── PROJECT_STRUCTURE.md        # This file
├── README.md                   # Project readme
├── LICENSE                     # License file
└── .gitignore                 # Git ignore rules
```

## Backend Structure Details

### `/backend/src/config/`
Configuration management for the application.

```
config/
├── database.js         # Database connection configuration
├── auth.js            # Authentication configuration
├── app.js             # Application settings
└── constants.js       # Application constants
```

### `/backend/src/controllers/`
Request handlers for API endpoints.

```
controllers/
├── authController.js           # Authentication endpoints
├── userController.js           # User management
├── querySetController.js       # Query set operations
├── queryController.js          # Individual query operations
├── planCacheController.js      # Plan cache queries
├── testRunController.js        # Test run management
├── executionController.js      # Query execution
├── comparisonController.js     # Comparison operations
└── configController.js         # Configuration management
```

### `/backend/src/middleware/`
Express middleware functions.

```
middleware/
├── auth.js            # Authentication middleware
├── validation.js      # Request validation
├── errorHandler.js    # Error handling
├── logger.js          # Request logging
└── rateLimiter.js     # Rate limiting
```

### `/backend/src/models/`
Data models and database interaction.

```
models/
├── User.js            # User model
├── QuerySet.js        # Query set model
├── Query.js           # Query model
├── TestRun.js         # Test run model
├── Execution.js       # Execution model
├── Comparison.js      # Comparison model
└── Config.js          # Configuration model
```

### `/backend/src/routes/`
API route definitions.

```
routes/
├── index.js           # Main router
├── auth.js            # Authentication routes
├── users.js           # User routes
├── querySets.js       # Query set routes
├── queries.js         # Query routes
├── planCache.js       # Plan cache routes
├── testRuns.js        # Test run routes
├── comparisons.js     # Comparison routes
└── config.js          # Configuration routes
```

### `/backend/src/services/`
Business logic and core functionality.

```
services/
├── authService.js              # Authentication logic
├── querySetService.js          # Query set operations
├── planCacheService.js         # Plan cache integration
├── queryRefreshService.js      # Query set refresh logic
├── executionService.js         # Query execution engine
├── metricsService.js           # Metrics collection
├── comparisonService.js        # Comparison analysis
├── reportService.js            # Report generation
└── websocketService.js         # WebSocket handling
```

### `/backend/src/utils/`
Utility functions and helpers.

```
utils/
├── database.js        # Database utilities
├── crypto.js          # Cryptography utilities
├── queryHash.js       # Query hashing
├── logger.js          # Logging utilities
├── validators.js      # Validation functions
└── formatters.js      # Data formatting
```

## Frontend Structure Details

### `/frontend/src/components/`
Reusable Vue components organized by feature.

```
components/
├── common/                     # Common components
│   ├── AppHeader.vue
│   ├── AppSidebar.vue
│   ├── AppFooter.vue
│   ├── LoadingSpinner.vue
│   ├── ErrorAlert.vue
│   └── ConfirmDialog.vue
│
├── auth/                       # Authentication components
│   ├── LoginForm.vue
│   └── SessionInfo.vue
│
├── querySets/                  # Query set components
│   ├── QuerySetList.vue
│   ├── QuerySetCard.vue
│   ├── QuerySetForm.vue
│   ├── QuerySetDetail.vue
│   └── RefreshHistory.vue
│
├── queries/                    # Query components
│   ├── QueryList.vue
│   ├── QueryCard.vue
│   ├── QueryEditor.vue
│   └── QueryPreview.vue
│
├── planCache/                  # Plan cache components
│   ├── PlanCacheFilters.vue
│   ├── PlanCachePreview.vue
│   └── QueryImportDialog.vue
│
├── testRuns/                   # Test run components
│   ├── TestRunList.vue
│   ├── TestRunCard.vue
│   ├── TestRunForm.vue
│   ├── TestRunDetail.vue
│   ├── ExecutionProgress.vue
│   └── ExecutionResults.vue
│
├── comparisons/                # Comparison components
│   ├── ComparisonList.vue
│   ├── ComparisonForm.vue
│   ├── ComparisonDetail.vue
│   ├── ComparisonChart.vue
│   └── DeviationTable.vue
│
└── users/                      # User management components
    ├── UserList.vue
    ├── UserForm.vue
    └── UserCard.vue
```

### `/frontend/src/views/`
Page-level components (routes).

```
views/
├── Dashboard.vue              # Main dashboard
├── Login.vue                  # Login page
├── QuerySets.vue              # Query sets page
├── QuerySetDetail.vue         # Query set detail page
├── TestRuns.vue               # Test runs page
├── TestRunDetail.vue          # Test run detail page
├── Comparisons.vue            # Comparisons page
├── ComparisonDetail.vue       # Comparison detail page
├── Users.vue                  # User management page
├── Settings.vue               # Settings page
└── NotFound.vue               # 404 page
```

### `/frontend/src/stores/`
Pinia stores for state management.

```
stores/
├── auth.js            # Authentication state
├── querySets.js       # Query sets state
├── testRuns.js        # Test runs state
├── comparisons.js     # Comparisons state
├── users.js           # Users state
└── config.js          # Configuration state
```

### `/frontend/src/services/`
API service layer for backend communication.

```
services/
├── api.js             # Base API client
├── authService.js     # Authentication API
├── querySetService.js # Query set API
├── queryService.js    # Query API
├── planCacheService.js # Plan cache API
├── testRunService.js  # Test run API
├── comparisonService.js # Comparison API
└── userService.js     # User API
```

## Database Structure

### `/database/schema/`
DDL scripts for database objects.

```
schema/
├── 01_create_tables.sql       # Table creation
├── 02_create_indexes.sql      # Index creation
├── 03_create_views.sql        # View creation
├── 04_create_procedures.sql   # Stored procedures
└── 05_initial_data.sql        # Initial data
```

### `/database/migrations/`
Database migration scripts.

```
migrations/
├── 001_initial_schema.sql
├── 002_add_config_table.sql
└── README.md
```

## Documentation Structure

### `/docs/api/`
API documentation.

```
api/
├── authentication.md          # Auth endpoints
├── query-sets.md             # Query set endpoints
├── test-runs.md              # Test run endpoints
├── comparisons.md            # Comparison endpoints
└── README.md                 # API overview
```

### `/docs/user-guide/`
User documentation.

```
user-guide/
├── getting-started.md        # Getting started guide
├── query-sets.md             # Query set management
├── test-runs.md              # Running tests
├── comparisons.md            # Comparing results
└── troubleshooting.md        # Troubleshooting guide
```

### `/docs/deployment/`
Deployment documentation.

```
deployment/
├── ibmi-setup.md             # IBM i setup
├── database-setup.md         # Database setup
├── application-setup.md      # Application setup
└── configuration.md          # Configuration guide
```

## Configuration Files

### Backend Configuration Files

#### `backend/.env.example`
```env
# Database Configuration
DB_HOST=your-ibmi-host
DB_PORT=8471
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_LIBRARY=YOURLIB

# Application Configuration
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Installation Path (IFS)
INSTALL_ROOT=/your/install/path

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# WebSocket
WS_PORT=3001
```

#### `backend/package.json`
```json
{
  "name": "ibmi-query-runner-backend",
  "version": "1.0.0",
  "description": "IBM i Query Runner Backend",
  "main": "src/app.js",
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "express": "^4.18.0",
    "node-jt400": "^2.0.0",
    "jsonwebtoken": "^9.0.0",
    "bcrypt": "^5.1.0",
    "ws": "^8.13.0",
    "dotenv": "^16.0.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "express-rate-limit": "^6.7.0",
    "winston": "^3.8.0"
  },
  "devDependencies": {
    "nodemon": "^2.0.0",
    "jest": "^29.0.0",
    "eslint": "^8.0.0"
  }
}
```

### Frontend Configuration Files

#### `frontend/package.json`
```json
{
  "name": "ibmi-query-runner-frontend",
  "version": "1.0.0",
  "description": "IBM i Query Runner Frontend",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint src/"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0",
    "@headlessui/vue": "^1.7.0",
    "@heroicons/vue": "^2.0.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "vite": "^4.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vitest": "^0.32.0",
    "eslint": "^8.0.0",
    "eslint-plugin-vue": "^9.0.0"
  }
}
```

#### `frontend/vite.config.js`
```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
```

#### `frontend/tailwind.config.js`
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        }
      }
    },
  },
  plugins: [],
}
```

## Git Configuration

### `.gitignore`
```
# Dependencies
node_modules/
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test coverage
coverage/
```

## Development Workflow

### Local Development Setup

1. **Clone repository**
   ```bash
   git clone <repository-url>
   cd ibmi_query_runner
   ```

2. **Backend setup**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Edit .env with your configuration:
   # - Set DB_LIBRARY to your library name (e.g., YOURLIB)
   # - Set INSTALL_ROOT to your IFS path (e.g., /your/install/path)
   npm run dev
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Database setup**
   ```bash
   # Connect to IBM i and run:
   # 1. Create library: CRTLIB LIB(YOURLIB)
   # 2. Set schema: SET SCHEMA YOURLIB
   # 3. Run database/schema/*.sql scripts
   ```

### Build for Production

1. **Backend**
   ```bash
   cd backend
   npm install --production
   ```

2. **Frontend**
   ```bash
   cd frontend
   npm run build
   # Output in dist/ directory
   ```

## Deployment Structure on IBM i

The application can be deployed to any IFS location specified by the user. Example structure:

```
/your/install/path/ibmi-query-runner/
├── backend/
│   ├── node_modules/
│   ├── src/
│   ├── package.json
│   └── .env
├── frontend/
│   └── dist/           # Built frontend files
├── logs/
│   ├── app.log
│   └── error.log
└── scripts/
    ├── start.sh
    └── stop.sh
```

### Example Deployment Paths

Users can choose any of these (or custom) paths:

- `/opt/ibmi-query-runner/`
- `/home/YOURUSER/apps/query-runner/`
- `/QOpenSys/var/apps/query-runner/`
- `/custom/path/query-runner/`

## Configuration Management

### Database Library Configuration

The database library is configured in two places:

1. **Environment Variable** (`backend/.env`):
   ```env
   DB_LIBRARY=YOURLIB
   ```

2. **Database Connection** (`backend/src/config/database.js`):
   ```javascript
   const config = {
     library: process.env.DB_LIBRARY || 'YOURLIB',
     // ... other config
   };
   ```

3. **SQL Queries**: All queries use the configured library:
   ```javascript
   const tableName = `${config.library}.QRYRUN_USERS`;
   ```

### IFS Path Configuration

The installation path is configured via environment variable:

1. **Environment Variable** (`backend/.env`):
   ```env
   INSTALL_ROOT=/your/install/path
   ```

2. **Application Config** (`backend/src/config/app.js`):
   ```javascript
   const config = {
     installRoot: process.env.INSTALL_ROOT || '/opt/ibmi-query-runner',
     logsPath: `${process.env.INSTALL_ROOT}/logs`,
     // ... other paths
   };
   ```

## Deployment Script Example

### `scripts/deploy.sh`
```bash
#!/bin/bash

# Configuration
INSTALL_ROOT="${INSTALL_ROOT:-/opt/ibmi-query-runner}"
DB_LIBRARY="${DB_LIBRARY:-YOURLIB}"

echo "Deploying IBM i Query Runner"
echo "Installation Path: $INSTALL_ROOT"
echo "Database Library: $DB_LIBRARY"

# Create installation directory
mkdir -p "$INSTALL_ROOT"
mkdir -p "$INSTALL_ROOT/logs"

# Deploy backend
echo "Deploying backend..."
cp -r backend "$INSTALL_ROOT/"
cd "$INSTALL_ROOT/backend"
npm install --production

# Deploy frontend
echo "Deploying frontend..."
cp -r frontend/dist "$INSTALL_ROOT/frontend"

# Create .env file
cat > "$INSTALL_ROOT/backend/.env" << EOF
DB_LIBRARY=$DB_LIBRARY
INSTALL_ROOT=$INSTALL_ROOT
NODE_ENV=production
PORT=3000
EOF

echo "Deployment complete!"
echo "Configure your .env file at: $INSTALL_ROOT/backend/.env"
```

## Key Design Decisions

1. **Configurable Paths**: Both database library and IFS paths are configurable
2. **Environment-Based Config**: All paths configured via environment variables
3. **Separation of Concerns**: Backend and frontend are separate applications
4. **Modular Architecture**: Clear separation of routes, controllers, services
5. **Component-Based UI**: Reusable Vue components for maintainability
6. **State Management**: Pinia for centralized state management
7. **API Layer**: Dedicated service layer for API communication
8. **Real-time Updates**: WebSocket for execution progress

## Installation Checklist

- [ ] Choose database library name (e.g., YOURLIB)
- [ ] Choose IFS installation path (e.g., /your/install/path)
- [ ] Create database library on IBM i
- [ ] Run database schema scripts with SET SCHEMA
- [ ] Configure backend .env file with library and path
- [ ] Install backend dependencies
- [ ] Build frontend application
- [ ] Deploy to chosen IFS location
- [ ] Configure startup scripts
- [ ] Test application access

## Next Steps

1. Initialize project structure
2. Set up backend with Express.js
3. Configure database connection with library parameter
4. Implement authentication
5. Build core services
6. Create API endpoints
7. Set up frontend with Vue.js
8. Build UI components
9. Integrate frontend with backend
10. Create deployment scripts
11. Test and deploy