# React Native - Transmit Security Identity Verification SDK

You can use identity verification to securely verify the identity of your customers using documents like their driver’s license or passport—such as before allowing them to open a new bank account online or pick up a rental car. 

## About Identity Verification
Transmit Security Identity Verification SDK offers a comprehensive identity verification solution, utilizing deep document inspection, biometric matching, and rapid background checks to streamline customer enrollment, enhance compliance, expedite time to market, prevent fraud, and fortify security within a seamless CIAM platform. 

Using this module, you can easily integrate our Identity Verification SDK into your React Native app for seamless and secure user identity verification.<br>
[Learn more about how you can boost your security with Transmit Security Identity Verification.](https://transmitsecurity.com/platform/identity-verification)

## Understand the flow
We recommended that you read more about the verification flow required steps in our [documentation](https://developer.transmitsecurity.com/guides/verify/quick_start_ios/)

## Configure your app
To integrate this module, you'll need to configure an application.

1. From the [Applications](https://portal.transmitsecurity.io/applications) page, [create a new application](https://developer.transmitsecurity.com/guides/user/create_new_application/) or use an existing one.
2. From the application settings:
    * For Client type , select native
    * For Redirect URI , enter your website URL. This is a mandatory field, but it isn't used for this flow.
    * Obtain your client ID and secret for API calls, which are autogenerated upon app creation.

## Example project setup
1. In your project, navigate to `example/src/config.ts` and configure the clientId and secret using the credentials obtained from the Transmit portal.
2. Configure your Client ID in the SDK configuration `.plist` file for iOS, and/or `strings.xml` for Android.
3. Ensure you have all the necessary dependencies by running `yarn` in both the module's root folder and the example root folder.
4. Run the example app on a real device using Xcode or Android Studio. Alternatively, execute `yarn example ios` or `yarn example android`.

> **Important Security Note: Never store your `secret` in a front-end application.**
> 
> The example app utilizes a mock server to manage communication with the identity verification platform. This mock server employs the `secret` you have specified in `example/src/config.ts` exclusively for demonstration purposes. It is paramount that you safeguard your `secret` in a secure and confidential location.

## Module installation
To install this module, execute the following command in your project's root folder.
```sh
npm install react-native-ts-idv
# Or `yarn add react-native-ts-idv`
```

#### iOS Setup
You might need to execute `pod install` in your project's `/ios` folder and set your minimum iOS target to 13.0 in your Podfile (e.g `platform :ios, 13.0`).

#### Android Setup
Add to `app/build.gradle` under repositories

```gradle
repositories {
  maven {
    url('https://transmit.jfrog.io/artifactory/transmit-security-gradle-release-local/')
  }
}
```
Note:  
As for projects on Gradle 8+ and Kotlin 1.8+ build will fail if the JDK version between 
compileKotlin and compileJava and jvmTarget are not aligned. 

## Platform Configuration File
Configure your Client ID and Base URL

#### iOS
1. Open your project's `.xcworkspace` found under `YOUR_PROJECT_PATH/iOS` in Xcode.
2. Create a plist file named TransmitSecurity.plist in your Application with the following content. CLIENT_ID is configured in your Transmit server. Make sure the file is linked to your target.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>credentials</key>
    <dict>
        <!-- Use api.eu.transmitsecurity.io for EU, api.ca.transmitsecurity.io for CA -->
        <key>baseUrl</key>
        <string>https://api.transmitsecurity.io</string>
        <key>clientId</key>
        <string>CLIENT_ID</string>
    </dict>
</dict>
</plist>
```
#### Android `strings.xml`
1. Add to the `strings.xml` file in your Application the following content. The CLIENT_ID should be replaced with your client ID. This file is typically found in `android/src/main/res/values/strings.xml`

```xml
<resources>
    <!-- Transmit Security Credentials -->
    <string name="transmit_security_app_id">"default_application"</string>
    <string name="transmit_security_client_id">"CLIENT_ID"</string>
    <string name="transmit_security_base_url">https://api.transmitsecurity.io</string>
</resources>
```
##### 


## Add camera permission
For module usage, configuring permissions for the device camera on both iOS and Android is necessary. You must also explicitly request user permission before commencing the identity verification process. See the `/example` project to learn more.

## Usage

#### Module Setup
```js
import IdentityVerification, { TSIDV } from 'react-native-ts-idv';
const { TsIdv } = NativeModules; // Import NativeModules and NativeEventEmitter from 'react-native'
const eventEmitter = new NativeEventEmitter(TsIdv); // Create an event emitter with the native module TsIdv

private verificationStatusChangeSub?: EmitterSubscription; // Imported from react-native

componentDidMount(): void {
    // Setup the module as soon your component is ready
    this.onAppReady().catch(e => void e);
}

private onAppReady = async (): Promise<void> => {
    
    await IdentityVerification.initializeSDK();
    
    // Register to receive status updates
    this.verificationStatusChangeSub = eventEmitter.addListener(
      "idv_status_change_event", // Important! use this event name
      this.onVerificationStatusChange
    );
}

componentWillUnmount(): void {
    this.verificationStatusChangeSub?.remove(); // Remove the subscription when it's no longer needed
}
```

## Start Verification Process
```js
onStartVerificationProcess = async (): Promise<void> => {
    try {
        // See Step 7: Create session https://developer.transmitsecurity.com/guides/verify/quick_start_ios/ to get startToken
        const startToken = verificationSession.startToken; 
        await IdentityVerification.startIdentityVerification(startToken); // This will trigger the native SDK to start the flow
        console.log("Started identity verification process");
    } catch (error) {
        console.error(`Error verifying user identity: ${error}`);
    }
}
```

### Handle Verification Status Changes
```js
const enum VerificationStatus {
  verificationDidCancel = "verificationDidCancel",
  verificationDidComplete = "verificationDidComplete",
  verificationDidFail = "verificationDidFail",
  verificationDidStartCapturing = "verificationDidStartCapturing",
  verificationDidStartProcessing = "verificationDidStartProcessing",
  verificationRequiresRecapture = "verificationRequiresRecapture",
}

private onVerificationStatusChange = (params: any) => {
    const status = params["status"];
    const additionalData = params["additionalData"];

    switch (status) {
        case VerificationStatus.verificationDidCancel:
            console.log(`verificationDidCancel`);
            break;
        case VerificationStatus.verificationDidComplete:
            console.log(`verificationDidComplete`);
            break;
        case VerificationStatus.verificationDidFail:
            const error: string = additionalData["error"];
            console.log(`verificationDidFail: ${error}`);
            break;
        case VerificationStatus.verificationDidStartCapturing:
            console.log(`verificationDidStartCapturing`);
            break;
        case VerificationStatus.verificationDidStartProcessing:
            console.log(`verificationDidStartProcessing`);
            break;
        case VerificationStatus.verificationRequiresRecapture:
            const reason: string = additionalData["error"];
            console.log(`verificationRequiresRecapture: ${reason}`);
            break;
        default:
            console.log(`Unhandled verification status: ${status}`);
    }
}
```

## Obtaining verification results
Once the module emits the `verificationDidComplete` event, you can fetch the results from your server as described in [Step 10: Handle verification result](https://developer.transmitsecurity.com/guides/verify/quick_start_ios/#step-10-handle-verification-result) 


## Start Face Authentication
Please make sure to review the [Face Authentication](https://developer.transmitsecurity.com/guides/verify/quick_start_face_auth_ios/) documentation before implementing this feature.

```js
onStartFaceAuth = async (): Promise<void> => {
    const accessToken = 'ACCESS_TOKEN';
    const lastVerificationSessionID = 'SESSION_ID';
    const faceAuthSession = await YOUR_SERVER.createFaceAuthSession(accessToken, lastVerificationSessionID);
    
    try {
      await IdentityVerification.startFaceAuth(faceAuthSession.deviceSessionId);
    } catch (error) {
      console.error(`Face Authentication Error: ${error}`);
    }
  }
```

### Handle Face Authentication Status Changes
```js
const enum VerificationStatus {
    // IDV cases omitted
  faceAuthenticationDidCancel = "faceAuthenticationDidCancel",
  faceAuthenticationDidComplete = "faceAuthenticationDidComplete",
  faceAuthenticationDidFail = "faceAuthenticationDidFail",
  faceAuthenticationDidStartCapturing = "faceAuthenticationDidStartCapturing",
  faceAuthenticationDidStartProcessing = "faceAuthenticationDidStartProcessing"
}

private onVerificationStatusChange = (params: any) => {
    const status = params["status"];
    const additionalData = params["additionalData"];

    switch (status) {
        case VerificationStatus.faceAuthenticationDidCancel:
            console.log(`faceAuthenticationDidCancel`);
            break;
        case VerificationStatus.faceAuthenticationDidComplete:
            console.log(`faceAuthenticationDidComplete`);
            // handle face authentication completion
            break;
        case VerificationStatus.faceAuthenticationDidFail:
            console.log(`faceAuthenticationDidFail`);
            break;
        case VerificationStatus.faceAuthenticationDidStartCapturing:
            console.log(`faceAuthenticationDidStartCapturing`);
            break;
        case VerificationStatus.faceAuthenticationDidStartProcessing:
            console.log(`faceAuthenticationDidStartProcessing`);
            break;
        default:
            console.log(`Unhandled face authentication status: ${status}`);
    }
}
```

## Setting Log Level
This module provides the `setLogLevel: (logLevel: TSIDV.IDVLogLevel) => Promise<void>` API, allowing you to configure the SDK log level.
Android: Setting the log level to off disables all logging. Any other valid `IDVLogLevel` will enable logging.

## Important Notes
1. Make sure to use `idv_status_change_event` for the emitter event name.
2. Please take note that the example application uses a client-side mock server. In a production environment, a real server is required. Additionally, it is crucial to emphasize that storing the client secret in your front-end application is strictly discouraged for security reasons.

## Support
[Email us for support](info@transmitsecurity.com)

## Author

Transmit Security, https://github.com/TransmitSecurity

## License

This project is licensed under the MIT license. See the LICENSE file for more info.
