package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.session.JJazzLabSession;
import de.wmager.jjazzlab.session.SessionManager;
import de.wmager.jjazzlab.song.SongService;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;

/**
 * HTTP servlet for creating and loading JJazzLab songs.
 *
 * <p>A song belongs to a server-side
 * {@link de.wmager.jjazzlab.session.JJazzLabSession}.</p>
 *
 * <p>The current implementation provides an endpoint for creating
 * a new empty song. Song upload and download will be added later.</p>
 */
@WebServlet("/api/song/*")
public class SongServlet extends HttpServlet {

    private SessionManager sessionManager;
	private final SongService songService =
        new SongService();

    @Override
    public void init()
            throws ServletException {

        ApplicationContext applicationContext =
                (ApplicationContext)
                getServletContext().getAttribute(
                        ApplicationContext.class.getName()
                );

        if (applicationContext == null) {

            throw new ServletException(
                    "ApplicationContext not initialized."
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

			sendError(
					response,
					HttpServletResponse.SC_BAD_REQUEST,
					"No session ID specified."
			);

			return;
		}

		String sessionId =
				path.substring(1);

		JJazzLabSession session =
				sessionManager.getSession(sessionId);

		if (session == null) {

			sendError(
					response,
					HttpServletResponse.SC_NOT_FOUND,
					"Session not found."
			);

			return;
		}

		try {

			File songFile =
					songService.getCurrentSong(
							session
					);

			response.setContentType(
					"application/xml"
			);

			response.setContentLengthLong(
					songFile.length()
			);

			response.setHeader(
					"Content-Disposition",
					"attachment; filename=\"currentsong.sng\""
			);

			Files.copy(
					songFile.toPath(),
					response.getOutputStream()
			);

		} catch (Exception ex) {

			throw new ServletException(
					"Could not download song.",
					ex
			);
		}
	}
	
	@Override
	protected void doPut(
			HttpServletRequest request,
			HttpServletResponse response)
			throws ServletException, IOException {

		String path =
				request.getPathInfo();

		if (path == null || path.length() <= 1) {

			sendError(
					response,
					HttpServletResponse.SC_BAD_REQUEST,
					"No session ID specified."
			);

			return;
		}

		String sessionId =
				path.substring(1);

		JJazzLabSession session =
				sessionManager.getSession(sessionId);

		if (session == null) {

			sendError(
					response,
					HttpServletResponse.SC_NOT_FOUND,
					"Session not found."
			);

			return;
		}

		try {

			songService.uploadSong(
					session,
					request.getInputStream()
			);

			response.setContentType(
					"application/json"
			);

			response.setCharacterEncoding(
					"UTF-8"
			);

			response.getWriter().printf(
					"{\"sessionId\":\"%s\",\"song\":\"%s\"}",
					session.getId(),
					escapeJson(
							session.getSong().getName()
					)
			);

		} catch (Exception ex) {

			throw new ServletException(
					"Could not upload song.",
					ex
			);
		}
	}

    @Override
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        String path =
                request.getPathInfo();

        if (path == null || path.length() <= 1) {

            sendError(
                    response,
                    HttpServletResponse.SC_BAD_REQUEST,
                    "No session ID specified."
            );

            return;
        }

        String[] parts =
                path.substring(1).split("/");

        String sessionId =
                parts[0];

        JJazzLabSession session =
                sessionManager.getSession(sessionId);

        if (session == null) {

            sendError(
                    response,
                    HttpServletResponse.SC_NOT_FOUND,
                    "Session not found."
            );

            return;
        }

        /*
         * /api/song/{sessionId}/new
         */
        if (parts.length == 2 &&
            parts[1].equals("new")) {

            createNewSong(
                    session,
                    response
            );

            return;
        }

		/*
		 * /api/song/{sessionId}/load-default
		 */
		if (parts.length == 2 &&
			parts[1].equals("load-default")) {

			loadDefaultSong(
					session,
					response
			);

			return;
		}

        sendError(
                response,
                HttpServletResponse.SC_NOT_FOUND,
                "Unknown song operation."
        );
    }

	private void loadDefaultSong(
			JJazzLabSession session,
			HttpServletResponse response)
			throws ServletException, IOException {

		try {

			songService.loadDefaultSong(
					session
			);

			response.setContentType(
					"application/json"
			);

			response.setCharacterEncoding(
					"UTF-8"
			);

			response.getWriter().printf(
					"{\"sessionId\":\"%s\",\"song\":\"%s\"}",
					session.getId(),
					escapeJson(
							session.getSong().getName()
					)
			);

		} catch (Exception ex) {

			throw new ServletException(
					"Could not load default song.",
					ex
			);
		}
	}

    private void createNewSong(
            JJazzLabSession session,
            HttpServletResponse response)
            throws ServletException, IOException {

        try {

            session.createEmptySong(
                    "New Song"
            );

            response.setContentType(
                    "application/json"
            );

            response.setCharacterEncoding(
                    "UTF-8"
            );

            response.getWriter().printf(
                    "{\"sessionId\":\"%s\",\"song\":\"%s\"}",
                    session.getId(),
                    escapeJson(
                            session.getSong().getName()
                    )
            );

        } catch (Exception ex) {

            throw new ServletException(
                    "Could not create new song.",
                    ex
            );
        }
    }

    private void sendError(
            HttpServletResponse response,
            int status,
            String message)
            throws IOException {

        response.setStatus(status);

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        response.getWriter().printf(
                "{\"error\":\"%s\"}",
                escapeJson(message)
        );
    }

    private String escapeJson(
            String value) {

        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"");
    }
}