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
    networkError
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
  recapture: () => Promise<void>;
  startFaceAuth: (deviceSessionId: string) => Promise<void>;
}

class IdentityVerification implements TSIdentityVerificationModule {

  public initializeSDK = async (): Promise<void> => {
    return TsIdv.initializeSDK();
  }

  public initialize = async (clientId: string, baseUrl: TSIDV.BaseURL = TSIDV.BaseURL.us): Promise<void> => {
    return TsIdv.initialize(clientId, baseUrl);
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
}
export default new IdentityVerification();