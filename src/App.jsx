import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import SheriffStar from './components/ui/SheriffStar';
import CrossedPistols from './components/ui/CrossedPistols';
import RopeDivider from './components/ui/RopeDivider';

// Placeholder pages — will be built out in subsequent steps
function ComingSoon({ name }) {
  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center">
        <CrossedPistols size={80} className="mx-auto mb-4" />
        <h1 className="font-display text-3xl text-charcoal-800 mb-2">{name}</h1>
        <RopeDivider />
        <p className="font-body text-dust-600 text-sm uppercase tracking-widest">
          Coming soon, stranger
        </p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      {/* App-wide header bar */}
      <header className="bg-charcoal-900 border-b border-gold-600 px-4 py-3 flex items-center gap-3">
        <SheriffStar size={28} />
        <h1 className="font-display text-gold-400 text-lg tracking-wider">
          The Quick and the Dead
        </h1>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/board" replace />} />
        <Route path="/login" element={<ComingSoon name="Draw Your Iron" />} />
        <Route path="/onboarding" element={<ComingSoon name="Register, Gunslinger" />} />
        <Route path="/board" element={<ComingSoon name="The Tournament Board" />} />
        <Route path="/boot-hill" element={<ComingSoon name="Boot Hill" />} />
        <Route path="/match/:matchId" element={<ComingSoon name="The Duel" />} />
        <Route path="/admin" element={<ComingSoon name="Sheriff's Office" />} />
        <Route path="*" element={<ComingSoon name="Lost in Redemption" />} />
      </Routes>
    </BrowserRouter>
  );
}
