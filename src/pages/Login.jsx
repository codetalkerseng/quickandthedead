import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import SheriffStar from '../components/ui/SheriffStar';
import CrossedPistols from '../components/ui/CrossedPistols';
import RopeDivider from '../components/ui/RopeDivider';

export default function Login() {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setBusy(true);

    try {
      if (mode === 'signup') {
        await createUserWithEmailAndPassword(auth, email, password);
        navigate('/onboarding');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/board');
      }
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-charcoal-900">
      {/* Parchment card */}
      <div className="w-full max-w-sm wanted-frame bg-parchment-200 text-center">
        <CrossedPistols size={64} className="mx-auto mb-2" />

        <p className="section-label text-dust-600 mb-1">Redemption Tournament</p>
        <h1 className="font-display text-3xl text-charcoal-900 leading-tight">
          The Quick<br />& the Dead
        </h1>

        <RopeDivider />

        <p className="font-display text-lg text-blood-700 mb-6 uppercase tracking-wider">
          {mode === 'signin' ? 'Draw Your Iron' : 'Register, Stranger'}
        </p>

        {error && (
          <div className="mb-4 px-4 py-2 bg-blood-800 border border-blood-600 rounded-sm">
            <p className="font-body text-parchment-100 text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="section-label block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                         font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                         placeholder-dust-600"
              placeholder="outlaw@redemption.com"
            />
          </div>

          <div>
            <label className="section-label block mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-charcoal-800 border border-charcoal-600 text-parchment-100
                         font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                         placeholder-dust-600"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={busy}
            className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {busy
              ? 'Checking spurs…'
              : mode === 'signin'
              ? 'Enter Town'
              : 'Join the Tournament'}
          </button>
        </form>

        <RopeDivider />

        <button
          onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
          className="font-body text-sm text-dust-600 hover:text-gold-600 transition-colors"
        >
          {mode === 'signin'
            ? "New in town? Register here"
            : 'Already registered? Sign in'}
        </button>

        <div className="mt-6 flex justify-center">
          <SheriffStar size={20} />
        </div>
      </div>
    </div>
  );
}

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Wrong email or password, partner.';
    case 'auth/email-already-in-use':
      return 'That email already rode into town.';
    case 'auth/weak-password':
      return 'Password needs at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Cool your guns and try again.';
    default:
      return 'Something went sideways. Try again.';
  }
}
