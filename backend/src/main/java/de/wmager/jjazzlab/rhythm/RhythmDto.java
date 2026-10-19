package de.wmager.jjazzlab.rhythm;

/**
 * Rhythm information exposed by the web API.
 */
public record RhythmDto(
        String value,
        String label,
        String id,
        String timeSignature
) {
}