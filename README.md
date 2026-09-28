# jjazzlab-player

A proof-of-concept web application that brings parts of the [JJazzLab](https://www.jjazzlab.org/) toolkit to the browser.

The project combines a Java/Tomcat backend with a JavaScript-based web client. Songs are exchanged using XML compatible with the JJazzLab `.sng` format. The server processes the song using the JJazzLab toolkit and generates MIDI, which is then played directly in the browser.

## Features

- 🎵 Browser-based song editor
- 🎹 Chord and song-part editing
- 📄 JJazzLab `.sng` compatible XML
- ☕ Java backend using the JJazzLab toolkit
- 🌐 Tomcat servlet backend
- 🎶 Server-side MIDI generation
- 🔊 Client-side MIDI playback using Web Audio
- 💾 Local SoundFont caching
- 📦 SF3 SoundFont support
- 🔎 Rhythm/style selection with autocomplete
- 📱 Designed to work on desktop and mobile browsers

## Architecture

```text
Browser
   │
   │ JJazzLab XML
   ▼
Tomcat / Java Servlet
   │
   │ JJazzLab Toolkit
   ▼
 MIDI
   │
   ▼
Browser MIDI Synthesizer
```

The client keeps the song data as JJazzLab-compatible XML. It understands the relevant parts of the XML for editing, while the original XML remains accessible and editable.

The client sends the XML to the server, the server processes it with the JJazzLab toolkit and returns the generated MIDI data.

## SoundFont

The web client uses a SoundFont for MIDI playback.

The current SoundFont is approximately **47–48 MB** and is converted to SF3 to reduce its size.

Since the development server is running on my private PC with a relatively slow **16 Mbit DSL connection**, the SoundFont is cached locally in the browser after the first download.

This means subsequent visits do not need to download the SoundFont again.

## Technology

**Backend**

- Java 25
- Apache Tomcat 11
- Maven
- JJazzLab Toolkit
- Jakarta Servlet / WebSocket APIs

**Frontend**

- JavaScript
- HTML / CSS
- Web Audio API
- MIDI synthesizer
- SF3 SoundFont

## 🤖 AI-Assisted Development

This project was developed extensively with the help of ChatGPT.

Approximately **90% of the implementation was created with ChatGPT assistance**. :)

The project is also an experiment in using AI-assisted development to integrate an existing Java music framework into a modern web application.

## 🚧 Status

**Proof of Concept – Work in Progress**

The application is functional, but many parts are still experimental and subject to change.

Possible future improvements include:

- More complete JJazzLab feature support
- Improved song editing
- MIDI export
- `.sng` import/export
- Better mobile UI
- Improved error handling
- More robust session management

## 🙏 Credits

This project is based on the excellent work of the [JJazzLab](https://www.jjazzlab.org/) project and its contributors.

- [JJazzLab GitHub](https://github.com/jjazzboss/JJazzLab)
- [JJazzLab Website](https://www.jjazzlab.org/)

---

**Have fun exploring! 🎵**
