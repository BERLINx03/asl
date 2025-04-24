import { useState } from 'react';
import { authApi } from '../../services/apiService';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface LoginForm {
  email: string;
  password: string;
}

interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    token: string;
    message: string;
    userId: string;
    username: string;
  };
  errors: Record<string, string[]> | null;
}

const Login = () => {
  const [formData, setFormData] = useState<LoginForm>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const auth = useAuth();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }
    
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setFieldErrors({});
    
    try {
      console.log('Sending login data:', JSON.stringify(formData));
      const response = await authApi.login(formData.email, formData.password) as LoginResponse;
      
      if (response.success && response.data.success) {
        // Save auth data
        auth.login(response.data.token, {
          id: response.data.userId,
          username: response.data.username,
          email: formData.email
        });
        
        // Redirect to detection page
        navigate('/detection');
      } else {
        // Handle server validation errors
        if (response.errors) {
          const serverErrors: Record<string, string> = {};
          
          Object.entries(response.errors).forEach(([field, errorMessages]) => {
            // Convert the field name to match our form fields
            const formField = field.charAt(0).toLowerCase() + field.slice(1);
            serverErrors[formField] = errorMessages[0];
          });
          
          setFieldErrors(serverErrors);
        }
        
        setError(response.message || response.data?.message || 'Login failed');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Check if we have the responseData property
      if (err.responseData) {
        if (err.responseData.errors) {
          const serverErrors: Record<string, string> = {};
          
          Object.entries(err.responseData.errors).forEach(([field, errorMessages]: [string, any]) => {
            const formField = field.charAt(0).toLowerCase() + field.slice(1);
            serverErrors[formField] = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages;
          });
          
          setFieldErrors(serverErrors);
        }
        
        setError(err.responseData.message || err.message || 'Login failed');
      } else {
        // For general authentication errors, set a message for the password field
        if (err.message.includes('credentials') || err.message.includes('login') || err.message.includes('password')) {
          setFieldErrors({ password: 'Invalid email or password' });
        }
        
        setError(err.message || 'An error occurred during login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Sign In</h1>
          <p>Welcome back! Please sign in to continue</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
              className={`auth-input ${fieldErrors.email ? 'input-error' : ''}`}
            />
            {fieldErrors.email && <div className="field-error">{fieldErrors.email}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              className={`auth-input ${fieldErrors.password ? 'input-error' : ''}`}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>
          
          <button 
            type="submit" 
            className="auth-button"
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Don't have an account? <Link to="/register">Create Account</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login; 