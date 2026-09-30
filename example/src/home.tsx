import React, { type ReactElement } from 'react';
import { Button, StyleSheet, Text, View } from 'react-native';

export type Props = {
    onStartIDV: () => void;
    onStartFaceAuth: () => void;
    onStartMosaicUI: () => void;
    isInSession: boolean;
    sessionId: string | null;
    errorMessage: string;
};

const HomeScreen: React.FC<Props> = ({ onStartIDV, onStartFaceAuth, onStartMosaicUI, isInSession, sessionId, errorMessage }) => {

    return (
        <View style={styles.container}>
            <Text style={styles.sectionTitle}>{"Identinty Verification"}</Text>
            { renderStartIDVWithMosaicUIButton() }
            { renderStartIDVButton() }
            { renderStartFaceAuthVButton() }
            { renderSessionLabel() }
            { renderStatusLabel() }
        </View>
    );

    function renderSessionLabel(): ReactElement {
        if (!sessionId) { return <></> }
        return (
            <View style={{marginTop: 24}}>
                <Text style={styles.sessionLabel} selectable>{`Session ID: ${sessionId}`}</Text>
            </View>
        )
    }

    function renderStatusLabel(): ReactElement {
        return (
            <View style={{marginTop: 24}}>
                <Text style={styles.statusLabel}>{errorMessage}</Text>
            </View>
        )
    }

    function renderStartIDVButton(): ReactElement {
        if (isInSession) { return <></> }
        return (
            <View style={{marginTop: 24}}>
                <Button 
                    title="Start Identity Verification" 
                    onPress={onStartIDV}
                />
            </View>
        )
    }

    function renderStartIDVWithMosaicUIButton(): ReactElement {
        if (isInSession) { return <></> }
        return (
            <View style={{marginTop: 24}}>
                <Button 
                    title="Start MosaicUI Identity Verification" 
                    onPress={onStartMosaicUI}
                />
            </View>
        )
    }

    function renderStartFaceAuthVButton(): ReactElement {
        if (!isInSession) { return <></> }
        
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
    sessionLabel: {
        fontSize: 14,
        textAlign: 'center',
        color: 'black',
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