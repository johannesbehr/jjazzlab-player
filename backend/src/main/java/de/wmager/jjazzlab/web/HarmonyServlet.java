package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.harmony.ChordTypeInfo;
import de.wmager.jjazzlab.harmony.HarmonyService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;
import java.util.List;

@WebServlet("/api/harmony/*")
public class HarmonyServlet extends HttpServlet {

    private final HarmonyService harmonyService =
            new HarmonyService();


    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );


        try {

            String path =
                    request.getPathInfo();


            /*
             * /api/harmony
             *
             * Basis-Endpoint.
             */

            if (
                path == null ||
                path.equals("/") ||
                path.isEmpty()
            ) {

                response.sendError(
                        HttpServletResponse.SC_NOT_FOUND
                );

                return;
            }


            /*
             * /api/harmony/chordtypes
             *
             * Gibt alle von JJazzLab
             * bekannten ChordTypes zurück.
             */

            if (
                path.equals("/chordtypes")
            ) {

                writeChordTypes(
                        response
                );

                return;
            }


            /*
             * Unbekannter Endpoint.
             */

            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND
            );

        } catch (Exception ex) {

            throw new ServletException(
                    "Could not retrieve harmony data.",
                    ex
            );
        }
    }


    /**
     * Gibt alle JJazzLab ChordTypes als JSON zurück.
     */
    private void writeChordTypes(
            HttpServletResponse response)
            throws IOException {

        List<ChordTypeInfo> chordTypes =
                harmonyService.getChordTypes();


        response.getWriter().print("[");

        boolean first = true;


        for (
                ChordTypeInfo chordType
                : chordTypes
        ) {

            if (!first) {
                response.getWriter().print(",");
            }

            first = false;


            response.getWriter().print(
                    chordTypeToJson(
                            chordType
                    )
            );
        }


        response.getWriter().print("]");
    }


    /**
     * Wandelt einen ChordTypeInfo-Datensatz
     * in einen JSON-String um.
     */
    private String chordTypeToJson(
            ChordTypeInfo chordType) {

        StringBuilder json =
                new StringBuilder();

        json.append("{");


        /*
         * Name
         */

        json.append("\"name\":\"")
                .append(
                        escapeJson(
                                chordType.name()
                        )
                )
                .append("\",");


        /*
         * Base
         */

        json.append("\"base\":\"")
                .append(
                        escapeJson(
                                chordType.base()
                        )
                )
                .append("\",");


        /*
         * Extension
         */

        json.append("\"extension\":\"")
                .append(
                        escapeJson(
                                chordType.extension()
                        )
                )
                .append("\",");


        /*
         * Family
         */

        json.append("\"family\":\"")
                .append(
                        escapeJson(
                                chordType.family()
                        )
                )
                .append("\",");


        /*
         * Aliases
         */

        json.append("\"aliases\":");

        json.append(
                stringListToJson(
                        chordType.aliases()
                )
        );

        json.append(",");


        /*
         * Degrees
         */

        json.append("\"degrees\":");

        json.append(
                stringListToJson(
                        chordType.degrees()
                )
        );


        json.append("}");

        return json.toString();
    }


    /**
     * Wandelt eine Liste von Strings
     * in ein JSON-Array um.
     */
    private String stringListToJson(
            List<String> values) {

        StringBuilder json =
                new StringBuilder();

        json.append("[");

        boolean first = true;


        for (
                String value
                : values
        ) {

            if (!first) {
                json.append(",");
            }

            first = false;


            json.append("\"")
                    .append(
                            escapeJson(
                                    value
                            )
                    )
                    .append("\"");
        }


        json.append("]");

        return json.toString();
    }


    /**
     * Einfaches Escaping für JSON-Strings.
     */
    private String escapeJson(
            String value) {

        if (value == null) {
            return "";
        }

        return value
                .replace(
                        "\\",
                        "\\\\"
                )
                .replace(
                        "\"",
                        "\\\""
                )
                .replace(
                        "\r",
                        "\\r"
                )
                .replace(
                        "\n",
                        "\\n"
                );
    }
}
