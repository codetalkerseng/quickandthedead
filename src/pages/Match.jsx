import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, onSnapshot, collection, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useServerTimeOffset } from '../hooks/useServerTimeOffset';
import { resolveMatch } from '../lib/matchUtils';
import CountdownClock from '../components/CountdownClock';
import SafetyGate from '../components/SafetyGate';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import SheriffStar from '../components/ui/SheriffStar';
import RopeDivider from '../components/ui/RopeDivider';
import { ArrowLeft, Trophy } from 'lucide-react';

// ─── Sub-components ──────────────────────────────────────────────────────────

function PhaseLabel({ phase }) {
  const map = {
    announced: { text: 'Duel Scheduled',         color: 'text-dust-400',   bg: 'bg-charcoal-800' },
    warning:   { text: 'Approach Staging Area',   color: 'text-gold-400',   bg: 'bg-charcoal-900' },
    countdown: { text: 'Final Countdown',         color: 'text-blood-400',  bg: 'bg-charcoal-900' },
    fire:      { text: 'Active Fire!',            color: 'text-blood-300',  bg: 'bg-blood-900'    },
    afterfire: { text: 'Awaiting Result',         color: 'text-dust-500',   bg: 'bg-charcoal-900' },
  };
  const info = map[phase] ?? map.announced;
  return (
    <div className={`${info.bg} px-4 py-2 text-center border-b border-charcoal-600`}>
      <p className={`font-sans font-bold uppercase tracking-widest text-xs ${info.color}`}>
        {info.text}
      </p>
    </div>
  );
}

function ParticipantCard({ profile, label, isWinner, large }) {
  return (
    <div className={`flex flex-col items-center gap-1 flex-1 p-2 rounded-sm transition-all ${
      isWinner ? 'bg-gold-600/20 border border-gold-500' : ''
    }`}>
      <p className="font-sans font-bold text-dust-400 text-xs uppercase tracking-widest">{label}</p>
      <PlayerAvatar profile={profile} size={large ? 'lg' : 'md'} />
      <p className={`font-sans font-bold text-parchment-100 uppercase tracking-wide text-center truncate w-full ${large ? 'text-base' : 'text-sm'}`}>
        {profile?.personal?.nickname ?? '…'}
      </p>
      {isWinner && (
        <div className="flex items-center gap-1">
          <Trophy size={12} className="text-gold-400" />
          <span className="font-sans text-gold-400 text-[10px] font-bold uppercase tracking-widest">Winner</span>
        </div>
      )}
    </div>
  );
}

