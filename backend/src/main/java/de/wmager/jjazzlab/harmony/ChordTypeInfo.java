package de.wmager.jjazzlab.harmony;

import java.util.List;

public record ChordTypeInfo(
        String name,
        String base,
        String extension,
        String family,
        List<String> aliases,
        List<String> degrees
) {
}