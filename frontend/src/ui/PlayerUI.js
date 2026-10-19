import { MessageBox } from "./MessageBox.js";

export class PlayerUI {

    constructor(mobileMenu) {

        this.fileInput = document.getElementById("fileInput");
        this.rawXmlButton = document.getElementById("rawXmlButton");
        this.playButton = document.getElementById("playButton");
        this.stopButton = document.getElementById("stopButton");
        this.status = document.getElementById("status");
        this.songName = document.getElementById("songName");
        this.rawXmlContainer = document.getElementById("rawXmlContainer");
        this.rawXml = document.getElementById("rawXml");
        this.tempoInput = document.getElementById("tempoInput");
        this.sizeInput = document.getElementById("sizeInput");
        this.songEditorContainer = document.getElementById("songEditorContainer");
        this.aboutContainer = document.getElementById("aboutContainer");
        this.aboutContainerHtml = document.getElementById("aboutContainerHtml");
        this.mainViewConatiner = document.getElementById("mainViewConatiner");
        this.messageBoxContainer = document.getElementById("messageBoxContainer");
        
        this.mobileMenu = mobileMenu;
        this.messageBox = new MessageBox(messageBoxContainer);
        
        this.closeAbout = document.getElementById("closeAbout");
        this.closeAbout.addEventListener(
            "click",() => { this.hideAbout();}
        );
        this.skipAbout = document.getElementById("skipAbout");
        
        this.showAbout(true);
    }

    async initialize() {
        await this.loadAbout();
    }

    async loadAbout() {

        const response = await fetch("./about.html");

        if (!response.ok) {
            throw new Error("About-Text konnte nicht geladen werden.");
        }

        this.aboutContainerHtml.innerHTML = await response.text();
    }


setCookie(name, value, days) {

    const expires = new Date();

    expires.setTime(
        expires.getTime() + days * 24 * 60 * 60 * 1000
    );

    document.cookie =
        `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}


getCookie(name) {

    const cookies = document.cookie.split(";");

    for (const cookie of cookies) {

        const [key, value] = cookie.trim().split("=");

        if (key === name) {
            return decodeURIComponent(value);
        }
    }

    return null;
}

    showAbout(startup = false){
        
        // Cookie gesetzt?
        const skipAbout_option = (this.getCookie("jjazzlab_about_seen") === "true");
        
        // About-Seite überspringen, wenn Cookie gesetzt ist
        if (startup && skipAbout_option) { 
            return; 
        }
        
        this.mainViewConatiner.style.display = "none";
        this.aboutContainer.removeAttribute("style");
        
        // Checkbox entsprechend dem Cookie setzen
        this.skipAbout.checked = skipAbout_option;
        this.mobileMenu.makeCloseButton(
        () =>{
            this.hideAbout();
        }
        );        
    }
    
    
    hideAbout(){
        
        // Einstellung speichern
        this.setCookie( "jjazzlab_about_seen", this.skipAbout.checked, 365 ); 
        
        this.mainViewConatiner.removeAttribute("style");
        this.aboutContainer.style.display ="none";
        
        // Sicher stellen dass das Menü wieder regulär funktioniert
        this.mobileMenu.close();
    }

    setStatus(text) {
        this.status.textContent = text;
    }


    setPlayEnabled(enabled) {
        this.playButton.disabled = !enabled;
    }

    setStopEnabled(enabled) {
        this.stopButton.disabled = !enabled;
    }

    getSelectedFile() {
        return this.fileInput.files[0];
    }

    clearFileSelection() {
        this.fileInput.value = "";
    }

    onLoadFile(callback) {
        this.fileInput.addEventListener(
            "change",
            callback
        );
    }

    onPlay(callback) {
        this.playButton.addEventListener(
            "click",
            callback
        );
    }

    onStop(callback) {
        this.stopButton.addEventListener(
            "click",
            callback
        );
    }

    onRawXml(callback) {
        this.rawXmlButton.addEventListener(
            "click",
            callback
        );
    }
}