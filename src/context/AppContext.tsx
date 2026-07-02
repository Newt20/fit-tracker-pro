import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getSetting, setSetting } from '../db/repository';
import { scheduleDailyReminder, cancelDailyReminder } from '../lib/notifications';
import type { Units } from '../lib/format';

export type Settings = {
  remOn: boolean;
  remHour: number;
  remMinute: number;
  units: Units;
};

const DEFAULTS: Settings = {
  remOn: false,
  remHour: 19,
  remMinute: 0,
  units: { dist: 'km', wt: 'kg' },
};

type Ctx = {
  ready: boolean;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => Promise<void>;
  dataVersion: number;
  bumpData: () => void;
};

const AppContext = createContext<Ctx>({
  ready: false,
  settings: DEFAULTS,
  updateSettings: async () => {},
  dataVersion: 0,
  bumpData: () => {},
});

export const useApp = () => useContext(AppContext);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<Settings>(DEFAULTS);
  const [dataVersion, setDataVersion] = useState(0);

  const bumpData = useCallback(() => setDataVersion((v) => v + 1), []);

  // Load persisted settings on boot.
  useEffect(() => {
    (async () => {
      const raw = await getSetting('settings');
      if (raw) {
        try {
          setSettings({ ...DEFAULTS, ...JSON.parse(raw) });
        } catch {
          /* keep defaults */
        }
      }
      setReady(true);
    })();
  }, []);

  const updateSettings = useCallback(
    async (patch: Partial<Settings>) => {
      const next = { ...settings, ...patch, units: { ...settings.units, ...(patch.units ?? {}) } };
      setSettings(next);
      await setSetting('settings', JSON.stringify(next));

      // Reconcile the OS reminder whenever reminder fields change.
      const remChanged =
        'remOn' in patch || 'remHour' in patch || 'remMinute' in patch;
      if (remChanged) {
        if (next.remOn) {
          const ok = await scheduleDailyReminder(next.remHour, next.remMinute);
          if (!ok && next.remOn) {
            // Permission denied or simulator — turn the toggle back off.
            const reverted = { ...next, remOn: false };
            setSettings(reverted);
            await setSetting('settings', JSON.stringify(reverted));
          }
        } else {
          await cancelDailyReminder();
        }
      }
    },
    [settings]
  );

  return (
    <AppContext.Provider value={{ ready, settings, updateSettings, dataVersion, bumpData }}>
      {children}
    </AppContext.Provider>
  );
}
