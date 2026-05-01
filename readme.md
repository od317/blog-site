# Blog App - Real-time Blog Platform

A modern, feature-rich blog platform with real-time capabilities, dark/light mode, and a cyberpunk/neon design theme.

## Overview

This is a full-stack blog application that allows users to create posts, engage with content through likes and comments, follow other users, and receive real-time notifications. The application features a modern design system with light/dark mode support and real-time WebSocket updates.

## Rendering Strategies

The application uses a hybrid rendering approach to optimize performance and user experience:

### Static Site Generation (SSG)

Pages pre-rendered at build time for maximum performance:

| Page | Strategy | Reason |
|------|----------|--------|
| Homepage | SSG with ISR | Pre-rendered feed, revalidates every 60 seconds |
| Post Details | SSG with ISR | Pre-renders popular posts, revalidates every 60 seconds |
| User Profile | Dynamic | Profile data changes frequently, no static generation |

### Incremental Static Regeneration (ISR)

Pages that revalidate at runtime:

| Page | Revalidation Time | Description |
|------|-------------------|-------------|
| Homepage | 60 seconds | Post feed updates without full rebuild |
| Post Page | 60 seconds | Comments and likes update without full rebuild |

### Server-Side Rendering (SSR)

Pages rendered on each request:

| Page | Strategy | Reason |
|------|----------|--------|
| Edit Post | Dynamic | Requires fresh data, needs authentication |
| Create Post | Dynamic | Always needs fresh form |
| Search Results | Dynamic | Search queries vary per user |

### Client-Side Rendering (CSR)

Components that render on client:

| Component | Strategy | Reason |
|-----------|----------|--------|
| Post List | CSR with infinite scroll | Dynamic loading of posts |
| Comments | CSR with real-time updates | WebSocket integration |
| Notifications | CSR with WebSocket | Real-time delivery |
| Like Button | CSR with optimistic updates | Instant feedback |

## Features

### Authentication & Security

- JWT-based authentication with access and refresh tokens
- HttpOnly cookies for secure token storage
- Email verification support
- Protected routes with server-side middleware
- Login and registration with validation
- Logout functionality

### Posts

- Create, read, update, and delete posts
- Featured image upload via Cloudinary
- Automatic reading time calculation
- Auto-generated post excerpts
- Infinite scroll pagination
- Multiple sorting options: latest, oldest, most liked, most commented
- Full-text search by title and content

### Comments

- Nested comment replies (threaded)
- Edit and delete comments
- Real-time comment updates via WebSocket
- Optimistic UI updates

### User Interactions

- Like and unlike posts
- Save and unsave posts
- Follow and unfollow users
- Real-time updates for all interactions

### Notifications

- Real-time notifications for:
  - Likes on user's posts
  - Comments on user's posts
  - Replies to user's comments
  - New followers
  - Saves on user's posts
- Grouped notifications by post
- Mark as read functionality
- Click notifications to navigate to content

### User Profiles

- View user profiles with statistics
- Edit profile information (bio, full name)
- Avatar upload via Cloudinary
- View user's posts
- Follower and following counts

### Media Uploads

- Post featured images
- Profile avatars
- Optional comment images
- Cloudinary integration for image storage and optimization

### Real-time Features

- Live comment updates
- Live like count updates
- Live notification delivery
- Active readers counter per post
- WebSocket rooms for posts and user profiles

### Search & Discovery

- Full-text search across post titles and content
- Search result pagination
- Relevance-based sorting

### Design System

- Cyberpunk/neon theme with cyan primary and magenta accent colors
- Light and dark mode with cookie-based persistence
- Zero-flicker theme switching
- Glass morphism effects
- Smooth animations

## Tech Stack

### Frontend

- Next.js 16 (React 19)
- TypeScript
- Tailwind CSS
- Zustand for state management
- Socket.IO client for real-time features
- React Hook Form with Zod validation
- Framer Motion for animations
- Lucide React for icons
- date-fns for date formatting

### Backend

- Node.js with Express
- PostgreSQL database
- Socket.IO for real-time communication
- JWT for authentication
- Cloudinary for image storage
- Nodemailer for email verification
- Multer for file uploads

### DevOps

- Docker and Docker Compose
- Render deployment ready
- Environment variables configuration

## Database Schema

- users - User accounts and profiles
- posts - Blog posts with images
- comments - Nested comments with replies
- likes - Post likes tracking
- follows - User follow relationships
- saved_posts - User saved posts
- notifications - Notification tracking

## Installation

### Prerequisites

- Node.js 18 or higher
- PostgreSQL database
- Docker and Docker Compose (optional)
- Cloudinary account for image uploads

### Environment Variables

Create a `.env` file in the backend directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_HOST=localhost
DB_PORT=5432
DB_NAME=your_db_name

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# Email
EMAIL_HOST=smtp.ethereal.email
EMAIL_PORT=587
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL
CLIENT_URL=http://localhost:3000
```

Create a `.env.local` file in the frontend directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### Running with Docker

```bash
# Clone the repository
git clone <your-repo-url>
cd blog-site

# Build and start containers
docker-compose up --build

# Initialize database tables
docker exec -it blog_backend npm run init-db
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Running without Docker

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| POST | /api/auth/refresh | Refresh access token |
| POST | /api/auth/logout | Logout user |
| GET | /api/auth/me | Get current user |

