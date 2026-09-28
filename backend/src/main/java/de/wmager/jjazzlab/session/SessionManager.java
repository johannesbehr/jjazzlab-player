package de.wmager.jjazzlab.session;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**

* Manages the active {@link JJazzLabSession} instances of the server.
*
* <p>Sessions are stored and retrieved using their unique session IDs.
* The manager supports creating, retrieving, and removing sessions.</p>
*
* <p>The underlying data structure is thread-safe, allowing multiple
* HTTP requests to access the session manager concurrently.</p>
*
* <p>Persistent session storage is currently not implemented. User
* accounts and persistent song storage can be added independently
* in the future.</p>
  */
public class SessionManager {

    private final Map<String, JJazzLabSession> sessions =
            new ConcurrentHashMap<>();

    public JJazzLabSession createSession() {

        JJazzLabSession session =
                new JJazzLabSession();

        sessions.put(
                session.getId(),
                session
        );

        return session;
    }

    public JJazzLabSession getSession(String id) {

        return sessions.get(id);
    }

    public void removeSession(String id) {

        sessions.remove(id);
    }

    public int getSessionCount() {

        return sessions.size();
    }
}