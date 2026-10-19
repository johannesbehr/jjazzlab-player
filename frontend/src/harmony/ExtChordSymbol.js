import { ChordSymbol }
    from "./ChordSymbol.js";

export class ExtChordSymbol {

    constructor(chordSymbol) {
        this.chordSymbol =
            chordSymbol;
    }

    static get(
        name,
        chordTypeDatabase
    ) {
        if (typeof name !== "string") {
            throw new Error(
                "Chord symbol must be a string"
            );
        }

        name = name.trim();

        /*
         * JJazzLab behandelt NC speziell.
         */
        if (
            name.toUpperCase() === "NC"
        ) {
            return null;
        }

        const chordSymbol =
            new ChordSymbol(
                name,
                chordTypeDatabase
            );

        return new ExtChordSymbol(
            chordSymbol
        );
    }

    getRootNote() {
        return this.chordSymbol
            .getRootNote();
    }

    getBassNote() {
        return this.chordSymbol
            .getBassNote();
    }

    isSlashChord() {
        return this.chordSymbol
            .isSlashChord();
    }

    getChordType() {
        return this.chordSymbol
            .getChordType();
    }

    getName() {
        return this.chordSymbol
            .getName();
    }

    getOriginalName() {
        return this.chordSymbol
            .getOriginalName();
    }

    toString() {
        return this.chordSymbol
            .toString();
    }
}