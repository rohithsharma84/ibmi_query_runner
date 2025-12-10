# IBM i Query Runner - Frontend

Vue.js 3 frontend application for the IBM i Query Runner tool.

## Technology Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next generation frontend tooling
- **Vue Router** - Official router for Vue.js
- **Pinia** - State management
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client
- **Chart.js** - Data visualization
- **Socket.io Client** - Real-time communication

## Prerequisites

- Node.js 18+ and npm
- Backend API running on `http://localhost:3000`

## Installation

```bash
# Install dependencies
npm install
```

## Development

```bash
# Start development server
npm run dev

# The application will be available at http://localhost:5173
```

## Build for Production

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
frontend/
├── public/              # Static assets
├── src/
│   ├── assets/         # CSS, images, fonts
│   ├── components/     # Reusable Vue components
│   ├── views/          # Page components
│   ├── router/         # Vue Router configuration
│   ├── stores/         # Pinia stores
│   ├── utils/          # Utility functions
│   ├── App.vue         # Root component
│   └── main.js         # Application entry point
├── index.html          # HTML template
├── vite.config.js      # Vite configuration
├── tailwind.config.js  # Tailwind CSS configuration
└── package.json        # Dependencies and scripts
```

## Features

### Authentication
- IBM i user profile login
- JWT token-based authentication
- Role-based access control (Admin/User)

### Query Set Management
- Create query sets from SQL plan cache
- Manual query set creation
- Refresh query sets
- View and edit queries

### Test Runs
- Execute query sets with configurable iterations
- Three metrics collection levels (BASIC, STANDARD, COMPREHENSIVE)
- Real-time execution monitoring
- View detailed results

### Comparisons
- Compare test run results
- Identify performance deviations
- Configurable deviation thresholds
- Export reports

### User Management (Admin Only)
- Add/remove users
- Manage access permissions

## API Integration

The frontend communicates with the backend API at `/api/*`. The Vite dev server proxies these requests to `http://localhost:3000`.

## Environment Variables

Create a `.env` file in the frontend directory:

```env
VITE_API_BASE_URL=http://localhost:3000
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development Guidelines

### Code Style
- Use Vue 3 Composition API
- Follow Vue.js style guide
- Use Tailwind CSS utility classes
- Keep components small and focused

### State Management
- Use Pinia for global state
- Keep component-local state when possible
- Use composables for shared logic

### API Calls
- Use the centralized API utility (`src/utils/api.js`)
- Handle errors gracefully
- Show loading states

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

See LICENSE file in the root directory.