import { useEffect, useState } from 'react';
import { generatePixelAvatar } from '@/utils/pixelAvatar';

interface PixelAvatarProps {
  seed: string;
  size?: number;
  className?: string;
}

const PixelAvatar = ({ seed, size = 80, className = '' }: PixelAvatarProps) => {
  const [avatarUrl, setAvatarUrl] = useState<string>('');

  useEffect(() => {
    const url = generatePixelAvatar(seed, size);
    setAvatarUrl(url);
  }, [seed, size]);

  if (!avatarUrl) return null;

  return (
    <img 
      src={avatarUrl} 
      alt="Avatar" 
      className={`rounded-lg ${className}`}
      style={{ imageRendering: 'pixelated' }}
    />
  );
};

export default PixelAvatar;
