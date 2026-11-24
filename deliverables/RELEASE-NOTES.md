# StreamX 0.1 — Release Notes

**Version:** 0.1.0 (versionCode 1)
**Package:** `com.vega`
**Base:** Vega 5.3.3 source (verified byte-identical ZIP and TAR.GZ uploads, 770 files)

## Highlights

### A new identity
- App name, splash, launcher icon, adaptive icon, in-app wordmark and About screen are StreamX.
- The supplied logo is used unmodified; the in-app mark is a cropped X emblem derived from it.
- Vega self-update checks and the Vega GitHub link were removed so the app cannot replace itself
  with Vega.

### Liquid Glass design system
- Pearl palette: `#F2F0F3`, `#FAF9FB`, `#C7C7D0`, `#24232A`, `#777580`, `#15151B`, `#D9C9AD`.
- Reusable glass surfaces (translucent fill, hairline highlight, soft shadow), liquid press
  feedback with spring physics, glass buttons and a floating glass tab bar.
- Light by default, full dark theme, and a System option. Status/navigation bars follow the mode.
- Material 3 role tokens are preserved, so every existing screen reskins consistently.

### Home
- Wordmark header with drawer button and time-aware greeting.
- Rounded hero card with backdrop, rating, genres, Watch Now and a working My List toggle.
- Animated paging dots and the original trending/new-release rows.

### Providers
- Zenda Cross is preinstalled as the default provider source
  (`Zenda-Cross/vega-providers`, manifest, 68 providers).
- **Install All Providers**: installs every enabled provider with concurrency 3, retries a failed
  provider once, shows live counts and current provider, supports cancel, and reports a summary
  plus a per-provider failure list with retry.
- Installed providers are verified through extension storage after install; the installer skips
  providers that are already up to date and disabled ones.
- Filters: All / Installed / Not installed / Updates / Failed, with search.
- Redesigned provider rows with version, author, status chip and install/update/remove actions.

### Details and player
- Details keeps a cinematic dark treatment with artwork-adaptive accent, glass chips, star rating,
  Play Now and My List.
- Playback, subtitles, audio tracks, quality selection, PiP, downloads, Cast, DNS/WARP and the
  download manager are unchanged.

### Drawer and settings
- Glass drawer: Home, Discover, My List, Downloads, Providers, Settings, About StreamX.
- Settings rewritten with glass section cards; Home, Discover and search entry points preserved.
- New theme picker (Light / Dark / System) available in Settings and Appearance.
- About StreamX: logo, version, open-source licences, provider repository link.

## Compatibility notes

- `versionCode` is 1, lower than Vega's 218. Android will refuse an over-the-top update over an
  installed Vega; uninstall the old app first (provider data is not carried across an uninstall).
- The package id is intentionally unchanged, so a build signed with the same key can continue to
  use existing app data.
- Casting still uses the existing Vega Cast backend and receiver names; this release does not
  change the cast protocol.

## Known gaps

- No native APK/AAB was produced in the build environment — see `BUILD-REPORT.md`.
- There is no Watch History screen in this codebase, so the drawer does not list one.
- The interface could not be visually verified on a device or emulator in this environment.
