import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet, Switch, Platform, Alert } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useApp } from '../../src/context/AppContext';
import { wipeAll, getWeeklyChartData } from '../../src/db/repository';
import { buildReportHtml } from '../../src/lib/pdfReport';
import { pad } from '../../src/lib/dates';
import { colors, fonts, radius, shadow } from '../../src/theme/theme';

export default function SettingsScreen() {
  const { settings, updateSettings, bumpData } = useApp();
  const insets = useSafeAreaInsets();
  const [showPicker, setShowPicker] = useState(false);

  const timeLabel = `${pad(settings.remHour)}:${pad(settings.remMinute)}`;
  const pickerValue = (() => {
    const d = new Date();
    d.setHours(settings.remHour, settings.remMinute, 0, 0);
    return d;
  })();

  async function onExportPdf() {
    try {
      const weeks = await getWeeklyChartData(10);
      const html = buildReportHtml({ weeks, units: settings.units, generatedAt: new Date() });
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Fit Track summary' });
      } else {
        Alert.alert('PDF saved', uri);
      }
    } catch (err) {
      Alert.alert('Export failed', 'Could not generate the PDF report.');
    }
  }

  function onReset() {
    Alert.alert('Reset app', 'Delete ALL logs, summaries, and settings? This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete everything',
        style: 'destructive',
        onPress: async () => {
          await wipeAll();
          await updateSettings({ remOn: false, units: { dist: 'km', wt: 'kg' } });
          bumpData();
          Alert.alert('App reset');
        },
      },
    ]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.paper }}
      contentContainerStyle={{ padding: 18, paddingTop: insets.top + 10, paddingBottom: 120 }}
    >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.sub}>Reminders, units, and your data.</Text>

      {/* Reminder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Daily reminder</Text>
        <Row label="Remind me to log" hint="A local notification on your phone at the time below.">
          <Switch
            value={settings.remOn}
            onValueChange={(v) => updateSettings({ remOn: v })}
            trackColor={{ true: colors.good }}
          />
        </Row>
        <Row label="Time">
          <Pressable onPress={() => setShowPicker(true)} style={styles.timeBtn}>
            <Text style={styles.timeTxt}>{timeLabel}</Text>
          </Pressable>
        </Row>
        {showPicker && (
          <DateTimePicker
            mode="time"
            value={pickerValue}
            is24Hour
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(_, date) => {
              setShowPicker(Platform.OS === 'ios');
              if (date) updateSettings({ remHour: date.getHours(), remMinute: date.getMinutes() });
            }}
          />
        )}
        <Text style={styles.smsNote}>
          Real SMS text messages need a server with a messaging gateway (Twilio, Vonage). This reminder
          stays on your device and is free — no phone number or backend required.
        </Text>
      </View>

      {/* Units */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Units</Text>
        <Row label="Distance">
          <Seg
            options={['km', 'mi']}
            value={settings.units.dist}
            onChange={(v) => updateSettings({ units: { ...settings.units, dist: v as 'km' | 'mi' } })}
          />
        </Row>
        <Row label="Weight">
          <Seg
            options={['kg', 'lb']}
            value={settings.units.wt}
            onChange={(v) => updateSettings({ units: { ...settings.units, wt: v as 'kg' | 'lb' } })}
          />
        </Row>
      </View>

      {/* Data */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your data</Text>
        <Row label="Export PDF report" hint="A weekly summary with the consistency chart, ready to share or print.">
          <Pressable onPress={onExportPdf} style={styles.smallBtn}>
            <Text style={styles.smallBtnTxt}>Export</Text>
          </Pressable>
        </Row>
        <Row label="Reset app" hint="Permanently delete all data.">
          <Pressable onPress={onReset} style={styles.smallBtn}>
            <Text style={[styles.smallBtnTxt, { color: colors.warn }]}>Reset</Text>
          </Pressable>
        </Row>
      </View>
    </ScrollView>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={styles.rowLabel}>{label}</Text>
        {hint && <Text style={styles.rowHint}>{hint}</Text>}
      </View>
      {children}
    </View>
  );
}

function Seg({ options, value, onChange }: { options: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.seg}>
      {options.map((o) => {
        const on = o === value;
        return (
          <Pressable key={o} onPress={() => onChange(o)} style={[styles.segBtn, on && styles.segBtnOn]}>
            <Text style={[styles.segTxt, on && styles.segTxtOn]}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: fonts.body, fontWeight: '700', fontSize: 28, color: colors.ink, letterSpacing: -0.5 },
  sub: { color: colors.muted, fontSize: 13.5, marginTop: 2, marginBottom: 18 },
  card: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 14, ...shadow },
  cardTitle: { fontFamily: fonts.body, fontWeight: '700', fontSize: 16, color: colors.ink, marginBottom: 4 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.line },
  rowLabel: { fontWeight: '600', fontSize: 14.5, color: colors.ink },
  rowHint: { fontSize: 12, color: colors.muted, marginTop: 2, lineHeight: 17 },
  timeBtn: { backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.line, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  timeTxt: { fontFamily: fonts.mono, fontSize: 15, color: colors.ink },
  smsNote: { fontSize: 12, color: colors.muted, lineHeight: 17, marginTop: 12, backgroundColor: colors.card2, borderRadius: 12, padding: 12 },
  smallBtn: { backgroundColor: colors.card2, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  smallBtnTxt: { fontWeight: '600', fontSize: 13, color: colors.ink },
  seg: { flexDirection: 'row', backgroundColor: colors.card2, borderRadius: 10, padding: 3 },
  segBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 7 },
  segBtnOn: { backgroundColor: '#fff', ...shadow, shadowOpacity: 0.06 },
  segTxt: { fontSize: 13, fontWeight: '600', color: colors.muted },
  segTxtOn: { color: colors.ink },
});
