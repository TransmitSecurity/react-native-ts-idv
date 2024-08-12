package com.tsidv

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
import com.ts.coresdk.TSLog
import timber.log.Timber

class TsIdvModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext), ITSIdentityVerificationStatus {

  private val idvStatusChangeEventName: String = "idv_status_change_event"

  override fun getName(): String {
    return "TsIdv"
  }

  enum class IDVStatusType(val status: String) {
    VerificationDidCancel("verificationDidCancel"), VerificationDidComplete("verificationDidComplete"), VerificationDidFail("verificationDidFail"), VerificationDidStartCapturing("verificationDidStartCapturing"), VerificationDidStartProcessing("verificationDidStartProcessing"), VerificationRequiresRecapture("verificationRequiresRecapture")
  }

  // region IDV SDK API

  @ReactMethod
  fun initialize(clientId: String, baseURL: String) {
    Timber.d(">>> Identity Verification SDK initialize")
    TSIdentityVerification.initialize(reactContext, clientId)
    registerForStatus(this)
  }

  @ReactMethod
  fun setLoggingEnabled(loggingEnabled: Boolean) {
    Timber.d(">>> loggingEnabled = $loggingEnabled")
    TSLog.setLoggingEnabled(loggingEnabled)
  }

 @ReactMethod
  fun startIdentityVerification(startToken: String, promise: Promise) {
    Timber.d(">>> startIdentityVerification")
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
    Timber.d(">>> recapture")
    if (currentActivity == null) {
      Timber.e(">>> Error during recapture: currentActivity is NULL")
      return
    }

    val activity = currentActivity!!
    TSIdentityVerification.recapture(activity)
  }

  @ReactMethod
  fun startFaceAuth(deviceSessionId: String, promise: Promise) {
    Timber.d(">>> startFaceAuth")
    if (currentActivity == null) {
      promise.reject("Error during startFaceAuth", "currentActivity is NULL")
      return
    }
    val activity = currentActivity!!
//    TSIdentityVerification. // continue from here
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
    Timber.d(">>> verification Status: verificationCanceled")
    reportIDVStatusChange(IDVStatusType.VerificationDidCancel, null)
  }

  override fun verificationCompleted() {
    Timber.d(">>> verification Status: verificationCompleted")
    reportIDVStatusChange(IDVStatusType.VerificationDidComplete, null)
  }

  override fun verificationFail(error: TSIdentityVerificationError) {
    Timber.d(">>> verification Status: Verification Fail $error")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", error.name)
    reportIDVStatusChange(IDVStatusType.VerificationDidFail, errorMap)
  }

  override fun verificationRequiresRecapture(reason: TSRecaptureReason?) {
    Timber.d(">>> verification Status: Requires Recapture $reason")
    val errorMap: WritableMap = Arguments.createMap()
    errorMap.putString("error", reason?.name)
    reportIDVStatusChange(IDVStatusType.VerificationRequiresRecapture, errorMap)
  }

  override fun verificationStartCapturing() {
    Timber.d(">>> verification Status: Start Capturing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartCapturing, null)
  }

  override fun verificationStartProcessing() {
    Timber.d(">>> verification Status: Start Processing")
    reportIDVStatusChange(IDVStatusType.VerificationDidStartProcessing, null)
  }

  //endregion
}
