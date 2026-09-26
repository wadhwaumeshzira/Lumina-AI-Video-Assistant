from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
import shutil
import os

load_dotenv()

# Core functionality will be imported locally in endpoints to prevent timeout

app = FastAPI(title="AI Video Assistant API")

# Setup CORS for the React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=False, # Must be False when origins is wildcard
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Global store for the RAG chain in memory
# In a production app, we'd persist this per-user/session
global_rag_chain = None

class ChatRequest(BaseModel):
    question: str
    language: str = "english"

@app.post("/api/analyze")
async def analyze_video(
    source: str | None = Form(None),
    language: str = Form("english"),
    file: UploadFile | None = File(None)
):
    global global_rag_chain
    try:
        from utils.audio_processor import process_input
        from core.transcriber import transcribe_all
        from core.rag_engine import build_rag_chain
        
        input_path = source
        
        if file:
            # Save uploaded file to disk
            os.makedirs("downloads", exist_ok=True)
            input_path = f"downloads/{file.filename}"
            with open(input_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            print(f"Saved uploaded file to {input_path}")
            
        if not input_path:
            raise HTTPException(status_code=400, detail="Must provide either a URL/path or upload a file.")

        import json
        from langchain_google_genai import ChatGoogleGenerativeAI
        from langchain_core.prompts import ChatPromptTemplate
        
        print(f"Starting analysis for source: {input_path}")
        chunks = process_input(input_path)
        transcript = transcribe_all(chunks, language)
        
        print("Analyzing transcript via unified AI call to prevent rate limits...")
        llm = ChatGoogleGenerativeAI(
            model="gemini-3.5-flash-lite",
            google_api_key=os.getenv("GEMINI_API_KEY"),
            temperature=0.2,
        )
        
        prompt = ChatPromptTemplate.from_messages([
            ("system", f"""You are an expert meeting analyst. Analyze the following transcript and output a JSON object with exactly these keys:
- "title": a short professional title (max 8 words)
- "summary": a bulleted summary of the meeting
- "action_items": a numbered list of tasks, owners, and deadlines (or 'No action items found')
- "decisions": a numbered list of key decisions made (or 'No key decisions found')
- "questions": a numbered list of unresolved questions/follow-ups (or 'No open questions found')

IMPORTANT: You must write the values for title, summary, action_items, decisions, and questions in {language.upper()} language. 
The JSON keys must remain in English, but the content must be in {language.upper()}.
"""),
            ("human", "{transcript}")
        ])
        
        # Pass the full transcript to Gemini (Gemini Flash Lite handles up to 1M tokens easily)
        chain = prompt | llm
        response = chain.invoke({"transcript": transcript})
        
        try:
            import re
            # Extract text safely (handles langchain_google_genai returning lists)
            if isinstance(response.content, list):
                raw_content = "".join([item.get("text", "") for item in response.content if isinstance(item, dict) and "text" in item])
            else:
                raw_content = response.content.strip()
                
            # Extract the JSON object using regex
            match = re.search(r'\{.*\}', raw_content, re.DOTALL)
            if match:
                raw_content = match.group(0)
            
            # Clean any trailing commas before the closing brace (common LLM mistake)
            raw_content = re.sub(r',\s*\}', '}', raw_content)
            
            analysis = json.loads(raw_content)
        except Exception as e:
            print(f"Failed to parse JSON. Error: {e}. Raw response: {response.content}")
            analysis = {
                "title": "Analysis Error",
                "summary": "Failed to parse AI response.",
                "action_items": "N/A",
                "decisions": "N/A",
                "questions": "N/A"
            }
            
        print("Building RAG chain...")
        global_rag_chain = build_rag_chain(transcript)

        return {
            "title": analysis.get("title", "Untitled"),
            "transcript": transcript,
            "summary": analysis.get("summary", ""),
            "action_items": analysis.get("action_items", ""),
            "key_decisions": analysis.get("decisions", ""),
            "open_questions": analysis.get("questions", ""),
        }
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/chat")
async def chat_with_meeting(req: ChatRequest):
    global global_rag_chain
    from core.rag_engine import ask_question, load_rag_chain
    
    if not global_rag_chain:
        try:
            # Try to load existing vector store if chain is not in memory
            global_rag_chain = load_rag_chain()
        except Exception:
            raise HTTPException(status_code=400, detail="Meeting hasn't been analyzed yet. Please run analysis first.")
    
    try:
        answer = ask_question(global_rag_chain, req.question, req.language)
        return {"answer": answer}
    except Exception as e:
        print(f"Error during chat: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
