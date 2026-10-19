export class Degree {

    static Type = Object.freeze({

        ROOT: "ROOT",

        NINTH_FLAT: "NINTH_FLAT",
        NINTH: "NINTH",
        NINTH_SHARP: "NINTH_SHARP",

        THIRD_FLAT: "THIRD_FLAT",
        THIRD: "THIRD",

        FOURTH_OR_ELEVENTH:
            "FOURTH_OR_ELEVENTH",

        ELEVENTH_SHARP:
            "ELEVENTH_SHARP",

        FIFTH_FLAT: "FIFTH_FLAT",
        FIFTH: "FIFTH",
        FIFTH_SHARP: "FIFTH_SHARP",

        THIRTEENTH_FLAT:
            "THIRTEENTH_FLAT",

        SIXTH_OR_THIRTEENTH:
            "SIXTH_OR_THIRTEENTH",

        SEVENTH_FLAT:
            "SEVENTH_FLAT",

        SEVENTH:
            "SEVENTH"
    });


    /*
     * Entspricht JJazzLab Degree.Natural.
     */
    static Natural = Object.freeze({

        ROOT: {
            name: "ROOT",
            intValue: 1,
            pitch: 0
        },

        NINTH: {
            name: "NINTH",
            intValue: 9,
            pitch: 2
        },

        THIRD: {
            name: "THIRD",
            intValue: 3,
            pitch: 4
        },

        ELEVENTH: {
            name: "ELEVENTH",
            intValue: 11,
            pitch: 5
        },

        FIFTH: {
            name: "FIFTH",
            intValue: 5,
            pitch: 7
        },

        SIXTH: {
            name: "SIXTH",
            intValue: 13,
            pitch: 9
        },

        SEVENTH: {
            name: "SEVENTH",
            intValue: 7,
            pitch: 11
        }
    });


    constructor(
        type,
        natural,
        accidental
    ) {

        this.type = type;
        this.natural = natural;
        this.accidental = accidental;
    }


    getPitch() {

        return (
            this.natural.pitch +
            this.accidental
        );
    }


    getNatural() {

        return this.natural;
    }


    getAccidental() {

        return this.accidental;
    }


    toStringShort() {

        if (this.accidental === -1) {

            return "b" +
                this.natural.intValue;
        }

        if (this.accidental === 1) {

            return "#" +
                this.natural.intValue;
        }

        return String(
            this.natural.intValue
        );
    }


    toString() {

        return this.type;
    }


    equals(other) {

        return (
            other instanceof Degree &&
            this.type === other.type
        );
    }


    equalsSixthMajorSeventh(
        other
    ) {

        return (
            this.type === other.type ||

            (
                this.type ===
                    Degree.Type.SIXTH_OR_THIRTEENTH &&
                other.type ===
                    Degree.Type.SEVENTH
            ) ||

            (
                this.type ===
                    Degree.Type.SEVENTH &&
                other.type ===
                    Degree.Type.SIXTH_OR_THIRTEENTH
            )
        );
    }


    static getDegree(
        natural,
        accidental
    ) {

        for (
            const degree
            of Degree.#allDegrees()
        ) {

            if (
                degree.natural === natural &&
                degree.accidental === accidental
            ) {

                return degree;
            }
        }

        return null;
    }


    static getDegrees(
        relativePitch
    ) {

        if (
            relativePitch < 0 ||
            relativePitch > 11
        ) {

            throw new Error(
                "relativePitch must be between 0 and 11"
            );
        }

        return Degree.#allDegrees()
            .filter(
                degree =>
                    degree.getPitch() ===
                    relativePitch
            );
    }


    static getDegreeMostProbable(
        relativePitch
    ) {

        const typeByPitch = {

            0:
                Degree.Type.ROOT,

            1:
                Degree.Type.NINTH_FLAT,

            2:
                Degree.Type.NINTH,

            3:
                Degree.Type.THIRD_FLAT,

            4:
                Degree.Type.THIRD,

            5:
                Degree.Type.FOURTH_OR_ELEVENTH,

            6:
                Degree.Type.FIFTH_FLAT,

            7:
                Degree.Type.FIFTH,

            8:
                Degree.Type.FIFTH_SHARP,

            9:
                Degree.Type.SIXTH_OR_THIRTEENTH,

            10:
                Degree.Type.SEVENTH_FLAT,

            11:
                Degree.Type.SEVENTH
        };

        const type =
            typeByPitch[relativePitch];

        if (type === undefined) {

            throw new Error(
                "Invalid relative pitch: " +
                relativePitch
            );
        }

        return Degree.#allDegrees()
            .find(
                degree =>
                    degree.type === type
            );
    }

    static fromString(value) {

        if (
            typeof value !== "string"
        ) {

            throw new Error(
                "Invalid degree: " + value
            );
        }

        const type =
            value.trim().toUpperCase();

        const degree =
            Degree.#allDegrees().find(
                degree =>
                    degree.type === type
            );

        if (!degree) {

            throw new Error(
                "Unknown degree: " + value
            );
        }

        return degree;
    }


    static #allDegrees() {

        return [

            new Degree(
                Degree.Type.ROOT,
                Degree.Natural.ROOT,
                0
            ),

            new Degree(
                Degree.Type.NINTH_FLAT,
                Degree.Natural.NINTH,
                -1
            ),

            new Degree(
                Degree.Type.NINTH,
                Degree.Natural.NINTH,
                0
            ),

            new Degree(
                Degree.Type.NINTH_SHARP,
                Degree.Natural.NINTH,
                1
            ),

            new Degree(
                Degree.Type.THIRD_FLAT,
                Degree.Natural.THIRD,
                -1
            ),

            new Degree(
                Degree.Type.THIRD,
                Degree.Natural.THIRD,
                0
            ),

            new Degree(
                Degree.Type.FOURTH_OR_ELEVENTH,
                Degree.Natural.ELEVENTH,
                0
            ),

            new Degree(
                Degree.Type.ELEVENTH_SHARP,
                Degree.Natural.ELEVENTH,
                1
            ),

            new Degree(
                Degree.Type.FIFTH_FLAT,
                Degree.Natural.FIFTH,
                -1
            ),

            new Degree(
                Degree.Type.FIFTH,
                Degree.Natural.FIFTH,
                0
            ),

            new Degree(
                Degree.Type.FIFTH_SHARP,
                Degree.Natural.FIFTH,
                1
            ),

            new Degree(
                Degree.Type.THIRTEENTH_FLAT,
                Degree.Natural.SIXTH,
                -1
            ),

            new Degree(
                Degree.Type.SIXTH_OR_THIRTEENTH,
                Degree.Natural.SIXTH,
                0
            ),

            new Degree(
                Degree.Type.SEVENTH_FLAT,
                Degree.Natural.SEVENTH,
                -1
            ),

            new Degree(
                Degree.Type.SEVENTH,
                Degree.Natural.SEVENTH,
                0
            )
        ];
    }
}
