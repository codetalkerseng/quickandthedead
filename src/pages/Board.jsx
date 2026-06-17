import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useNavigate, Link } from 'react-router-dom';
import { db, auth } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { CHARACTER_ALIGNMENTS } from '../lib/constants';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import DrifterBadge from '../components/ui/DrifterBadge';
import RopeDivider from '../components/ui/RopeDivider';
import SheriffStar from '../components/ui/SheriffStar';
import CrossedPistols from '../components/ui/CrossedPistols';
import { Skull, LogOut } from 'lucide-react';

const DANGER_ZONE_MS = 45 * 60 * 1000; // 45 minutes

function isDrifter(profile, tournament) {
  if (!tournament?.details?.startTime || !profile?.stats?.joinedAt) return false;
  const joined = profile.stats.joinedAt.toMillis?.() ?? 0;
  const started = tournament.details.startTime.toMillis?.() ?? 0;
  return joined > started && (profile.stats.matchesPlayed ?? 0) === 0;
}

function isInDangerZone(profile) {
  if (!profile?.stats?.lastMatchTime) return false;
  const last = profile.stats.lastMatchTime.toMillis?.() ?? 0;
  return Date.now() - last > DANGER_ZONE_MS;
}

function getAlignmentLabel(value) {
  return CHARACTER_ALIGNMENTS.find((c) => c.value === value)?.label ?? value;
}

export default function Board() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [players, setPlayers] = useState([]);
  const [tournament, setTournament] = useState(null);

  // Live-sync alive players
  useEffect(() => {
    const q = query(
      collection(db, 'profiles'),
      where('status', '==', 'alive'),
      orderBy('stats.joinedAt', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })));
    });
  }, []);

  // Live-sync active tournament (first result)
  useEffect(() => {
    const q = query(collection(db, 'tournaments'), where('details.status', '==', 'active'));
    return onSnapshot(q, (snap) => {
      setTournament(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  async function handleSignOut() {
    await signOut(auth);
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-charcoal-900 pb-24">
      {/* Tournament banner */}
      {tournament && (
        <div className="bg-blood-800 border-b border-blood-600 px-4 py-2 text-center">
          <p className="font-sans font-bold uppercase tracking-widest text-parchment-200 text-xs">
            {tournament.details.location} &bull; {tournament.details.date}
          </p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="text-center mb-2">
          <CrossedPistols size={56} className="mx-auto mb-1" />
          <h2 className="font-display text-gold-400 text-2xl">Active Roster</h2>
          <p className="section-label text-dust-500 mt-1">
            {players.length} Gunslinger{players.length !== 1 ? 's' : ''} Standing
          </p>
        </div>

        <RopeDivider />

        {/* Player cards */}
        <div className="space-y-3">
          {players.map((p) => {
            const danger = isInDangerZone(p);
            const drifter = isDrifter(p, tournament);
            const isMe = p.uid === userProfile?.uid;

            return (
              <div
                key={p.uid}
                className={`panel flex items-center gap-3 p-3 border
                  ${danger ? 'border-blood-600 animate-pulse-red' : 'border-charcoal-600'}
                  ${isMe ? 'ring-1 ring-gold-500' : ''}`}
              >
                <PlayerAvatar profile={p} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-sans font-bold text-parchment-100 text-sm uppercase tracking-wide truncate">
                      {p.personal?.nickname}
                    </span>
                    {isMe && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gold-600 border border-gold-500
                                       rounded-sm font-sans text-[10px] font-bold uppercase tracking-widest text-charcoal-900">
                        <SheriffStar size={10} /> You
                      </span>
                    )}
                    {drifter && <DrifterBadge />}
                    {danger && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blood-800 border border-blood-600
                                       rounded-sm font-sans text-[10px] font-bold uppercase tracking-widest text-blood-300">
                        ⚠ Danger Zone
                      </span>
                    )}
                  </div>
                  <p className="font-body text-dust-500 text-xs mt-0.5 truncate">
                    {getAlignmentLabel(p.personal?.characterAlign)}
                    {' · '}
                    {p.personal?.handPreference === 'left' ? 'Left-handed' : 'Right-handed'}
                  </p>
                  <p className="font-body text-dust-600 text-xs">
                    {p.stats?.matchesPlayed ?? 0} duel{p.stats?.matchesPlayed !== 1 ? 's' : ''}
                  </p>
                </div>

                <div className="text-dust-600 text-xs font-sans font-bold uppercase tracking-widest">
                  #{players.indexOf(p) + 1}
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <div className="text-center py-12">
              <Skull size={40} className="mx-auto text-dust-600 mb-3" />
              <p className="font-body text-dust-600 uppercase tracking-widest text-sm">
                Nobody's riding in yet
              </p>
            </div>
          )}
        </div>

        <RopeDivider />

        {/* Bottom nav */}
        <div className="flex gap-3">
          <Link to="/boot-hill" className="btn-ghost flex-1 text-center text-sm">
            Boot Hill
          </Link>
          {userProfile?.isAdmin && (
            <Link to="/admin" className="btn-blood flex-1 text-center text-sm">
              Sheriff's Office
            </Link>
          )}
          <button onClick={handleSignOut} className="btn-ghost px-4" title="Sign Out">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
