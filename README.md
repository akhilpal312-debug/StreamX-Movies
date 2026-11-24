# StreamX 0.1

StreamX is a cinematic Android streaming front-end for Android phones, tablets and TV.
It keeps the full Vega 5.3.3 playback and provider engine and replaces the interface with a
light "liquid glass" design system, a floating glass tab bar and a one-tap provider installer
preloaded with the Zenda Cross provider repository.

| | |
|---|---|
| App name | StreamX |
| Version | 0.1.0 (versionCode 1) |
| Package | `com.vega` (unchanged, so existing provider data and settings keep working) |
| Min / target SDK | 28 / 36 |
| Runtime | React Native 0.86 · Expo SDK 54 · Hermes |

## What is inside

- **Home** – StreamX wordmark and drawer, time-aware greeting, rounded hero card with rating,
  genres, Watch Now and a real My List toggle, paged hero dots, and the original trending rows.
- **Providers** – Zenda Cross is preloaded as the default provider source. "Install All
  Providers" installs every enabled provider (concurrency 3, per-provider retry, live progress,
  cancel, failure list and summary). Filters: All, Installed, Not installed, Updates, Failed.
- **Details** – dark cinematic backdrop, artwork-adaptive accent, glass chips, star rating,
  Play Now and My List, seasons/episodes and recommendations.
- **Player** – untouched playback pipeline (ExoPlayer/FFmpeg, subtitles, audio tracks,
  quality, PiP, Cast, downloads).
- **Drawer** – Home, Discover, My List, Downloads, Providers, Settings, About StreamX.
- **Settings** – glass sections, Light / Dark / System theme picker, artwork accent switch,
  player, download, DNS/WARP and data management screens, About & Legal with open-source licences.
- **Themes** – pearl palette `#F2F0F3 / #FAF9FB / #C7C7D0 / #24232A / #777580 / #15151B / #D9C9AD`,
  light by default, full dark mode, follows the system when set to System.

## Requirements

- Node.js 20+ and npm
- JDK 17 and Android SDK 36 for a native build (not bundled)
- For release signing: `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_STORE_PASSWORD`,
  `MYAPP_UPLOAD_KEY_ALIAS`, `MYAPP_UPLOAD_KEY_PASSWORD` and a keystore

## Run

```bash
npm install
npx expo prebuild --platform android   # generates ./android
npx expo run:android                   # debug build on a connected device/emulator
```

## Build

```bash
# Debug APK
cd android && ./gradlew assembleDebug

# Release APK / AAB (requires the signing variables above)
cd android && ./gradlew assembleRelease
cd android && ./gradlew bundleRelease
```

Or with EAS: `npx eas build -p android --profile preview`.

## Checks

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint <paths>
npx jest __tests__/bulkProviderInstaller.test.ts
npx expo export --platform android --output-dir dist-export
```

## Providers

The default source is `https://github.com/Zenda-Cross/vega-providers`
(manifest: `.../main/manifest.json`). Providers are fetched at runtime, so the catalogue stays
current without an app update. No provider modules are bundled in this repository.

## Notes

- StreamX does not self-update and does not link to the Vega project.
- The package name, provider extension storage and settings keys are unchanged for continuity.
- The supplied logo is used as-is for the launcher icon, splash and in-app wordmark.

## Licence

Derived from the open-source Vega player (see `LICENSE` and the in-app licences screen).
