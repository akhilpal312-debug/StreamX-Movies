#!/usr/bin/env bash
# Temporary CI diagnostic: rebuild only the release AAB and print a short
# failure summary, keeping the job log small enough to read.
set -uo pipefail

export ANDROID_HOME="${ANDROID_HOME:-/usr/local/lib/android/sdk}"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH"
LOG="$RUNNER_TEMP/gradle-aab.log"

npm ci --no-audit --no-fund > "$RUNNER_TEMP/npm.log" 2>&1 || {
  echo "npm ci failed:"
  tail -n 30 "$RUNNER_TEMP/npm.log"
  exit 1
}

npx expo prebuild --platform android --no-install > "$RUNNER_TEMP/prebuild.log" 2>&1 || {
  echo "expo prebuild failed:"
  tail -n 30 "$RUNNER_TEMP/prebuild.log"
  exit 1
}

KEYSTORE="$RUNNER_TEMP/streamx-release.keystore"
keytool -genkeypair -v -storetype PKCS12 -keystore "$KEYSTORE" \
  -alias streamx-ci -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass ci-temporary -keypass ci-temporary \
  -dname "CN=StreamX CI, OU=CI, O=StreamX, L=Unknown, ST=Unknown, C=US" \
  > /dev/null 2>&1
export MYAPP_UPLOAD_STORE_FILE="$KEYSTORE"
export MYAPP_UPLOAD_STORE_PASSWORD="ci-temporary"
export MYAPP_UPLOAD_KEY_ALIAS="streamx-ci"
export MYAPP_UPLOAD_KEY_PASSWORD="ci-temporary"

chmod +x android/gradlew
(
  cd android || exit 1
  ./gradlew bundleRelease --no-daemon --console=plain \
    -PreactNativeArchitectures="${REACT_NATIVE_ARCHITECTURES:-arm64-v8a}"
) > "$LOG" 2>&1
STATUS=$?

echo "gradle exit: $STATUS"
echo "----- matching error lines -----"
grep -E "FAILURE:|What went wrong|Execution failed for task|Caused by:|error:|Error:|^e: |lint" "$LOG" | tail -n 30
echo "----- last 45 lines -----"
tail -n 45 "$LOG"
echo "----- end -----"

exit "$STATUS"
