import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { Entry, getEntriesByDate, getTotals, deleteEntry } from '../../src/db/repository';
import { todayKey, parseKey, fmtNice } from '../../src/lib/dates';
import { trim } from '../../src/lib/format';
import { colors, fonts, radius, shadow } from '../../src/theme/theme';
import { StatCard } from '../../src/components/StatCard';
import { EntryRow } from '../../src/components/EntryRow';
import { Empty } from '../../src/components/Empty';

export default function TodayScreen() {
  const { settings, dataVersion, bumpData } = useApp();
  const insets = useSafeAreaInsets();
  const today = todayKey();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [totals, setTotals] = useState({ walkDist: 0, ropeJumps: 0, liftSets: 0 });

  const load = useCallback(async () => {
    const [es, t] = await Promise.all([getEntriesByDate(today), getTotals(today, today)]);
    setEntries(es);
    setTotals({ walkDist: t.walkDist, ropeJumps: t.ropeJumps, liftSets: t.liftSets });
  }, [today]);

  useFocusEffect(useCallback(() => { load(); }, [load, dataVersion]));

  async function onDelete(id: number) {
    await deleteEntry(id);
    bumpData();
    load();
  }

  const now = new Date();
  const reminderDue =
    settings.remOn &&
    entries.length === 0 &&
    (now.getHours() > settings.remHour ||
      (now.getHours() === settings.remHour && now.getMinutes() >= settings.remMinute));

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 10, paddingBottom: 120 }}
    >
      <Text style={styles.brand}>Move<Text style={{ color: colors.walk }}>·</Text>Ledger</Text>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.sub}>{fmtNice(parseKey(today))}</Text>

      {reminderDue && (
        <View style={styles.banner}>
          <Text style={{ fontSize: 20 }}>🔔</Text>
          <Text style={styles.bannerText}>
            <Text style={{ fontWeight: '700' }}>Time to move. </Text>
            You haven't logged anything today.
          </Text>
          <Pressable onPress={() => router.push({ pathname: '/log', params: { date: today } })}>
            <Text style={styles.bannerBtn}>Log now</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.stats}>
        <StatCard label="Walk" value={trim(totals.walkDist)} unit={settings.units.dist} color={colors.walk} />
        <StatCard label="Rope" value={totals.ropeJumps} unit="jumps" color={colors.rope} />
        <StatCard label="Strength" value={totals.liftSets} unit="sets" color={colors.lift} />
      </View>

      <View style={styles.card}>
        <View style={styles.cardHead}>
          <Text style={styles.cardTitle}>Today's log</Text>
          {entries.length > 0 && (
            <Text style={styles.meta}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</Text>
          )}
        </View>
        {entries.length === 0 ? (
          <Empty emoji="🌅" title="No moves logged yet" body="Tap ＋ to add a walk, rope set, or lift." />
        ) : (
          entries.map((e, i) => (
            <EntryRow key={e.id} entry={e} units={settings.units} onDelete={onDelete} first={i === 0} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  brand: { fontFamily: fonts.body, fontWeight: '700', fontSize: 16, color: colors.ink, marginBottom: 6 },
  title: { fontFamily: fonts.body, fontWeight: '700', fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13.5, marginTop: 2, marginBottom: 18 },
  banner: {
    flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.ink,
    borderRadius: radius.md, padding: 13, marginBottom: 16, ...shadow,
  },
  bannerText: { flex: 1, color: '#fff', fontSize: 13, lineHeight: 18 },
  bannerBtn: { color: '#fff', fontWeight: '700', fontSize: 12.5 },
  stats: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  cardTitle: { fontFamily: fonts.body, fontWeight: '700', fontSize: 16, color: colors.ink },
  meta: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
});
