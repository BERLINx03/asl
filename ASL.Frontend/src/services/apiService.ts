// Base API URL
const API_URL = 'http://localhost:5000/api';
// ASL Recognition API URL
const ASL_API_URL = 'http://localhost:8000';
// A-to-F Recognition API URL
const A_TO_F_API_URL = 'http://localhost:8001';

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
    
    console.error('WWW:', JSON.stringify(difficulty));
    const response = await fetch(`${API_URL}/Game/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ difficulty })
    });
    
    console.error('XXX:', JSON.stringify(response.status));
    if(response.status === 401) {
      console.error('Unauthorized access. Please log in again.');
      localStorage.removeItem('token');
      window.location.href = '/login'; 
    }
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

  completeMatch: async (matchId: string, userId: string) => {
    const response = await fetch(`${API_URL}/Game/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader()
      },
      body: JSON.stringify({ matchId , userId})
    });
    
    const handleResponse = async (response: Response) => {
      const data = await response.json();
      if (!response.ok) {
        console.error('API error response:', data);
        throw new Error(data.message || data.errors?.join(', ') || 'An error occurred');
      }
      return data;
    };
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
  },
  getMatch: async (matchId: string) => {
    const response = await fetch(`${API_URL}/Game/${matchId}`, {
      headers: getAuthHeader()
    });
    
    return handleResponse(response);
  },
  checkMatchStatus: async (matchId: string) => {
    const response = await fetch(`${API_URL}/Game/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeader(),
      },
      body: JSON.stringify({ matchId }),
    });
    return handleResponse(response);
  }
};

// ASL Recognition API endpoints
export const aslRecognitionApi = {
  detectSign: async (imageBase64: string) => {
    try {
      console.log('Sending detection request to:', `${ASL_API_URL}/predict/base64`);
      
      const response = await fetch(`${ASL_API_URL}/predict/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64
        })
      });
      
      console.log('Detection response status:', response.status);
      if (!response.ok) {
        console.log('Detection error response:', await response.clone().text());
      }
      
      return handleResponse(response);
    } catch (error) {
      console.error('ASL Recognition API error:', error);
      throw error;
    }
  },
  
  checkHealth: async () => {
    try {
      const response = await fetch(`${ASL_API_URL}/health`);
      return handleResponse(response);
    } catch (error) {
      console.error('ASL API health check error:', error);
      throw error;
    }
  }
};

// A-to-F Recognition API endpoints
export const aToFRecognitionApi = {
  detectSign: async (imageBase64: string) => {
    try {
      console.log('Sending detection request to A-to-F API:', `${A_TO_F_API_URL}/predict/base64`);
      
      // Create AbortController with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${A_TO_F_API_URL}/predict/base64`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image: imageBase64
        }),
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      console.log('A-to-F Detection response status:', response.status);
      if (!response.ok) {
        console.log('A-to-F Detection error response:', await response.clone().text());
        // Return fallback response instead of throwing
        return {
          sign: "error",
          confidence: 0,
          landmarks: [],
          has_hand: false,
          is_a_to_f: false
        };
      }
      
      return handleResponse(response);
    } catch (error: any) {
      console.error('A-to-F Recognition API error:', error);
      // Return fallback response for AbortError (timeout) or other errors
      return {
        sign: error.name === 'AbortError' ? "timeout" : "error",
        confidence: 0,
        landmarks: [],
        has_hand: false,
        is_a_to_f: false
      };
    }
  },
  
  checkHealth: async () => {
    try {
      // Create AbortController with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${A_TO_F_API_URL}/health`, {
        signal: controller.signal
      });
      
      // Clear the timeout
      clearTimeout(timeoutId);
      
      return handleResponse(response);
    } catch (error) {
      console.error('A-to-F API health check error:', error);
      // Return fallback health response
      return {
        status: "unhealthy",
        model_loaded: false
      };
    }
  }
}; 