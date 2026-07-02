import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { ACTIVITY, ActivityType, colors, fonts, radius, shadow } from '../theme/theme';
import { dateKey, todayKey, pad } from '../lib/dates';

type Props = {
  cursor: Date; // any date in the displayed month
  index: Record<string, ActivityType[]>;
  summarized: Set<string>;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onPickDay: (key: string) => void;
};

const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function CalendarGrid({ cursor, index, summarized, onPrev, onNext, onToday, onPickDay }: Props) {
  const year = cursor.getFullYear();
  const month0 = cursor.getMonth();
  const monthLabel = cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const first = new Date(year, month0, 1);
  const lead = (first.getDay() + 6) % 7; // Monday start
  const days = new Date(year, month0 + 1, 0).getDate();
  const today = todayKey();

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < lead; i++) cells.push(<View key={`b${i}`} style={styles.cell} />);
  for (let d = 1; d <= days; d++) {
    const k = `${year}-${pad(month0 + 1)}-${pad(d)}`;
    const types = index[k] || [];
    const isToday = k === today;
    const isFuture = k > today;
    const archived = summarized.has(k) && types.length === 0;

    cells.push(
      <Pressable
        key={k}
        disabled={isFuture}
        onPress={() => onPickDay(k)}
        style={({ pressed }) => [
          styles.day,
          isToday && styles.dayToday,
          pressed && { transform: [{ scale: 0.95 }] },
        ]}
      >
        <Text style={[styles.dayNum, isToday && styles.dayNumToday, isFuture && styles.dayNumFuture]}>
          {d}
        </Text>
        <View style={styles.dots}>
          {types.map((t) => (
            <View key={t} style={[styles.dot, { backgroundColor: ACTIVITY[t].color }]} />
          ))}
          {archived && <View style={[styles.dot, { backgroundColor: colors.muted, opacity: 0.4 }]} />}
        </View>
      </Pressable>
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.month}>{monthLabel}</Text>
        <View style={styles.nav}>
          <NavBtn label="‹" onPress={onPrev} />
          <Pressable onPress={onToday} style={styles.todayBtn}>
            <Text style={styles.todayTxt}>Today</Text>
          </Pressable>
          <NavBtn label="›" onPress={onNext} />
        </View>
      </View>

      <View style={styles.grid}>
        {DOW.map((d, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.dow}>{d}</Text>
          </View>
        ))}
      </View>
      <View style={styles.grid}>{cells}</View>

      <View style={styles.legend}>
        {(['walk', 'rope', 'lift'] as ActivityType[]).map((t) => (
          <View key={t} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: ACTIVITY[t].color }]} />
            <Text style={styles.legendTxt}>{ACTIVITY[t].name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function NavBtn({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.navBtn}>
      <Text style={{ fontSize: 17, color: colors.inkSoft }}>{label}</Text>
    </Pressable>
  );
}

const CELL = `${100 / 7}%`;
const styles = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  month: { fontFamily: fonts.body, fontWeight: '700', fontSize: 18, color: colors.ink },
  nav: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  navBtn: { width: 38, height: 38, borderRadius: 11, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  todayBtn: { paddingHorizontal: 12, height: 38, borderRadius: 11, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  todayTxt: { fontSize: 12, fontWeight: '600', color: colors.inkSoft },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: CELL as any, alignItems: 'center', paddingBottom: 4 },
  dow: { fontSize: 10.5, fontWeight: '700', color: colors.muted, textTransform: 'uppercase' },
  day: {
    width: CELL as any,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    padding: 3,
  },
  dayToday: { borderWidth: 2, borderColor: colors.ink, borderRadius: 13 },
  dayNum: { fontFamily: fonts.mono, fontSize: 13, color: colors.inkSoft },
  dayNumToday: { fontWeight: '700', color: colors.ink },
  dayNumFuture: { color: colors.line },
  dots: { flexDirection: 'row', gap: 3, height: 6, alignItems: 'center' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 14 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendTxt: { fontSize: 12, color: colors.muted },
});
