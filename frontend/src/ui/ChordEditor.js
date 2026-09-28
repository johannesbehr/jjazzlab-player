export class ChordEditor {

    constructor(
        container,
        toggleButton,
    ) {

        this.container = container;
        this.toggleButton = toggleButton;
        this.onChanged = null;
        this.onAdd = null;
    }

   setChords(chords) {

        this.container.innerHTML = "";

        const bars = new Map();

        for (const chord of chords) {
            if (!bars.has(chord.bar)) {
                bars.set(chord.bar, []);
            }
            bars.get(chord.bar).push(chord);
        }


        let lastbar = 0;
        for (const [bar, barChords] of bars) {

            lastbar = bar + 1 ;
            const barContainer = document.createElement("div");
            barContainer.className = "chord-bar";

            const label = document.createElement("span");
            label.className = "chord-bar-label";
            label.textContent = `${bar + 1}:`;

            barContainer.appendChild(label);

            for (const chord of barChords) {
                
                const chordContainer = document.createElement("div");
                chordContainer.className = "chord-container";

                const beat = document.createElement("span");
                beat.className = "chord-beat";
                beat.textContent = chord.position + 1;

                const input = document.createElement("input");
                input.type = "text";
                input.value = chord.name;
                input.className = "chord-input";
                input.dataset.bar = chord.bar;
                input.dataset.position = chord.position;
                input.addEventListener(
                    "change",
                    () => {

                        if (this.onChanged) {

                            this.onChanged({
                                bar: Number(input.dataset.bar),
                                position: Number(input.dataset.position),
                                name: input.value
                            });
                        }
                    }
                );

                chordContainer.appendChild(beat);
                chordContainer.appendChild(input);

                barContainer.appendChild(
                    chordContainer
                );
            }

            this.container.appendChild(
                barContainer
            );
            
        }
        
        // Leeres Eingabefeld für einen neuen Takt
        const newBar = document.createElement("div");

        newBar.className = "chord-bar";
        const newBarLabel = document.createElement("span");
        newBarLabel.className = "chord-bar-label";
        newBarLabel.textContent = `${lastbar + 1}:`;

        newBar.appendChild( newBarLabel );
        const newInput = document.createElement("input");

        newInput.type = "text";
        newInput.value = "";

        newInput.className = "chord-input chord-new-input";

        newBar.appendChild( newInput );

        this.container.appendChild(newBar);

        newInput.addEventListener( "change",
            () => {
                const name =
                    newInput.value.trim();

                if (!name) {
                    return;
                }

                if (this.onAdd) {
                    this.onAdd(name);
                }
            }
        );
    }

    show() {

        this.container.removeAttribute("style");

        this.toggleButton.textContent =
            "Chords ausblenden";
    }


    hide() {

        this.container.style.display =
            "none";

        this.toggleButton.textContent =
            "Chords";
    }


    toggle() {
        const visible =
            this.container.style.display !== "none";
    
        console.log("Toogle:" + visible);
    
        if (visible) {
            this.hide();
        } else {
            this.show();
        }
    }

    onChange(callback) {
        this.onChanged = callback;
    }
    
    onAddElement(callback) {
        this.onAdd = callback;
    }

    initialize() {
        
        this.toggleButton.addEventListener(
            "click",
            () => this.toggle()
        );
    }
}