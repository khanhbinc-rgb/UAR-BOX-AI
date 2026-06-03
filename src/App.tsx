import { useState, useEffect, useRef } from "react";
import { askGemini } from "./services/geminiService";
import { generateFluxImage } from "./services/fluxService";

import micIcon from "./assets/Mic.png";
import sendIcon from "./assets/send.png";
import logoIcon from "./assets/Logo UAR AI.png";

import sidebarOpenIcon from "./assets/Sidebar open.png";
import sidebarCloseIcon from "./assets/Sidebar close.png";

function App() {
  // STATES
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [, setIsHome] = useState(true);
  const [chatHistory, setChatHistory] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"chat" | "render">("chat");
  
  // IMAGE SLOTS
  const [selectedImage, setSelectedImage] = useState<string | null>(null); // Sketch / CAD
  const [referenceImage, setReferenceImage] = useState<string | null>(null); // Ảnh tham chiếu mẫu
  const [isExtracting, setIsExtracting] = useState(false); // Trạng thái AI đang đọc ảnh mẫu

  const [showMenu, setShowMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBars] = useState(Array.from({ length: 32 }));

  // RENDER CONFIG FILTER STATES
  const [mainCategory, setMainCategory] = useState<"architecture" | "interior" | "planning">("architecture");
  const [archStyle, setArchStyle] = useState("Phong cách hiện đại");
  const [archContext, setArchContext] = useState("Ở đường phố việt nam");
  const [archLighting, setArchLighting] = useState("Ánh sáng ban ngày tự nhiên, trời trong xanh");
  
  // SPECS STATES
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [renderCount, setRenderCount] = useState<number>(1); 
  const [qualityLevel, setQualityLevel] = useState<"1K" | "2K" | "4K">("2K"); // Mặc định chọn sẵn 2K

  // SIDEBAR & AUTH STATES
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(false); 
  const [isHoveredLogo, setIsHoveredLogo] = useState(false); 
  const [user, setUser] = useState<any>(null); 
  const [showAuthModal, setShowAuthModal] = useState(false); 
  const [showUserDropdown, setShowUserDropdown] = useState(false); 

  // REFS
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // LOAD CHAT HISTORY
  useEffect(() => {
    const saved = localStorage.getItem("uar-chat-history");
    if (saved) {
      const parsed = JSON.parse(saved);
      setChatHistory(parsed);
      if (parsed.length > 0) {
        setCurrentChatId("");
        setMessages([]);
      }
    }
  }, []);

  // SAVE CHAT HISTORY
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const updatedHistory = chatHistory.map((chat) => {
        if (chat.id === currentChatId) {
          return { ...chat, messages: messages };
        }
        return chat;
      });
      setChatHistory(updatedHistory);
      localStorage.setItem("uar-chat-history", JSON.stringify(updatedHistory));
    }
  }, [messages]);

  // AUTO SCROLL
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

  // CLICK OUTSIDE MENU
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  const typeMessage = async (fullText: string) => {
    let current = "";
    setMessages((prev) => [...prev, { role: "ai", content: "" }]);

    for (let i = 0; i < fullText.length; i++) {
      current += fullText[i];
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "ai",
          content: current,
        };
        return updated;
      });
      await sleep(8);
    }
  };

  // RECORD
  const startRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt không hỗ trợ ghi âm");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "vi-VN";
    recognition.continuous = false;
    recognition.interimResults = false;

    setIsRecording(true);
    recognition.start();

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setMessage(transcript);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };
  };

  // UPLOAD SKETCH / CAD
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setSelectedImage(imageUrl);
  };

  // UPLOAD REFERENCE IMAGE
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const imageUrl = URL.createObjectURL(file);
    setReferenceImage(imageUrl);
  };

  // AI VISION EXTRACT PROMPT FROM REFERENCE IMAGE
  const handleExtractPrompt = async () => {
    if (!referenceImage) return;
    setIsExtracting(true);
    try {
      await sleep(1800); 
      const simulatedAIPrompt = `Kiến trúc mặt tiền tối giản, mảng tường bê tông trần mộc mạc kết hợp lam gỗ dọc chịu nước, hệ kính lớn tràn viền thu trọn ánh sáng, thiết kế hình khối giật cấp hiện đại, cây xanh rủ nhẹ tại ban công tầng 2.`;
      setMessage(simulatedAIPrompt);
    } catch (err) {
      alert("Có lỗi xảy ra khi phân tích hình ảnh mẫu.");
    } finally {
      setIsExtracting(false);
    }
  };

  // EXECUTE MAIN RENDER COMMAND BUTTON
  const handleMainRenderTrigger = async () => {
    setIsHome(false);
    loading || setLoading(true);

    const currentMessage = message || "Phối cảnh thiết kế kiến trúc cao cấp";
    let activeId = currentChatId;

    if (!activeId) {
      activeId = Date.now().toString();
      setCurrentChatId(activeId);
      const newChat = {
        id: activeId,
        title: currentMessage.length > 20 ? currentMessage.substring(0, 20) + "..." : currentMessage,
        messages: []
      };
      const updatedHistory = [newChat, ...chatHistory];
      setChatHistory(updatedHistory);
      localStorage.setItem("uar-chat-history", JSON.stringify(updatedHistory));
    }

    try {
      let compiledPrompt = "";
      if (mainCategory === "architecture") {
        compiledPrompt = `Architectural 3D render, Style: ${archStyle}, Context: ${archContext}, Light environment: ${archLighting}.`;
      } else {
        compiledPrompt = `Design render preview, Category: ${mainCategory}.`;
      }

      if (message.trim()) {
        compiledPrompt += ` Visual concept details: ${currentMessage}.`;
      }

      compiledPrompt += ` aspect ratio ${aspectRatio}, batch count ${renderCount}, resolution quality ${qualityLevel}, ultra realistic, structural architectural mapping, studio sharpness.`;
      
      const imageUrl = await generateFluxImage(compiledPrompt);

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: `Kết quả Khởi tạo phối cảnh [Chất lượng: ${qualityLevel}] - Số lượng: ${renderCount} bản - Tỉ lệ: ${aspectRatio}`,
          image: imageUrl,
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content: err?.message || "Lỗi khởi tạo mô hình render từ hệ thống.",
        },
      ]);
    }

    setLoading(false);
    setMessage("");
  };

  // UNIVERSAL CHAT CONTROLLER
  const handleAsk = async () => {
    if (!message.trim()) return;
    setIsHome(false);
    setMessages((prev) => [...prev, { role: "user", content: message }]);
    loading || setLoading(true);
    try {
      const aiText = await askGemini(message);
      await typeMessage(aiText);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "ai", content: "Lỗi kết nối." }]);
    }
    setLoading(false);
    setMessage("");
  };

  const handleNewChat = () => {
    setMode("chat");
    setMessages([]);
    setCurrentChatId("");
    setSelectedImage(null);
    setReferenceImage(null);
    setMessage("");
  };

  const handleSelectChat = (chat: any) => {
    setMode("chat");
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setSelectedImage(null);
    setReferenceImage(null);
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title?.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  const handleBackToHome = () => {
    setMode("chat");
    setMessages([]);
    setSelectedImage(null);
    setReferenceImage(null);
    setMessage("");
    setCurrentChatId("");
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        name: "Kiến Trúc Sư UAR",
        email: "kts.uarbox@gmail.com",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocI6G...=s96-c"
      });
      setShowAuthModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserDropdown(false);
  };

  const latestImage = [...messages].reverse().find((m) => m.image)?.image || null;

  return (
    <div className="h-screen overflow-hidden bg-[#0d0d0d] text-white font-sans flex relative">
      {/* APP STYLE MANAGER */}
      <style>
        {`
          .record-bar{
            width:3px;
            height:10px;
            border-radius:999px;
            background:white;
            animation:wave 1s ease-in-out infinite;
            opacity:.8;
          }
          @keyframes wave{
            0%,100%{ height:8px; opacity:.4; }
            50%{ height:28px; opacity:1; }
          }
          .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.08);
            border-radius: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.18);
          }
          select {
            appearance: none;
            -webkit-appearance: none;
            -moz-appearance: none;
            background-image: url("data:image/svg+xml;utf8,<svg fill='gray' height='24' viewBox='0 0 24 24' width='24' xmlns='http://www.w3.org/2000/svg'><path d='M7 10l5 5 5-5z'/></svg>");
            background-repeat: no-repeat;
            background-position: right 14px center;
            background-size: 16px;
          }
        `}
      </style>

      {/* SIDEBAR COMPONENT */}
      <div className={`h-full bg-[#111111] border-r border-white/5 flex flex-col p-4 shrink-0 z-30 transition-all duration-300 relative ${
        showSidebar ? "w-[260px] opacity-100" : "w-0 p-0 opacity-0 border-r-0 pointer-events-none"
      }`}>
        {showSidebar && (
          <div className="flex items-center justify-between mb-6 pr-10">
            <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToHome}>
              <img src={logoIcon} alt="logo" className="w-10 h-10 rounded-full object-cover transition hover:scale-105" />
              <div>
                <h1 className="text-[15px] font-medium hover:text-slate-300 transition">UAR BOX 1.0</h1>
                <p className="text-xs text-slate-500">Architecture AI</p>
              </div>
            </div>
            <button
              onClick={() => setShowSidebar(false)}
              className="absolute top-4 right-3 w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition z-40"
            >
              <img src={sidebarCloseIcon} alt="Close Sidebar" className="w-7 h-7 object-contain opacity-70 hover:opacity-100 transition" />
            </button>
          </div>
        )}

        <button
          onClick={handleNewChat}
          className="w-full h-11 border border-white/10 hover:bg-white/5 transition rounded-xl flex items-center justify-start px-4 gap-3 mb-4 text-sm font-medium text-slate-200"
        >
          <span className="text-xl font-light">+</span> Đoạn chat mới
        </button>

        <div className="w-full mb-4">
          <input
            type="text"
            value={searchHistoryQuery}
            onChange={(e) => setSearchHistoryQuery(e.target.value)}
            placeholder="Tìm kiếm đoạn chat..."
            className="w-full h-9 bg-[#1a1a1a] border border-white/5 rounded-lg px-3 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-white/20 transition"
          />
        </div>

        <div className="flex-1 overflow-y-auto sidebar-scroll space-y-1 pr-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-600 px-2 mb-2">Gần đây</p>
          {filteredHistory.length === 0 ? (
            <p className="text-xs text-slate-600 px-2 italic py-2">Không tìm thấy kết quả</p>
          ) : (
            filteredHistory.map((chat) => (
              <button
                key={chat.id}
                onClick={() => handleSelectChat(chat)}
                className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition truncate block ${
                  currentChatId === chat.id ? "bg-[#202020] text-white border border-white/5" : "text-slate-400 hover:bg-[#161616] hover:text-slate-200"
                }`}
              >
                {chat.title || "Đoạn chat không tên"}
              </button>
            ))
          )}
        </div>

        <div className="h-[1px] bg-white/5 my-3" />
        <div className="space-y-1">
          <button
            onClick={() => setMode("render")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3 ${
              mode === "render" ? "bg-[#202020] text-white border border-white/5" : "text-slate-400 hover:bg-[#161616] hover:text-slate-200"
            }`}
          >
            <span className="text-xs">🖼️</span> Thư viện Render
          </button>
        </div>
      </div>

      {/* CORE DISPLAY STAGE */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">
        {/* CHAT INTERFACE MODE */}
        {mode === "chat" && (
          <div className="relative h-full flex flex-col overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#1f2937,transparent_25%),radial-gradient(circle_at_bottom,#111827,transparent_20%),radial-gradient(circle_at_right,#0f172a,transparent_25%)] opacity-80" />
            
            {/* TOP BAR HEADER */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5">
              <div className="flex items-center gap-3">
                {!showSidebar && (
                  <>
                    <div 
                      className="w-10 h-10 relative cursor-pointer"
                      onMouseEnter={() => setIsHoveredLogo(true)}
                      onMouseLeave={() => setIsHoveredLogo(false)}
                      onClick={() => setShowSidebar(true)}
                    >
                      <img src={isHoveredLogo ? sidebarOpenIcon : logoIcon} alt="logo" className="w-full h-full rounded-full object-cover hover:scale-105 transition-all duration-200" />
                    </div>
                    <div className="cursor-pointer select-none" onClick={handleBackToHome}>
                      <h1 className="text-[15px] font-medium hover:text-slate-300 transition">UAR BOX 1.0</h1>
                      <p className="text-xs text-slate-500">Architecture AI</p>
                    </div>
                  </>
                )}
              </div>

              {/* USER PANEL COMPONENT */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  <div 
                    className="flex items-center gap-3 bg-[#1c1c1c] border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#252525] transition"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="w-7 h-7 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white overflow-hidden">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">{user.name}</span>
                    {showUserDropdown && (
                      <div className="absolute right-0 top-12 w-48 bg-[#1c1c1c] border border-white/10 rounded-xl p-1 shadow-2xl flex flex-col z-50">
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button onClick={handleLogout} className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-lg text-sm transition">
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <button onClick={() => setShowAuthModal(true)} className="px-4 py-2 rounded-xl bg-white text-black hover:bg-slate-200 transition text-sm font-medium shadow-md">
                    Đăng nhập / Đăng ký
                  </button>
                )}
              </div>
            </div>

            {/* EMPTY CHAT SCREEN */}
            {messages.length === 0 && (
              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pb-32">
                <h1 className="text-5xl font-semibold tracking-tight mb-5">UAR BOX 1.0</h1>
                <p className="max-w-2xl text-lg text-slate-400 leading-9">Chào bạn, tôi là AI hỗ trợ Kiến Trúc & Nội Thất UAR HOME.</p>
              </div>
            )}

            {/* MESSAGE INTERACTION HISTORY */}
            {messages.length > 0 && (
              <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-40">
                <div className="max-w-4xl mx-auto py-10 space-y-8">
                  {messages.map((msg, index) => (
                    <div key={index} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[80%] ${msg.role === "user" ? "bg-[#202020] border border-white/10 text-white" : "bg-[#171717] border border-white/10 text-white"} px-4 py-4 rounded-3xl`}>
                        {msg.content && <div className="whitespace-pre-wrap leading-8 text-[16px]">{msg.content}</div>}
                        {msg.image && <img src={msg.image} alt="content asset" className="mt-2 rounded-2xl max-w-[320px] object-cover overflow-hidden" />}
                      </div>
                    </div>
                  ))}
                  {loading && <div className="text-slate-500 animate-pulse">UAR đang xử lý dữ liệu...</div>}
                  <div ref={messagesEndRef} />
                </div>
              </div>
            )}

            {/* FOOTER CHAT CONSOLE BAR */}
            <div className={`absolute left-0 right-0 z-20 px-6 pb-8 transition-all duration-500 ${messages.length === 0 ? "bottom-[35%] transform translate-y-1/2" : "bottom-0"}`}>
              <div className="max-w-4xl mx-auto">
                <div className="bg-[#171717] border border-white/10 rounded-[28px] px-4 py-3 shadow-2xl">
                  <div className="flex items-center gap-3">
                    <div className="relative" ref={menuRef}>
                      <button onClick={() => setShowMenu(!showMenu)} className="w-11 h-11 rounded-full hover:bg-white/10 transition-all duration-300 flex items-center justify-center text-3xl text-slate-300">
                        <span className={`transition-transform duration-300 ${showMenu ? "rotate-45" : "rotate-0"}`}>+</span>
                      </button>
                      <div className={`${showMenu ? "flex" : "hidden"} flex-col absolute bottom-14 left-0 bg-[#1c1c1c] border border-white/10 rounded-2xl p-2 w-56 shadow-2xl`}>
                        <button onClick={() => setMode("render")} className="text-left px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm">Render Box</button>
                        <label className="px-4 py-3 rounded-xl hover:bg-white/10 transition text-sm cursor-pointer">
                          Add Photo & File
                          <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                        </label>
                      </div>
                    </div>

                    <textarea
                      value={message}
                      rows={1}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleAsk();
                        }
                      }}
                      placeholder="Hỏi bất cứ điều gì..."
                      className="flex-1 bg-transparent resize-none outline-none text-[16px] leading-7 py-1 text-white placeholder:text-slate-500"
                    />

                    {message.trim() ? (
                      <button onClick={handleAsk} disabled={loading} className="w-10 h-10 flex items-center justify-center rounded-full bg-white hover:scale-105 transition shrink-0">
                        <img src={sendIcon} alt="send" className="w-4 h-4 object-contain" />
                      </button>
                    ) : (
                      <div className="flex items-center gap-3">
                        {isRecording && (
                          <div className="flex items-center gap-[3px] h-10">
                            {recordingBars.map((_, index) => (
                              <div key={index} className="record-bar" style={{ animationDelay: `${index * 0.05}s` }} />
                            ))}
                          </div>
                        )}
                        <button onClick={startRecording} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 transition shrink-0">
                          <img src={micIcon} alt="mic" className={`w-4 h-4 object-contain ${isRecording ? "opacity-100 scale-125" : "opacity-80"}`} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* HIGH RESOLUTION RENDER MODE STAGE (FONT SIZES ENHANCED FOR BETTER READABILITY) */}
        {mode === "render" && (
          <div className="flex h-full gap-6 p-6 overflow-hidden bg-[#0d0d0d]">
            {/* LEFT CONTROL SIDEBAR PANEL */}
            <div className="w-[450px] bg-[#111111] border border-white/5 p-6 rounded-3xl flex flex-col justify-between overflow-y-auto sidebar-scroll">
              <div className="space-y-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-2xl font-bold tracking-tight text-white">RENDER BOX</h2>
                  <button 
                    onClick={() => setMode("chat")} 
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-[#1a1a1a] border border-white/5 text-slate-300 hover:bg-[#222222] hover:text-white transition"
                  >
                    Chat Box
                  </button>
                </div>

                {/* 1. MAIN CLASSIFICATION TABS - TEXT SIZE UPGRADE */}
                <div className="grid grid-cols-3 gap-1.5 bg-[#161616] p-1 border border-white/5 rounded-xl">
                  <button 
                    onClick={() => setMainCategory("architecture")}
                    className={`py-2.5 text-sm font-bold rounded-lg transition ${mainCategory === "architecture" ? "bg-[#252525] text-white shadow-md border border-white/5" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Kiến trúc
                  </button>
                  <button 
                    onClick={() => setMainCategory("interior")}
                    className={`py-2.5 text-sm font-bold rounded-lg transition ${mainCategory === "interior" ? "bg-[#252525] text-white shadow-md border border-white/5" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Nội thất
                  </button>
                  <button 
                    onClick={() => setMainCategory("planning")}
                    className={`py-2.5 text-sm font-bold rounded-lg transition ${mainCategory === "planning" ? "bg-[#252525] text-white shadow-md border border-white/5" : "text-slate-500 hover:text-slate-300"}`}
                  >
                    Quy hoạch
                  </button>
                </div>

                {/* 2. SKETCH / CAD SLOT */}
                <div className="h-36 border border-dashed border-white/10 bg-[#161616]/40 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center group transition-all duration-200">
                  {selectedImage ? (
                    <div className="w-full h-full relative flex items-center justify-center p-2 bg-black/30">
                      <img src={selectedImage} alt="CAD Source Asset" className="max-h-full max-w-full object-contain rounded-xl" />
                      <button 
                        onClick={(e) => { e.preventDefault(); setSelectedImage(null); }} 
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/80 hover:bg-black border border-white/10 text-white text-sm flex items-center justify-center transition shadow-lg z-20"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <input type="file" hidden accept="image/*" onChange={handleImageUpload} />
                      <div className="text-2xl text-slate-500 group-hover:text-slate-300 transition mb-1 font-light">+</div>
                      <div className="text-sm text-slate-400 group-hover:text-slate-200 transition font-semibold">Upload Sketch / CAD</div>
                    </label>
                  )}
                </div>

                {/* 3. REFERENCE TARGET ASSET SLOT */}
                <div className="h-36 border border-dashed border-white/10 bg-[#161616]/40 rounded-2xl relative overflow-hidden flex flex-col items-center justify-center group transition-all duration-200">
                  {referenceImage ? (
                    <div className="w-full h-full relative flex items-center justify-center p-2 bg-black/30">
                      <img src={referenceImage} alt="Style Target Ref" className="max-h-full max-w-full object-contain rounded-xl" />
                      <button 
                        onClick={(e) => { e.preventDefault(); setReferenceImage(null); }} 
                        className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/80 hover:bg-black border border-white/10 text-white text-sm flex items-center justify-center transition shadow-lg z-20"
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                      <input type="file" hidden accept="image/*" onChange={handleReferenceUpload} />
                      <div className="text-2xl text-slate-500 group-hover:text-slate-300 transition mb-1">+</div>
                      <div className="text-sm text-slate-400 group-hover:text-slate-200 transition font-semibold">Upload ảnh tham chiếu</div>
                    </label>
                  )}
                </div>

                {/* 4. PROMPT TEXTAREA & HIGHLY VISIBLE AI EXTRACTION BUTTON BUTTON */}
                <div className="space-y-3">
                  <textarea 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Ý tưởng thiết kế bổ sung (Vật liệu, vân mặt đá, kính, kết cấu cơ khí, màu sắc chi tiết...)"
                    className="w-full h-24 p-3.5 bg-[#161616] border border-white/5 rounded-xl text-base text-slate-200 placeholder:text-slate-600 outline-none focus:border-white/10 resize-none transition"
                  />
                  
                  {/* RE-DESIGNED PROMPT BUTTON: VISUALLY STUNNING AND EXTREMELY RECOGNIZABLE */}
                  <button
                    type="button"
                    onClick={handleExtractPrompt}
                    disabled={!referenceImage || isExtracting}
                    className={`w-full h-12 rounded-xl text-sm font-bold tracking-wide transition-all duration-300 flex items-center justify-center gap-2 border shadow-xl ${
                      referenceImage 
                        ? "bg-gradient-to-r from-blue-600 to-indigo-600 border-blue-400/30 text-white shadow-blue-950/40 hover:from-blue-500 hover:to-indigo-500 hover:scale-[1.01] active:scale-[0.99] cursor-pointer" 
                        : "bg-[#151515] border-white/5 text-slate-600 shadow-none cursor-not-allowed"
                    }`}
                  >
                    {isExtracting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        AI đang phân tích ánh sáng & chất liệu...
                      </>
                    ) : (
                      <>
                        <span>Tạo prompt từ ảnh tham chiếu</span>
                        {!referenceImage && <span className="text-[11px] font-normal text-slate-500 opacity-80"></span>}
                      </>
                    )}
                  </button>
                </div>

                {/* 5. DROP-DOWN SELECT CATEGORIES WITH INCREASED FONT SIZE */}
                {mainCategory === "architecture" && (
                  <div className="space-y-3 pt-1 animate-in fade-in duration-200">
                    <select 
                      value={archStyle}
                      onChange={(e) => setArchStyle(e.target.value)}
                      className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-sm md:text-base text-slate-300 font-medium outline-none cursor-pointer focus:border-white/10 transition"
                    >
                    
                      <option value="Phong cách hiện đại">Phong cách hiện đại</option>
                      <option value="Phong cách tối giản">Phong cách Tối giản</option>
                      <option value="Phong cách neoclassic">Phong cách Neoclassic</option>
                      <option value="Phong cách indochine">Phong cách Indochine</option>
                      <option value="Phong cách công nghiệp">Phong cách Công nghiệp</option>
                      <option value="Phong cách scandinavian">Phong cách Scandinavian</option>
                    </select>

                    <select 
                      value={archContext}
                      onChange={(e) => setArchContext(e.target.value)}
                      className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-sm md:text-base text-slate-300 font-medium outline-none cursor-pointer focus:border-white/10 transition"
                    >
                      <option value="Ở đường phố việt nam">Bối cảnh Đường phố Việt Nam</option>
                      <option value="Ở vùng làng quên việt nam">Bối cảnh Vùng làng quê Việt Nam</option>
                      <option value="Ở khu đô thị sang trọng, hiện đại vinhomes hà nội">Bối cảnh KĐT Vinhomes Hà Nội</option>
                      <option value="Ở ngã ba đường phố việt nam">Bối cảnh Ngã ba đường phố Việt Nam</option>
                      <option value="Ở sân vườn nhiệt đới tại miền quên việt nam">Bối cảnh Sân vườn nhiệt đới miền quê</option>
                      <option value="Nằm bên đường nhựa với 2 bên cạnh nhà là cây xanh">Bối cảnh Đường nhựa cây xanh 2 bên</option>
                      <option value="Nằm trong Vườn châu Âu rộng, lối đi lát đá, tượng thần và cây cắt tỉa hình khối">Bối cảnh Vườn Châu Âu cổ điển, tượng thần</option>
                      <option value="Nằm dưới chân núi hùng vĩ, bao quanh là khu vườn xanh mướt và cây lá mùa thu nhiều màu sắc. Phía trước có hồ bơi và thảm cỏ phẳng mượt">Bối cảnh Chân núi hùng vĩ, hồ bơi & lá thu</option>
                    </select>

                    <select 
                      value={archLighting}
                      onChange={(e) => setArchLighting(e.target.value)}
                      className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-sm md:text-base text-slate-300 font-medium outline-none cursor-pointer focus:border-white/10 transition"
                    >
                      <option value="Ánh sáng ban ngày tự nhiên, trời trong xanh">Ánh sáng Ban ngày tự nhiên</option>
                      <option value="Ánh sáng hoàng hôn ấm áp, đổ bóng dài">Ánh sáng Hoàng hôn ấm áp</option>
                      <option value="Ánh sáng ban đêm, ánh trăng chiếu sáng toàn cảnh, nhấn mạnh đèn nội thất và ngoại thất">Ánh sáng Ban đêm, đèn nội ngoại thất</option>
                      <option value="Trời u ám, ánh sáng dịu, không có bóng gắt">Ánh sáng Trời u ám dịu nhẹ</option>
                      <option value="Bình minh với ánh sáng trong trẻo và không khí yên bình">Ánh sáng Bình minh trong trẻo</option>
                      <option value="Buổi hoàng hôn tím với ánh sáng đèn nội thất hắt ra lung linh">Ánh sáng Hoàng hôn tím lung linh</option>
                      <option value="Sương mù dày đặc vào sáng sớm tạo cảm giác huyền ảo">Ánh sáng Sương mù huyền ảo</option>
                      <option value="Trời vừa mưa xong đường hơi ướt, bầu trời mây nhẹ">Ánh sáng Sau cơn mưa mây nhẹ</option>
                    </select>

                    {/* 6. ASPECT RATIO FILTERS SELECT */}
                    <select 
                      value={aspectRatio}
                      onChange={(e) => setAspectRatio(e.target.value)}
                      className="w-full p-4 bg-[#161616] border border-white/5 rounded-xl text-sm md:text-base text-slate-300 font-medium outline-none cursor-pointer focus:border-white/10 transition"
                    >
                      <option value="1:1">Tỉ lệ khung hình (1:1)</option>
                      <option value="4:3">Tỉ lệ khung hình (4:3)</option>
                      <option value="3:4">Tỉ lệ khung hình (3:4)</option>
                      <option value="16:9">Tỉ lệ khung hình (16:9)</option>
                      <option value="9:16">Tỉ lệ khung hình (9:16)</option>
                    </select>
                  </div>
                )}

                {/* TABS EXTENSIONS */}
                {mainCategory === "interior" && (
                  <div className="p-4 border border-white/5 bg-[#161616]/30 rounded-xl text-center text-sm text-slate-500 italic">
                    Hạng mục cấu hình chi tiết Nội Thất đang được tối ưu hóa.
                  </div>
                )}
                {mainCategory === "planning" && (
                  <div className="p-4 border border-white/5 bg-[#161616]/30 rounded-xl text-center text-sm text-slate-500 italic">
                    Hạng mục cấu hình chi tiết Quy Hoạch đang được cập nhật...
                  </div>
                )}

                {/* 7. BATCH COUNT SELECTION BAR */}
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 pl-1">Số lượng ảnh khởi tạo</span>
                  <div className="grid grid-cols-4 gap-2 bg-[#161616] p-1 border border-white/5 rounded-xl">
                    {[1, 2, 3, 4].map((num) => (
                      <button
                        key={num}
                        type="button"
                        onClick={() => setRenderCount(num)}
                        className={`py-2 text-sm font-bold rounded-lg transition-all ${
                          renderCount === num 
                            ? "bg-white text-black font-extrabold shadow-md" 
                            : "text-slate-400 hover:text-slate-200 hover:bg-white/5"
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 8. EXECUTION INTERFACE WITH 1K/2K/4K RADIO BUTTONS AND ONE EXCLUSIVE MASTER RENDER BUTTON */}
              <div className="mt-5 space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-500 pl-1">Chất lượng ảnh xuất bản</span>
                  <div className="grid grid-cols-3 gap-2 bg-[#161616] p-1 border border-white/5 rounded-xl">
                    {(["1K", "2K", "4K"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setQualityLevel(level)}
                        className={`py-2 text-sm font-bold rounded-lg transition-all ${
                          qualityLevel === level 
                            ? "bg-[#2a2a2a] text-white border border-white/20 shadow-inner scale-[1.02]" 
                            : "text-slate-500 hover:text-slate-300"
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* CRITICAL CHANGE: PRIMARY ALIGNED CALL TO ACTION RUNNING LATEST RENDER COMMAND */}
                <button 
                  disabled={loading}
                  onClick={handleMainRenderTrigger}
                  className="w-full h-14 bg-white text-black font-bold text-base rounded-2xl hover:bg-slate-200 active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-2xl disabled:opacity-40"
                >
                  {loading ? "Đang xử lý cấu trúc vật liệu..." : `Render ${qualityLevel}`}
                </button>
              </div>
            </div>

            {/* RIGHT MAIN GRAPHICS OUTPUT DISPLAY ENGINE */}
            <div className="flex-1 bg-[#111111] border border-white/5 rounded-3xl relative flex flex-col items-center justify-center overflow-hidden">
              {latestImage ? (
                <div className="w-full h-full p-4 flex items-center justify-center relative group">
                  <img src={latestImage} alt="Core Renderer Matrix Output" className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl animate-in zoom-in-95 duration-200" />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-3">
                    <a href={latestImage} download="UAR-HighRes-Production.jpg" className="px-5 py-2 bg-white text-black font-semibold text-sm rounded-xl hover:bg-slate-200 transition">
                      Tải về máy tính của bạn
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6 max-w-sm">
                  <div className="text-5xl">✨</div>
                  <h3 className="text-lg font-semibold text-slate-300">Kết Quả Render</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">Kết quả sẽ xuất hiện ở đây.</p>
                </div>
              )}
              {loading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-4 z-10 animate-in fade-in duration-200">
                  <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm font-medium text-slate-300 text-center px-5">Đang xử lý ánh sáng môi trường, cấu trúc hình khối & dựng bản đồ vật liệu chi tiết cao...</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* IDENTITY SECURITY CONTAINER CONTROL */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-sm bg-[#141414] border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-6">
            <button onClick={() => setShowAuthModal(false)} className="absolute top-4 right-4 text-slate-500 hover:text-white transition">✕</button>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight">Đăng nhập hoặc đăng ký</h2>
              <p className="text-xs text-slate-400">Bạn sẽ nhận được phản hồi thông minh và hệ thống render sẽ có ảnh chất lượng hơn.</p>
            </div>
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-11 bg-white hover:bg-slate-200 text-black font-medium text-sm rounded-xl transition flex items-center justify-center gap-3 shadow-md"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Tiếp tục với tài khoản Google
            </button>
            <p className="text-[10px] text-center text-slate-600">Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của UAR BOX.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;