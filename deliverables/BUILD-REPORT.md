# StreamX 0.1 — Build Report

## Sources inspected
| Asset | Result |
|---|---|
| `vega-app-5.3.3.zip` | 770 files, extracted and used as the source of truth |
| `vega-app-5.3.3.tar.gz` | 770 files; **SHA-256 of every file identical to the ZIP** (0 differences) |
| `vega-v5.3.3.apk` | 89,273,765 bytes; package `com.vega`, label "Vega", versionName 5.3.3, versionCode 218, minSdk 28, targetSdk 36, 23 permissions, `com.vega.MainActivity` |
| Reference UI image | Read as the visual target (Home, Providers, Details, Player, Drawer, Settings) |
| Logo image | Used as-is for launcher/splash/wordmark; cropped X emblem for the in-app mark |
| GitHub `akhilpal312-debug/StreamX-Movies` | Only a README; not used as a source |

The APK confirms the original identity that StreamX preserves: package `com.vega` and the
existing activity/permission set. StreamX changes the label, icon, version and interface, not the
package.

## What was produced
| Artifact | Status |
|---|---|
| StreamX source tree | Complete, in `StreamX-0.1-source.zip` |
| Brand assets | Complete, in `StreamX-0.1-assets.zip` |
| TypeScript check | **Passed** (`tsc --noEmit`, 0 errors) |
| ESLint (changed areas) | **Passed** (0 errors, 1 pre-existing warning) |
| Unit tests | **Passed** — 4/4 bulk installer tests, 8/8 existing pure-logic tests |
| Production JS bundle | **Passed** — `expo export --platform android`: 2,613 modules, Hermes bytecode 8.6 MB |
| Debug APK | **Built by CI** — GitHub artifact `streamx-debug-apk`, 144,294,940 bytes, workflow run 45408534706 (success) |
| Release AAB | **Built by CI** — GitHub artifact `streamx-release-aab`, 139,932,919 bytes, same run |
| Debug APK / AAB in this workspace | **Not produced here** — the workspace cannot finish the native build; see below |
| CI workflow for debug APK + release AAB | `.github/workflows/streamx-android-build.yml` (committed on `main`) |

## Native build attempts in this workspace (honest limitation)
A portable toolchain was installed into `/tmp` (Temurin JDK 17.0.21.1, cmdline-tools `11076708`,
SDK platform 36, build-tools 36.0.0, NDK 27.1.12297006, CMake 3.22.1) and `expo prebuild` generated
`android/` successfully, so the project's native side is configured correctly. Three
`./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a --no-daemon` runs were then made:

1. **Run 1 (17 minutes of real progress).** Autolinking, manifest merge, Kotlin/Java compilation,
dexing and resource merging for the whole graph (`expo-*`, `react-native-*`, Firebase, Notifee,
WebRTC, MMKV, worklets, reanimated) completed. The last task started was
`:react-native-worklets:configureCMakeDebug[arm64-v8a]`. No Gradle failure occurred; the runner
then killed the process tree, and no exit marker was written.
2. **Run 2.** Failed in 3 s at `android/settings.gradle` line 3 with the exact output:
```
* What went wrong:
A problem occurred evaluating settings 'android'.
> Process 'command 'node'' finished with non-zero exit value 1
```
Cause: the workspace checkpoint strips `node_modules`, so `node --print "require.resolve(
'react-native/package.json')"`, used by the Expo/RN autolinking settings plugin, could not resolve.
3. **Run 3.** After `npm ci` restored dependencies, the build resumed and again reached native task
execution before the runner terminated it. The VM was then replaced (fresh `/tmp`, 16 GB disk with
8.8 GB free, 3 GB RAM), which removed the JDK/SDK install.

So the environment, not the project, is the blocker: the hosted workspace has 3 GB RAM and under
9 GB of free disk, drops `node_modules` and `/tmp` on restore, and kills long-running processes at
the end of each command window. This app's build needs ~3.5 GB of SDK/NDK, ~1 GB of dependencies and
several GB of C++ objects for React Native 0.86 New Architecture, WebRTC, FFmpeg, Cast and
libtorrent — it cannot finish there. No APK/AAB is claimed from this workspace.

## CI workflow that builds both artifacts
`.github/workflows/streamx-android-build.yml` runs on `workflow_dispatch` and on `v*` tags on
`ubuntu-latest` (180-minute timeout): JDK 17 (Temurin), Node 22, the runner image's own Android SDK,
`npm ci`, the cached ARMv7 FFmpegKit build, `expo prebuild`, then `assembleDebug` and
`bundleRelease` with `-PreactNativeArchitectures=arm64-v8a,armeabi-v7a`. Artifacts:
`streamx-0.1-debug.apk` and `streamx-0.1-release.aab`.

