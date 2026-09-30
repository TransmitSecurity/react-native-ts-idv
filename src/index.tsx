import { NativeModules, Platform } from 'react-native';

const LINKING_ERROR =
  `The package 'react-native-ts-idv' doesn't seem to be linked. Make sure: \n\n` +
  Platform.select({ ios: "- You have run 'pod install'\n", default: '' }) +
  '- You rebuilt the app after installing the package\n' +
  '- You are not using Expo Go\n';

const TsIdv = NativeModules.TsIdv
  ? NativeModules.TsIdv
  : new Proxy(
    {},
    {
      get() {
        throw new Error(LINKING_ERROR);
      },
    }
  );

export namespace TSIDV {
  export const enum IdentityVerificationError {
    cameraPermissionRequired,
    sdkDisabled,
    sessionNotValid,
    verificationStatusError,
    recaptureNotRequired,
    genericServerError,
    networkError,
    // Appended rather than inserted so the existing numeric values stay put.
    // initializationError is iOS-only; notInitialized maps to Android's
    // SdkNotInitialized; configFetchError exists on both.
    initializationError,
    notInitialized,
    configFetchError
  }

  export const enum IDVLogLevel {
    verbose = "verbose",
    debug = "debug",
    info = "info",
    warning = "warning",
    error = "error",
    crytical = "crytical",
    off = "off"
  }

  /**
   * Cross-platform value of `additionalData.errorCode` on the `*DidFail` status events.
   * Identical on Android and iOS, unlike the legacy `additionalData.error` string.
   * `initializationError` and `recaptureNotRequired` are only reported by iOS.
   */
  export const enum ErrorCode {
    cameraPermissionRequired = "cameraPermissionRequired",
    sdkDisabled = "sdkDisabled",
    sessionNotValid = "sessionNotValid",
    verificationStatusError = "verificationStatusError",
    recaptureNotRequired = "recaptureNotRequired",
    genericServerError = "genericServerError",
    networkError = "networkError",
    initializationError = "initializationError",
    notInitialized = "notInitialized",
    configFetchError = "configFetchError",
    /** A native error this plugin version does not know yet. */
    unknown = "unknown"
  }

  /**
   * Cross-platform value of `additionalData.errorCode` on `verificationRequiresRecapture`.
   * For `other`, `additionalData.error` carries the server's reason text.
   */
  export const enum RecaptureReasonCode {
    imageMissing = "imageMissing",
    docExpired = "docExpired",
    docNotSupported = "docNotSupported",
    docDamaged = "docDamaged",
    poorImageQuality = "poorImageQuality",
    other = "other",
    unknown = "unknown"
  }

  /** Value of `error.userInfo.errorCode` when a method's promise rejects. */
  export const enum RejectCode {
    noActivity = "noActivity",
    initializationError = "initializationError",
    invalidLogLevel = "invalidLogLevel",
    notSupported = "notSupported"
  }

  export const enum BaseURL {
    us = "https://api.transmitsecurity.io",
    eu = "https://api.eu.transmitsecurity.io"
  }
}

export interface TSIdentityVerificationModule {
  /**
   * Initializes from the app's resources: `strings.xml` on Android, the default configuration
   * plist on iOS. `configurationFileName` selects a different plist and is iOS-only; on
   * Android it rejects with `RejectCode.notSupported`.
   */
  initializeSDK: (configurationFileName?: string) => Promise<void>;
  initialize: (clientId: string, baseUrl: TSIDV.BaseURL) => Promise<void>;
  startIdentityVerification: (startToken: string) => Promise<void>;
  setLogLevel: (logLevel: TSIDV.IDVLogLevel) => Promise<void>;
  recapture: () => Promise<void>;
  startFaceAuth: (deviceSessionId: string) => Promise<void>;
  startMosaicUI: (startToken: string) => Promise<void>;
}

class IdentityVerification implements TSIdentityVerificationModule {

  public initializeSDK = async (configurationFileName?: string): Promise<void> => {
    // A separate native method keeps the existing initializeSDK bridge signature unchanged.
    if (configurationFileName === undefined) {
      return TsIdv.initializeSDK();
    }
    return TsIdv.initializeSDKWithConfiguration(configurationFileName);
  }

  public initialize = async (clientId: string, baseUrl: TSIDV.BaseURL = TSIDV.BaseURL.us): Promise<void> => {
    return TsIdv.initialize(clientId, baseUrl);
  }

  public setLogLevel = async (logLevel: TSIDV.IDVLogLevel): Promise<void> => {
    return TsIdv.setLogLevel(logLevel);
  }

  public startIdentityVerification = async (startToken: string): Promise<void> => {
    return TsIdv.startIdentityVerification(startToken);
  }

  public recapture = async (): Promise<void> => {
    return TsIdv.recapture();
  }

  public startFaceAuth = async (deviceSessionId: string): Promise<void> => {
    return TsIdv.startFaceAuth(deviceSessionId);
  }

  public startMosaicUI = async (startToken: string): Promise<void> => {
    return TsIdv.startMosaicUI(startToken);
  }

}
export default new IdentityVerification();