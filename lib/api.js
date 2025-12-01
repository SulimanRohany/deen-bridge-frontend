import axios from 'axios';
import { config, buildEndpoint } from './config';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 300000, // 5 minutes timeout (for large file uploads)
});

// Log API configuration in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
}

// Add request interceptor to set Authorization header dynamically
api.interceptors.request.use((config) => {
  // Log request in development
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  }
  
  if (typeof window !== 'undefined') {
    const authTokens = localStorage.getItem('authTokens');
    if (authTokens) {
      try {
        const tokens = JSON.parse(authTokens);
        if (tokens.access) {
          config.headers.Authorization = `Bearer ${tokens.access}`;
        }
      } catch (error) {
      }
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Track retry attempts to prevent infinite loops
const retryAttempts = new Map();
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_RESET_TIME = 60000; // Reset retry count after 1 minute

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Only log errors that are unexpected (not 401, 403, or 404)
    // Those are handled gracefully by the application
    const status = error.response?.status;
    if (status && ![401, 403, 404].includes(status)) {
    }
    
    // Handle 401/403 errors (token expired or invalid)
    if ((status === 401 || status === 403) && !originalRequest._retry) {
      // Check retry attempts for this URL
      const requestKey = `${originalRequest.method}:${originalRequest.url}`;
      const now = Date.now();
      const retryInfo = retryAttempts.get(requestKey);
      
      // Reset retry count if enough time has passed
      if (retryInfo && (now - retryInfo.timestamp) > RETRY_RESET_TIME) {
        retryAttempts.delete(requestKey);
      }
      
      // Check if we've exceeded max retry attempts
      const currentRetries = retryInfo ? retryInfo.count : 0;
      if (currentRetries >= MAX_RETRY_ATTEMPTS) {
        retryAttempts.delete(requestKey);
        
        // Clear invalid tokens but don't redirect - let user stay on current page
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authTokens');
        }
        return Promise.reject(error);
      }
      
      originalRequest._retry = true;
      
      // Update retry count
      retryAttempts.set(requestKey, {
        count: currentRetries + 1,
        timestamp: now
      });
      
      try {
        // Get refresh token from localStorage
        const authTokens = localStorage.getItem('authTokens');
        if (authTokens) {
          const tokens = JSON.parse(authTokens);
          
          if (tokens.refresh) {
            // Attempt to refresh the token silently
            const refreshResponse = await axios.post(`${config.API_BASE_URL}${config.ENDPOINTS.AUTH.REFRESH}`, {
              refresh: tokens.refresh
            });
            
            if (refreshResponse.status === 200) {
              // Update tokens in localStorage
              const newTokens = {
                access: refreshResponse.data.access,
                refresh: refreshResponse.data.refresh
              };
              localStorage.setItem('authTokens', JSON.stringify(newTokens));
              
              // Update the original request with new token
              originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
              
              // Reset retry count on successful refresh
              retryAttempts.delete(requestKey);
              
              // Retry the original request
              return api(originalRequest);
            }
          }
        }
      } catch (refreshError) {
        // Clear retry attempts
        retryAttempts.delete(requestKey);
        
        // Clear invalid tokens but don't redirect - let user stay on current page
        if (typeof window !== 'undefined') {
          localStorage.removeItem('authTokens');
        }
      }
    }
    
    return Promise.reject(error);
  }
);

// Blog API functions
export const blogAPI = {
  // Get post by slug
  getPostBySlug: (slug) => api.get(buildEndpoint(config.ENDPOINTS.BLOG.POST_BY_SLUG, { slug })),
  
  // Get related posts for a post by slug
  getRelatedPosts: (slug) => api.get(buildEndpoint(config.ENDPOINTS.BLOG.POST_RELATED, { slug })),
  
  // Get posts with filters
  getPosts: (params = {}) => api.get(config.ENDPOINTS.BLOG.POSTS, { params }),
  
  // Get post by ID
  getPostById: (id) => api.get(buildEndpoint(config.ENDPOINTS.BLOG.POST_BY_ID, { id })),
  
  // Create post
  createPost: (postData) => api.post(config.ENDPOINTS.BLOG.POSTS, postData),
  
  // Update post
  updatePost: (id, postData) => api.put(buildEndpoint(config.ENDPOINTS.BLOG.POST_BY_ID, { id }), postData),
  
  // Delete post
  deletePost: (id) => api.delete(buildEndpoint(config.ENDPOINTS.BLOG.POST_BY_ID, { id })),
  
  // Create comment
  createComment: (commentData) => api.post(config.ENDPOINTS.BLOG.COMMENTS, commentData),
  
  // Get comments for a post
  getComments: (postId) => api.get(config.ENDPOINTS.BLOG.COMMENTS, { params: { post: postId } }),
  
  // Update comment
  updateComment: (commentId, commentData) => api.patch(buildEndpoint(config.ENDPOINTS.BLOG.COMMENT_BY_ID, { id: commentId }), commentData),
  
  // Delete comment
  deleteComment: (commentId) => api.delete(buildEndpoint(config.ENDPOINTS.BLOG.COMMENT_BY_ID, { id: commentId })),
  
  // Toggle post like
  togglePostLike: (postId) => api.post(buildEndpoint(config.ENDPOINTS.BLOG.POST_LIKE, { id: postId })),
  
  // Toggle comment like
  toggleCommentLike: (commentId) => api.post(buildEndpoint(config.ENDPOINTS.BLOG.COMMENT_LIKE, { id: commentId })),
};

