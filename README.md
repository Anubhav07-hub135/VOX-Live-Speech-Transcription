# VOX Studio — Live & Local Speech Transcription

VOX Studio is a web-based speech transcription application built with Python and Flask. It supports live microphone transcription and uploaded-audio transcription using a locally running Whisper speech-recognition model.

## Features

- **Live transcription:** Convert speech from your microphone into text using browser speech recognition.
- **Audio upload:** Transcribe existing audio recordings with a local Whisper model.
- **Language selection:** Choose a language for live recognition or uploaded recordings.
- **Vocabulary hints:** Provide names or specialized words to help guide transcription.
- **Editable transcript:** Review and edit recognized text.
- **Export tools:** Copy the transcript or download it as a TXT file.
- **Local processing:** Uploaded audio is processed on your computer without requiring a paid transcription API.

## Technologies Used

- Python
- Flask
- faster-whisper
- Whisper speech-recognition model
- HTML5
- CSS3
- JavaScript
- Browser Web Speech API

## Project Structure

```text
VOX-Live-Speech-Transcription-Local/
├── app.py
├── requirements.txt
├── README.md
├── .gitignore
├── static/
│   ├── script.js
│   └── style.css
└── templates/
    └── index.html
```

## Installation and Setup

### Prerequisites

- Python 3.10 or a compatible newer version
- Internet access for the initial Whisper model download
- Google Chrome or Microsoft Edge for live browser speech recognition

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd VOX-Live-Speech-Transcription-Local
```

### 2. Create a virtual environment

**Windows PowerShell:**

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
```

If PowerShell blocks activation, use Command Prompt:

```bat
venv\Scripts\activate.bat
```

### 3. Install dependencies

```bash
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Run the application

```bash
python app.py
```

Wait for the Whisper model to finish loading, then open:

http://127.0.0.1:5000

Keep the terminal open while using the website.

## How to Use

### Live transcription
1. Open VOX Studio in Chrome or Edge.
2. Select the recognition language.
3. Allow microphone access.
4. Click **Start speaking** and speak clearly.
5. Click **Stop session** when finished.

### Uploaded-audio transcription
1. Choose an audio recording.
2. Optionally select a language or enter a vocabulary hint.
3. Click **Transcribe recording**.
4. Review and edit the resulting transcript.
5. Copy the text or export it as a TXT file.

Supported formats depend on the installed audio-decoding libraries and include common formats such as WAV, MP3, M4A, FLAC, OGG and WebM.

## Privacy and Limitations

- Uploaded audio is processed locally by the Whisper model after its files have been downloaded.
- The initial model download requires internet access.
- Live browser speech recognition may rely on an online service and may send audio to the browser's speech-recognition provider.
- Transcription quality depends on audio clarity, accents, background noise and model size.
- The Flask development server is intended for local development, not production deployment.

## Future Improvements

- Transcription history
- Timestamps for recognized speech
- Support for longer recordings and improved progress reporting
- Additional language options
- Production deployment and accessibility improvements

## Author

**Anubhav Puhan**

GitHub: https://github.com/Anubhav07-hub135

LinkedIn: https://www.linkedin.com/in/anubhav-puhan-81a5243bb

---

This project was developed as a hands-on learning project in Python, web development and speech recognition.
