import { useEffect } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google sign in failed. Please try again.');
        navigate('/login');
        return;
      }

      // Extract token from URL fragment (hash) - more secure than query params
      // Format: /#token=eyJ...
      const hash = location.hash;
      const tokenMatch = hash.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        // Save token for authentication
        localStorage.setItem('token', token);

        // Clear the token from URL immediately for security
        window.history.replaceState(null, '', location.pathname);

        // Fetch user info
        try {
          const response = await apiClient.get('/api/auth/me');
          const userData = response.data;
          localStorage.setItem('user', JSON.stringify(userData));

          // Update AuthContext with user data
          setUser(userData);

          toast.success('Signed in with Google successfully!');
          navigate('/');
        } catch (err) {
          console.error('Error fetching user after Google sign in:', err);
          toast.error('Failed to complete sign in');
          navigate('/login');
        }
      } else {
        // No token found, redirect to login
        console.error('No token found in Google OAuth callback');
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, location, navigate, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing sign in...</div>
    </div>
  );
}