### Posts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts | Get all posts (with pagination and sorting) |
| GET | /api/posts/search | Search posts |
| GET | /api/posts/:id | Get single post |
| POST | /api/posts | Create post |
| PUT | /api/posts/:id | Update post |
| DELETE | /api/posts/:id | Delete post |

### Comments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/posts/:postId/comments | Get post comments |
| GET | /api/posts/:postId/comments/nested | Get nested comments |
| POST | /api/posts/:postId/comments | Add comment |
| PUT | /api/posts/comments/:id | Update comment |
| DELETE | /api/posts/comments/:id | Delete comment |

### Likes

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/likes/:postId/like | Like post |
| DELETE | /api/likes/:postId/like | Unlike post |
| GET | /api/likes/:postId/like | Get like status |

### Follows

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/profile/:userId/follow | Follow user |
| DELETE | /api/profile/:userId/follow | Unfollow user |

### Notifications

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/notifications | Get user notifications |
| GET | /api/notifications/unread-count | Get unread count |
| PUT | /api/notifications/posts/:postId/read | Mark as read |
| PUT | /api/notifications/read-all | Mark all as read |

### Profile

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/profile/:username | Get user profile |
| GET | /api/profile/:username/posts | Get user posts |
| PUT | /api/profile/update | Update profile |
| POST | /api/profile/avatar | Upload avatar |
| DELETE | /api/profile/avatar | Delete avatar |

## WebSocket Events

### Client to Server

| Event | Description |
|-------|-------------|
| authenticate | Authenticate socket connection |
| join-post | Join a post room |
| leave-post | Leave a post room |
| subscribe-feed | Subscribe to global feed |

### Server to Client

| Event | Description |
|-------|-------------|
| new-post | New post created |
| post-updated | Post updated |
| post-deleted | Post deleted |
| new-comment | New comment added |
| comment-updated | Comment updated |
| comment-deleted | Comment deleted |
| like-updated | Like count updated |
| new-notification | New notification |
| notification-removed | Notification removed |
| readers-count-updated | Active readers count |
| followers-updated | Followers count updated |

## Deployment

### Deploying to Render

1. Push your code to GitHub
2. Create a new Web Service on Render for the backend
3. Create a new Web Service on Render for the frontend
4. Create a PostgreSQL database on Render
5. Add all environment variables to each service
6. Deploy

Environment variables needed on Render:

Backend:
- NODE_ENV=production
- DATABASE_URL (provided by Render PostgreSQL)
- JWT_SECRET
- JWT_REFRESH_SECRET
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- CLIENT_URL (frontend URL)

Frontend:
- NODE_ENV=production
- NEXT_PUBLIC_API_URL (backend URL)
- NEXT_PUBLIC_SOCKET_URL (backend URL)

## Project Structure

```
blog-site/
├── backend/
│   ├── src/
│   │   ├── config/         # Database and Cloudinary config
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Auth and upload middleware
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Helper functions
│   │   └── index.js        # Entry point
│   ├── uploads/            # Temporary uploads
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (auth)/         # Login/register pages
│   │   ├── (profile)/      # Profile pages
│   │   ├── actions/        # Server actions
│   │   ├── api/            # API routes
│   │   ├── posts/          # Post pages
│   │   ├── search/         # Search page
│   │   └── saved/          # Saved posts page
│   ├── components/
│   │   ├── auth/           # Auth components
│   │   ├── comments/       # Comment components
│   │   ├── notification/   # Notification components
│   │   ├── post/           # Post components
│   │   ├── profile/        # Profile components
│   │   ├── search/         # Search components
│   │   └── ui/             # Reusable UI components
│   ├── lib/
│   │   ├── api/            # API client
│   │   ├── hooks/          # Custom React hooks
│   │   ├── server/         # Server-side utilities
│   │   ├── socket/         # WebSocket client
│   │   ├── store/          # Zustand stores
│   │   └── utils/          # Helper functions
│   ├── public/             # Static assets
│   ├── types/              # TypeScript types
│   ├── Dockerfile
│   └── package.json
└── docker-compose.yml
```

## Rendering Strategy Details

| Page/Component | Strategy | Revalidation | Description |
|----------------|----------|--------------|-------------|
| Homepage | ISR | 60 seconds | Pre-rendered feed with periodic updates |
| Post Page | ISR | 60 seconds | Pre-rendered posts with periodic updates |
| Profile Page | Dynamic | None | Always fresh, user-specific content |
| Edit Post | SSR | None | Requires authentication, fresh data |
| Create Post | SSR | None | Always needs fresh form |
| Search Results | SSR | None | Query-based, cannot pre-render |
| Login/Register | Static | None | No dynamic content |
| Saved Posts | Dynamic | None | User-specific content |
| Post List (CSR) | Client | N/A | Infinite scroll, real-time updates |
| Comments | Client | N/A | Real-time WebSocket updates |
| Notifications | Client | N/A | Real-time delivery |

## Key Features Implemented

- Full authentication system with JWT and refresh tokens
- CRUD operations for posts, comments, likes, and saves
- Real-time WebSocket updates for all interactions
- Notification system with grouping and real-time delivery
- Follow system with real-time updates
- Image uploads with Cloudinary
- Search and sorting functionality
- Light/dark mode with persistence
- Responsive design
- Infinite scroll pagination
- Optimistic UI updates
- Server-side rendering with Next.js
- Docker containerization
- Production-ready deployment on Render