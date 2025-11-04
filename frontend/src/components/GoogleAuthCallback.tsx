import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuth();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const error = searchParams.get('error');

      if (error) {
        toast.error('Google sign in failed. Please try again.');
        navigate('/login');
        return;
      }

      if (token) {
        // Save token
        localStorage.setItem('token', token);

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
        navigate('/login');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setUser]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing sign in...</div>
    </div>
  );
}
