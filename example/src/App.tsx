/**
 * React Native - Identity Verification example
 * Transmit Security, https://github.com/TransmitSecurity
 *
 * @format
 */

import React from 'react';
import { NativeModules, NativeEventEmitter, SafeAreaView, EmitterSubscription, ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { request, PERMISSIONS } from 'react-native-permissions';

import IdentityVerification, { TSIDV } from 'react-native-ts-idv';
import MockServer, { AccessTokenResponse, VerificationResultsResponse, VerificationSessionResponse } from './services/mock_server';

import HomeScreen from './home';
import VerificationResultsDialog from './verification-results-dialog';
import RequireRecaptureDialog from './require-recapture-dialog';

import config from './config';

const { TsIdv } = NativeModules;
const eventEmitter = new NativeEventEmitter(TsIdv);

export type State = {
  isVerificationResultsModalVisible: boolean;
  isRecaptureModalVisible: boolean;
  verificationResultsResponse: VerificationResultsResponse | null
  errorMessage: string;
  isProcessing: boolean;
};

const enum VerificationStatus {
  verificationDidCancel = "verificationDidCancel",
  verificationDidComplete = "verificationDidComplete",
  verificationDidFail = "verificationDidFail",
  verificationDidStartCapturing = "verificationDidStartCapturing",
  verificationDidStartProcessing = "verificationDidStartProcessing",
  verificationRequiresRecapture = "verificationRequiresRecapture",
}

export default class App extends React.Component<any, State> {

  private mockServer: MockServer = new MockServer();
  private accessTokenResponse: AccessTokenResponse | null = null;
  private verificationSession?: VerificationSessionResponse;
  private verificationStatusChangeSub?: EmitterSubscription;

  state = {
    isVerificationResultsModalVisible: false,
    isRecaptureModalVisible: false,
    verificationResultsResponse: null,
    errorMessage: "",
    isProcessing: false
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
        <HomeScreen onStartIDV={this.onStartVerificationProcess} errorMessage={this.state.errorMessage} />
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

  private requestCameraPermissions = (): void => {
    if (Platform.OS === "android") {
      request(PERMISSIONS.ANDROID.CAMERA).then((result) => {
        console.log(`Requested camera permissions. Result: ${result}`);
      });
    } else if (Platform.OS === "ios"){
      request(PERMISSIONS.IOS.CAMERA).then((result) => {
        console.log(`Requested camera permissions. Result: ${result}`);
      });
    } else {
      console.error("Unsupported platform");
    }
  }

  private onRecapture = (): void => {
    this.setState({ isRecaptureModalVisible: false });
    IdentityVerification.recapture();
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

  private identityVerificationCompleted = async (sessionId: string, accessToken: string): Promise<void> => {
    const accessTokenResponse = this.accessTokenResponse;
    if (!accessTokenResponse) {
      this.logAppEvent(`Access Token Response is null when calling identityVerificationCompleted`);
      return;
    }

    try {
      const verificationResults = await this.mockServer.getVerificationResults(sessionId, accessToken);

      this.setState({
        isVerificationResultsModalVisible: true,
        verificationResultsResponse: verificationResults
      });

    } catch (error) {
      this.setState({ errorMessage: `${error}` });
    }
  }

  private onAppReady = async (): Promise<void> => {
    IdentityVerification.initialize(config.clientId);
    this.registerForEvents();
    this.requestCameraPermissions();

    try {
      this.accessTokenResponse = await this.mockServer.getAccessToken();
    } catch (error) {
      this.setState({ errorMessage: `${error}` });
    }
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

    const accessToken = this.accessTokenResponse?.token || "";
    await this.identityVerificationCompleted(this.verificationSession.sessionId, accessToken!);
  }

  private onVerificationStatus = async (params: any) => {
    const status = params["status"];
    const additionalData = params["additionalData"];

    switch (status) {
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
        const error: TSIDV.IdentityVerificationError = additionalData["error"];
        this.setState({ errorMessage: `Verification Failed: ${error}`, isProcessing: false });
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
        const reason: string = additionalData["error"];
        this.setState({ errorMessage: `Require Recapture: ${reason}`, isProcessing: false, isRecaptureModalVisible: true });
        this.logAppEvent(`verificationRequiresRecapture: ${additionalData}`);
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