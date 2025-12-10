# Frontend Setup - IBM i Query Runner

## Overview

This document describes the Vue.js 3 frontend setup for the IBM i Query Runner application. The frontend provides a modern, responsive web interface for managing query sets, running performance tests, and analyzing results.

## Technology Stack

### Core Framework
- **Vue 3.4.21** - Progressive JavaScript framework with Composition API
- **Vite 5.1.5** - Next-generation frontend build tool
- **Vue Router 4.3.0** - Official routing library

### State Management
- **Pinia 2.1.7** - Intuitive, type-safe state management

### UI & Styling
- **Tailwind CSS 3.4.1** - Utility-first CSS framework
- **PostCSS 8.4.35** - CSS transformation tool
- **Autoprefixer 10.4.18** - Automatic vendor prefixing

### HTTP & Real-time
- **Axios 1.6.7** - Promise-based HTTP client
- **Socket.io Client 4.7.4** - Real-time bidirectional communication

### Data Visualization
- **Chart.js 4.4.1** - Simple yet flexible JavaScript charting
- **Vue-ChartJS 5.3.0** - Vue wrapper for Chart.js

### Utilities
- **date-fns 3.3.1** - Modern JavaScript date utility library

## Project Structure

```
frontend/
├── public/                      # Static assets
├── src/
│   ├── assets/
│   │   └── main.css            # Global styles with Tailwind directives
│   ├── components/             # Reusable Vue components (to be created)
│   ├── router/
│   │   └── index.js            # Vue Router configuration
│   ├── stores/
│   │   └── auth.js             # Authentication state management
│   ├── utils/
│   │   ├── api.js              # Axios instance and API endpoints
│   │   └── formatters.js       # Utility functions for formatting
│   ├── views/
│   │   ├── LoginView.vue       # Login page
│   │   ├── LayoutView.vue      # Main layout with navigation
│   │   ├── DashboardView.vue   # Dashboard/home page
│   │   ├── NotFoundView.vue    # 404 page
│   │   ├── QuerySetsView.vue   # Query sets list
│   │   ├── QuerySetDetailView.vue      # Query set details (placeholder)
│   │   ├── QuerySetCreateView.vue      # Create query set (placeholder)
│   │   ├── TestRunsView.vue            # Test runs list (placeholder)
│   │   ├── TestRunDetailView.vue       # Test run details (placeholder)
│   │   ├── ComparisonsView.vue         # Comparisons list (placeholder)
│   │   ├── ComparisonDetailView.vue    # Comparison details (placeholder)
│   │   └── UsersView.vue               # User management (placeholder)
│   ├── App.vue                 # Root component
│   └── main.js                 # Application entry point
├── .gitignore                  # Git ignore rules
├── index.html                  # HTML template
├── package.json                # Dependencies and scripts
├── postcss.config.js           # PostCSS configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── vite.config.js              # Vite configuration
└── README.md                   # Frontend documentation
```

## Configuration Files

### 1. package.json
Defines project dependencies and npm scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### 2. vite.config.js
- Vue plugin configuration
- Path aliases (`@` → `./src`)
- Development server on port 5173
- API proxy to backend (`/api` → `http://localhost:3000`)

### 3. tailwind.config.js
- Custom color palette (primary, success, warning, danger)
- Custom font families (Inter, Fira Code)
- Content paths for Tailwind scanning

### 4. postcss.config.js
- Tailwind CSS plugin
- Autoprefixer plugin

## Key Features Implemented

### 1. Authentication System
**File:** `src/stores/auth.js`, `src/views/LoginView.vue`

- Pinia store for authentication state
- JWT token management with localStorage
- IBM i user profile login
- Session validation
- Role-based access control (Admin/User)
- Automatic token injection in API requests
- Redirect to login on 401 errors

### 2. Routing & Navigation
**File:** `src/router/index.js`, `src/views/LayoutView.vue`

- Protected routes with authentication guard
- Admin-only routes
- Nested routes for main layout
- Dynamic route parameters
- 404 handling
- Sidebar navigation with active state
- User profile display with logout

### 3. API Integration
**File:** `src/utils/api.js`

- Centralized Axios instance
- Request interceptor for auth tokens
- Response interceptor for error handling
- Organized API endpoints by feature:
  - Authentication (login, logout, session)
  - Users (CRUD operations)
  - Plan Cache (query, preview)
  - Query Sets (CRUD, refresh)
  - Queries (CRUD, reorder)
  - Test Runs (CRUD, execute, results)
  - Comparisons (CRUD, analysis)

### 4. Utility Functions
**File:** `src/utils/formatters.js`

- Date formatting (absolute and relative)
- Duration formatting (ms to human-readable)
- Number formatting with separators
- Byte size formatting
- Percentage formatting with color coding
- SQL query formatting
- Status badge styling
- User profile formatting

### 5. Styling System
**File:** `src/assets/main.css`

Custom Tailwind components:
- Buttons (primary, secondary, success, danger, sizes)
- Inputs with error states
- Cards with headers
- Badges (status, metrics level)
- Tables with hover effects
- Alerts (success, warning, danger, info)
- Spinners for loading states
- Modals with overlays

### 6. Views Implemented

#### Fully Implemented:
1. **LoginView** - Complete login form with validation
2. **LayoutView** - Main layout with sidebar navigation
3. **DashboardView** - Statistics cards and quick actions
4. **QuerySetsView** - List view with refresh and delete actions
5. **NotFoundView** - 404 error page

