/**
 * React Native - Identity Verification example
 * Transmit Security, https://github.com/TransmitSecurity
 *
 * @format
 */

import React from 'react';
import {
  NativeModules, NativeEventEmitter, SafeAreaView,
  type EmitterSubscription, ActivityIndicator, View,
  StyleSheet, Alert
} from 'react-native';
import MockServer, {
  type AccessTokenResponse, type FaceAuthSessionResponse, type VerificationResultsResponse,
  type VerificationSessionResponse
} from './services/mock_server';

import HomeScreen from './home';
import VerificationResultsDialog from './verification-results-dialog';
import RequireRecaptureDialog from './require-recapture-dialog';

import IdentityVerification, { TSIDV } from 'react-native-ts-idv';

import config from './config';
import { VerificationStatus, describeFailure, describeRecapture } from './idv-status';
import { ensureCameraPermission } from './camera-permission';

const { TsIdv } = NativeModules;
const eventEmitter = new NativeEventEmitter(TsIdv);

export type State = {
  isVerificationResultsModalVisible: boolean;
  isRecaptureModalVisible: boolean;
  verificationResultsResponse: VerificationResultsResponse | null
  errorMessage: string;
  isProcessing: boolean;
  lastVerificationSessionID: string | null;
};

export default class App extends React.Component<any, State> {

  private mockServer: MockServer = new MockServer();
  private accessTokenResponse: AccessTokenResponse | null = null;
  private verificationSession?: VerificationSessionResponse;
  private faceAuthSession?: FaceAuthSessionResponse;
  private verificationStatusChangeSub?: EmitterSubscription;

  state = {
    isVerificationResultsModalVisible: false,
    isRecaptureModalVisible: false,
    verificationResultsResponse: null,
    errorMessage: "",
    isProcessing: false,
    lastVerificationSessionID: null
  }

  componentDidMount(): void {
    this.onAppReady().catch(e => void e);
  }

  componentWillUnmount(): void {
    this.unregisterFromEvents();
  }

