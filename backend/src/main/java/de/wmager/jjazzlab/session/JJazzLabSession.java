package de.wmager.jjazzlab.session;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Comparator;
import java.util.UUID;

import org.jjazz.harmony.api.TimeSignature;
import org.jjazz.midimix.api.MidiMix;
import org.jjazz.midimix.spi.MidiMixManager;
import org.jjazz.song.api.Song;
import org.jjazz.song.spi.SongFactory;

import de.wmager.jjazzlab.JJazzLabRuntime;

/**
 * Represents a single server-side JJazzLab session.
 *
 * <p>A session owns a temporary workspace in which the current song
 * and other session-specific temporary files can be stored.</p>
 *
 * <p>The current song is stored as {@code currentsong.sng}. JJazzLab
 * is responsible for reading and writing the XML representation.</p>
 *
 * <p>Each session has a unique identifier and is managed by a
 * {@link SessionManager}.</p>
 *
 * <p>Sessions are currently kept in memory only and are therefore lost
 * when the server is restarted.</p>
 */
public class JJazzLabSession {

    private static final String CURRENT_SONG_FILE = "currentsong.sng";
	private static final File SESSION_ROOT = new File("/opt/jjazzlab-temp");

    private final String id;
    private final File sessionDirectory;

    private File songFile;
    private Song song;
    private MidiMix midiMix;

    public JJazzLabSession() {

        this.id =
                UUID.randomUUID().toString();

        try {

            this.sessionDirectory =
                    createSessionDirectory();

        } catch (IOException ex) {

            throw new RuntimeException(
                    "Could not create session directory.",
                    ex
            );
        }

        JJazzLabRuntime.initialize();
    }

    /**
     * Creates the temporary workspace for this session.
     *
     * @return the session workspace directory
     * @throws IOException if the directory cannot be created
     */
	private File createSessionDirectory()
			throws IOException {

		Files.createDirectories(
				SESSION_ROOT.toPath()
		);

		File directory =
				new File(
						SESSION_ROOT,
						id
				);

		Files.createDirectories(
				directory.toPath()
		);

		return directory;
	}

    public String getId() {

        return id;
    }

    /**
     * Creates a new empty JJazzLab song.
     *
     * <p>The song is initially created with 12 bars, a section named
     * {@code A}, and a 4/4 time signature.</p>
     *
     * @param name the name of the new song
     * @throws Exception if the song cannot be created or saved
     */
    public void createEmptySong(String name)
            throws Exception {

        Song newSong =
                SongFactory.getDefault()
                    .createEmptySong(
                        name,
                        12,
                        "A",
                        TimeSignature.FOUR_FOUR,
                        null
                    );

        File newFile =
                getCurrentSongFile();

        try {

            newSong.saveToFile(
                    newFile,
                    false
            );

            newSong.setFile(
                    newFile
            );

            MidiMix newMidiMix =
                MidiMixManager.getDefault()
                    .createMix(newSong);

            replaceSong(
                    newSong,
                    newMidiMix
            );

        } catch (Exception ex) {

            Files.deleteIfExists(
                    newFile.toPath()
            );

            throw ex;
        }
    }

    /**
     * Loads a JJazzLab song from a file.
     *
     * <p>The source file is copied into the current session workspace
     * as {@code currentsong.sng}. The original file is never modified.</p>
     *
     * @param file the source song file
     * @throws Exception if the song cannot be loaded
     */
    public void loadSong(File file)
            throws Exception {

        if (!file.exists()) {

            throw new IllegalArgumentException(
                    "Song file does not exist: " +
                    file.getAbsolutePath()
            );
        }

        File newFile =
                getCurrentSongFile();

        File backupFile =
                null;

        try {

            /*
             * If a current song exists, keep it until the new song
             * has been successfully loaded.
             */
            if (newFile.exists()) {

                backupFile =
                    File.createTempFile(
                            "song-backup-",
                            ".sng",
                            sessionDirectory
                    );

                Files.copy(
                        newFile.toPath(),
                        backupFile.toPath(),
                        StandardCopyOption.REPLACE_EXISTING
                );
            }

            Files.copy(
                    file.toPath(),
                    newFile.toPath(),
                    StandardCopyOption.REPLACE_EXISTING
            );

            Song newSong =
                SongFactory.getDefault()
                    .loadFromFile(newFile);

            newSong.setFile(
                    newFile
            );

            MidiMix newMidiMix =
                MidiMixManager.getDefault()
                    .createMix(newSong);

            replaceSong(
                    newSong,
                    newMidiMix
            );

            if (backupFile != null) {

                Files.deleteIfExists(
                        backupFile.toPath()
                );
            }

        } catch (Exception ex) {

            /*
             * Restore the previous song if loading failed.
             */
            if (backupFile != null &&
                backupFile.exists()) {

                Files.copy(
                        backupFile.toPath(),
                        newFile.toPath(),
                        StandardCopyOption.REPLACE_EXISTING
                );

                Files.deleteIfExists(
                        backupFile.toPath()
                );

            } else {

                Files.deleteIfExists(
                        newFile.toPath()
                );
            }

            throw ex;
        }
    }

    /**
     * Replaces the current in-memory song state.
     */
    private void replaceSong(
            Song newSong,
            MidiMix newMidiMix) {

        this.songFile =
                getCurrentSongFile();

        this.song =
                newSong;

        this.midiMix =
                newMidiMix;
    }

    /**
     * Returns the file containing the current song.
     *
     * @return the current song file
     */
    public File getSongFile() {

        return getCurrentSongFile();
    }

    private File getCurrentSongFile() {

        return new File(
                sessionDirectory,
                CURRENT_SONG_FILE
        );
    }

    /**
     * Returns the temporary workspace directory of this session.
     *
     * @return the session workspace directory
     */
    public File getSessionDirectory() {

        return sessionDirectory;
    }

    /**
     * Deletes the complete temporary workspace of this session.
     */
    public void delete()
            throws Exception {

        if (!sessionDirectory.exists()) {

            song = null;
            midiMix = null;
            songFile = null;

            return;
        }

        try (var paths =
                Files.walk(sessionDirectory.toPath())) {

            paths
                .sorted(Comparator.reverseOrder())
                .forEach(this::deletePath);
        }

        song = null;
        midiMix = null;
        songFile = null;
    }

    private void deletePath(Path path) {

        try {

            Files.deleteIfExists(path);

        } catch (IOException ex) {

            throw new RuntimeException(
                    "Could not delete: " + path,
                    ex
            );
        }
    }

    public Song getSong() {

        return song;
    }

    public MidiMix getMidiMix() {

        return midiMix;
    }

    public boolean hasSong() {

        return song != null;
    }
}