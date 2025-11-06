import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('voch_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('voch_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  signup: (data: { email: string; password: string; username: string; firstName: string; lastName: string }) =>
    apiClient.post('/auth/signup', data),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
}

// Posts API
export const postsAPI = {
  getFeed: (page = 1, limit = 10) =>
    apiClient.get('/posts/feed', { params: { page, limit } }),
  getPost: (id: string) => apiClient.get(`/posts/${id}`),
  createPost: (data: { content: string; mediaUrls?: string[]; mediaType?: string }) =>
    apiClient.post('/posts', data),
  likePost: (id: string) => apiClient.post(`/posts/${id}/like`),
  commentOnPost: (id: string, content: string) =>
    apiClient.post(`/posts/${id}/comments`, { content }),
}

// Polls API
export const pollsAPI = {
  getPolls: (page = 1, limit = 10) =>
    apiClient.get('/polls', { params: { page, limit } }),
  getPoll: (id: string) => apiClient.get(`/polls/${id}`),
  createPoll: (data: { question: string; options: string[]; description?: string; endsAt: Date }) =>
    apiClient.post('/polls', data),
  votePoll: (id: string, optionId: string) =>
    apiClient.post(`/polls/${id}/vote`, { optionId }),
}

// Users API  
export const usersAPI = {
  getUser: (id: string) => apiClient.get(`/users/${id}`),
  updateProfile: (data: Partial<{ firstName: string; lastName: string; bio: string; avatar: string }>) =>
    apiClient.patch('/users/profile', data),
  followUser: (id: string) => apiClient.post(`/users/${id}/follow`),
  unfollowUser: (id: string) => apiClient.delete(`/users/${id}/follow`),
}

// NGO API
export const ngoAPI = {
  getNGOs: (page = 1, limit = 10) =>
    apiClient.get('/ngos', { params: { page, limit } }),
  getNGO: (id: string) => apiClient.get(`/ngos/${id}`),
  getFundraisers: (ngoId: string) =>
    apiClient.get(`/ngos/${ngoId}/fundraisers`),
  donate: (fundraiserId: string, amount: number) =>
    apiClient.post(`/fundraisers/${fundraiserId}/donate`, { amount }),
}
