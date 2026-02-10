
import axios from 'axios';

// Create Axios instance with base URL from environment variable or default
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_BASE_URL || 'http://localhost:3000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add Authorization header
apiClient.interceptors.request.use(
    (config) => {
        // Attempt to get token from localStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for global error handling (optional but recommended)
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle 401 Unauthorized errors globally if needed (e.g., redirect to login)
        // Note: React Router navigation is tricky here outside of components
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access - consider redirecting to login');
            // Optionally clear token if invalid
            // localStorage.removeItem('token');
        }
        return Promise.reject(error);
    }
);

export default apiClient;
