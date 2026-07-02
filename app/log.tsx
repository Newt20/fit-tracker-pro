import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useFocusEffect, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../src/context/AppContext';
import { Entry, getEntriesByDate, deleteEntry } from '../src/db/repository';
import { todayKey, parseKey, fmtNice } from '../src/lib/dates';
import { colors, fonts } from '../src/theme/theme';
import { EntryRow } from '../src/components/EntryRow';
import { ActivityForm } from '../src/components/ActivityForm';
import { Empty } from '../src/components/Empty';

export default function LogModal() {
  const { date } = useLocalSearchParams<{ date?: string }>();
  const dayKey = (date as string) || todayKey();
  const { settings, dataVersion, bumpData } = useApp();
  const insets = useSafeAreaInsets();
  const [entries, setEntries] = useState<Entry[]>([]);

  const load = useCallback(async () => {
    setEntries(await getEntriesByDate(dayKey));
  }, [dayKey]);

  useFocusEffect(useCallback(() => { load(); }, [load, dataVersion]));

  async function onDelete(id: number) {
    await deleteEntry(id);
    bumpData();
    load();
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.paper }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.handleWrap, { paddingTop: insets.top + 8 }]}>
        <View style={styles.grab} />
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.close}>
          <Text style={styles.closeTxt}>Done</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{fmtNice(parseKey(dayKey))}</Text>
        <Text style={styles.sub}>
          {entries.length ? `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'}` : 'Nothing logged yet'}
        </Text>

        {entries.length > 0 && (
          <View style={styles.list}>
            {entries.map((e, i) => (
              <EntryRow key={e.id} entry={e} units={settings.units} onDelete={onDelete} first={i === 0} />
            ))}
          </View>
        )}

        <Text style={styles.formHead}>Add activity</Text>
        <ActivityForm date={dayKey} onSaved={load} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  handleWrap: { alignItems: 'center', paddingBottom: 6 },
  grab: { width: 38, height: 4, borderRadius: 99, backgroundColor: colors.line },
  close: { position: 'absolute', right: 18, top: undefined, bottom: 4, paddingVertical: 4 },
  closeTxt: { fontSize: 15, fontWeight: '600', color: colors.lift },
  title: { fontFamily: fonts.body, fontWeight: '700', fontSize: 22, color: colors.ink, letterSpacing: -0.3 },
  sub: { color: colors.muted, fontSize: 13, marginTop: 2, marginBottom: 16 },
  list: { backgroundColor: colors.card, borderRadius: 18, padding: 16, marginBottom: 18 },
  formHead: { fontFamily: fonts.body, fontWeight: '700', fontSize: 16, color: colors.ink, marginBottom: 14 },
});
