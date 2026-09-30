import { TSIDV } from 'react-native-ts-idv';

/** Status names emitted by the plugin on `idv_status_change_event`. */
export const enum VerificationStatus {
  verificationDidCancel = "verificationDidCancel",
  verificationDidComplete = "verificationDidComplete",
  verificationDidFail = "verificationDidFail",
  verificationDidStartCapturing = "verificationDidStartCapturing",
  verificationDidStartProcessing = "verificationDidStartProcessing",
  verificationRequiresRecapture = "verificationRequiresRecapture",

  faceAuthenticationDidCancel = "faceAuthenticationDidCancel",
  faceAuthenticationDidComplete = "faceAuthenticationDidComplete",
  faceAuthenticationDidFail = "faceAuthenticationDidFail",
  faceAuthenticationDidStartCapturing = "faceAuthenticationDidStartCapturing",
  faceAuthenticationDidStartProcessing = "faceAuthenticationDidStartProcessing",

  mosaicUIVerificationDidComplete = "mosaicUIVerificationDidComplete",
  mosaicUIVerificationDidCancel = "mosaicUIVerificationDidCancel",
  mosaicUIVerificationDidFail = "mosaicUIVerificationDidFail",
}

const ERROR_MESSAGES: Record<string, string> = {
  [TSIDV.ErrorCode.cameraPermissionRequired]: "Camera permission is required",
  [TSIDV.ErrorCode.sdkDisabled]: "Identity verification is disabled for this tenant",
  [TSIDV.ErrorCode.sessionNotValid]: "The verification session is not valid",
  [TSIDV.ErrorCode.verificationStatusError]: "Could not read the verification status",
  [TSIDV.ErrorCode.recaptureNotRequired]: "Recapture is not required",
  [TSIDV.ErrorCode.genericServerError]: "Server error",
  [TSIDV.ErrorCode.networkError]: "Network error",
  [TSIDV.ErrorCode.initializationError]: "The SDK failed to initialize",
  [TSIDV.ErrorCode.notInitialized]: "The SDK is not initialized",
  [TSIDV.ErrorCode.configFetchError]: "Could not fetch the SDK configuration. Check the base URL and network",
};

/**
 * Readable text for a `*DidFail` event. Reads the cross-platform `errorCode`; falls back to the
 * legacy `error` string, which is what a plugin older than `errorCode` would send.
 */
export function describeFailure(additionalData: any): string {
  const code: string | undefined = additionalData?.errorCode;
  const legacy: string | undefined = additionalData?.error;
  if (code !== undefined && ERROR_MESSAGES[code] !== undefined) {
    return ERROR_MESSAGES[code]!;
  }
  return legacy ?? code ?? "Unknown error";
}

/** Readable text for `verificationRequiresRecapture`. */
export function describeRecapture(additionalData: any): string {
  const code: string | undefined = additionalData?.errorCode;
  const reason: string | undefined = additionalData?.error;
  switch (code) {
    case TSIDV.RecaptureReasonCode.imageMissing: return "An image is missing";
    case TSIDV.RecaptureReasonCode.docExpired: return "The document has expired";
    case TSIDV.RecaptureReasonCode.docNotSupported: return "The document is not supported";
    case TSIDV.RecaptureReasonCode.docDamaged: return "The document is damaged";
    case TSIDV.RecaptureReasonCode.poorImageQuality: return "The image quality is too low";
    // `other` carries the server's own reason text in `error`.
    default: return reason ?? "Unknown reason";
  }
}
