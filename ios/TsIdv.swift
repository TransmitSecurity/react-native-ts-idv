import React
import IdentityVerification
import TSCoreSDK

@objc(TsIdv)
class TsIdv: RCTEventEmitter {
  
  private let kTag = "IdentityVerification"
  private static let IDVStatusChangeEventName = "idv_status_change_event"
  private var isListening: Bool = false
  /// True from `startMosaicUI` until a Mosaic UI terminal event. See `reclaimVerificationDelegate`.
  private var isMosaicUIActive: Bool = false
  
  private enum IDVStatusType: String {
    case verificationDidCancel
    case verificationDidComplete
    case verificationDidFail
    case verificationDidStartCapturing
    case verificationDidStartProcessing
    case verificationRequiresRecapture
    
    case faceAuthenticationDidCancel
    case faceAuthenticationDidComplete
    case faceAuthenticationDidStartCapturing
    case faceAuthenticationDidStartProcessing
    case faceAuthenticationDidFail
    
    case mosaicUIVerificationDidComplete
    case mosaicUIVerificationDidCancel
    case mosaicUIVerificationDidFail
  }
  
  private enum RejectionReason: String {
    case cameraNotAllowed
  }
  
  // MARK: - Module API
  
  override init() {
    super.init()
  }
  
  @objc(initializeSDK:withRejecter:)
  func initializeSDK(
    _ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
      
      runBlockOnMain { [weak self] in
        guard let self = self else { return }
        
        do {
          try TSIdentityVerification.initializeSDK()
          self.registerDelegates()
          resolve(true)
        } catch {
          reject(self.kTag, "Error during initializeSDK", TsIdvCodes.rejectError(.initializationError, underlying: error))
        }
      }
    }
  
  @objc(initialize:withBaseUrl:withResolver:withRejecter:)
  func initialize(_ clientId: String, baseUrl: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    runBlockOnMain {
      TSIdentityVerification.initialize(baseUrl: baseUrl, clientId: clientId)
      self.registerDelegates()
      resolve(true)
    }
  }
  
  @objc(setLogLevel:withResolver:withRejecter:)
  func setLogLevel(_ jsLogLevel: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    // weak, not unowned: the module can be released on a bridge reload while this is queued.
    runBlockOnMain { [weak self] in
      guard let self = self else { return }
      guard let logLevel = self.parseLogLevel(jsLogLevel) else {
        reject(self.kTag, "Invalid log level provider", TsIdvCodes.rejectError(.invalidLogLevel))
        return
      }
      TSIdentityVerification.setLogLevel(logLevel)
      resolve(true)
    }
  }
  
  @objc(startIdentityVerification:withResolver:withRejecter:)
  func startIdentityVerification(_ startToken: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    runBlockOnMain {
      self.reclaimVerificationDelegate()
      TSIdentityVerification.start(startToken: startToken)
      resolve(true)
    }
  }
  
  @objc(recapture:withRejecter:)
  func recapture(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    runBlockOnMain {
      TSIdentityVerification.recapture()
      resolve(true)
    }
  }
  
  @objc(startFaceAuth:withResolver:withRejecter:)
  func startFaceAuth(_ deviceSessionId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    runBlockOnMain {
      TSIdentityVerification.startFaceAuth(deviceSessionId: deviceSessionId)
      resolve(true)
    }
  }
  
  @objc(startMosaicUI:withResolver:withRejecter:)
  func startMosaicUI(_ startToken: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
    runBlockOnMain {
      self.isMosaicUIActive = true
      TSIdentityVerification.startMosaicUI(startToken: startToken)
      resolve(true)
    }
  }
  
  // MARK: - Delegate registration
  
  /// Registers every status delegate in one place, so the two initialization
  /// entry points cannot drift. Previously `initializeSDK` set only `delegate`,
  /// leaving face authentication and Mosaic UI status events undelivered.
  private func registerDelegates() {
    // Re-initializing is the recovery path when a Mosaic UI flow never reported a terminal
    // event (e.g. a config-fetch failure on iOS 1.3.5 skips the Mosaic UI delegate), so the
    // flag must not outlive it.
    isMosaicUIActive = false
    TSIdentityVerification.delegate = self
    TSIdentityVerification.faceAuthDelegate = self
    TSIdentityVerification.mosaicUIDelegate = self
  }
  
