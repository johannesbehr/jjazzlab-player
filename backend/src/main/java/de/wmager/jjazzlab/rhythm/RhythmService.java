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
     * Returns all rhythms available in the JJazzLab RhythmDatabase as DTO
     */
    public List<RhythmDto> getRhythmDtos() {

        RhythmDatabase database =
                JJazzLabRuntime.getRhythmDatabase();

        return database.getRhythms()
                .stream()
                .map(this::toDto)
                .toList();
    }

    /**
     * Converts RhythmInfo into the API DTO.
     */
    private RhythmDto toDto(
            RhythmInfo rhythm) {

        String name =
                rhythm.name();

        String label =
                name;

        int dot =
                name.indexOf('.');

        if (dot >= 0) {
            label =
                    name.substring(
                            0,
                            dot
                    );
        }

        String timeSignature = formatTimeSignature(rhythm.timeSignature().toString());

        return new RhythmDto(
                name,
                label,
                rhythm.rhythmUniqueId(),
                timeSignature
        );
    }

	private String formatTimeSignature(String timeSignature) {

		return switch (timeSignature) {

			case "4/4" -> "FOUR_FOUR" ;
			case "3/4" -> "THREE_FOUR";
			case "2/4" -> "TWO_FOUR";
			case "5/4" -> "FIVE_EIGHT";
			case "6/4" -> "SIX_FOUR";
			case "7/4" -> "SEVEN_FOUR";
			case "6/8" -> "SIX_EIGHT";
			case "12/8" -> "TWELVE_EIGHT";
			default ->timeSignature;
		};
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