package de.wmager.jjazzlab.midi;

import java.io.File;
import java.nio.file.Files;

import org.jjazz.midimix.api.MidiMix;
import org.jjazz.musiccontrol.api.SongMidiExporter;
import org.jjazz.song.api.Song;

import de.wmager.jjazzlab.session.JJazzLabSession;

/**

* Service for exporting a JJazzLab song to a MIDI file.
*
* <p>The service uses the {@code Song} and {@code MidiMix} stored in a
* {@link de.wmager.jjazzlab.session.JJazzLabSession} and passes them
* to the JJazzLab {@code SongMidiExporter}.</p>
*
* <p>The generated MIDI data is written to a temporary file. The
* corresponding web servlet is responsible for transferring the file
* to the client and cleaning it up afterwards.</p>
  */
public class MidiExportService {


    // ========================================================================
    // Song als MIDI exportieren
    // ========================================================================

    public File export(JJazzLabSession session) throws Exception {

        if (!session.hasSong()) {

            throw new IllegalStateException(
                "Die Session enthält keinen geladenen Song."
            );
        }

        Song song =
            session.getSong();

        MidiMix midiMix =
            session.getMidiMix();

		// Make shure that the drums are routed correct
		try{
			midiMix.setDrumsReroutedChannel(true, 8);
		}catch(Exception ex){}

        // --------------------------------------------------------------------
        // Temporäre MIDI-Datei erzeugen
        // --------------------------------------------------------------------

        File midiFile =
            Files.createTempFile(
                "jjazzlab-",
                ".mid"
            ).toFile();


        // --------------------------------------------------------------------
        // JJazzLab MIDI Export
        // --------------------------------------------------------------------

        boolean success =
            SongMidiExporter.songToMidiFile(
                song,
                midiMix,
                midiFile,
                null
            );


        if (!success) {

            midiFile.delete();

            throw new Exception(
                "JJazzLab MIDI-Export fehlgeschlagen."
            );
        }


        return midiFile;
    }
}