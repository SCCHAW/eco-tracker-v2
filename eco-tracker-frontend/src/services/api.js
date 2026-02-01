const API_URL = 'http://localhost:5001/api';


const getAuthToken = () => {
  return localStorage.getItem('token');
};

const getHeaders = (includeAuth = false) => {
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  
  return headers;
};


export const authAPI = {
  // Register new user
  register: async (userData) => {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Registration failed');
    }
    
    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Login user
  login: async (payload) => {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Login failed');
    }
    
    // Save token to localStorage
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    
    return data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  // Get current user from localStorage
  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!getAuthToken();
  },
};

// User API calls
export const userAPI = {
  // Get user profile
  getProfile: async () => {
    const response = await fetch(`${API_URL}/users/profile`, {
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch profile');
    }
    
    return data;
  },

  // Get leaderboard
  getLeaderboard: async (limit = 10) => {
    const response = await fetch(`${API_URL}/users/leaderboard?limit=${limit}`, {
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch leaderboard');
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
      throw new Error(data.error || 'Failed to fetch achievements');
    }
    
    return data;
  },
};

// Recycling API calls
export const recyclingAPI = {
  // Submit recycling log with image
  submitLog: async (formData) => {
    const token = getAuthToken();
    
    const response = await fetch(`${API_URL}/recycling/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Don't set Content-Type for FormData - browser will set it automatically
      },
      body: formData, // FormData object
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to submit log');
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
      throw new Error(data.error || 'Failed to fetch logs');
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
      throw new Error(data.error || 'Failed to fetch stats');
    }
    
    return data;
  },
};

// Event API calls
export const eventAPI = {
  // Get all events (with optional filters)
  getAllEvents: async (filters = {}) => {
    const queryParams = new URLSearchParams();
    if (filters.status) queryParams.append('status', filters.status);
    if (filters.organizer_id) queryParams.append('organizer_id', filters.organizer_id);
    if (filters.upcoming) queryParams.append('upcoming', 'true');
    
    const url = `${API_URL}/events${queryParams.toString() ? '?' + queryParams.toString() : ''}`;
    
    const response = await fetch(url, {
      headers: getHeaders(),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to fetch events');
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
      throw new Error(data.error || 'Failed to fetch event');
    }
    
    return data;
  },

  // Create new event (organizers only)
  createEvent: async (eventData) => {
    const response = await fetch(`${API_URL}/events`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(eventData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to create event');
    }
    
    return data;
  },

  // Update event (organizers only)
  updateEvent: async (id, eventData) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(eventData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to update event');
    }
    
    return data;
  },

  // Delete event (organizers only)
  deleteEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete event');
    }
    
    return data;
  },

  // Register for an event
  registerForEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}/register`, {
      method: 'POST',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to register for event');
    }
    
    return data;
  },

  // Unregister from an event
  unregisterFromEvent: async (id) => {
    const response = await fetch(`${API_URL}/events/${id}/register`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to unregister from event');
    }
    
    return data;
  },

  // Mark attendance (organizers only)
  markAttendance: async (id, userId, attended) => {
    const response = await fetch(`${API_URL}/events/${id}/attendance`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ user_id: userId, attended }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark attendance');
    }
    
    return data;
  },

  // Admin approve or cancel event (admins only)
  adminAction: async (id, action) => {
    const response = await fetch(`${API_URL}/events/${id}/admin-action`, {
      method: 'PATCH',
      headers: getHeaders(true),
      body: JSON.stringify({ action }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to perform admin action');
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
      throw new Error(data.error || 'Failed to fetch registered events');
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
      throw new Error(data.error || 'Failed to fetch organized events');
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
      throw new Error(data.error || 'Failed to fetch notifications');
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
      throw new Error(data.error || 'Failed to fetch unread count');
    }
    
    return data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark notification as read');
    }
    
    return data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await fetch(`${API_URL}/notifications/read-all`, {
      method: 'PATCH',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to mark all notifications as read');
    }
    
    return data;
  },

  // Send notification to event participants (Organizer only)
  sendToEventParticipants: async (eventId, notificationData) => {
    const response = await fetch(`${API_URL}/notifications/event/${eventId}`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(notificationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send notification');
    }
    
    return data;
  },

  // Send notification to all users (Admin only)
  sendToAllUsers: async (notificationData) => {
    const response = await fetch(`${API_URL}/notifications/all`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(notificationData),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to send notification');
    }
    
    return data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await fetch(`${API_URL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: getHeaders(true),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete notification');
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
};