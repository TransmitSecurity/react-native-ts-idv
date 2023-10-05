import React from 'react';
import { Button, StyleSheet, Text, View, Modal, TouchableOpacity } from 'react-native';

export type Props = {
    isVisible: boolean;
    onRecapture: () => void;
    onDismiss: () => void;
};

const RequireRecaptureDialog: React.FC<Props> = ({ isVisible, onRecapture, onDismiss }) => {
    return (
        <Modal visible={isVisible} animationType="fade" transparent={true} onRequestClose={() => onDismiss()}>
            <TouchableOpacity style={styles.modalContainer}>
                <View style={styles.modalView}>
                    <View style={styles.alert}>
                        <Text style={styles.alertTitle}>Something went wrong</Text>
                        <Text style={styles.alertMessage}>An error occurred during the verification process. Please attempt to recapture the information.</Text>
                        <View style={styles.alertButtonGroup}>
                            <View style={styles.alertButton}>
                                <Button title="Cancel" onPress={() => onDismiss()} />
                            </View>
                            <View style={styles.alertButton}>
                                <Button title="Recapture" onPress={() => onRecapture()} />
                            </View>
                        </View>
                    </View>
                </View>
            </TouchableOpacity>
        </Modal>
    );
};

const styles = StyleSheet.create({
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
        alignContent: 'center',
        justifyContent: 'center'
    },
    alert: {
        width: '100%',
        maxWidth: 300,
        margin: 48,
        elevation: 24,
        borderRadius: 2,
        backgroundColor: '#fff'
    },
    alertTitle: {
        margin: 24,
        fontWeight: "bold",
        fontSize: 24,
        color: "#000"
    },
    alertMessage: {
        marginLeft: 24,
        marginRight: 24,
        marginBottom: 24,
        fontSize: 16,
        color: "#000"
    },
    alertButtonGroup: {
        marginTop: 0,
        marginRight: 0,
        marginBottom: 8,
        marginLeft: 24,
        padding: 10,
        display: "flex",
        flexDirection: 'row',
        justifyContent: "flex-end"
    },
    alertButton: {
        marginTop: 12,
        marginRight: 8,
        width: 100
    }
});

export default RequireRecaptureDialog;
