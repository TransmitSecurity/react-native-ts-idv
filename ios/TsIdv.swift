import React
import IdentityVerification

@objc(TsIdv)
class TsIdv: RCTEventEmitter {

  private let kTag = "IdentityVerification"
    private static let IDVStatusChangeEventName = "idv_status_change_event"
    private var isListening: Bool = false
    
    private enum IDVStatusType: String {
        case verificationDidCancel
        case verificationDidComplete
        case verificationDidFail
        case verificationDidStartCapturing
        case verificationDidStartProcessing
        case verificationRequiresRecapture
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
                    TSIdentityVerification.delegate = self
                    resolve(true)
                } catch {
                    reject(self.kTag, "Error during initializeSDK", error)
                }
            }
        }
    
    @objc(initialize:withBaseUrl:withResolver:withRejecter:)
    func initialize(_ clientId: String, baseUrl: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        runBlockOnMain {            
           TSIdentityVerification.initialize(baseUrl: baseUrl, clientId: clientId)
            TSIdentityVerification.delegate = self
            resolve(true)
        }
    }
    
    @objc(startIdentityVerification:withResolver:withRejecter:)
    func startIdentityVerification(_ startToken: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        runBlockOnMain {
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
}

extension TsIdv: TSIdentityVerificationDelegate {
    func verificationDidCancel() {
        reportIDVStatusChange(.verificationDidCancel)
    }
    
    func verificationDidComplete() {
        reportIDVStatusChange(.verificationDidComplete)
    }
    
    func verificationDidFail(with error: TSIdentityVerificationError) {
        reportIDVStatusChange(.verificationDidFail, additionalData: ["error": String(describing: error)])
    }
    
    func verificationDidStartCapturing() {
        reportIDVStatusChange(.verificationDidStartCapturing)
    }
    
    func verificationDidStartProcessing() {
        reportIDVStatusChange(.verificationDidStartProcessing)
    }
    
    func verificationRequiresRecapture(reason: TSRecaptureReason) {
        reportIDVStatusChange(.verificationRequiresRecapture, additionalData: ["error": reason.description])
    }
}
