import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function GoogleAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setToken } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error('Google sign in failed. Please try again.');
      navigate('/login');
      return;
    }

    if (token) {
      // Save token and redirect
      localStorage.setItem('token', token);
      if (setToken) {
        setToken(token);
      }
      toast.success('Signed in with Google successfully!');
      navigate('/');
    } else {
      // No token, redirect to login
      navigate('/login');
    }
  }, [searchParams, navigate, setToken]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl">Completing sign in...</div>
    </div>
  );
}