// Auth API functions
export const authAPI = {
  login: (credentials) => api.post(config.ENDPOINTS.AUTH.LOGIN, credentials),
  refresh: (refreshToken) => api.post(config.ENDPOINTS.AUTH.REFRESH, { refresh: refreshToken }),
  register: (userData) => api.post(config.ENDPOINTS.AUTH.REGISTER, userData),
  getCurrentUser: () => api.get(config.ENDPOINTS.AUTH.USER),
  setPassword: (userId, passwordData) => api.post(buildEndpoint(config.ENDPOINTS.AUTH.SET_PASSWORD, { id: userId }), passwordData),
  requestPasswordReset: (email) => api.post(config.ENDPOINTS.AUTH.PASSWORD_RESET_REQUEST, { email }),
  confirmPasswordReset: (data) => api.post(config.ENDPOINTS.AUTH.PASSWORD_RESET_CONFIRM, data),
  verifyEmail: (token) => api.post(config.ENDPOINTS.AUTH.VERIFY_EMAIL, { token }),
  resendVerification: (email) => api.post(config.ENDPOINTS.AUTH.RESEND_VERIFICATION, { email }),
};

// Course API functions
// NOTE: "Course" endpoints now represent "Classes" with integrated timing information
// Timetable functionality has been merged into the Class model
export const courseAPI = {
  // Get all classes (formerly courses with separate timetables)
  getCourses: (params = {}) => api.get(config.ENDPOINTS.COURSE.LIST, { params }),
  
  // Get class by ID
  getCourseById: (id) => api.get(buildEndpoint(config.ENDPOINTS.COURSE.BY_ID, { id })),
  
  // Create class (now includes timing fields: days_of_week, start_time, end_time, timezone, is_active)
  createCourse: (courseData) => api.post(config.ENDPOINTS.COURSE.LIST, courseData),
  
  // Update class (includes timing fields)
  updateCourse: (id, courseData) => api.put(buildEndpoint(config.ENDPOINTS.COURSE.BY_ID, { id }), courseData),
  
  // Delete class
  deleteCourse: (id) => api.delete(buildEndpoint(config.ENDPOINTS.COURSE.BY_ID, { id })),
  
  // Live session operations (now reference class_session instead of timetable)
  getLiveSessions: (params = {}) => api.get(config.ENDPOINTS.COURSE.LIVE_SESSION, { params }),
  createLiveSession: (sessionData) => api.post(config.ENDPOINTS.COURSE.LIVE_SESSION, sessionData),
  updateLiveSession: (id, sessionData) => api.put(buildEndpoint(config.ENDPOINTS.COURSE.LIVE_SESSION + '{id}/', { id }), sessionData),
  deleteLiveSession: (id) => api.delete(buildEndpoint(config.ENDPOINTS.COURSE.LIVE_SESSION + '{id}/', { id })),
  
  // Attendance operations (now reference class_enrollment instead of course_enrollment)
  getAttendance: (params = {}) => api.get(config.ENDPOINTS.COURSE.ATTENDANCE, { params }),
  createAttendance: (attendanceData) => api.post(config.ENDPOINTS.COURSE.ATTENDANCE, attendanceData),
  updateAttendance: (id, attendanceData) => api.put(buildEndpoint(config.ENDPOINTS.COURSE.ATTENDANCE + '{id}/', { id }), attendanceData),
  deleteAttendance: (id) => api.delete(buildEndpoint(config.ENDPOINTS.COURSE.ATTENDANCE + '{id}/', { id })),
  
  // Certificate operations (now reference class_completed instead of course)
  getCertificates: (params = {}) => api.get(config.ENDPOINTS.COURSE.CERTIFICATE, { params }),
};

