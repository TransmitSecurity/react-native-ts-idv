# 🚀 Release Notes - IDV React Native

## Version 1.0.11

- **Android:** Updated native SDK to version 1.3.5
- **iOS:** Updated native SDK to version 1.3.5. The dependency is now an exact pin (`1.3.5`, previously `~> 1.2.10`), matching Android.
- **Dependencies:** The native SDK now brings AccountProtection 3.x and core SDK 1.1.x (Android `accountprotection:3.0.3`, `core:1.1.1`; iOS `AccountProtection ~> 3.0.3`, `TSCoreSDK ~> 1.1.5`). Apps that also use a Mosaic SDK on AccountProtection 2.x or core 1.0.x must update it. See the README.
- **Requirements:** Xcode 16. On Android, compileSdk 34, Kotlin 1.9 and a JDK 17 build. The module's fallback Kotlin and compileSdk versions were raised to match.
- **New:** `additionalData.errorCode` on failure and recapture events, with the same value on both platforms (`TSIDV.ErrorCode`, `TSIDV.RecaptureReasonCode`). Promise rejections carry `userInfo.errorCode` (`TSIDV.RejectCode`). New error cases `initializationError` (iOS), `notInitialized` and `configFetchError`.
- **New (iOS):** `initializeSDK(configurationFileName)` initializes from a named configuration plist. On Android it rejects with `notSupported`.
- **Fixed (Android):** `initialize(clientId, baseUrl)` now uses the base URL. It was ignored, so every app used the US endpoint.
- **Fixed (Android):** `initializeSDK()` rejects when `strings.xml` is missing the client ID or base URL, instead of crashing the app.
- **Fixed (Android):** `recapture()` now resolves, or rejects when there is no foreground activity. It used to return without an error.
- **Fixed (Android):** `setLogLevel` rejects an unknown level, as iOS does.
- **Fixed (Android):** Apps that minify with R8 no longer fail the release build with `Missing class kotlinx.parcelize.Parcelize`. The module now ships a consumer rule for it.
- **Fixed (Android):** The recapture reason in `additionalData.error` is now the reason text (for example `image_missing`), matching iOS. It used to be an internal object name.
- **Fixed (iOS):** `additionalData.error` for face authentication and Mosaic UI failures is now the error name (for example `configFetchError`), matching identity verification. It used to be a generic system message.
- **Fixed (iOS):** Identity verification started after a Mosaic UI flow now reports its status events. They used to go to the SDK instead of the app.
- **Fixed (iOS):** A possible crash in `setLogLevel` when the JavaScript bridge reloads.
- **Behavior (native 1.3.3+):** Every start fetches the SDK configuration first, and fails with `configFetchError` or `sdkDisabled` before a session starts if that fails.
- **Behavior (iOS):** The core SDK no longer excludes the arm64 simulator architecture from the app target.
- **Known issues (iOS):** A configuration fetch failure when Mosaic UI starts sends no `mosaicUIVerificationDidFail` event. The NFC chip-reading step doesn't complete on devices without NFC. See the README for the NFC setup.

## Version 1.0.10, November 2025

- **Android:** Updated native SDK to version 1.3.1 
- **iOS:** Updated native SDK to version 1.2.10