#### Placeholder Views (Structure Only):
6. **QuerySetDetailView** - Query set details
7. **QuerySetCreateView** - Create/import query sets
8. **TestRunsView** - Test runs list
9. **TestRunDetailView** - Test run details and results
10. **ComparisonsView** - Comparisons list
11. **ComparisonDetailView** - Comparison analysis
12. **UsersView** - User management (admin only)

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

### Steps

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open browser to `http://localhost:5173`

5. **Login with IBM i credentials:**
   - User Profile: Your IBM i user profile (max 10 chars)
   - Password: Your IBM i password

## Development Workflow

### Adding a New View

1. Create Vue component in `src/views/`
2. Add route in `src/router/index.js`
3. Add navigation link in `src/views/LayoutView.vue` (if needed)
4. Create API functions in `src/utils/api.js` (if needed)
5. Create Pinia store in `src/stores/` (if needed)

### Adding a New Component

1. Create Vue component in `src/components/`
2. Use Composition API with `<script setup>`
3. Follow naming convention: PascalCase
4. Make it reusable and props-driven

### Styling Guidelines

1. Use Tailwind utility classes
2. Use custom component classes from `main.css`
3. Avoid inline styles
4. Use responsive design utilities
5. Follow color palette from `tailwind.config.js`

## API Communication

### Request Flow
1. Component calls API function from `src/utils/api.js`
2. Axios interceptor adds JWT token to headers
3. Request sent to backend via proxy
4. Response returned to component
5. Error interceptor handles 401 (redirect to login)

### Example Usage
```javascript
import { querySetsAPI } from '@/utils/api'

// Get all query sets
const response = await querySetsAPI.getAll()
const querySets = response.data.querySets

// Create query set
await querySetsAPI.createFromPlanCache({
  setName: 'My Query Set',
  userProfile: 'MYUSER',
  // ... other params
})
```

## State Management

### Auth Store
**File:** `src/stores/auth.js`

State:
- `user` - Current user object
- `token` - JWT authentication token
- `loading` - Loading state
- `error` - Error message

Getters:
- `isAuthenticated` - Boolean
- `isAdmin` - Boolean
- `userProfile` - User profile name

Actions:
- `login(credentials)` - Authenticate user
- `logout()` - Clear session
- `checkSession()` - Validate token
- `clearError()` - Clear error message

## Remaining Work

### High Priority (Core Functionality)
1. **Query Set Creation** - Plan cache preview and import
2. **Query Set Details** - View and manage queries
3. **Test Run Execution** - Configure and run tests
4. **Test Run Results** - View execution results
5. **Comparison Analysis** - Compare test runs

### Medium Priority (Enhanced Features)
6. **Real-time Updates** - WebSocket integration
7. **Data Visualization** - Charts for metrics
8. **Report Export** - HTML report generation

### Low Priority (Admin Features)
9. **User Management** - Add/remove users
10. **Advanced Filtering** - Search and filter
11. **Bulk Operations** - Multi-select actions

## Build for Production

```bash
# Build optimized production bundle
npm run build

# Output will be in dist/ directory
# Serve with any static file server
```

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Considerations

1. **Code Splitting** - Routes are lazy-loaded
2. **Tree Shaking** - Unused code eliminated
3. **Asset Optimization** - Images and fonts optimized
4. **Caching** - Proper cache headers for static assets
5. **Bundle Size** - Monitored and optimized

## Security Features

1. **JWT Authentication** - Secure token-based auth
2. **Route Guards** - Protected routes
3. **CSRF Protection** - Via backend
4. **XSS Prevention** - Vue's built-in escaping
5. **Secure Storage** - Tokens in localStorage

## Testing Strategy (Future)

1. **Unit Tests** - Component logic
2. **Integration Tests** - API integration
3. **E2E Tests** - User workflows
4. **Visual Regression** - UI consistency

## Deployment

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
# Deploy dist/ directory to web server
```

### Environment Variables
Create `.env` file:
```env
VITE_API_BASE_URL=http://your-backend-url
```

## Troubleshooting

### Common Issues

1. **API calls fail with CORS errors**
   - Ensure backend CORS is configured
   - Check Vite proxy configuration

2. **Login fails**
   - Verify backend is running
   - Check IBM i credentials
   - Verify user exists in QRYRUN_USERS table

3. **Styles not loading**
   - Run `npm install` again
   - Clear browser cache
   - Check Tailwind configuration

4. **Routes not working**
   - Check router configuration
   - Verify view components exist
   - Check authentication guards

## Next Steps

1. Implement remaining view components
2. Add WebSocket support for real-time updates
3. Create reusable UI components
4. Add data visualization with Chart.js
5. Implement report export functionality
6. Add comprehensive error handling
7. Optimize performance
8. Add unit and E2E tests

## Resources

- [Vue 3 Documentation](https://vuejs.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS Documentation](https://tailwindcss.com/)
- [Pinia Documentation](https://pinia.vuejs.org/)
- [Vue Router Documentation](https://router.vuejs.org/)

## Summary

The frontend foundation is complete with:
- ✅ Project structure and configuration
- ✅ Authentication system
- ✅ Routing and navigation
- ✅ API integration layer
- ✅ State management
- ✅ Utility functions
- ✅ Styling system
- ✅ Core views (Login, Dashboard, Query Sets list)
- ✅ Placeholder views for remaining features

**Status:** 25 of 34 tasks complete (74%)
**Ready for:** Continued frontend development of remaining views and features