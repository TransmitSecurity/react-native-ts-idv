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

  export const enum BaseURL {
    us = "https://api.transmitsecurity.io",
    eu = "https://api.eu.transmitsecurity.io"
  }
}

export interface TSIdentityVerificationModule {
  initializeSDK: () => Promise<void>;
  initialize: (clientId: string, baseUrl: TSIDV.BaseURL) => Promise<void>;
  startIdentityVerification: (startToken: string) => Promise<void>;
  setLogLevel: (logLevel: TSIDV.IDVLogLevel) => Promise<void>;
  recapture: () => Promise<void>;
  startFaceAuth: (deviceSessionId: string) => Promise<void>;
  startMosaicUI: (startToken: string) => Promise<void>;
  startDocumentAcquisition: (startToken?: string, acquisitionId?: string) => Promise<void>;
  startSelfieAcquisition: (startToken?: string, acquisitionId?: string) => Promise<void>;
}

class IdentityVerification implements TSIdentityVerificationModule {

  public initializeSDK = async (): Promise<void> => {
    return TsIdv.initializeSDK();
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

  /**
   * Starts a standalone document acquisition (Modular IDV).
   *
   * iOS only. The Android SDK implements modular acquisition but keeps every
   * entry point internal — it is consumed by the IDO SDK, not by applications —
   * so on Android this rejects with the code "not_implemented" rather than
   * failing silently.
   *
   * Both arguments are optional, matching the native signature. Empty strings
   * are treated as absent.
   */
  public startDocumentAcquisition = async (startToken?: string, acquisitionId?: string): Promise<void> => {
    return TsIdv.startDocumentAcquisition(startToken ?? "", acquisitionId ?? "");
  }

  /**
   * Starts a standalone selfie acquisition (Modular IDV).
   * iOS only — see startDocumentAcquisition.
   */
  public startSelfieAcquisition = async (startToken?: string, acquisitionId?: string): Promise<void> => {
    return TsIdv.startSelfieAcquisition(startToken ?? "", acquisitionId ?? "");
  }
}
export default new IdentityVerification();