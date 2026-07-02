import { Platform } from 'react-native';

// "Scoreboard" theme — three activities each own a color, numbers read like a stopwatch.
export const colors = {
  ink: '#161A1D',
  inkSoft: '#3A434A',
  muted: '#79858E',
  line: '#E4E8E9',
  paper: '#EFF2F1',
  card: '#FFFFFF',
  card2: '#F7F9F8',

  walk: '#1F8A70', // teal — ground covered
  rope: '#F0682B', // orange — spring / energy
  lift: '#6655D6', // indigo — load

  walkSoft: '#E4F2EE',
  ropeSoft: '#FCE9E0',
  liftSoft: '#EBE8FB',

  good: '#1F8A70',
  warn: '#C9572B',
  white: '#FFFFFF',
};

// Numbers use a monospace face so stats line up like a scoreboard.
// Swap these for Space Grotesk / JetBrains Mono via expo-font if you want (see README).
export const fonts = {
  body: Platform.select({ ios: 'System', android: 'sans-serif', default: 'System' }) as string,
  mono: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
};

export const radius = { lg: 22, md: 16, sm: 11 };
export const space = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24 };

export const shadow = {
  shadowColor: '#161A1D',
  shadowOpacity: 0.08,
  shadowRadius: 16,
  shadowOffset: { width: 0, height: 6 },
  elevation: 3,
};

export type ActivityType = 'walk' | 'rope' | 'lift';

export const ACTIVITY = {
  walk: { name: 'Walk', emoji: '🚶', color: colors.walk, soft: colors.walkSoft },
  rope: { name: 'Rope jump', emoji: '🪢', color: colors.rope, soft: colors.ropeSoft },
  lift: { name: 'Strength', emoji: '🏋️', color: colors.lift, soft: colors.liftSoft },
} as const;
