import { ChordType } from "./ChordType.js";


export class ChordTypeDatabase {

    static instance = null;


    constructor(data) {

        this.chordTypes =
            data.map(
                item =>
                    new ChordType(item)
            );

        this.byName =
            new Map();

        this.byAlias =
            new Map();


        for ( const chordType of this.chordTypes ) {
            this.byName.set(chordType.getName(),chordType);

            for (const alias of chordType.getAliases()) {
                this.byAlias.set(alias, chordType);
            }
        }
    }

    static async initialize() {

        if (ChordTypeDatabase.instance) {
            return ChordTypeDatabase.instance;
        }

        const response =
            await fetch(
                "/java/jjazzlab/api/harmony/chordtypes"
            );

        if (!response.ok) {

            throw new Error(
                "Could not load JJazzLab " +
                "ChordTypes: " +
                response.status
            );
        }

        const data =
            await response.json();

        ChordTypeDatabase.instance =
            new ChordTypeDatabase(data);

        return ChordTypeDatabase.instance;
    }


    static getDefault() {

        if (!ChordTypeDatabase.instance) {

            throw new Error(
                "ChordTypeDatabase not initialized"
            );
        }

        return ChordTypeDatabase.instance;
    }



    getChordTypes() {

        return [
            ...this.chordTypes
        ];
    }


    getChordType(name) {

        if (
            typeof name !== "string"
        ) {

            return null;
        }


        /*
         * Zuerst exakter Name.
         */

        const direct =
            this.byName.get(name);

        if (direct) {

            return direct;
        }


        /*
         * Danach Alias.
         */

        const alias =
            this.byAlias.get(name);

        if (alias) {

            return alias;
        }


        return null;
    }
}
