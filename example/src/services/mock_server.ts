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

    createFaceAuthSession = async (accessToken: string): Promise<FaceAuthSessionResponse> => {
        const base64RefImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAgAAAAIAQMAAAD+wSzIAAAABlBMVEX///+/v7+jQ3Y5AAAADklEQVQI12P4AIX8EAgALgAD/aNpbtEAAAAASUVORK5CYII";
        try {
            const resp = await fetch(
                `${config.baseAPIURL}/verify/api/v1/face-auth`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        Authorization: `Bearer ${accessToken}`
                    },
                    body: JSON.stringify({
                        reference: {
                            type: 'raw',
                            content: base64RefImage,
                            format: 'jpg'
                        }
                    })
                }
            );

            const data = await resp.json();

            console.log("createFaceAuthSession data", data)
            console.log(data)

            return {
                deviceSessionId: data.device_session_id,
                sessionId: data.session_id
            };
        } catch (error) {
            return Promise.reject("Error in createFaceAuthSession");
        }
    }
}
export default MockServer;