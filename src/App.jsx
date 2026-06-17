import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';
import Board from './pages/Board';
import BootHill from './pages/BootHill';
import SheriffStar from './components/ui/SheriffStar';

function ComingSoon({ name }) {
  return (
    <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
      <div className="text-center">
        <SheriffStar size={48} className="mx-auto mb-4" />
        <h1 className="font-display text-gold-400 text-3xl">{name}</h1>
        <p className="font-body text-dust-600 text-sm uppercase tracking-widest mt-2">
          Coming soon, stranger
        </p>
      </div>
    </div>
  );
}

function NavBar() {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();
  if (!currentUser || !userProfile) return null;

  const links = [
    { to: '/board', label: 'Roster' },
    { to: '/boot-hill', label: 'Boot Hill' },
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
        <Route path="/login" element={<Login />} />
        <Route path="/onboarding" element={<Onboarding />} />

        <Route
          path="/board"
          element={
            <ProtectedRoute>
              <Board />
            </ProtectedRoute>
          }
        />
        <Route
          path="/boot-hill"
          element={
            <ProtectedRoute>
              <BootHill />
            </ProtectedRoute>
          }
        />
        <Route
          path="/match/:matchId"
          element={
            <ProtectedRoute>
              <ComingSoon name="The Duel" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <ComingSoon name="Sheriff's Office" />
            </ProtectedRoute>
          }
        />
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
