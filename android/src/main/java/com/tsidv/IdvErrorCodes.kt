package com.tsidv

import com.transmit.identityverification.TSIdentityVerificationError
import com.transmit.identityverification.TSRecaptureReason

/**
 * Platform-neutral codes sent to JavaScript alongside the legacy `error` field.
 *
 * The values match the iOS bridge (TsIdvCodes.swift) exactly, so a caller can branch on
 * `errorCode` without checking `Platform.OS`. The legacy `error` field keeps its
 * platform-specific value for backward compatibility.
 */
internal object IdvErrorCodes {

  // Exhaustive on purpose: a new native error case fails the build here instead of
  // reaching JavaScript as an unmapped value.
  fun from(error: TSIdentityVerificationError): String = when (error) {
    TSIdentityVerificationError.CameraPermissionRequired -> "cameraPermissionRequired"
    TSIdentityVerificationError.SdkDisabled -> "sdkDisabled"
    TSIdentityVerificationError.SessionNotValid -> "sessionNotValid"
    TSIdentityVerificationError.VerificationStatusError -> "verificationStatusError"
    TSIdentityVerificationError.GenericServerError -> "genericServerError"
    TSIdentityVerificationError.NetworkError -> "networkError"
    TSIdentityVerificationError.SdkNotInitialized -> "notInitialized"
    TSIdentityVerificationError.ConfigFetchError -> "configFetchError"
  }

  /** Normalized recapture code. `Custom` maps to "other"; its text goes in [recaptureReasonText]. */
  fun from(reason: TSRecaptureReason?): String = when (reason) {
    null -> "unknown"
    TSRecaptureReason.ImageMissing -> "imageMissing"
    TSRecaptureReason.DocExpired -> "docExpired"
    TSRecaptureReason.DocNotSupported -> "docNotSupported"
    TSRecaptureReason.DocDamaged -> "docDamaged"
    TSRecaptureReason.PoorImageQuality -> "poorImageQuality"
    is TSRecaptureReason.Custom -> "other"
  }

  /**
   * The server-side reason string, identical to what the iOS SDK reports as the reason's
   * `description`. Replaces `TSRecaptureReason.toString()`, which on these Kotlin objects is
   * the class name plus an identity hash and carries no usable value.
   */
  fun recaptureReasonText(reason: TSRecaptureReason?): String = when (reason) {
    null -> "unknown"
    TSRecaptureReason.ImageMissing -> "image_missing"
    TSRecaptureReason.DocExpired -> "document_expired"
    TSRecaptureReason.DocNotSupported -> "document_not_supported"
    TSRecaptureReason.DocDamaged -> "document_damaged"
    TSRecaptureReason.PoorImageQuality -> "poor_image_quality"
    // A server may send a custom reason with no text; report it as unknown rather than null.
    is TSRecaptureReason.Custom -> reason.reason?.takeIf { it.isNotEmpty() } ?: "unknown"
  }

  /** Codes attached to promise rejections, in the error's `userInfo.errorCode`. */
  object Reject {
    const val NO_ACTIVITY = "noActivity"
    const val INITIALIZATION_ERROR = "initializationError"
    const val INVALID_LOG_LEVEL = "invalidLogLevel"
  }
}
