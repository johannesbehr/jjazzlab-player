import { ChordTypeDatabase } from "../harmony/ChordTypeDatabase.js";
import { messageDefinition } from "../messageDefinition.js";

export class SongEditor {

    constructor(ui) {

        this.ui = ui;
        this.container = ui.songEditorContainer;
        this.tempoInput = ui.tempoInput;
        this.sizeInput = ui.sizeInput;
        this.songName = ui.songName;
        this.focusAfterRefresh = null;
        this.song = null;
        
        
        this.readOnlySongFields = null;
        this.newInputFields = null;
        this.currentField = null;
        
        /*
         * Rhythmus-Styles vom Server
         */
        this.rhythms = [];
        this.rhythmUrl = "/java/jjazzlab/api/rhythm";

    }

    setSong(song) {
        this.song = song;
    }

    refresh() {
        console.log("Refresh");
        
        this.setTimeline(this.song.getTimeline());
        this.songName.value = this.song.getName();
        this.sizeInput.value = this.song.getSongSize();
        this.tempoInput.value = this.song.getTempo();
        
        this.updateFocus();

    }

    updateFocus(){
        if(this.currentField){
            switch(this.currentField.type) {
            case "NewInputField":
                // Find next NewInputField
                const entry = this.newInputFields.find(f=>f.bar>this.currentField.bar);
                // If found, select it.
                if(entry){
                   entry.input.focus();
                   entry.input.select();
                } 
                break;
            }    
        }
        
        this.currentField = null;
    }

    focusChordAfterRefresh(position) {
        this.focusAfterRefresh = position;
    }

    async initialize() {

        await ChordTypeDatabase.initialize();
        await this.loadRhythms();

        this.songName.addEventListener("change", () => {
            this.setSongName(this.songName.value);
        });
        this.tempoInput.addEventListener("change", () => {
            this.setTempo(Number(this.tempoInput.value));
        });
        this.sizeInput.addEventListener("change", () => {
            this.setSize(Number(this.sizeInput.value));
        });

    }

    setTempo(tempo) {
        this.song.setTempo(tempo);
    }

    setSize(size) {
        try{
            this.song.setSongSize(size);
            this.refresh();
        }catch(error){
            this.ui.messageBox.show("Error", error.message )
                .then(() => {
                    this.sizeInput.value = this.song.getSongSize();
                    this.sizeInput.focus();
                    this.sizeInput.select();
                });
        }
    }

    setSongName(name) {
        this.song.setName(name);
    }

    setTimeline(timeline) {

        console.log("setTimeline...");

        this.container.innerHTML = "";

        let currentRow = null;

        this.readOnlySongFields = {};
        this.newInputFields = [];

        // Dict for all refernced input fields
        const baseCordFields = {};

        let rowIsReadonly = false;
        let currentChordLeadCheatBar = undefined;

        for (const item of timeline) {

            /*
             * Neuer SongPart = neuer Abschnitt
             */
            if (item.type === "songPart") {

                if (currentRow && !rowIsReadonly) {
                    this.addInputFieldToSongPartRow(currentRow, currentChordLeadCheatBar+1);
                }

                rowIsReadonly = false;
                
                currentRow = this.createSongPartRow(item);
                this.container.appendChild(currentRow);
                continue;
            }

            /*
             * Chord zum aktuellen Abschnitt
             */
            if (item.type === "chord" && currentRow) {
                if (item.readonly) rowIsReadonly = true;
                currentChordLeadCheatBar = item.chordBar;
                this.addChordToRow(currentRow, item, baseCordFields);
            }
        }

        /*
         * Eingabefeld für neuen Chord
         */
        this.renderNewChord(timeline);

        if (this.focusAfterRefresh !== null) {

            console.log("Setting Focus to: " + this.focusAfterRefresh);

            const position = this.focusAfterRefresh;
            this.focusAfterRefresh = null;

            const inputs = Array.from(this.container.querySelectorAll(".chord-input"));

            if (position >= 0 &&
                position < inputs.length) {

                inputs[position].focus();
                inputs[position].select();
            }
        }
    }

