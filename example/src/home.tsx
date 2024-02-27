import React, { ReactElement } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export type Props = {
    onStartIDV: () => void;
    onStartFaceAuth: () => void;
    errorMessage: string;
};

const HomeScreen: React.FC<Props> = ({ onStartIDV, onStartFaceAuth, errorMessage }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{"Identinty Verification"}</Text>
            { renderStartIDVButton() }
            { renderStartFaceAuthVButton() }
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

    function renderStartFaceAuthVButton(): ReactElement {
        return (
            <View style={{marginTop: 24}}>
                <Button 
                    title="Start Face Authentication" 
                    onPress={onStartFaceAuth}
                />
            </View>
        )
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