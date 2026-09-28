package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.session.JJazzLabSession;
import de.wmager.jjazzlab.session.SessionManager;

import jakarta.servlet.ServletContext;
import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import java.io.IOException;

/**

* HTTP servlet for creating new JJazzLab sessions.
*
* <p>A POST request to {@code /api/session} creates a new
* {@link de.wmager.jjazzlab.session.JJazzLabSession} and returns its
* unique session ID as a JSON response.</p>
*
* <p>The session ID is subsequently used by the client to perform
* further operations within the same JJazzLab session.</p>
  */
@WebServlet("/api/session")
public class SessionServlet extends HttpServlet {

    private SessionManager sessionManager;

    @Override
    public void init() throws ServletException {

        ServletContext context =
                getServletContext();

        ApplicationContext applicationContext =
                (ApplicationContext)
                context.getAttribute(
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
    protected void doPost(
            HttpServletRequest request,
            HttpServletResponse response)
            throws ServletException, IOException {

        JJazzLabSession session =
                sessionManager.createSession();

        response.setContentType(
                "application/json"
        );

        response.setCharacterEncoding(
                "UTF-8"
        );

        response.getWriter().printf(
                "{\"sessionId\":\"%s\"}",
                session.getId()
        );
    }
}