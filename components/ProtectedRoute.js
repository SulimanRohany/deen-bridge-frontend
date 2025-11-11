'use client'


import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';

const ProtectedRoute = ({ children }) => {
  const { userData, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !userData) {
      router.push('/login');
    }
  }, [userData, loading, router]);

  if (loading || !userData) {
    return <div>Loading...</div>;
  }

  return children;
};

export default ProtectedRoute;
