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

	export const enum BaseURL {
		us = "https://api.transmitsecurity.io/verify",
		eu = "https://api.eu.transmitsecurity.io/verify"
	}
}

export interface TSIdentityVerificationModule {
    initialize: (clientId: string, baseUrl: TSIDV.BaseURL) => Promise<void>;
    startIdentityVerification: (startToken: string) => Promise<void>;
    recapture: () => Promise<void>;
}

class IdentityVerification implements TSIdentityVerificationModule {

    public initialize = async (clientId: string, baseUrl: TSIDV.BaseURL = TSIDV.BaseURL.us): Promise<void> => {
      return TsIdv.initialize(clientId, baseUrl);
    }

    public startIdentityVerification = async (startToken: string): Promise<void> => {
      return TsIdv.startIdentityVerification(startToken);
    }

    public recapture = async (): Promise<void> => {
      return TsIdv.recapture();
    }
      
}
export default new IdentityVerification();