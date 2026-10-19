import { ExtChordSymbol } from "../harmony/ExtChordSymbol.js";
import { ChordTypeDatabase } from "../harmony/ChordTypeDatabase.js";

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
        this.resolveChordReferences();

        this.modified = true;
    }

    getXml() {
        return this.xml;
    }

    getDocument() {
        if (this.document === null) {
            const parser = new DOMParser();
            this.document = parser.parseFromString(this.xml, "application/xml");
        }

        return this.document;
    }

    updateXml() {
        if (this.document === null) {
            return;
        }

        const serializer = new XMLSerializer();
        this.xml = serializer.serializeToString(this.document);
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
        const song = this.getSongElement();
        return song.querySelector(":scope > spChordLeadSheet");
    }

    getSongStructureElement() {
        const song = this.getSongElement();
        return song.querySelector(":scope > spSongStructure");
    }

    parsePosition(value) {
        if (!value) {
            return null;
        }

        const match = value.match(/^\[(\d+):(\d+)\]$/);
        if (!match) {
            return null;
        }

        return {
            bar: Number(match[1]), position: Number(match[2])
        };
    }

    getElementPosition(element) {
        const positionElement = element.querySelector(":scope > spPos");
        if (!positionElement) {
            return null;
        }

        return this.parsePosition(positionElement.getAttribute("spPos"));
    }

    getSections() {
        
        const lastBar = this.getChords().at(-1).bar;
        
        const sections = this.getSectionElements()
            .map(element => ({
                name: element.getAttribute("spName"),
                bar: Number(element.getAttribute("spBarIndex")),
                timeSignature: element.getAttribute("spTs"),
                element: element
            })).sort((a, b) => a.bar - b.bar);

        sections.forEach((section, i) => {
            section.length = sections[i + 1]? sections[i + 1].bar - section.bar : lastBar - section.bar + 1;
        });

        return sections;
    }

    getSectionElements() {
        const chordLeadSheet = this.getChordLeadSheetElement();
        if (!chordLeadSheet) {
            return [];
        }

        return Array.from(chordLeadSheet.querySelectorAll(":scope > spItems > CLI__SectionImpl"));
    }

    getSongPartEndBar(songPart) {
        const startBar = Number(songPart.getAttribute("spStartBarIndex"));
        const numberOfBars = Number(songPart.getAttribute("spNbBars"));
        return startBar + numberOfBars;
    }

    // =========================================================
    // Chords - Hilfsmethoden
    // =========================================================
    getChordElements() {
        return this.getDocument()
        .querySelectorAll("CLI__ChordSymbolImpl");
    }

    findChord(bar, position) {
        for (const element of this.getChordElements()) {
            const elementPosition = this.getElementPosition(element);
            if (!elementPosition) {
                continue;
            }

            if (elementPosition.bar === bar &&
                elementPosition.position === position) {
                return element;
            }

        }

        return null;
    }

