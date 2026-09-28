export class SongModel {

    constructor() {

        this.sessionId = null;
        this.name = null;
        this.xml = "";
        this.modified = false;

        this.document = null;
    }


    // =========================================================
    // Session / Song
    // =========================================================

    setSessionId(sessionId) {
        this.sessionId = sessionId;
    }


    setSong(name, xml) {

        this.name = name;
        this.xml = xml;

        this.document = null;
        this.modified = false;
    }


    setXml(xml) {

        this.xml = xml;

        this.document = null;
        this.modified = true;
    }


    getXml() {
        return this.xml;
    }


    getDocument() {

        if (this.document === null) {

            const parser =
                new DOMParser();

            this.document =
                parser.parseFromString(
                    this.xml,
                    "application/xml"
                );
        }

        return this.document;
    }


    updateXml() {

        if (this.document === null) {
            return;
        }

        const serializer =
            new XMLSerializer();

        this.xml =
            serializer.serializeToString(
                this.document
            );

        this.modified = true;
    }


    markSaved() {
        this.modified = false;
    }


    hasSession() {
        return this.sessionId !== null;
    }


    hasUnsavedChanges() {
        return this.modified;
    }


    // =========================================================
    // XML-Hilfsmethoden
    // =========================================================

    getSongElement() {
        return this.getDocument().documentElement;
    }

    getChordLeadSheetElement() {

        const song =
            this.getSongElement();

        return song.querySelector(
            ":scope > spChordLeadSheet"
        );
    }
    
    getSongStructureElement() {

        const song =
            this.getSongElement();

        return song.querySelector(
            ":scope > spSongStructure"
        );
    }
    
    parsePosition(value) {

        if (!value) {
            return null;
        }

        const match =
            value.match(
                /^\[(\d+):(\d+)\]$/
            );

        if (!match) {
            return null;
        }

        return {
            bar: Number(match[1]),
            position: Number(match[2])
        };
    }


    getElementPosition(element) {

        const positionElement =
            element.querySelector(
                ":scope > spPos"
            );

        if (!positionElement) {
            return null;
        }

        return this.parsePosition(
            positionElement.getAttribute(
                "spPos"
            )
        );
    }

    getSectionElements() {

        const chordLeadSheet =
            this.getChordLeadSheetElement();

        if (!chordLeadSheet) {
            return [];
        }

        return Array.from(
            chordLeadSheet.querySelectorAll(
                ":scope > spItems > CLI__SectionImpl"
            )
        );
    }
    
    getSongPartEndBar(songPart) {

        const startBar =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        const numberOfBars =
            Number(
                songPart.getAttribute(
                    "spNbBars"
                )
            );

        return startBar + numberOfBars;
    }


    // =========================================================
    // Chords - Hilfsmethoden
    // =========================================================

    getChordElements() {

        return this.getDocument()
            .querySelectorAll(
                "CLI__ChordSymbolImpl"
            );
    }


    findChord(bar, position) {

        for (const element of this.getChordElements()) {

            const elementPosition =
                this.getElementPosition(
                    element
                );

            if (!elementPosition) {
                continue;
            }

            if (
                elementPosition.bar === bar &&
                elementPosition.position === position
            ) {
                return element;
            }
        }

        return null;
    }


    getChordName(element) {

        const chordElement =
            element.querySelector(
                ":scope > spChord"
            );

        if (!chordElement) {
            return null;
        }

        if (
            chordElement.hasAttribute(
                "spOriginalName"
            )
        ) {
            return chordElement.getAttribute(
                "spOriginalName"
            );
        }

        return chordElement.getAttribute(
            "spName"
        );
    }


    setChordName(element, name) {

        const chordElement =
            element.querySelector(
                ":scope > spChord"
            );

        if (!chordElement) {
            return false;
        }

        chordElement.setAttribute(
            "spName",
            name
        );

        chordElement.setAttribute(
            "spOriginalName",
            name
        );

        return true;
    }


    setChordPosition(element,bar,position) {

        const positionElement =
            element.querySelector(
                ":scope > spPos"
            );

        if (!positionElement) {
            return false;
        }

        positionElement.setAttribute(
            "spPos",
            `[${bar}:${position}]`
        );

        return true;
    }


    cloneChord(name,bar,position) {

        const chords =
            this.getChordElements();

        if (chords.length === 0) {
            return null;
        }

        const template =
            chords[
                chords.length - 1
            ];

        const newChord =
            template.cloneNode(true);

        if (
            !this.setChordName(
                newChord,
                name
            )
        ) {
            return null;
        }

        if (
            !this.setChordPosition(
                newChord,
                bar,
                position
            )
        ) {
            return null;
        }

        return newChord;
    }


    // =========================================================
    // Chords - lesen
    // =========================================================

    getChords() {

        const chords = [];

        for (const element of this.getChordElements()) {

            const position =
                this.getElementPosition(
                    element
                );

            const name =
                this.getChordName(
                    element
                );

            if (!position || !name) {
                continue;
            }

            chords.push({
                bar: position.bar,
                position: position.position,
                name: name
            });
        }

        return chords;
    }


    // =========================================================
    // Chords - ändern
    // =========================================================

    setChord(bar,position,name) {

        const chord =
            this.findChord(
                bar,
                position
            );

        if (!chord) {
            return;
        }

        if (
            this.setChordName(
                chord,
                name
            )
        ) {
            this.updateXml();
        }
    }


    removeChord(bar,position) {

        const chord =
            this.findChord(
                bar,
                position
            );

        if (!chord) {
            return;
        }

        chord.remove();

        this.updateXml();
    }


    insertChord(bar,position,name) {

        const newChord =
            this.cloneChord(
                name,
                bar,
                position
            );

        if (!newChord) {
            return;
        }

        const chords =
            this.getChordElements();

        let insertBefore =
            null;

        for (const chord of chords) {

            const existingPosition =
                this.getElementPosition(
                    chord
                );

            if (!existingPosition) {
                continue;
            }

            if (
                existingPosition.bar > bar ||
                (
                    existingPosition.bar === bar &&
                    existingPosition.position > position
                )
            ) {
                insertBefore = chord;
                break;
            }
        }

        const parent =
            chords[0].parentElement;

        if (insertBefore) {

            parent.insertBefore(
                newChord,
                insertBefore
            );

        } else {

            parent.appendChild(
                newChord
            );
        }

        this.updateXml();
    }

    addElement(name){
        if (name.toLowerCase() === "sp") {
            
            const chords =
            this.getChordElements();

        if (chords.length === 0) {
            return;
        }

        const lastChord =
            chords[
                chords.length - 1
            ];

        const lastPosition =
            this.getElementPosition(
                lastChord
            );

        if (!lastPosition) {
            return;
        }

        const startBar =
            lastPosition.bar + 1;
            
            //const startBar = this.getSongSize() - 1;
        const success = this.addSongPart(startBar);

            if (!success) {
                console.warn(
                    "SongPart konnte nicht angelegt werden."
                );
                return;
            }
        } else {
            this.addChord(name);
        }
    }

    addChord(name) {

        const chords =
            this.getChordElements();

        if (chords.length === 0) {
            return;
        }

        const lastChord =
            chords[
                chords.length - 1
            ];

        const lastPosition =
            this.getElementPosition(
                lastChord
            );

        if (!lastPosition) {
            return;
        }

        const newBar =
            lastPosition.bar + 1;

        const newChord =
            this.cloneChord(
                name,
                newBar,
                0
            );

        if (!newChord) {
            return;
        }

        lastChord.parentElement.insertBefore(
            newChord,
            lastChord.nextSibling
        );

        this.ensureSongSize(
            newBar + 1
        );

        this.extendLastSongPartTo(
            newBar + 1
        );

        this.updateXml();
    }


  splitChord(bar,position,value) {

    const names =
        value.trim().split(/\s+/);

    if (names.length !== 2) {
        return;
    }

    const firstName =
        names[0];

    const secondName =
        names[1];

    if(firstName.trim().toLowerCase() =="sp"){
        this.addSongPart(bar);
    }else{

        // Position 0:
        // Zuerst versuchen wir Position 2.
        // Falls diese belegt ist, versuchen wir Position 1.
        if (position === 0) {

            this.setChord(
                bar,
                position,
                firstName
            );

            if (!this.findChord(bar, 2)) {

                this.insertChord(
                    bar,
                    2,
                    secondName
                );

                return;
            }

            if (!this.findChord(bar, 1)) {

                this.insertChord(
                    bar,
                    1,
                    secondName
                );

                return;
            }

            alert(
                "Der Akkord kann nicht gesplittet werden, " +
                "weil im Takt keine freie Position mehr vorhanden ist."
            );

            return;
    }

    // Position 2:
    // Der zweite Akkord kommt auf Position 3.
    if (position === 2) {

        this.setChord(
            bar,
            position,
            firstName
        );

        if (!this.findChord(bar, 3)) {

            this.insertChord(
                bar,
                3,
                secondName
            );

            return;
        }

        alert(
            "Der Akkord kann nicht gesplittet werden, " +
            "weil im Takt keine freie Position mehr vorhanden ist."
        );

        return;
    }

    // Position 3:
    // Der zweite Akkord beginnt im nächsten Takt.
    if (position === 3) {

        const newBar =
            bar + 1;

        this.shiftChordsFromBar(
            newBar
        );

        this.setChord(
            bar,
            position,
            firstName
        );

        this.insertChord(
            newBar,
            0,
            secondName
        );

        this.extendSongByOneBar();

        return;
            }
        }
    }

    shiftChordsFromBar(startBar) {

        for (const chord of this.getChordElements()) {

            const position =
                this.getElementPosition(
                    chord
                );

            if (!position) {
                continue;
            }

            if (position.bar >= startBar) {

                this.setChordPosition(
                    chord,
                    position.bar + 1,
                    position.position
                );
            }
        }
    }


    // =========================================================
    // Song-Größe / SongParts
    // =========================================================

    getSongSize(){
                const chordLeadSheet =
            this.getDocument()
                .querySelector(
                    "spChordLeadSheet"
                );

        if (!chordLeadSheet) {
            return;
        }

        const sizeElement =
            chordLeadSheet.querySelector(
                ":scope > spSize"
            );

        if (!sizeElement) {
            return;
        }

        return (Number(sizeElement.textContent));
    }
    
    setSongSize(size){
        const chordLeadSheet =
            this.getDocument()
                .querySelector(
                    "spChordLeadSheet"
                );

        if (!chordLeadSheet) {
            return;
        }

        const sizeElement =
            chordLeadSheet.querySelector(
                ":scope > spSize"
            );

        if (!sizeElement) {
            return;
        }

        const currentSize =
            Number(
                sizeElement.textContent
            );

       sizeElement.textContent =
                String(size);
    }

    ensureSongSize(size) {
        const currentSize = this.getSongSize();
        if (currentSize < size) {
            this.setSongSize(size);
        }
    }

    getSongPartElements() {

        const songStructure =
            this.getSongStructureElement();

        if (!songStructure) {
            return [];
        }

        return Array.from(
            songStructure.querySelectorAll(
                ":scope > spSpts > SongPartImpl"
            )
        );
    }

    getSectionForSongPart(songPart) {

        if (!songPart) {
            return null;
        }

        const startBar =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        const sections =
            this.getSectionElements();

        for (const section of sections) {

            const sectionBar =
                Number(
                    section.getAttribute(
                        "spBarIndex"
                    )
                );

            if (sectionBar === startBar) {
                return section;
            }
        }

        return null;
    }

    getSongPart(startBar) {

        for (const element of this.getSongPartElements()) {

            if (
                Number(
                    element.getAttribute(
                        "spStartBarIndex"
                    )
                ) === startBar
            ) {
                return element;
            }
        }

        return null;
    }


    extendLastSongPartTo(endBar) {

        const songParts =
            this.getSongPartElements();

        if (songParts.length === 0) {
            return;
        }

        const lastSongPart =
            songParts[
                songParts.length - 1
            ];

        const startBar =
            Number(
                lastSongPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        const numberOfBars =
            Number(
                lastSongPart.getAttribute(
                    "spNbBars"
                )
            );

        const currentEnd =
            startBar + numberOfBars;

        if (currentEnd < endBar) {

            lastSongPart.setAttribute(
                "spNbBars",
                String(
                    endBar - startBar
                )
            );
        }
    }

getPreviousSongPart(startBar) {

    const songParts =
        this.getSongPartElements();

    let previousSongPart =
        null;

    for (const songPart of songParts) {

        const partStart =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        if (
            partStart < startBar &&
            (
                previousSongPart === null ||
                partStart >
                Number(
                    previousSongPart.getAttribute(
                        "spStartBarIndex"
                    )
                )
            )
        ) {
            previousSongPart =
                songPart;
        }
    }

    return previousSongPart;
}

getNextSongPart(startBar) {

    const songParts =
        this.getSongPartElements();

    let nextSongPart =
        null;

    for (const songPart of songParts) {

        const partStart =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        if (
            partStart > startBar &&
            (
                nextSongPart === null ||
                partStart <
                Number(
                    nextSongPart.getAttribute(
                        "spStartBarIndex"
                    )
                )
            )
        ) {
            nextSongPart =
                songPart;
        }
    }

    return nextSongPart;
}

    getUniqueSongPartName(name = "New Part") {

        const existingNames =
            this.getSongPartElements()
                .map(
                    songPart =>
                        songPart.getAttribute(
                            "spName"
                        )
                );

        if (
            !existingNames.includes(name)
        ) {
            return name;
        }

        let number = 2;

        while (
            existingNames.includes(
                `${name} ${number}`
            )
        ) {
            number++;
        }

        return `${name} ${number}`;
    }

addSongPart(startBar, name = undefined) {

    const chordLeadSheet =
        this.getChordLeadSheetElement();

    if (!chordLeadSheet) {
        return false;
    }


    /*
     * Existiert dort bereits ein SongPart?
     */

    if (
        this.getSongPart(startBar)
    ) {
        return false;
    }

    /*
     * Songlänge ermitteln.
     */

    const sizeElement =
        chordLeadSheet.querySelector(
            ":scope > spSize"
        );

    if (!sizeElement) {
        return false;
    }

    let songSize =
        Number(
            sizeElement.textContent
        );


    /*
     * Song am Ende bei Bedarf
     * um einen Takt erweitern.
     */

    if (
        startBar < 0 ||
        startBar > songSize
    ) {
        return false;
    }

    if (
        startBar === songSize
    ) {

        this.extendSongByOneBar();

        songSize++;
    }


    /*
     * Vorherigen SongPart bestimmen.
     */

    const previousSongPart =
        this.getPreviousSongPart(
            startBar
        );

    if (!previousSongPart) {
        return false;
    }


    /*
     * Wenn kein Name angegeben wurde,
     * einen eindeutigen Standardnamen erzeugen.
     */

    if (name === undefined) {

        name =
            this.getUniqueSongPartName(
                "New Part"
            );
    }

    /*
     * Neuen SongPart erzeugen.
     */

    const newSongPart =
        previousSongPart.cloneNode(true);

    newSongPart.setAttribute(
        "spName",
        name
    );

    newSongPart.setAttribute(
        "spStartBarIndex",
        String(startBar)
    );


    /*
     * Vorherigen SongPart verkürzen.
     */

    const previousStart =
        Number(
            previousSongPart.getAttribute(
                "spStartBarIndex"
            )
        );

    previousSongPart.setAttribute(
        "spNbBars",
        String(
            startBar - previousStart
        )
    );


    /*
     * Ende des neuen SongParts bestimmen.
     */

    const nextSongPart =
        this.getNextSongPart(
            startBar
        );

    const newEnd =
        nextSongPart
            ? Number(
                nextSongPart.getAttribute(
                    "spStartBarIndex"
                )
            )
            : songSize;

    newSongPart.setAttribute(
        "spNbBars",
        String(
            newEnd - startBar
        )
    );


    /*
     * SongPart einfügen.
     */

    if (
        !this.insertSongPart(
            newSongPart
        )
    ) {
        return false;
    }


    /*
     * Zugehörige Section erzeugen.
     */

    const sectionTemplate =
        this.getSectionForSongPart(
            previousSongPart
        );

    if (!sectionTemplate) {
        return false;
    }

    const newSection =
        sectionTemplate.cloneNode(true);

    newSection.setAttribute(
        "spName",
        name
    );

    newSection.setAttribute(
        "spBarIndex",
        String(startBar)
    );


    /*
     * Section einfügen.
     */

    if (
        !this.insertSection(
            newSection
        )
    ) {
        return false;
    }


    /*
     * Referenzen aktualisieren.
     */

    this.updateSongPartSectionReferences();


    /*
     * XML aktualisieren.
     */

    this.updateXml();

    return true;
}

    insertSongPart(songPart) {

        const songStructure =
            this.getSongStructureElement();

        if (!songStructure) {
            return false;
        }

        const spts =
            songStructure.querySelector(
                ":scope > spSpts"
            );

        if (!spts) {
            return false;
        }

        const startBar =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        for (
            const existingPart
            of this.getSongPartElements()
        ) {

            const existingStart =
                Number(
                    existingPart.getAttribute(
                        "spStartBarIndex"
                    )
                );

            if (
                existingStart > startBar
            ) {

                spts.insertBefore(
                    songPart,
                    existingPart
                );

                return true;
            }
        }

        spts.appendChild(
            songPart
        );

        return true;
    }

    insertSection(section) {

        const chordLeadSheet =
            this.getChordLeadSheetElement();

        if (!chordLeadSheet) {
            return false;
        }

        const items =
            chordLeadSheet.querySelector(
                ":scope > spItems"
            );

        if (!items) {
            return false;
        }

        const startBar =
            Number(
                section.getAttribute(
                    "spBarIndex"
                )
            );

        for (
            const existingSection
            of this.getSectionElements()
        ) {

            const sectionBar =
                Number(
                    existingSection.getAttribute(
                        "spBarIndex"
                    )
                );

            if (
                sectionBar > startBar
            ) {

                items.insertBefore(
                    section,
                    existingSection
                );

                return true;
            }
        }

        items.appendChild(
            section
        );

        return true;
    }


removeSongPart(startBar) {

    const songParts =
        this.getSongPartElements();

    const songPart =
        this.getSongPart(startBar);

    if (!songPart) {
        return false;
    }


    /*
     * Der erste SongPart darf momentan
     * nicht gelöscht werden.
     *
     * Der Grund: Es muss immer einen
     * Abschnitt ab Takt 0 geben.
     */

    if (startBar === 0) {
        return false;
    }


    /*
     * Informationen des zu löschenden
     * SongParts sichern.
     */

    const deletedEnd =
        this.getSongPartEndBar(
            songPart
        );


    /*
     * Vorherigen SongPart suchen.
     */

    let previousSongPart =
        null;

    for (const part of songParts) {

        const partStart =
            Number(
                part.getAttribute(
                    "spStartBarIndex"
                )
            );

        if (
            partStart < startBar &&
            (
                previousSongPart === null ||
                partStart >
                Number(
                    previousSongPart.getAttribute(
                        "spStartBarIndex"
                    )
                )
            )
        ) {
            previousSongPart =
                part;
        }
    }


    if (!previousSongPart) {
        return false;
    }


    /*
     * Vorherigen Part bis zum Ende
     * des gelöschten Parts verlängern.
     */

    const previousStart =
        Number(
            previousSongPart.getAttribute(
                "spStartBarIndex"
            )
        );

    previousSongPart.setAttribute(
        "spNbBars",
        String(
            deletedEnd - previousStart
        )
    );

    /*
     * Zugehörige Section entfernen.
     */
    const section = this.getSectionForSongPart(songPart);
    if (section) {
        section.remove();
    }

    /*
     * SongPart entfernen.
     */

    songPart.remove();

/*
     * Referenzen der verbleibenden
     * SongParts neu aufbauen.
     */

    this.updateSongPartSectionReferences();

    /*
     * XML aktualisieren.
     */

    this.updateXml();

    return true;
}

updateSongPartSectionReferences() {

    const songParts =
        this.getSongPartElements();

    const sections =
        this.getSectionElements();


    /*
     * Es muss für jeden SongPart
     * eine passende Section geben.
     */

    if (
        songParts.length !==
        sections.length
    ) {
        console.warn(
            "Anzahl der SongParts und Sections stimmt nicht überein.",
            songParts.length,
            sections.length
        );

        return false;
    }


    /*
     * Die Sections sind entsprechend ihrer
     * XML-Reihenfolge durchnummeriert.
     *
     * Die erste Section wird ohne Index
     * referenziert:
     *
     * CLI__SectionImpl
     *
     * Danach:
     *
     * CLI__SectionImpl[2]
     * CLI__SectionImpl[3]
     * ...
     */

    for (
        let i = 0;
        i < songParts.length;
        i++
    ) {

        const songPart =
            songParts[i];

        const section =
            sections[i];


        /*
         * Sicherheitshalber prüfen wir,
         * ob Starttakt und Section-Takt
         * zusammenpassen.
         */

        const songPartBar =
            Number(
                songPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        const sectionBar =
            Number(
                section.getAttribute(
                    "spBarIndex"
                )
            );

        if (
            songPartBar !== sectionBar
        ) {

            console.warn(
                "SongPart und Section passen nicht zusammen.",
                {
                    songPartBar,
                    sectionBar,
                    songPart:
                        songPart.getAttribute(
                            "spName"
                        ),
                    section:
                        section.getAttribute(
                            "spName"
                        )
                }
            );

            return false;
        }


        /*
         * spParentSection des SongParts
         * suchen.
         */

        const parentSection =
            songPart.querySelector(
                ":scope > spParentSection"
            );

        if (!parentSection) {

            console.warn(
                "SongPart besitzt kein spParentSection.",
                songPart
            );

            continue;
        }


        /*
         * Neue Referenz erzeugen.
         */

        let reference =
            "../../../../spChordLeadSheet/spItems/CLI__SectionImpl";

        if (i > 0) {

            reference +=
                `[${i + 1}]`;
        }


        parentSection.setAttribute(
            "reference",
            reference
        );
    }


    return true;
}

    extendSongByOneBar() {

        const songParts =
            this.getSongPartElements();

        if (songParts.length === 0) {
            return;
        }

        const lastSongPart =
            songParts[
                songParts.length - 1
            ];

        const startBar =
            Number(
                lastSongPart.getAttribute(
                    "spStartBarIndex"
                )
            );

        const numberOfBars =
            Number(
                lastSongPart.getAttribute(
                    "spNbBars"
                )
            );

        lastSongPart.setAttribute(
            "spNbBars",
            String(
                numberOfBars + 1
            )
        );
    }


getTimeline() {

    const timeline = [];


    /*
     * SongParts
     */

const songParts =
    this.getSongParts();

    for (const songPart of songParts) {

        const xmlSongPart =
            this.getSongPart(
                songPart.startBar
            );

        const rhythmId =
            xmlSongPart
                ? xmlSongPart.getAttribute(
                    "spRhythmId"
                )
                : "";

        timeline.push({
            type: "songPart",
            bar: songPart.startBar,
            name: songPart.name,
            numberOfBars:
                songPart.numberOfBars,
            rhythmName:
                songPart.rhythmName,
            rhythmId:
                rhythmId,
            variation:
                songPart.variation
        });
    }


    /*
     * Chords
     */

    const chords =
        this.getChords();

    for (const chord of chords) {

        timeline.push({
            type: "chord",
            bar: chord.bar,
            position: chord.position,
            name: chord.name
        });
    }


    /*
     * Chronologisch sortieren.
     *
     * Bei gleichem Takt kommt der
     * SongPart immer vor dem Chord.
     */

    timeline.sort(
        (a, b) => {

            if (a.bar !== b.bar) {
                return a.bar - b.bar;
            }


            /*
             * SongPart vor Chord
             */

            if (
                a.type === "songPart" &&
                b.type === "chord"
            ) {
                return -1;
            }

            if (
                a.type === "chord" &&
                b.type === "songPart"
            ) {
                return 1;
            }


            /*
             * Zwei Chords:
             * nach Position sortieren.
             */

            if (
                a.type === "chord" &&
                b.type === "chord"
            ) {
                return (
                    a.position -
                    b.position
                );
            }


            return 0;
        }
    );

    return timeline;
}

    // =========================================================
    // SongParts - lesen
    // =========================================================

    getSongParts() {

        const songParts = [];

        for (const element of this.getSongPartElements()) {

            const name =
                element.getAttribute(
                    "spName"
                );

            const startBar =
                Number(
                    element.getAttribute(
                        "spStartBarIndex"
                    )
                );

            const numberOfBars =
                Number(
                    element.getAttribute(
                        "spNbBars"
                    )
                );

            const rhythmNameElement =
                element.querySelector(
                    ":scope > spRhythmName"
                );

            const rhythmName =
                rhythmNameElement
                    ? rhythmNameElement.textContent
                    : "";

            const variation =
                this.getSongPartVariation(
                    element
                );

            songParts.push({
                name: name || "",
                startBar: startBar,
                numberOfBars: numberOfBars,
                rhythmName: rhythmName,
                variation: variation
            });
        }

        return songParts;
    }

    getSongPartVariation(songPart) {

        const entries =
            songPart.querySelectorAll(
                ":scope > spHashMapRpIdValue > entry"
            );

        for (const entry of entries) {

            const strings =
                entry.querySelectorAll(
                    ":scope > string"
                );

            if (strings.length < 2) {
                continue;
            }

            if (
                strings[0].textContent ===
                "rpVariationID"
            ) {
                return strings[1].textContent;
            }
        }

        return "";
    }


    setSongPartVariation(songPart,variation) {

        const entries =
            songPart.querySelectorAll(
                ":scope > spHashMapRpIdValue > entry"
            );

        for (const entry of entries) {

            const strings =
                entry.querySelectorAll(
                    ":scope > string"
                );

            if (strings.length < 2) {
                continue;
            }

            if (
                strings[0].textContent ===
                "rpVariationID"
            ) {
                strings[1].textContent =
                    variation;

                return;
            }
        }

        const hashMap =
            songPart.querySelector(
                ":scope > spHashMapRpIdValue"
            );

        if (!hashMap) {
            return;
        }

        const entry =
            this.getDocument()
                .createElement(
                    "entry"
                );

        const key =
            this.getDocument()
                .createElement(
                    "string"
                );

        key.textContent =
            "rpVariationID";

        const value =
            this.getDocument()
                .createElement(
                    "string"
                );

        value.textContent =
            variation;

        entry.appendChild(key);
        entry.appendChild(value);

        hashMap.appendChild(entry);
    }


    setSongPart(startBar,name,rhythmName,variation, rhythmId = undefined) {

        const songPart =
            this.getSongPart(
                startBar
            );

        if (!songPart) {
            return;
        }

        if(name.trim() === ""){
            this.removeSongPart(startBar);
        }else{

            songPart.setAttribute(
                "spName",
                name
            );
            
            /*
             * Zugehörige CLI__SectionImpl ebenfalls
             * umbenennen.
             */

            const section =
                this.getSectionForSongPart(
                    songPart
                );

            if (section) {

                section.setAttribute(
                    "spName",
                    name
                );
            }
            if (
                rhythmId !== undefined &&
                rhythmId !== ""
            ) {

                songPart.setAttribute(
                    "spRhythmId",
                    rhythmId
                );
            }

            // Rhythmus-Name

            let rhythmNameElement =
                songPart.querySelector(
                    ":scope > spRhythmName"
                );

            if (!rhythmNameElement) {

                rhythmNameElement =
                    this.getDocument()
                        .createElement(
                            "spRhythmName"
                        );

                const parentSection =
                    songPart.querySelector(
                        ":scope > spParentSection"
                    );

                songPart.insertBefore(
                    rhythmNameElement,
                    parentSection
                );
            }

            rhythmNameElement.textContent =
                rhythmName;


            // Variation

            this.setSongPartVariation(
                songPart,
                variation
            );


            // Client Property

            const properties =
                this.getSongElement()
                    .querySelector(
                        ":scope > spClientPropertiesV3 > properties"
                    );

            if (properties) {

                const prefix =
                    "PropCompactViewModeVisibleRps_";

                const entries =
                    properties.querySelectorAll(
                        ":scope > entry"
                    );

                for (const entry of entries) {

                    const strings =
                        entry.querySelectorAll(
                            ":scope > string"
                        );

                    if (strings.length < 2) {
                        continue;
                    }

                    const key =
                        strings[0].textContent;

                    if (key.startsWith(prefix)) {

                        strings[0].textContent =
                            prefix + rhythmId;

                        break;
                    }
                }
            }

            this.updateXml();
        }
    }


    // =========================================================
    // Tempo
    // =========================================================

    getTempo() {

        const song =
            this.getSongElement();

        if (
            song.hasAttribute(
                "spTempo"
            )
        ) {
            return Number(
                song.getAttribute(
                    "spTempo"
                )
            );
        }

        const tempoElement =
            song.querySelector(
                ":scope > spTempo"
            );

        if (tempoElement) {
            return Number(
                tempoElement.textContent
            );
        }

        return null;
    }


    setTempo(tempo) {

        const song =
            this.getSongElement();


        // Bevorzugt die vorhandene
        // XML-Darstellung beibehalten.

        if (
            song.hasAttribute(
                "spTempo"
            )
        ) {

            song.setAttribute(
                "spTempo",
                String(tempo)
            );

        } else {

            const tempoElement =
                song.querySelector(
                    ":scope > spTempo"
                );

            if (tempoElement) {

                tempoElement.textContent =
                    String(tempo);

            } else {

                const newTempo =
                    this.getDocument()
                        .createElement(
                            "spTempo"
                        );

                newTempo.textContent =
                    String(tempo);

                song.appendChild(
                    newTempo
                );
            }
        }

        this.updateXml();
    }
}