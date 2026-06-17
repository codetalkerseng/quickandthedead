import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';

const WIN_LINES = [
  (w, l) => `${w} sends ${l} to Boot Hill!`,
  (w, l) => `The smoke clears — ${w} advances!`,
  (w, l) => `${l} falls before ${w}!`,
  (w, l) => `${w} is VICTORIOUS!`,
];
const YIELD_LINES = [
  (w, l) => `${l} yields — ${w} shows mercy!`,
  (w, l) => `${w} accepts the surrender of ${l}.`,
];
const TIE_LINES = [
  (w, l) => `DOUBLE ELIMINATION — ${w} and ${l} both fall!`,
  (w, l) => `A tie! Both ${w} and ${l} are eliminated!`,
];
const CHALLENGE_LINES = [
  (a, b) => `${a} just called out ${b}!`,
  (a, b) => `${a} has challenged ${b}!`,
  (a, b) => `Tension rises — ${a} vs. ${b} is on!`,
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateMessage(match) {
  if (match.result?.logMessage) return match.result.logMessage;

  const c = match.participants?.challengerNickname ?? 'Unknown';
  const d = match.participants?.defenderNickname ?? 'Unknown';
  const w = match.result?.winnerId === match.participants?.challengerId ? c : d;
  const l = w === c ? d : c;

  if (match.status === 'scheduled') return pick(CHALLENGE_LINES)(c, d);
  if (match.result?.type === 'yield') return pick(YIELD_LINES)(w, l);
  if (match.result?.type === 'tie') return pick(TIE_LINES)(c, d);
  if (match.status === 'resolved') return pick(WIN_LINES)(w, l);
  return `${c} vs. ${d} — next up!`;
}

export default function TownCrier() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Listen to recent matches for feed content
    const q = query(
      collection(db, 'matches'),
      orderBy('timing.createdAt', 'desc'),
      limit(8)
    );
    return onSnapshot(q, (snap) => {
      const msgs = snap.docs.map((d) => ({
        id: d.id,
        text: generateMessage({ id: d.id, ...d.data() }),
      }));
      setMessages(msgs);
    });
  }, []);

  if (messages.length === 0) return null;

  const ticker = [...messages, ...messages].map((m, i) => (
    <span key={i} className="mx-8">
      <span className="text-gold-500 mr-2">✦</span>
      {m.text}
    </span>
  ));

  return (
    <div className="ticker-bar py-1.5 relative overflow-hidden">
      <div
        className="inline-block whitespace-nowrap animate-scroll-ticker font-body text-parchment-300 text-xs"
        style={{ animationDuration: `${Math.max(20, messages.length * 6)}s` }}
      >
        {ticker}
      </div>
    </div>
  );
}
