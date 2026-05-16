# CivilAI Frontend

React-based frontend application for the CivilAI platform.

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Zustand** - State management
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **React Dropzone** - File uploads

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Layout.jsx       # Main layout wrapper
│   │   │   ├── Header.jsx       # Top navigation bar
│   │   │   └── Sidebar.jsx      # Side navigation menu
│   │   └── ui/
│   │       ├── Button.jsx       # Reusable button component
│   │       ├── Card.jsx         # Card container components
│   │       ├── Input.jsx        # Form input component
│   │       └── FileUpload.jsx   # Drag & drop file upload
│   ├── pages/
│   │   ├── auth/
│   │   │   ├── LoginPage.jsx    # Login page
│   │   │   └── RegisterPage.jsx # Registration page
│   │   ├── modules/
│   │   │   ├── GeotechPage.jsx      # Geotech analysis module
│   │   │   ├── BOQPage.jsx          # BOQ generation module
│   │   │   ├── StructuralPage.jsx   # Structural analysis module
│   │   │   ├── ISCodePage.jsx       # IS Code assistant module
│   │   │   ├── TenderPage.jsx       # Tender analysis module
│   │   │   └── SitePhotoPage.jsx    # Site photo analysis module
│   │   ├── DashboardPage.jsx    # Main dashboard
│   │   └── ProjectsPage.jsx     # Projects management
│   ├── lib/
│   │   └── api.js               # API client and endpoints
│   ├── store/
│   │   └── authStore.js         # Authentication state
│   ├── App.jsx                  # Main app component with routing
│   ├── main.jsx                 # App entry point
│   └── index.css                # Global styles
├── .env                         # Environment variables
├── index.html                   # HTML template
├── package.json                 # Dependencies
├── vite.config.js              # Vite configuration
└── tailwind.config.js          # Tailwind CSS configuration
```

## Features

### Authentication
- User registration with email verification
- Login with JWT token
- Password reset functionality
- Protected routes

### Dashboard
- Overview of projects and statistics
- Quick access to AI modules
- Recent activity feed

### Project Management
- Create and manage projects
- Upload and organize documents
- Project-specific document storage

### AI Modules

1. **Geotech Analysis**
   - Upload soil investigation reports (PDF)
   - Extract soil properties
   - Get foundation recommendations

2. **BOQ Generation**
   - Upload construction drawings
   - Automatic quantity extraction
   - Generate bill of quantities
   - Export BOQ data

3. **Structural Analysis**
   - Analyze structural drawings
   - Identify structural elements
   - Get design recommendations

4. **IS Code Assistant**
   - Search Indian Standard codes
   - Ask questions about code requirements
   - Get relevant code references

5. **Tender Analysis**
   - Upload tender documents
   - Extract key information
   - Identify potential risks
   - Get compliance recommendations

6. **Site Photo Analysis**
   - Upload construction site photos
   - AI-powered image analysis
   - Safety issue detection
   - Progress tracking

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Backend API running on port 8080
- AI Gateway running on port 8000

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure environment variables:
```bash
# Copy .env file and update if needed
cp .env .env.local
```

3. Start development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## API Integration

The frontend communicates with two backend services:

1. **Java Spring Boot Backend** (port 8080)
   - Authentication
   - Project management
   - Document storage
   - User management

2. **Python AI Gateway** (port 8000)
   - AI analysis endpoints
   - PDF processing
   - LLM interactions

API client is configured in `src/lib/api.js` with:
- Automatic JWT token injection
- Request/response interceptors
- Error handling
- Auth token refresh

## State Management

Using Zustand for lightweight state management:

- **authStore**: User authentication state (token, user info)
- Persisted to localStorage
- Automatic logout on 401 responses

## Routing

Protected routes require authentication:
- `/` - Dashboard (protected)
- `/projects` - Projects (protected)
- `/geotech` - Geotech Analysis (protected)
- `/boq` - BOQ Generation (protected)
- `/structural` - Structural Analysis (protected)
- `/iscode` - IS Code Assistant (protected)
- `/tender` - Tender Analysis (protected)
- `/site-photo` - Site Photo Analysis (protected)

Public routes:
- `/login` - Login page
- `/register` - Registration page

## Styling

Using Tailwind CSS with custom configuration:
- Custom color palette
- Responsive design
- Dark mode ready (not implemented yet)
- Custom component classes

## Development

### Code Style

- Use functional components with hooks
- Follow React best practices
- Use proper prop types
- Keep components small and focused
- Extract reusable logic to custom hooks

### File Naming

- Components: PascalCase (e.g., `Button.jsx`)
- Utilities: camelCase (e.g., `api.js`)
- Pages: PascalCase with Page suffix (e.g., `DashboardPage.jsx`)

### Component Structure

```jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ComponentName({ prop1, prop2 }) {
  // Hooks
  const [state, setState] = useState()
  const navigate = useNavigate()
  
  // Event handlers
  const handleClick = () => {
    // ...
  }
  
  // Render
  return (
    <div>
      {/* JSX */}
    </div>
  )
}
```

## Troubleshooting

### CORS Issues
If you encounter CORS errors, ensure the backend has proper CORS configuration for `http://localhost:5173`

### API Connection
Check that both backend services are running:
- Java backend: `http://localhost:8080`
- AI Gateway: `http://localhost:8000`

### Build Errors
Clear node_modules and reinstall:
```bash
rm -rf node_modules package-lock.json
npm install
```

## Future Enhancements

- [ ] Real-time notifications
- [ ] Dark mode support
- [ ] Advanced file preview
- [ ] Collaborative features
- [ ] Mobile responsive improvements
- [ ] Offline support with PWA
- [ ] Advanced analytics dashboard
- [ ] Export reports to PDF
- [ ] Multi-language support

## License

Proprietary - All rights reserved
