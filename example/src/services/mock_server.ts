import config from "../config";

export interface AccessTokenResponse {
    token: string;
    expireDate: Date;
}

export interface VerificationSessionResponse {
    startToken: string;
    sessionId: string;
    expiration: string;
    missingImages: string[];
}

export interface FaceAuthSessionResponse {
    deviceSessionId: string;
    sessionId: string;
}

export interface FaceVerificationResultsResponse {
    status: string;
    recommendation: string;
}

export const enum VerificationRecomendation {
    ALLOW, CHALLENGE, DENY
}

export interface VerificationResultsResponse {
    sessionId: string;
    status: string;
    recommendation: VerificationRecomendation;
    verifiedInfo: any;
}

class MockServer {

    // MARK: - General methods

    getAccessToken = async (): Promise<AccessTokenResponse> => {
        const formData = {
            client_id: config.clientId, // Replace with client ID obtained in Step 1
            client_secret: config.secret, // Replace with client secret obtained in Step 1
            grant_type: 'client_credentials',
            resource: 'https://verify.identity.security'
        };

        try {
            const resp = await fetch(
                `${config.baseAPIURL}/oidc/token`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: new URLSearchParams(formData).toString()
                }
            );

            const json = await resp.json();
            const expireDate = new Date();
            expireDate.setSeconds(expireDate.getSeconds() + json.expires_in);

            return { token: json.access_token, expireDate };
        } catch (error) {
            return Promise.reject("Error in getAccessToken");
        }
    }

    // MARK: -Document Verification methods

    createVerificationSession = async (accessToken: string): Promise<VerificationSessionResponse> => {

        try {
            const resp = await fetch(
                `${config.baseAPIURL}/verify/api/v1/verification`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const data = await resp.json();

            return {
                startToken: data.start_token,
                sessionId: data.session_id,
                expiration: data.expiration,
                missingImages: data.missing_images
            };
        } catch (error) {
            return Promise.reject("Error in createVerificationSession");
        }
    }

    getVerificationResults = async (sessionId: string, accessToken: string): Promise<VerificationResultsResponse> => {
        try {
            const resp = await fetch(
                `${config.baseAPIURL}/verify/api/v1/verification/${sessionId}/result`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const data = await resp.json();

            return {
                sessionId: data.session_id,
                status: data.status,
                recommendation: data.recommendation,
                verifiedInfo: data.verified_info
            };
        } catch (error) {
            return Promise.reject("Error in getVerificationResults");
        }
    }

    // MARK: - Face Authentication methods

    createFaceAuthSession = async (accessToken: string, sessionIdForImageRef: string): Promise<FaceAuthSessionResponse> => {
        const selfieId = await this.fetchSelfieIDWithSessionId(sessionIdForImageRef, accessToken);
        const base64RefImage = await this.fetchBase64PhotoByID(selfieId, sessionIdForImageRef, accessToken);

        try {
            const resp = await fetch(
                `${config.baseAPIURL}/verify/api/v1/face-auth`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        reference: {
                            type: 'raw',
                            content: base64RefImage,
                            format: 'string'
                        },
                        use_case: "login"
                    })
                }
            );

            const data = await resp.json();

            return {
                deviceSessionId: data.device_session_id,
                sessionId: data.session_id
            };
        } catch (error) {
            return Promise.reject("Error in createFaceAuthSession");
        }
    }

    getFaceAuthResults = async (deviceSessionId: string, accessToken: string): Promise<FaceVerificationResultsResponse> => {
        try {
            const resp = await fetch(
                `${config.baseAPIURL}/verify/api/v1/face-auth/${deviceSessionId}/result`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            );

            const data = await resp.json();

            return {
                status: data.status,
                recommendation: data.recommendation
            };
        } catch (error) {
            return Promise.reject("Error in getFaceAuthResults");
        }
    }

    private fetchSelfieIDWithSessionId = async (sessionId: string, accessToken: string): Promise<string> => {
        try {

            const resp = await this.performFetchWithAccessToken(
                accessToken, `${config.baseAPIURL}/verify/api/v1/verification/${sessionId}/images`,
                'GET', null
            );

            const data = await resp.json();

            if (!data.session_images) {
                return Promise.reject("No images found for sessionId");
            }

            const selfieImage = data.session_images.find((image: any) => image.type === "selfie");
            if (!selfieImage) {
                return Promise.reject("No selfie image found for sessionId");
            }

            return selfieImage.id;

        } catch (error) {
            return Promise.reject("Error in fetchSelfieIDWithSessionId");
        }
    }

    private fetchBase64PhotoByID = async (photoId: string, sessionId: string, accessToken: string): Promise<string> => {
        try {

            const resp = await this.performFetchWithAccessToken(
                accessToken, `${config.baseAPIURL}/verify/api/v1/verification/${sessionId}/images/${photoId}`,
                'GET', null
            );

            const blob = await resp.blob();
            const resData = await this.blobToData(blob) as string;

            return resData;

        } catch (error) {
            return Promise.reject("Error in fetchBase64PhotoByID");
        }
    }

    private performFetchWithAccessToken = async (accessToken: string, url: string, method: string, body: any): Promise<any> => {
        const resp = await fetch(
            url,
            {
                method: method,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );

        return resp;
    }

    private blobToData = (blob: Blob) => {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader()
                reader.onloadend = () => resolve(reader.result)
                reader.readAsDataURL(blob)
            } catch (error) {
                reject("Error in blobToData");
            }
        })
    }
}
export default MockServer;