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
import com.transmit.identityverification.ITSIdentityVerificationStatus
import com.transmit.identityverification.TSIdentityVerification
import com.transmit.identityverification.TSIdentityVerification.registerForStatus
import com.transmit.identityverification.TSIdentityVerification.start
import com.transmit.identityverification.TSIdentityVerificationError
import com.transmit.identityverification.TSRecaptureReason

class TsIdvModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
  ITSIdentityVerificationStatus, ITSFaceAuthenticationStatus {

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

  }

//  @objc(setLogLevel:withResolver:withRejecter:)
//  func setLogLevel(_ jsLogLevel: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
//    runBlockOnMain { [unowned self] in
//      guard let logLevel = self.parseLogLevel(jsLogLevel) else {
//      reject(self.kTag, "Invalid log level provider", nil)
//      return
//    }
//      resolve(true)
//    }
//  }

  @ReactMethod
  fun startIdentityVerification(startToken: String, promise: Promise) {
    Log.d(TAG, "startIdentityVerification")
    if (currentActivity == null) {
      promise.reject("Error during startIdentityVerification", "currentActivity is NULL")
      return
    }
    val activity = currentActivity!!
    start(activity, startToken)
    promise.resolve(true)
  }

  @ReactMethod
  fun recapture() {
    Log.d(TAG,"recapture")
    if (currentActivity == null) {
      Log.d(TAG,"Error during recapture: currentActivity is NULL")
      return
    }

    val activity = currentActivity!!
    TSIdentityVerification.recapture(activity)
  }

  @ReactMethod
  fun startFaceAuth(deviceSessionId: String, promise: Promise) {
    Log.d(TAG,"startFaceAuth")
    if (currentActivity == null) {
      promise.reject("Error during startFaceAuth", "currentActivity is NULL")
      return
    }
    val activity = currentActivity!!
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
    errorMap.putString("error", reason?.name)
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

  // region Helpers

//  private fun parseLogLevel(jsLogLevel: String): TSLogLevel? {
//    return when (jsLogLevel) {
//      "verbose" -> TSLogLevel.VERBOSE
//      "debug" -> TSLogLevel.DEBUG
//      "info" -> TSLogLevel.INFO
//      "warning" -> TSLogLevel.WARNING
//      "error" -> TSLogLevel.ERROR
//      "crytical" -> TSLogLevel.CRITICAL
//      "off" -> TSLogLevel.OFF
//      else -> null
//    }
//  }

  private fun registerSDKStatus() {
    registerForStatus(this)
    TSIdentityVerification.registerForFaceAuthStatus(this)
  }


  // endregion
}
