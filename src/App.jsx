import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Profile from './pages/Profile';
import Board from './pages/Board';
import BootHill from './pages/BootHill';
import Match from './pages/Match';
import Admin from './pages/Admin';
import Leaderboard from './pages/Leaderboard';
import SheriffStar from './components/ui/SheriffStar';

function NavBar() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  const hidden = ['/login', '/onboarding'];
  if (!currentUser || !userProfile || hidden.includes(location.pathname)) return null;

  const links = [
    { to: '/board',       label: 'Roster' },
    { to: '/leaderboard', label: 'Standings' },
    { to: '/profile',     label: 'Profile' },
    ...(userProfile.isAdmin ? [{ to: '/admin', label: "Sheriff's" }] : []),
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-charcoal-900 border-t border-charcoal-600 z-50">
      <div className="max-w-lg mx-auto flex">
        {links.map((l) => (
          <Link
            key={l.to}
            to={l.to}
            className={`flex-1 py-3 text-center font-sans font-bold text-xs uppercase tracking-widest transition-colors ${
              location.pathname.startsWith(l.to)
                ? 'text-gold-400 border-t-2 border-gold-400 -mt-px'
                : 'text-dust-600 hover:text-dust-300'
            }`}
          >
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

function AppShell() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  const showHeader =
    currentUser &&
    userProfile &&
    location.pathname !== '/login' &&
    location.pathname !== '/onboarding';

  return (
    <>
      {showHeader && (
        <header className="bg-charcoal-900 border-b border-gold-700 px-4 py-2 flex items-center gap-2 sticky top-0 z-40">
          <SheriffStar size={22} />
          <span className="font-display text-gold-400 text-base tracking-wider">
            The Quick & the Dead
          </span>
        </header>
      )}

      <Routes>
        <Route path="/login"      element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route path="/board"      element={<ProtectedRoute><Board /></ProtectedRoute>} />
        <Route path="/boot-hill"  element={<ProtectedRoute><BootHill /></ProtectedRoute>} />
        <Route path="/profile"    element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/leaderboard"    element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
        <Route path="/match"          element={<ProtectedRoute><Match /></ProtectedRoute>} />
        <Route path="/admin"      element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />

        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="*" element={<Navigate to="/board" replace />} />
      </Routes>

      <NavBar />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
