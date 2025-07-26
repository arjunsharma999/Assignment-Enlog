# E-commerce Project Setup Instructions

This project consists of a Django backend API and a React frontend application.

## Prerequisites

Before running this project, make sure you have the following installed:

### Backend Requirements:
- Python 3.8 or higher
- pip (Python package installer)
- Redis (for Django Channels WebSocket support)

### Frontend Requirements:
- Node.js 16 or higher
- npm (Node package manager)

## Backend Setup (Django)

### 1. Install Python Dependencies

Navigate to the project root directory and install the required Python packages:

```bash
# Install Django and other dependencies
pip install django
pip install djangorestframework
pip install djangorestframework-simplejwt
pip install django-cors-headers
pip install channels
pip install channels-redis
```

### 2. Database Setup

Run the following commands to set up the database:

```bash
# Apply database migrations
python manage.py makemigrations
python manage.py migrate

# Create a superuser (admin account)
python manage.py createsuperuser
```

### 3. Start Redis Server

The project uses Redis for WebSocket support. Start Redis server:

**Windows:**
```bash
# Download and install Redis for Windows, then start the server
redis-server
```

**macOS/Linux:**
```bash
# Install Redis if not already installed
# macOS: brew install redis
# Ubuntu: sudo apt-get install redis-server

# Start Redis server
redis-server
```

### 4. Run the Django Development Server

```bash
# Start the Django development server
python manage.py runserver
```

The backend API will be available at: http://127.0.0.1:8000/

## Frontend Setup (React)

### 1. Install Node.js Dependencies

Navigate to the frontend directory and install dependencies:

```bash
cd frontend
npm install
```

### 2. Run the React Development Server

```bash
# Start the development server
npm run dev
```

The frontend application will be available at: http://localhost:5173/

## Project Structure

```
Assignment/
├── ecommerce/          # Django project settings
├── shop/              # Django app (models, views, URLs)
├── frontend/          # React application
├── manage.py          # Django management script
└── db.sqlite3         # SQLite database
```

## Available Scripts

### Backend (Django):
- `python manage.py runserver` - Start development server
- `python manage.py makemigrations` - Create database migrations
- `python manage.py migrate` - Apply database migrations
- `python manage.py createsuperuser` - Create admin user
- `python manage.py collectstatic` - Collect static files (for production)

### Frontend (React):
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## API Endpoints

The Django backend provides REST API endpoints for:
- User authentication (login, register)
- Product management
- Order management
- Cart functionality
- WebSocket connections for real-time features

## Configuration

### Backend Configuration:
- Database: SQLite (default)
- Authentication: JWT tokens
- CORS: Enabled for all origins (development)
- WebSocket: Redis backend

### Frontend Configuration:
- Framework: React with TypeScript
- Build tool: Vite
- Styling: CSS
- HTTP client: Axios

## Troubleshooting

### Common Issues:

1. **Redis Connection Error:**
   - Make sure Redis server is running
   - Check if Redis is installed correctly

2. **Port Already in Use:**
   - Django: Change port with `python manage.py runserver 8001`
   - React: Change port in vite.config.ts or use `npm run dev -- --port 3001`

3. **Database Migration Issues:**
   - Delete db.sqlite3 and run migrations again
   - Check for conflicting migrations

4. **Node Modules Issues:**
   - Delete node_modules folder and package-lock.json
   - Run `npm install` again

## Development Workflow

1. Start Redis server
2. Start Django backend: `python manage.py runserver`
3. Start React frontend: `cd frontend && npm run dev`
4. Access the application at http://localhost:5173/

## Production Deployment

For production deployment:
1. Set DEBUG = False in Django settings
2. Configure proper database (PostgreSQL recommended)
3. Set up proper CORS settings
4. Use environment variables for sensitive data
5. Build frontend: `npm run build`
6. Configure web server (nginx, Apache)
7. Set up SSL certificates

## Support

If you encounter any issues:
1. Check the console for error messages
2. Verify all dependencies are installed
3. Ensure Redis server is running
4. Check if ports are available
5. Review Django and React documentation 