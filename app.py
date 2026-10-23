import os
import tempfile
from pathlib import Path

from flask import Flask, jsonify, render_template, request
from werkzeug.utils import secure_filename
from faster_whisper import WhisperModel

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 200 * 1024 * 1024  # Local upload cap: 200 MB

ALLOWED_EXTENSIONS = {"mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "flac", "ogg"}
MODEL_SIZE = os.getenv("WHISPER_MODEL_SIZE", "tiny")
DEVICE = os.getenv("WHISPER_DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("WHISPER_COMPUTE_TYPE", "int8")

# Load once when the Flask process starts. First startup downloads the model.
print(f"Loading local Whisper model '{MODEL_SIZE}' on {DEVICE} ({COMPUTE_TYPE})...")
whisper_model = WhisperModel(MODEL_SIZE, device=DEVICE, compute_type=COMPUTE_TYPE)
print("Whisper model loaded. VOX is ready.")


def allowed_file(filename: str) -> bool:
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.get("/")
def index():
    return render_template("index.html")


@app.post("/api/transcribe")
def transcribe_audio():
    if "audio" not in request.files:
        return jsonify(error="Choose an audio file first."), 400

    audio = request.files["audio"]
    if not audio.filename:
        return jsonify(error="Choose an audio file first."), 400

    filename = secure_filename(audio.filename)
    if not allowed_file(filename):
        return jsonify(error="Unsupported format. Use MP3, MP4, MPEG, MPGA, M4A, WAV, WEBM, FLAC, or OGG."), 400

    language = request.form.get("language", "").strip().lower()
    prompt = request.form.get("prompt", "").strip()
    if len(prompt) > 4000:
        return jsonify(error="The transcription hint is too long (maximum 4,000 characters)."), 400

    suffix = Path(filename).suffix.lower()
    temp_path = None
    try:
        # Save to a temporary file; delete it immediately after transcription.
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as temp:
            audio.save(temp)
            temp_path = temp.name

        options = {
            "beam_size": 5,
            "vad_filter": True,
        }
        if language:
            options["language"] = language
        if prompt:
            options["initial_prompt"] = prompt

        segments, info = whisper_model.transcribe(temp_path, **options)
        text = " ".join(segment.text.strip() for segment in segments).strip()

        if not text:
            return jsonify(error="No speech was detected in that recording. Try a clearer or longer audio file."), 422

        return jsonify(
            text=text,
            model=f"Whisper {MODEL_SIZE}",
            detected_language=info.language,
            language_probability=round(float(info.language_probability), 3),
        )
    except Exception:
        app.logger.exception("Local audio transcription failed")
        return jsonify(error="Transcription failed. Try another audio file and check the Flask terminal for details."), 500
    finally:
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except OSError:
                app.logger.warning("Could not remove temporary audio file: %s", temp_path)


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(error="Audio file exceeds the 200 MB upload limit."), 413



if __name__ == "__main__":
    import os
    app.run(
        host="0.0.0.0",
        port=int(os.environ.get("PORT", 5000)),
        debug=False
    )
