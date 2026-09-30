package com.tsidv

import android.util.Log
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactContext
import com.facebook.react.bridge.WritableMap
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.transmit.identityverification.ITSFaceAuthenticationStatus
import com.transmit.identityverification.ITSIdentityVerificationMosaicUIStatus
import com.transmit.identityverification.ITSIdentityVerificationStatus
import com.transmit.identityverification.TSIdentityVerification
import com.transmit.identityverification.TSIdentityVerification.registerForStatus
import com.transmit.identityverification.TSIdentityVerification.start
import com.transmit.identityverification.TSIdentityVerificationError
import com.transmit.identityverification.TSRecaptureReason
import com.transmit.identityverification.exceptions.TSIdentityVerificationInitializeException
import com.ts.coresdk.TSLog

class TsIdvModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
  ITSIdentityVerificationStatus, ITSFaceAuthenticationStatus, ITSIdentityVerificationMosaicUIStatus {

  private val idvStatusChangeEventName: String = "idv_status_change_event"
  private val TAG = "IDV"

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "TsIdv"
    // Same set the iOS bridge accepts (IDVLogLevel in src/index.tsx).
    private val SUPPORTED_LOG_LEVELS = setOf("verbose", "debug", "info", "warning", "error", "crytical", "off")
  }

  enum class IDVStatusType(val status: String) {
    VerificationDidCancel("verificationDidCancel"),
    VerificationDidComplete("verificationDidComplete"),
    VerificationDidFail("verificationDidFail"),
    VerificationDidStartCapturing("verificationDidStartCapturing"),
    VerificationDidStartProcessing("verificationDidStartProcessing"),
    VerificationRequiresRecapture("verificationRequiresRecapture")
  }

  enum class FaceAuthStatusType(val status: String) {
    FaceAuthenticationStartCapturing("faceAuthenticationDidStartCapturing"),
    FaceAuthenticationStartProcessing("faceAuthenticationDidStartProcessing"),
    FaceAuthenticationCompleted("faceAuthenticationDidComplete"),
    FaceAuthenticationCanceled("faceAuthenticationDidCancel"),
    FaceAuthenticationFail("faceAuthenticationDidFail")
  }

  enum class MosaicUIAuthStatusType(val status: String) {
    mosaicUIVerificationDidComplete("mosaicUIVerificationDidComplete"),
    mosaicUIVerificationDidCancel("mosaicUIVerificationDidCancel"),
    mosaicUIVerificationDidFail("mosaicUIVerificationDidFail")
  }

  // region IDV SDK API

  @ReactMethod
  fun initializeSDK(promise: Promise) {
    Log.d(TAG, "Identity Verification SDK initializeSDK")
    // The native call throws when transmit_security_client_id / transmit_security_base_url
    // are missing from strings.xml. Uncaught, that crashes the app; reject instead, as iOS does.
    try {
      TSIdentityVerification.initializeSDK(reactContext)
    } catch (e: TSIdentityVerificationInitializeException) {
      promise.reject("Error during initializeSDK", e.message, e, rejectInfo(IdvErrorCodes.Reject.INITIALIZATION_ERROR))
      return
    }
    registerSDKStatus()
    promise.resolve(true);
  }

  /**
   * iOS-only: initializes from a named configuration plist. The Android SDK has no equivalent
   * (it reads strings.xml), so this rejects with `notSupported` rather than silently falling back
   * to a different configuration source than the caller asked for.
   */
  @ReactMethod
  fun initializeSDKWithConfiguration(configurationFileName: String, promise: Promise) {
    promise.reject(
      "Error during initializeSDK",
      "initializeSDK(configurationFileName) is not supported on Android; call initializeSDK() and configure strings.xml",
      rejectInfo(IdvErrorCodes.Reject.NOT_SUPPORTED)
    )
  }

  @ReactMethod
  fun initialize(clientId: String, baseURL: String, promise: Promise) {
    Log.d(TAG,"Identity Verification SDK initialize")
    // Pass the base URL through: since native 1.3.3 the SDK fetches its configuration from
    // it before every start, so dropping it sent non-US tenants to the US default and failed
    // with ConfigFetchError. A blank value keeps the SDK's own default, which is what the
    // 2-argument overload used to give every caller.
    if (baseURL.isBlank()) {
      TSIdentityVerification.initialize(reactContext, clientId)
    } else {
      TSIdentityVerification.initialize(reactContext, clientId, baseURL)
    }
    registerSDKStatus()
    promise.resolve(true);
  }

  @ReactMethod
  fun setLogLevel(jsLogLevel: String, promise: Promise) {
    Log.d(TAG,"Identity Verification setLogLevel")
    // Reject unknown levels, matching iOS. Before this, Android enabled logging for any
    // string other than "off", so a typo succeeded on one platform and failed on the other.
    if (jsLogLevel !in SUPPORTED_LOG_LEVELS) {
      promise.reject("Error during setLogLevel", "Invalid log level provided: $jsLogLevel", rejectInfo(IdvErrorCodes.Reject.INVALID_LOG_LEVEL))
      return
    }
    // The Android SDK exposes logging as a boolean, so every level other than
    // "off" enables it. Uses == (structural equality); === is reference equality
    // on a Kotlin String and matched only when both sides happened to be interned.
    val isOff = jsLogLevel == "off"
    TSLog.setLoggingEnabled(!isOff)
    promise.resolve(true)
  }

  @ReactMethod
  fun startIdentityVerification(startToken: String, promise: Promise) {
    Log.d(TAG, "startIdentityVerification")
    // Read once into a local: the activity can be torn down between a check and
    // a second read, which would make a !! assertion throw.
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.reject("Error during startIdentityVerification", "currentActivity is NULL", noActivityInfo())
      return
    }
    TSIdentityVerification.start(activity, startToken)
    promise.resolve(true)
  }

  @ReactMethod
  fun startMosaicUI(startToken: String, promise: Promise) {
    Log.d(TAG, "startMosaicUI")
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.reject("Error during startMosaicUI", "currentActivity is NULL", noActivityInfo())
      return
    }
    TSIdentityVerification.startWithSmartUI(activity, startToken);
    promise.resolve(true)
  }

  @ReactMethod
  fun recapture(promise: Promise) {
    Log.d(TAG,"recapture")
    // Takes a promise like every other method and like iOS. It used to return nothing, so a
    // missing activity was only logged and the caller's await resolved as if it had worked.
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.reject("Error during recapture", "currentActivity is NULL", noActivityInfo())
      return
    }

    TSIdentityVerification.recapture(activity)
    promise.resolve(true)
  }

  @ReactMethod
  fun startFaceAuth(deviceSessionId: String, promise: Promise) {
    Log.d(TAG,"startFaceAuth")
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.reject("Error during startFaceAuth", "currentActivity is NULL", noActivityInfo())
      return
    }
    TSIdentityVerification.startFaceAuth(activity, deviceSessionId)
    promise.resolve(true)
  }

  //endregion

  // region Verification Status Sending Events to JavaScript
  private fun reportIDVStatusChange(status: String, additionalData: WritableMap?) {
    var params: WritableMap = Arguments.createMap()
    params.putString("status", status);
    params.putMap("additionalData", additionalData);
    sendEvent(reactContext, idvStatusChangeEventName, params)
  }

  private fun sendEvent(reactContext: ReactContext, eventName: String, params: WritableMap?) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java).emit(eventName, params)
  }

  @ReactMethod
  fun addListener(eventName: String) {}

  @ReactMethod
  fun removeListeners(count: Int) {}

  // endregion

  // region Identity Verification Status

  override fun verificationCanceled() {
    Log.d(TAG,"verification Status: verificationCanceled")
    reportIDVStatusChange(IDVStatusType.VerificationDidCancel.status, null)
  }

  override fun verificationCompleted() {
    Log.d(TAG,"verification Status: verificationCompleted")
    reportIDVStatusChange(IDVStatusType.VerificationDidComplete.status, null)
  }

  override fun verificationFail(error: TSIdentityVerificationError) {
    Log.d(TAG,"verification Status: Verification Fail $error")
    reportIDVStatusChange(IDVStatusType.VerificationDidFail.status, errorData(error))
  }

  override fun verificationRequiresRecapture(reason: TSRecaptureReason?) {
    Log.d(TAG,"verification Status: Requires Recapture $reason")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", IdvErrorCodes.recaptureReasonText(reason))
    errorMap.putString("errorCode", IdvErrorCodes.from(reason))
    reportIDVStatusChange(IDVStatusType.VerificationRequiresRecapture.status, errorMap)
  }

  override fun verificationStartCapturing() {
    Log.d(TAG,"verification Status: Start Capturing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartCapturing.status, null)
  }

  override fun verificationStartProcessing() {
    Log.d(TAG,"verification Status: Start Processing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartProcessing.status, null)
  }

  // endregion

  // region Face Authentication

  override fun faceAuthenticationStartCapturing() {
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationStartCapturing.status, null)
  }

  override fun faceAuthenticationStartProcessing() {
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationStartProcessing.status, null)
  }

  override fun faceAuthenticationCompleted() {
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationCompleted.status, null)
  }

  override fun faceAuthenticationCanceled() {
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationCanceled.status, null)
  }

  override fun faceAuthenticationFail(error: TSIdentityVerificationError) {
    Log.d(TAG,"FaceAuth: Authentication Failed $error")
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationFail.status, errorData(error))
  }

  // endregion

  // region Identity Verification Mosaic UI Status

  override fun mosaicUIVerificationCompleted() {
    reportIDVStatusChange(MosaicUIAuthStatusType.mosaicUIVerificationDidComplete.status, null)
  }

  override fun mosaicUIVerificationCanceled() {
    reportIDVStatusChange(MosaicUIAuthStatusType.mosaicUIVerificationDidCancel.status, null)
  }

  override fun mosaicUIVerificationFailed(error: TSIdentityVerificationError) {
    Log.d("MosaicUI verificationDidFail", error.name)
    reportIDVStatusChange(MosaicUIAuthStatusType.mosaicUIVerificationDidFail.status, errorData(error))
  }

  // endregion

  // region Helpers

  /** `error` keeps the native enum name for existing callers; `errorCode` is cross-platform. */
  private fun errorData(error: TSIdentityVerificationError): WritableMap {
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    errorMap.putString("errorCode", IdvErrorCodes.from(error))
    return errorMap
  }

  private fun noActivityInfo(): WritableMap = rejectInfo(IdvErrorCodes.Reject.NO_ACTIVITY)

  /** Rejection codes stay as they were; the stable code is added in `userInfo.errorCode`. */
  private fun rejectInfo(errorCode: String): WritableMap {
    val info = Arguments.createMap()
    info.putString("errorCode", errorCode)
    return info
  }

  private fun registerSDKStatus() {
    registerForStatus(this)
    TSIdentityVerification.registerForFaceAuthStatus(this)
    TSIdentityVerification.registerForStatusMosaicUI(this)
  }


  // endregion
}
