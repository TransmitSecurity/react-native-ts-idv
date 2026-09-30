export default {
    baseAPIURL: "https://api.transmitsecurity.io", // Use api.eu.transmitsecurity.io for EU clusters
    clientId: "REPLACE_WITH_CLIENT_ID",
    /*
    * "clientId": initialize(clientId, baseAPIURL) — values above.
    * "resources": initializeSDK() — reads transmit_security_client_id / transmit_security_base_url
    * from strings.xml on Android and the SDK configuration plist on iOS (see the plugin README).
    * Add those files to the native projects before switching.
    */
    initMode: "clientId" as "clientId" | "resources",
    idvStatusChangeEventName: "idv_status_change_event",
    /*
    * Don't keep the secret on the client side. This is just an example
    */
    secret: "REPLACE_WITH_SECRET",
}