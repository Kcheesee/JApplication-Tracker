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

      // Extract token from URL hash/fragment (#token=...)
      // The backend sends it as a hash for security (not sent to server)
      const hash = location.hash;
      const tokenMatch = hash.match(/token=([^&]+)/);
      const token = tokenMatch ? tokenMatch[1] : null;

      if (token) {
        // Save token
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
          console.error('Error fetching user:', err);
          toast.error('Failed to complete sign in');
          navigate('/login');
        }
      } else {
        // No token, redirect to login
        console.error('No token found in URL hash after Google OAuth');
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
