# Fit Track — Build & Deploy

## Android APK (release)

**Location after build:** `android/app/build/outputs/apk/release/app-release.apk`

**How to build:**
```bash
# Option 1: Using Docker (no JDK/Android Studio required on Windows)
docker run --rm -v ${PWD}:/app -w /app fit-track-android bash -c "cd android && ./gradlew assembleRelease"

# Option 2: Using local Gradle (if you have JDK + Android SDK installed)
cd android && ./gradlew assembleRelease
```

**Install on device via USB:**
```bash
adb install -r android/app/build/outputs/apk/release/app-release.apk
```

**Or manually:**
1. Copy `android/app/build/outputs/apk/release/app-release.apk` to your phone via USB.
2. On the phone, tap to install (may need to enable "Unknown sources" in Settings).
3. Open the "Fit Track" app — it should work fully offline (no Metro dev server needed).

---

## iOS IPA (release)

iOS builds run on Expo's cloud Mac fleet via **EAS Build**. Local building is impossible on Windows — it requires Xcode on macOS.

### Prerequisites

1. **Expo account** — sign up at https://expo.dev if you don't have one.
2. **Apple Developer account** — required to sign the IPA for distribution.
   - Free: Apple ID only, but App Store distribution is limited.
   - Paid: ~$99/year, full App Store + TestFlight access.

### Build steps

```bash
# 1. Log in to Expo (if not already)
eas login

# 2. Build the IPA in the cloud
eas build -p ios

# When prompted:
#   - App signing method: "Expo managed" (automatic) or "local" (if you have your own signing certs)
#   - Build type: "Release" (distributable) or "Preview" (for internal testing)
```

### After the build

- Expo will show a link to download the `.ipa` file from the EAS dashboard.
- To install on a real iPhone:
  - Use **TestFlight** (if you have an Apple Developer account) — invite testers and they install via the TestFlight app.
  - Or use **Xcode** + a connected USB cable.
  - Or use an MDM solution (enterprise).

### Current config in `app.json`

```json
{
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.example.fittrack",
    "infoPlist": { "UIBackgroundModes": [] }
  },
  "extra": {
    "eas": {
      "projectId": "0b55504b-1886-46b3-95f7-ae1d67a82439"
    }
  },
  "owner": "arisenewts-team"
}
```

The `projectId` and `owner` link this repo to an Expo account. When you run `eas build -p ios`, it will use this project.

---

## Recent changes

- **Chart:** Weekly consistency chart added to the Summary screen, showing stacked bars (walk/rope/lift) per week over the last ~8 weeks.
- **PDF export:** The Export feature now generates a formatted PDF report (with the chart, totals, and a week-by-week table) instead of JSON.
- **Branding:** "Fit Track" now appears throughout (replaced "Move Ledger"). App logo now uses `assets/fit-track.png`.
- **Dependencies:** Added `expo-print` and `expo-sharing` for PDF generation and file sharing.

---

## Troubleshooting

### Android APK not installing
- Ensure you're using the **release** APK (`app-release.apk`), not the debug APK.
- If it says "App not installed," try uninstalling any old version first: `adb uninstall com.example.fittrack`.

### Docker build fails
- Make sure Docker Desktop is running: `docker info`.
- Rebuild the Docker image if needed: `docker build -t fit-track-android .`.

### iOS/EAS build fails
- Confirm you're logged in: `eas whoami`.
- Check your Expo project: `eas build --status` (shows recent builds).
- Review logs at https://expo.dev/dashboard after a failed build.

### Native module issues
- If you add/remove native packages in the future, always run `npx expo prebuild -p android --clean` (and `prebuild -p ios --clean` if you're building iOS locally with Xcode) after modifying `package.json`.
