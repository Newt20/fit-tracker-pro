# Fit Track — mobile workout tracker

A native **iOS + Android** app (Expo / React Native) that tracks **walking, rope-jumping, and weighted / bodyweight strength** work. It stores everything in an on-device SQLite database, sends a **daily local notification** reminder, shows a **calendar**, builds a **weekly summary** with a **stacked-bar consistency chart**, exports data as a **PDF report**, and **frees up space by deleting the day-by-day rows once a week has been summarized** (the totals stay).

Built for **Expo SDK 54** (React Native 0.81.5, React 19.1).

---

## 1. What you need installed

- **Node.js 20.19.4 or newer** (`node -v`)
- **A phone** with the **Expo Go** app (App Store / Play Store) for quick testing, **or** Android Studio / Xcode for a full development build.
  - ⚠️ Local notifications **do not fire on simulators/emulators** — use a real device to test the reminder.

No global CLI install is required; commands below use `npx`.

## 2. Install

From inside the project folder:

```bash
npm install
npx expo install --fix     # aligns every native package to SDK 54 exactly
```

`expo install --fix` is important: it reconciles `react-native`, `react-native-screens`, `datetimepicker`, etc. to the versions that match the installed Expo SDK, so you never hit version-mismatch errors.

## 3. Run it

```bash
npx expo start
```

Then either:
- Scan the QR code with **Expo Go** (fastest), **or**
- Press `a` (Android) / `i` (iOS) to open a simulator (everything works there *except* notifications).

For a production-grade build with reliable notifications, create a development build instead:

```bash
npx expo run:android      # or: npx expo run:ios
```

## 4. Build to the stores (optional)

```bash
npm install -g eas-cli
eas build -p android      # or -p ios
eas submit                # upload to Play Store / App Store
```

### 4b. Docker Android build environment (optional)

The root `Dockerfile` bundles Eclipse Temurin **JDK 17**, the Android **cmdline-tools**, `platform-tools`, `platforms;android-34`, `build-tools;34.0.0`, and **Node 20** — everything needed to compile the Android app without installing Android Studio locally.

```bash
docker build -t fit-track-android .
docker run --rm -it -v ${PWD}:/app fit-track-android bash

# inside the container:
npm install
npx expo prebuild -p android   # generates the native android/ project (gitignored)
cd android && ./gradlew assembleRelease
```

This is a local alternative to `eas build -p android` for producing an APK without Android Studio or EAS cloud credits. It doesn't include an emulator or device, so it's for **building** only, not for running/testing the app.

---

## 5. Folder structure

```
move-ledger/
├── app/                          # screens (expo-router, file-based routing)
│   ├── _layout.tsx               # opens the DB, runs migrations, wraps app in providers
│   ├── log.tsx                   # modal: view a day + add an activity
│   └── (tabs)/
│       ├── _layout.tsx           # bottom tab bar + floating "＋" log button
│       ├── index.tsx             # Today — stats, reminder banner, today's entries
│       ├── calendar.tsx          # Calendar — month grid with activity dots
│       ├── summary.tsx           # Weekly summary + "free up space" cleanup
│       └── settings.tsx          # Reminder, units, export, reset
│
├── src/
│   ├── db/
│   │   ├── database.ts           # SQLite singleton + schema/migrations
│   │   └── repository.ts         # all queries: CRUD, totals, summaries, cleanup
│   ├── lib/
│   │   ├── dates.ts              # date keys, formatting, ISO-week math
│   │   ├── format.ts             # how each activity's value/label is shown
│   │   ├── notifications.ts      # request permission + schedule the daily reminder
│   │   ├── chartMath.ts          # data normalization for consistency chart
│   │   └── pdfReport.ts          # HTML builder for PDF export
│   ├── context/
│   │   └── AppContext.tsx        # settings + a "data changed" signal for refreshes
│   ├── theme/
│   │   └── theme.ts              # colors, spacing, fonts, activity definitions
│   └── components/
│       ├── StatCard.tsx          # scoreboard stat tile
│       ├── ConsistencyChart.tsx  # weekly stacked-bar chart (walk/rope/lift)
│       ├── EntryRow.tsx          # one logged activity (with delete)
│       ├── CalendarGrid.tsx      # the month grid
│       ├── ActivityForm.tsx      # type picker + fields, saves to DB
│       └── Empty.tsx             # empty-state placeholder
│
├── assets/                       # icon / splash (placeholders — swap your own)
├── app.json                      # Expo config + plugins (router, sqlite, notifications)
├── eas.json                      # EAS Build profiles (preview APK)
├── Dockerfile                    # containerized Android build environment
├── package.json
├── tsconfig.json
├── babel.config.js
└── .gitignore
```

