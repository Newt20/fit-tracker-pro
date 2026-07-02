import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, shadow } from '../theme/theme';

export function StatCard({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: string | number;
  unit: string;
  color: string;
}) {
  return (
    <View style={styles.card}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.num}>
        <Text style={{ color }}>{value}</Text>
        <Text style={styles.unit}> {unit}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingVertical: 13,
    paddingHorizontal: 12,
    ...shadow,
  },
  dot: { position: 'absolute', top: 13, right: 12, width: 9, height: 9, borderRadius: 5 },
  label: {
    fontSize: 10.5,
    letterSpacing: 0.6,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  num: { fontFamily: fonts.mono, fontWeight: '700', fontSize: 22, marginTop: 8 },
  unit: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, fontWeight: '500' },
});
