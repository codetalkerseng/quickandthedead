import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Shield, Eye, Smile, Package } from 'lucide-react';
import RopeDivider from './ui/RopeDivider';

const CHECKS = [
  { key: 'eyePro',  icon: Eye,     label: 'Eye Protection', sub: 'Full seal ballistic goggles or glasses on' },
  { key: 'facePro', icon: Smile,   label: 'Face Protection', sub: 'Lower face mask, full seal, or balaclava secured' },
  { key: 'holster', icon: Package, label: 'Holstered & Safe', sub: 'Weapon fully holstered, safety engaged' },
];

export default function SafetyGate({ matchId, participantKey, onReady }) {
  const [checks, setChecks] = useState({ eyePro: false, facePro: false, holster: false });
  const [submitting, setSubmitting] = useState(false);

  const allClear = Object.values(checks).every(Boolean);

  function toggle(key) {
    setChecks((c) => ({ ...c, [key]: !c[key] }));
  }

  async function confirm() {
    if (!allClear || submitting) return;
    setSubmitting(true);
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        [`safety.${participantKey}Ready`]: true,
      });
      onReady?.();
    } catch {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-charcoal-900/95 z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-charcoal-800 border-2 border-blood-700 rounded-sm shadow-blood-glow">
        <div className="bg-blood-800 border-b border-blood-600 px-4 py-3 flex items-center gap-2">
          <Shield size={20} className="text-blood-300" />
          <h2 className="font-display text-blood-200 text-lg tracking-wider">Safety Check</h2>
        </div>

        <div className="p-4">
          <p className="font-body text-dust-400 text-sm mb-4 text-center">
            Confirm all safety gear before the draw. These boxes cannot be unchecked.
          </p>

          <div className="space-y-3">
            {CHECKS.map(({ key, icon: Icon, label, sub }) => (
              <button
                key={key}
                type="button"
                onClick={() => !checks[key] && toggle(key)}
                disabled={checks[key]}
                className={`w-full flex items-center gap-3 p-3 rounded-sm border-2 text-left transition-all ${
                  checks[key]
                    ? 'bg-blood-900 border-blood-600 cursor-default'
                    : 'bg-charcoal-700 border-charcoal-500 hover:border-dust-400 active:scale-[0.98]'
                }`}
              >
                <div
                  className={`w-6 h-6 rounded-sm border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    checks[key]
                      ? 'bg-blood-600 border-blood-400'
                      : 'bg-charcoal-900 border-charcoal-500'
                  }`}
                >
                  {checks[key] && <span className="text-parchment-100 text-xs font-bold">✓</span>}
                </div>
                <Icon size={18} className={checks[key] ? 'text-blood-300' : 'text-dust-500'} />
                <div>
                  <p className={`font-sans font-bold text-sm uppercase tracking-wide ${checks[key] ? 'text-blood-200' : 'text-dust-200'}`}>
                    {label}
                  </p>
                  <p className="font-body text-xs text-dust-600 mt-0.5">{sub}</p>
                </div>
              </button>
            ))}
          </div>

          <RopeDivider />

          <button
            onClick={confirm}
            disabled={!allClear || submitting}
            className={`w-full py-3 font-sans font-bold uppercase tracking-widest rounded-sm border-2 transition-all text-sm ${
              allClear
                ? 'bg-blood-700 border-blood-500 text-parchment-100 hover:bg-blood-600 active:scale-95'
                : 'bg-charcoal-700 border-charcoal-600 text-dust-600 cursor-not-allowed'
            }`}
          >
            {submitting ? 'Locking in…' : allClear ? 'I AM READY TO DRAW' : 'Check all boxes to proceed'}
          </button>
        </div>
      </div>
    </div>
  );
}
