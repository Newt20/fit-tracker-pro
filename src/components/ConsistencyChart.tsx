import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { WeekChartPoint } from '../db/repository';
import { computeWeekSegments } from '../lib/chartMath';
import { ACTIVITY, colors, fonts, radius, shadow } from '../theme/theme';

type ConsistencyChartProps = {
  data: WeekChartPoint[];
  maxBarHeight?: number;
};

export function ConsistencyChart({ data, maxBarHeight = 96 }: ConsistencyChartProps) {
  const segments = useMemo(() => computeWeekSegments(data), [data]);

  if (segments.length === 0) return null;

  const barMinHeight = 4;

  return (
    <View style={[styles.card]}>
      <Text style={styles.title}>Weekly consistency</Text>
      <Text style={styles.caption}>Bar height = active days · segments = activity mix</Text>

      <View style={styles.chartContainer}>
        <View style={styles.barsRow}>
          {segments.map((seg) => {
            const barHeight = Math.max(barMinHeight, seg.heightPct * maxBarHeight);
            return (
              <View key={seg.weekKey} style={styles.barColumn}>
                <View style={[styles.barTrack, { height: maxBarHeight }]}>
                  <View
                    style={[
                      styles.barFill,
                      { height: barHeight },
                      seg.heightPct === 0 && styles.emptyBar,
                    ]}
                  >
                    {seg.walkPct > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { height: `${seg.walkPct * 100}%`, backgroundColor: ACTIVITY.walk.color },
                        ]}
                      />
                    )}
                    {seg.ropePct > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { height: `${seg.ropePct * 100}%`, backgroundColor: ACTIVITY.rope.color },
                        ]}
                      />
                    )}
                    {seg.liftPct > 0 && (
                      <View
                        style={[
                          styles.segment,
                          { height: `${seg.liftPct * 100}%`, backgroundColor: ACTIVITY.lift.color },
                        ]}
                      />
                    )}
                  </View>
                </View>
                <Text style={[styles.weekLabel, seg.isCurrent && styles.weekLabelCurrent]}>
                  {seg.label}
                  {seg.isCurrent && '*'}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ACTIVITY.walk.color }]} />
          <Text style={styles.legendLabel}>{ACTIVITY.walk.name}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ACTIVITY.rope.color }]} />
          <Text style={styles.legendLabel}>{ACTIVITY.rope.name}</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: ACTIVITY.lift.color }]} />
          <Text style={styles.legendLabel}>{ACTIVITY.lift.name}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 14,
    ...shadow,
  },
  title: {
    fontFamily: fonts.body,
    fontWeight: '700',
    fontSize: 16,
    color: colors.ink,
    marginBottom: 4,
  },
  caption: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 14,
    lineHeight: 16,
  },
  chartContainer: {
    marginBottom: 12,
  },
  barsRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 6,
  },
  barColumn: {
    flex: 1,
    alignItems: 'center',
  },
  barTrack: {
    width: '100%',
    backgroundColor: colors.card2,
    borderRadius: 4,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  barFill: {
    width: '100%',
    justifyContent: 'flex-end',
  },
  emptyBar: {
    backgroundColor: colors.line,
  },
  segment: {
    width: '100%',
    marginBottom: 2,
  },
  weekLabel: {
    fontFamily: fonts.mono,
    fontSize: 10,
    color: colors.muted,
    marginTop: 6,
    fontWeight: '500',
  },
  weekLabelCurrent: {
    fontWeight: '700',
    color: colors.ink,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.muted,
  },
});
