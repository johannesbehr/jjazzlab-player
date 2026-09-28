package de.wmager.jjazzlab.rhythm;

import de.wmager.jjazzlab.JJazzLabRuntime;

import java.util.List;

import org.jjazz.rhythmdatabase.api.RhythmDatabase;
import org.jjazz.rhythmdatabase.api.RhythmInfo;
import org.jjazz.rhythmdatabase.api.UnavailableRhythmException;
import org.jjazz.rhythm.api.Rhythm;
import org.jjazz.rhythmparametersimpl.api.RP_SYS_Variation;

/**
 * Provides access to the JJazzLab rhythm/style database.
 */
public class RhythmService {

    /**
     * Returns all rhythms available in the JJazzLab RhythmDatabase.
     */
    public List<RhythmInfo> getRhythms() {

        RhythmDatabase database =
                JJazzLabRuntime.getRhythmDatabase();

        return database.getRhythms();
    }


    /**
     * Returns the RhythmInfo for the specified rhythm id.
     */
    public RhythmInfo getRhythm(
            String rhythmId) {

        RhythmDatabase database =
                JJazzLabRuntime.getRhythmDatabase();

        return database.getRhythm(
                rhythmId
        );
    }


    /**
     * Returns the available variations
     * of the specified rhythm.
     */
    public List<String> getVariations(
            String rhythmId)
            throws UnavailableRhythmException {

        RhythmDatabase database =
                JJazzLabRuntime.getRhythmDatabase();

        Rhythm rhythm =
                database.getRhythmInstance(
                        rhythmId
                );

        if (rhythm == null) {
            return List.of();
        }

        RP_SYS_Variation variation =
                RP_SYS_Variation.getVariationRp(
                        rhythm
                );

        if (variation == null) {
            return List.of();
        }

        return variation.getPossibleValues();
    }
}