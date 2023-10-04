import Foundation
import IdentityVerification
import React

@objc(TsIdv)
class TsIdv: RCTEventEmitter {
    
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
    
    @objc(initialize:withResolver:withRejecter:)
    func initialize(_ clientId: String, resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) -> Void {
        runBlockOnMain {
            TSIdentityVerification.initialize(clientId: clientId)
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
        reportIDVStatusChange(.verificationDidFail, additionalData: String(describing: error))
    }
    
    func verificationDidStartCapturing() {
        reportIDVStatusChange(.verificationDidStartCapturing)
    }
    
    func verificationDidStartProcessing() {
        reportIDVStatusChange(.verificationDidStartProcessing)
    }
    
    func verificationRequiresRecapture(reason: TSRecaptureReason) {
        reportIDVStatusChange(.verificationRequiresRecapture, additionalData: reason.description)
    }
}
