import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Entry } from '../db/repository';
import { ACTIVITY, colors, fonts } from '../theme/theme';
import { entryTitle, entrySub, entryValue, Units } from '../lib/format';

export function EntryRow({
  entry,
  units,
  onDelete,
  first,
}: {
  entry: Entry;
  units: Units;
  onDelete: (id: number) => void;
  first?: boolean;
}) {
  const a = ACTIVITY[entry.type];
  const val = entryValue(entry, units);
  return (
    <View style={[styles.row, !first && styles.divider]}>
      <View style={[styles.icon, { backgroundColor: a.soft }]}>
        <Text style={{ fontSize: 18 }}>{a.emoji}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>{entryTitle(entry)}</Text>
        <Text style={styles.sub} numberOfLines={1}>{entrySub(entry)}</Text>
      </View>
      <View style={styles.valBox}>
        <Text style={styles.val}>{val.v}</Text>
        <Text style={styles.valUnit}>{val.u}</Text>
      </View>
      <Pressable
        onPress={() => onDelete(entry.id)}
        hitSlop={8}
        style={({ pressed }) => [styles.del, pressed && { backgroundColor: '#FBECEC' }]}
        accessibilityLabel="Delete entry"
      >
        <Text style={{ color: colors.muted, fontSize: 15 }}>✕</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 11, gap: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.line },
  icon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: '600', fontSize: 14.5, color: colors.ink },
  sub: { fontSize: 12.5, color: colors.muted, marginTop: 1 },
  valBox: { alignItems: 'flex-end' },
  val: { fontFamily: fonts.mono, fontWeight: '700', fontSize: 15, color: colors.ink },
  valUnit: { fontSize: 10, color: colors.muted, fontWeight: '500' },
  del: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