/*
    getChordName(element) {
        let chordElement = element.querySelector(":scope > spChord");
        if (!chordElement) return null;

        const reference = chordElement.getAttribute("reference");
        if (reference) {
            const match = reference.match(/^\.\.\/\.\.\/(CLI__ChordSymbolImpl\[\d+\]\/spChord)$/);
            if (!match) return null;

            const index = Number(
                match[1].match(/\[(\d+)\]/)[1]
            );
            const chords = this.getChordElements();
            chordElement = chords[index - 1]?.querySelector(":scope > spChord");
            if (!chordElement) return null;
        }

        return chordElement.getAttribute("spOriginalName")|| chordElement.getAttribute("spName");
    }*/
    getChordName(element) {
        const chordElement = element.querySelector(":scope > spChord");
        if (!chordElement) {
            return null;
        }

        if (chordElement.hasAttribute("spOriginalName")) {
            return chordElement.getAttribute("spOriginalName");
        }

        return chordElement.getAttribute("spName");
    }

    resolveChordReferences() {
        const chords = this.getChordElements();
        let docChanged = false;
        for (const chord of chords) {
            const spChord = chord.querySelector(
                ":scope > spChord[reference]"
            );
            if (!spChord) continue;

            const reference = spChord.getAttribute("reference");
            const match = reference.match(
                /^\.\.\/\.\.\/CLI__ChordSymbolImpl\[(\d+)\]\/spChord$/
            );
            if (!match) continue;

            const target = chords[Number(match[1]) - 1]
                ?.querySelector(":scope > spChord");
            if (!target || target.hasAttribute("reference")) {
                continue;
            }

            const copy = target.cloneNode(true);
            spChord.replaceWith(copy);
            docChanged = true;
        }
        
        if(docChanged){
            this.updateXml();
        }
    }

    validateChord(name) {
        let chord;
        try {
            chord = ExtChordSymbol.get(name, ChordTypeDatabase.getDefault());
        } catch (error) {
            throw new Error("Ungültiger Akkord: " +
                name +
                " (" +
                error.message +
                ")");
        }

        if (!chord) {
            throw new Error("Ungültiger Akkord: " +
                name);
        }

        /*
         * JJazzLab-Namen zurück geben
         */
        const chordName = chord.toString();
        return (chordName);
    }

    setChordName(element, name) {
        const chordName = this.validateChord(name);
        const chordElement = element.querySelector(":scope > spChord");
        if (!chordElement) {
            throw new Error("ChordElement not found: " + element);
        }

        chordElement.setAttribute("spName", chordName);
        chordElement.setAttribute("spOriginalName", chordName);
        return chordName;
    }

    setChordPosition(element, bar, position = undefined) {
        const positionElement = element.querySelector(":scope > spPos");
        if (!positionElement) {
            return false;
        }
        
        if(position==undefined){
            const pos = this.getElementPosition(element);
            position = pos.position;
        }

        positionElement.setAttribute("spPos", `[${bar}:${position}]`);
        return true;
    }

    cloneChord(name, bar, position) {
        const chords = this.getChordElements();
        if (chords.length === 0) {
            return null;
        }

        const template = chords[
                chords.length - 1
            ];
        const newChord = template.cloneNode(true);
        
        if(name!=undefined){
            if (!this.setChordName(newChord, name)) {
                return null;
            }
        }

        if (!this.setChordPosition(newChord, bar, position)) {
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
            const position = this.getElementPosition(element);
            const name = this.getChordName(element);
            if (!position || !name) {
                continue;
            }

            chords.push({
                bar: position.bar, position: position.position, name: name, element: element
            });
        }

        chords.sort((a,b)=>a.bar-b.bar);
        return chords;
    }

    // =========================================================
    // Chords - ändern
    // =========================================================
    setChord(bar, position, name) {
        const chord = this.findChord(bar, position);
        if (!chord) {
            return;
        }

        const cordName = this.setChordName(chord, name);
        this.updateXml();
        return (cordName);
    }

    removeChord(bar, position) {

        const chords = this.getChords();
        const sections = this.getSections();

        if(chords.length==1){
            throw new Error("Last chord can not be removed.");
        }
        
        
        const chord = chords.find(c=>c.bar===bar&&c.position===position);
 
        if (!chord) {
            return;
        }

        const section = sections.find(s => chord.bar >= s.bar && chord.bar < s.bar + s.length);
        const noMoreChordsInSection = chords.filter(c=> c.bar >= section.bar && c.bar < section.bar + section.length).length==1;

        chord.element.remove();
        
        if(noMoreChordsInSection){
            this.removeSongPart(bar, true);
        }
        
        if(chords.filter(c=>c.bar===bar).length==1){
            console.log(`No more chords in bar ${bar}, this bar will be removed.`);
            this.shiftChordsFromBar(bar, -1);
            this.shiftSectionsFromBar(bar + 1,-1);
            this.updateSongPartData();
        }
        this.updateXml();
    }

    removeChords(fromBar, toBar = undefined) {
        const chords = this.getChords();
        const chordsToRemove = chords.filter(c =>
            c.bar >= fromBar &&
            (toBar === undefined || c.bar <= toBar)
        );

        for (const chord of chordsToRemove) {
            chord.element.remove();
        }

        if (toBar !== undefined) {
            const delta = toBar - fromBar;
            this.shiftChordsFromBar(fromBar, -delta);
            this.shiftSectionsFromBar(fromBar + 1, -delta);
        }

        this.updateSongPartData();
        this.updateXml();
    }

    insertChordAsNewBar(bar, chordName, shiftElements = true) {
        
        if(chordName!=undefined){
            chordName = this.validateChord(chordName);
        }
        
        const newChord = this.cloneChord(chordName, bar, 0);
        if (!newChord) {
            return;
        }


        if(shiftElements){
            // Shift all chords by one
            this.shiftChordsFromBar(bar);
            // Shift all Sections by one
            this.shiftSectionsFromBar(bar);
        }

        const chords = this.getChords();
        const chordBefore = chords.filter(c=>c.bar >= bar).sort((a, b) => a.bar - b.bar)[0];

        const parent = chords[0].element.parentElement;
        if (chordBefore) {
            parent.insertBefore(newChord, chordBefore.element);
        } else {
            parent.appendChild(newChord);
        }

        // Todo:
        // Call a method to Update the bar and length of all songparts
        // this.updateSongPartData();
        this.ensureSongSize();
        this.updateSongPartData();
        // Update the songlength according to this
        this.updateXml();
        
        return chordName;
    }

    insertChord(bar, position, name) {
        const newChord = this.cloneChord(name, bar, position);
        if (!newChord) {
            return;
        }

        const chords = this.getChordElements();
        let insertBefore = null;
        for (const chord of chords) {
            const existingPosition = this.getElementPosition(chord);
            if (!existingPosition) {
                continue;
            }

            if (existingPosition.bar > bar ||
                (existingPosition.bar === bar &&
                    existingPosition.position > position)) {
                insertBefore = chord;
                break;
            }

        }

        const parent = chords[0].parentElement;
        if (insertBefore) {
            parent.insertBefore(newChord, insertBefore);
        } else {
            parent.appendChild(newChord);
        }

        this.ensureSongSize();
        this.updateXml();
    }

    addElement(name) {
        if (name.toLowerCase() === "sp") {
            this.addSongPart();
        } else {
            return (this.addChord(name));
        }
    }
    
    insertElement(bar, name){
        if (name.toLowerCase() === "sp") {
           return(this.addSongPart(bar));
        } else {
            return (this.insertChordAsNewBar(bar, name));
        }
    }

    addChord(chordName=undefined, shiftElements = true) {
        
        if(chordName!=undefined){
            chordName = this.validateChord(chordName);
        }
        
        const songParts = this.getSongParts();
        const lastSongPart = songParts.at(-1);
        // Is the last songpart used more than once? Than it is readonly!
        const readOnly = (songParts.filter(s=>s.name === lastSongPart.name).length > 1);

        if(readOnly){
            // We need a new songpart first to add the chord.
            return this.addSongPart(undefined, chordName);
        }else{
            const lastSection = this.getSections().find(s=>s.name === lastSongPart.name);
            const bar = lastSection.bar + lastSection.length;
            return this.insertChordAsNewBar(bar, chordName, shiftElements);            
        }
        
        return chordName;
    }

    moveChord(bar,position,beat = 1){
        const chord = this.findChord(bar, position);
        if (!chord) {
            return;
        }
        this.setChordPosition(chord, bar, position + beat) 
        this.updateXml();
    }

    splitChord(bar, position, value) {
        const names = value.trim().split(/\s+/);
        if (names.length !== 2) {
            return;
        }

        const firstName = names[0];
        const secondName = names[1];
        if (firstName.trim().toLowerCase() == "sp") {
            this.addSongPart(bar);
        } else {
            // Position 0:
            // Zuerst versuchen wir Position 2.
            // Falls diese belegt ist, versuchen wir Position 1.
            if (position === 0) {
                this.setChord(bar, position, firstName);
                if (!this.findChord(bar, 2)) {
                    this.insertChord(bar, 2, secondName);
                    return;
                }

                if (!this.findChord(bar, 1)) {
                    this.insertChord(bar, 1, secondName);
                    return;
                }

                alert("Der Akkord kann nicht gesplittet werden, " +
                    "weil im Takt keine freie Position mehr vorhanden ist.");
                return;
            }

            // Position 2:
            // Der zweite Akkord kommt auf Position 3.
            if (position === 2) {
                this.setChord(bar, position, firstName);
                if (!this.findChord(bar, 3)) {
                    this.insertChord(bar, 3, secondName);
                    return;
                }

                alert("Der Akkord kann nicht gesplittet werden, " +
                    "weil im Takt keine freie Position mehr vorhanden ist.");
                return;
            }

            // Position 3:
            // Der zweite Akkord beginnt im nächsten Takt.
            if (position === 3) {
                const newBar = bar + 1;
                this.shiftChordsFromBar(newBar);
                this.setChord(bar, position, firstName);
                this.insertChord(newBar, 0, secondName);
                this.extendSongByOneBar();
                return;
            }

        }

    }

    shiftChordsFromBar(startBar, cnt = 1) {
        for (const chord of this.getChordElements()) {
            const position = this.getElementPosition(chord);
            if (!position) {
                continue;
            }

            if (position.bar >= startBar) {
                this.setChordPosition(chord, position.bar + cnt, position.position);
            }

        }

    }

    shiftSectionsFromBar(bar, cnt = 1) {
        const sections = this.getSectionElements();
        for (const section of sections) {
            const sectionBar = Number( section.getAttribute( "spBarIndex"));

            if (sectionBar >= bar) {
                section.setAttribute("spBarIndex", sectionBar + cnt);
            }
        }
    }
    
    // =========================================================
    // Song-Größe / SongParts
    // =========================================================
    getSongSize() {
        const chordLeadSheet = this.getDocument()
            .querySelector("spChordLeadSheet");
        if (!chordLeadSheet) {
            return;
        }

        const sizeElement = chordLeadSheet.querySelector(":scope > spSize");
        if (!sizeElement) {
            return;
        }

        return (Number(sizeElement.textContent));
    }

    setSongSize(size) {
        const chordLeadSheet = this.getDocument()
            .querySelector("spChordLeadSheet");
        if (!chordLeadSheet) {
            return;
        }

        const sizeElement = chordLeadSheet.querySelector(":scope > spSize");
        if (!sizeElement) {
            return;
        }

        const currentSize = Number(sizeElement.textContent);
        sizeElement.textContent = String(size);
    }

    ensureSongSize(size = undefined) {
        
        if(size== undefined){
            size = this.getChords().at(-1).bar + 1;
        }
        
        const currentSize = this.getSongSize();
        if (currentSize < size) {
            this.setSongSize(size);
        }

    }

    getSongPartElements() {
        const songStructure = this.getSongStructureElement();
        if (!songStructure) {
            return [];
        }

        return Array.from(songStructure.querySelectorAll(":scope > spSpts > SongPartImpl"));
    }

    getSectionForSongPart(songPart) {
        if (!songPart) {
            return null;
        }

        const songPartName = songPart.getAttribute("spName");
        const sections = this.getSectionElements();
        for (const section of sections) {
            const sectionName = section.getAttribute("spName");
            if (sectionName === songPartName) {
                return section;
            }

        }

        return null;
    }

    getSongPartElement(startBar) {
        for (const element of this.getSongPartElements()) {
            if (Number(element.getAttribute("spStartBarIndex")) === startBar) {
                return element;
            }

        }

        return null;
    }

    extendLastSongPartTo(endBar) {
        const songParts = this.getSongPartElements();
        if (songParts.length === 0) {
            return;
        }

        const lastSongPart = songParts[
                songParts.length - 1
            ];
        const startBar = Number(lastSongPart.getAttribute("spStartBarIndex"));
        const numberOfBars = Number(lastSongPart.getAttribute("spNbBars"));
        const currentEnd = startBar + numberOfBars;
        if (currentEnd < endBar) {
            lastSongPart.setAttribute("spNbBars", String(endBar - startBar));
        }

    }

    getUniqueSongPartName() {
        const existingNames = this.getSongPartElements()
            .map(songPart =>
                songPart.getAttribute("spName"));
        const partNames = existingNames.filter(name =>
                /^[A-Z]+$/.test(name));
        if (partNames.length === 0) {
            return "A";
        }

        /*
         * Buchstabenfolge in eine Zahl umwandeln:
         * A=1, B=2, ..., Z=26, AA=27, ...
         */
        const toNumber = name => {
            let number = 0;
            for (const char of name) {
                number = number * 26 +
                    char.charCodeAt(0) -
                    64;
            }

            return number;
        };
        const highest = Math.max(...partNames.map(toNumber));
        /*
         * Zahl wieder in Buchstabenfolge umwandeln.
         */
        const toLetters = number => {
            let result = "";
            while (number > 0) {
                number--;
                result = String.fromCharCode(65 + number % 26) +
                    result;
                number = Math.floor(number / 26);
            }

            return result;
        };
        return toLetters(highest + 1);
    }

    addSongPart(startBar = undefined, chordName = undefined) {

        const appendAtEnd = startBar === undefined;
        const songParts = this.getSongParts();

        if (songParts.length === 0) {
            return false;
        }

        /*
         * Einfügeposition und Vorlage bestimmen.
         */
        let previousSongPart;
        if (appendAtEnd) {
            const chords = this.getChordElements();
            if (chords.length === 0) {
                return false;
            }
            const lastChord = this.getElementPosition(chords[chords.length - 1]);

            if (!lastChord) {
                return false;
            }

            startBar = lastChord.bar + 1;
            previousSongPart = songParts[songParts.length - 1];

            //if (!this.extendSongByOneBar()) {
            //    return false;
            //}

        } else {

            previousSongPart = songParts.filter(p => p.startBar <= startBar)
                                               .sort((a, b) => b.startBar - a.startBar)[0];

            if (!previousSongPart) {
                return false;
            }
            
            
            
        }

        /*
         * Namen bestimmen.
         */
        let name = this.getUniqueSongPartName("New Part");

        /*
         * Section-Vorlage ermitteln.
         */

        const sectionTemplate = this.getSectionForSongPart(previousSongPart.element);

        if (!sectionTemplate) {
            return false;
        }

        if(previousSongPart.startBar == startBar){
            this.shiftSectionsFromBar(startBar, 1);
            this.shiftChordsFromBar(startBar, 1);
            previousSongPart.element.setAttribute("spStartBarIndex", String(startBar + 1));
        }
 
        /*
         * Neue Section erzeugen.
         */

        const newSection = sectionTemplate.cloneNode(true);

        newSection.setAttribute("spName", name);
        newSection.setAttribute("spBarIndex", String(startBar));

        /*
         * Neuen SongPart erzeugen.
         */

        const newSongPart = previousSongPart.element.cloneNode(true);

        newSongPart.setAttribute("spName", name);
        newSongPart.setAttribute("spStartBarIndex", String(startBar));

        /*
         * Elemente einfügen.
         */

        if (!this.insertSection(newSection)) {
            return false;
        }

        if (!this.insertSongPart(newSongPart)) {
            newSection.remove();
            return false;
        }

       if(previousSongPart.startBar == startBar){
           this.insertChordAsNewBar(startBar, undefined, false);
        }
 
        /*
         * Referenzen und SongPart-Daten
         * aktualisieren.
         */

        this.updateSongPartSectionReferences();

        if(appendAtEnd){
            this.addChord(chordName, false);
        }

        this.updateSongPartData();
        this.updateXml();

        return true;
    }

    insertSongPart(songPart) {
        const songStructure = this.getSongStructureElement();
        if (!songStructure) {
            return false;
        }

        const spts = songStructure.querySelector(":scope > spSpts");
        if (!spts) {
            return false;
        }

        const startBar = Number(songPart.getAttribute("spStartBarIndex"));
        for (const existingPart
            of this.getSongPartElements()) {
            const existingStart = Number(existingPart.getAttribute("spStartBarIndex"));
            if (existingStart > startBar) {
                spts.insertBefore(songPart, existingPart);
                return true;
            }

        }

        spts.appendChild(songPart);
        return true;
    }

    insertSection(section) {
        const chordLeadSheet = this.getChordLeadSheetElement();
        if (!chordLeadSheet) {
            return false;
        }

        const items = chordLeadSheet.querySelector(":scope > spItems");
        if (!items) {
            return false;
        }

        const startBar = Number(section.getAttribute("spBarIndex"));
        for (const existingSection
            of this.getSectionElements()) {
            const sectionBar = Number(existingSection.getAttribute("spBarIndex"));
            if (sectionBar > startBar) {
                items.insertBefore(section, existingSection);
                return true;
            }

        }

        items.appendChild(section);
        return true;
    }

    removeSongPart(startBar, forceRemove = false) {

        if (startBar === 0 && !forceRemove) {
            throw new Error("First SongPart can not be removed.");
        }

        const songParts = this.getSongParts();
        const songPart = songParts.find(p=>p.startBar===startBar);
        if (!songPart) {
            return false;
        }

        // If section is not used in other songpart, delete section.
        if(songParts.filter(p=>p.name===songPart.name)==1){
            const section = this.getSectionForSongPart(songPart.element);
            if (section) {
                section.remove();
            }
        }

        //delete songpart
        songPart.element.remove();

        this.updateSongPartData();
        this.updateXml();
        return true;
    }

    renameSongPart(startBar, name){
        const songParts = this.getSongParts();
        const songPart = songParts.find(p=>p.startBar===startBar);
        const sections = this.getSections();
        
        const oldSection = sections.find(s=>s.name===songPart.name);
        const existingSection = sections.find(s=>s.name===name);
        const oldSectionUsedMoreThanOnce = (songParts.filter(s=>s.name===songPart.name).length > 1);
        
        // Set new SongPartName
        songPart.element.setAttribute("spName", name.trim());
        
        if (oldSection){
            if (existingSection && !oldSectionUsedMoreThanOnce) {
                // SongPart was moved to existing section,
                // old section was only used by this song part
                // so the old section should be removed
                oldSection.element.remove();
                if(oldSection.length==undefined){
                    this.removeChords(oldSection.bar);
                }else{
                    this.removeChords(oldSection.bar, oldSection.bar + oldSection.length - 1);
                }
            } else {
                if(oldSectionUsedMoreThanOnce){
                    // Create a copy to split the sections up
                    const cloneSection = oldSection.element.cloneNode(true);
                    const chords = this.getChords();
                    const lastBar = (chords.sort((a, b) => b.bar - a.bar)[0]).bar;
                    const oldSectionEndBar = oldSection.length!=undefined?(oldSection.bar + oldSection.length):lastBar;
                    const sectionChords = chords.filter(c=>c.bar>=oldSection.bar && c.bar <= oldSectionEndBar);
                    const offset = lastBar - oldSection.bar + 1;
                    
                    for(const chord of sectionChords){
                        const cloneChord = chord.element.cloneNode(true);
                        this.setChordPosition(cloneChord, chord.bar + offset);                            
                        chord.element.parentNode.appendChild(cloneChord);
                    }
                    cloneSection.setAttribute("spBarIndex", lastBar + 1);
                    oldSection.element.parentNode.appendChild(cloneSection);                    
                }
                // Rename old section
                oldSection.element.setAttribute("spName", name.trim());
                    /*
                    if (timeSignature !== undefined &&
                        timeSignature !== "") {
                        oldSection.setAttribute("spTs", timeSignature);
                    }*/
            }
        }
        
        this.updateSongPartData();
        this.updateSongPartSectionReferences();

    }

    updateSongPartSectionReferences() {
        const songParts = this.getSongPartElements();
        const sections = this.getSectionElements();
        /*
         * Für jeden SongPart die Section
         * anhand des Namens bestimmen.
         */
        for (const songPart of songParts) {
            const name = songPart.getAttribute("spName");
            const section = sections.find(section =>
                    section.getAttribute("spName") === name);
            if (!section) {
                console.warn("Keine Section für SongPart gefunden.", name);
                continue;
            }

            /*
             * Position der Section im XML bestimmen.
             *
             * Die erste Section wird ohne Index
             * referenziert.
             */
            const sectionIndex = sections.indexOf(section);
            let reference = "../../../../spChordLeadSheet/" +
                "spItems/CLI__SectionImpl";
            if (sectionIndex > 0) {
                reference += `[${sectionIndex + 1}]`;
            }

            /*
             * spParentSection suchen.
             */
            const parentSection = songPart.querySelector(":scope > spParentSection");
            if (!parentSection) {
                console.warn("SongPart besitzt kein spParentSection.", songPart);
                continue;
            }

            /*
             * Referenz aktualisieren.
             */
            parentSection.setAttribute("reference", reference);
        }

        return true;
    }

    extendSongByOneBar() {
        const songParts = this.getSongPartElements();
        if (songParts.length === 0) {
            return;
        }

        const lastSongPart = songParts[
                songParts.length - 1
            ];
        const startBar = Number(lastSongPart.getAttribute("spStartBarIndex"));
        const numberOfBars = Number(lastSongPart.getAttribute("spNbBars"));
        lastSongPart.setAttribute("spNbBars", String(numberOfBars + 1));
    }

    getTimeline() {
        const timeline = [];
        const sections = this.getSections();
        const chords = this.getChords();
        const songParts = this.getSongParts();
        /*
         * Bereits verwendete Sections merken.
         */
        const usedSections = new Set();
        /*
         * SongParts durchlaufen.
         */
        for (const songPart of songParts) {
            const xmlSongPart = songPart.element;
            const rhythmId = xmlSongPart
                 ? xmlSongPart.getAttribute("spRhythmId")
                 : "";
            /*
             * SongPart in die Timeline aufnehmen.
             */
            timeline.push({
                type: "songPart", bar: songPart.startBar, name: songPart.name, numberOfBars: songPart.numberOfBars, rhythmName: songPart.rhythmName, rhythmId: rhythmId, variation: songPart.variation
            });
            /*
             * Zugehörige Section suchen.
             */
            const section = sections.find(section => section.name === songPart.name);
            if (!section) {
                continue;
            }

            /*
             * Prüfen, ob die Section bereits
             * vorher verwendet wurde.
             */
            const readonly = section.isUsed || false;
            /*
             * Ende der Section bestimmen.
             *
             * Die nächste Section markiert das
             * Ende des aktuellen Bereichs.
             */
            const sectionIndex = sections.indexOf(section);
            const nextSection = sections[sectionIndex + 1];
            /*
             * Chords dieser Section bestimmen.
             */
            for (const chord of chords) {
                if (chord.bar < section.bar) {
                    continue;
                }

                if (chord.bar >= section.bar + section.length) {
                    continue;
                }

                /*
                 * Position innerhalb der Section.
                 */
                const offset = chord.bar - section.bar;
                /*
                 * Position im tatsächlich
                 * gespielten Song.
                 */
                const playedBar = songPart.startBar + offset;
                timeline.push({
                    type: "chord", bar: playedBar, chordBar: chord.bar, position: chord.position, name: chord.name, readonly: readonly, });
            }

            if (!section.isUsed) {
                section.isUsed = true;
            }

        }

        /*
         * Chronologisch sortieren.
         *
         * Bei gleichem Takt kommt der
         * SongPart vor dem Chord.
         */
        timeline.sort((a, b) => {
            if (a.bar !== b.bar) {
                return a.bar - b.bar;
            }

            if (a.type === "songPart" &&
                b.type === "chord") {
                return -1;
            }

            if (a.type === "chord" &&
                b.type === "songPart") {
                return 1;
            }

            if (a.type === "chord" &&
                b.type === "chord") {
                return a.position - b.position;
            }

            return 0;
        });
        return timeline;
    }

    // =========================================================
    // SongParts - lesen
    // =========================================================
    getSongParts() {
        const songParts = [];
        for (const element of this.getSongPartElements()) {
            const name = element.getAttribute("spName");
            const startBar = Number(element.getAttribute("spStartBarIndex"));
            const numberOfBars = Number(element.getAttribute("spNbBars"));
            const rhythmNameElement = element.querySelector(":scope > spRhythmName");
            const rhythmName = rhythmNameElement
                 ? rhythmNameElement.textContent
                 : "";
            const variation = this.getSongPartVariation(element);
            songParts.push({
                name: name || "", startBar: startBar, numberOfBars: numberOfBars, rhythmName: rhythmName, variation: variation, element: element
            });
        }

        songParts.sort((a,b)=>a.startBar-b.startBar);

        return songParts;
    }

    getSongPartVariation(songPart) {
        const entries = songPart.querySelectorAll(":scope > spHashMapRpIdValue > entry");
        for (const entry of entries) {
            const strings = entry.querySelectorAll(":scope > string");
            if (strings.length < 2) {
                continue;
            }

            if (strings[0].textContent === "rpVariationID") {
                return strings[1].textContent;
            }

        }

        return "";
    }

    setSongPartVariation(songPart, variation) {
        const entries = songPart.querySelectorAll(":scope > spHashMapRpIdValue > entry");
        for (const entry of entries) {
            const strings = entry.querySelectorAll(":scope > string");
            if (strings.length < 2) {
                continue;
            }

            if (strings[0].textContent === "rpVariationID") {
                strings[1].textContent = variation;
                return;
            }

        }

        const hashMap = songPart.querySelector(":scope > spHashMapRpIdValue");
        if (!hashMap) {
            return;
        }

        const entry = this.getDocument()
            .createElement("entry");
        const key = this.getDocument()
            .createElement("string");
        key.textContent = "rpVariationID";
        const value = this.getDocument()
            .createElement("string");
        value.textContent = variation;
        entry.appendChild(key);
        entry.appendChild(value);
        hashMap.appendChild(entry);
    }

    setSongPart(startBar, name, rhythmName, variation, rhythmId = undefined, timeSignature = "FOUR_FOUR") {
        const songPart = this.getSongPartElement(startBar);
        if (!songPart) {
            return;
        }
        name = name.trim();

        if (name === "") {
            this.removeSongPart(startBar);
        } else {
            if(name!==songPart.getAttribute("spName")){
                this.renameSongPart(startBar,name);
            }
 
            if (rhythmId !== undefined &&
                rhythmId !== "") {
                songPart.setAttribute("spRhythmId", rhythmId);
            }

            if (timeSignature !== undefined &&
                timeSignature !== "") {
                songPart.setAttribute("spRhythmTs", timeSignature);
            }

            // Rhythmus-Name
            let rhythmNameElement = songPart.querySelector(":scope > spRhythmName");
            if (!rhythmNameElement) {
                rhythmNameElement = this.getDocument()
                    .createElement("spRhythmName");
                const parentSection = songPart.querySelector(":scope > spParentSection");
                songPart.insertBefore(rhythmNameElement, parentSection);
            }

            rhythmNameElement.textContent = rhythmName;
            // Variation
            this.setSongPartVariation(songPart, variation);
            // Client Property
            const properties = this.getSongElement()
                .querySelector(":scope > spClientPropertiesV3 > properties");
            if (properties) {
                const prefix = "PropCompactViewModeVisibleRps_";
                const entries = properties.querySelectorAll(":scope > entry");
                for (const entry of entries) {
                    const strings = entry.querySelectorAll(":scope > string");
                    if (strings.length < 2) {
                        continue;
                    }

                    const key = strings[0].textContent;
                    if (key.startsWith(prefix)) {
                        strings[0].textContent = prefix + rhythmId;
                        break;
                    }

                }

            }

            this.updateXml();
        }

    }
    // =========================================================
    // Name
    // =========================================================
    getName() {
        const song = this.getSongElement();
        if (song.hasAttribute("spName")) {
            return song.getAttribute("spName");
        }

        const nameElement = song.querySelector(":scope > spName");
        if (nameElement) {
            return nameElement.textContent;
        }

        return null;
    }

    setName(name) {
        name = name.trim();
        const song = this.getSongElement();
        // Bevorzugt die vorhandene
        // XML-Darstellung beibehalten.
        if (song.hasAttribute("spName")) {
            song.setAttribute("spName", name);
        } else {
            const nameElement = song.querySelector(":scope > spName");
            if (nameElement) {
                nameElement.textContent = name;
            } else {
                const newName = this.getDocument().createElement("spName");
                newName.textContent = name;
                song.appendChild(newName);
            }

        }

        this.updateXml();
    }

    // =========================================================
    // Tempo
    // =========================================================
    getTempo() {
        const song = this.getSongElement();
        if (song.hasAttribute("spTempo")) {
            return Number(song.getAttribute("spTempo"));
        }

        const tempoElement = song.querySelector(":scope > spTempo");
        if (tempoElement) {
            return Number(tempoElement.textContent);
        }

        return null;
    }

    setTempo(tempo) {
        const song = this.getSongElement();
        // Bevorzugt die vorhandene
        // XML-Darstellung beibehalten.
        if (song.hasAttribute("spTempo")) {
            song.setAttribute("spTempo", String(tempo));
        } else {
            const tempoElement = song.querySelector(":scope > spTempo");
            if (tempoElement) {
                tempoElement.textContent = String(tempo);
            } else {
                const newTempo = this.getDocument().createElement("spTempo");
                newTempo.textContent = String(tempo);
                song.appendChild(newTempo);
            }

        }

        this.updateXml();
    }

    updateSongPartData() {
        const sections = this.getSectionsWithLength();
        const songParts = this.getSongPartElements()
            .sort( (a, b) =>
                Number( a.getAttribute( "spStartBarIndex")) -
                Number( b.getAttribute( "spStartBarIndex")));
        let currentBar = 0;
        for (const songPart of songParts) {
            const name = songPart.getAttribute( "spName");
            const section = sections.find( section =>
                    section.name === name);
            if (!section) {
                console.warn( "Keine Section für SongPart:", name);
                continue;
            }

            songPart.setAttribute( "spStartBarIndex", currentBar);
            songPart.setAttribute( "spNbBars", section.length);
            currentBar += section.length;
        }

        return currentBar;
    }

    getSectionsWithLength() {
        const sections = this.getSections().sort( (a, b) => a.bar - b.bar);
        const chords = this.getChords().sort( (a, b) => a.bar - b.bar);
        for (let i = 0; i < sections.length; i++) {
            const section = sections[i];
            const nextSection = sections[i + 1];
            if (nextSection) {
                section.length = nextSection.bar - section.bar;
                continue;
            }

            /*
             * Letzte Section:
             * Länge anhand des letzten Akkords.
             */
            const sectionChords = chords.filter( chord => chord.bar >= section.bar);
            if (sectionChords.length === 0) {
                section.length = 0;
                continue;
            }

            const lastChord = sectionChords[sectionChords.length - 1];
            section.length = lastChord.bar - section.bar + 1;
        }

        return sections;
    }
}
