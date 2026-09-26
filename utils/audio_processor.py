import yt_dlp
from pydub import AudioSegment
import os

DOWNLOAD_DIR = 'downloades'
os.makedirs(DOWNLOAD_DIR,exist_ok = True)

from pytubefix import YouTube

def download_youtube_audio(url: str) -> str:
    AudioSegment.converter = os.path.abspath("ffmpeg.exe")
    AudioSegment.ffprobe = os.path.abspath("ffprobe.exe")
    
    try:
        yt = YouTube(url)
        stream = yt.streams.get_audio_only()
        
        print("Downloading audio with pytubefix...")
        temp_path = stream.download(output_path=DOWNLOAD_DIR)
        
        filename = os.path.splitext(temp_path)[0] + ".wav"
        
        # Convert to WAV
        print("Converting to WAV...")
        audio = AudioSegment.from_file(temp_path)
        audio = audio.set_channels(1).set_frame_rate(16000)
        audio.export(filename, format="wav")
        
        if os.path.exists(temp_path) and temp_path != filename:
            try:
                os.remove(temp_path)
            except:
                pass
                
        return filename
    except Exception as e:
        raise Exception(f"YouTube blocked the download or an error occurred: {e}. Please use the Upload option.")



def convert_to_wav(input_path: str) -> str:
    """Convert any audio/video file to WAV format using pydub."""
    AudioSegment.converter = os.path.abspath("ffmpeg.exe")
    AudioSegment.ffprobe = os.path.abspath("ffprobe.exe")
    output_path = os.path.splitext(input_path)[0] + "_converted.wav"
    audio = AudioSegment.from_file(input_path)
    audio = audio.set_channels(1).set_frame_rate(16000) #16khz
    audio.export(output_path, format="wav")
    return output_path



def chunk_audio(wav_path : str , chunk_minutes : int = 10) -> list:
    audio = AudioSegment.from_wav(wav_path)
    chunk_ms = chunk_minutes * 60 * 1000 

    chunks = []

    for i, start in enumerate(range(0,len(audio),chunk_ms)):
        chunk = audio[start : start + chunk_ms]
        chunk_path = f"{wav_path}_chunk_{i}.wav"
        chunk.export(chunk_path , format = "wav")

        chunks.append(chunk_path)
    
    return chunks

def process_input(source: str) -> list:
    if source.startswith("http://") or source.startswith("https://"):
        print("Detected YouTube URL. Downloading audio...")
        wav_path = download_youtube_audio(source)
    else:
        print("Detected local file. Converting to WAV...")
        wav_path = convert_to_wav(source)

    print("Chunking audio...")
    chunks = chunk_audio(wav_path)
    print(f"Audio ready - {len(chunks)} chunk(s) created.")
    return chunks


