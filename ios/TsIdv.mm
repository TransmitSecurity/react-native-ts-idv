#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(TsIdv, NSObject)

RCT_EXTERN_METHOD(initialize:(NSString *)clientId withBaseUrl:(NSString *)baseUrl withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(startIdentityVerification:(NSString *)startToken withResolver:(RCTPromiseResolveBlock)resolve
                  withRejecter:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(recapture:(RCTPromiseResolveBlock)resolve withRejecter:(RCTPromiseRejectBlock)reject)

+ (BOOL)requiresMainQueueSetup
{
  return FALSE;
}

@end
