export class PlayerApplication {

    constructor(
        api,
        audioPlayer,
        song,
        ui,
        xmlEditor,
        songEditor
    ) {

        this.api = api;
        this.audioPlayer = audioPlayer;
        this.song = song;
        this.ui = ui;
        this.xmlEditor = xmlEditor;
        this.songEditor = songEditor;
        this.songEditor.setSong(song);
    }


    async initialize() {

        this.xmlEditor.initialize();
        this.xmlEditor.onChange(xml => this.song.setXml(xml));

        await this.songEditor.initialize();
        //this.songEditor.onChange(change => this.onSongEditorChange(change));

        await this.ui.initialize();
        this.ui.onPlay(() => this.play());
        this.ui.onStop(() => this.stop());

        this.start();
    }
   

    /*
     * SongEditor aktualisieren
     */
    refreshSongEditor() {
        this.songEditor.refresh();        
       // this.songEditor.setTimeline(
       //     this.song.getTimeline()
       // );
    }

   

    async start() {

        try {

            await this.createSession();

            await this.loadDefaultSong();

        } catch (error) {

            this.showError(error);
        }
    }


    async createSession() {

        this.ui.setStatus(
            "Erstelle JJazzLab-Session..."
        );


        const result =
            await this.api.createSession();


        this.song.setSessionId(
            result.sessionId
        );
    }


    async loadDefaultSong() {

        try {

            this.ui.setStatus(
                "Lade Standard-Song..."
            );


            const result =
                await this.api.loadDefaultSong(
                    this.song.sessionId
                );


            const xml =
                await this.api.getSongXml(
                    this.song.sessionId
                );


            this.song.setSong(
                result.song,
                xml
            );


            this.refreshSongEditor();


            this.xmlEditor.setXml(
                xml
            );

            this.xmlEditor.setModified(
                false
            );


            this.ui.onLoadFile(
                event => this.loadLocalFile(event)
            );


            this.ui.setPlayEnabled(
                true
            );


            this.ui.setStatus(
                `Song geladen: ${result.song}`
            );


            this.saveSong();

        } catch (error) {

            this.showError(error);
        }
    }


    async loadLocalFile(event) {

        try {

            const file =
                event.target.files[0];

            if (!file) {
                return;
            }


            const xml = await this.xmlEditor.readLocalFile(file);
            this.song.setXml(xml);
            this.refreshSongEditor();
            this.xmlEditor.setXml(xml);
            this.xmlEditor.setModified(true);
            this.ui.setPlayEnabled(false);
            this.ui.setStatus(`${file.name} geladen`);

            this.saveSong();

        } catch (error) {

            this.showError(error);

        } finally {

            this.ui.clearFileSelection();
        }
    }


    async saveSong() {

        try {

            this.ui.setStatus(
                "Speichere Song auf dem Server..."
            );


            const result =
                await this.api.saveSongXml(
                    this.song.sessionId,
                    this.song.xml
                );


            this.song.markSaved();


           // this.ui.setSongName(
           //     result.song
           // );


            this.xmlEditor.setModified(
                false
            );


            this.ui.setPlayEnabled(
                true
            );


            this.ui.setStatus(
                `Song gespeichert: ${result.song}`
            );

        } catch (error) {

            this.showError(error);
        }
    }


    downloadSong() {

        const xml =
            this.song.xml;


        const blob =
            new Blob(
                [xml],
                {
                    type: "application/octet-stream"
                }
            );


        const url =
            URL.createObjectURL(
                blob
            );


        const link =
            document.createElement("a");


        link.href =
            url;

        link.download = this.song.getName() + ".sng";

        document.body.appendChild(
            link
        );

        link.click();

        link.remove();


        URL.revokeObjectURL(
            url
        );
    }


    async play() {

        try {

            await this.saveSong();


            this.ui.setPlayEnabled(
                false
            );

            this.ui.setStopEnabled(
                true
            );


            this.ui.setStatus(
                "Erzeuge MIDI..."
            );


            const midi =
                await this.api.getMidi(
                    this.song.sessionId
                );


            await this.audioPlayer.play(
                midi
            );


            this.ui.setStatus(
                `Spiele: ${this.song.name}`
            );

        } catch (error) {

            this.showError(error);

            this.ui.setStopEnabled(false);
            this.ui.setPlayEnabled(true);
        }
    }


    stop() {

        this.audioPlayer.stop();


        this.ui.setStopEnabled(
            false
        );

        this.ui.setPlayEnabled(
            true
        );


        this.ui.setStatus(
            `Gestoppt: ${this.song.name}`
        );
    }


    showError(error) {
        console.error(error);
        this.ui.messageBox.show("Error", error);
    }
}
