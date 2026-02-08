const API_URL = "http://localhost:5001/api";

const getAuthToken = () => {
  return localStorage.getItem("token");
};

const getHeaders = (includeAuth = false) => {
  const headers = {
    "Content-Type": "application/json",
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  return headers;
};

export const authAPI = {
  resetPassword: async (email, password, confirmPassword) => {
    const response = await fetch(`${API_URL}/auth/reset-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email,
        password,
        confirmPassword,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.details || "Failed to reset password");
    }

    return data;
  },

  // Register new user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Registration failed");
    }

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  // Login user
  login: async (payload) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Login failed");
    }

    // Save token to localStorage
    if (data.token) {
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
    }

    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

export const adminAPI = {
  createUser: async (userData) => {
    const response = await fetch(`${API_URL}/admin/create`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(userData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "User creation failed");
    }

    return data;
  },

  deleteUser: async (userId) => {
    const response = await fetch(`${API_URL}/admin/${userId}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to delete user");
    }
    return data;
  },

  updateUserProfile: async (userId, profileData) => {
    const response = await fetch(`${API_URL}/admin/userprofile/${userId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    return data;
  },
};

// User API calls
export const userAPI = {
  getUserById: async (userId) => {
    const response = await fetch(`${API_URL}/users/profile/${userId}`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Failed to fetch user profile");
    return data;
  },
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch profile");
    }

    return data;
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    const response = await fetch(
      `${API_URL}/users/leaderboard?limit=${limit}`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch leaderboard");
    }

    return data;
  },

  // Get achievements
  getAchievements: async () => {
    const response = await fetch(`${API_URL}/users/achievements`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch achievements");
    }

    return data;
  },

  // In your userAPI object
  getAllUsers: async (page = 1, limit = 10) => {
    const response = await fetch(
      `${API_URL}/users/users?page=${page}&limit=${limit}`,
      {
        headers: getHeaders(true),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch users");
    }

    return data;
  },
};

// Recycling API calls
export const recyclingAPI = {
  // Submit recycling log
  submitLog: async (logData) => {
    const token = getAuthToken();
    const isFormData = logData instanceof FormData;

    const response = await fetch(`${API_URL}/recycling/submit`, {
      method: "POST",
      headers: isFormData
        ? { Authorization: `Bearer ${token}` }
        : getHeaders(true),
      body: isFormData ? logData : JSON.stringify(logData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to submit log");
    }

    return data;
  },

  // Get user's recycling logs
  getMyLogs: async () => {
    const response = await fetch(`${API_URL}/recycling/my-logs`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch logs");
    }

    return data;
  },

  // Get all recycling logs (admin only)
  getAllLogs: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.category) queryParams.append("category", filters.category);
    if (filters.user_id) queryParams.append("user_id", filters.user_id);

    const response = await fetch(`${API_URL}/recycling?${queryParams}`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch logs");
    }

    return data;
  },

  // Get pending recycling logs (admin only)
  getPendingLogs: async () => {
    const response = await fetch(`${API_URL}/recycling/pending`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch pending logs");
    }

    return data;
  },

  // Approve recycling log (admin only)
  approveLog: async (logId) => {
    const response = await fetch(`${API_URL}/recycling/${logId}/approve`, {
      method: "PATCH",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to approve log");
    }

    return data;
  },

  // Reject recycling log (admin only)
  rejectLog: async (logId, reason) => {
    const response = await fetch(`${API_URL}/recycling/${logId}/reject`, {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify({ reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to reject log");
    }

    return data;
  },

  // Delete recycling log
  deleteLog: async (logId) => {
    const response = await fetch(`${API_URL}/recycling/${logId}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete log");
    }

    return data;
  },

  // Get recycling statistics
  getStats: async () => {
    const response = await fetch(`${API_URL}/recycling/stats`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch stats");
    }

    return data;
  },
};

// Event API calls
export const eventAPI = {
  // Get all events (with optional filters)
  getAllEvents: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append("status", filters.status);
    if (filters.organizer_id)
      queryParams.append("organizer_id", filters.organizer_id);
    if (filters.upcoming) queryParams.append("upcoming", "true");

    const url = `${API_URL}/events${
      queryParams.toString() ? "?" + queryParams.toString() : ""
    }`;

    const response = await fetch(url, {
      headers: getHeaders(),
    });

    const data = await response.json();
    console.log("data api events---", data);

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch events");
    }

    return data;
  },

  // Get single event by ID
  getEventById: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      headers: getHeaders(),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch event");
    }

    return data;
  },

  // Create new event (organizers only)
  createEvent: async (eventData) => {
    const response = await fetch(`${API_URL}/events`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to create event");
    }

    return data;
  },

  // Update event (organizers only)
  updateEvent: async (id, eventData) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(eventData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update event");
    }

    return data;
  },

  // Delete event (organizers only)
  deleteEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete event");
    }

    return data;
  },

  // Register for an event
  registerForEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}/register`, {
      method: "POST",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to register for event");
    }

    return data;
  },

  // Unregister from an event
  unregisterFromEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}/register`, {
      method: "DELETE",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to unregister from event");
    }

    return data;
  },

  // Mark attendance (organizers only)
  markAttendance: async (id, userId, attended) => {
    const response = await fetch(`${API_URL}/events/${id}/attendance`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ user_id: userId, attended }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to mark attendance");
    }

    return data;
  },

  // Admin approve or cancel event (admins only)
  adminAction: async (id, action) => {
    const response = await fetch(`${API_URL}/events/${id}/admin-action`, {
      method: "PATCH",
      headers: getHeaders(true),
      body: JSON.stringify({ action }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to perform admin action");
    }

    return data;
  },

  // Get user's registered events
  getMyRegisteredEvents: async () => {
    const response = await fetch(`${API_URL}/events/user/registered`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch registered events");
    }

    return data;
  },

  // Get events organized by user (organizers only)
  getMyOrganizedEvents: async () => {
    const response = await fetch(`${API_URL}/events/user/organized`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch organized events");
    }

    return data;
  },
};

// Notification API calls
export const notificationAPI = {
  // Get all notifications for current user
  getAllNotifications: async () => {
    const response = await fetch(`${API_URL}/notifications`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch notifications");
    }

    return data;
  },

  // Get unread notification count
  getUnreadCount: async () => {
    const response = await fetch(`${API_URL}/notifications/unread-count`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch unread count");
    }

    return data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await fetch(
      `${API_URL}/notifications/${notificationId}/read`,
      {
        method: "PATCH",
        headers: getHeaders(true),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to mark notification as read");
    }

    return data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: "PATCH",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to mark all notifications as read");
    }

    return data;
  },

  // Send notification to event participants (Organizer only)
  sendToEventParticipants: async (eventId, notificationData) => {
    const response = await fetch(`${API_URL}/notifications/event/${eventId}`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(notificationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send notification");
    }

    return data;
  },

  // Send notification to all users (Admin only)
  sendToAllUsers: async (notificationData) => {
    const response = await fetch(`${API_URL}/notifications/all`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify(notificationData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to send notification");
    }

    return data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: "DELETE",
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to delete notification");
    }

    return data;
  },
};

// Profile API calls
export const profileAPI = {
  // Get full profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/profile`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to fetch profile");
    return data;
  },

  // Update profile details
  updateProfile: async (profileData) => {
    const response = await fetch(`${API_URL}/profile`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(profileData),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Failed to update profile");
    return data;
  },

  // Update basic info (name)
  updateBasicInfo: async (basicData) => {
    const response = await fetch(`${API_URL}/profile/basic`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(basicData),
    });
    const data = await response.json();
    if (!response.ok)
      throw new Error(data.error || "Failed to update basic info");
    return data;
  },

  updateProfile: async (userId, profileData) => {
    const response = await fetch(`${API_URL}/profile/userprofile/${userId}`, {
      method: "PUT",
      headers: getHeaders(true),
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to update profile");
    }

    return data;
  },
};
// Eco-points API calls
export const ecopointAPI = {
  // Get my eco-points and stats
  getMyPoints: async () => {
    const response = await fetch(`${API_URL}/ecopoints/my-points`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch eco-points");
    }

    return data;
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10, role = null) => {
    const queryParams = new URLSearchParams();
    if (limit) queryParams.append("limit", limit);
    if (role) queryParams.append("role", role);

    const response = await fetch(
      `${API_URL}/ecopoints/leaderboard?${queryParams}`,
      {
        headers: getHeaders(),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch leaderboard");
    }

    return data;
  },

  // Get my rank and nearby competitors
  getMyRank: async () => {
    const response = await fetch(`${API_URL}/ecopoints/my-rank`, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch rank");
    }

    return data;
  },

  // Award eco-points (organizer/admin only)
  awardPoints: async (userId, points, reason) => {
    const response = await fetch(`${API_URL}/ecopoints/award`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({ user_id: userId, points, reason }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to award points");
    }

    return data;
  },

  // Get eco-points history
  getHistory: async (userId = null) => {
    const url = userId
      ? `${API_URL}/ecopoints/history/${userId}`
      : `${API_URL}/ecopoints/history`;

    const response = await fetch(url, {
      headers: getHeaders(true),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch history");
    }

    return data;
  },
};

export const reportsAPI = {
  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await fetch(`${API_URL}/reports/dashboard-stats`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to fetch dashboard stats");
    }
    return data;
  },

  // Generate report
  generateReport: async (reportType, startDate, endDate) => {
    const response = await fetch(`${API_URL}/reports/generate`, {
      method: "POST",
      headers: getHeaders(true),
      body: JSON.stringify({
        report_type: reportType,
        start_date: startDate,
        end_date: endDate,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Failed to generate report");
    }
    return data;
  },
};


// ========================================
// FRONTEND - System API Service
// ========================================
// File: services/api.js

export const systemAPI = {
  // Get system health and stats
  getSystemHealth: async () => {
    const response = await fetch(`${API_URL}/system/health`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get system health');
    return data;
  },

  // Get system settings
  getSystemSettings: async () => {
    const response = await fetch(`${API_URL}/system/settings`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get settings');
    return data;
  },

  // Update a system setting
  updateSetting: async (key, value) => {
    const response = await fetch(`${API_URL}/system/settings/${key}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ value }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to update setting');
    return data;
  },

  // Run database backup
  runBackup: async () => {
    const response = await fetch(`${API_URL}/system/backup`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to create backup');
    return data;
  },

  // Clear cache
  clearCache: async () => {
    const response = await fetch(`${API_URL}/system/clear-cache`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to clear cache');
    return data;
  },

  // Export all data
  exportData: async () => {
    const response = await fetch(`${API_URL}/system/export`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to export data');
    return data;
  },

  // Get system logs
  getSystemLogs: async (limit = 50, offset = 0) => {
    const response = await fetch(`${API_URL}/system/logs?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to get logs');
    return data;
  },
};

export const achievementsAPI = {
  // Get user achievements
  getMyAchievements: async () => {
    const response = await fetch(`${API_URL}/achievements/my-achievements`, {
      headers: getHeaders(true),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch achievements');
    }
    return data;
  },
};

export default {
  auth: authAPI,
  user: userAPI,
  recycling: recyclingAPI,
  event: eventAPI,
  notification: notificationAPI,
  profile: profileAPI,
  ecopoint: ecopointAPI,
  admin: adminAPI,
  report: reportsAPI,
  systemCheck: systemAPI,
  achievement: achievementsAPI
};
