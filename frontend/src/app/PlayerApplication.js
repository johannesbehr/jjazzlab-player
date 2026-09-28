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
    }


    async initialize() {

        this.xmlEditor.initialize();

        this.xmlEditor.onChange(
            xml => this.song.setXml(xml)
        );


        await this.songEditor.initialize();

        this.songEditor.onChange(
            change => this.onSongEditorChange(change)
        );

        this.songEditor.onAddElement(
            name => this.addElement(name)
        );

        this.ui.onPlay(
            () => this.play()
        );


        this.ui.onStop(
            () => this.stop()
        );


        this.ui.onTempoChanged(
            tempo => {

                this.song.setTempo(tempo);

                this.xmlEditor.setXml(
                    this.song.getXml()
                );

                this.xmlEditor.setModified(true);
            }
        );


        this.ui.onSizeChanged(
            size => {

                this.song.setSongSize(size);

                this.xmlEditor.setXml(
                    this.song.getXml()
                );

                this.xmlEditor.setModified(true);
            }
        );


        this.start();
    }


    /*
     * Änderungen aus dem SongEditor
     */

    onSongEditorChange(change) {

        switch (change.type) {

            case "chord":
                this.changeChord(change);
                break;

            case "songPart":
                this.changeSongPart(change);
                break;

            default:
                console.warn(
                    "Unbekannter SongEditor-Typ:",
                    change.type
                );
        }
    }


    /*
     * SongEditor aktualisieren
     */

    refreshSongEditor() {

        this.songEditor.setTimeline(
            this.song.getTimeline()
        );
    }


    /*
     * Chord ändern
     */

    changeChord(change) {

        if (change.name.trim() === "") {

            this.song.removeChord(
                change.bar,
                change.position
            );

        } else if (change.name.includes(" ")) {

            this.song.splitChord(
                change.bar,
                change.position,
                change.name
            );

        } else {

            this.song.setChord(
                change.bar,
                change.position,
                change.name
            );
        }


        this.refreshSongEditor();


        this.xmlEditor.setXml(
            this.song.getXml()
        );


        this.ui.setSize(
            this.song.getSongSize()
        );
    }


    /*
     * SongPart ändern
     */

    changeSongPart(change) {

        this.song.setSongPart(
            change.songPart.bar,
            change.name,
            change.rhythmName,
            change.variation,
            change.rhythmId
        );


        this.refreshSongEditor();


        this.xmlEditor.setXml(
            this.song.getXml()
        );
    }


    /*
     * Neuen Chord hinzufügen
     */

    addElement(name) {

        this.song.addElement(name);


        this.refreshSongEditor();


        this.xmlEditor.setXml(
            this.song.getXml()
        );


        this.ui.setSize(
            this.song.getSongSize()
        );
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


            this.ui.setTempo(
                this.song.getTempo()
            );


            this.ui.setSize(
                this.song.getSongSize()
            );


            this.ui.onLoadFile(
                event => this.loadLocalFile(event)
            );


            this.ui.setSongName(
                result.song
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


            const xml =
                await this.xmlEditor
                    .readLocalFile(file);


            this.song.setXml(
                xml
            );


            this.refreshSongEditor();


            this.xmlEditor.setXml(
                xml
            );

            this.xmlEditor.setModified(
                true
            );


            this.ui.setTempo(
                this.song.getTempo()
            );


            this.ui.setSize(
                this.song.getSongSize()
            );


            this.ui.setSongName(
                file.name
            );


            this.ui.setPlayEnabled(
                false
            );


            this.ui.setStatus(
                `${file.name} geladen`
            );


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


            this.ui.setSongName(
                result.song
            );


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
                    type: "application/xml"
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

        link.download =
            "song.sng";


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

            this.ui.setStopEnabled(
                false
            );
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


        this.ui.setStatus(
            "Fehler: " + error.message
        );
    }
}