## 6. How the pieces work

**Storage.** Everything lives in a local SQLite file (`fittrack.db`) created on first launch by `src/db/database.ts`. Three tables: `entries` (one row per logged activity), `summaries` (one row per summarized week), and `settings` (key/value).

**Daily notification.** In Settings, toggle *Remind me to log* and pick a time. `src/lib/notifications.ts` requests permission and schedules a repeating `DAILY` local notification via `expo-notifications`. Turning it off cancels it. This is a genuine phone notification — no SMS, no server, no cost.

**Weekly summary + consistency chart.** On the Summary tab, "Summarize this/last week" aggregates that week's rows into one `summaries` record. The Summary screen displays a **stacked-bar chart** showing the last ~8 weeks: bar height = active days (0–7), and each bar is split into walk/rope/lift segments proportional to that week's activity mix. Lightweight custom component, no external charting library needed.

**Data export.** The Settings → "Export PDF report" generates a formatted PDF with: totals across the window (walk distance, rope jumps, strength sets, active days), a rendering of the consistency chart, and a week-by-week breakdown table. The PDF is shared via the OS share sheet (email, messaging, cloud storage, etc.). Uses `expo-print` and `expo-sharing` under the hood.

**Cleanup.** On the Summary tab, "Free up space" then **deletes the raw `entries` rows for every non-archived week and marks the summary `archived`** — exactly the "remove older data whose summary has been made" behavior. Those days show a faint grey dot on the calendar so you know they were archived, not lost.

## 7. Notes & easy upgrades

- **Custom fonts.** The design uses a monospace for numbers (scoreboard feel). To use *Space Grotesk* + *JetBrains Mono*, run `npx expo install expo-font @expo-google-fonts/space-grotesk @expo-google-fonts/jetbrains-mono`, load them in `app/_layout.tsx`, and set the family names in `src/theme/theme.ts`.
- **PDF export.** Currently generates a report with totals, chart, and week-by-week table. To customize the report layout, edit `src/lib/pdfReport.ts` (HTML template) or `src/lib/chartMath.ts` (data normalization).
- **Chart customization.** The consistency chart shows the last ~8 weeks. To change the window size, pass a different `weeks` argument to `getWeeklyChartData(N)` in `app/(tabs)/summary.tsx` and the PDF export `onExportPdf()` function.
- **Real SMS (if you ever want it).** You'd run a small backend (e.g. Node + Twilio), store the user's verified number, and POST to the SMS API on a daily cron — `client.messages.create({ to, from, body })`. The app stays the same; the backend does the texting.

## 8. Troubleshooting

- *"Notifications not granted"* → allow notifications for the app in phone settings; remember they don't fire on simulators.
- *Version mismatch warnings* → run `npx expo install --fix` again.
- *Metro cache weirdness* → `npx expo start --clear`.
- *Release APK installs but instantly crashes on open (works in Expo Go)* → almost always an Expo native module whose version doesn't match the SDK. npm's peer auto-install can silently pull a **newer-SDK** module (e.g. `expo-font@57` into an SDK 54 project via `@expo/vector-icons`), which throws `NoSuchMethodError` at startup. Check with:
  ```bash
  node -p "require('./node_modules/expo-font/package.json').version"
  ```
  and compare against `node_modules/expo/bundledNativeModules.json`. Fix by installing the bundled version explicitly (use `--legacy-peer-deps` if npm raises ERESOLVE), then re-run `npx expo prebuild -p android --clean` and rebuild.
- *APK won't update over an existing install* → each `expo prebuild --clean` regenerates the signing keystore, so Android sees a different signature. Fully uninstall the app first, then install the new APK.
- *Getting a crash log without installing anything* → the Docker image already contains `adb`. With the phone's **Wireless debugging** enabled (Android 11+): pair with `adb pair IP:PAIR_PORT CODE`, connect with `adb connect IP:PORT`, then `adb logcat -d -b crash`.
```
