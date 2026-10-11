import IdentityVerification

/// Platform-neutral codes sent to JavaScript alongside the legacy `error` field.
///
/// The values match the Android bridge (`IdvErrorCodes.kt`) exactly, so a caller can branch on
/// `errorCode` without checking `Platform.OS`. The legacy `error` field keeps its
/// platform-specific value for backward compatibility.
enum TsIdvCodes {

  static func code(for error: TSIdentityVerificationError) -> String {
    switch error {
    case .cameraPermissionRequired: return "cameraPermissionRequired"
    case .sdkDisabled: return "sdkDisabled"
    case .sessionNotValid: return "sessionNotValid"
    case .verificationStatusError: return "verificationStatusError"
    case .recaptureNotRequired: return "recaptureNotRequired"
    case .genericServerError: return "genericServerError"
    case .networkError: return "networkError"
    case .initializationError: return "initializationError"
    case .notInitialized: return "notInitialized"
    case .configFetchError: return "configFetchError"
    // The SDK ships as a resilient binary, so a future case can arrive without a rebuild.
    @unknown default: return "unknown"
    }
  }

  static func code(for reason: TSRecaptureReason) -> String {
    switch reason {
    case .imageMissing: return "imageMissing"
    case .docExpired: return "docExpired"
    case .docNotSupported: return "docNotSupported"
    case .docDamaged: return "docDamaged"
    case .poorImageQuality: return "poorImageQuality"
    case .unknown: return "unknown"
    case .other: return "other"
    @unknown default: return "unknown"
    }
  }

  /// Codes attached to promise rejections, in the error's `userInfo.errorCode`.
  enum Reject: String {
    case initializationError
    case invalidLogLevel
  }

  /// Builds the NSError passed to `reject`, so JavaScript receives `userInfo.errorCode`.
  /// Only strings go into `userInfo`: React Native serializes it to JSON and drops other values.
  static func rejectError(_ code: Reject, underlying: Error? = nil) -> NSError {
    var userInfo: [String: Any] = ["errorCode": code.rawValue]
    if let underlying {
      userInfo["underlyingError"] = String(describing: underlying)
    }
    return NSError(domain: "IdentityVerification", code: 0, userInfo: userInfo)
  }
}
