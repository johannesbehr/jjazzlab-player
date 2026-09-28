export class SongEditor {

    constructor(container) {

        this.container =
            container;

        this.onChanged =
            null;

        this.onAdd =
            null;

        /*
         * Rhythmus-Styles vom Server
         */

        this.rhythms = [];

        this.rhythmUrl =
            "/java/jjazzlab/api/rhythm";
    }


    /*
     * Initialisierung
     */

    async initialize() {

        await this.loadRhythms();
    }


    /*
     * Timeline darstellen
     */
    setTimeline(timeline) {

        this.container.innerHTML = "";

        let currentRow = null;

        for (const item of timeline) {

            /*
             * Neuer SongPart = neuer Abschnitt
             */

            if (item.type === "songPart") {

                currentRow =
                    this.createSongPartRow(
                        item
                    );

                this.container.appendChild(
                    currentRow
                );

                continue;
            }

            /*
             * Chord zum aktuellen Abschnitt
             */

            if (
                item.type === "chord" &&
                currentRow
            ) {

                this.addChordToRow(
                    currentRow,
                    item
                );
            }
        }
        
          /*
     * Eingabefeld für neuen Chord
     */

    this.renderNewChord(
        timeline
    );
}
    
    addChordToRow(row, chord) {

        /*
         * Prüfen, ob für diesen Takt bereits
         * ein Takt-Label existiert.
         */

        let barContainer =
            row.chordRow.querySelector(
                `[data-bar="${chord.bar}"]`
            );

        if (!barContainer) {

            barContainer =
                document.createElement("div");

            barContainer.className =
                "chord-bar";

            barContainer.dataset.bar =
                chord.bar;


            const label =
                document.createElement("span");

            label.className =
                "chord-bar-label";

            label.textContent =
                `|${chord.bar + 1}:`;

            barContainer.appendChild(
                label
            );

            row.chordRow.appendChild(
                barContainer
            );
        }


        /*
         * Akkord hinzufügen
         */

        const chordContainer =
            this.createChord(
                chord
            );

        barContainer.appendChild(
            chordContainer
        );
    }
    
    createSongPartRow(songPart) {

        const row =
            document.createElement("div");

        row.className =
            "song-editor-row";


        /*
         * SongPart-Zeile
         */

        const songPartElement =
            this.createSongPart(
                songPart
            );

        row.appendChild(
            songPartElement
        );


        /*
         * Takt-/Chord-Zeile
         */

        const chordRow =
            document.createElement("div");

        chordRow.className =
            "song-editor-chords";

        row.appendChild(
            chordRow
        );


        /*
         * Referenz für addChordToRow()
         */

        row.chordRow =
            chordRow;

        return row;
    }

    /*
     * Einen Takt darstellen
     */

    renderBar(bar, items) {

        const barContainer =
            document.createElement("div");

        barContainer.className =
            "chord-bar";


        /*
         * Takt-Nummer
         */

        const label =
            document.createElement("span");

        label.className =
            "chord-bar-label";

        label.textContent =
            `${bar + 1}:`;


        barContainer.appendChild(
            label
        );


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

            const songPart =
                this.createSongPart(
                    item
                );

            barContainer.appendChild(
                songPart
            );
        }


        /*
         * Chords
         */

        for (const item of items) {

            if (item.type !== "chord") {
                continue;
            }

            const chord =
                this.createChord(
                    item
                );

            barContainer.appendChild(
                chord
            );
        }


        this.container.appendChild(
            barContainer
        );
    }


    /*
     * SongPart erzeugen
     */
