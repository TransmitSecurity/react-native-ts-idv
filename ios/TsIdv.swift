import React
import IdentityVerification
import TSCoreSDK

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
        
        case faceAuthenticationDidCancel
        case faceAuthenticationDidComplete
        case faceAuthenticationDidStartCapturing
        case faceAuthenticationDidStartProcessing
        case faceAuthenticationDidFail
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
            TSIdentityVerification.faceAuthDelegate = self
            resolve(true)
        }
    }
    
    @objc(setLogLevel:withResolver:withRejecter:)
    func setLogLevel(_ jsLogLevel: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        runBlockOnMain { [unowned self] in
            guard let logLevel = self.parseLogLevel(jsLogLevel) else {
                reject(self.kTag, "Invalid log level provider", nil)
                return
            }
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
    
    // MARK: - Helpers
    
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
        reportIDVStatusChange(.faceAuthenticationDidFail, additionalData: ["error": error.localizedDescription])
    }
}