    addInputFieldToSongPartRow(row, bar) {
        const newInputContainer = document.createElement("div");
        newInputContainer.className = "chord-bar";
        //newInputContainer.dataset.bar = chord.bar;

        const label = document.createElement("span");
        label.className = "chord-bar-label";
        label.textContent = `|`;
        newInputContainer.appendChild(label);

        const inputFieldContainer = this.createNewInputField(bar);

        newInputContainer.appendChild(inputFieldContainer);
        row.chordRow.appendChild(newInputContainer);
    }

    createNewInputField(bar) {

        const chordContainer = document.createElement("div");
        chordContainer.className = "chord-container";

        /*
         * Chord-Eingabe
         */
        const input = document.createElement("input");

        input.type = "text";
        input.value = "";
        input.className = "chord-input";

        /*
         * Daten am Element speichern
         */
        input.dataset.bar = bar;
        //        input.dataset.songBar = chord.bar;
        //        input.dataset.position = chord.position;

        input.addEventListener("change", () => {
            // Handle changeChord local!
            const change = {
                type: "insertElement", bar: Number(input.dataset.bar), name: input.value, field: input
            }
            this.onInsertElement(change);
        });
        
        this.newInputFields.push({input:input, bar:bar});

        chordContainer.appendChild(input);

        return chordContainer;
    }

    onInsertElement(change) {
        // Name can be sp or a chord
        const name = change.name.trim();
        if(name != ""){
            const bar = change.bar; 

            
            this.song.insertElement(bar, name);
 
            this.currentField = {type:"NewInputField", bar:bar};
 
            this.refresh();
        }
    }

    addChordToRow(row, chord, baseCordFields, rowBarContainer) {

        /*
         * Prüfen, ob für diesen Takt bereits
         * ein Takt-Label existiert.
         */

        let barContainer = row.chordRow.querySelector(`[data-chord-bar="${chord.chordBar}"]`);
        //let barContainer = rowBarContainer[chord.bar];
        
        if (!barContainer) {

            barContainer = document.createElement("div");
            barContainer.className = "chord-bar";
            barContainer.dataset.bar = chord.bar;
            barContainer.dataset.chordBar = chord.chordBar;

            const label = document.createElement("span");

            label.className = "chord-bar-label";

            label.textContent = `|${chord.bar + 1}:`;

            barContainer.appendChild(label);

            row.chordRow.appendChild(barContainer);
        }

        /*
         * Akkord hinzufügen
         */
        const chordContainer = this.createChord(chord, baseCordFields);

        barContainer.appendChild(chordContainer);
    }

    createSongPartRow(songPart) {

        const row = document.createElement("div");

        row.className = "song-editor-row";

        /*
         * SongPart-Zeile
         */

        const songPartElement = this.createSongPart(songPart);

        row.appendChild(songPartElement);

        /*
         * Takt-/Chord-Zeile
         */

        const chordRow = document.createElement("div");

        chordRow.className = "song-editor-chords";

        row.appendChild(chordRow);

        /*
         * Referenz für addChordToRow()
         */

        row.chordRow = chordRow;

        return row;
    }

    renderBar(bar, items, baseCordFields) {

        const barContainer = document.createElement("div");
        barContainer.className = "chord-bar";

        /*
         * Takt-Nummer
         */
        const label = document.createElement("span");
        label.className = "chord-bar-label";
        label.textContent = `${bar + 1}:`;
        barContainer.appendChild(label);

        /*
         * SongParts
         *
         * Normalerweise gibt es hier
         * höchstens einen SongPart.
         */
        for (const item of items) {

            if (item.type !== "songPart") {
                continue;
            }

            const songPart = this.createSongPart(item);
            barContainer.appendChild(songPart);
        }

        /*
         * Chords
         */
        for (const item of items) {
            if (item.type !== "chord") {
                continue;
            }

            const chord = this.createChord(item, baseCordFields);
            barContainer.appendChild(chord);
        }

        this.container.appendChild(barContainer);
    }

