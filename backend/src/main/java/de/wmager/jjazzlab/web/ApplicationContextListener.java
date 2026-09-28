package de.wmager.jjazzlab.web;

import jakarta.servlet.ServletContextEvent;
import jakarta.servlet.ServletContextListener;
import jakarta.servlet.annotation.WebListener;

/**

* Initializes and manages the {@link ApplicationContext} of the
* JJazzLab web application.
*
* <p>When the web application starts, an application context is created
* and stored in the {@code ServletContext}. Servlets can use it to
* access shared server-side components.</p>
*
* <p>No additional cleanup is currently required when the web
* application is shut down.</p>
  */
@WebListener
public class ApplicationContextListener
        implements ServletContextListener {

    @Override
    public void contextInitialized(
            ServletContextEvent event) {

        ApplicationContext applicationContext =
                new ApplicationContext();

        event.getServletContext().setAttribute(
                ApplicationContext.class.getName(),
                applicationContext
        );
    }

    @Override
    public void contextDestroyed(
            ServletContextEvent event) {

        // Momentan nichts zu tun.
    }
}