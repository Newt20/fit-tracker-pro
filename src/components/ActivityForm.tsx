import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Switch, Alert } from 'react-native';
import { ACTIVITY, ActivityType, colors, fonts, radius, shadow } from '../theme/theme';
import { addEntry } from '../db/repository';
import { useApp } from '../context/AppContext';

export function ActivityForm({ date, onSaved }: { date: string; onSaved: () => void }) {
  const { settings, bumpData } = useApp();
  const u = settings.units;
  const [type, setType] = useState<ActivityType>('walk');

  // shared fields
  const [dist, setDist] = useState('');
  const [mins, setMins] = useState('');
  const [steps, setSteps] = useState('');
  const [jumps, setJumps] = useState('');
  const [name, setName] = useState('');
  const [weighted, setWeighted] = useState(false);
  const [weight, setWeight] = useState('');
  const [sets, setSets] = useState('');
  const [reps, setReps] = useState('');

  const num = (s: string) => Number(s) || 0;

  async function save() {
    const base = {
      date, type,
      dist: 0, mins: 0, steps: 0, jumps: 0, sets: 0, reps: 0, weighted: 0, weight: 0, name: '',
    };
    if (type === 'walk') {
      base.dist = num(dist); base.mins = num(mins); base.steps = num(steps);
      if (!base.dist && !base.mins && !base.steps) return Alert.alert('Add a distance, time, or steps');
    } else if (type === 'rope') {
      base.jumps = num(jumps); base.mins = num(mins); base.sets = num(sets);
      if (!base.jumps && !base.mins) return Alert.alert('Add jumps or duration');
    } else {
      base.name = name.trim() || 'Strength';
      base.weighted = weighted ? 1 : 0;
      base.weight = weighted ? num(weight) : 0;
      base.sets = num(sets); base.reps = num(reps);
      if (!base.sets || !base.reps) return Alert.alert('Add sets and reps');
    }
    await addEntry(base);
    bumpData();
    onSaved();
  }

  return (
    <View>
      <View style={styles.picker}>
        {(Object.keys(ACTIVITY) as ActivityType[]).map((t) => {
          const sel = type === t;
          return (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              style={[styles.pick, sel && { borderColor: ACTIVITY[t].color, backgroundColor: ACTIVITY[t].soft }]}
            >
              <Text style={{ fontSize: 26 }}>{ACTIVITY[t].emoji}</Text>
              <Text style={styles.pickName}>{ACTIVITY[t].name}</Text>
            </Pressable>
          );
        })}
      </View>

      {type === 'walk' && (
        <>
          <Row>
            <Field label={`Distance (${u.dist})`} value={dist} onChange={setDist} keyboard="decimal-pad" />
            <Field label="Duration (min)" value={mins} onChange={setMins} keyboard="number-pad" />
          </Row>
          <Field label="Steps (optional)" value={steps} onChange={setSteps} keyboard="number-pad" />
        </>
      )}

      {type === 'rope' && (
        <>
          <Row>
            <Field label="Total jumps" value={jumps} onChange={setJumps} keyboard="number-pad" />
            <Field label="Duration (min)" value={mins} onChange={setMins} keyboard="number-pad" />
          </Row>
          <Field label="Sets (optional)" value={sets} onChange={setSets} keyboard="number-pad" />
        </>
      )}

      {type === 'lift' && (
        <>
          <Field label="Exercise" value={name} onChange={setName} keyboard="default" placeholder="e.g. Squat, Push-up" mono={false} />
          <View style={styles.switchRow}>
            <Text style={styles.switchLabel}>Weighted</Text>
            <Switch value={weighted} onValueChange={setWeighted} trackColor={{ true: colors.lift }} />
          </View>
          {weighted && <Field label={`Weight (${u.wt})`} value={weight} onChange={setWeight} keyboard="decimal-pad" />}
          <Row>
            <Field label="Sets" value={sets} onChange={setSets} keyboard="number-pad" />
            <Field label="Reps / set" value={reps} onChange={setReps} keyboard="number-pad" />
          </Row>
        </>
      )}

      <Pressable onPress={save} style={({ pressed }) => [styles.save, pressed && { opacity: 0.9 }]}>
        <Text style={styles.saveTxt}>Save to log</Text>
      </Pressable>
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <View style={{ flexDirection: 'row', gap: 10 }}>{children}</View>;
}

function Field({
  label, value, onChange, keyboard, placeholder, mono = true,
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  keyboard: 'decimal-pad' | 'number-pad' | 'default';
  placeholder?: string;
  mono?: boolean;
}) {
  return (
    <View style={{ flex: 1, marginBottom: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType={keyboard}
        placeholder={placeholder ?? '0'}
        placeholderTextColor={colors.muted}
        style={[styles.input, { fontFamily: mono ? fonts.mono : fonts.body }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  picker: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  pick: {
    flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: 'center', gap: 7,
    backgroundColor: colors.card, borderWidth: 2, borderColor: 'transparent', ...shadow,
  },
  pickName: { fontSize: 12.5, fontWeight: '600', color: colors.ink },
  label: { fontSize: 12, fontWeight: '600', color: colors.inkSoft, marginBottom: 6 },
  input: {
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, color: colors.ink,
  },
  switchRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.card, borderWidth: 1.5, borderColor: colors.line, borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 8, marginBottom: 14,
  },
  switchLabel: { fontSize: 14, fontWeight: '500', color: colors.ink },
  save: { backgroundColor: colors.ink, borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  saveTxt: { color: colors.white, fontWeight: '600', fontSize: 15 },
});
