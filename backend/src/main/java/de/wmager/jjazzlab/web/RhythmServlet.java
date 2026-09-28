package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.rhythm.RhythmService;
import org.jjazz.rhythmdatabase.api.UnavailableRhythmException;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

@WebServlet("/api/rhythm/*")
public class RhythmServlet extends HttpServlet {

    private final RhythmService rhythmService =
            new RhythmService();


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
             * /api/rhythm
             *
             * Gibt alle Rhythmen zurück.
             */

            if (
                path == null ||
                path.equals("/") ||
                path.isEmpty()
            ) {

                writeRhythms(
                        response
                );

                return;
            }


            /*
             * /api/rhythm/{id}/variations
             *
             * Gibt die möglichen Variationen
             * eines Rhythmus zurück.
             */

            if (
                path.endsWith(
                        "/variations"
                )
            ) {

                String rhythmId =
                        path.substring(
                                1,
                                path.length()
                                -
                                "/variations".length()
                        );

                writeVariations(
                        response,
                        rhythmId
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
                    "Could not retrieve rhythm data.",
                    ex
            );
        }
    }


    /**
     * Gibt alle verfügbaren Rhythmen als JSON zurück.
     */
    private void writeRhythms(
            HttpServletResponse response)
            throws IOException {

        response.getWriter().print("[");

        boolean first = true;

        for (
            var rhythm
            : rhythmService.getRhythms()
        ) {

            if (!first) {
                response.getWriter().print(",");
            }

            first = false;

            response.getWriter().printf(
                    "{\"value\":\"%s\",\"label\":\"%s\",\"id\":\"%s\"}",
                    escapeJson(
                            rhythm.name()
                    ),
                    escapeJson(
                            rhythm.name()
                    ),
                    escapeJson(
                            rhythm.rhythmUniqueId()
                    )
            );
        }

        response.getWriter().print("]");
    }


    /**
     * Gibt die verfügbaren Variationen
     * eines Rhythmus als JSON zurück.
     */
    private void writeVariations(
            HttpServletResponse response,
            String rhythmId)
            throws IOException, UnavailableRhythmException  {

        response.getWriter().print("[");

        boolean first = true;

        for (
            String variation
            : rhythmService.getVariations(
                    rhythmId
            )
        ) {

            if (!first) {
                response.getWriter().print(",");
            }

            first = false;

            response.getWriter().printf(
                    "\"%s\"",
                    escapeJson(
                            variation
                    )
            );
        }

        response.getWriter().print("]");
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
                );
    }
}