import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
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
import TownCrier from '../components/TownCrier';
import { Skull, LogOut, Swords, X, Clock } from 'lucide-react';

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const DANGER_ZONE_MS = 45 * 60 * 1000;
const DEFAULT_MATCH_DELAY_MS = 10 * 60 * 1000; // 10 min until draw

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
  const [activeMatches, setActiveMatches] = useState([]);
  const [selected, setSelected] = useState(null); // uid of challenged player
  const [calling, setCalling] = useState(false);

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

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), where('details.status', '==', 'active'));
    return onSnapshot(q, (snap) => {
      setTournament(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  // Watch for matches involving the current user
  useEffect(() => {
    if (!userProfile?.uid) return;
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['scheduled', 'warning', 'active'])
    );
    return onSnapshot(q, (snap) => {
      setActiveMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [userProfile?.uid]);

  async function callOut(defender) {
    if (calling || !userProfile) return;
    setCalling(true);

    const scheduledTime = Timestamp.fromMillis(Date.now() + DEFAULT_MATCH_DELAY_MS);

    try {
      const ref = await addDoc(collection(db, 'matches'), {
        participants: {
          challengerId: userProfile.uid,
          challengerNickname: userProfile.personal.nickname,
          defenderId: defender.uid,
          defenderNickname: defender.personal.nickname,
        },
        timing: {
          scheduledTime,
          createdAt: serverTimestamp(),
        },
        status: 'scheduled',
        safety: {
          challengerReady: false,
          defenderReady: false,
        },
        result: null,
      });
      setSelected(null);
      navigate(`/match/${ref.id}`);
    } catch (err) {
      console.error(err);
      setCalling(false);
    }
  }

  async function handleSignOut() {
    await signOut(auth);
    navigate('/login');
  }

  // Find any match the current user is already in
  const myMatch = activeMatches.find(
    (m) =>
      m.participants.challengerId === userProfile?.uid ||
      m.participants.defenderId === userProfile?.uid
  );

  const selectedPlayer = players.find((p) => p.uid === selected);

  return (
    <div className="min-h-screen bg-charcoal-900 pb-24">
      <TownCrier />

      {/* My active match banner */}
      {myMatch && (
        <button
          onClick={() => navigate(`/match/${myMatch.id}`)}
          className="w-full bg-blood-800 border-b border-blood-600 px-4 py-2 text-center"
        >
          <p className="font-sans font-bold uppercase tracking-widest text-blood-200 text-xs animate-pulse">
            ⚡ Your duel is on —{' '}
            {myMatch.participants.challengerNickname} vs {myMatch.participants.defenderNickname} — Tap to enter
          </p>
        </button>
      )}

      {/* Tournament banner */}
      {tournament && !myMatch && (
        <div className="bg-charcoal-800 border-b border-charcoal-600 px-4 py-2 text-center">
          <p className="font-sans font-bold uppercase tracking-widest text-dust-500 text-xs">
            {tournament.details.location} &bull; {tournament.details.date}
          </p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6">
        <div className="text-center mb-2">
          <CrossedPistols size={56} className="mx-auto mb-1" />
          <h2 className="font-display text-gold-400 text-2xl">Active Roster</h2>
          <p className="section-label text-dust-500 mt-1">
            {players.length} Gunslinger{players.length !== 1 ? 's' : ''} Standing
          </p>
        </div>

        <RopeDivider />

        {/* Call-out confirmation sheet */}
        {selectedPlayer && (
          <div className="mb-4 bg-charcoal-800 border-2 border-gold-600 rounded-sm p-4">
            <div className="flex items-center gap-3 mb-3">
              <PlayerAvatar profile={selectedPlayer} size="md" />
              <div>
                <p className="font-sans font-bold text-parchment-100 text-sm uppercase tracking-wide">
                  {selectedPlayer.personal?.nickname}
                </p>
                <p className="font-body text-dust-500 text-xs">
                  {getAlignmentLabel(selectedPlayer.personal?.characterAlign)}
                </p>
              </div>
              <button onClick={() => setSelected(null)} className="ml-auto text-dust-600 hover:text-dust-300">
                <X size={18} />
              </button>
            </div>
            <button
              onClick={() => callOut(selectedPlayer)}
              disabled={calling}
              className="btn-blood w-full flex items-center justify-center gap-2"
            >
              <Swords size={16} />
              {calling ? 'Sending Challenge…' : `CALL OUT ${selectedPlayer.personal?.nickname?.toUpperCase()}`}
            </button>
            <p className="font-body text-dust-600 text-xs text-center mt-2">
              Draw in 10 minutes — no refusals.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {players.map((p) => {
            const danger = isInDangerZone(p);
            const drifter = isDrifter(p, tournament);
            const isMe = p.uid === userProfile?.uid;
            const inMatch = activeMatches.some(
              (m) => m.participants.challengerId === p.uid || m.participants.defenderId === p.uid
            );
            const isSelected = selected === p.uid;

            return (
              <button
                key={p.uid}
                onClick={() => {
                  if (isMe || inMatch) return;
                  setSelected(isSelected ? null : p.uid);
                }}
                disabled={isMe || inMatch}
                className={`w-full panel flex items-center gap-3 p-3 border text-left transition-all
                  ${danger ? 'border-blood-600 animate-pulse-red' : 'border-charcoal-600'}
                  ${isMe ? 'ring-1 ring-gold-500 cursor-default' : ''}
                  ${isSelected ? 'border-gold-500 bg-charcoal-700' : ''}
                  ${!isMe && !inMatch ? 'hover:border-dust-400 active:scale-[0.99] cursor-pointer' : ''}
                  ${inMatch ? 'opacity-60 cursor-default' : ''}`}
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
                    {inMatch && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blood-900 border border-blood-700
                                       rounded-sm font-sans text-[10px] font-bold uppercase tracking-widest text-blood-300">
                        In Duel
                      </span>
                    )}
                    {drifter && <DrifterBadge />}
                    {danger && !inMatch && (
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

                {!isMe && !inMatch && (
                  <Swords size={14} className={isSelected ? 'text-gold-400' : 'text-dust-700'} />
                )}
              </button>
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

        {/* Upcoming Duels */}
        {activeMatches.length > 0 && (
          <>
            <RopeDivider />
            <p className="section-label text-dust-500 mb-3">
              <Clock size={11} className="inline mr-1 -mt-px" />
              Scheduled Duels ({activeMatches.length})
            </p>
            <div className="space-y-2 mb-4">
              {[...activeMatches]
                .sort((a, b) =>
                  (a.timing?.scheduledTime?.toMillis() ?? 0) -
                  (b.timing?.scheduledTime?.toMillis() ?? 0)
                )
                .map((m) => (
                  <button
                    key={m.id}
                    onClick={() => navigate(`/match/${m.id}`)}
                    className="w-full panel flex items-center gap-3 p-3 border border-charcoal-600
                               hover:border-dust-400 text-left transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-bold text-parchment-100 text-sm uppercase tracking-wide truncate">
                        {m.participants.challengerNickname}
                        <span className="text-dust-600 font-normal mx-1">vs</span>
                        {m.participants.defenderNickname}
                      </p>
                    </div>
                    <span className="font-body text-gold-500 text-xs flex-shrink-0">
                      {fmtTime(m.timing?.scheduledTime)}
                    </span>
                    <Swords size={12} className="text-dust-700 flex-shrink-0" />
                  </button>
                ))}
            </div>
          </>
        )}

        <RopeDivider />

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
