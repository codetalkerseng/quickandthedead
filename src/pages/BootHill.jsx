import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import { db } from '../lib/firebase';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import BulletHole from '../components/ui/BulletHole';
import RopeDivider from '../components/ui/RopeDivider';
import CrossedPistols from '../components/ui/CrossedPistols';

const EPITAPHS = {
  eliminated: (opponent) => opponent ? `Gunned down by ${opponent}` : 'Met their end in Redemption',
  disqualified: () => 'Disqualified by the Sheriff',
  yielded: (opponent) => opponent ? `Yielded to ${opponent}` : 'Laid down their iron',
};

export default function BootHill() {
  const [fallen, setFallen] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'profiles'),
      where('status', 'in', ['eliminated', 'disqualified']),
      orderBy('stats.joinedAt', 'desc')
    );
    return onSnapshot(q, (snap) => {
      setFallen(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, []);

  return (
    <div className="min-h-screen bg-charcoal-900 pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="text-center mb-2">
          <CrossedPistols size={56} className="mx-auto mb-1" color="#6b3d1e" />
          <h2 className="font-display text-blood-500 text-2xl">Boot Hill</h2>
          <p className="section-label text-dust-600 mt-1">
            {fallen.length} soul{fallen.length !== 1 ? 's' : ''} laid to rest
          </p>
        </div>

        <RopeDivider />

        <div className="space-y-3">
          {fallen.map((p) => {
            const epitaph =
              EPITAPHS[p.status]?.(p.stats?.lastOpponentNickname) ??
              'Disappeared from Redemption';

            return (
              <div key={p.uid} className="panel flex items-center gap-3 p-3 opacity-80">
                <div className="relative">
                  <PlayerAvatar profile={p} size="md" />
                  <BulletHole
                    size={24}
                    className="absolute -bottom-1 -right-1"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-dust-400 text-sm uppercase tracking-wide line-through truncate">
                    {p.personal?.nickname}
                  </p>
                  <p className="font-body text-dust-600 text-xs italic mt-0.5">{epitaph}</p>
                  <p className="font-body text-dust-700 text-xs mt-0.5">
                    {p.stats?.matchesPlayed ?? 0} duel{p.stats?.matchesPlayed !== 1 ? 's' : ''} fought
                  </p>
                </div>

                <span
                  className={`text-xs font-sans font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm border ${
                    p.status === 'disqualified'
                      ? 'bg-blood-900 border-blood-700 text-blood-400'
                      : 'bg-charcoal-700 border-charcoal-600 text-dust-500'
                  }`}
                >
                  {p.status}
                </span>
              </div>
            );
          })}

          {fallen.length === 0 && (
            <div className="text-center py-12">
              <p className="font-body text-dust-600 uppercase tracking-widest text-sm">
                No souls resting here yet
              </p>
            </div>
          )}
        </div>

        <RopeDivider />

        <Link to="/board" className="btn-gold w-full block text-center">
          Back to the Fight
        </Link>
      </div>
    </div>
  );
}