// Subject API functions
export const subjectAPI = {
  getSubjects: (params = {}) => api.get(config.ENDPOINTS.SUBJECT.LIST, { params }),
  getSubjectById: (id) => api.get(buildEndpoint(config.ENDPOINTS.SUBJECT.BY_ID, { id })),
  createSubject: (subjectData) => api.post(config.ENDPOINTS.SUBJECT.LIST, subjectData),
  updateSubject: (id, subjectData) => api.put(buildEndpoint(config.ENDPOINTS.SUBJECT.BY_ID, { id }), subjectData),
  deleteSubject: (id) => api.delete(buildEndpoint(config.ENDPOINTS.SUBJECT.BY_ID, { id })),
};

// Enrollment API functions
export const enrollmentAPI = {
  getEnrollments: (params = {}) => api.get(config.ENDPOINTS.ENROLLMENT.LIST, { params }),
  getEnrollmentById: (id) => api.get(buildEndpoint(config.ENDPOINTS.ENROLLMENT.BY_ID, { id })),
  createEnrollment: (enrollmentData) => api.post(config.ENDPOINTS.ENROLLMENT.LIST, enrollmentData),
  updateEnrollment: (id, enrollmentData) => api.put(buildEndpoint(config.ENDPOINTS.ENROLLMENT.BY_ID, { id }), enrollmentData),
  deleteEnrollment: (id) => api.delete(buildEndpoint(config.ENDPOINTS.ENROLLMENT.BY_ID, { id })),
};

// User API functions
export const userAPI = {
  getUsers: (params = {}) => api.get(config.ENDPOINTS.USER.LIST, { params }),
  getUserById: (id) => api.get(buildEndpoint(config.ENDPOINTS.USER.BY_ID, { id })),
  createUser: (userData) => api.post(config.ENDPOINTS.USER.REGISTRATION, userData),
  updateUser: (id, userData) => api.put(buildEndpoint(config.ENDPOINTS.USER.BY_ID, { id }), userData),
  deleteUser: (id) => api.delete(buildEndpoint(config.ENDPOINTS.USER.BY_ID, { id })),
  setUserPassword: (id, passwordData) => api.post(buildEndpoint(config.ENDPOINTS.AUTH.SET_PASSWORD, { id }), passwordData),
  createParentAccount: (parentAccountData) => api.post(config.ENDPOINTS.USER.CREATE_PARENT_ACCOUNT, parentAccountData),
};

// Dashboard API functions
export const dashboardAPI = {
  getReports: (params = {}) => api.get(config.ENDPOINTS.DASHBOARD.REPORT, { params }),
  getTeacherDashboard: (params = {}) => api.get(config.ENDPOINTS.DASHBOARD.TEACHER, { params }),
  getParentDashboard: (params = {}) => api.get(config.ENDPOINTS.DASHBOARD.PARENT, { params }),
  getChildDetails: (childId, params = {}) => api.get(
    buildEndpoint(config.ENDPOINTS.DASHBOARD.PARENT_CHILD_DETAIL, { child_id: childId }), 
    { params }
  ),
};

// Report API functions
export const reportAPI = {
  getReports: (params = {}) => api.get(config.ENDPOINTS.REPORT.LIST, { params }),
  getReportById: (id) => api.get(buildEndpoint(config.ENDPOINTS.REPORT.BY_ID, { id })),
  createReport: (reportData) => api.post(config.ENDPOINTS.REPORT.LIST, reportData),
  updateReport: (id, reportData) => api.put(buildEndpoint(config.ENDPOINTS.REPORT.BY_ID, { id }), reportData),
  deleteReport: (id) => api.delete(buildEndpoint(config.ENDPOINTS.REPORT.BY_ID, { id })),
  updateReportStatus: (id, isResolved) => api.patch(buildEndpoint(config.ENDPOINTS.REPORT.BY_ID, { id }), { is_resolved: isResolved }),
};

