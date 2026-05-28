import { useState, useRef, useEffect } from "react";

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

const CATEGORIES = [
  { id: "all",    label: "Geral",           icon: "✦", desc: "Prompt versátil para qualquer finalidade criativa" },
  { id: "art",    label: "Arte",            icon: "◈", desc: "Ilustrações, concept art, pinturas digitais, fine art" },
  { id: "image",  label: "Imagem",          icon: "◻", desc: "Fotografias, retratos, composições realistas" },
  { id: "banner", label: "Banner",          icon: "▬", desc: "Banners digitais, capas, thumbnails, ads" },
  { id: "video",  label: "Vídeo",           icon: "▷", desc: "Prompts para geração e direção de vídeo com IA" },
  { id: "edit",   label: "Edit",            icon: "◑", desc: "Edição de fotos, retoques, composição, efeitos" },
  { id: "3d",     label: "3D",              icon: "◉", desc: "Renders 3D, modelagem, iluminação e materiais" },
  { id: "motion", label: "Motion Graphics", icon: "◎", desc: "Animações, motion design, kinetic typography" },
  { id: "uiux",   label: "UI/UX",           icon: "⊡", desc: "Interfaces, telas, sistemas de design, protótipos" },
  { id: "imggen", label: "Gerar Imagem",    icon: "⬡", desc: "Gere imagens diretamente com FLUX via Pollinations" },
];

const SYSTEM_PROMPTS = {
  all: `Você é um especialista em engenharia de prompts para IA generativa. Responda SEMPRE em português brasileiro.
Transforme a ideia bruta do usuário em um prompt profissional, detalhado e eficaz em PT-BR.
Estruture com: sujeito principal, estilo visual, iluminação, composição, atmosfera, paleta de cores, nível de detalhe e qualidade técnica.
Responda APENAS com o prompt otimizado, sem explicações, sem prefácio, sem aspas.`,
  art: `Você é um especialista em prompts para arte digital e ilustração com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt profissional de arte em PT-BR.
Inclua: estilo artístico, técnica, artista de referência quando relevante, composição, paleta cromática, mood e acabamento final.
Responda APENAS com o prompt otimizado, sem explicações.`,
  image: `Você é um especialista em prompts fotográficos para IA generativa. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt fotográfico técnico e profissional em PT-BR.
Inclua: tipo de câmera e lente, iluminação, composição fotográfica, pós-processamento, estilo fotográfico.
Responda APENAS com o prompt otimizado, sem explicações.`,
  banner: `Você é um especialista em design gráfico e criação de banners com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt de design editorial em PT-BR.
Inclua: formato visual, tipografia, paleta de cores, layout, elementos gráficos, estilo visual.
Responda APENAS com o prompt otimizado, sem explicações.`,
  video: `Você é um especialista em prompts para geração de vídeo com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt cinematográfico em PT-BR.
Inclua: movimento de câmera, tipo de plano, atmosfera cinemática, paleta de cor, mood sonoro implícito.
Responda APENAS com o prompt otimizado, sem explicações.`,
  edit: `Você é um especialista em prompts para edição de imagens com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em instruções precisas de edição visual em PT-BR.
Inclua: tipo de edição, estilo de pós-processamento, ajustes técnicos, efeitos visuais, resultado final.
Responda APENAS com o prompt otimizado, sem explicações.`,
  "3d": `Você é um especialista em prompts para renderização 3D com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt técnico para 3D em PT-BR.
Inclua: tipo de render, materiais e texturas PBR, iluminação 3D, câmera virtual, nível de detalhe, pós-processamento.
Responda APENAS com o prompt otimizado, sem explicações.`,
  motion: `Você é um especialista em prompts para motion graphics com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt técnico para motion design em PT-BR.
Inclua: tipo de animação, ritmo e timing, estilo visual, paleta animada, easing, duração, referência de estúdio.
Responda APENAS com o prompt otimizado, sem explicações.`,
  uiux: `Você é um especialista em prompts para design de interfaces com IA. Responda SEMPRE em português brasileiro.
Transforme a ideia em um prompt detalhado para UI/UX em PT-BR.
Inclua: tipo de interface, plataforma, estilo visual, paleta, tipografia, componentes principais, grid, estados de interação.
Responda APENAS com o prompt otimizado, sem explicações.`,
  imggen: `Você é um especialista em geração de imagens com IA. Responda SEMPRE em português brasileiro.
O usuário quer gerar uma imagem. Otimize a descrição dele em um prompt visual rico e detalhado em PT-BR.
Inclua: sujeito, estilo, iluminação, cores, composição, qualidade técnica, atmosfera.
Responda APENAS com o prompt otimizado em PT-BR, sem explicações. Será usado diretamente no gerador de imagens.`,
};

