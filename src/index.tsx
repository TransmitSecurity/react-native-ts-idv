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

class IdentityVerification {

    public initialize = async (clientId: string, baseUrl: string = ""): Promise<void> => {
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