// Library API functions
export const libraryAPI = {
  // Categories
  getCategories: (params = {}) => api.get(config.ENDPOINTS.LIBRARY.CATEGORIES, { params }),
  getCategoryById: (id) => api.get(buildEndpoint(config.ENDPOINTS.LIBRARY.CATEGORY_BY_ID, { id })),
  createCategory: (categoryData) => api.post(config.ENDPOINTS.LIBRARY.CATEGORIES, categoryData),
  updateCategory: (id, categoryData) => api.put(buildEndpoint(config.ENDPOINTS.LIBRARY.CATEGORY_BY_ID, { id }), categoryData),
  deleteCategory: (id) => api.delete(buildEndpoint(config.ENDPOINTS.LIBRARY.CATEGORY_BY_ID, { id })),
  
  // Resources
  getResources: (params = {}) => api.get(config.ENDPOINTS.LIBRARY.RESOURCES, { params }),
  getResourcesByUrl: (url) => api.get(url),  // For pagination next/previous URLs
  getResourceById: (id) => api.get(buildEndpoint(config.ENDPOINTS.LIBRARY.RESOURCE_BY_ID, { id })),
  createResource: (resourceData) => api.post(config.ENDPOINTS.LIBRARY.RESOURCES, resourceData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000 // 10 minutes for large file uploads
  }),
  updateResource: (id, resourceData) => api.patch(buildEndpoint(config.ENDPOINTS.LIBRARY.RESOURCE_BY_ID, { id }), resourceData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600000 // 10 minutes for large file uploads
  }),
  deleteResource: (id) => api.delete(buildEndpoint(config.ENDPOINTS.LIBRARY.RESOURCE_BY_ID, { id })),
  
  // Special resource endpoints
  getFeaturedResources: () => api.get(config.ENDPOINTS.LIBRARY.RESOURCES + 'featured/'),
  getPopularResources: () => api.get(config.ENDPOINTS.LIBRARY.RESOURCES + 'popular/'),
  getRecentResources: () => api.get(config.ENDPOINTS.LIBRARY.RESOURCES + 'recent/'),
  getTopRatedResources: () => api.get(config.ENDPOINTS.LIBRARY.RESOURCES + 'top_rated/'),
  getRelatedResources: (id) => api.get(buildEndpoint(config.ENDPOINTS.LIBRARY.RESOURCE_BY_ID, { id }) + 'related/'),
  downloadResource: (id) => api.post(buildEndpoint(config.ENDPOINTS.LIBRARY.RESOURCE_BY_ID, { id }) + 'download/'),
  
  // Ratings
  getRatings: (params = {}) => api.get(config.ENDPOINTS.LIBRARY.RATINGS, { params }),
  createRating: (ratingData) => api.post(config.ENDPOINTS.LIBRARY.RATINGS, ratingData),
  updateRating: (id, ratingData) => api.put(buildEndpoint(config.ENDPOINTS.LIBRARY.RATING_BY_ID, { id }), ratingData),
  deleteRating: (id) => api.delete(buildEndpoint(config.ENDPOINTS.LIBRARY.RATING_BY_ID, { id })),
  
  // Bookmarks
  getBookmarks: (params = {}) => api.get(config.ENDPOINTS.LIBRARY.BOOKMARKS, { params }),
  toggleBookmark: (resourceId) => api.post(config.ENDPOINTS.LIBRARY.BOOKMARKS + 'toggle/', { resource: resourceId }),
};

