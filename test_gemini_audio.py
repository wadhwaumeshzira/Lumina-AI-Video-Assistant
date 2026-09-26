import os
import time
from google import genai
from dotenv import load_dotenv

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

from pydub import AudioSegment
from pydub.generators import Sine
audio = Sine(440).to_audio_segment(duration=1000)
audio.export("dummy.wav", format="wav")

print("Uploading file to Gemini...")
myfile = client.files.upload(file="dummy.wav")
print(f"File uploaded: {myfile.name}")

while True:
    f = client.files.get(name=myfile.name)
    if f.state.name == "ACTIVE":
        break
    elif f.state.name == "FAILED":
        print("File processing failed")
        exit(1)
    print("Waiting for file to process...")
    time.sleep(2)

print("Generating content...")
response = client.models.generate_content(
    model="gemini-3.5-flash-lite",
    contents=[myfile, "Transcribe this audio. If it is just a tone, say Tone."]
)
print(f"Response: {response.text}")
