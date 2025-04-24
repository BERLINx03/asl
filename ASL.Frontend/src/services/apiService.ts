// Base API URL
const API_URL = 'http://localhost:5156/api';

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();
  
  if (!response.ok) {
    // If the server responded with an error message, use it
    const errorMessage = data.message || 'An error occurred';
    const error = new Error(errorMessage);
    // Attach the original response data for more detailed error handling
    (error as any).responseData = data;
    throw error;
  }
  
  return data;
};

// Helper to get auth header
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem('token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

// Auth API endpoints
export const authApi = {
  login: async (email: string, password: string) => {
    try {
      console.log('Sending login request to:', `${API_URL}/Auth/login`);
      console.log('Login payload:', JSON.stringify({ email, password }));
      
      const response = await fetch(`${API_URL}/Auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'text/plain'
        },
        body: JSON.stringify({ email, password })
      });
      
      console.log('Login response status:', response.status);
      if (!response.ok) {
        console.log('Login error response:', await response.clone().text());
      }
      
      return handleResponse(response);
    } catch (error) {
      console.error('Login API error:', error);
      throw error;
    }
  },
  
  register: async (registerData: {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
    firstName?: string;
    lastName?: string;
  }) => {
    try {
      console.log('Sending registration request to:', `${API_URL}/Auth/register`);
      console.log('Registration payload:', JSON.stringify(registerData));
      
      const response = await fetch(`${API_URL}/Auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'accept': 'text/plain'
        },
        body: JSON.stringify(registerData)
      });
      
      console.log('Registration response status:', response.status);
      if (!response.ok) {
        console.log('Registration error response:', await response.clone().text());
      }
      
      return handleResponse(response);
    } catch (error) {
      console.error('Registration API error:', error);
      throw error;
    }
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