# Fit Track — mobile workout tracker

A native **iOS + Android** app (Expo / React Native) that tracks **walking, rope-jumping, and weighted / bodyweight strength** work. It stores everything in an on-device SQLite database, sends a **daily local notification** reminder, shows a **calendar**, builds a **weekly summary**, and **frees up space by deleting the day-by-day rows once a week has been summarized** (the totals stay).

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
│   │   └── notifications.ts      # request permission + schedule the daily reminder
│   ├── context/
│   │   └── AppContext.tsx        # settings + a "data changed" signal for refreshes
│   ├── theme/
│   │   └── theme.ts              # colors, spacing, fonts, activity definitions
│   └── components/
│       ├── StatCard.tsx          # scoreboard stat tile
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

**Weekly summary + cleanup.** On the Summary tab, "Summarize this/last week" aggregates that week's rows into one `summaries` record. "Free up space" then **deletes the raw `entries` rows for every summarized week and marks the summary `archived`** — exactly the "remove older data whose summary has been made" behavior. Those days show a faint grey dot on the calendar so you know they were archived, not lost.

## 7. Notes & easy upgrades

- **Custom fonts.** The design uses a monospace for numbers (scoreboard feel). To use *Space Grotesk* + *JetBrains Mono*, run `npx expo install expo-font @expo-google-fonts/space-grotesk @expo-google-fonts/jetbrains-mono`, load them in `app/_layout.tsx`, and set the family names in `src/theme/theme.ts`.
- **File-based export.** Export currently uses the share sheet. For a saved `.json` file, add `expo-file-system` + `expo-sharing` and write the dump to a file.
- **Real SMS (if you ever want it).** You'd run a small backend (e.g. Node + Twilio), store the user's verified number, and POST to the SMS API on a daily cron — `client.messages.create({ to, from, body })`. The app stays the same; the backend does the texting.

## 8. Troubleshooting

- *"Notifications not granted"* → allow notifications for the app in phone settings; remember they don't fire on simulators.
- *Version mismatch warnings* → run `npx expo install --fix` again.
- *Metro cache weirdness* → `npx expo start --clear`.
```
