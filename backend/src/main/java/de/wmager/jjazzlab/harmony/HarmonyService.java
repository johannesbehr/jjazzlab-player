package de.wmager.jjazzlab.harmony;

import org.jjazz.harmony.api.ChordType;
import org.jjazz.harmony.api.Degree;
import org.jjazz.harmony.spi.ChordTypeDatabase;

import java.util.ArrayList;
import java.util.List;

public class HarmonyService {

    private final ChordTypeDatabase chordTypeDatabase =
            ChordTypeDatabase.getDefault();


    public List<ChordTypeInfo> getChordTypes() {

        List<ChordTypeInfo> result =
                new ArrayList<>();

        for (
                ChordType chordType
                : chordTypeDatabase.getChordTypes()
        ) {

            List<String> degrees =
                    new ArrayList<>();

            for (
                    Degree degree
                    : chordType.getDegrees()
            ) {

                degrees.add(
                        degree.toString()
                );
            }


            result.add(
                    new ChordTypeInfo(
                            chordType.getName(),
                            chordType.getBase(),
                            chordType.getExtension(),
                            chordType.getFamily().name(),
                            chordTypeDatabase.getAliases(
                                    chordType
                            ),
                            degrees
                    )
            );
        }

        return result;
    }
}