### CI result (run 45408534706, commit `c61c06b`, 37m 46s, success)
| Step | Result |
|---|---|
| ARMv7 FFmpegKit (source build, cache miss) | 10m 42s |
| Debug APK (`assembleDebug`, arm64-v8a + armeabi-v7a) | 12m 47s |
| Release AAB (`bundleRelease`, R8 + resource shrinking) | 11m 54s |
| `streamx-debug-apk` artifact | 144,294,940 bytes |
| `streamx-release-aab` artifact | 139,932,919 bytes |

Both artifacts are zipped by GitHub on upload and each contains a single file that is already a zip
container, so the archive sizes above are effectively the APK and AAB sizes. Download them from the
run page: Actions → “StreamX Android build” → run 45408534706 → Artifacts.

### Errors that had to be fixed before artifacts appeared
1. `android-actions/setup-android@v3` failed 11 s into the first run: on the `ubuntu-26.04` runner
image it treats the preinstalled `cmdline-tools 20.0` as the “wrong version”, downloads
`cmdline-tools 16.0`, then dies in the license step. The workflow now uses the image's own SDK
(`ANDROID_HOME`, `cmdline-tools/latest/bin`).
2. `bundleRelease` failed at `:app:verifyFfmpegArmv7`:
```
> Task :app:verifyFfmpegArmv7 FAILED
* What went wrong:
Execution failed for task ':app:verifyFfmpegArmv7'.
> Missing ARMv7 FFmpegKit: .../android/app/src/main/jniLibs/armeabi-v7a/libffmpegkit.so.
  Run bash scripts/build-ffmpeg-armv7.sh before Expo prebuild.
```
That guard runs only when release native libraries are merged, which is why the debug APK built on
the first attempt while the AAB could not. The workflow now calls the repository's cached
`.github/actions/ffmpeg-armv7` composite action before `expo prebuild`; the FFmpeg ARMv7 libraries
are also why the debug APK grew from 133,938,071 to 144,294,940 bytes between runs.

Signing: if the repository secrets `ANDROID_KEYSTORE_BASE64`, `ANDROID_KEYSTORE_PASSWORD`,
`ANDROID_KEY_ALIAS` and `ANDROID_KEY_PASSWORD` are set, the AAB is signed with that keystore;
otherwise the job generates a temporary CI keystore so the AAB still builds, emits a warning, and
that AAB is **not** Play Store ready. (A step-level `if: secrets.X != ''` guard is not usable in
GitHub Actions, and `bundleRelease` fails outright when no keystore is configured, hence the
env-var approach.)

### Reproduce the native build
On a machine with JDK 17 and Android SDK 36 (or with EAS Build):

```bash
npm install
npx expo prebuild --platform android
cd android
./gradlew assembleDebug                 # debug APK
./gradlew assembleRelease               # release APK (signing env vars required)
./gradlew bundleRelease                 # AAB
```

Release signing reads `MYAPP_UPLOAD_STORE_FILE`, `MYAPP_UPLOAD_STORE_PASSWORD`,
`MYAPP_UPLOAD_KEY_ALIAS` and `MYAPP_UPLOAD_KEY_PASSWORD` through
`plugins/with-android-signing.js`. No keystore is included in this delivery; a debug build uses the
standard Android debug keystore generated by prebuild.

EAS alternative: `npx eas build -p android --profile preview` (APK) or
`npx eas build -p android --profile production` (AAB).

## Identity changes
- `app.config.js`: name/displayName `StreamX`, slug `streamx`, scheme `streamx`,
  version `0.1.0`, versionCode `1`, `icon`/`adaptiveIcon` from `assets/`, adaptive background
  `#F2F0F3`, `userInterfaceStyle: automatic`. Package `com.vega` and `minSdkVersion: 28` unchanged.
- Self-update code paths and Vega project links are removed from the UI.

## Verification summary
Verified in this environment:
- full Metro production bundle of the Android JS graph (all imports resolve, no syntax errors),
- strict TypeScript compilation,
- ESLint over every changed file,
- new installer logic under Jest with mocked provider manager/storage,
- provider manifest reachability and shape (68 providers) from the Zenda Cross repository.

Not verified in this environment:
- device/emulator rendering, animations and touch behaviour (no emulator, no GPU, no device),
- an end-to-end provider install against real provider CDN files (unit-level only),
- release signing and Play Store validation,
- native build/runtime behaviour.
