import React, { useCallback, useState } from 'react';
import { ScrollView, Text, StyleSheet } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { getMonthIndex, getSummarizedDates } from '../../src/db/repository';
import { ActivityType, colors, fonts } from '../../src/theme/theme';
import { CalendarGrid } from '../../src/components/CalendarGrid';

export default function CalendarScreen() {
  const { dataVersion } = useApp();
  const insets = useSafeAreaInsets();
  const [cursor, setCursor] = useState(new Date());
  const [index, setIndex] = useState<Record<string, ActivityType[]>>({});
  const [summarized, setSummarized] = useState<Set<string>>(new Set());

  const load = useCallback(async () => {
    const [idx, sum] = await Promise.all([
      getMonthIndex(cursor.getFullYear(), cursor.getMonth()),
      getSummarizedDates(),
    ]);
    setIndex(idx);
    setSummarized(sum);
  }, [cursor]);

  useFocusEffect(useCallback(() => { load(); }, [load, dataVersion]));

  const shift = (months: number) => {
    const d = new Date(cursor);
    d.setMonth(d.getMonth() + months);
    setCursor(d);
  };

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 10, paddingBottom: 120 }}
    >
      <Text style={styles.title}>Calendar</Text>
      <Text style={styles.sub}>Tap a day to review or add activity.</Text>
      <CalendarGrid
        cursor={cursor}
        index={index}
        summarized={summarized}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => setCursor(new Date())}
        onPickDay={(k) => router.push({ pathname: '/log', params: { date: k } })}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.body, fontWeight: '700', fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13.5, marginTop: 2, marginBottom: 18 },
});
