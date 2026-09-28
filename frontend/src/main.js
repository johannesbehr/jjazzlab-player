import { JJazzLabApi } from "./api/JJazzLabApi.js";
import { AudioPlayer } from "./audio/AudioPlayer.js";
import { SoundFontCache } from "./audio/SoundFontCache.js";
import { SongModel } from "./model/SongModel.js";
import { PlayerUI } from "./ui/PlayerUI.js";
import { XmlEditor } from "./ui/XmlEditor.js";
import { PlayerApplication } from "./app/PlayerApplication.js";
import { SongEditor } from "./ui/SongEditor.js";
import { MobileMenu } from "./ui/MobileMenu.js";
import { menuDefinition } from "./menuDefinition.js";

const api =
    new JJazzLabApi(
        "/java/jjazzlab/api"
    );

const mobileMenuContainer =
    document.getElementById("mobileMenu");

const soundFontStatus =
    document.getElementById(
        "soundFontStatusText"
    );

const soundFontProgress =
    document.getElementById(
        "soundFontProgress"
    );

const soundFontCache =
    new SoundFontCache();

const soundFont =
    await soundFontCache.getOrFetch(
        "JJazzLab.sf3.v1",
        "./soundfonts/JJazzlab.sf3",
        //"./soundfonts/soundfont_big.sf2",
        (percent, message) => {

            soundFontStatus.textContent =
                message;

            soundFontProgress.style.width =
                `${percent}%`;
        }
    );
    
        document.getElementById(
        "soundFontStatus"
    ).style.display = "none";


const audioPlayer =
    new AudioPlayer(
        "./lib/spessasynth_processor.min.js",
        soundFont    
    );

const song =
    new SongModel();


const ui =
    new PlayerUI();

const mobileMenu =
    new MobileMenu(
        mobileMenuContainer,
        menuDefinition,
        onMenuAction
    );

const xmlEditor =
    new XmlEditor(
        ui.rawXmlContainer,
        ui.rawXml,
        ui.rawXmlButton,
        ui.fileInput
    );

const songEditor =
    new SongEditor(
        ui.songEditorContainer
    );

const application =
    new PlayerApplication(
        api,
        audioPlayer,
        song,
        ui,
        xmlEditor,
        songEditor
    );

function onMenuAction(action) {

    switch (action) {

        case "Song_New":
            application.loadDefaultSong();
            break;

        case "Song_Load":
            ui.fileInput.click();
            break;

        case "Song_Save":
            application.downloadSong();
            break;
            
        case "Song_Export_Midi":
            application.downloadMidi();
            break;
            
            
        case "Show_About":
            ui.showAbout();
            break;

        default:
            console.warn(
                "Unbekannte Menüaktion:",
                action
            );
    }
}


application.initialize();