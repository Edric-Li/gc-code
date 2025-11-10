import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Loading from '@/components/common/Loading';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuthData } = useAuth();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const error = searchParams.get('error');

    if (error) {
      navigate('/login?error=' + error);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuthData(token, user);
        navigate('/');
      } catch (err) {
        console.error('Failed to parse user data:', err);
        navigate('/login?error=invalid_data');
      }
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setAuthData]);

  return <Loading />;
}
