import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import apiClient from '../api/client';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
          localStorage.setItem('user', JSON.stringify(response.data));
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
  }, [searchParams, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing sign in...</div>
    </div>
  );
}
