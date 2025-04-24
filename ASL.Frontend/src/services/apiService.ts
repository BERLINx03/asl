// Base API URL
const API_URL = 'http://localhost:5156/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // If the server responded with an error message, use it
    const errorMessage = data.message || 'An error occurred';
    throw new Error(errorMessage);
  }
  
  return data;
};

// Helper to get auth header
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_URL}/Auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email, password })
    });
    
    return handleResponse(response);
  },
  
  register: async (registerData: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await fetch(`${API_URL}/Auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(registerData)
    });
    
    return handleResponse(response);
  }
};

// Game API endpoints
export const gameApi = {
  createMatch: async (difficulty: string) => {
    const response = await fetch(`${API_URL}/Game/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ difficulty })
    });
    
    return handleResponse(response);
  },
  
  joinMatch: async (matchId: string) => {
    const response = await fetch(`${API_URL}/Game/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ matchId })
    });
    
    return handleResponse(response);
  },
  
  getActiveMatches: async () => {
    const response = await fetch(`${API_URL}/Game/active`, {
      headers: getAuthHeader()
    });
    
    return handleResponse(response);
  },
  
  getUserMatches: async () => {
    const response = await fetch(`${API_URL}/Game/user`, {
      headers: getAuthHeader()
    });
    
    return handleResponse(response);
  }
}; 