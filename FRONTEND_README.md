# Query Runner - Frontend Implementation

## Overview

The Query Runner frontend is a Next.js-based React application that provides a comprehensive UI for testing and comparing IBM i DB2 queries.

## Technology Stack

- **Framework**: Next.js 15.1.0 (React 19.2.0)
- **Styling**: Tailwind CSS 3.4.0
- **State Management**: React Context API (useAuth hook)
- **Authentication**: JWT tokens with localStorage
- **HTTP Client**: Fetch API
- **Type Safety**: TypeScript

## Project Structure

```
backend/src/
├── components/          # Reusable React components
│   ├── Layout.tsx      # Main layout with navigation
│   └── ProtectedRoute.tsx  # Authentication wrapper
├── hooks/              # Custom React hooks
│   └── useAuth.ts      # Authentication context and logic
├── pages/              # Next.js pages (routes)
│   ├── _app.tsx        # App wrapper with providers
│   ├── index.tsx       # Dashboard
│   ├── login.tsx       # Login page
│   ├── change-password.tsx  # Password change
│   ├── comparisons.tsx # Run comparisons
│   ├── query-sets/     # Query set management
│   │   ├── index.tsx   # List query sets
│   │   ├── new.tsx     # Create query set
│   │   ├── [id].tsx    # View/edit query set
│   │   └── [id]/
│   │       └── add-query.tsx  # Add query to set
│   ├── runs/           # Execution management
│   │   ├── index.tsx   # List runs
│   │   ├── execute.tsx # Execute query set
│   │   └── [id].tsx    # View run details
│   └── admin/          # Admin panel
│       └── index.tsx   # Credential management
├── styles/
│   └── globals.css     # Global styles and Tailwind
└── api/                # API routes (backend)
```

## Features Implemented

### 1. Authentication & Authorization ✅
- **Login Page** (`/login`)
  - Username/password authentication
  - JWT token storage in localStorage
  - Auto-redirect to password change if required
  - Error handling and validation

- **Password Change** (`/change-password`)
  - Forced password change for first login
  - Password validation (min 8 characters)
  - Confirmation field matching
  - Success feedback with auto-redirect

- **Protected Routes**
  - Automatic redirect to login if not authenticated
  - Admin-only routes with role checking
  - Loading states during authentication check

### 2. Dashboard (`/`) ✅
- **Statistics Cards**
  - Total query sets count
  - Total queries count
  - Total runs count
  - Visual icons and color coding

- **Quick Actions**
  - Create Query Set
  - View Query Sets
  - View Runs
  - Compare Runs

- **Recent Runs Table**
  - Last 5 runs displayed
  - Run name, status, execution time
  - Links to detailed views

### 3. Query Set Management ✅
- **List View** (`/query-sets`)
  - Grid display with cards
  - Query count per set
  - Credential information
  - Actions: View, Edit, Duplicate, Delete
  - Empty state with call-to-action

- **Create New** (`/query-sets/new`)
  - Name and description fields
  - Credential selection dropdown
  - Validation and error handling
  - Auto-redirect to detail view

- **Detail View** (`/query-sets/[id]`)
  - Query set information
  - List of all queries
  - SQL preview in code blocks
  - Edit and delete individual queries
  - Execute button

- **Add Query** (`/query-sets/[id]/add-query`)
  - Query name and description
  - SQL editor with monospace font
  - Optional QRO hash field
  - SQL tips and best practices

### 4. Query Execution ✅
- **Execute Form** (`/runs/execute`)
  - Run description (optional)
  - Iterations configuration (1-100)
  - Concurrent runs (1-10)
  - Concurrency limit warning (max 5)
  - Form validation

- **Runs List** (`/runs`)
  - Table view with all runs
  - Status badges (completed, failed, running)
  - Execution time display
  - Query set links
  - View details button

- **Run Details** (`/runs/[id]`)
  - Run metadata display
  - Query results table
  - Individual query execution times
  - Error messages for failures
  - Status indicators

### 5. Comparison Interface ✅
- **Run Selection** (`/comparisons`)
  - Dropdown for first run
  - Dropdown for second run (excludes selected first)
  - Percentage threshold configuration
  - Optional snapshot name
  - CSV export checkbox

- **Results Display**
  - Side-by-side comparison table
  - QRO hash matching
  - Average execution times
  - Percentage difference calculation
  - Color-coded improvements/degradations
  - Threshold highlighting
  - Legend for visual indicators

### 6. Admin Panel ✅
- **Credential Management** (`/admin`)
  - List all credentials
  - Add new credential form
  - Edit existing credentials
  - Delete with confirmation
  - View usage by query sets
  - Secure/insecure connection toggle
  - Host, port, database configuration

## UI Components

### Layout Component
- Top navigation bar with user info
- Active route highlighting
- Logout button
- Responsive design
- Footer with copyright

### Protected Route
- Authentication checking
- Loading spinner during check
- Auto-redirect to login
- Admin role enforcement
- Password change enforcement

### Form Components
- Consistent styling via CSS classes
- Input fields with labels
- Textarea for SQL/descriptions
- Select dropdowns
- Checkboxes with labels
- Button variants (primary, secondary, success, danger)

### Data Display
- Responsive tables
- Status badges
- Color-coded indicators
- Card layouts
- Empty states with CTAs
- Loading spinners

## Styling System

