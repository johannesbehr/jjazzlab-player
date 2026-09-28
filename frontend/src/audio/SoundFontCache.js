export class SoundFontCache {

    constructor(
        dbName = "JJazzLabWebClient",
        storeName = "soundfonts"
    ) {
        this.dbName = dbName;
        this.storeName = storeName;
    }


    async openDatabase() {

        return new Promise((resolve, reject) => {

            const request =
                indexedDB.open(this.dbName, 1);

            request.onupgradeneeded = () => {

                const db = request.result;

                if (!db.objectStoreNames.contains(this.storeName)) {
                    db.createObjectStore(this.storeName);
                }
            };

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }


    async get(key) {

        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {

            const transaction =
                db.transaction(this.storeName, "readonly");

            const store =
                transaction.objectStore(this.storeName);

            const request =
                store.get(key);

            request.onsuccess = () => {
                resolve(request.result ?? null);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }


    async put(key, value) {

        const db = await this.openDatabase();

        return new Promise((resolve, reject) => {

            const transaction =
                db.transaction(this.storeName, "readwrite");

            const store =
                transaction.objectStore(this.storeName);

            const request =
                store.put(value, key);

            request.onsuccess = () => {
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }


    async getOrFetch(key, url, onProgress = null) {

        const cached =
            await this.get(key);

        if (cached) {
            if (onProgress) {
                onProgress(100, "SoundFont bereit");
            }
            return cached;
        }

    const response =
            await fetch(url);


        if (!response.ok) {
            throw new Error(
                `SoundFont konnte nicht geladen werden: HTTP ${response.status}`
            );
        }


        const contentLength =
            response.headers.get("Content-Length");


        if (!response.body || !contentLength) {

            // Fallback, falls der Server keine
            // Content-Length liefert.

            const soundFont =
                await response.arrayBuffer();

            if (onProgress) {
                onProgress(100, "SoundFont geladen");
            }

            await this.put(
                key,
                soundFont
            );

            return soundFont;
        }


        const total =
            parseInt(contentLength, 10);


        const reader =
            response.body.getReader();


        const chunks = [];

        let received = 0;


        while (true) {

            const { done, value } =
                await reader.read();


            if (done) {
                break;
            }


            chunks.push(value);

            received += value.length;


            const percent =
                Math.round(
                    received / total * 100
                );


            if (onProgress) {
                onProgress(
                    percent,
                    `SoundFont wird geladen ... ${percent} %`
                );
            }
        }


        const soundFont =
            new Uint8Array(received);


        let offset = 0;


        for (const chunk of chunks) {

            soundFont.set(
                chunk,
                offset
            );

            offset += chunk.length;
        }


        const buffer =
            soundFont.buffer;


        await this.put(
            key,
            buffer
        );


        if (onProgress) {
            onProgress(
                100,
                "SoundFont bereit"
            );
        }

        return buffer;
    }
}