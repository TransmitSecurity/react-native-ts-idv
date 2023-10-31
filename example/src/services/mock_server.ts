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

    private baseurl: string;
    private clientId: string;
    private secret: string;

    constructor(baseUrl: string, clientId: string, secret: string) {
        this.baseurl = baseUrl;
        this.clientId = clientId;
        this.secret = secret;
    }

    getAccessToken = async (): Promise<AccessTokenResponse> => {
        const formData = {
            client_id: this.clientId, // Replace with client ID obtained in Step 1
            client_secret: this.secret, // Replace with client secret obtained in Step 1
            grant_type: 'client_credentials',
            resource: 'https://verify.identity.security'
        };

        try {
            const resp = await fetch(
                `${this.baseurl}/oidc/token`,
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

    createVerificationSession = async (accessToken: string): Promise<VerificationSessionResponse> => {

        try {
            const resp = await fetch(
                `${this.baseurl}/verify/api/v1/verification`,
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
                `${this.baseurl}/verify/api/v1/verification/${sessionId}/result`,
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
}
export default MockServer;