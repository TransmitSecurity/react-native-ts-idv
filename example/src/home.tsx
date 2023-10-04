import React, { ReactElement } from 'react';
import { Button, StyleSheet, Text, View, Platform, PermissionsAndroid } from 'react-native';

export type Props = {
    onStartIDV: () => void;
    errorMessage: string;
};

const HomeScreen: React.FC<Props> = ({ onStartIDV, errorMessage }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{"Identinty Verification"}</Text>
            { Platform.OS === "android" ? renderAndroidCameraPermission() : null }
            { renderStartIDVButton() }
            { renderStatusLabel() }
        </View>
    );

    function renderStatusLabel(): ReactElement {
        return (
            <View style={{marginTop: 24}}>
                <Text style={styles.statusLabel}>{errorMessage}</Text>
            </View>
        )
    }

    function renderStartIDVButton(): ReactElement {
        return (
            <View style={{marginTop: 24}}>
                <Button 
                    title="Start Identity Verification" 
                    onPress={onStartIDV}
                />
            </View>
        )
    }

    function renderAndroidCameraPermission(): ReactElement {
        return (
            <View>
                <Text style={styles.sectionDescription}>Identity document verification requires camera permissions</Text>
                <View style={{ paddingHorizontal: 22 }} >
                    <Button title="request permissions" onPress={requestCameraPermission} />
                </View>
            </View>
        )
    }
};

const requestCameraPermission = async () => {
    const hasCameraPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.CAMERA)

    if (!hasCameraPermission) {
        try {
            console.log('start request Camera Permission');
            const granted = await PermissionsAndroid.request(
                PermissionsAndroid.PERMISSIONS.CAMERA,
                {
                    title: 'IDV Camera Permission',
                    message:
                        'App needs access to your camera ' +
                        'so you can take picturesof your ID.',
                    buttonNeutral: 'Ask Me Later',
                    buttonNegative: 'Cancel',
                    buttonPositive: 'OK',
                },
            );
            if (granted === PermissionsAndroid.RESULTS.GRANTED) {
                console.log('You can use the camera');
            } else {
                console.log('Camera permission denied');
            }
        } catch (err) {
            console.warn(err);
        }
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        padding: 12,
    },
    statusLabel: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
        color: 'red',
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: '600',
        textAlign: 'center',
        color: 'black',
    },
    sectionDescription: {
        marginTop: 40,
        marginBottom: 10,
        fontSize: 18,
        fontWeight: '400',
        textAlign: 'center',
        color: 'black',
    }
});

export default HomeScreen;