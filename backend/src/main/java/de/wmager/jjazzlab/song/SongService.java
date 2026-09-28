package de.wmager.jjazzlab.song;

import java.io.File;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.StandardCopyOption;

import de.wmager.jjazzlab.session.JJazzLabSession;

/**
 * Provides server-side operations for JJazzLab songs.
 *
 * <p>The service contains the application logic for creating,
 * loading, uploading and saving songs. HTTP-specific communication
 * is handled by the corresponding servlet.</p>
 */
public class SongService {

    private static final File SONG_ROOT =
            new File("/opt/jjazzlab-data/songs");

    private static final String DEFAULT_SONG =
            "NewSong.sng";


    /**
     * Creates a new empty song in the specified session.
     *
     * @param session the target session
     * @param name the name of the new song
     * @throws Exception if the song cannot be created
     */
    public void createNewSong(
            JJazzLabSession session,
            String name)
            throws Exception {

        session.createEmptySong(name);
    }


    /**
     * Loads the default test song into the specified session.
     *
     * @param session the target session
     * @throws Exception if the song cannot be loaded
     */
    public void loadDefaultSong(
            JJazzLabSession session)
            throws Exception {

        File songFile =
                new File(
                        SONG_ROOT,
                        DEFAULT_SONG
                );

        if (!songFile.isFile()) {
            throw new IllegalStateException(
                    "Default song not found: " +
                    songFile.getAbsolutePath()
            );
        }

        session.loadSong(songFile);
    }


    /**
     * Returns the current song file of the session.
     *
     * @param session the target session
     * @return the current .sng file
     * @throws IllegalStateException if no song is loaded
     */
    public File getCurrentSong(
            JJazzLabSession session) {

        if (!session.hasSong()) {
            throw new IllegalStateException(
                    "The session contains no song."
            );
        }

        File songFile =
                session.getSongFile();

        if (!songFile.isFile()) {
            throw new IllegalStateException(
                    "Current song file does not exist."
            );
        }

        return songFile;
    }


    /**
     * Replaces the current song with a song received from the client.
     *
     * <p>The uploaded file is first written to a temporary file and
     * loaded by JJazzLab. The current song is only replaced after
     * successful validation.</p>
     *
     * @param session the target session
     * @param input the uploaded song data
     * @throws Exception if the upload or validation fails
     */
    public void uploadSong(
            JJazzLabSession session,
            InputStream input)
            throws Exception {

        File sessionDirectory =
                session.getSessionDirectory();

        File candidate =
                File.createTempFile(
                        "uploaded-",
                        ".sng",
                        sessionDirectory
                );

        try {

            Files.copy(
                    input,
                    candidate.toPath(),
                    StandardCopyOption.REPLACE_EXISTING
            );

            /*
             * JJazzLab validates and loads the uploaded song.
             * Only after this succeeds do we replace the current song.
             */
            session.loadSong(candidate);

        } finally {

            /*
             * loadSong() copies the candidate into currentsong.sng,
             * so the uploaded temporary file is no longer needed.
             */
            Files.deleteIfExists(
                    candidate.toPath()
            );
        }
    }
}