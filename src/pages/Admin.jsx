import { useEffect, useState } from 'react';
import {
  collection, query, where, onSnapshot, doc,
  writeBatch, serverTimestamp, increment, Timestamp,
  addDoc, setDoc, getDoc, orderBy,
} from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import PlayerAvatar from '../components/ui/PlayerAvatar';
import SheriffStar from '../components/ui/SheriffStar';
import RopeDivider from '../components/ui/RopeDivider';
import CrossedPistols from '../components/ui/CrossedPistols';
import { Shield, Clock, Users, Trophy, Trash2, Swords, Plus, Minus, AlertTriangle, ArrowLeft } from 'lucide-react';

// ─── Utility ─────────────────────────────────────────────────────────────────

function fmtTime(ts) {
  if (!ts) return '—';
  return new Date(ts.toMillis()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function AdminTab({ label, icon: Icon, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center gap-1 py-3 text-xs font-sans font-bold uppercase tracking-widest transition-colors border-b-2 ${
        active
          ? 'border-blood-500 text-blood-300'
          : 'border-transparent text-dust-600 hover:text-dust-300'
      }`}
    >
      <Icon size={16} />
      {label}
    </button>
  );
}

// ─── Resolve Match Panel ──────────────────────────────────────────────────────

function MatchesPanel() {
  const [matches, setMatches] = useState([]);
  const [profiles, setProfiles] = useState({});
  const [busy, setBusy] = useState(null);
  const [adjusting, setAdjusting] = useState(null); // matchId being time-adjusted
  const [deltaMin, setDeltaMin] = useState(0);

  useEffect(() => {
    const q = query(
      collection(db, 'matches'),
      where('status', 'in', ['scheduled', 'warning', 'active']),
      orderBy('timing.scheduledTime', 'asc')
    );
    return onSnapshot(q, (snap) => {
      setMatches(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  // Load all referenced profiles in one go
  useEffect(() => {
    const uids = new Set();
    matches.forEach((m) => {
      uids.add(m.participants.challengerId);
      uids.add(m.participants.defenderId);
    });
    uids.forEach((uid) => {
      if (profiles[uid]) return;
      getDoc(doc(db, 'profiles', uid)).then((s) => {
        if (s.exists()) setProfiles((p) => ({ ...p, [uid]: { uid: s.id, ...s.data() } }));
      });
    });
  }, [matches]);

  async function resolve(match, type, winnerId = null) {
    setBusy(match.id);
    const batch = writeBatch(db);

    const cId = match.participants.challengerId;
    const dId = match.participants.defenderId;
    const cNick = match.participants.challengerNickname;
    const dNick = match.participants.defenderNickname;
    const wNick = winnerId === cId ? cNick : dNick;
    const lNick = wNick === cNick ? dNick : cNick;

    const logMessage =
      type === 'tie'   ? `Double Elimination — ${cNick} and ${dNick} both fall!` :
      type === 'yield' ? `${lNick} yields to ${wNick}!` :
      type === 'cancel' ? `The duel between ${cNick} and ${dNick} was cancelled.` :
                          `${wNick} sends ${lNick} to Boot Hill!`;

    batch.update(doc(db, 'matches', match.id), {
      status: type === 'cancel' ? 'cancelled' : 'resolved',
      result: { winnerId, type, logMessage },
    });

    if (type === 'cancel') {
      await batch.commit();
      setBusy(null);
      return;
    }

    const now = serverTimestamp();

    if (type === 'tie') {
      [{ id: cId, opp: dNick }, { id: dId, opp: cNick }].forEach(({ id, opp }) => {
        batch.update(doc(db, 'profiles', id), {
          status: 'eliminated',
          'stats.matchesPlayed': increment(1),
          'stats.lastMatchTime': now,
          'stats.lastOpponentNickname': opp,
        });
      });
    } else {
      const loserId = winnerId === cId ? dId : cId;
      const winnerOpp = winnerId === cId ? dNick : cNick;
      const loserOpp = winnerId === cId ? cNick : dNick;

      batch.update(doc(db, 'profiles', winnerId), {
        'stats.matchesPlayed': increment(1),
        'stats.lastMatchTime': now,
        'stats.lastOpponentNickname': winnerOpp,
      });
      batch.update(doc(db, 'profiles', loserId), {
        status: 'eliminated',
        'stats.matchesPlayed': increment(1),
        'stats.lastMatchTime': now,
        'stats.lastOpponentNickname': loserOpp,
      });
    }

    await batch.commit();
    setBusy(null);
  }

  async function adjustClock(match) {
    if (!deltaMin) return;
    const currentMs = match.timing.scheduledTime.toMillis();
    const newMs = currentMs + deltaMin * 60_000;
    await writeBatch(db)
      .update(doc(db, 'matches', match.id), {
        'timing.scheduledTime': Timestamp.fromMillis(newMs),
      })
      .commit()
      .then(() => { setAdjusting(null); setDeltaMin(0); });
  }

  async function fireNow(match) {
    await writeBatch(db)
      .update(doc(db, 'matches', match.id), {
        'timing.scheduledTime': Timestamp.fromMillis(Date.now() + 3000),
      })
      .commit();
  }

  if (matches.length === 0) {
    return (
      <div className="text-center py-12">
        <Swords size={32} className="mx-auto text-dust-700 mb-3" />
        <p className="font-body text-dust-600 text-sm uppercase tracking-widest">No active matches</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {matches.map((m) => {
        const cProf = profiles[m.participants.challengerId];
        const dProf = profiles[m.participants.defenderId];
        const isBusy = busy === m.id;

        return (
          <div key={m.id} className="bg-charcoal-800 border border-charcoal-600 rounded-sm p-4">
            {/* VS strip */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <PlayerAvatar profile={cProf} size="sm" />
                <span className="font-sans font-bold text-parchment-100 text-sm truncate">
                  {m.participants.challengerNickname}
                </span>
              </div>
              <span className="font-display text-dust-600 text-xs flex-shrink-0">VS</span>
              <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                <span className="font-sans font-bold text-parchment-100 text-sm truncate text-right">
                  {m.participants.defenderNickname}
                </span>
                <PlayerAvatar profile={dProf} size="sm" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <span className="section-label">Draw: {fmtTime(m.timing?.scheduledTime)}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setAdjusting(adjusting === m.id ? null : m.id)}
                  className="btn-ghost px-2 py-1 text-xs flex items-center gap-1"
                >
                  <Clock size={12} /> Clock
                </button>
                <button
                  onClick={() => fireNow(m)}
                  className="px-2 py-1 text-xs font-sans font-bold uppercase tracking-widest rounded-sm
                             border border-blood-600 text-blood-400 hover:bg-blood-900 transition-colors"
                >
                  Fire Now
                </button>
              </div>
            </div>

            {/* Clock adjuster */}
            {adjusting === m.id && (
              <div className="mb-3 flex items-center gap-2 bg-charcoal-900 p-2 rounded-sm">
                <button onClick={() => setDeltaMin((d) => d - 1)} className="text-dust-400 hover:text-parchment-100">
                  <Minus size={16} />
                </button>
                <span className="font-sans text-parchment-100 text-sm flex-1 text-center">
                  {deltaMin >= 0 ? '+' : ''}{deltaMin} min
                </span>
                <button onClick={() => setDeltaMin((d) => d + 1)} className="text-dust-400 hover:text-parchment-100">
                  <Plus size={16} />
                </button>
                <button onClick={() => adjustClock(m)} className="btn-gold px-3 py-1 text-xs">
                  Apply
                </button>
              </div>
            )}

            {/* Resolve buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => resolve(m, 'win', m.participants.challengerId)}
                disabled={isBusy}
                className="btn-blood text-xs py-2 truncate"
              >
                ✓ {m.participants.challengerNickname}
              </button>
              <button
                onClick={() => resolve(m, 'win', m.participants.defenderId)}
                disabled={isBusy}
                className="btn-blood text-xs py-2 truncate"
              >
                ✓ {m.participants.defenderNickname}
              </button>
              <button
                onClick={() => resolve(m, 'yield', m.participants.defenderId)}
                disabled={isBusy}
                className="btn-ghost text-xs py-2"
              >
                {m.participants.challengerNickname} Yields
              </button>
              <button
                onClick={() => resolve(m, 'yield', m.participants.challengerId)}
                disabled={isBusy}
                className="btn-ghost text-xs py-2"
              >
                {m.participants.defenderNickname} Yields
              </button>
              <button
                onClick={() => resolve(m, 'tie', null)}
                disabled={isBusy}
                className="bg-charcoal-700 hover:bg-charcoal-600 border border-charcoal-500 text-dust-300
                           font-sans font-bold uppercase tracking-widest text-xs py-2 rounded-sm transition-colors"
              >
                Tie / Double Elim
              </button>
              <button
                onClick={() => resolve(m, 'cancel', null)}
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
      })}
    </div>
  );
}

// ─── Tournament Panel ─────────────────────────────────────────────────────────

const EMPTY_FORM = {
  name: 'Redemption Quick-Draw Tournament',
  date: '', time: '', location: '', status: 'upcoming', rules: '',
};
const EMPTY_PRIZES = [{ title: '1st Place', description: '' }];

// Shared input classes — NO w-full so they don't fight flex-1 in prize rows
const inputBase = `bg-charcoal-900 border border-charcoal-600 text-parchment-100
                   font-body px-3 py-2 rounded-sm focus:outline-none focus:border-gold-500
                   placeholder-dust-700`;
const inputFull = `w-full ${inputBase}`;

function statusBadge(status) {
  if (status === 'active') return 'bg-blood-900 text-blood-300 border-blood-700';
  if (status === 'ended')  return 'bg-charcoal-700 text-dust-600 border-charcoal-600';
  return 'bg-charcoal-800 text-dust-400 border-charcoal-600';
}

function TournamentEdit({ tournamentId, initialData, onBack }) {
  const isNew = !tournamentId;
  const [form, setForm] = useState(
    initialData
      ? {
          name: initialData.details?.name ?? EMPTY_FORM.name,
          date: initialData.details?.date ?? '',
          time: initialData.details?.time ?? '',
          location: initialData.details?.location ?? '',
          status: initialData.details?.status ?? 'upcoming',
          rules: initialData.details?.rules ?? '',
        }
      : { ...EMPTY_FORM }
  );
  const [prizes, setPrizes] = useState(
    initialData?.prizes?.map((p) => ({ title: p.title ?? '', description: p.description ?? '' }))
    ?? [...EMPTY_PRIZES]
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function setField(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function setPrize(i, k, v) {
    setPrizes((p) => p.map((item, idx) => idx === i ? { ...item, [k]: v } : item));
  }
  function addPrize() { setPrizes((p) => [...p, { title: '', description: '' }]); }
  function removePrize(i) { setPrizes((p) => p.filter((_, idx) => idx !== i)); }

  async function save() {
    setSaving(true);
    const wasAlreadyActive = initialData?.details?.status === 'active';
    const goingActive = form.status === 'active' && !wasAlreadyActive;
    const data = {
      details: {
        name: form.name,
        date: form.date,
        time: form.time,
        location: form.location,
        status: form.status,
        rules: form.rules,
        ...(goingActive ? { startTime: serverTimestamp() } : {}),
      },
      prizes,
    };
    if (isNew) {
      await addDoc(collection(db, 'tournaments'), data);
    } else {
      await writeBatch(db).update(doc(db, 'tournaments', tournamentId), data).commit();
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); onBack(); }, 1200);
  }

  async function deleteTournament() {
    if (!window.confirm('Delete this tournament? This cannot be undone.')) return;
    setDeleting(true);
    await writeBatch(db).delete(doc(db, 'tournaments', tournamentId)).commit();
    onBack();
  }

  return (
    <div className="space-y-5">
      <button onClick={onBack} className="btn-ghost px-3 py-1 text-xs flex items-center gap-1">
        <ArrowLeft size={12} /> All Tournaments
      </button>

      <div>
        <label className="section-label block mb-1">Tournament Name</label>
        <input value={form.name} onChange={(e) => setField('name', e.target.value)} className={inputFull} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="section-label block mb-1">Date</label>
          <input type="date" value={form.date} onChange={(e) => setField('date', e.target.value)} className={inputFull} />
        </div>
        <div>
          <label className="section-label block mb-1">Time</label>
          <input type="time" value={form.time} onChange={(e) => setField('time', e.target.value)} className={inputFull} />
        </div>
      </div>

      <div>
        <label className="section-label block mb-1">Location</label>
        <input value={form.location} onChange={(e) => setField('location', e.target.value)}
          placeholder="Redemption Airsoft Field" className={inputFull} />
      </div>

      <div>
        <label className="section-label block mb-1">Status</label>
        <select value={form.status} onChange={(e) => setField('status', e.target.value)} className={inputFull}>
          <option value="upcoming">Upcoming</option>
          <option value="active">Active — starts Drifter clock</option>
          <option value="ended">Ended</option>
        </select>
        {form.status === 'active' && initialData?.details?.status !== 'active' && (
          <p className="font-body text-gold-600 text-xs mt-1">
            ⚠ Saving as Active records the tournament start time for the Drifter clock.
          </p>
        )}
      </div>

      <div>
        <label className="section-label block mb-1">House Rules</label>
        <textarea
          value={form.rules}
          onChange={(e) => setField('rules', e.target.value)}
          rows={3}
          placeholder="Any special rules for this event…"
          className={`${inputFull} resize-none`}
        />
      </div>

      <RopeDivider />

      {/* Prizes — uses inputBase (no w-full) to avoid flex conflict */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="section-label">Prizes</label>
          <button onClick={addPrize} className="btn-ghost px-2 py-1 text-xs flex items-center gap-1">
            <Plus size={12} /> Add
          </button>
        </div>
        <div className="space-y-2">
          {prizes.map((prize, i) => (
            <div key={i} className="flex gap-2 items-center">
              <input
                value={prize.title}
                onChange={(e) => setPrize(i, 'title', e.target.value)}
                placeholder="Place / title"
                className={`${inputBase} w-28 flex-shrink-0`}
              />
              <input
                value={prize.description}
                onChange={(e) => setPrize(i, 'description', e.target.value)}
                placeholder="Prize description"
                className={`${inputBase} flex-1 min-w-0`}
              />
              <button
                onClick={() => removePrize(i)}
                className="text-dust-700 hover:text-blood-400 flex-shrink-0"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving || saved} className="btn-gold w-full">
        {saving ? 'Saving…' : saved ? '✓ Saved' : isNew ? 'Create Tournament' : 'Save Changes'}
      </button>

      {!isNew && (
        <button
          onClick={deleteTournament}
          disabled={deleting}
          className="w-full py-2 text-xs font-sans font-bold uppercase tracking-widest text-blood-500
                     hover:text-blood-300 transition-colors border border-transparent hover:border-blood-800
                     rounded-sm"
        >
          {deleting ? 'Deleting…' : 'Delete Tournament'}
        </button>
      )}
    </div>
  );
}

function TournamentPanel() {
  const [tournaments, setTournaments] = useState([]);
  const [editingId, setEditingId] = useState(null); // null = list, 'new' = new, id = edit

  // Live list — only used when in list view, never interferes with edit form
  useEffect(() => {
    const q = query(collection(db, 'tournaments'), orderBy('details.date', 'desc'));
    return onSnapshot(q, (snap) => {
      setTournaments(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, []);

  if (editingId !== null) {
    const existing = editingId === 'new' ? null : tournaments.find((t) => t.id === editingId);
    return (
      <TournamentEdit
        tournamentId={editingId === 'new' ? null : editingId}
        initialData={existing ?? null}
        onBack={() => setEditingId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setEditingId('new')}
        className="btn-gold w-full flex items-center justify-center gap-2"
      >
        <Plus size={16} /> New Tournament
      </button>

      {tournaments.length === 0 && (
        <p className="font-body text-dust-600 text-sm text-center py-8 uppercase tracking-widest">
          No tournaments yet
        </p>
      )}

      {tournaments.map((t) => (
        <button
          key={t.id}
          onClick={() => setEditingId(t.id)}
          className="w-full bg-charcoal-800 border border-charcoal-600 hover:border-dust-500
                     rounded-sm p-3 text-left transition-colors"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-sans font-bold text-parchment-100 text-sm uppercase tracking-wide truncate">
                {t.details?.name ?? 'Untitled Tournament'}
              </p>
              <p className="font-body text-dust-500 text-xs mt-0.5">
                {t.details?.date ?? '—'} {t.details?.time ? `· ${t.details.time}` : ''}
                {t.details?.location ? ` · ${t.details.location}` : ''}
              </p>
              {t.prizes?.length > 0 && (
                <p className="font-body text-dust-600 text-xs mt-1">
                  {t.prizes.length} prize{t.prizes.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
            <span className={`flex-shrink-0 px-2 py-0.5 rounded-sm border text-[10px] font-sans font-bold uppercase tracking-widest ${statusBadge(t.details?.status)}`}>
              {t.details?.status ?? 'upcoming'}
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

// ─── Players Panel ────────────────────────────────────────────────────────────

function PlayersPanel() {
  const [players, setPlayers] = useState([]);
  const [forceA, setForceA] = useState(null);
  const [forceB, setForceB] = useState(null);
  const [forceMin, setForceMin] = useState(10);
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    return onSnapshot(
      query(collection(db, 'profiles'), orderBy('stats.joinedAt', 'asc')),
      (snap) => setPlayers(snap.docs.map((d) => ({ uid: d.id, ...d.data() })))
    );
  }, []);

  async function disqualify(player) {
    if (!window.confirm(`Disqualify ${player.personal.nickname}? This cannot be undone.`)) return;
    setBusy(player.uid);
    await writeBatch(db)
      .update(doc(db, 'profiles', player.uid), { status: 'disqualified' })
      .commit();
    setBusy(null);
  }

  async function reinstate(player) {
    setBusy(player.uid);
    await writeBatch(db)
      .update(doc(db, 'profiles', player.uid), { status: 'alive' })
      .commit();
    setBusy(null);
  }

  async function forceMatch() {
    if (!forceA || !forceB || forceA.uid === forceB.uid) return;
    setCreating(true);
    const scheduledTime = Timestamp.fromMillis(Date.now() + forceMin * 60_000);
    await addDoc(collection(db, 'matches'), {
      participants: {
        challengerId: forceA.uid,
        challengerNickname: forceA.personal.nickname,
        defenderId: forceB.uid,
        defenderNickname: forceB.personal.nickname,
      },
      timing: { scheduledTime, createdAt: serverTimestamp() },
      status: 'scheduled',
      safety: { challengerReady: false, defenderReady: false },
      result: null,
      adminForced: true,
    });
    setForceA(null);
    setForceB(null);
    setCreating(false);
  }

  const alive = players.filter((p) => p.status === 'alive');
  const fallen = players.filter((p) => p.status !== 'alive');

  function selectForForce(p) {
    if (p.status !== 'alive') return;
    if (!forceA || forceA.uid === p.uid) { setForceA(forceA?.uid === p.uid ? null : p); return; }
    if (!forceB || forceB.uid === p.uid) { setForceB(forceB?.uid === p.uid ? null : p); return; }
    setForceA(p); setForceB(null);
  }

  return (
    <div className="space-y-4">
      {/* Force match builder */}
      {(forceA || forceB) && (
        <div className="bg-charcoal-800 border-2 border-gold-600 rounded-sm p-3">
          <p className="section-label mb-2">Force Match</p>
          <div className="flex items-center gap-2 mb-3">
            <div className={`flex-1 text-center py-2 rounded-sm border text-xs font-sans font-bold uppercase tracking-widest ${forceA ? 'border-gold-500 text-gold-300' : 'border-charcoal-600 text-dust-700'}`}>
              {forceA ? forceA.personal.nickname : 'Select A'}
            </div>
            <span className="font-display text-dust-600 text-xs">VS</span>
            <div className={`flex-1 text-center py-2 rounded-sm border text-xs font-sans font-bold uppercase tracking-widest ${forceB ? 'border-gold-500 text-gold-300' : 'border-charcoal-600 text-dust-700'}`}>
              {forceB ? forceB.personal.nickname : 'Select B'}
            </div>
          </div>
          <div className="flex items-center gap-2 mb-2">
            <label className="section-label flex-shrink-0">Draw in</label>
            <input
              type="number"
              min={1}
              max={60}
              value={forceMin}
              onChange={(e) => setForceMin(Number(e.target.value))}
              className="w-16 bg-charcoal-900 border border-charcoal-600 text-parchment-100
                         font-body px-2 py-1 rounded-sm text-center focus:outline-none focus:border-gold-500"
            />
            <span className="section-label">min</span>
          </div>
          <button
            onClick={forceMatch}
            disabled={!forceA || !forceB || forceA.uid === forceB.uid || creating}
            className="btn-blood w-full text-xs"
          >
            {creating ? 'Creating…' : 'Force This Match'}
          </button>
        </div>
      )}

      {/* Alive players */}
      <div>
        <p className="section-label mb-2">Alive ({alive.length})</p>
        <div className="space-y-2">
          {alive.map((p) => {
            const isForceSelected = forceA?.uid === p.uid || forceB?.uid === p.uid;
            return (
              <div
                key={p.uid}
                onClick={() => selectForForce(p)}
                className={`flex items-center gap-3 p-2 rounded-sm border cursor-pointer transition-all ${
                  isForceSelected
                    ? 'border-gold-500 bg-charcoal-700'
                    : 'border-charcoal-600 bg-charcoal-800 hover:border-dust-500'
                }`}
              >
                <PlayerAvatar profile={p} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-parchment-100 text-xs uppercase tracking-wide truncate">
                    {p.personal?.nickname}
                  </p>
                  <p className="font-body text-dust-600 text-xs">{p.stats?.matchesPlayed ?? 0} duels</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); disqualify(p); }}
                  disabled={busy === p.uid}
                  className="text-xs text-dust-700 hover:text-blood-400 transition-colors px-2 py-1 flex items-center gap-1"
                  title="Disqualify"
                >
                  <AlertTriangle size={12} /> DQ
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {fallen.length > 0 && (
        <div>
          <RopeDivider />
          <p className="section-label mb-2">Boot Hill ({fallen.length})</p>
          <div className="space-y-2">
            {fallen.map((p) => (
              <div key={p.uid} className="flex items-center gap-3 p-2 rounded-sm border border-charcoal-700 bg-charcoal-800 opacity-70">
                <PlayerAvatar profile={p} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-dust-500 text-xs uppercase tracking-wide line-through truncate">
                    {p.personal?.nickname}
                  </p>
                  <p className={`font-body text-xs ${p.status === 'disqualified' ? 'text-blood-500' : 'text-dust-700'}`}>
                    {p.status}
                  </p>
                </div>
                <button
                  onClick={() => reinstate(p)}
                  disabled={busy === p.uid}
                  className="text-xs text-dust-700 hover:text-gold-400 transition-colors px-2 py-1"
                >
                  Reinstate
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Admin Shell ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'matches',    label: 'Matches',    icon: Swords },
  { id: 'tournament', label: 'Tournament', icon: Trophy },
  { id: 'players',   label: 'Players',    icon: Users },
];

export default function Admin() {
  const { userProfile } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('matches');

  if (!userProfile?.isAdmin) {
    navigate('/board');
    return null;
  }

  return (
    <div className="min-h-screen bg-charcoal-900 pb-24">
      {/* Header */}
      <div className="bg-blood-900 border-b border-blood-700 px-4 py-3 flex items-center gap-3">
        <Shield size={20} className="text-blood-300" />
        <div>
          <h1 className="font-display text-blood-200 text-lg tracking-wider">Sheriff's Office</h1>
          <p className="font-body text-blood-500 text-xs">Admin — {userProfile.personal?.nickname}</p>
        </div>
        <CrossedPistols size={48} className="ml-auto" color="#7f1d1d" />
      </div>

      {/* Tab bar */}
      <div className="flex bg-charcoal-800 border-b border-charcoal-700">
        {TABS.map((t) => (
          <AdminTab key={t.id} label={t.label} icon={t.icon} active={tab === t.id} onClick={() => setTab(t.id)} />
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5">
        {tab === 'matches'    && <MatchesPanel />}
        {tab === 'tournament' && <TournamentPanel />}
        {tab === 'players'    && <PlayersPanel />}
      </div>
    </div>
  );
}
