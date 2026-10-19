import { Note } from "./Note.js";
import { ChordTypeDatabase } from "./ChordTypeDatabase.js";


export class ChordSymbol {

        constructor(
            str,
            chordTypeDatabase
        ) {

        if (typeof str !== "string") {
            throw new Error(
                "Chord symbol must be a string"
            );
        }

        str = str.trim();

        if (!str) {
            throw new Error(
                "Invalid chord symbol: blank"
            );
        }

        /*
         * JJazzLab normalisiert ungewöhnliche
         * Schreibweisen der Grundtöne.
         */
        str = str
            .replace(/[Cc]b/g, "B")
            .replace(/[Bb]#/g, "C")
            .replace(/[Ee]#/g, "F")
            .replace(/[Ff]b/g, "E");

        /*
         * Slash-Bass suchen.
         */
        const slashIndex =
            str.lastIndexOf("/");

        /*
         * Originalnamen erzeugen.
         * Der erste Buchstabe wird groß
         * geschrieben.
         */
        if (slashIndex !== -1) {

            const bass =
                str.substring(slashIndex + 1);

            if (
                !bass ||
                bass.length > 2 ||
                (
                    bass.length === 2 &&
                    bass[1] !== "b" &&
                    bass[1] !== "#"
                )
            ) {
                throw new Error(
                    "Invalid bass note: " + str
                );
            }

            this.originalName =
                str.substring(0, 1).toUpperCase() +
                str.substring(1, slashIndex) +
                "/" +
                bass.substring(0, 1).toUpperCase() +
                bass.substring(1);

        } else {

            this.originalName =
                str.substring(0, 1).toUpperCase() +
                str.substring(1);
        }


        /*
         * Arbeitskopie ohne Bass.
         */
        let chordPart =
            this.originalName;

        let bassNote = null;

        if (slashIndex !== -1) {

            const bassString =
                this.originalName.substring(
                    slashIndex + 1
                );

            try {

                bassNote =
                    new Note(bassString);

            } catch (error) {

                throw new Error(
                    "Invalid bass note: " +
                    this.originalName
                );
            }

            chordPart =
                this.originalName.substring(
                    0,
                    slashIndex
                );
        }


        /*
         * Grundton erkennen.
         */
        let rootString =
            chordPart.substring(0, 2);

        if (
            rootString.length < 2 ||
            (
                rootString[1] !== "b" &&
                rootString[1] !== "#"
            )
        ) {
            rootString =
                chordPart.substring(0, 1);
        }

        let rootNote;

        try {

            rootNote =
                new Note(rootString);

        } catch (error) {

            throw new Error(
                "Invalid root note: " +
                this.originalName
            );
        }


        /*
         * Den Grundton aus dem Chordsymbol
         * entfernen.
         */
        let typeName =
            chordPart.substring(
                rootString.length
            );


        /*
         * Kein separater Bass bedeutet:
         * Bass = Grundton.
         */
        if (
            bassNote === null ||
            bassNote.getRelativePitch() ===
                rootNote.getRelativePitch()
        ) {
            bassNote = rootNote;
        }


        /*
         * ChordType anhand des Namens oder
         * eines JJazzLab-Alias suchen.
         */
        if (!chordTypeDatabase) {

            throw new Error(
                "ChordTypeDatabase required"
            );
        }


        const chordType =
            chordTypeDatabase
                .getChordType(typeName);

        if (!chordType) {

            throw new Error(
                "Unknown chord type: " +
                typeName
            );
        }


        /*
         * Standardisierte Notendarstellung.
         */
        this.rootNote = rootNote;
        this.bassNote = bassNote;

        this.chordType = chordType;

        /*
         * Kanonischen JJazzLab-Namen
         * erzeugen.
         */
        this.name =
            this.computeName(
                this.rootNote,
                this.bassNote,
                this.chordType
            );


        /*
         * "C/G" ist kein Slash-Chord mehr,
         * wenn der Bass tatsächlich C ist.
         */
        if (
            this.originalName.includes("/") &&
            this.bassNote.getRelativePitch() ===
                this.rootNote.getRelativePitch()
        ) {
            this.originalName =
                this.originalName.replace(
                    /\/.*/,
                    ""
                );
        }
    }


    getRootNote() {

        return this.rootNote;
    }


    getBassNote() {

        return this.bassNote;
    }


    isSlashChord() {

        return (
            this.bassNote.getRelativePitch() !==
            this.rootNote.getRelativePitch()
        );
    }


    getChordType() {

        return this.chordType;
    }


    getName() {

        return this.name;
    }


    getOriginalName() {

        return this.originalName;
    }


    toString() {

        return this.name;
    }


    computeName(root, bass, chordType) {

        return (
            root.toRelativeNoteString() +
            chordType.getName() +
            (
                bass.getRelativePitch() ===
                root.getRelativePitch()
                    ? ""
                    : "/" +
                      bass.toRelativeNoteString()
            )
        );
    }
}
