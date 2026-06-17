import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import SheriffStar from './ui/SheriffStar';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userProfile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-charcoal-900">
        <div className="text-center">
          <SheriffStar size={48} className="mx-auto mb-4 animate-pulse" />
          <p className="font-body text-dust-400 tracking-widest text-sm uppercase">
            Riding into town…
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) return <Navigate to="/login" replace />;
  if (!userProfile) return <Navigate to="/onboarding" replace />;
  if (adminOnly && !userProfile.isAdmin) return <Navigate to="/board" replace />;

  return children;
}
