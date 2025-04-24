import { useState } from 'react';
import { authApi } from '../../services/apiService';
import { useNavigate, Link } from 'react-router-dom';

interface RegisterForm {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  data: {
    success: boolean;
    token: string | null;
    message: string;
    userId: string;
    username: string;
  };
  errors: Record<string, string[]> | null;
}

const Register = () => {
  const [formData, setFormData] = useState<RegisterForm>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.username) {
      errors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      errors.username = 'Username must be at least 3 characters';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[#?!@$%^&*-])/.test(formData.password)) {
      errors.password = 'Password must include uppercase, lowercase, number, and special character';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
    
    // Clean up the form data to remove empty optional fields
    const cleanedFormData = { ...formData };
    if (!cleanedFormData.firstName?.trim()) {
      cleanedFormData.firstName = undefined;
    }
    if (!cleanedFormData.lastName?.trim()) {
      cleanedFormData.lastName = undefined;
    }
    
    try {
      console.log('Sending registration data:', JSON.stringify(cleanedFormData));
      const response = await authApi.register(cleanedFormData) as RegisterResponse;
      
      if (response.success) {
        setSuccessMessage(response.message || 'Registration successful!');
        // Redirect to login page after successful registration
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        // Handle server validation errors
        if (response.errors) {
          const serverErrors: Record<string, string> = {};
          
          Object.entries(response.errors).forEach(([field, errorMessages]) => {
            // Convert the field name to match our form fields (backend might use different casing)
            const formField = field.charAt(0).toLowerCase() + field.slice(1);
            serverErrors[formField] = errorMessages[0];
          });
          
          setFieldErrors(serverErrors);
        }
        
        setError(response.message || 'Registration failed');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Check if we have the responseData property from our API service
      if (err.responseData) {
        // Handle validation errors from the server
        if (err.responseData.errors) {
          const serverErrors: Record<string, string> = {};
          
          Object.entries(err.responseData.errors).forEach(([field, errorMessages]: [string, any]) => {
            // Convert camelCase or PascalCase field names to match our form fields
            const formField = field.charAt(0).toLowerCase() + field.slice(1);
            serverErrors[formField] = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages;
          });
          
          setFieldErrors(serverErrors);
        }
        
        setError(err.responseData.message || err.message || 'Registration failed');
      } else if (err.message && err.message.includes('{')) {
        // Try to parse error response from message if it contains JSON
        try {
          const errorData = JSON.parse(err.message.substring(err.message.indexOf('{')));
          
          if (errorData.errors) {
            const serverErrors: Record<string, string> = {};
            
            Object.entries(errorData.errors).forEach(([field, errorMessages]: [string, any]) => {
              const formField = field.charAt(0).toLowerCase() + field.slice(1);
              serverErrors[formField] = Array.isArray(errorMessages) ? errorMessages[0] : errorMessages;
            });
            
            setFieldErrors(serverErrors);
          }
          
          setError(errorData.message || 'Registration failed');
        } catch (parseError) {
          // If parsing fails, show the original error
          setError(err.message || 'An error occurred during registration');
        }
      } else {
        setError(err.message || 'An error occurred during registration');
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
          <h1>Create Account</h1>
          <p>Fill in your details to get started</p>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}
        
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
            <label htmlFor="username">Username</label>
            <input
              type="text"
              id="username"
              name="username"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              required
              className={`auth-input ${fieldErrors.username ? 'input-error' : ''}`}
            />
            {fieldErrors.username && <div className="field-error">{fieldErrors.username}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              className={`auth-input ${fieldErrors.password ? 'input-error' : ''}`}
            />
            {fieldErrors.password && <div className="field-error">{fieldErrors.password}</div>}
          </div>
          
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className={`auth-input ${fieldErrors.confirmPassword ? 'input-error' : ''}`}
            />
            {fieldErrors.confirmPassword && <div className="field-error">{fieldErrors.confirmPassword}</div>}
          </div>
          
          <div className="form-row">
            <div className="form-group half">
              <label htmlFor="firstName">First Name (Optional)</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                placeholder="First name"
                value={formData.firstName}
                onChange={handleChange}
                className={`auth-input ${fieldErrors.firstName ? 'input-error' : ''}`}
              />
              {fieldErrors.firstName && <div className="field-error">{fieldErrors.firstName}</div>}
            </div>
            
            <div className="form-group half">
              <label htmlFor="lastName">Last Name (Optional)</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                placeholder="Last name"
                value={formData.lastName}
                onChange={handleChange}
                className={`auth-input ${fieldErrors.lastName ? 'input-error' : ''}`}
              />
              {fieldErrors.lastName && <div className="field-error">{fieldErrors.lastName}</div>}
            </div>
          </div>
          
          <button 
            type="submit" 
            className="auth-button" 
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>
        
        <div className="auth-footer">
          <p>Already have an account? <Link to="/login">Sign In</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Register; 