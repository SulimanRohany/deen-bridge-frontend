# Frontend Application

This is the frontend application for the Deen Bridge project built with Next.js.

## Environment Configuration

Create a `.env.local` file in the frontend directory with the following variables:

```bash
# API Configuration
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/
NEXT_PUBLIC_SFU_URL=ws://localhost:3001/ws

# Development/Production Environment
NEXT_PUBLIC_ENV=development

# Optional: Different environments
# NEXT_PUBLIC_API_BASE_URL_PRODUCTION=https://your-production-api.com/api/
# NEXT_PUBLIC_API_BASE_URL_STAGING=https://your-staging-api.com/api/
```

## API Configuration

The application uses a centralized API configuration system located in `lib/config.js` and `lib/api.js`.

### Configuration Structure

- **Base URL**: Configurable via environment variables
- **Endpoints**: All API endpoints are centralized in `config.js`
- **API Functions**: Organized by feature (blog, auth, course, etc.)

### Available API Modules

#### Authentication API (`authAPI`)
```javascript
import { authAPI } from '@/lib/api'

// Login
await authAPI.login({ email, password })

// Register
await authAPI.register(userData)

// Refresh token
await authAPI.refresh(refreshToken)

// Get current user
await authAPI.getCurrentUser()

// Set password
await authAPI.setPassword(userId, passwordData)
```

#### Blog API (`blogAPI`)
```javascript
import { blogAPI } from '@/lib/api'

// Get posts
await blogAPI.getPosts({ tag, limit, offset })

// Get post by slug
await blogAPI.getPostBySlug(slug)

// Get post by ID
await blogAPI.getPostById(id)

// Create post
await blogAPI.createPost(postData)

// Update post
await blogAPI.updatePost(id, postData)

// Delete post
await blogAPI.deletePost(id)

// Comments
await blogAPI.createComment(commentData)
await blogAPI.getComments(postId)
await blogAPI.updateComment(commentId, commentData)
await blogAPI.deleteComment(commentId)
```

#### Course API (`courseAPI`)
```javascript
import { courseAPI } from '@/lib/api'

// Courses
await courseAPI.getCourses({ params })
await courseAPI.getCourseById(id)
await courseAPI.createCourse(courseData)
await courseAPI.updateCourse(id, courseData)
await courseAPI.deleteCourse(id)

// Timetables
await courseAPI.getTimetables({ params })
await courseAPI.createTimetable(timetableData)
await courseAPI.updateTimetable(id, timetableData)
await courseAPI.deleteTimetable(id)

// Live Sessions
await courseAPI.getLiveSessions({ params })
await courseAPI.createLiveSession(sessionData)
await courseAPI.updateLiveSession(id, sessionData)
await courseAPI.deleteLiveSession(id)

// Attendance
await courseAPI.getAttendance({ params })
await courseAPI.createAttendance(attendanceData)
await courseAPI.updateAttendance(id, attendanceData)
await courseAPI.deleteAttendance(id)

// Certificates
await courseAPI.getCertificates({ params })
```

#### Other APIs
- `enrollmentAPI` - Enrollment management
- `subjectAPI` - Subject management
- `userAPI` - User management
- `dashboardAPI` - Dashboard data
- `reportAPI` - Report management

### Features

- **Automatic Token Refresh**: Handles JWT token refresh automatically
- **Request Interceptors**: Adds authentication headers to requests
- **Error Handling**: Centralized error handling and logging
- **Environment-based Configuration**: Different configurations for development/production

## Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```

3. Update the API base URL in `.env.local` if needed

4. Run the development server:
   ```bash
   npm run dev
   ```

## Usage

All API calls should use the centralized API functions from `@/lib/api` instead of direct axios calls. This ensures:

- Consistent error handling
- Automatic authentication
- Centralized endpoint management
- Easy environment switching

### Example Migration

**Before:**
```javascript
import axios from 'axios'

const response = await axios.get('http://127.0.0.1:8000/api/course/')
```

**After:**
```javascript
import { courseAPI } from '@/lib/api'

const response = await courseAPI.getCourses()
```