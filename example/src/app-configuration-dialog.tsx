import React, { useState } from 'react';
import { TextInput, StyleSheet, Text, View, Modal, TouchableOpacity, Pressable } from 'react-native';
import { ExampleAppConfiguration } from './App';

export type Props = {
    isVisible: boolean;
    onDismiss: (appConfiguration: ExampleAppConfiguration) => void;
};

const AppConfigurationDialog: React.FC<Props> = ({ isVisible, onDismiss }) => {

    const [inputBaseURL, setBaseUrl] = useState("");
    const [inputClientId, setClientID] = useState("");
    const [inputSecret, setSecret] = useState("");
    const [errorMessage, setErrorMessage] = useState("");

    const onDismissWithConfiguration = (): void => {
        if (inputBaseURL.length === 0 || inputClientId.length === 0 || inputSecret.length === 0) {
            setErrorMessage("Please fill all fields");
            return;
        }
        setErrorMessage("");
        const appConfiguration: ExampleAppConfiguration = {
            baseAPIURL: inputBaseURL,
            clientId: inputClientId,
            secret: inputSecret
        };
        onDismiss(appConfiguration);
    }

    const onClearAllFields = (): void => {
        setBaseUrl("");
        setClientID("");
        setSecret("");
    }

    return (
        <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={() => onDismissWithConfiguration()}>
            <TouchableOpacity style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <View style={styles.alert}>
                        <Text style={styles.alertTitle}>Configure Example App</Text>
                        <Text style={styles.alertSubtitle}>Please enter Base URL, Client ID and Secret</Text>
                        <TextInput
                            style={styles.input}
                            onChangeText={(text: string) => setBaseUrl(text)}
                            value={inputBaseURL}
                            placeholder='Base URL'
                        />
                        <TextInput
                            style={styles.input}
                            onChangeText={(text: string) => setClientID(text)}
                            value={inputClientId}
                            placeholder='Client ID'
                        />
                        <TextInput
                            style={styles.input}
                            onChangeText={(text: string) => setSecret(text)}
                            value={inputSecret}
                            placeholder='Secret'
                        />

                        <View style={styles.divider} />
                        {errorMessage && <Text style={styles.errorLabel}>{errorMessage}</Text>}

                        {/* <Pressable style={{ padding: 12 }} onPress={onClearAllFields}>
                            <Text style={[styles.buttonText, styles.darkText]}>Clear all fields</Text>
                        </Pressable> */}

                        <View style={{ padding: 12 }}>
                            <Pressable style={styles.saveButton} onPress={onDismissWithConfiguration}>
                                <Text style={styles.buttonText}>Initialize SDK</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
    divider: {
        width: '100%',
        height: 1,
        padding: 12,
    },
    errorLabel: {
        color: 'red',
        fontSize: 12,
        padding: 12
    },
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 12,
    },
    modalContainer: {
        backgroundColor: "#ccc",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        position: 'absolute',
    },
    modalView: {
        flex: 1,
        alignContent: 'flex-start',
        justifyContent: 'flex-start'
    },
    alert: {
        width: '100%',
        maxWidth: '85%',
        margin: 48,
        elevation: 24,
        borderRadius: 4,
        backgroundColor: '#fff'
    },
    alertTitle: {
        margin: 8,
        fontWeight: "bold",
        fontSize: 24,
        color: "#000"
    },
    alertSubtitle: {
        marginLeft: 8,
        marginRight: 8,
        fontSize: 16,
        color: "#000"
    },
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        marginLeft: 8,
        marginRight: 8,
        marginTop: 4
    },
    saveButton: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 4,
        elevation: 3,
        backgroundColor: 'black',
    },
    buttonText: {
        fontSize: 16,
        lineHeight: 21,
        fontWeight: 'bold',
        letterSpacing: 0.25,
        color: 'white',
        textAlign: 'center'
    },
    darkText: {
        color: "black"
    }
});

export default AppConfigurationDialog;
