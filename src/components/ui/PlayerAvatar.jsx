import { User } from 'lucide-react';
import { CHARACTER_COLORS } from '../../lib/constants';

export default function PlayerAvatar({ profile, size = 'md' }) {
  const dim = size === 'sm' ? 'w-9 h-9' : size === 'lg' ? 'w-16 h-16' : 'w-12 h-12';
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 28 : 20;
  const align = profile?.personal?.characterAlign || 'ellen';
  const ring = CHARACTER_COLORS[align] || 'text-dust-400';

  return (
    <div
      className={`${dim} rounded-sm border-2 border-dust-500 bg-charcoal-800
                  flex items-center justify-center overflow-hidden flex-shrink-0 ${ring}`}
    >
      {profile?.personal?.photoURL ? (
        <img
          src={profile.personal.photoURL}
          alt={profile.personal.nickname}
          className="w-full h-full object-cover"
        />
      ) : (
        <User size={iconSize} />
      )}
    </div>
  );
}
