export class SongPartEditor {

    constructor(
        container,
        toggleButton
    ) {

        this.container =
            container;

        this.toggleButton =
            toggleButton;

        this.onChanged =
            null;

        // Rhythmus-Styles vom Server
        this.rhythms = [];

        this.rhythmUrl =
            "/java/jjazzlab/api/rhythm";
    }


    async loadRhythms() {

        try {

            const response =
                await fetch(this.rhythmUrl);

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

        } catch (error) {

            console.error(
                "Rhythms konnten nicht geladen werden:",
                error
            );

            this.rhythms = [];
        }
    }


    setSongParts(songParts) {

        this.container.innerHTML = "";


        for (const songPart of songParts) {

            const element =
                document.createElement("div");

            element.className =
                "song-part";


            // Name

            const nameInput =
                document.createElement("input");

            nameInput.type = "text";
            nameInput.value = songPart.name;

            nameInput.className =
                "song-part-name";

            nameInput.dataset.index =
                songParts.indexOf(songPart);


            // Bereich

            const range =
                document.createElement("span");

            range.className =
                "song-part-range";

            range.textContent =
                `Takt ${songPart.startBar + 1}–${
                    songPart.startBar +
                    songPart.numberOfBars
                }`;


            // Rhythmus

            const rhythmInput =
                this.createRhythmInput(
                    songPart.rhythmName
                );

            rhythmInput.input.dataset.index =
                songParts.indexOf(songPart);


            // Variation

            const variationInput =
                document.createElement("input");

            variationInput.type = "text";

            variationInput.value =
                songPart.variation;

            variationInput.className =
                "song-part-variation";

            variationInput.dataset.index =
                songParts.indexOf(songPart);


            element.appendChild(
                nameInput
            );

            element.appendChild(
                range
            );

            element.appendChild(
                rhythmInput.container
            );

            element.appendChild(
                variationInput
            );


            this.container.appendChild(
                element
            );


            // Änderungen melden

            nameInput.addEventListener(
                "change",
                () => this.fireChange(
                    songPart,
                    nameInput.value,
                    rhythmInput.input.value,
                    variationInput.value
                )
            );


            rhythmInput.input.addEventListener(
                "change",
                () => this.fireChange(
                    songPart,
                    nameInput.value,
                    rhythmInput.input.value,
                    variationInput.value
                )
            );


            variationInput.addEventListener(
                "change",
                () => this.fireChange(
                    songPart,
                    nameInput.value,
                    rhythmInput.input.value,
                    variationInput.value
                )
            );
        }
    }


    createRhythmInput(value) {

        const container =
            document.createElement("div");

        container.className =
            "rhythm-autocomplete";


        const input =
            document.createElement("input");

        input.type = "text";

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
                        .slice(0, 30);


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

                // Kleine Verzögerung, damit
                // mousedown auf einen Eintrag
                // noch ausgeführt werden kann.

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
            container: container,
            input: input
        };
    }


    fireChange(
        songPart,
        name,
        rhythmName,
        variation
    ) {

        if (!this.onChanged) {
            return;
        }


        this.onChanged({

            songPart: songPart,

            name: name,

            rhythmName: rhythmName,

            variation: variation
        });
    }


    show() {

        this.container.removeAttribute("style");

        this.toggleButton.textContent =
            "SongParts ausblenden";
    }


    hide() {

        this.container.style.display =
            "none";

        this.toggleButton.textContent =
            "SongParts";
    }


    toggle() {

        const visible =
            this.container.style.display !==
            "none";

        if (visible) {
            this.hide();
        } else {
            this.show();
        }
    }


    onChange(callback) {

        this.onChanged =
            callback;
    }


    async initialize() {

        this.toggleButton.addEventListener(
            "click",
            () => this.toggle()
        );


        await this.loadRhythms();
    }
}
