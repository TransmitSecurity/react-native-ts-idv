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
    TSIdentityVerification.initializeSDK(reactContext)
    registerSDKStatus()
    promise.resolve(true);
  }

  @ReactMethod
  fun initialize(clientId: String, baseURL: String, promise: Promise) {
    Log.d(TAG,"Identity Verification SDK initialize")
    TSIdentityVerification.initialize(reactContext, clientId)
    registerSDKStatus()
    promise.resolve(true);
  }

  @ReactMethod
  fun setLogLevel(jsLogLevel: String, promise: Promise) {
    Log.d(TAG,"Identity Verification setLogLevel")
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
      promise.reject("Error during startIdentityVerification", "currentActivity is NULL")
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
      promise.reject("Error during startMosaicUI", "currentActivity is NULL")
      return
    }
    TSIdentityVerification.startWithSmartUI(activity, startToken);
    promise.resolve(true)
  }

  @ReactMethod
  fun recapture() {
    Log.d(TAG,"recapture")
    val activity = getCurrentActivity()
    if (activity == null) {
      Log.d(TAG,"Error during recapture: currentActivity is NULL")
      return
    }

    TSIdentityVerification.recapture(activity)
  }

  @ReactMethod
  fun startFaceAuth(deviceSessionId: String, promise: Promise) {
    Log.d(TAG,"startFaceAuth")
    val activity = getCurrentActivity()
    if (activity == null) {
      promise.reject("Error during startFaceAuth", "currentActivity is NULL")
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
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    reportIDVStatusChange(IDVStatusType.VerificationDidFail.status, errorMap)
  }

  override fun verificationRequiresRecapture(reason: TSRecaptureReason?) {
    Log.d(TAG,"verification Status: Requires Recapture $reason")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", reason?.toString())
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
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    reportIDVStatusChange(FaceAuthStatusType.FaceAuthenticationFail.status, errorMap)
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
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    reportIDVStatusChange(MosaicUIAuthStatusType.mosaicUIVerificationDidFail.status, errorMap)
  }

  // endregion

  // region Helpers

  private fun registerSDKStatus() {
    registerForStatus(this)
    TSIdentityVerification.registerForFaceAuthStatus(this)
    TSIdentityVerification.registerForStatusMosaicUI(this)
  }


  // endregion
}
