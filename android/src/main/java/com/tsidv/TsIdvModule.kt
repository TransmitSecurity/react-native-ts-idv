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
import com.transmit.identityverification.ITSIdentityVerificationStatus
import com.transmit.identityverification.TSIdentityVerification
import com.transmit.identityverification.TSIdentityVerification.registerForStatus
import com.transmit.identityverification.TSIdentityVerification.start
import com.transmit.identityverification.TSIdentityVerificationError
import com.transmit.identityverification.TSRecaptureReason

class TsIdvModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext),
  ITSIdentityVerificationStatus {

  private val idvStatusChangeEventName: String = "idv_status_change_event"
  private val TAG = "IDV"

  override fun getName(): String {
    return NAME
  }

  companion object {
    const val NAME = "TsIdv"
  }

  enum class IDVStatusType(val status: String) {
    VerificationDidCancel("verificationDidCancel"), VerificationDidComplete("verificationDidComplete"), VerificationDidFail("verificationDidFail"), VerificationDidStartCapturing("verificationDidStartCapturing"), VerificationDidStartProcessing("verificationDidStartProcessing"), VerificationRequiresRecapture("verificationRequiresRecapture")
  }

  // region IDV SDK API

  @ReactMethod
  fun initializeSDK(promise: Promise) {
    Log.d(TAG, "Identity Verification SDK initializeSDK")
    TSIdentityVerification.initializeSDK(reactContext)
    registerForStatus(this)
  }

  @ReactMethod
  fun initialize(clientId: String, baseURL: String) {
    Log.d(TAG,"Identity Verification SDK initialize")
    TSIdentityVerification.initialize(reactContext, clientId)
    registerForStatus(this)
  }

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
  private fun reportIDVStatusChange(status: IDVStatusType, additionalData: WritableMap?) {
    var params: WritableMap = Arguments.createMap()
    params.putString("status", status.status);
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

  //region Identity Verification Status

  override fun verificationCanceled() {
    Log.d(TAG,"verification Status: verificationCanceled")
    reportIDVStatusChange(IDVStatusType.VerificationDidCancel, null)
  }

  override fun verificationCompleted() {
    Log.d(TAG,"verification Status: verificationCompleted")
    reportIDVStatusChange(IDVStatusType.VerificationDidComplete, null)
  }

  override fun verificationFail(error: TSIdentityVerificationError) {
    Log.d(TAG,"verification Status: Verification Fail $error")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    reportIDVStatusChange(IDVStatusType.VerificationDidFail, errorMap)
  }

  override fun verificationRequiresRecapture(reason: TSRecaptureReason?) {
    Log.d(TAG,"verification Status: Requires Recapture $reason")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", reason?.name)
    reportIDVStatusChange(IDVStatusType.VerificationRequiresRecapture, errorMap)
  }

  override fun verificationStartCapturing() {
    Log.d(TAG,"verification Status: Start Capturing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartCapturing, null)
  }

  override fun verificationStartProcessing() {
    Log.d(TAG,"verification Status: Start Processing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartProcessing, null)
  }

  //endregion
}
