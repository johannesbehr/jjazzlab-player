export class Note {

    static Accidental = Object.freeze({
        FLAT: "FLAT",
        SHARP: "SHARP"
    });

    static notesFlat = [
        "C",
        "Db",
        "D",
        "Eb",
        "E",
        "F",
        "Gb",
        "G",
        "Ab",
        "A",
        "Bb",
        "B"
    ];

    static notesSharp = [
        "C",
        "C#",
        "D",
        "D#",
        "E",
        "F",
        "F#",
        "G",
        "G#",
        "A",
        "A#",
        "B"
    ];

    constructor(value) {

        if (typeof value === "number") {

            this.pitch = value;
            this.accidental = Note.Accidental.FLAT;

            return;
        }

        if (typeof value !== "string") {

            throw new Error(
                "Invalid note: " + value
            );
        }

        const str = value.trim();

        if (str.length === 0) {

            throw new Error(
                "Invalid note: " + value
            );
        }

        let degree = str.substring(0, 1);

        if (
            str.length > 1 &&
            (
                str.charAt(1) === "b" ||
                str.charAt(1) === "#"
            )
        ) {

            degree = str.substring(0, 2);
        }

        let relativePitch = -1;
        let accidental =
            Note.Accidental.FLAT;

        /*
         * JJazzLab behandelt diese vier
         * Schreibweisen explizit.
         */

        if (degree.toLowerCase() === "cb") {

            relativePitch = 11;
            accidental =
                Note.Accidental.FLAT;

        } else if (
            degree.toLowerCase() === "b#"
        ) {

            relativePitch = 0;
            accidental =
                Note.Accidental.SHARP;

        } else if (
            degree.toLowerCase() === "e#"
        ) {

            relativePitch = 5;
            accidental =
                Note.Accidental.SHARP;

        } else if (
            degree.toLowerCase() === "fb"
        ) {

            relativePitch = 4;
            accidental =
                Note.Accidental.FLAT;

        } else {

            for (
                let i = 0;
                i < 12;
                i++
            ) {

                if (
                    degree.toLowerCase() ===
                    Note.notesFlat[i].toLowerCase()
                ) {

                    relativePitch = i;
                    accidental =
                        Note.Accidental.FLAT;

                    break;
                }

                if (
                    degree.toLowerCase() ===
                    Note.notesSharp[i].toLowerCase()
                ) {

                    relativePitch = i;
                    accidental =
                        Note.Accidental.SHARP;

                    break;
                }
            }
        }

        if (relativePitch === -1) {

            throw new Error(
                "Invalid note: " + value
            );
        }

        this.pitch = relativePitch;
        this.accidental = accidental;
    }

    getPitch() {

        return this.pitch;
    }

    getRelativePitch() {

        return this.pitch % 12;
    }

    getAccidental() {

        return this.accidental;
    }

    equalsRelativePitch(note) {

        return (
            this.getRelativePitch() ===
            note.getRelativePitch()
        );
    }

    toRelativeNoteString(accidental = this.accidental) {

        if (
            accidental ===
            Note.Accidental.SHARP
        ) {

            return Note.notesSharp[
                this.getRelativePitch()
            ];
        }

        return Note.notesFlat[
            this.getRelativePitch()
        ];
    }

    toString() {

        return this.toRelativeNoteString();
    }
}