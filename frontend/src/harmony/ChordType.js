import { Degree } from "./Degree.js";


export class ChordType {

    constructor(data) {

        this.name =
            data.name;

        this.base =
            data.base;

        this.extension =
            data.extension;

        this.family =
            data.family;

        this.aliases =
            [...(data.aliases || [])];

        this.degrees =
            (data.degrees || []).map(
                name =>
                    ChordType.degreeFromName(name)
            );
    }


    getName() {

        return this.name;
    }


    getBase() {

        return this.base;
    }


    getExtension() {

        return this.extension;
    }


    getFamily() {

        return this.family;
    }


    getAliases() {

        return [...this.aliases];
    }


    getDegrees() {

        return [...this.degrees];
    }


    getNbDegrees() {

        return this.degrees.length;
    }


    getDegree(relativePitch) {

        if (
            relativePitch < 0 ||
            relativePitch > 11
        ) {

            throw new Error(
                "Relative pitch must be between 0 and 11"
            );
        }

        return (
            this.degrees.find(
                degree =>
                    degree.getPitch() ===
                    relativePitch
            )
            || null
        );
    }


    toString() {

        return this.name;
    }


    static degreeFromName(name) {

        const type =
            Degree.Type[name];

        if (!type) {

            throw new Error(
                "Unknown JJazzLab degree: " +
                name
            );
        }

        return Degree
            .getDegrees(
                ChordType.degreePitch(name)
            )
            .find(
                degree =>
                    degree.type === type
            );
    }


    static degreePitch(name) {

        const pitches = {

            ROOT:
                0,

            NINTH_FLAT:
                1,

            NINTH:
                2,

            NINTH_SHARP:
                3,

            THIRD_FLAT:
                3,

            THIRD:
                4,

            FOURTH_OR_ELEVENTH:
                5,

            ELEVENTH_SHARP:
                6,

            FIFTH_FLAT:
                6,

            FIFTH:
                7,

            FIFTH_SHARP:
                8,

            THIRTEENTH_FLAT:
                8,

            SIXTH_OR_THIRTEENTH:
                9,

            SEVENTH_FLAT:
                10,

            SEVENTH:
                11
        };

        return pitches[name];
    }
}
