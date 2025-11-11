// Environment configuration for the frontend
export const config = {
  // API Configuration
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/api/',
  WS_BASE_URL: process.env.NEXT_PUBLIC_WS_BASE_URL || 'ws://127.0.0.1:8000',
  SFU_URL: process.env.NEXT_PUBLIC_SFU_URL || 'ws://127.0.0.1:3001/ws',
  
  // Environment
  ENV: process.env.NEXT_PUBLIC_ENV || 'development',
  
  // API Endpoints
  ENDPOINTS: {
    // Auth endpoints
    AUTH: {
      LOGIN: 'auth/token/',
      REFRESH: 'auth/token/refresh/',
      REGISTER: 'auth/student/register/',
      USER: 'auth/user/',
      SET_PASSWORD: 'auth/user/{id}/set_password/',
    },
    
    // Blog endpoints
    BLOG: {
      POSTS: 'blog/post/',
      POST_BY_SLUG: 'blog/post/slug/{slug}/',
      POST_BY_ID: 'blog/post/{id}/',
      COMMENTS: 'blog/comment/',
      COMMENT_BY_ID: 'blog/comment/{id}/',
    },
    
    // Course endpoints (now represents Classes with integrated timing)
    COURSE: {
      LIST: 'course/',
      BY_ID: 'course/{id}/',
      LIVE_SESSION: 'course/live_session/',
      ATTENDANCE: 'course/attendance/',
      CERTIFICATE: 'course/certificate/',
    },
    
    // Subject endpoints
    SUBJECT: {
      LIST: 'subject/',
      BY_ID: 'subject/{id}/',
    },
    
    // Enrollment endpoints
    ENROLLMENT: {
      LIST: 'enrollment/',
      BY_ID: 'enrollment/{id}/',
    },
    
    // Dashboard endpoints
    DASHBOARD: {
      REPORT: 'dashboard/report/',
    },
    
    // User management endpoints
    USER: {
      LIST: 'auth/user/',
      BY_ID: 'auth/user/{id}/',
      REGISTRATION: 'auth/registration/',
    },
    
    // Report endpoints
    REPORT: {
      LIST: 'report/',
      BY_ID: 'report/{id}/',
    },
    
    // Library endpoints
    LIBRARY: {
      CATEGORIES: 'library/category/',
      CATEGORY_BY_ID: 'library/category/{id}/',
      RESOURCES: 'library/resource/',
      RESOURCE_BY_ID: 'library/resource/{id}/',
      RATINGS: 'library/rating/',
      RATING_BY_ID: 'library/rating/{id}/',
      BOOKMARKS: 'library/bookmark/',
    },
    
    // Profile endpoints
    PROFILE: {
      STUDENT: 'profile/student/',
      STUDENT_BY_ID: 'profile/student/{id}/',
      TEACHER: 'profile/teacher/',
      TEACHER_BY_ID: 'profile/teacher/{id}/',
      STAFF: 'profile/staff/',
      STAFF_BY_ID: 'profile/staff/{id}/',
      SUPER_ADMIN: 'profile/superadmin/',
      SUPER_ADMIN_BY_ID: 'profile/superadmin/{id}/',
      PARENT: 'profile/parent/',
      PARENT_BY_ID: 'profile/parent/{id}/',
    },
    
    // Contact endpoints (use direct aliases under /api/contact/)
    CONTACT: {
      CREATE: 'contact/',
      LIST: 'contact/list/',
      DETAIL: 'contact/{id}/',
      STATS: 'contact/stats/',
    },
  }
};

// Helper function to replace URL parameters
export const buildEndpoint = (endpoint, params = {}) => {
  let url = endpoint;
  Object.keys(params).forEach(key => {
    url = url.replace(`{${key}}`, params[key]);
  });
  return url;
};

// Helper function to get full API URL
export const getApiUrl = (endpoint, params = {}) => {
  const builtEndpoint = buildEndpoint(endpoint, params);
  return `${config.API_BASE_URL}${builtEndpoint}`;
};
