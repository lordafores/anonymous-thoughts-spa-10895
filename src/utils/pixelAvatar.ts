// Generate pixel art avatar based on seed
export const generatePixelAvatar = (seed: string, size: number = 80): string => {
  const canvas = document.createElement('canvas');
  const gridSize = 5; // 5x5 grid
  const pixelSize = size / gridSize;
  
  canvas.width = size;
  canvas.height = size;
  
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';
  
  // Generate colors from seed
  const hash = seed.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);
  
  const hue = Math.abs(hash) % 360;
  const baseColor = `hsl(${hue}, 70%, 50%)`;
  const darkColor = `hsl(${hue}, 70%, 35%)`;
  const lightColor = `hsl(${hue}, 70%, 65%)`;
  
  // Fill background
  ctx.fillStyle = `hsl(${hue}, 40%, 90%)`;
  ctx.fillRect(0, 0, size, size);
  
  // Generate symmetrical pattern
  const pattern = [];
  for (let i = 0; i < 3; i++) {
    const row = [];
    for (let j = 0; j < 5; j++) {
      const value = Math.abs((hash >> (i * 5 + j)) % 3);
      row.push(value);
    }
    pattern.push(row);
  }
  
  // Mirror the pattern
  for (let i = 1; i >= 0; i--) {
    pattern.push([...pattern[i]]);
  }
  
  // Draw pixels
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const value = pattern[row][col];
      if (value === 0) continue;
      
      ctx.fillStyle = value === 1 ? baseColor : value === 2 ? darkColor : lightColor;
      ctx.fillRect(col * pixelSize, row * pixelSize, pixelSize, pixelSize);
    }
  }
  
  return canvas.toDataURL();
};
