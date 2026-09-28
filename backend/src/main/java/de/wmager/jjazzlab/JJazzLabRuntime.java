package de.wmager.jjazzlab;

import java.util.logging.Logger;

import org.jjazz.rhythmdatabase.api.DefaultRhythmDatabaseImpl;
import org.jjazz.rhythmdatabase.api.RhythmDatabase;
import org.openide.util.NbPreferences;


/**

* Central runtime environment for JJazzLab Core.
*
* <p>Initializes and manages global JJazzLab components that are shared
* by multiple sessions. This currently includes the {@code RhythmDatabase}.</p>
*
* <p>Initialization is performed lazily and is thread-safe. Song-specific
* state such as {@code Song} and {@code MidiMix} is not stored here, but
* belongs to an individual
* {@link de.wmager.jjazzlab.session.JJazzLabSession}.</p>
  */
public class JJazzLabRuntime {

    private static final Logger LOGGER =
            Logger.getLogger(JJazzLabRuntime.class.getName());

    private static DefaultRhythmDatabaseImpl rhythmDatabase;


    // ========================================================================
    // Initialisierung
    // ========================================================================

    public static synchronized void initialize() {

        if (rhythmDatabase != null) {
            return;
        }

        LOGGER.info(
            "Initialisiere JJazzLab Runtime..."
        );

        rhythmDatabase =
            new DefaultRhythmDatabaseImpl(
                NbPreferences.forModule(
                    JJazzLabRuntime.class
                )
            );

        rhythmDatabase.addRhythmsFromRhythmProviders(
            false,
            false,
            false
        );

        LOGGER.info(
            "RhythmDatabase initialisiert: " +
            rhythmDatabase.toStatsString()
        );
    }


    // ========================================================================
    // RhythmDatabase
    // ========================================================================

    public static RhythmDatabase getRhythmDatabase() {

        initialize();

        return rhythmDatabase;
    }
}