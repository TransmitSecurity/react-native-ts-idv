import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Asks for the camera right before a flow starts, as the native demo apps do, and reports
 * whether it was granted. Asking once at launch misses a permission revoked later from Settings.
 *
 * iOS returns true: the SDK prompts itself, using the app's NSCameraUsageDescription.
 */
export async function ensureCameraPermission(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return true;
  }
  try {
    const camera = PermissionsAndroid.PERMISSIONS.CAMERA!;
    if (await PermissionsAndroid.check(camera)) {
      return true;
    }
    const result = await PermissionsAndroid.request(camera, {
      title: 'Camera Permission',
      message: 'This app needs your camera to scan your documents and take a selfie.',
      buttonPositive: 'OK',
      buttonNegative: 'Cancel',
    });
    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.warn(err);
    return false;
  }
}
