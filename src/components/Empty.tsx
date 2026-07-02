import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../theme/theme';

export function Empty({ emoji, title, body }: { emoji: string; title: string; body: string }) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.big}>{emoji}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 30, paddingHorizontal: 18 },
  big: { fontSize: 34, marginBottom: 8, opacity: 0.85 },
  title: { fontFamily: fonts.body, fontWeight: '600', color: colors.inkSoft, fontSize: 15, marginBottom: 4 },
  body: { fontSize: 13, color: colors.muted, textAlign: 'center', maxWidth: 240, lineHeight: 19 },
});