const EXAMPLES = {
  all:    "Uma mulher caminhando em uma cidade futurista à noite",
  art:    "Guerreiro samurai em floresta de bambu ao amanhecer",
  image:  "Retrato profissional de empresária em escritório moderno",
  banner: "Banner de lançamento de produto tech minimalista",
  video:  "Cena de abertura de um filme noir urbano",
  edit:   "Transformar foto comum em estilo editorial de moda",
  "3d":   "Sala de estar minimalista com luz natural ao entardecer",
  motion: "Animação de logo para agência criativa com identidade dark",
  uiux:   "Dashboard de analytics para startup de finanças",
  imggen: "Astronauta flutuando sobre uma cidade cyberpunk à noite",
};

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function saveSession(session) {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session;
  else sessions.unshift(session);
  localStorage.setItem("nave_sessions", JSON.stringify(sessions.slice(0, 50)));
}

function getSessions() {
  try { return JSON.parse(localStorage.getItem("nave_sessions") || "[]"); }
  catch { return []; }
}

function deleteSession(id) {
  const sessions = getSessions().filter(s => s.id !== id);
  localStorage.setItem("nave_sessions", JSON.stringify(sessions));
}

function NaveLogo() {
  return (
    <svg width="148" height="28" viewBox="0 0 148 28" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="22" fontFamily="'DM Serif Display',Georgia,serif" fontSize="22" fontWeight="400" fill="currentColor">nave</text>
      <text x="58" y="22" fontFamily="'DM Serif Display',Georgia,serif" fontSize="22" fontWeight="400" fill="currentColor" opacity="0.35">growth</text>
      <circle cx="47" cy="20" r="3.5" fill="#7C6FE0" opacity="0.95"/>
    </svg>
  );
}

function TypingDots() {
  return (
    <div style={{display:"flex",gap:"5px",alignItems:"center",padding:"4px 0"}}>
      {[0,1,2].map(i=>(
        <div key={i} style={{width:"6px",height:"6px",borderRadius:"50%",background:"rgba(255,255,255,0.3)",animation:`pulse 1.2s ease-in-out ${i*0.2}s infinite`}}/>
      ))}
    </div>
  );
}

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  return (
    <button onClick={()=>{navigator.clipboard.writeText(text);setCopied(true);setTimeout(()=>setCopied(false),2000);}} style={{
      background:copied?"rgba(124,111,224,0.2)":"transparent",
      border:`1px solid ${copied?"rgba(124,111,224,0.4)":"rgba(255,255,255,0.12)"}`,
      color:copied?"rgba(180,170,255,0.9)":"rgba(255,255,255,0.4)",
      padding:"5px 12px",borderRadius:"6px",fontSize:"11px",cursor:"pointer",
      fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"0.5px",
      transition:"all 0.2s",display:"flex",alignItems:"center",gap:"5px",
    }}>
      {copied?<><span>✓</span>Copiado</>:<><span style={{fontSize:"13px"}}>⎘</span>Copiar</>}
    </button>
  );
}

