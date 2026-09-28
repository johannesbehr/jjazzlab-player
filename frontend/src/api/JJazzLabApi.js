export class JJazzLabApi {

    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async createSession() {

        const response =
            await fetch(
                `${this.baseUrl}/session`,
                {
                    method: "POST"
                }
            );

        this.checkResponse(
            response,
            "Session konnte nicht erstellt werden"
        );

        return await response.json();
    }


    async loadDefaultSong(sessionId) {

        const response =
            await fetch(
                `${this.baseUrl}/song/${sessionId}/load-default`,
                {
                    method: "POST"
                }
            );

        this.checkResponse(
            response,
            "Standard-Song konnte nicht geladen werden"
        );

        return await response.json();
    }


    async getSongXml(sessionId) {

        const response =
            await fetch(
                `${this.baseUrl}/song/${sessionId}`
            );

        this.checkResponse(
            response,
            "Song konnte nicht geladen werden"
        );

        return await response.text();
    }


    async saveSongXml(sessionId, xml) {

        const response =
            await fetch(
                `${this.baseUrl}/song/${sessionId}`,
                {
                    method: "PUT",
                    headers: {
                        "Content-Type": "application/xml"
                    },
                    body: xml
                }
            );

        this.checkResponse(
            response,
            "Song konnte nicht gespeichert werden"
        );

        return await response.json();
    }


    async getMidi(sessionId) {

        const response =
            await fetch(
                `${this.baseUrl}/midi/${sessionId}`
            );

        this.checkResponse(
            response,
            "MIDI konnte nicht geladen werden"
        );

        return await response.arrayBuffer();
    }


    checkResponse(response, message) {

        if (!response.ok) {
            throw new Error(
                `${message} (${response.status})`
            );
        }
    }
}