// Resolve controls — shown to admins when match is unresolved
function AdminResolveControls({ match, onResolved }) {
  const [busy, setBusy] = useState(null);

  async function handle(type, winnerId = null) {
    setBusy(type + (winnerId ?? ''));
    try {
      await resolveMatch(match, type, winnerId);
      onResolved?.();
    } finally {
      setBusy(null);
    }
  }

  const cId   = match.participants.challengerId;
  const dId   = match.participants.defenderId;
  const cNick = match.participants.challengerNickname;
  const dNick = match.participants.defenderNickname;
  const isBusy = busy !== null;

  return (
    <div className="bg-charcoal-800 border-t-2 border-blood-700 p-4">
      <p className="section-label text-blood-500 mb-3 text-center">Sheriff — Resolve Match</p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handle('win', cId)}
          disabled={isBusy}
          className="btn-blood text-xs py-3 truncate"
        >
          ✓ {cNick}
        </button>
        <button
          onClick={() => handle('win', dId)}
          disabled={isBusy}
          className="btn-blood text-xs py-3 truncate"
        >
          ✓ {dNick}
        </button>
        <button
          onClick={() => handle('yield', dId)}
          disabled={isBusy}
          className="btn-ghost text-xs py-2"
        >
          {cNick} Yields
        </button>
        <button
          onClick={() => handle('yield', cId)}
          disabled={isBusy}
          className="btn-ghost text-xs py-2"
        >
          {dNick} Yields
        </button>
        <button
          onClick={() => handle('tie')}
          disabled={isBusy}
          className="bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-500 text-dust-300
                     font-sans font-bold uppercase tracking-widest text-xs py-2 rounded-sm transition-colors"
        >
          Tie / Double Elim
        </button>
        <button
          onClick={() => handle('cancel')}
          disabled={isBusy}
          className="bg-transparent hover:bg-charcoal-700 border border-charcoal-600 text-dust-600
                     font-sans font-bold uppercase tracking-widest text-xs py-2 rounded-sm transition-colors"
        >
          Cancel
        </button>
      </div>
      {isBusy && (
        <p className="font-body text-dust-500 text-xs text-center mt-2">Updating records…</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Match() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const serverOffset = useServerTimeOffset();

  const [match, setMatch]                         = useState(null);
  const [challengerProfile, setChallengerProfile] = useState(null);
  const [defenderProfile,   setDefenderProfile]   = useState(null);
  const [phase, setPhase]                         = useState('announced');

  // Always track the soonest upcoming match
  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      where('status', '==', 'scheduled'),
      orderBy('timing.scheduledTime', 'asc'),
      limit(1)
    );
    return onSnapshot(q, (snap) => {
      setMatch(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  useEffect(() => {
    if (!match) return;
    const u1 = onSnapshot(doc(db, 'profiles', match.participants.challengerId),
      (s) => s.exists() && setChallengerProfile({ uid: s.id, ...s.data() }));
    const u2 = onSnapshot(doc(db, 'profiles', match.participants.defenderId),
      (s) => s.exists() && setDefenderProfile({ uid: s.id, ...s.data() }));
    return () => { u1(); u2(); };
  }, [match?.participants?.challengerId, match?.participants?.defenderId]);

  if (!match) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex flex-col items-center justify-center gap-4">
        <SheriffStar size={40} className="text-dust-700" />
        <p className="font-body text-dust-600 uppercase tracking-widest text-sm">No match scheduled</p>
      </div>
    );
  }

  const isParticipant =
    userProfile?.uid === match.participants.challengerId ||
    userProfile?.uid === match.participants.defenderId;
  const isAdmin = userProfile?.isAdmin === true;

  const participantKey = userProfile?.uid === match.participants.challengerId ? 'challenger' : 'defender';
  const iHaveCleared   = match.safety?.[`${participantKey}Ready`] === true;

  const resolved = match.status === 'resolved' || match.status === 'cancelled';
  const winnerId = match.result?.winnerId;

  const needsSafety = isParticipant && !iHaveCleared && !resolved &&
    (phase === 'warning' || phase === 'countdown');

  // Show admin controls once fire phase begins (or during after-fire) if not yet resolved
  const showAdminControls = isAdmin && !resolved &&
    (phase === 'fire' || phase === 'afterfire' || phase === 'countdown');

  const bgClass = phase === 'fire' ? 'bg-blood-950' : 'bg-charcoal-900';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-500 flex flex-col`}>
      {needsSafety && (
        <SafetyGate
          matchId={matchId}
          participantKey={participantKey}
          onReady={() => {}}
        />
      )}

      <PhaseLabel phase={resolved ? (match.status === 'cancelled' ? 'afterfire' : 'afterfire') : phase} />

      {/* Participants */}
      <div className="flex items-stretch gap-2 px-4 pt-4 max-w-lg mx-auto w-full">
        <ParticipantCard
          profile={challengerProfile}
          label="Challenger"
          isWinner={resolved && winnerId === match.participants.challengerId}
          large
        />
        <div className="flex flex-col items-center justify-center px-2 flex-shrink-0">
          <SheriffStar size={18} />
          <p className="font-display text-dust-600 text-sm mt-1">VS</p>
        </div>
        <ParticipantCard
          profile={defenderProfile}
          label="Defender"
          isWinner={resolved && winnerId === match.participants.defenderId}
          large
        />
      </div>

      {/* ── BIG CLOCK ── */}
      {!resolved && match.timing?.scheduledTime && (
        <div className="flex-1 flex items-center justify-center px-4 py-6">
          <CountdownClock
            scheduledTime={match.timing.scheduledTime}
            startTime={match.timing.createdAt}
            tournamentTime={match.timing.scheduledTime}
            serverOffset={serverOffset}
            onPhaseChange={setPhase}
            large
          />
        </div>
      )}

      {/* Resolved result */}
      {resolved && (
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            {match.result?.type === 'tie' ? (
              <p className="font-display text-blood-400 text-4xl">Double Elimination</p>
            ) : match.status === 'cancelled' ? (
              <p className="font-display text-dust-500 text-4xl">Duel Cancelled</p>
            ) : (
              <p className="font-display text-gold-400 text-4xl">
                {winnerId === match.participants.challengerId
                  ? match.participants.challengerNickname
                  : match.participants.defenderNickname}{' '}
                Wins
              </p>
            )}
            {match.result?.logMessage && (
              <p className="font-body text-dust-500 text-sm italic mt-3">{match.result.logMessage}</p>
            )}
          </div>
        </div>
      )}

      {/* Safety status strip — visible to all */}
      {!resolved && (
        <div className="px-4 pb-2 max-w-lg mx-auto w-full">
          <p className="section-label text-dust-700 text-center mb-1">Safety Check</p>
          <div className="flex gap-2">
            {[
              { key: 'challengerReady', label: match.participants.challengerNickname },
              { key: 'defenderReady',   label: match.participants.defenderNickname },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex-1 text-center py-1.5 rounded-sm border text-xs font-sans font-bold uppercase tracking-widest ${
                  match.safety?.[key]
                    ? 'bg-blood-900 border-blood-600 text-blood-300'
                    : 'bg-charcoal-800 border-charcoal-500 text-dust-400'
                }`}
              >
                {match.safety?.[key] ? '✓ ' : '○ '}{label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin resolve controls */}
      {showAdminControls && (
        <AdminResolveControls match={match} onResolved={() => {}} />
      )}

      {/* Back button — sticky at very bottom */}
      <div className="px-4 py-3 border-t border-charcoal-700 max-w-lg mx-auto w-full">
        <button
          onClick={() => navigate('/board')}
          className="btn-ghost w-full flex items-center justify-center gap-2 text-sm"
        >
          <ArrowLeft size={14} /> Back to Roster
        </button>
      </div>
    </div>
  );
}
