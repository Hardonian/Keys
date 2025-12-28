// Slider to atom mapping configuration
const sliderToAtomMap: Record<string, Record<number, string>> = {
  playfulness: {
    0: 'tone.serious',
    25: 'tone.professional',
    50: 'tone.balanced',
    75: 'tone.playful',
    100: 'tone.absurdist',
  },
  revenueFocus: {
    0: 'goal.velocity',
    25: 'goal.reliability',
    50: 'goal.growth',
    75: 'goal.revenue',
    100: 'goal.revenue',
  },
  investorPerspective: {
    0: 'perspective.founder',
    33: 'perspective.pm',
    66: 'perspective.staff_engineer',
    100: 'perspective.cfo',
  },
};

/**
 * Maps a slider value to an atom name using linear interpolation
 */
export function sliderToAtomName(
  sliderName: 'playfulness' | 'revenueFocus' | 'investorPerspective',
  value: number
): string {
  const map = sliderToAtomMap[sliderName];
  if (!map) {
    return 'tone.balanced'; // Default fallback
  }

  // Clamp value to 0-100
  const clampedValue = Math.max(0, Math.min(100, value));

  // Check for exact match
  if (clampedValue in map) {
    return map[clampedValue as keyof typeof map];
  }

  // Find nearest keypoints
  const keys = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);

  // Find the two closest keypoints
  let lowerKey = keys[0];
  let upperKey = keys[keys.length - 1];

  for (let i = 0; i < keys.length - 1; i++) {
    if (clampedValue >= keys[i] && clampedValue <= keys[i + 1]) {
      lowerKey = keys[i];
      upperKey = keys[i + 1];
      break;
    }
  }

  // Round to nearest 25 for simplicity
  const roundedKey = Math.round(clampedValue / 25) * 25;
  const finalKey = Math.max(0, Math.min(100, roundedKey));

  return map[finalKey] || map[lowerKey] || 'tone.balanced';
}