    createSongPart(songPart) {

        const element = document.createElement("div");
        element.className = "song-part";

        /*
         * Gemeinsamer Change-Handler
         */
        const emitChange = () => {

            const change = {
                type: "songPart", songPart: songPart, name: nameInput.value, rhythmName: rhythmInput.dataset.rhythmName || "", rhythmId: rhythmInput.dataset.rhythmId || "", variation: variationSelect.value, timeSignature: rhythmInput.dataset.timeSignature || ""
            }
            this.changeSongPart(change);
        };

        /*
         * SongPart-Name
         */
        const nameInput = document.createElement("input");

        nameInput.type = "text";

        nameInput.value = songPart.name || "";

        nameInput.className = "song-part-name";

        nameInput.addEventListener("change", emitChange);

        element.appendChild(nameInput);

        /*
         * Rhythmus-Autocomplete
         */

        const rhythmAutocomplete = document.createElement("div");

        rhythmAutocomplete.className = "rhythm-autocomplete";

        const rhythmInput = document.createElement("input");

        rhythmInput.type = "text";

        const rhythm = this.rhythms.find(item => item.id.toLowerCase() === songPart.rhythmId.toLowerCase());

        if (rhythm) {
            rhythmInput.value = rhythm.label;
        } else {
            rhythmInput.value = songPart.rhythmName || "";
        }

        rhythmInput.className = "song-part-rhythm";

        rhythmInput.autocomplete = "off";

        rhythmInput.dataset.rhythmId = songPart.rhythmId || "";

        rhythmInput.dataset.rhythmName = songPart.rhythmName || "";

        rhythmInput.dataset.timeSignature = songPart.timeSignature || "";

        const suggestions = document.createElement("div");

        suggestions.className = "rhythm-suggestions";

        suggestions.style.display = "none";

        rhythmAutocomplete.appendChild(rhythmInput);

        rhythmAutocomplete.appendChild(suggestions);

        element.appendChild(rhythmAutocomplete);

        /*
         * Variation
         */

        const variationSelect = document.createElement("select");

        variationSelect.className = "song-part-variation";

        variationSelect.disabled = true;

        element.appendChild(variationSelect);

        /*
         * Rhythmus auswählen
         */

        const selectRhythm = async rhythm => {

            rhythmInput.value = rhythm.label;
            rhythmInput.dataset.rhythmId = rhythm.id;
            rhythmInput.dataset.rhythmName = rhythm.value;
            rhythmInput.dataset.timeSignature = rhythm.timeSignature;

            suggestions.innerHTML = "";

            suggestions.style.display = "none";

            /*
             * Variationen des neuen Rhythmus laden
             */

            await this.loadVariations(rhythm.id, variationSelect, songPart.variation || "");

            /*
             * Aktuellen Rhythmus im lokalen
             * SongPart-Objekt aktualisieren.
             */
            songPart.rhythmName = rhythm.label;
            songPart.rhythmId = rhythm.id;
            songPart.timeSignature = rhythm.timeSignature;
            songPart.variation = variationSelect.value;

            emitChange();
        };

        /*
         * Autocomplete
         */

        rhythmInput.addEventListener("input", () => {

            const search = rhythmInput.value
                .trim()
                .toLowerCase();

            suggestions.innerHTML = "";

            if (!search) {

                suggestions.style.display = "none";

                return;
            }

            const matches = this.rhythms.filter(rhythm =>
                    rhythm.label
                    .toLowerCase()
                    .includes(search));

            if (matches.length === 0) {

                suggestions.style.display = "none";

                return;
            }

            for (const rhythm
                of matches) {

                const item = document.createElement("div");

                item.className = "rhythm-suggestion";

                item.textContent = rhythm.label;

                item.addEventListener("mousedown", event => {

                    event.preventDefault();

                    selectRhythm(rhythm);
                });

                suggestions.appendChild(item);
            }

            suggestions.style.display = "block";
        });

        /*
         * Rhythmus-Feld verlassen.
         *
         * Prüfen, ob der eingegebene Name
         * zu einem bekannten Rhythmus gehört.
         */

        rhythmInput.addEventListener("change", async() => {

            const value = rhythmInput.value
                .trim();

            const rhythm = this.rhythms.find(item => item.label.toLowerCase() === value.toLowerCase());

            if (rhythm) {

                await selectRhythm(rhythm);

            } else {

                /*
                 * Kein gültiger Rhythmus.
                 */

                rhythmInput.dataset.rhythmId = "";

                emitChange();
            }
        });

        /*
         * Variation geändert
         */

        variationSelect.addEventListener("change", () => {

            songPart.variation = variationSelect.value;

            emitChange();
        });

        /*
         * Bereits vorhandene Variationen laden.
         */

        if (songPart.rhythmId) {

            this.loadVariations(songPart.rhythmId, variationSelect, songPart.variation || "");
        }

        return element;
    }