### Tailwind CSS Classes
All custom styles defined in `globals.css`:

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-success`, `.btn-danger`
- **Forms**: `.form-label`, `.form-input`, `.form-textarea`, `.form-select`, `.form-checkbox`
- **Alerts**: `.alert`, `.alert-success`, `.alert-error`, `.alert-warning`, `.alert-info`
- **Badges**: `.badge`, `.badge-success`, `.badge-error`, `.badge-warning`, `.badge-info`, `.badge-gray`
- **Tables**: `.data-table` with hover effects
- **Cards**: `.card` with shadow and padding
- **Modals**: `.modal-overlay`, `.modal-content`

### Color Scheme
- **Primary**: Blue (#3b82f6) - Main actions
- **Success**: Green - Positive states
- **Danger**: Red - Destructive actions
- **Warning**: Yellow - Cautions
- **Gray**: Neutral states

## Authentication Flow

1. User visits any protected route
2. `ProtectedRoute` checks for JWT token in localStorage
3. If no token → redirect to `/login`
4. Login page sends credentials to `/api/auth/login`
5. Backend returns JWT token and user data
6. Token stored in localStorage
7. If `passwordChangeRequired` → redirect to `/change-password`
8. Otherwise → redirect to dashboard

## API Integration

All API calls use:
- Fetch API with async/await
- JWT token from localStorage in Authorization header
- Error handling with try/catch
- Response status checking
- JSON parsing

Example:
```typescript
const token = localStorage.getItem('token');
const response = await fetch('/api/endpoint', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(data),
});

if (!response.ok) {
  const error = await response.json();
  throw new Error(error.error);
}

const result = await response.json();
```

## State Management

### useAuth Hook
Custom hook providing:
- `user`: Current user object or null
- `loading`: Authentication check in progress
- `login(username, password)`: Login function
- `logout()`: Logout function
- `changePassword(old, new)`: Password change
- `refreshUser()`: Re-fetch user data

Used across all protected pages for:
- Displaying user info
- Checking admin status
- Handling logout
- Managing password changes

## Responsive Design

- **Mobile First**: Tailwind mobile-first breakpoints
- **Breakpoints**:
  - `sm`: 640px
  - `md`: 768px
  - `lg`: 1024px
  - `xl`: 1280px

- **Grid Layouts**: Auto-adjust columns based on screen size
- **Navigation**: Hamburger menu on mobile (can be enhanced)
- **Tables**: Horizontal scroll on small screens

## Future Enhancements

### Phase 2 Features
1. **SQL Plan Cache Import**
   - Date range selection
   - User filter
   - QRO hash search
   - Referenced object filter
   - Bulk import functionality

2. **Advanced Query Editor**
   - Syntax highlighting (Monaco Editor or CodeMirror)
   - Auto-completion
   - SQL formatting
   - Query validation
   - Parameter support

3. **Enhanced Results Display**
   - Pagination for large result sets
   - Column sorting
   - Data filtering
   - Export to multiple formats (Excel, JSON)
   - Result visualization (charts)

4. **Real-time Execution Monitoring**
   - WebSocket integration
   - Live execution progress
   - Query-by-query status updates
   - Cancellation support

5. **User Management**
   - Admin panel for user CRUD
   - Role assignment
   - Audit log viewer
   - Activity tracking

6. **Snapshot Management**
   - List saved snapshots
   - Compare snapshots
   - Delete snapshots
   - Export snapshots

7. **Performance Dashboard**
   - Query performance trends
   - Execution time charts
   - Most/least efficient queries
   - Historical comparison

## Development

### Running Locally
```bash
cd backend
npm install
npm run dev
```

Starts:
- Next.js dev server on http://localhost:3000
- Express backend on http://localhost:3001

### Building for Production
```bash
npm run build
npm start
```

### Environment Variables
Required in `.env`:
```
PORT=3001
NODE_ENV=production
JWT_SECRET=your-secret-key
DATABASE_URL=postgresql://...
VAULT_ADDR=http://localhost:8200
VAULT_TOKEN=your-vault-token
JAVA_SERVICE_URL=http://localhost:8080
```

## Testing

### Manual Testing Checklist
- [ ] Login with correct credentials
- [ ] Login with incorrect credentials (error handling)
- [ ] Password change on first login
- [ ] Create query set
- [ ] Add queries to set
- [ ] Edit query set
- [ ] Delete query set
- [ ] Duplicate query set
- [ ] Execute query set
- [ ] View run results
- [ ] Compare two runs
- [ ] Export comparison to CSV
- [ ] Admin: Add credential
- [ ] Admin: Edit credential
- [ ] Admin: Delete credential
- [ ] Admin: View credential usage
- [ ] Logout

## Troubleshooting

### Token Expiration
- JWT tokens expire after 24 hours
- Users must re-login
- Token refresh not implemented (future enhancement)

### CORS Issues
- Ensure Express CORS middleware is configured
- Check `server.ts` for allowed origins

### API Errors
- Check browser console for error messages
- Verify JWT token is present in requests
- Confirm backend is running

### Styling Issues
- Run `npm run build` to regenerate Tailwind CSS
- Check `tailwind.config.js` content paths
- Verify `globals.css` is imported in `_app.tsx`

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Accessibility

- Semantic HTML elements
- ARIA labels where needed
- Keyboard navigation support
- Form validation messages
- Focus states on interactive elements

## Security Considerations

- JWT tokens in localStorage (consider httpOnly cookies for production)
- No sensitive data in URLs
- Password fields properly masked
- XSS protection via React's default escaping
- CSRF protection needed for production (tokens)

---

**Status**: ✅ Frontend Implementation Complete

All core features implemented and ready for testing!