/*
    createSongPart(songPart) {

        const element =
            document.createElement("div");

        element.className =
            "song-part";


        //Name
        const nameInput =
            document.createElement("input");

        nameInput.type =
            "text";

        nameInput.value =
            songPart.name || "";

        nameInput.className =
            "song-part-name";


        //Bereich
        const range =
            document.createElement("span");

        range.className =
            "song-part-range";

        range.textContent =
            `Takt ${songPart.bar + 1}–${
                songPart.bar +
                songPart.numberOfBars
            }`;


        //Rhythmus
        const rhythmInput =
            this.createRhythmInput(
                songPart.rhythmName
            );


        // Variation

        const variationInput =
            document.createElement("input");

        variationInput.type =
            "text";

        variationInput.value =
            songPart.variation || "";

        variationInput.className =
            "song-part-variation";


        // Zusammensetzen
        element.appendChild(
            nameInput
        );

        //element.appendChild(
        //    range
        //);

        element.appendChild(
            rhythmInput.container
        );

        element.appendChild(
            variationInput
        );


        //Änderung melden
        const fireChange =
            () => {

                if (!this.onChanged) {
                    return;
                }


                this.onChanged({

                    type:
                        "songPart",

                    songPart:
                        songPart,

                    name:
                        nameInput.value,

                    rhythmName:
                        rhythmInput.input.value,

                    variation:
                        variationInput.value
                });
            };


        nameInput.addEventListener(
            "change",
            fireChange
        );


        rhythmInput.input.addEventListener(
            "change",
            fireChange
        );


        variationInput.addEventListener(
            "change",
            fireChange
        );


        return element;
    }
*/
createSongPart(songPart) {

    const element =
        document.createElement("div");

    element.className =
        "song-part";


    /*
     * Gemeinsamer Change-Handler
     */

    const emitChange =
        () => {

            if (!this.onChanged) {
                return;
            }

            this.onChanged({

                type:
                    "songPart",

                songPart:
                    songPart,

                name:
                    nameInput.value,

                rhythmName:
                    rhythmInput.value,

                rhythmId:
                    rhythmInput.dataset.rhythmId || "",

                variation:
                    variationSelect.value
            });
        };


    /*
     * SongPart-Name
     */

    const nameInput =
        document.createElement("input");

    nameInput.type =
        "text";

    nameInput.value =
        songPart.name || "";

    nameInput.className =
        "song-part-name";

    nameInput.addEventListener(
        "change",
        emitChange
    );

    element.appendChild(
        nameInput
    );


    /*
     * Rhythmus-Autocomplete
     */

    const rhythmAutocomplete =
        document.createElement("div");

    rhythmAutocomplete.className =
        "rhythm-autocomplete";


    const rhythmInput =
        document.createElement("input");

    rhythmInput.type =
        "text";

    rhythmInput.value =
        songPart.rhythmName || "";

    rhythmInput.className =
        "song-part-rhythm";

    rhythmInput.autocomplete =
        "off";

    rhythmInput.dataset.rhythmId =
        songPart.rhythmId || "";


    const suggestions =
        document.createElement("div");

    suggestions.className =
        "rhythm-suggestions";

    suggestions.style.display =
        "none";


    rhythmAutocomplete.appendChild(
        rhythmInput
    );

    rhythmAutocomplete.appendChild(
        suggestions
    );

    element.appendChild(
        rhythmAutocomplete
    );


    /*
     * Variation
     */

    const variationSelect =
        document.createElement("select");

    variationSelect.className =
        "song-part-variation";

    variationSelect.disabled =
        true;

    element.appendChild(
        variationSelect
    );


    /*
     * Rhythmus auswählen
     */

    const selectRhythm =
        async rhythm => {

            rhythmInput.value =
                rhythm.label;

            rhythmInput.dataset.rhythmId =
                rhythm.id;

            suggestions.innerHTML =
                "";

            suggestions.style.display =
                "none";


            /*
             * Variationen des neuen Rhythmus laden
             */

            await this.loadVariations(
                rhythm.id,
                variationSelect,
                songPart.variation || ""
            );


            /*
             * Aktuellen Rhythmus im lokalen
             * SongPart-Objekt aktualisieren.
             */

            songPart.rhythmName =
                rhythm.label;

            songPart.rhythmId =
                rhythm.id;

            songPart.variation =
                variationSelect.value;


            emitChange();
        };


    /*
     * Autocomplete
     */

    rhythmInput.addEventListener(
        "input",
        () => {

            const search =
                rhythmInput.value
                    .trim()
                    .toLowerCase();

            suggestions.innerHTML =
                "";

            if (!search) {

                suggestions.style.display =
                    "none";

                return;
            }


            const matches =
                this.rhythms.filter(
                    rhythm =>
                        rhythm.label
                            .toLowerCase()
                            .includes(search)
                );


            if (
                matches.length === 0
            ) {

                suggestions.style.display =
                    "none";

                return;
            }


            for (
                const rhythm
                of matches
            ) {

                const item =
                    document.createElement(
                        "div"
                    );

                item.className =
                    "rhythm-suggestion";

                item.textContent =
                    rhythm.label;


                item.addEventListener(
                    "mousedown",
                    event => {

                        event.preventDefault();

                        selectRhythm(
                            rhythm
                        );
                    }
                );

                suggestions.appendChild(
                    item
                );
            }


            suggestions.style.display =
                "block";
        }
    );


    /*
     * Rhythmus-Feld verlassen.
     *
     * Prüfen, ob der eingegebene Name
     * zu einem bekannten Rhythmus gehört.
     */

    rhythmInput.addEventListener(
        "change",
        async () => {

            const value =
                rhythmInput.value
                    .trim();

            const rhythm =
                this.rhythms.find(
                    item =>
                        item.label === value
                );

            if (rhythm) {

                await selectRhythm(
                    rhythm
                );

            } else {

                /*
                 * Kein gültiger Rhythmus.
                 */

                rhythmInput.dataset.rhythmId =
                    "";

                emitChange();
            }
        }
    );


    /*
     * Variation geändert
     */

    variationSelect.addEventListener(
        "change",
        () => {

            songPart.variation =
                variationSelect.value;

            emitChange();
        }
    );


    /*
     * Bereits vorhandene Variationen laden.
     */

    if (
        songPart.rhythmId
    ) {

        this.loadVariations(
            songPart.rhythmId,
            variationSelect,
            songPart.variation || ""
        );
    }

    return element;
}

    /*
     * Chord erzeugen
     */

    createChord(chord) {

        const chordContainer =
            document.createElement("div");

        chordContainer.className =
            "chord-container";


        /*
         * Position / Beat
         */

        const beat =
            document.createElement("span");

        beat.className =
            "chord-beat";

        beat.textContent =
            chord.position + 1;


        /*
         * Chord-Eingabe
         */

        const input =
            document.createElement("input");

        input.type =
            "text";

        input.value =
            chord.name || "";

        input.className =
            "chord-input";


        /*
         * Daten am Element speichern
         */

        input.dataset.bar =
            chord.bar;

        input.dataset.position =
            chord.position;


        chordContainer.appendChild(
            beat
        );

        chordContainer.appendChild(
            input
        );


        /*
         * Änderung melden
         */

        input.addEventListener(
            "change",
            () => {

                if (!this.onChanged) {
                    return;
                }


                this.onChanged({

                    type:
                        "chord",

                    bar:
                        Number(
                            input.dataset.bar
                        ),

                    position:
                        Number(
                            input.dataset.position
                        ),

                    name:
                        input.value
                });
            }
        );


        return chordContainer;
    }


    /*
     * Eingabe für neuen Chord
     */

    renderNewChord(timeline) {

        let lastBar = 0;


        if (timeline.length > 0) {

            lastBar =
                Math.max(
                    ...timeline.map(
                        item => item.bar
                    )
                );
        }


        const newBar =
            document.createElement("div");

        newBar.className =
            "chord-bar";


        const label =
            document.createElement("span");

        label.className =
            "chord-bar-label";

        label.textContent =
            `${lastBar + 2}:`;


        newBar.appendChild(
            label
        );


        const input =
            document.createElement("input");

        input.type =
            "text";

        input.value =
            "";

        input.className =
            "chord-input chord-new-input";


        newBar.appendChild(
            input
        );


        this.container.appendChild(
            newBar
        );


        /*
         * Neuen Chord hinzufügen
         */

        input.addEventListener(
            "change",
            () => {

                const name =
                    input.value.trim();

                if (!name) {
                    return;
                }


                if (this.onAdd) {
                    this.onAdd(name);
                }
            }
        );
    }


    /*
     * Rhythmus-Styles laden
     */

    async loadRhythms() {

        try {

            const response =
                await fetch(
                    this.rhythmUrl
                );


            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }


            this.rhythms =
                await response.json();


            console.log(
                `Rhythms geladen: ${this.rhythms.length}`
            );

        }

        catch (error) {

            console.error(
                "Rhythms konnten nicht geladen werden:",
                error
            );

            this.rhythms = [];
        }
    }

    async loadVariations(
        rhythmId,
        select,
        selectedVariation = ""
    ) {

        select.innerHTML = "";

        if (!rhythmId) {

            select.disabled = true;

            return;
        }


        try {

            const response =
                await fetch(
                    `${this.rhythmUrl}/${encodeURIComponent(rhythmId)}/variations`
                );

            if (!response.ok) {

                throw new Error(
                    `HTTP ${response.status}`
                );
            }

            const variations =
                await response.json();


            /*
             * Keine Variationen vorhanden
             */

            if (
                !Array.isArray(variations) ||
                variations.length === 0
            ) {

                select.disabled = true;

                return;
            }


            /*
             * Optionen erzeugen
             */

            for (
                const variation
                of variations
            ) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    variation;

                option.textContent =
                    variation;

                select.appendChild(
                    option
                );
            }


            /*
             * Bisherige Variation
             * beibehalten, wenn vorhanden.
             */

            if (
                variations.includes(
                    selectedVariation
                )
            ) {

                select.value =
                    selectedVariation;

            } else {

                /*
                 * Sonst erste Variation wählen.
                 */

                select.value =
                    variations[0];
            }

            select.disabled = false;

        } catch (error) {

            console.error(
                "SongEditor: Variationen konnten nicht geladen werden:",
                error
            );

            select.disabled = true;
        }
    }

    /*
     * Rhythmus-Autocomplete
     */

    createRhythmInput(value) {

        const container =
            document.createElement("div");

        container.className =
            "rhythm-autocomplete";


        const input =
            document.createElement("input");

        input.type =
            "text";

        input.value =
            value || "";

        input.className =
            "song-part-rhythm";

        input.autocomplete =
            "off";


        const suggestions =
            document.createElement("div");

        suggestions.className =
            "rhythm-suggestions";

        suggestions.style.display =
            "none";


        container.appendChild(
            input
        );

        container.appendChild(
            suggestions
        );


        /*
         * Vorschläge aktualisieren
         */

        const updateSuggestions =
            () => {

                const search =
                    input.value
                        .trim()
                        .toLowerCase();


                suggestions.innerHTML =
                    "";


                if (!search) {

                    suggestions.style.display =
                        "none";

                    return;
                }


                const matches =
                    this.rhythms
                        .filter(
                            rhythm =>
                                rhythm.label
                                    .toLowerCase()
                                    .includes(search)
                        )
                        .slice(
                            0,
                            30
                        );


                if (matches.length === 0) {

                    suggestions.style.display =
                        "none";

                    return;
                }


                for (const rhythm of matches) {

                    const item =
                        document.createElement("div");

                    item.className =
                        "rhythm-suggestion";

                    item.textContent =
                        rhythm.label;


                    item.addEventListener(
                        "mousedown",
                        event => {

                            event.preventDefault();


                            input.value =
                                rhythm.value;


                            suggestions.style.display =
                                "none";


                            input.dispatchEvent(
                                new Event(
                                    "change",
                                    {
                                        bubbles: true
                                    }
                                )
                            );
                        }
                    );


                    suggestions.appendChild(
                        item
                    );
                }


                suggestions.style.display =
                    "block";
            };


        input.addEventListener(
            "input",
            updateSuggestions
        );


        input.addEventListener(
            "focus",
            () => {

                if (input.value.trim()) {
                    updateSuggestions();
                }
            }
        );


        input.addEventListener(
            "blur",
            () => {

                setTimeout(
                    () => {

                        suggestions.style.display =
                            "none";

                    },
                    150
                );
            }
        );


        return {

            container:
                container,

            input:
                input
        };
    }


    /*
     * Änderungen melden
     */

    onChange(callback) {

        this.onChanged =
            callback;
    }


    /*
     * Neues Element (Chord oder Songpart)  melden
     */
    onAddElement(callback) {
        this.onAdd = callback;
    }
}