  /// `startMosaicUI` makes the SDK install its own Mosaic UI controller as the verification
  /// delegate, replacing this module. Without reclaiming it, a later `startIdentityVerification`
  /// reports its status to that controller and JavaScript receives no events.
  ///
  /// Skipped while a Mosaic UI flow is still running: taking the delegate then would starve that
  /// flow of the events it needs to finish, and the SDK ignores a second start anyway.
  private func reclaimVerificationDelegate() {
    guard !isMosaicUIActive else { return }
    TSIdentityVerification.delegate = self
  }

  // MARK: - Threading
  
  private func runBlockOnMain(_ block: @escaping () -> Void) {
    DispatchQueue.main.async {
      block()
    }
  }
  
  // MARK: - RCTEventEmitter
  
  private func reportIDVStatusChange(_ status: IDVStatusType, additionalData: Any? = nil) {
    guard isListening else { return }
    self.sendEvent(
      withName: TsIdv.IDVStatusChangeEventName,
      body: [
        "status": status.rawValue,
        "additionalData": additionalData
      ]
    )
  }
  
  @objc
  override func supportedEvents() -> [String]! {
    return [TsIdv.IDVStatusChangeEventName]
  }
  
  override func startObserving() {
    isListening = true
  }
  
  override func stopObserving() {
    isListening = false
  }
  
  // MARK: - Helpers
  
  /// `error` is the case name, as `verificationDidFail` already sent. Face authentication and
  /// Mosaic UI used `localizedDescription`, which for this plain Swift enum is only
  /// "The operation couldn't be completed… error N." `errorCode` is cross-platform.
  private func errorData(_ error: TSIdentityVerificationError) -> [String: String] {
    return [
      "error": String(describing: error),
      "errorCode": TsIdvCodes.code(for: error)
    ]
  }

  private func parseLogLevel(_ jsLogLevel: String) -> TSLogLevel? {
    switch jsLogLevel {
    case "verbose": return .verbose
    case "debug": return .debug
    case "info": return .info
    case "warning": return .warning
    case "error": return .error
    case "crytical": return .crytical
    case "off": return .off
    default: return nil
    }
  }
}

extension TsIdv: TSIdentityVerificationDelegate {
  func verificationDidCancel() {
    reportIDVStatusChange(.verificationDidCancel)
  }
  
  func verificationDidComplete() {
    reportIDVStatusChange(.verificationDidComplete)
  }
  
  func verificationDidFail(with error: TSIdentityVerificationError) {
    reportIDVStatusChange(.verificationDidFail, additionalData: errorData(error))
  }
  
  func verificationDidStartCapturing() {
    reportIDVStatusChange(.verificationDidStartCapturing)
  }
  
  func verificationDidStartProcessing() {
    reportIDVStatusChange(.verificationDidStartProcessing)
  }
  
  func verificationRequiresRecapture(reason: TSRecaptureReason) {
    reportIDVStatusChange(.verificationRequiresRecapture, additionalData: [
      "error": reason.description,
      "errorCode": TsIdvCodes.code(for: reason)
    ])
  }
}

extension TsIdv: TSIdentityFaceAuthenticationDelegate {
  
  func faceAuthenticationDidCancel() {
    reportIDVStatusChange(.faceAuthenticationDidCancel)
  }
  
  func faceAuthenticationDidComplete() {
    reportIDVStatusChange(.faceAuthenticationDidComplete)
  }
  
  func faceAuthenticationDidStartCapturing() {
    reportIDVStatusChange(.faceAuthenticationDidStartCapturing)
  }
  
  func faceAuthenticationDidStartProcessing() {
    reportIDVStatusChange(.faceAuthenticationDidStartProcessing)
  }
  
  func faceAuthenticationDidFail(with error: TSIdentityVerificationError) {
    reportIDVStatusChange(.faceAuthenticationDidFail, additionalData: errorData(error))
  }
}


extension TsIdv: TSIdentityVerificationMosaicUIDelegate {
  
  func mosaicUIVerificationDidComplete() {
    isMosaicUIActive = false
    reportIDVStatusChange(.mosaicUIVerificationDidComplete)
  }
  
  func mosaicUIVerificationDidCancel() {
    isMosaicUIActive = false
    reportIDVStatusChange(.mosaicUIVerificationDidCancel)
  }
  
  func mosaicUIVerificationDidFail(with error: TSIdentityVerificationError) {
    isMosaicUIActive = false
    reportIDVStatusChange(.mosaicUIVerificationDidFail, additionalData: errorData(error))
  }
}

