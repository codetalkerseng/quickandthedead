import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { CHARACTER_ALIGNMENTS } from '../lib/constants';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import SheriffStar from '../components/ui/SheriffStar';
import RopeDivider from '../components/ui/RopeDivider';
import BulletHole from '../components/ui/BulletHole';

const MEDALS = ['🥇', '🥈', '🥉'];

function alignLabel(v) {
  return CHARACTER_ALIGNMENTS.find((c) => c.value === v)?.label?.split(' — ')[0] ?? v;
}

function RankBadge({ rank }) {
  if (rank <= 3) {
    return (
      <span className="text-xl leading-none flex-shrink-0 w-8 text-center">
        {MEDALS[rank - 1]}
      </span>
    );
  }
  return (
    <span className="font-sans font-bold text-dust-600 text-sm w-8 text-center flex-shrink-0">
      #{rank}
    </span>
  );
}

function PlayerRow({ rank, profile, showStatus = false }) {
  const wins    = profile.stats?.wins ?? 0;
  const duels   = profile.stats?.matchesPlayed ?? 0;
  const alive   = profile.status === 'alive';

  return (
    <div className={`flex items-center gap-3 p-3 rounded-sm border transition-colors ${
      rank === 1
        ? 'bg-gold-600/10 border-gold-600/40'
        : alive
        ? 'bg-charcoal-800 border-charcoal-700'
        : 'bg-charcoal-800/50 border-charcoal-800 opacity-70'
    }`}>
      <RankBadge rank={rank} />

      <div className="relative flex-shrink-0">
        <PlayerAvatar profile={profile} size="md" />
        {!alive && (
          <BulletHole size={20} className="absolute -bottom-1 -right-1" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`font-sans font-bold text-sm uppercase tracking-wide truncate ${
            alive ? 'text-parchment-100' : 'text-dust-500 line-through'
          }`}>
            {profile.personal?.nickname}
          </span>
          {alive && (
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-charcoal-700 border border-charcoal-600
                             rounded-sm font-sans text-[9px] font-bold uppercase tracking-widest text-dust-400">
              Still Standing
            </span>
          )}
          {profile.status === 'disqualified' && (
            <span className="inline-flex items-center px-1.5 py-0.5 bg-blood-900 border border-blood-800
                             rounded-sm font-sans text-[9px] font-bold uppercase tracking-widest text-blood-500">
              DQ
            </span>
          )}
        </div>
        <p className="font-body text-dust-600 text-xs truncate mt-0.5">
          {alignLabel(profile.personal?.characterAlign)}
        </p>
      </div>

      <div className="text-right flex-shrink-0 min-w-[48px]">
        <p className="font-display text-gold-400 text-2xl leading-none">{wins}</p>
        <p className="font-sans text-dust-500 text-[10px] uppercase tracking-wide mt-0.5">
          {wins === 1 ? 'win' : 'wins'}
        </p>
        <p className="font-body text-dust-700 text-[9px] mt-0.5">{duels} duels</p>
      </div>
    </div>
  );
}

export default function Leaderboard() {
  const [players, setPlayers]       = useState([]);
  const [tournament, setTournament] = useState(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'profiles'), orderBy('stats.joinedAt', 'asc')),
      (snap) => setPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })))
    );
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'tournaments'), where('details.status', '==', 'active'));
    return onSnapshot(q, (snap) => {
      setTournament(snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, []);

  // Sort: alive first, then by wins desc, then duels desc
  const sorted = [...players].sort((a, b) => {
    const aAlive = a.status === 'alive' ? 1 : 0;
    const bAlive = b.status === 'alive' ? 1 : 0;
    if (bAlive !== aAlive) return bAlive - aAlive;
    const wDiff = (b.stats?.wins ?? 0) - (a.stats?.wins ?? 0);
    if (wDiff !== 0) return wDiff;
    return (b.stats?.matchesPlayed ?? 0) - (a.stats?.matchesPlayed ?? 0);
  });

  const alive  = sorted.filter((p) => p.status === 'alive');
  const fallen = sorted.filter((p) => p.status !== 'alive');

  return (
    <div className="min-h-screen bg-charcoal-900 pb-24">
      {/* Tournament banner */}
      {tournament && (
        <div className="bg-blood-900 border-b border-blood-700 px-4 py-2 text-center">
          <p className="font-sans font-bold uppercase tracking-widest text-blood-200 text-xs">
            {tournament.details?.name ?? 'Tournament'} · {tournament.details?.location ?? ''}
          </p>
        </div>
      )}

      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <div className="text-center mb-2">
          <SheriffStar size={40} className="mx-auto mb-2" />
          <h2 className="font-display text-gold-400 text-2xl">Standings</h2>
          <p className="section-label text-dust-500 mt-1">
            {alive.length} Still Standing · {fallen.length} Fallen
          </p>
        </div>

        {/* Win column header */}
        <div className="flex items-center justify-end pr-1 mb-1">
          <span className="section-label text-gold-600 text-[10px]">WINS</span>
        </div>

        {/* Alive section */}
        {alive.length > 0 && (
          <div className="space-y-2 mb-4">
            {alive.map((p, i) => (
              <PlayerRow key={p.uid} rank={i + 1} profile={p} />
            ))}
          </div>
        )}

        {/* Boot Hill section */}
        {fallen.length > 0 && (
          <>
            <RopeDivider />
            <p className="section-label text-dust-600 mb-2">Boot Hill</p>
            <div className="space-y-2">
              {fallen.map((p, i) => (
                <PlayerRow key={p.uid} rank={alive.length + i + 1} profile={p} />
              ))}
            </div>
          </>
        )}

        {players.length === 0 && (
          <div className="text-center py-12">
            <p className="font-body text-dust-600 uppercase tracking-widest text-sm">
              No gunslingers registered yet
            </p>
          </div>
        )}

        {/* Prizes */}
        {tournament?.prizes?.length > 0 && (
          <>
            <RopeDivider />
            <p className="section-label text-gold-600 mb-3">Prizes</p>
            <div className="space-y-2">
              {tournament.prizes.map((prize, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-charcoal-800 border border-charcoal-700 rounded-sm">
                  <span className="font-sans font-bold text-gold-400 text-sm flex-shrink-0 w-20 truncate">
                    {prize.title}
                  </span>
                  <span className="font-body text-dust-400 text-sm">{prize.description}</span>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
