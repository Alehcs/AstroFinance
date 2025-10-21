import { createAvatar } from '@dicebear/core';
import { adventurer } from '@dicebear/collection';
import { useMemo } from 'react';

const UserAvatar = ({ 
  seed = 'AstroUser', 
  style = 'adventurer', 
  size = 64, 
  className = '',
  showBorder = true 
}) => {
  const avatar = useMemo(() => {
    return createAvatar(adventurer, {
      seed: seed,
      size: size,
      backgroundColor: ['transparent'],
      radius: 50,
    });
  }, [seed, size]);

  const avatarDataUrl = avatar.toDataUri();

  return (
    <div className={`relative inline-block ${className}`}>
      <img
        src={avatarDataUrl}
        alt={`Avatar de ${seed}`}
        className={`rounded-full ${showBorder ? 'ring-2 ring-purple-400/30 ring-offset-2 ring-offset-transparent' : ''}`}
        width={size}
        height={size}
      />
      {showBorder && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-purple-500/20 to-blue-500/20 pointer-events-none" />
      )}
    </div>
  );
};

export default UserAvatar;
