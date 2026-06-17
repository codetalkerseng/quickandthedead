import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useServerTimeOffset } from '../hooks/useServerTimeOffset';
import CountdownClock from '../components/CountdownClock';
import SafetyGate from '../components/SafetyGate';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import SheriffStar from '../components/ui/SheriffStar';
import RopeDivider from '../components/ui/RopeDivider';
import { ArrowLeft, Trophy } from 'lucide-react';

function PhaseLabel({ phase }) {
  const map = {
    announced: { text: 'Duel Scheduled', color: 'text-dust-400', bg: 'bg-charcoal-800' },
    warning:   { text: 'Approach Staging Area', color: 'text-gold-400', bg: 'bg-charcoal-900' },
    countdown: { text: 'Final Countdown', color: 'text-blood-400', bg: 'bg-charcoal-900' },
    fire:      { text: 'Active Fire!', color: 'text-blood-300', bg: 'bg-blood-900' },
    afterfire: { text: 'Awaiting Result', color: 'text-dust-500', bg: 'bg-charcoal-900' },
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

function ParticipantCard({ profile, label, isWinner }) {
  return (
    <div className={`flex flex-col items-center gap-2 flex-1 p-3 rounded-sm transition-all ${
      isWinner ? 'bg-gold-600/20 border border-gold-500' : ''
    }`}>
      <p className="section-label text-dust-600 text-[10px]">{label}</p>
      <PlayerAvatar profile={profile} size="lg" />
      <p className="font-sans font-bold text-parchment-100 text-sm uppercase tracking-wide text-center">
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

export default function Match() {
  const { matchId } = useParams();
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const serverOffset = useServerTimeOffset();

  const [match, setMatch] = useState(null);
  const [challengerProfile, setChallengerProfile] = useState(null);
  const [defenderProfile, setDefenderProfile] = useState(null);
  const [phase, setPhase] = useState('announced');
  const [showSafety, setShowSafety] = useState(false);

  useEffect(() => {
    return onSnapshot(doc(db, 'matches', matchId), (snap) => {
      if (snap.exists()) setMatch({ id: snap.id, ...snap.data() });
    });
  }, [matchId]);

  // Load participant profiles
  useEffect(() => {
    if (!match) return;
    const unsub1 = onSnapshot(
      doc(db, 'profiles', match.participants.challengerId),
      (s) => s.exists() && setChallengerProfile({ uid: s.id, ...s.data() })
    );
    const unsub2 = onSnapshot(
      doc(db, 'profiles', match.participants.defenderId),
      (s) => s.exists() && setDefenderProfile({ uid: s.id, ...s.data() })
    );
    return () => { unsub1(); unsub2(); };
  }, [match?.participants?.challengerId, match?.participants?.defenderId]);

  if (!match) {
    return (
      <div className="min-h-screen bg-charcoal-900 flex items-center justify-center">
        <SheriffStar size={40} className="animate-pulse" />
      </div>
    );
  }

  const isParticipant =
    userProfile?.uid === match.participants.challengerId ||
    userProfile?.uid === match.participants.defenderId;

  const participantKey =
    userProfile?.uid === match.participants.challengerId ? 'challenger' : 'defender';

  const myReadyKey = `${participantKey}Ready`;
  const iHaveCleared = match.safety?.[myReadyKey] === true;

  const resolved = match.status === 'resolved' || match.status === 'cancelled';
  const winnerId = match.result?.winnerId;

  // Show safety gate for participants during warning/countdown who haven't cleared yet
  const needsSafety = isParticipant && !iHaveCleared && !resolved &&
    (phase === 'warning' || phase === 'countdown');

  const bgClass = phase === 'fire' ? 'bg-blood-950' : 'bg-charcoal-900';

  return (
    <div className={`min-h-screen ${bgClass} transition-colors duration-500`}>
      {needsSafety && (
        <SafetyGate
          matchId={matchId}
          participantKey={participantKey}
          onReady={() => setShowSafety(false)}
        />
      )}

      <PhaseLabel phase={resolved ? 'afterfire' : phase} />

      <div className="max-w-md mx-auto px-4 pt-6 pb-24">
        {/* VS Header */}
        <div className="flex items-stretch gap-2 mb-6">
          <ParticipantCard
            profile={challengerProfile}
            label="Challenger"
            isWinner={resolved && winnerId === match.participants.challengerId}
          />

          <div className="flex flex-col items-center justify-center px-2">
            <SheriffStar size={20} />
            <p className="font-display text-dust-500 text-lg mt-1">VS</p>
          </div>

          <ParticipantCard
            profile={defenderProfile}
            label="Defender"
            isWinner={resolved && winnerId === match.participants.defenderId}
          />
        </div>

        <RopeDivider />

        {/* Clock */}
        {!resolved && match.timing?.scheduledTime && (
          <div className="my-8">
            <CountdownClock
              scheduledTime={match.timing.scheduledTime}
              serverOffset={serverOffset}
              onPhaseChange={setPhase}
            />
          </div>
        )}

        {/* Resolved result */}
        {resolved && (
          <div className="text-center py-6">
            {match.result?.type === 'tie' ? (
              <p className="font-display text-blood-400 text-2xl">Double Elimination</p>
            ) : match.status === 'cancelled' ? (
              <p className="font-display text-dust-500 text-2xl">Duel Cancelled</p>
            ) : (
              <p className="font-display text-gold-400 text-2xl">
                {winnerId === match.participants.challengerId
                  ? match.participants.challengerNickname
                  : match.participants.defenderNickname}{' '}
                Wins
              </p>
            )}
            {match.result?.logMessage && (
              <p className="font-body text-dust-500 text-sm italic mt-2">{match.result.logMessage}</p>
            )}
          </div>
        )}

        {/* Safety status strip for participants */}
        {isParticipant && !resolved && (
          <div className="mt-4 flex gap-2">
            {[
              { key: 'challengerReady', label: match.participants.challengerNickname },
              { key: 'defenderReady',   label: match.participants.defenderNickname },
            ].map(({ key, label }) => (
              <div
                key={key}
                className={`flex-1 text-center py-2 rounded-sm border text-xs font-sans font-bold uppercase tracking-widest ${
                  match.safety?.[key]
                    ? 'bg-blood-900 border-blood-600 text-blood-300'
                    : 'bg-charcoal-800 border-charcoal-600 text-dust-600'
                }`}
              >
                {match.safety?.[key] ? '✓ ' : '○ '}{label}
              </div>
            ))}
          </div>
        )}

        <RopeDivider />

        <button onClick={() => navigate('/board')} className="btn-ghost w-full flex items-center justify-center gap-2 text-sm">
          <ArrowLeft size={14} />
          Back to Roster
        </button>
      </div>
    </div>
  );
}
