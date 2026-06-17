import { writeBatch, doc, serverTimestamp, increment } from 'firebase/firestore';
import { db } from './firebase';

export async function resolveMatch(match, type, winnerId) {
  const batch = writeBatch(db);
  const { challengerId, challengerNickname, defenderId, defenderNickname } = match.participants;

  const wNick = winnerId === challengerId ? challengerNickname : defenderNickname;
  const lNick = wNick === challengerNickname ? defenderNickname : challengerNickname;

  const logMessage =
    type === 'tie'    ? `Double Elimination — ${challengerNickname} and ${defenderNickname} both fall!` :
    type === 'yield'  ? `${lNick} yields to ${wNick}!` :
    type === 'cancel' ? `The duel between ${challengerNickname} and ${defenderNickname} was cancelled.` :
                        `${wNick} sends ${lNick} to Boot Hill!`;

  batch.update(doc(db, 'matches', match.id), {
    status: type === 'cancel' ? 'cancelled' : 'resolved',
    result: { winnerId: type === 'tie' ? null : winnerId, type, logMessage },
  });

  if (type === 'cancel') {
    await batch.commit();
    return;
  }

  const now = serverTimestamp();

  if (type === 'tie') {
    [
      { id: challengerId, opp: defenderNickname },
      { id: defenderId,   opp: challengerNickname },
    ].forEach(({ id, opp }) => {
      batch.update(doc(db, 'profiles', id), {
        status: 'eliminated',
        'stats.matchesPlayed': increment(1),
        'stats.lastMatchTime': now,
        'stats.lastOpponentNickname': opp,
      });
    });
  } else {
    const loserId  = winnerId === challengerId ? defenderId : challengerId;
    const winnerOpp = winnerId === challengerId ? defenderNickname : challengerNickname;
    const loserOpp  = winnerId === challengerId ? challengerNickname : defenderNickname;

    batch.update(doc(db, 'profiles', winnerId), {
      'stats.matchesPlayed': increment(1),
      'stats.wins': increment(1),
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
}