// Profile API functions
export const profileAPI = {
  // Student profile
  getStudentProfiles: (params = {}) => api.get(config.ENDPOINTS.PROFILE.STUDENT, { params }),
  getStudentProfileById: (id) => api.get(buildEndpoint(config.ENDPOINTS.PROFILE.STUDENT_BY_ID, { id })),
  createStudentProfile: (profileData) => api.post(config.ENDPOINTS.PROFILE.STUDENT, profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStudentProfile: (id, profileData) => api.patch(buildEndpoint(config.ENDPOINTS.PROFILE.STUDENT_BY_ID, { id }), profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Teacher profile
  getTeacherProfiles: (params = {}) => api.get(config.ENDPOINTS.PROFILE.TEACHER, { params }),
  getTeacherProfileById: (id) => api.get(buildEndpoint(config.ENDPOINTS.PROFILE.TEACHER_BY_ID, { id })),
  createTeacherProfile: (profileData) => api.post(config.ENDPOINTS.PROFILE.TEACHER, profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateTeacherProfile: (id, profileData) => api.patch(buildEndpoint(config.ENDPOINTS.PROFILE.TEACHER_BY_ID, { id }), profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Staff profile
  getStaffProfiles: (params = {}) => api.get(config.ENDPOINTS.PROFILE.STAFF, { params }),
  getStaffProfileById: (id) => api.get(buildEndpoint(config.ENDPOINTS.PROFILE.STAFF_BY_ID, { id })),
  createStaffProfile: (profileData) => api.post(config.ENDPOINTS.PROFILE.STAFF, profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateStaffProfile: (id, profileData) => api.patch(buildEndpoint(config.ENDPOINTS.PROFILE.STAFF_BY_ID, { id }), profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Super Admin profile
  getSuperAdminProfiles: (params = {}) => api.get(config.ENDPOINTS.PROFILE.SUPER_ADMIN, { params }),
  getSuperAdminProfileById: (id) => api.get(buildEndpoint(config.ENDPOINTS.PROFILE.SUPER_ADMIN_BY_ID, { id })),
  createSuperAdminProfile: (profileData) => api.post(config.ENDPOINTS.PROFILE.SUPER_ADMIN, profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateSuperAdminProfile: (id, profileData) => api.patch(buildEndpoint(config.ENDPOINTS.PROFILE.SUPER_ADMIN_BY_ID, { id }), profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  
  // Parent profile
  getParentProfiles: (params = {}) => api.get(config.ENDPOINTS.PROFILE.PARENT, { params }),
  getParentProfileById: (id) => api.get(buildEndpoint(config.ENDPOINTS.PROFILE.PARENT_BY_ID, { id })),
  createParentProfile: (profileData) => api.post(config.ENDPOINTS.PROFILE.PARENT, profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateParentProfile: (id, profileData) => api.patch(buildEndpoint(config.ENDPOINTS.PROFILE.PARENT_BY_ID, { id }), profileData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

// Quran API functions
export const quranAPI = {
  // Surahs
  getSurahs: (params = {}) => api.get(config.ENDPOINTS.QURAN.SURAHS, { params }),
  getSurahByNumber: (number) => api.get(buildEndpoint(config.ENDPOINTS.QURAN.SURAH_BY_NUMBER, { number })),
  searchSurahs: (query) => api.get(config.ENDPOINTS.QURAN.SURAHS_SEARCH, { params: { q: query } }),
  
  // Verses
  getVerses: (params = {}) => api.get(config.ENDPOINTS.QURAN.VERSES, { params }),
  searchVerses: (query) => api.get(config.ENDPOINTS.QURAN.VERSES_SEARCH, { params: { q: query } }),
  
  // Bookmarks
  getBookmarks: (params = {}) => api.get(config.ENDPOINTS.QURAN.BOOKMARKS, { params }),
  createBookmark: (bookmarkData) => api.post(config.ENDPOINTS.QURAN.BOOKMARKS, bookmarkData),
  updateBookmark: (id, bookmarkData) => api.patch(buildEndpoint(config.ENDPOINTS.QURAN.BOOKMARK_BY_ID, { id }), bookmarkData),
  deleteBookmark: (id) => api.delete(buildEndpoint(config.ENDPOINTS.QURAN.BOOKMARK_BY_ID, { id })),
  toggleBookmark: (verseId) => api.post(config.ENDPOINTS.QURAN.BOOKMARKS_TOGGLE, { verse_id: verseId }),
  
  // Reading History
  getHistory: (params = {}) => api.get(config.ENDPOINTS.QURAN.HISTORY, { params }),
  updateProgress: (surahId, lastVerse) => api.post(config.ENDPOINTS.QURAN.HISTORY_UPDATE_PROGRESS, { 
    surah_id: surahId, 
    last_verse: lastVerse 
  }),
};

// Notification API functions
export const notificationAPI = {
  // Get all notifications for current user
  getNotifications: (params = {}) => api.get(config.ENDPOINTS.NOTIFICATION.LIST, { params }),
  
  // Get unread count
  getUnreadCount: () => api.get(config.ENDPOINTS.NOTIFICATION.UNREAD_COUNT),
  
  // Mark single notification as read
  markAsRead: (id) => api.post(buildEndpoint(config.ENDPOINTS.NOTIFICATION.MARK_READ, { id })),
  
  // Mark single notification as unread
  markAsUnread: (id) => api.post(buildEndpoint(config.ENDPOINTS.NOTIFICATION.MARK_UNREAD, { id })),
  
  // Mark all notifications as read
  markAllAsRead: () => api.post(config.ENDPOINTS.NOTIFICATION.MARK_ALL_READ),
  
  // Delete all notifications
  deleteAll: () => api.delete(config.ENDPOINTS.NOTIFICATION.DELETE_ALL),
  
  // Delete single notification
  delete: (id) => api.delete(buildEndpoint(config.ENDPOINTS.NOTIFICATION.DELETE, { id })),
};

export default api;
