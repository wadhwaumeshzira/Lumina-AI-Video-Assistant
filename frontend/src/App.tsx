import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  Video, 
  MessageSquare, 
  CheckCircle2, 
  HelpCircle, 
  FileText,
  Send,
  Loader2,
  ChevronRight
} from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

export default function App() {
  const [source, setSource] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState('english');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{role: string, content: string}>>([]);
  const [isChatting, setIsChatting] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!source && !file) return;
    
    setIsAnalyzing(true);
    setError('');
    setResult(null);
    setChatHistory([]);
    
    try {
      const formData = new FormData();
      if (source) formData.append('source', source);
      if (file) formData.append('file', file);
      formData.append('language', language);

      const res = await fetch(`${API_URL}/analyze`, {
        method: 'POST',
        body: formData,
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleChat = async (e: React.FormEvent) => {
    // ... keep same chat code
    e.preventDefault();
    if (!chatInput.trim() || isChatting) return;
    
    const userMsg = chatInput.trim();
    setChatInput('');
    setChatHistory(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsChatting(true);
    
    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: userMsg, language: language }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setChatHistory(prev => [...prev, { role: 'assistant', content: data.answer }]);
    } catch (err: any) {
      setChatHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}` }]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-text bg-pattern relative overflow-x-hidden">
      {/* Background glow effects */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-accent/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-accent-2/20 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-[1600px] w-full mx-auto px-6 lg:px-12 py-8 relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-accent-glow flex items-center justify-center shadow-lg shadow-accent/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl tracking-tight text-white">Lumina</h1>
              <p className="text-xs text-text-muted uppercase tracking-widest font-sans">Meeting Intelligence</p>
            </div>
          </div>
        </header>

        {/* Input Section */}
        <AnimatePresence mode="wait">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`flex flex-col items-center max-w-2xl mx-auto w-full transition-all duration-500 ${result ? 'mb-12' : 'justify-center flex-1'}`}
            >
              {!result && (
                <>
                  <h2 className="font-display text-4xl md:text-5xl font-extrabold text-center mb-4 bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-text-muted">
                    Turn your videos and meetings <br/> into actionable insights.
                  </h2>
                  <p className="text-text-muted text-center mb-8">
                    Paste a YouTube URL or upload a video file to generate summaries, action items, and chat with your transcript.
                  </p>
                </>
              )}

              <form onSubmit={handleAnalyze} className="w-full relative group flex flex-col gap-4">
                <div className="flex gap-3 justify-center mb-2">
                  <button type="button" onClick={() => setLanguage('english')} className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition ${language === 'english' ? 'bg-accent text-white border border-accent' : 'bg-surface-2 text-text-muted border border-border hover:border-text-muted'}`}>English</button>
                  <button type="button" onClick={() => setLanguage('hinglish')} className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider uppercase transition ${language === 'hinglish' ? 'bg-accent text-white border border-accent' : 'bg-surface-2 text-text-muted border border-border hover:border-text-muted'}`}>Hinglish</button>
                </div>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-r from-accent to-accent-2 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative flex items-center bg-surface-2 rounded-2xl border border-border p-2">
                    <Video className="w-5 h-5 text-text-muted ml-3" />
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => { setSource(e.target.value); setFile(null); }}
                      placeholder="https://youtube.com/watch?v=..."
                      className="flex-1 bg-transparent border-none outline-none px-4 py-3 text-white placeholder-text-muted font-sans"
                    />
                    <button
                      type="submit"
                      disabled={isAnalyzing || (!source && !file)}
                      className="bg-white text-black px-6 py-3 rounded-xl font-display font-bold hover:bg-gray-100 transition flex items-center gap-2 disabled:opacity-50"
                    >
                      {isAnalyzing ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                      ) : (
                        <>Analyze <ChevronRight className="w-4 h-4" /></>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-4 w-full">
                  <div className="h-[1px] flex-1 bg-border" />
                  <span className="text-xs uppercase tracking-widest text-text-muted">OR UPLOAD</span>
                  <div className="h-[1px] flex-1 bg-border" />
                </div>

                <div className="relative flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-2xl cursor-pointer bg-surface/50 hover:bg-surface hover:border-accent transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <FileText className="w-8 h-8 text-text-muted mb-2" />
                      <p className="text-sm text-text-muted">
                        {file ? <span className="font-bold text-white">{file.name}</span> : <span>Click to upload a video or audio file</span>}
                      </p>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="video/*,audio/*"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setFile(e.target.files[0]);
                          setSource('');
                        }
                      }} 
                    />
                  </label>
                </div>
              </form>

              {error && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl w-full text-center text-sm">
                  {error}
                </motion.div>
              )}
            </motion.div>
        </AnimatePresence>

        {/* Results Dashboard */}
        <AnimatePresence>
          {result && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1"
            >
              {/* Left Column: Analysis */}
              <div className="lg:col-span-2 flex flex-col gap-6 pb-8">
                <div className="bg-surface/50 backdrop-blur-xl border border-border rounded-3xl p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-accent-2/10 rounded-full blur-[80px]" />
                  <h2 className="font-display text-3xl font-bold text-white mb-2 relative z-10">{result.title}</h2>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent-glow text-xs font-bold uppercase tracking-wider mb-6 relative z-10">
                    <CheckCircle2 className="w-3 h-3" /> Analysis Complete
                  </div>
                  
                  <div className="prose prose-invert prose-p:leading-relaxed max-w-none relative z-10">
                    <h3 className="flex items-center gap-2 text-lg font-display text-white mt-0"><FileText className="w-5 h-5 text-accent-2" /> Summary</h3>
                    <div className="text-sm text-text-muted whitespace-pre-wrap">{result.summary}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card title="Action Items" icon={<CheckCircle2 className="w-5 h-5 text-success" />} content={result.action_items} />
                  <Card title="Key Decisions" icon={<Sparkles className="w-5 h-5 text-warning" />} content={result.key_decisions} />
                  <Card title="Open Questions" icon={<HelpCircle className="w-5 h-5 text-accent-glow" />} content={result.open_questions} className="md:col-span-2" />
                </div>
              </div>

              {/* Right Column: Chat */}
              <div className="bg-surface/80 backdrop-blur-xl border border-border rounded-3xl flex flex-col shadow-2xl sticky top-8 h-[calc(100vh-64px)] max-h-[800px]">
                <div className="p-5 border-b border-border flex items-center gap-3">
                  <MessageSquare className="w-5 h-5 text-accent" />
                  <h3 className="font-display font-bold text-white">Ask Lumina</h3>
                </div>
                
                <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 custom-scrollbar">
                  {chatHistory.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center opacity-50">
                      <MessageSquare className="w-8 h-8 mb-3" />
                      <p className="text-sm">Ask any question about<br/>this meeting's transcript.</p>
                    </div>
                  ) : (
                    chatHistory.map((msg, i) => (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={i} 
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] uppercase tracking-widest text-text-muted mb-1 ml-1">{msg.role === 'user' ? 'You' : 'Lumina'}</span>
                        <div className={`px-4 py-3 rounded-2xl text-sm max-w-[90%] leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user' 
                            ? 'bg-accent text-white rounded-tr-sm' 
                            : 'bg-surface-2 border border-border text-text rounded-tl-sm'
                        }`}>
                          {msg.content}
                        </div>
                      </motion.div>
                    ))
                  )}
                  {isChatting && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start flex-col">
                      <span className="text-[10px] uppercase tracking-widest text-text-muted mb-1 ml-1">Lumina</span>
                      <div className="px-4 py-3 rounded-2xl bg-surface-2 border border-border text-text rounded-tl-sm flex gap-1 items-center h-[44px]">
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 rounded-full bg-text-muted animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </motion.div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div className="p-4 pt-0">
                  <form onSubmit={handleChat} className="relative flex items-center">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      placeholder="Ask a question..."
                      className="w-full bg-surface-2 border border-border rounded-xl py-3 pl-4 pr-12 text-sm text-white placeholder-text-muted outline-none focus:border-accent transition-colors"
                    />
                    <button 
                      type="submit" 
                      disabled={!chatInput.trim() || isChatting}
                      className="absolute right-2 p-2 bg-white text-black rounded-lg hover:bg-gray-200 transition disabled:opacity-50 disabled:hover:bg-white"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a2a3a; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #7c3aed; }
      `}} />
    </div>
  );
}

function Card({ title, icon, content, className = '' }: { title: string, icon: React.ReactNode, content: string, className?: string }) {
  return (
    <div className={`bg-surface/50 backdrop-blur-md border border-border rounded-3xl p-6 hover:border-accent/50 transition-colors ${className}`}>
      <h3 className="flex items-center gap-2 font-display text-white mb-4">
        {icon} {title}
      </h3>
      <div className="text-sm text-text-muted whitespace-pre-wrap leading-relaxed">
        {content}
      </div>
    </div>
  );
}
