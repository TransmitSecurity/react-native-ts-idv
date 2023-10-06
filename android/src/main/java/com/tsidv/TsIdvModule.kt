package com.tsidv

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.transmit.identityverification.TSIdentityVerification
import timber.log.Timber

class TsIdvModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName(): String {
    return NAME
  }

  // region IDV SDK API

  @ReactMethod
  fun initialize(clientId: String, baseURL: String) {
    Timber.d(">>> initialize")
//    TSIdentityVerification.initialize(reactContext, clientId)
//    registerForStatus(this)
  }


  //endregion


  companion object {
    const val NAME = "TsIdv"
  }
}
