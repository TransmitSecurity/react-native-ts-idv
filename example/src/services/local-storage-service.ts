import AsyncStorage from '@react-native-async-storage/async-storage';

export const enum localStorageKeys {
    verificationSessionID = 'verificationSessionID',
}

export default class LocalStorageServiceWrapper {

    private localStorage = LocalStorageService.getInstance();

    public setVerificationSessionID = async (sessionId: string): Promise<void> => {
        return this.localStorage.setItem(localStorageKeys.verificationSessionID, sessionId);
    };

    public getVerificationSessionID = async (): Promise<string | null> => {
        return this.localStorage.getItem(localStorageKeys.verificationSessionID);
    };
}

class LocalStorageService {
    private static instance: LocalStorageService;

    private constructor() { }

    public static getInstance(): LocalStorageService {
        if (!LocalStorageService.instance) {
            LocalStorageService.instance = new LocalStorageService();
        }

        return LocalStorageService.instance;
    }

    public setItem = async (key: string, value: string): Promise<void> => {
        try {
            await AsyncStorage.setItem(key, value);
        } catch (error) {
            return Promise.reject('Error in setItem');
        }
    };

    public getItem = async (key: string): Promise<string | null> => {
        try {
            return await AsyncStorage.getItem(key);
        } catch (error) {
            return Promise.reject('Error in getItem');
        }
    };

    public removeItem = async (key: string): Promise<void> => {
        try {
            await AsyncStorage.removeItem(key);
        } catch (error) {
            return Promise.reject('Error in removeItem');
        }
    };
}