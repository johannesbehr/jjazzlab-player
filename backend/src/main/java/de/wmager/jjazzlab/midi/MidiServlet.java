package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.midi.MidiExportService;
import de.wmager.jjazzlab.session.JJazzLabSession;
import de.wmager.jjazzlab.session.SessionManager;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.file.Files;

/**

* HTTP servlet for generating and serving MIDI files.
*
* <p>A GET request to {@code /api/midi/{sessionId}} generates a MIDI
* file from the song stored in the specified session and transfers
* it to the client.</p>
*
* <p>The actual MIDI generation is handled by
* {@link MidiExportService}. This servlet is responsible for HTTP
* communication and streaming the generated file to the client.</p>
*
* <p>The temporary MIDI file is deleted after the transfer has
* completed.</p>
  */
@WebServlet("/api/midi/*")
public class MidiServlet extends HttpServlet {

    private SessionManager sessionManager;

    private final MidiExportService midiExportService =
            new MidiExportService();

    @Override
    public void init() throws ServletException {

        ApplicationContext applicationContext =
                (ApplicationContext)
                getServletContext().getAttribute(
                        ApplicationContext.class.getName()
                );

        if (applicationContext == null) {

            throw new ServletException(
                    "ApplicationContext nicht initialisiert."
            );
        }

        sessionManager =
                applicationContext.getSessionManager();
    }

    @Override
    protected void doGet(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String path =
                request.getPathInfo();

        if (path == null || path.length() <= 1) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Keine Session-ID angegeben."
            );

            return;
        }

        String sessionId =
                path.substring(1);

        JJazzLabSession session =
                sessionManager.getSession(sessionId);

        if (session == null) {

            response.sendError(
                    HttpServletResponse.SC_NOT_FOUND,
                    "Session nicht gefunden."
            );

            return;
        }

        if (!session.hasSong()) {

            response.sendError(
                    HttpServletResponse.SC_BAD_REQUEST,
                    "Die Session enthält keinen geladenen Song."
            );

            return;
        }

        File midiFile = null;

        try {

            midiFile =
                    midiExportService.export(session);

            response.setContentType(
                    "audio/midi"
            );

            response.setContentLengthLong(
                    midiFile.length()
            );

            response.setHeader(
                    "Content-Disposition",
                    "inline; filename=\"jjazzlab.mid\""
            );

            try (OutputStream output =
                         response.getOutputStream()) {

                Files.copy(
                        midiFile.toPath(),
                        output
                );
            }

        } catch (Exception ex) {

            throw new ServletException(
                    "MIDI konnte nicht erzeugt werden.",
                    ex
            );

        } finally {

            if (midiFile != null) {

                try {
                    Files.deleteIfExists(
                            midiFile.toPath()
                    );
                } catch (IOException ignored) {
                    // Temporäre Datei konnte nicht gelöscht werden.
                }
            }
        }
    }
}