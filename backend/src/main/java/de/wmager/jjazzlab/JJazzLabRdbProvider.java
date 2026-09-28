package de.wmager.jjazzlab;

import java.util.concurrent.Future;

import org.jjazz.rhythmdatabase.api.RhythmDatabase;
import org.jjazz.rhythmdatabase.spi.SharedRdbInstanceProvider;
import org.openide.util.lookup.ServiceProvider;

/**

* Provides the server-managed JJazzLab {@code RhythmDatabase} as a
* shared JJazzLab component.
*
* <p>This class implements {@code SharedRdbInstanceProvider} so that
* JJazzLab Core can access the RhythmDatabase initialized by the
* server runtime.</p>
*
* <p>The actual lifecycle and management of the RhythmDatabase is handled
* by {@link de.wmager.jjazzlab.JJazzLabRuntime}.</p>
  */
@ServiceProvider(service = SharedRdbInstanceProvider.class)
public class JJazzLabRdbProvider
        implements SharedRdbInstanceProvider {

    @Override
    public Future<?> initialize() {

        JJazzLabRuntime.initialize();

        return null;
    }

    @Override
    public boolean isInitialized() {

        return JJazzLabRuntime.getRhythmDatabase() != null;
    }

    @Override
    public RhythmDatabase get() {

        return JJazzLabRuntime.getRhythmDatabase();
    }

    @Override
    public void markForStartupRefresh(boolean b) {
        // Für unsere Serveranwendung nicht erforderlich.
    }

    @Override
    public boolean isMarkedForStartupRefresh() {

        return false;
    }
}