    createChord(chord, baseCordFields) {

        const chordContainer = document.createElement("div");
        chordContainer.className = "chord-container";

        /*
         * Position / Beat
         */
        const beat = document.createElement("span");
        beat.className = "chord-beat";
        beat.textContent = chord.position + 1;

        /*
         * Chord-Eingabe
         */
        const input = document.createElement("input");

        input.type = "text";
        input.value = chord.name || "";
        input.className = "chord-input";

        /*
         * Daten am Element speichern
         */
        input.dataset.bar = chord.chordBar;
        input.dataset.songBar = chord.bar;
        input.dataset.position = chord.position;
        input.dataset.otherFields = "";

        const cordSongPos = chord.bar + ":" + chord.position;
        const cordLeadSheetPos = chord.chordBar + ":" + chord.position;

        if (chord.readonly) {

            // Search base input and link
            const baseInput = baseCordFields[cordLeadSheetPos];
            if (baseInput) {
                if (baseInput.dataset.otherFields != "")
                    baseInput.dataset.otherFields += ";"
                    baseInput.dataset.otherFields += cordSongPos;
            }
            input.readOnly = true;
            input.classList.add("readonly");
            this.readOnlySongFields[cordSongPos] = input;
        } else {
            // Add to base inputs
            baseCordFields[cordLeadSheetPos] = input;
        }

        chordContainer.appendChild(beat);
        chordContainer.appendChild(input);

        /*
         * Änderung melden
         */

        let changeHandledByEnter = false;

        input.addEventListener("change", () => {

            /*
             * Wenn Enter die Änderung bereits
             * verarbeitet hat, nichts mehr tun.
             */

            if (changeHandledByEnter) {
                changeHandledByEnter = false;
                return;
            }

            // Handle changeChord local!
            const change = {
                type: "chord", bar: Number(input.dataset.bar), position: Number(input.dataset.position), name: input.value, field: input
            }

            this.changeChord(change);

            /*
            console.log("OnChange/change");

            this.onChanged({

            type:
            "chord", 
            bar:
            Number( input.dataset.bar
            ), 
            position:
            Number( input.dataset.position
            ), 
            name:
            input.value
            });*/
        });

        /*
         * Enter = Änderung übernehmen und
         * zum nächsten Chord springen
         */

        input.addEventListener("keydown", event => {

            if (event.key !== "Enter") {
                return;
            }

            event.preventDefault();

            /*
             * Alle Chord-Eingabefelder ermitteln.
             */

            const inputs = Array.from(this.container.querySelectorAll(".chord-input"));

            const index = inputs.indexOf(input);

            /*
             * Nächstes vorhandenes Eingabefeld
             */

            if (index >= 0 &&
                index < inputs.length - 1) {

                let position = index + 1;
                if (position < inputs.length) {
                    inputs[position].focus();
                    inputs[position].select();
                }

                //this.focusAfterRefresh = index + 1;
                //console.log( "focusAfterRefresh:", this.focusAfterRefresh);

                return;
            }

            /*
             * Änderung über Enter verarbeiten.
             */

            if (this.onChanged) {

                changeHandledByEnter = true;

                console.log("OnChange/Enter");

                this.onChanged({

                    type:
                    "chord", 
                    bar:
                    Number(input.dataset.bar), 
                    position:
                    Number(input.dataset.position), 
                    name:
                    input.value
                });
            }

            /*
             * Letzter vorhandener Chord:
             * neuen Chord hinzufügen.
             */

            const name = input.value.trim();

            if (!name) {
                return;
            }

            this.addElement(name);
        });

        return chordContainer;
    }