function ImageMessage({ prompt }) {
  const [status, setStatus] = useState("loading");
  const [imgSrc, setImgSrc] = useState("");

  useEffect(() => {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=768&height=512&nologo=true&enhance=true&model=flux`;
    setImgSrc(url);
  }, [prompt]);

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"8px",flexWrap:"wrap",gap:"7px"}}>
        <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
          <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.2px",textTransform:"uppercase"}}>Imagem Gerada</span>
          <span style={{fontSize:"9.5px",background:"rgba(124,111,224,0.1)",color:"rgba(160,150,255,0.75)",padding:"2px 7px",borderRadius:"4px",letterSpacing:"0.5px",textTransform:"uppercase"}}>FLUX</span>
        </div>
        {status==="done" && (
          <a href={imgSrc} download="nave-image.jpg" target="_blank" rel="noreferrer" style={{
            background:"transparent",border:"1px solid rgba(255,255,255,0.12)",
            color:"rgba(255,255,255,0.4)",padding:"5px 12px",borderRadius:"6px",
            fontSize:"11px",fontFamily:"'Space Grotesk',sans-serif",
            textDecoration:"none",display:"flex",alignItems:"center",gap:"5px",
          }}>↓ Baixar</a>
        )}
      </div>
      {status==="loading" && (
        <div style={{
          background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.07)",
          borderRadius:"10px",padding:"32px",display:"flex",flexDirection:"column",
          alignItems:"center",gap:"12px",
        }}>
          <TypingDots/>
          <p style={{fontSize:"12px",color:"rgba(255,255,255,0.25)",fontFamily:"'Space Grotesk',sans-serif"}}>Gerando imagem com FLUX...</p>
        </div>
      )}
      <img
        src={imgSrc}
        alt={prompt}
        onLoad={()=>setStatus("done")}
        onError={()=>setStatus("error")}
        style={{
          display:status==="done"?"block":"none",
          width:"100%",borderRadius:"10px",
          border:"1px solid rgba(255,255,255,0.07)",
        }}
      />
      {status==="error" && (
        <div style={{
          background:"rgba(255,80,80,0.05)",border:"1px solid rgba(255,80,80,0.15)",
          borderRadius:"10px",padding:"16px",fontSize:"13px",
          color:"rgba(255,120,120,0.7)",fontFamily:"'Space Grotesk',sans-serif",
        }}>Erro ao gerar imagem. Tente novamente.</div>
      )}
    </div>
  );
}

export default function NavePromptStudio() {
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(generateId());
  const [activeTab, setActiveTab] = useState("chat");
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(()=>{
    const check=()=>setIsMobile(window.innerWidth<768);
    check();
    window.addEventListener("resize",check);
    return()=>window.removeEventListener("resize",check);
  },[]);

  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({behavior:"smooth"});
  },[messages,isLoading]);

  useEffect(()=>{
    setSessions(getSessions());
  },[]);

  useEffect(()=>{
    if(messages.length>0){
      const session={
        id:currentSessionId,
        title:messages[0]?.content?.slice(0,40)+"..." || "Nova conversa",
        messages,
        category:selectedCategory,
        updatedAt:Date.now(),
      };
      saveSession(session);
      setSessions(getSessions());
    }
  },[messages]);

  const loadSession=(session)=>{
    setCurrentSessionId(session.id);
    setMessages(session.messages);
    setSelectedCategory(session.category||"all");
    setSidebarOpen(false);
    setActiveTab("chat");
  };

  const newChat=()=>{
    setCurrentSessionId(generateId());
    setMessages([]);
    setInputValue("");
    setSidebarOpen(false);
    setActiveTab("chat");
  };

  const removeSession=(e,id)=>{
    e.stopPropagation();
    deleteSession(id);
    setSessions(getSessions());
    if(currentSessionId===id) newChat();
  };

  const sendMessage = async () => {
    const text = inputValue.trim();
    if (!text || isLoading) return;
    const userMsg = { role:"user", content:text, category:selectedCategory };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputValue("");
    if(textareaRef.current) textareaRef.current.style.height="auto";
    setIsLoading(true);

    try {
      if(selectedCategory==="imggen") {
        // First optimize the prompt
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${GROQ_API_KEY}`},
          body:JSON.stringify({
            model:GROQ_MODEL,
            max_tokens:512,
            temperature:0.7,
            messages:[
              {role:"system",content:SYSTEM_PROMPTS.imggen},
              ...newMessages.filter(m=>m.role==="user").slice(-3).map(m=>({role:"user",content:m.content})),
            ],
          }),
        });
        const data = await res.json();
        const optimizedPrompt = data.choices?.[0]?.message?.content || text;
        setMessages(prev=>[...prev,{
          role:"assistant",content:optimizedPrompt,
          category:"imggen",categoryLabel:"Gerar Imagem",isImage:true,
        }]);
      } else {
        // Build conversation history for memory
        const history = newMessages.map(m=>({
          role: m.role,
          content: m.content,
        }));
        const res = await fetch("https://api.groq.com/openai/v1/chat/completions",{
          method:"POST",
          headers:{"Content-Type":"application/json","Authorization":`Bearer ${GROQ_API_KEY}`},
          body:JSON.stringify({
            model:GROQ_MODEL,
            max_tokens:1024,
            temperature:0.75,
            messages:[
              {role:"system",content:SYSTEM_PROMPTS[selectedCategory]},
              ...history.slice(-10),
            ],
          }),
        });
        const data = await res.json();
        const result = data.choices?.[0]?.message?.content || "Erro ao gerar o prompt.";
        setMessages(prev=>[...prev,{
          role:"assistant",content:result,
          category:selectedCategory,
          categoryLabel:CATEGORIES.find(c=>c.id===selectedCategory)?.label,
        }]);
      }
    } catch {
      setMessages(prev=>[...prev,{role:"assistant",content:"Erro de conexão. Verifique sua chave e tente novamente.",category:"error"}]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown=(e)=>{
    if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}
  };

  const cat = CATEGORIES.find(c=>c.id===selectedCategory);

  const SidebarContent = ()=>(
    <div style={{display:"flex",flexDirection:"column",height:"100%"}}>
      {/* Logo */}
      <div style={{marginBottom:"20px",flexShrink:0}}>
        <NaveLogo/>
        <p style={{fontSize:"11px",color:"rgba(255,255,255,0.18)",marginTop:"4px",fontFamily:"'Space Grotesk',sans-serif"}}>Prompt Studio</p>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:"4px",marginBottom:"16px",flexShrink:0}}>
        {["chat","history"].map(tab=>(
          <button key={tab} onClick={()=>setActiveTab(tab)} style={{
            flex:1,cursor:"pointer",
            background:activeTab===tab?"rgba(255,255,255,0.08)":"transparent",
            border:`1px solid ${activeTab===tab?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)"}`,
            color:activeTab===tab?"#fff":"rgba(255,255,255,0.35)",
            borderRadius:"7px",padding:"7px 0",fontSize:"11.5px",
            fontFamily:"'Space Grotesk',sans-serif",fontWeight:"500",
            transition:"all 0.15s",cursor:"pointer",
          }}>
            {tab==="chat"?"Categorias":"Histórico"}
          </button>
        ))}
      </div>

      {activeTab==="chat" && (
        <>
          <button onClick={newChat} style={{
            cursor:"pointer",
            background:"rgba(124,111,224,0.1)",
            border:"1px solid rgba(124,111,224,0.2)",
            color:"rgba(160,150,255,0.9)",
            borderRadius:"8px",padding:"9px 12px",
            fontSize:"12px",fontFamily:"'Space Grotesk',sans-serif",
            fontWeight:"500",marginBottom:"14px",
            display:"flex",alignItems:"center",gap:"7px",
            transition:"all 0.15s",flexShrink:0,
          }}>
            <span style={{fontSize:"16px"}}>+</span> Nova conversa
          </button>
          <p style={{fontSize:"10px",color:"rgba(255,255,255,0.18)",letterSpacing:"2px",textTransform:"uppercase",marginBottom:"8px",flexShrink:0,fontFamily:"'Space Grotesk',sans-serif"}}>Categoria</p>
          <div style={{display:"flex",flexDirection:"column",gap:"3px",overflowY:"auto",flex:1}}>
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>{setSelectedCategory(c.id);setSidebarOpen(false);}} style={{
                cursor:"pointer",
                border:`1px solid ${selectedCategory===c.id?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.05)"}`,
                borderRadius:"8px",padding:"8px 10px",
                background:selectedCategory===c.id?"rgba(255,255,255,0.06)":"transparent",
                color:selectedCategory===c.id?"#fff":"rgba(255,255,255,0.38)",
                fontFamily:"'Space Grotesk',sans-serif",fontSize:"12px",
                fontWeight:selectedCategory===c.id?"500":"400",
                transition:"all 0.15s",display:"flex",alignItems:"center",gap:"8px",
                width:"100%",textAlign:"left",flexShrink:0,
              }}>
                <span style={{fontSize:"12px",opacity:0.7,minWidth:"14px",textAlign:"center"}}>{c.icon}</span>
                {c.label}
              </button>
            ))}
          </div>
        </>
      )}

      {activeTab==="history" && (
        <div style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"4px"}}>
          {sessions.length===0?(
            <p style={{fontSize:"12px",color:"rgba(255,255,255,0.2)",fontFamily:"'Space Grotesk',sans-serif",textAlign:"center",marginTop:"24px"}}>Nenhuma conversa salva ainda</p>
          ):sessions.map(s=>(
            <div key={s.id} onClick={()=>loadSession(s)} style={{
              cursor:"pointer",
              background:currentSessionId===s.id?"rgba(255,255,255,0.06)":"transparent",
              border:`1px solid ${currentSessionId===s.id?"rgba(255,255,255,0.15)":"rgba(255,255,255,0.05)"}`,
              borderRadius:"8px",padding:"9px 10px",
              display:"flex",alignItems:"center",justifyContent:"space-between",gap:"8px",
              transition:"all 0.15s",
            }}>
              <div style={{minWidth:0,flex:1}}>
                <p style={{fontSize:"12px",color:"rgba(255,255,255,0.7)",fontFamily:"'Space Grotesk',sans-serif",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{s.title}</p>
                <p style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",fontFamily:"'Space Grotesk',sans-serif",marginTop:"2px"}}>
                  {CATEGORIES.find(c=>c.id===s.category)?.label||"Geral"} · {new Date(s.updatedAt).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <button onClick={(e)=>removeSession(e,s.id)} style={{
                background:"transparent",border:"none",color:"rgba(255,255,255,0.2)",
                cursor:"pointer",fontSize:"14px",padding:"2px 4px",flexShrink:0,
                transition:"color 0.15s",
              }}>×</button>
            </div>
          ))}
        </div>
      )}

      <div style={{marginTop:"12px",flexShrink:0}}>
        <div style={{height:"1px",background:"rgba(255,255,255,0.05)",marginBottom:"12px"}}/>
        <div style={{background:"rgba(124,111,224,0.07)",border:"1px solid rgba(124,111,224,0.15)",borderRadius:"8px",padding:"9px 11px"}}>
          <p style={{fontSize:"11px",color:"rgba(124,111,224,0.7)",fontFamily:"'Space Grotesk',sans-serif",lineHeight:1.55}}>
            ✦ Powered by Groq + FLUX<br/>
            <span style={{color:"rgba(255,255,255,0.2)",fontSize:"10px"}}>llama-3.3-70b · Pollinations · PT-BR</span>
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Space+Grotesk:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        html,body,#root{height:100%;overflow:hidden;background:#090909}
        @keyframes pulse{0%,100%{opacity:0.25;transform:scale(0.75)}50%{opacity:1;transform:scale(1)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        .msg-in{animation:fadeUp 0.28s ease forwards}
        ::-webkit-scrollbar{width:3px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.07);border-radius:2px}
        textarea{resize:none}textarea:focus{outline:none}
        .send-btn{cursor:pointer;background:#fff;color:#000;border:none;border-radius:8px;width:38px;height:38px;font-size:17px;display:flex;align-items:center;justify-content:center;transition:all 0.15s;flex-shrink:0}
        .send-btn:hover{background:rgba(255,255,255,0.88);transform:scale(1.05)}
        .send-btn:active{transform:scale(0.96)}
        .send-btn:disabled{background:rgba(255,255,255,0.1);color:rgba(255,255,255,0.25);cursor:not-allowed;transform:none}
        .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);z-index:9;display:none}
        .overlay.open{display:block}
        .sidebar-drawer{position:fixed;left:0;top:0;bottom:0;width:240px;background:#0f0f0f;border-right:1px solid rgba(255,255,255,0.06);z-index:10;transform:translateX(-100%);transition:transform 0.28s cubic-bezier(0.4,0,0.2,1);padding:22px 14px;display:flex;flex-direction:column;overflow:hidden}
        .sidebar-drawer.open{transform:translateX(0)}
        .prompt-box{font-family:'JetBrains Mono',monospace;font-size:12.5px;line-height:1.75;color:rgba(255,255,255,0.82);background:rgba(255,255,255,0.025);border:1px solid rgba(255,255,255,0.07);border-radius:10px;padding:14px 16px;white-space:pre-wrap;word-break:break-word}
      `}</style>

      <div style={{display:"flex",height:"100vh",background:"#090909",color:"#fff",fontFamily:"'Space Grotesk',sans-serif",overflow:"hidden",position:"relative"}}>

        <div className={`overlay${sidebarOpen?" open":""}`} onClick={()=>setSidebarOpen(false)}/>

        {isMobile&&(
          <div className={`sidebar-drawer${sidebarOpen?" open":""}`}>
            <SidebarContent/>
          </div>
        )}

        {!isMobile&&(
          <div style={{width:"230px",flexShrink:0,borderRight:"1px solid rgba(255,255,255,0.05)",padding:"24px 14px",display:"flex",flexDirection:"column",background:"#0d0d0d",overflow:"hidden"}}>
            <SidebarContent/>
          </div>
        )}

        {/* Main */}
        <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* Header */}
          <div style={{
            padding:isMobile?"13px 16px":"15px 24px",
            borderBottom:"1px solid rgba(255,255,255,0.05)",
            display:"flex",alignItems:"center",justifyContent:"space-between",
            flexShrink:0,background:"#090909",
          }}>
            <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
              {isMobile&&(
                <button onClick={()=>setSidebarOpen(true)} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.1)",color:"#fff",borderRadius:"7px",width:"33px",height:"33px",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:"15px"}}>☰</button>
              )}
              {isMobile?<NaveLogo/>:(
                <div>
                  <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                    <span style={{fontSize:"16px",opacity:0.55}}>{cat.icon}</span>
                    <span style={{fontSize:"14px",fontWeight:"500"}}>{cat.label}</span>
                    <span style={{fontSize:"10px",background:"rgba(124,111,224,0.12)",color:"rgba(160,150,255,0.85)",padding:"2px 8px",borderRadius:"4px",letterSpacing:"0.8px",textTransform:"uppercase"}}>
                      {selectedCategory==="imggen"?"FLUX AI":"PROMPT AI"}
                    </span>
                  </div>
                  <p style={{fontSize:"11px",color:"rgba(255,255,255,0.28)",marginTop:"2px"}}>{cat.desc}</p>
                </div>
              )}
            </div>
            <div style={{display:"flex",gap:"8px",alignItems:"center"}}>
              {!isMobile&&(
                <button onClick={newChat} style={{
                  background:"transparent",border:"1px solid rgba(124,111,224,0.2)",
                  color:"rgba(160,150,255,0.7)",padding:"5px 12px",borderRadius:"7px",
                  fontSize:"11.5px",cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",
                  display:"flex",alignItems:"center",gap:"5px",transition:"all 0.2s",
                }}>+ Nova</button>
              )}
              {messages.length>0&&(
                <button onClick={()=>setMessages([])} style={{
                  background:"transparent",border:"1px solid rgba(255,255,255,0.07)",
                  color:"rgba(255,255,255,0.28)",padding:"5px 12px",borderRadius:"7px",
                  fontSize:"11.5px",cursor:"pointer",fontFamily:"'Space Grotesk',sans-serif",
                }}>Limpar</button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{flex:1,overflowY:"auto",padding:isMobile?"18px 14px":"24px 26px",display:"flex",flexDirection:"column",gap:"20px"}}>

            {messages.length===0&&(
              <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:"16px",padding:"48px 0"}}>
                <div style={{width:"58px",height:"58px",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"16px",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"24px",color:"rgba(255,255,255,0.2)",background:"rgba(255,255,255,0.02)"}}>{cat.icon}</div>
                <div style={{textAlign:"center"}}>
                  <p style={{fontSize:"15px",fontWeight:"500",color:"rgba(255,255,255,0.6)",marginBottom:"6px"}}>
                    {selectedCategory==="imggen"?"Gere imagens com FLUX":`Prompts de ${cat.label}`}
                  </p>
                  <p style={{fontSize:"12.5px",color:"rgba(255,255,255,0.27)",maxWidth:"280px",lineHeight:1.65}}>{cat.desc}</p>
                </div>
                <button className="chip-btn" style={{cursor:"pointer",background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:"20px",padding:"6px 14px",fontSize:"11.5px",color:"rgba(255,255,255,0.45)",fontFamily:"'Space Grotesk',sans-serif",transition:"all 0.18s"}} onClick={()=>setInputValue(EXAMPLES[selectedCategory])}>
                  {EXAMPLES[selectedCategory]}
                </button>
              </div>
            )}

            {messages.map((msg,i)=>(
              <div key={i} className="msg-in" style={{display:"flex",flexDirection:msg.role==="user"?"row-reverse":"row",gap:"10px",alignItems:"flex-start"}}>
                {msg.role==="assistant"&&(
                  <div style={{width:"27px",height:"27px",borderRadius:"7px",background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",flexShrink:0,color:"rgba(160,150,255,0.85)"}}>✦</div>
                )}
                <div style={{maxWidth:"88%",minWidth:"50px"}}>
                  {msg.role==="user"?(
                    <div style={{background:"rgba(255,255,255,0.055)",border:"1px solid rgba(255,255,255,0.07)",borderRadius:"10px 3px 10px 10px",padding:"10px 14px",fontSize:"13.5px",lineHeight:1.65,color:"rgba(255,255,255,0.78)"}}>{msg.content}</div>
                  ):(
                    <div>
                      {msg.isImage?(
                        <ImageMessage prompt={msg.content}/>
                      ):(
                        <>
                          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:"7px",flexWrap:"wrap",gap:"7px"}}>
                            <div style={{display:"flex",alignItems:"center",gap:"6px"}}>
                              <span style={{fontSize:"10px",color:"rgba(255,255,255,0.2)",letterSpacing:"1.2px",textTransform:"uppercase"}}>Prompt Gerado</span>
                              {msg.categoryLabel&&<span style={{fontSize:"9.5px",background:"rgba(124,111,224,0.1)",color:"rgba(160,150,255,0.75)",padding:"2px 7px",borderRadius:"4px",letterSpacing:"0.5px",textTransform:"uppercase"}}>{msg.categoryLabel}</span>}
                            </div>
                            <CopyButton text={msg.content}/>
                          </div>
                          <div className="prompt-box">{msg.content}</div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading&&(
              <div className="msg-in" style={{display:"flex",gap:"10px",alignItems:"flex-start"}}>
                <div style={{width:"27px",height:"27px",borderRadius:"7px",background:"rgba(124,111,224,0.12)",border:"1px solid rgba(124,111,224,0.2)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"11px",flexShrink:0,color:"rgba(160,150,255,0.85)"}}>✦</div>
                <div style={{background:"rgba(255,255,255,0.025)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:"10px",padding:"12px 15px"}}><TypingDots/></div>
              </div>
            )}

            <div ref={messagesEndRef}/>
          </div>

          {/* Input */}
          <div style={{padding:isMobile?"10px 14px 18px":"13px 24px 20px",borderTop:"1px solid rgba(255,255,255,0.05)",flexShrink:0,background:"#090909"}}>
            <div style={{display:"flex",gap:"5px",flexWrap:"wrap",marginBottom:"8px"}}>
              {CATEGORIES.map(c=>(
                <button key={c.id} onClick={()=>setSelectedCategory(c.id)} style={{
                  cursor:"pointer",
                  background:selectedCategory===c.id?"rgba(255,255,255,0.08)":"transparent",
                  border:`1px solid ${selectedCategory===c.id?"rgba(255,255,255,0.18)":"rgba(255,255,255,0.06)"}`,
                  color:selectedCategory===c.id?"#fff":"rgba(255,255,255,0.3)",
                  padding:"4px 9px",borderRadius:"5px",fontSize:"10.5px",
                  fontFamily:"'Space Grotesk',sans-serif",letterSpacing:"0.3px",
                  transition:"all 0.15s",display:"flex",alignItems:"center",gap:"4px",
                  whiteSpace:"nowrap",
                }}>
                  <span style={{fontSize:"10px"}}>{c.icon}</span>{c.label}
                </button>
              ))}
            </div>
            <div style={{display:"flex",gap:"9px",alignItems:"flex-end",background:"rgba(255,255,255,0.035)",border:"1px solid rgba(255,255,255,0.09)",borderRadius:"12px",padding:"9px 11px"}}>
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={e=>setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={selectedCategory==="imggen"?"Descreva a imagem que quer gerar...":`Descreva sua ideia para ${cat.label.toLowerCase()}...`}
                rows={1}
                style={{flex:1,background:"transparent",border:"none",color:"#fff",fontSize:"13.5px",lineHeight:1.6,fontFamily:"'Space Grotesk',sans-serif",maxHeight:"110px",overflow:"auto",paddingTop:"2px"}}
                onInput={e=>{e.target.style.height="auto";e.target.style.height=Math.min(e.target.scrollHeight,110)+"px";}}
              />
              <button className="send-btn" onClick={sendMessage} disabled={!inputValue.trim()||isLoading}>
                <span style={{fontSize:"15px",marginLeft:"1px"}}>↑</span>
              </button>
            </div>
            <p style={{fontSize:"10px",color:"rgba(255,255,255,0.14)",marginTop:"6px",textAlign:"center"}}>
              Enter para enviar · Shift+Enter para nova linha · nave © 2025
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
