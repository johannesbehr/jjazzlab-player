package de.wmager.jjazzlab.web;

import de.wmager.jjazzlab.session.SessionManager;

/**

* Central application context of the JJazzLab web server.
*
* <p>The application context contains server-wide components and
* services that are shared by the web application. Currently, this
* includes the {@link de.wmager.jjazzlab.session.SessionManager}.</p>
*
* <p>The context is created during web application startup by
* {@link ApplicationContextListener} and stored in the
* {@code ServletContext}.</p>
  */
public class ApplicationContext {

    private final SessionManager sessionManager;

    public ApplicationContext() {

        sessionManager =
                new SessionManager();
    }

    public SessionManager getSessionManager() {

        return sessionManager;
    }
}