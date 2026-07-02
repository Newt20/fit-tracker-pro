import React, { useCallback, useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import {
  Summary, getSummaries, summarizeWeek, cleanupSummarized,
  rangeHasData, isWeekSummarized, summaryHasRawRows,
} from '../../src/db/repository';
import { isoWeek, dateKey, fmtShort, parseKey, addDays } from '../../src/lib/dates';
import { trim } from '../../src/lib/format';
import { ACTIVITY, colors, fonts, radius, shadow } from '../../src/theme/theme';
import { Empty } from '../../src/components/Empty';

type WeekOption = { key: string; start: string; end: string; label: string };

export default function SummaryScreen() {
  const { settings, dataVersion, bumpData } = useApp();
  const insets = useSafeAreaInsets();
  const [summaries, setSummaries] = useState<Summary[]>([]);
  const [options, setOptions] = useState<WeekOption[]>([]);
  const [cleanable, setCleanable] = useState(false);
  const [live, setLive] = useState<Record<number, boolean>>({});

  const load = useCallback(async () => {
    const now = new Date();
    const thisW = isoWeek(now);
    const lastW = isoWeek(addDays(now, -7));

    const opts: WeekOption[] = [];
    for (const [w, label] of [[lastW, 'last week'], [thisW, 'this week']] as const) {
      const start = dateKey(w.monday);
      const end = dateKey(w.sunday);
      const already = await isWeekSummarized(w.key);
      const hasData = await rangeHasData(start, end);
      if (!already && hasData) opts.push({ key: w.key, start, end, label });
    }

    const sums = await getSummaries();
    const liveMap: Record<number, boolean> = {};
    let anyCleanable = false;
    for (const s of sums) {
      const hasRaw = await summaryHasRawRows(s);
      liveMap[s.id] = hasRaw;
      if (!s.archived && hasRaw) anyCleanable = true;
    }

    setOptions(opts);
    setSummaries(sums);
    setLive(liveMap);
    setCleanable(anyCleanable);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load, dataVersion]));

  async function onSummarize(o: WeekOption) {
    await summarizeWeek(o.key, o.start, o.end, settings.units.dist, settings.units.wt);
    bumpData();
    load();
  }

  function onCleanup() {
    Alert.alert(
      'Free up space',
      'This deletes the day-by-day rows for every summarized week. The weekly totals stay here.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear rows',
          style: 'destructive',
          onPress: async () => {
            const cleared = await cleanupSummarized();
            bumpData();
            load();
            Alert.alert(cleared ? `Cleared ${cleared} entr${cleared === 1 ? 'y' : 'ies'}` : 'Nothing to clear');
          },
        },
      ]
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 10, paddingBottom: 120 }}
    >
      <Text style={styles.title}>Weekly summary</Text>
      <Text style={styles.sub}>
        Roll a week into one record. Cleaning up clears the day-by-day rows but keeps the totals here.
      </Text>

      {options.map((o) => (
        <Pressable key={o.key} onPress={() => onSummarize(o)} style={styles.actionGhost}>
          <Text style={styles.actionGhostTxt}>
            📊  Summarize {o.label}  ·  {fmtShort(parseKey(o.start))}–{fmtShort(parseKey(o.end))}
          </Text>
        </Pressable>
      ))}

      {cleanable && (
        <Pressable onPress={onCleanup} style={styles.actionDark}>
          <Text style={styles.actionDarkTxt}>🧹  Free up space — clear summarized day rows</Text>
        </Pressable>
      )}

      {summaries.length === 0 ? (
        <Empty emoji="📭" title="No summaries yet" body="Log a few days, then roll the week up into a summary." />
      ) : (
        summaries.map((s) => <SummaryCard key={s.id} s={s} live={!!live[s.id]} />)
      )}
    </ScrollView>
  );
}

function SummaryCard({ s, live }: { s: Summary; live: boolean }) {
  return (
    <View style={styles.card}>
      <View style={styles.range}>
        <Text style={styles.week}>Week of {fmtShort(parseKey(s.start_date))}</Text>
        <Text style={styles.dts}>
          {fmtShort(parseKey(s.start_date))} – {fmtShort(parseKey(s.end_date))}
        </Text>
      </View>

      <View style={styles.statRow}>
        <Stat label="Walk" color={ACTIVITY.walk.color} value={`${trim(s.walk_dist)}`} unit={s.dist_unit} />
        <Stat label="Rope" color={ACTIVITY.rope.color} value={`${s.rope_jumps}`} unit="jumps" />
        <Stat label="Lift" color={ACTIVITY.lift.color} value={`${s.lift_sets}`} unit="sets" />
      </View>
      <View style={styles.statRow}>
        <Stat label="Active days" value={`${s.active_days}`} unit="/7" />
        <Stat label="Move time" value={`${s.total_mins}`} unit="min" />
        <Stat label="Lift reps" value={`${s.lift_reps}`} unit="" />
      </View>

      <View style={styles.foot}>
        <Text style={styles.note}>{live ? '📂 Day-by-day rows kept' : '🗜️ Day rows cleared'}</Text>
        <View style={[styles.pill, { backgroundColor: live ? ACTIVITY.walk.soft : colors.card2 }]}>
          <Text style={[styles.pillTxt, { color: live ? ACTIVITY.walk.color : colors.muted }]}>
            {live ? 'Live' : 'Archived'}
          </Text>
        </View>
      </View>
    </View>
  );
}

function Stat({ label, value, unit, color }: { label: string; value: string; unit: string; color?: string }) {
  return (
    <View style={styles.statBox}>
      <View style={styles.statLabel}>
        {color && <View style={[styles.statDot, { backgroundColor: color }]} />}
        <Text style={styles.statLabelTxt}>{label}</Text>
      </View>
      <Text style={styles.statVal}>
        {value}
        {unit ? <Text style={styles.statUnit}> {unit}</Text> : null}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.body, fontWeight: '700', fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13.5, marginTop: 2, marginBottom: 18, lineHeight: 19 },
  actionGhost: { backgroundColor: colors.card, borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginBottom: 10, ...shadow },
  actionGhostTxt: { fontWeight: '600', fontSize: 14, color: colors.ink },
  actionDark: { backgroundColor: colors.ink, borderRadius: 13, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  actionDarkTxt: { fontWeight: '600', fontSize: 14, color: '#fff' },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  range: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  week: { fontFamily: fonts.body, fontWeight: '700', fontSize: 16, color: colors.ink },
  dts: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  statBox: { flex: 1, backgroundColor: colors.card2, borderRadius: 12, paddingVertical: 11, paddingHorizontal: 10 },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabelTxt: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, color: colors.muted, textTransform: 'uppercase' },
  statVal: { fontFamily: fonts.mono, fontWeight: '700', fontSize: 17, color: colors.ink, marginTop: 6 },
  statUnit: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  foot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.line },
  note: { fontSize: 11.5, color: colors.muted },
  pill: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  pillTxt: { fontFamily: fonts.mono, fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
});