  render() {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <HomeScreen
          onStartIDV={this.onStartVerificationProcess}
          onStartFaceAuth={this.onStartFaceAuth}
          onStartMosaicUI={this.onStartMosaicUI}
          isInSession={this.state.lastVerificationSessionID !== null}
          sessionId={this.state.lastVerificationSessionID}
          errorMessage={this.state.errorMessage}
        />
        <VerificationResultsDialog
          isVisible={this.state.isVerificationResultsModalVisible}
          verificationResults={this.state.verificationResultsResponse}
          onDismiss={() => this.setState({ isVerificationResultsModalVisible: false })}
        />
        <RequireRecaptureDialog
          isVisible={this.state.isRecaptureModalVisible}
          onDismiss={() => this.setState({ isRecaptureModalVisible: false })}
          onRecapture={() => this.onRecapture()}
        />
        {this.renderProcessing()}
      </SafeAreaView>
    );
  }

  /** Checks the camera right before a flow starts; shows an error and returns false if denied. */
  private hasCameraPermission = async (): Promise<boolean> => {
    const granted = await ensureCameraPermission();
    if (!granted) {
      this.setState({ errorMessage: "Camera permission is required to start verification" });
    }
    return granted;
  }

  private onRecapture = async (): Promise<void> => {
    this.setState({ isRecaptureModalVisible: false });
    if (!(await this.hasCameraPermission())) return;
    try {
      await IdentityVerification.recapture();
    } catch (error) {
      this.logAppEvent(`Error during recapture: ${error}`);
      this.setState({ errorMessage: `${error}` });
    }
  }

  private renderProcessing = (): any => {
    if (!this.state.isProcessing) return null;

    return (
      <View style={styles.processingView}>
        <View style={styles.loadingIndicatorContainer}>
          {this.state.isProcessing && <ActivityIndicator color={"#000000"} />}
        </View>
      </View>
    )
  }

  onStartVerificationProcess = async (): Promise<void> => {
    if (!(await this.hasCameraPermission())) return;
    try {
      const accessToken = this.accessTokenResponse?.token || "";
  
      this.verificationSession = await this.mockServer.createVerificationSession(accessToken);
      await IdentityVerification.startIdentityVerification(this.verificationSession.startToken);

      this.logAppEvent("Started identity verification process");
    } catch (error) {
      this.logAppEvent(`Error verifying user identity: ${error}`);
      this.setState({ errorMessage: `${error}` });
    }
  }

  onStartFaceAuth = async (): Promise<void> => {
    if (this.state.lastVerificationSessionID === null) {
      const message = "Error: lastVerificationSessionID is null when calling onStartFaceAuth";
      this.setState({ errorMessage: `${message}` });
      return;
    }

    if (!(await this.hasCameraPermission())) return;

    this.setState({ isProcessing: true });
    this.accessTokenResponse = await this.mockServer.getAccessToken();
    const accessToken = this.accessTokenResponse?.token || "";
    this.faceAuthSession = await this.mockServer.createFaceAuthSession(accessToken, this.state.lastVerificationSessionID);
    this.setState({ isProcessing: false });

    try {
      await IdentityVerification.startFaceAuth(this.faceAuthSession.deviceSessionId);
      this.logAppEvent("Started face authentication process");
    } catch (error) {
      this.logAppEvent(`Error verifying user identity: ${error}`);
      this.setState({ errorMessage: `${error}`, isProcessing: false });
    }
  }

  onStartMosaicUI = async (): Promise<void> => {
    if (!(await this.hasCameraPermission())) return;
    try {
      const accessToken = this.accessTokenResponse?.token || "";
  
      this.verificationSession = await this.mockServer.createVerificationSession(accessToken);
      await IdentityVerification.startMosaicUI(this.verificationSession.startToken);

      this.logAppEvent("Started identity verification with MosaicUI process");
    } catch (error) {
      this.logAppEvent(`Error verifying user identity: ${error}`);
      this.setState({ errorMessage: `${error}` });
    }
  }

  private identityVerificationCompleted = async (sessionId: string, accessToken: string): Promise<void> => {

    try {
      const verificationResults = await this.mockServer.getVerificationResults(sessionId, accessToken);

      this.setState({
        isVerificationResultsModalVisible: true,
        verificationResultsResponse: verificationResults,
        lastVerificationSessionID: sessionId
      });

    } catch (error) {
      this.setState({ errorMessage: `${error}` });
    }
  }

  private faceVerificationCompleted = async (deviceSessionId: string, accessToken: string): Promise<void> => {
    try {
      const verificationResults = await this.mockServer.getFaceAuthResults(deviceSessionId, accessToken);

      Alert.alert(JSON.stringify(verificationResults));

    } catch (error) {
      this.setState({ errorMessage: `${error}` });
    }
  }

  private onAppReady = async (): Promise<void> => {
    if (!this.isAppConfigured()) {
      this.logAppEvent("Error: This code requires configuration of the App's Client ID and Secret. Please set the values in config.ts before proceeding.");
      return;
    }

    IdentityVerification.setLogLevel(TSIDV.IDVLogLevel.verbose);
    try {
      await this.initializeSDK();
    } catch (error) {
      this.logAppEvent(`Error initializing the SDK: ${error}`);
      this.setState({ errorMessage: `${error}` });
      return;
    }

    this.registerForEvents();

    try {
      this.accessTokenResponse = await this.mockServer.getAccessToken();
    } catch (error) {
      this.setState({ errorMessage: `${error}` });
    }
  }

  /**
   * `resources` is the route the README documents for customers: the client ID and base URL come
   * from strings.xml (Android) and the configuration plist (iOS). `clientId` passes them in code.
   */
  private initializeSDK = async (): Promise<void> => {
    if (config.initMode === "resources") {
      await IdentityVerification.initializeSDK(config.configurationFileName);
      return;
    }
    await IdentityVerification.initialize(config.clientId, config.baseAPIURL as TSIDV.BaseURL);
  }

  private isAppConfigured = (): boolean => {
    return !(config.clientId === "REPLACE_WITH_CLIENT_ID" || config.secret === "REPLACE_WITH_SECRET");
  }

  // Event Emitter

  private registerForEvents() {
    this.verificationStatusChangeSub = eventEmitter.addListener(
      config.idvStatusChangeEventName,
      this.onVerificationStatus
    );
  }

  private unregisterFromEvents() {
    this.verificationStatusChangeSub?.remove();
  }

  private handleIdentityVerificationComplete = async (): Promise<void> => {
    if (!this.verificationSession) {
      this.logAppEvent("Access token is null on handleIdentityVerificationComplete");
      return;
    }

    const accessToken = this.accessTokenResponse!.token;
    await this.identityVerificationCompleted(this.verificationSession.sessionId, accessToken!);
  }

  private handleFaceAuthComplete = async (): Promise<void> => {
    if (!this.faceAuthSession) {
      this.logAppEvent("Face Auth Session is null on handleFaceAuthComplete");
      return;
    }

    const accessToken = this.accessTokenResponse!.token;
    await this.faceVerificationCompleted(this.faceAuthSession.deviceSessionId, accessToken!);
  }

  private onVerificationStatus = async (params: any) => {
    const status = params["status"];
    const additionalData = params["additionalData"];

    switch (status) {
      // Identity Verification Events:
      //--------------------------------
      case VerificationStatus.verificationDidCancel:
        this.setState({ errorMessage: `User Canceled`, isProcessing: false });
        this.logAppEvent(`verificationDidCancel`);
        break;
      case VerificationStatus.verificationDidComplete:
        this.logAppEvent(`verificationDidComplete`);
        this.setState({ errorMessage: ``, isProcessing: false });
        await this.handleIdentityVerificationComplete();
        break;
      case VerificationStatus.verificationDidFail:
        this.setState({ errorMessage: `Verification Failed: ${describeFailure(additionalData)}`, isProcessing: false });
        this.logAppEvent(`verificationDidFail`);
        break;
      case VerificationStatus.verificationDidStartCapturing:
        this.logAppEvent(`verificationDidStartCapturing`);
        this.setState({ errorMessage: `` });
        break;
      case VerificationStatus.verificationDidStartProcessing:
        this.logAppEvent(`verificationDidStartProcessing`);
        this.setState({ errorMessage: ``, isProcessing: true });
        break;
      case VerificationStatus.verificationRequiresRecapture:
        this.setState({ errorMessage: `Require Recapture: ${describeRecapture(additionalData)}`, isProcessing: false, isRecaptureModalVisible: true });
        this.logAppEvent(`verificationRequiresRecapture: ${JSON.stringify(additionalData)}`);
        break;

      // Face Authentication Events:
      // ------------------------------
      
      case VerificationStatus.faceAuthenticationDidCancel:
        this.setState({ errorMessage: `User Canceled`, isProcessing: false });
        this.logAppEvent(`faceAuthenticationDidCancel`);
        break;
      case VerificationStatus.faceAuthenticationDidComplete:
        this.logAppEvent(`faceAuthenticationDidComplete`);
        this.setState({ errorMessage: ``, isProcessing: false });
        await this.handleFaceAuthComplete();
        break;
      case VerificationStatus.faceAuthenticationDidFail:
        this.setState({ errorMessage: `Face Authentication Failed: ${describeFailure(additionalData)}`, isProcessing: false });
        this.logAppEvent(`faceAuthenticationDidFail`);
        break;
      case VerificationStatus.faceAuthenticationDidStartCapturing:
        this.logAppEvent(`faceAuthenticationDidStartCapturing`);
        this.setState({ errorMessage: `` });
        break;
      case VerificationStatus.faceAuthenticationDidStartProcessing:
        this.logAppEvent(`faceAuthenticationDidStartProcessing`);
        this.setState({ errorMessage: ``, isProcessing: true });
        break;

      // Mosaic UI Events:
      // ------------------------------
      case VerificationStatus.mosaicUIVerificationDidComplete:
        this.logAppEvent(`mosaicUIVerificationDidComplete`);
        this.setState({ errorMessage: ``, isProcessing: false });
        await this.handleIdentityVerificationComplete();
        break;
      case VerificationStatus.mosaicUIVerificationDidCancel:
        this.setState({ errorMessage: `User Canceled`, isProcessing: false });
        this.logAppEvent(`mosaicUIVerificationDidCancel`);
        break;
      case VerificationStatus.mosaicUIVerificationDidFail:
        this.setState({ errorMessage: `Mosaic UI Verification Failed: ${describeFailure(additionalData)}`, isProcessing: false });
        this.logAppEvent(`mosaicUIVerificationDidFail`);
        break;
      default:
        this.setState({ errorMessage: `Invalid status response`, isProcessing: false });
        this.logAppEvent(`Unhandled verification status: ${status}`);
    }
  }

  // helpers

  private logAppEvent = (event: string): void => {
    console.log(`IDV Example: ${event}`);
  }
}

const styles = StyleSheet.create({
  processingView: {
    position: "absolute",
    left: 0, top: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  loadingIndicatorContainer: {
    padding: 24,
    backgroundColor: "#f5f5f5",
    borderRadius: 12
  }
});