    /*
     * Eingabe für neuen Chord
     */
    renderNewChord(timeline) {
        let lastBar = 0;
        if (timeline.length > 0) {
            lastBar = Math.max(...timeline.map(item => item.bar));
        }
        const newBar = document.createElement("div");
        newBar.className = "chord-bar";
        const label = document.createElement("span");
        label.className = "chord-bar-label";
        label.textContent = `${lastBar + 2}:`;
        newBar.appendChild(label);
        const input = document.createElement("input");
        input.type = "text";
        input.value = "";
        input.className = "chord-input chord-new-input";
        newBar.appendChild(input);
        this.container.appendChild(newBar);

        /*
         * Neuen Chord hinzufügen
         */
        input.addEventListener("change", () => {
            const name = input.value.trim();
            if (!name) {
                return;
            }
            this.addElement(name);
        });
    }

    /*
     * Rhythmus-Styles laden
     */

    async loadRhythms() {
        try {
            const response = await fetch(this.rhythmUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            this.rhythms = await response.json();
            console.log(`Rhythms geladen: ${this.rhythms.length}`);
        } catch (error) {
            console.error("Rhythms konnten nicht geladen werden:", error);
            this.rhythms = [];
        }
    }

    async loadVariations(rhythmId, select, selectedVariation = "") {
        select.innerHTML = "";
        if (!rhythmId) {
            select.disabled = true;
            return;
        }

        try {
            const response = await fetch(`${this.rhythmUrl}/${encodeURIComponent(rhythmId)}/variations`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            const variations = await response.json();

            /*
             * Keine Variationen vorhanden
             */

            if (!Array.isArray(variations) || variations.length === 0) {
                select.disabled = true;
                return;
            }

            /*
             * Optionen erzeugen
             */
            for (const variation of variations) {
                const option = document.createElement("option");
                option.value = variation;
                option.textContent = variation;
                select.appendChild(option);
            }

            /*
             * Bisherige Variation
             * beibehalten, wenn vorhanden.
             */
            if (variations.includes(selectedVariation)) {
                select.value = selectedVariation;
            } else {
                /*
                 * Sonst erste Variation wählen.
                 */
                select.value = variations[0];
            }
            select.disabled = false;
        } catch (error) {
            console.error("SongEditor: Variationen konnten nicht geladen werden:", error);
            select.disabled = true;
        }
    }

    /*
     * Rhythmus-Autocomplete
     */

    createRhythmInput(value) {
        const container = document.createElement("div");
        container.className = "rhythm-autocomplete";
        const input = document.createElement("input");
        input.type = "text";
        input.value = value || "";
        input.className = "song-part-rhythm";
        input.autocomplete = "off";
        const suggestions = document.createElement("div");
        suggestions.className = "rhythm-suggestions";
        suggestions.style.display = "none";
        container.appendChild(input);
        container.appendChild(suggestions);

        /*
         * Vorschläge aktualisieren
         */

        const updateSuggestions = () => {
            const search = input.value.trim().toLowerCase();
            suggestions.innerHTML = "";
            if (!search) {
                suggestions.style.display = "none";
                return;
            }
            const matches = this.rhythms.filter(rhythm => rhythm.label.toLowerCase().includes(search)).slice(0, 30);
            if (matches.length === 0) {
                suggestions.style.display = "none";
                return;
            }

            for (const rhythm of matches) {

                const item = document.createElement("div");

                item.className = "rhythm-suggestion";

                item.textContent = rhythm.label;

                item.addEventListener("mousedown", event => {
                    event.preventDefault();
                    input.value = rhythm.value;
                    suggestions.style.display = "none";
                    input.dispatchEvent(new Event("change", {
                            bubbles: true
                        }));
                });
                suggestions.appendChild(item);
            }
            suggestions.style.display = "block";
        };

        input.addEventListener("input", updateSuggestions);

        input.addEventListener("focus", () => {
            if (input.value.trim()) {
                updateSuggestions();
            }
        });

        input.addEventListener("blur", () => {
            setTimeout(() => {
                suggestions.style.display = "none";
            }, 150);
        });

        return {

            container:
            container, 
            input:
            input
        };
    }

    addElement(name) {
        try{
            console.log("addElement");
            this.song.addElement(name);
            this.refresh();
            this.focusLastNewChordInput();
        }catch(ex){
            this.focusLastNewChordInput();
            this.ui.messageBox.show(messageDefinition.INVALID_CHORD_INPUT)
                .then(() => {this.focusLastNewChordInput();});
        }
    }

    /* Methode zum Fokussieren
     *
     */
    focusChordInput(position) {

        const inputs = Array.from(this.container.querySelectorAll(".chord-input"));

        if (position >= 0 &&
            position < inputs.length) {

            inputs[position].focus();
            inputs[position].select();
        }
    }

    /* Methode zum Fokussieren
     *
     */
    focusLastNewChordInput() {

        const input = this.container.querySelector(".chord-new-input");

        if (input) {
            input.focus();
            input.select();
        }
    }

    /*
     * Chord ändern
     */
    changeChord(change) {

        console.log("changeChord");
        let structureChanged = false;

        if (change.name.trim() === "") {
            try{
                this.song.removeChord(change.bar, change.position);
                structureChanged = true;
            }
            catch (error) {
                console.log(error);
                this.ui.messageBox.show("Error", error.message).then(() => {this.refresh()});
            }
        } else if (change.name.startsWith(">")||change.name.endsWith(">")){
            this.song.moveChord(change.bar,change.position,1);
            structureChanged = true;
        } else if (change.name.startsWith("<")||change.name.endsWith("<")){
            this.song.moveChord(change.bar,change.position,-1);
            structureChanged = true;
        } else if (change.name.includes(" ")) {
            this.song.splitChord(change.bar,change.position,change.name);
            structureChanged = true;
        } else {
            try {
                const newChord = this.song.setChord(change.bar, change.position, change.name);
                
                // Handle the change without rebuilding (keep it fast)
                if (change.field) {
                    change.field.value = newChord;
                }

                // Check if there are some linked songParts that should also change
                if (change.field.dataset.otherFields) {
                    const others = change.field.dataset.otherFields.split(";");
                    for (const other of others) {
                        const otherField = this.readOnlySongFields[other];
                        if (otherField) {
                            otherField.value = newChord;
                        }
                    }
                }
            } catch (error) {
                console.log(error);
                this.focusLastNewChordInput();
                this.ui.messageBox.show(messageDefinition.INVALID_CHORD_INPUT)
                .then(() => {
                        if (change.field) {
                            change.field.value = newChord;
                            change.field.focus();
                            change.field.select();
                        }
                    });
                
            }

        }

        if (structureChanged) {
            this.refresh();
        }

        // ToDo: Notify about changed xml, might be unneccessary...
        //        this.xmlEditor.setXml( //            this.song.getXml()
        //        );

        // ToDo: SongEditor should get hold about the size field as well!
        //        this.ui.setSize( //            this.song.getSongSize()
        //        );
    }

    /*
     * SongPart ändern
     */

    changeSongPart(change) {
        console.log("changeSongPart");
        try{
            this.song.setSongPart(change.songPart.bar, change.name, change.rhythmName, change.variation, change.rhythmId, change.timeSignature);
            this.refresh();
        }catch(error){
            console.log(error);
            this.ui.messageBox.show("Error", error.message).then(() => {this.refresh()});
        }
    }

}
