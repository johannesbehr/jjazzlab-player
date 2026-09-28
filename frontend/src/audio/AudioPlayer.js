import {
    WorkletSynthesizer,
    Sequencer
} from "spessasynth_lib";


export class AudioPlayer {

    constructor(processorUrl, soundFont) {

        this.processorUrl = processorUrl;
        this.soundFont = soundFont;
        this.audioContext = null;
        this.synth = null;
        this.sequencer = null;
        
    }


    async initialize(soundFont) {

        if (this.synth) {
            return;
        }

        this.audioContext =new AudioContext();
            //  new AudioContext({
          //      sampleRate: 44100
          //  });


        await this.audioContext.audioWorklet.addModule(
            this.processorUrl
        );


        this.synth =
            new WorkletSynthesizer(
                this.audioContext
            );


        this.synth.connect(
            this.audioContext.destination
        );

        await this.synth.soundBankManager
            .addSoundBank(
                this.soundFont,
                "main"
            );


        await this.synth.isReady;

        this.sequencer =
            new Sequencer(
                this.synth
            );


        await this.audioContext.resume();
    }


    async play(midi) {

        await this.initialize();


        this.sequencer.loadNewSongList([
            {
                binary: midi,
                fileName: "JJazzLab.mid"
            }
        ]);


        this.sequencer.play();
    }


    stop() {
       if (!this.sequencer) {
            return;
        }

        if (!this.sequencer.paused) {
            this.sequencer.pause();
        }

        this.sequencer.currentTime = 0;
    }


    isInitialized() {

        return this.sequencer !== null;
    }
}