import os
import time
from google import genai

def transcribe_chunk_gemini(chunk_path: str, language: str = "english") -> str:
    """
    Upload the audio chunk to Gemini and ask it to transcribe.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY is not set in environment / .env")

    client = genai.Client(api_key=api_key)
    
    print(f"  -> Uploading audio {os.path.basename(chunk_path)} to Gemini...")
    myfile = client.files.upload(file=chunk_path)
    
    # Wait for processing if needed
    while True:
        f = client.files.get(name=myfile.name)
        if f.state.name == "ACTIVE":
            break
        elif f.state.name == "FAILED":
            print("  [X] Gemini File processing failed")
            return ""
        time.sleep(2)

    prompt = f"Transcribe this audio exactly as spoken. Output ONLY the transcription in plain text. If the audio is in Hindi/Hinglish, write the transcription in {language}."
    
    print(f"  -> Generating transcription using gemini-3.5-flash-lite...")
    try:
        response = client.models.generate_content(
            model="gemini-3.5-flash-lite",
            contents=[myfile, prompt]
        )
        return response.text.strip()
    except Exception as e:
        print(f"  [X] Transcription failed: {e}")
        return ""
    finally:
        try:
            client.files.delete(name=myfile.name)
        except:
            pass


def transcribe_all(chunks: list, language: str = "english") -> str:
    full_transcript = "" 
    print(f"Using Gemini AI (gemini-3.5-flash-lite) for transcription.")

    for i, chunk in enumerate(chunks):  
        print(f"Transcribing chunk {i + 1}/{len(chunks)}...")
        text = transcribe_chunk_gemini(chunk, language)  
        full_transcript += text + " "  
        # Small sleep to ensure we don't hit 15 RPM limit for 3+ hour videos
        time.sleep(3)

    print("Transcription complete.")
    return full_transcript.strip()
