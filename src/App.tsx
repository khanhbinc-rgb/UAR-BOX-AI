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
  const [isHome, setIsHome] = useState(true);
  const [chatHistory, setChatHistory] =
  useState<any[]>([]);

const [currentChatId, setCurrentChatId] =
  useState<string>("");
  const [loading, setLoading] = useState(false);

  const [mode, setMode] =
    useState<"chat" | "render">("chat");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const [showMenu, setShowMenu] =
    useState(false);

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingBars] = useState(
    Array.from({ length: 32 })
  );

  const [style] =
    useState("Modern Luxury");

  const [aspectRatio] =
    useState("16:9");

  // NEW STATES FOR SIDEBAR
  const [searchHistoryQuery, setSearchHistoryQuery] = useState("");
  const [showSidebar, setShowSidebar] = useState(true); 
  const [isHoveredLogo, setIsHoveredLogo] = useState(false); 

  // AUTH STATES (TÍNH NĂNG ĐĂNG NHẬP MỚI)
  const [user, setUser] = useState<any>(null); // Lưu thông tin user sau khi login
  const [showAuthModal, setShowAuthModal] = useState(false); // Đóng/mở bảng đăng nhập
  const [showUserDropdown, setShowUserDropdown] = useState(false); // Thả menu đăng xuất

  // REFS
  const messagesEndRef =
    useRef<HTMLDivElement>(null);

  const menuRef =
    useRef<HTMLDivElement>(null);
  const userMenuRef = 
    useRef<HTMLDivElement>(null);

// LOAD CHAT HISTORY
useEffect(() => {

  const saved =
    localStorage.getItem("uar-chat-history");

  if (saved) {

    const parsed = JSON.parse(saved);

    setChatHistory(parsed);

    if (parsed.length > 0) {

      setCurrentChatId(parsed[0].id);

      setMessages(parsed[0].messages);

    }

  }

}, []);

// SAVE CHAT HISTORY WHEN MESSAGES CHANGE
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

  // CLICK OUTSIDE MENU & USER DROPDOWN
  useEffect(() => {

    const handleClickOutside = (
      event: MouseEvent
    ) => {

      if (
        menuRef.current &&
        !menuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowMenu(false);
      }

      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(
          event.target as Node
        )
      ) {
        setShowUserDropdown(false);
      }

    };

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };

  }, []);

  // TYPE EFFECT
  const sleep = (ms: number) =>
    new Promise((resolve) =>
      setTimeout(resolve, ms)
    );

  const typeMessage = async (
    fullText: string
  ) => {

    let current = "";

    setMessages((prev) => [
      ...prev,
      {
        role: "ai",
        content: "",
      },
    ]);

    for (
      let i = 0;
      i < fullText.length;
      i++
    ) {

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

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any)
        .webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        "Trình duyệt không hỗ trợ ghi âm"
      );
      return;
    }

    const recognition =
      new SpeechRecognition();

    recognition.lang = "vi-VN";

    recognition.continuous = false;

    recognition.interimResults = false;

    setIsRecording(true);

    recognition.start();

    recognition.onresult = (
      event: any
    ) => {

      const transcript =
        event.results[0][0].transcript;

      setMessage(transcript);

    };

    recognition.onend = () => {
      setIsRecording(false);
    };

  };

  // IMAGE UPLOAD
  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {

    const file =
      e.target.files?.[0];

    if (!file) return;

    const imageUrl =
      URL.createObjectURL(file);

    setSelectedImage(imageUrl);

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        image: imageUrl,
      },
    ]);

  };

  // ASK AI
  const handleAsk = async () => {
    

    if (!message.trim()) return;
    
    setIsHome(false);

    const currentMessage = message;

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

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        content: currentMessage,
      },
    ]);

    setLoading(true);

    try {

      if (mode === "chat") {

        const aiText =
          await askGemini(
            currentMessage
          );

        await typeMessage(aiText);

      }

      if (mode === "render") {

        const prompt = `
${style},
aspect ratio ${aspectRatio},
${currentMessage},
ultra realistic architecture render,
8k,
cinematic lighting,
photorealistic
`;

        const imageUrl =
          await generateFluxImage(
            prompt
          );

        setMessages((prev) => [
          ...prev,
          {
            role: "ai",
            content: "Ảnh render AI",
            image: imageUrl,
          },
        ]);

      }

    } catch (err: any) {

      setMessages((prev) => [
        ...prev,
        {
          role: "ai",
          content:
            err?.message ||
            "Có lỗi xảy ra",
        },
      ]);

    }

    setLoading(false);

    setMessage("");

  };

  const handleNewChat = () => {
    setMode("chat");
    setMessages([]);
    setCurrentChatId("");
    setSelectedImage(null);
    setMessage("");
  };

  const handleSelectChat = (chat: any) => {
    setMode("chat");
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setSelectedImage(null);
  };

  const filteredHistory = chatHistory.filter((chat) =>
    chat.title?.toLowerCase().includes(searchHistoryQuery.toLowerCase())
  );

  const handleBackToHome = () => {
    setMode("chat");
    setMessages([]);
    setSelectedImage(null);
    setMessage("");
    setCurrentChatId("");
  };

  // MÔ PHỎNG HÀM ĐĂNG NHẬP BẰNG GOOGLE (Sau này sẽ gắn Firebase/Supabase vào đây)
  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setUser({
        name: "Kiến Trúc Sư UAR",
        email: "kts.uarbox@gmail.com",
        avatar: "https://lh3.googleusercontent.com/a/ACg8ocI6G...=s96-c" // Link ảnh giả lập
      });
      setShowAuthModal(false);
      setLoading(false);
    }, 1000);
  };

  const handleLogout = () => {
    setUser(null);
    setShowUserDropdown(false);
  };

  const latestImage =
    [...messages]
      .reverse()
      .find((m) => m.image)
      ?.image || null;

  return (

    <div className="h-screen overflow-hidden bg-[#0d0d0d] text-white font-sans flex relative">

      {/* STYLE */}
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
            0%,100%{
              height:8px;
              opacity:.4;
            }

            50%{
              height:28px;
              opacity:1;
            }
          }

          .sidebar-scroll::-webkit-scrollbar {
            width: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 4px;
          }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.2);
          }
        `}
      </style>

      {/* SIDEBAR COMPONENT */}
      <div className={`h-full bg-[#111111] border-r border-white/5 flex flex-col p-4 shrink-0 z-30 transition-all duration-300 relative ${
        showSidebar ? "w-[260px] opacity-100" : "w-0 p-0 opacity-0 border-r-0 pointer-events-none"
      }`}>
        
        {/* KHI SIDEBAR MỞ: HIỂN THỊ CỤM LOGO + TIÊU ĐỀ Ở ĐÂY, CLICK VÀO SẼ BACK VỀ HOME */}
        {showSidebar && (
          <div className="flex items-center justify-between mb-6 pr-10">
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={handleBackToHome}
            >
              <img
                src={logoIcon}
                alt="logo"
                className="w-10 h-10 rounded-full object-cover transition hover:scale-105"
              />
              <div>
                <h1 className="text-[15px] font-medium hover:text-slate-300 transition">
                  UAR BOX 1.0
                </h1>
                <p className="text-xs text-slate-500">Architecture AI</p>
              </div>
            </div>

            {/* NÚT CLOSE SIDEBAR TO BẰNG LOGO (W-10 H-10) */}
            <button
              onClick={() => setShowSidebar(false)}
              className="absolute top-4 right-3 w-10 h-10 rounded-xl hover:bg-white/5 flex items-center justify-center transition z-40"
              title="Đóng thanh bên"
            >
              <img src={sidebarCloseIcon} alt="Close Sidebar" className="w-5 h-5 object-contain opacity-70 hover:opacity-100 transition" />
            </button>
          </div>
        )}

        {/* Nút Đoạn chat mới */}
        <button
          onClick={handleNewChat}
          className="w-full h-11 border border-white/10 hover:bg-white/5 transition rounded-xl flex items-center justify-start px-4 gap-3 mb-4 text-sm font-medium text-slate-200"
        >
          <span className="text-xl font-light">+</span>
          Đoạn chat mới
        </button>

        {/* Ô Tìm kiếm đoạn chat */}
        <div className="w-full mb-4">
          <input
            type="text"
            value={searchHistoryQuery}
            onChange={(e) => setSearchHistoryQuery(e.target.value)}
            placeholder="Tìm kiếm đoạn chat..."
            className="w-full h-9 bg-[#1a1a1a] border border-white/5 rounded-lg px-3 text-xs text-slate-300 placeholder:text-slate-600 outline-none focus:border-white/20 transition"
          />
        </div>

        {/* Danh sách Lịch sử Chat */}
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
                  currentChatId === chat.id 
                    ? "bg-[#202020] text-white border border-white/5" 
                    : "text-slate-400 hover:bg-[#161616] hover:text-slate-200"
                }`}
              >
                {chat.title || "Đoạn chat không tên"}
              </button>
            ))
          )}
        </div>

        {/* Đường phân cách */}
        <div className="h-[1px] bg-white/5 my-3" />

        {/* Mục Thư viện & Chuyển đổi Mode nhanh */}
        <div className="space-y-1">
          <button
            onClick={() => setMode("render")}
            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center gap-3 ${
              mode === "render"
                ? "bg-[#202020] text-white border border-white/5"
                : "text-slate-400 hover:bg-[#161616] hover:text-slate-200"
            }`}
          >
            <span className="text-xs">🖼️</span>
            Thư viện Render
          </button>
        </div>

      </div>

      {/* MAIN CONTENT CONTAINER */}
      <div className="flex-1 h-full flex flex-col relative overflow-hidden">

        {/* CHAT MODE */}
        {mode === "chat" && (

          <div className="relative h-full flex flex-col overflow-hidden">

            {/* BG */}
            <div
              className="
              absolute
              inset-0
              bg-[radial-gradient(circle_at_top_left,#1f2937,transparent_25%),radial-gradient(circle_at_bottom,#111827,transparent_20%),radial-gradient(circle_at_right,#0f172a,transparent_25%)]
              opacity-80
            "
            />

            {/* HEADER */}
            <div className="relative z-10 flex items-center justify-between px-6 py-5">

              <div className="flex items-center gap-3">

                {/* KHI SIDEBAR ĐÓNG: HIỂN THỊ CỤM LOGO NÀY (HOVER ĐỔI ICON SIDEBAR OPEN, CLICK ĐỂ MỞ) */}
                {!showSidebar && (
                  <>
                    <div 
                      className="w-10 h-10 relative cursor-pointer"
                      onMouseEnter={() => setIsHoveredLogo(true)}
                      onMouseLeave={() => setIsHoveredLogo(false)}
                      onClick={() => setShowSidebar(true)}
                    >
                      <img
                        src={isHoveredLogo ? sidebarOpenIcon : logoIcon}
                        alt="logo"
                        className="
                        w-full
                        h-full
                        rounded-full
                        object-cover
                        hover:scale-105
                        transition-all
                        duration-200
                      "
                      />
                    </div>

                    <div>
                      <h1 className="text-[15px] font-medium select-none">
                        UAR BOX 1.0
                      </h1>
                      <p className="text-xs text-slate-500">
                        Architecture AI
                      </p>
                    </div>
                  </>
                )}

              </div>

              {/* NÚT THAY ĐỔI: ĐĂNG NHẬP / ĐĂNG KÝ HOẶC THÔNG TIN TÀI KHOẢN */}
              <div className="relative" ref={userMenuRef}>
                {user ? (
                  // Giao diện khi ĐÃ ĐĂNG NHẬP (Hiện Avatar)
                  <div 
                    className="flex items-center gap-3 bg-[#1c1c1c] border border-white/10 px-3 py-1.5 rounded-full cursor-pointer hover:bg-[#252525] transition"
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                  >
                    <div className="w-7 h-7 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-xs font-bold uppercase text-white overflow-hidden">
                      {user.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-slate-200 max-w-[120px] truncate">{user.name}</span>
                    
                    {/* User Dropdown Menu */}
                    {showUserDropdown && (
                      <div className="absolute right-0 top-12 w-48 bg-[#1c1c1c] border border-white/10 rounded-xl p-1 shadow-2xl flex flex-col z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                        <div className="px-3 py-2 border-b border-white/5 mb-1">
                          <p className="text-xs text-slate-500 truncate">{user.email}</p>
                        </div>
                        <button 
                          onClick={handleLogout}
                          className="w-full text-left px-3 py-2 hover:bg-red-500/10 text-red-400 rounded-lg text-sm transition"
                        >
                          Đăng xuất
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  // Giao diện khi CHƯA ĐĂNG NHẬP (Hiện nút Login)
                  <button
                    onClick={() => setShowAuthModal(true)}
                    className="px-4 py-2 rounded-xl bg-white text-black hover:bg-slate-200 transition text-sm font-medium shadow-md"
                  >
                    Đăng nhập / Đăng ký
                  </button>
                )}
              </div>

            </div>

            {/* EMPTY */}
            {messages.length === 0 && (

              <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center pb-32">

                <h1 className="text-5xl font-semibold tracking-tight mb-5">
                  UAR BOX 1.0
                </h1>

                <p className="max-w-2xl text-lg text-slate-400 leading-9">
                  Chào bạn, tôi là AI hỗ trợ
                  Kiến Trúc & Nội Thất
                  UAR HOME.
                </p>

              </div>

            )}

            {/* MESSAGES */}
            {messages.length > 0 && (

              <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-40">

                <div className="max-w-4xl mx-auto py-10 space-y-8">

                  {messages.map(
                    (msg, index) => (

                      <div
                        key={index}
                        className={`flex ${
                          msg.role === "user"
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >

                        <div
                          className={`max-w-[80%] ${
                            msg.role === "user"
                              ? "bg-[#202020] border border-white/10 text-white"
                              : "bg-[#171717] border border-white/10 text-white"
                          } px-4 py-4 rounded-3xl`}
                        >

                          {msg.content && (

                            <div className="whitespace-pre-wrap leading-8 text-[16px]">
                              {msg.content}
                            </div>

                          )}

                          {msg.image && (

                            <img
                              src={msg.image}
                              alt=""
                              className="
                              rounded-2xl
                              max-w-[320px]
                              object-cover
                              overflow-hidden
                            "
                            />

                          )}

                        </div>

                      </div>

                    )
                  )}

                  {loading && (

                    <div className="text-slate-500 animate-pulse">
                      UAR đang suy nghĩ...
                    </div>

                  )}

                  <div ref={messagesEndRef} />

                </div>

              </div>

            )}

            {/* INPUT */}
            <div className={`absolute left-0 right-0 z-20 px-6 pb-8 transition-all duration-500 ${
              messages.length === 0 
                ? "bottom-[35%] transform translate-y-1/2" 
                : "bottom-0"
            }`}>

              <div className="max-w-4xl mx-auto">

                <div
                  className="
                  bg-[#171717]
                  border
                  border-white/10
                  rounded-[28px]
                  px-4
                  py-3
                  shadow-2xl
                "
                >

                  <div className="flex items-center gap-3">

                    {/* PLUS MENU */}
                    <div
                      className="relative"
                      ref={menuRef}
                    >

                      {/* BUTTON */}
                      <button
                        onClick={() =>
                          setShowMenu(
                            !showMenu
                          )
                        }
                        className="
                        w-11
                        h-11
                        rounded-full
                        hover:bg-white/10
                        transition-all
                        duration-300
                        flex
                        items-center
                        justify-center
                        text-3xl
                        text-slate-300
                      "
                      >

                        <span
                          className={`
                            transition-transform
                            duration-300
                            ${
                              showMenu
                                ? "rotate-45"
                                : "rotate-0"
                            }
                          `}
                        >
                          +
                        </span>

                      </button>

                      {/* DROPDOWN */}
                      <div
                        className={`
                        ${
                          showMenu
                            ? "flex"
                            : "hidden"
                        }
                        flex-col
                        absolute
                        bottom-14
                        left-0
                        bg-[#1c1c1c]
                        border
                        border-white/10
                        rounded-2xl
                        p-2
                        w-56
                        shadow-2xl
                      `}
                      >

                        {/* RENDER */}
                        <button
                          onClick={() =>
                            setMode(
                              "render"
                            )
                          }
                          className="
                          text-left
                          px-4
                          py-3
                          rounded-xl
                          hover:bg-white/10
                          transition
                          text-sm
                        "
                        >
                          Render
                        </button>

                        {/* ADD PHOTO */}
                        <label
                          className="
                          px-4
                          py-3
                          rounded-xl
                          hover:bg-white/10
                          transition
                          text-sm
                          cursor-pointer
                        "
                        >

                          Add photo & file

                          <input
                            type="file"
                            hidden
                            accept="image/*,.pdf,.doc,.docx"
                            onChange={
                              handleImageUpload
                            }
                          />

                        </label>

                        {/* CREATE IMAGE */}
                        <button
                          onClick={() =>
                            setMode(
                              "render"
                            )
                          }
                          className="
                          text-left
                          px-4
                          py-3
                          rounded-xl
                          hover:bg-white/10
                          transition
                          text-sm
                        "
                        >
                          Create image
                        </button>

                      </div>

                    </div>

                    {/* TEXTAREA */}
                    <textarea
                      value={message}
                      rows={1}
                      onChange={(e) =>
                        setMessage(
                          e.target.value
                        )
                      }
                      onKeyDown={(e) => {

                        if (
                          e.key ===
                            "Enter" &&
                          !e.shiftKey
                        ) {

                          e.preventDefault();

                          handleAsk();

                        }

                      }}
                      placeholder="Hỏi bất cứ điều gì bạn muốn..."
                      className="
                      flex-1
                      bg-transparent
                      resize-none
                      outline-none
                      text-[16px]
                      leading-7
                      py-1
                      text-white
                      placeholder:text-slate-500
                    "
                    />

                    {/* SEND / MIC */}
                    {message.trim() ? (

                      <button
                        onClick={
                          handleAsk
                        }
                        disabled={loading}
                        className="
                        w-10
                        h-10
                        flex
                        items-center
                        justify-center
                        rounded-full
                        bg-white
                        hover:scale-105
                        transition
                        shrink-0
                      "
                      >

                        <img
                          src={sendIcon}
                          alt="send"
                          className="w-4 h-4 object-contain"
                        />

                      </button>

                    ) : (

                      <div className="flex items-center gap-3">

                        {/* WAVE */}
                        {isRecording && (

                          <div className="flex items-center gap-[3px] h-10">

                            {recordingBars.map(
                              (_, index) => (

                                <div
                                  key={index}
                                  className="record-bar"
                                  style={{
                                    animationDelay: `${index * 0.05}s`,
                                  }}
                                />

                              )
                            )}

                          </div>

                        )}

                        {/* MIC */}
                        <button
                          onClick={
                            startRecording
                          }
                          className="
                          w-10
                          h-10
                          flex
                          items-center
                          justify-center
                          rounded-full
                          hover:bg-white/10
                          transition
                          shrink-0
                        "
                      >

                        <img
                          src={micIcon}
                          alt="mic"
                          className={`w-4 h-4 object-contain ${
                            isRecording
                              ? "opacity-100 scale-125"
                              : "opacity-80"
                          }`}
                        />

                        </button>

                      </div>

                    )}

                  </div>

                </div>

              </div>

            </div>

          </div>

        )}

        {/* RENDER MODE */}
        {mode === "render" && (

          <div className="flex h-full gap-6 p-6 overflow-hidden">

            {/* LEFT */}
            <div className="w-[420px] bg-[#111] border border-white/10 p-5 rounded-3xl overflow-y-auto">

              <div className="flex items-center justify-between mb-6">

                <h2 className="text-2xl font-semibold">
                  UAR Render
                </h2>

                <button
                  onClick={() =>
                    setMode("chat")
                  }
                  className="
                  px-3
                  py-2
                  rounded-xl
                  bg-[#1d1d1d]
                  hover:bg-[#262626]
                "
                >
                  Chat
                </button>

              </div>

              {/* UPLOAD */}
              <label
                className="
                h-52
                border-2
                border-dashed
                border-white/10
                rounded-2xl
                flex
                flex-col
                items-center
                justify-center
                cursor-pointer
                hover:border-white/20
                transition
              "
              >

                <input
                  type="file"
                  hidden
                  onChange={
                    handleImageUpload
                  }
                />

                <div className="text-4xl mb-3">
                  +
                </div>

                <div className="text-slate-500">
                  Upload Sketch / CAD
                </div>

              </label>

              {/* IMAGE */}
              {selectedImage && (

                <img
                  src={selectedImage}
                  alt=""
                  className="mt-4 rounded-2xl"
                />

              )}

            </div>

            {/* RIGHT */}
            <div
              className="
              flex-1
              bg-[#111]
              border
              border-white/10
              rounded-3xl
              flex
              items-center
              justify-center
              overflow-hidden
            "
            >

              {latestImage ? (

                <img
                  src={latestImage}
                  alt=""
                  className="
                  w-full
                  h-full
                  object-contain
                "
                />

              ) : (

                <div className="text-slate-500 text-lg">
                  Kết quả render sẽ
                  hiển thị ở đây
                </div>

              )}

            </div>

          </div>

        )}

      </div>

      {/* MODAL POPUP ĐĂNG NHẬP (XUẤT HIỆN KHI BẤM NÚT ĐĂNG NHẬP) */}
      {showAuthModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-300">
          <div className="bg-[#141414] border border-white/10 p-8 rounded-[32px] w-[380px] text-center relative shadow-2xl scale-100 animate-in zoom-in-95 duration-200">
            
            {/* Nút đóng Modal */}
            <button 
              onClick={() => setShowAuthModal(false)}
              className="absolute top-5 right-5 w-8 h-8 rounded-full hover:bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition"
            >
              ✕
            </button>

            {/* Logo trong bảng Login */}
            <img src={logoIcon} alt="Logo" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
            <h3 className="text-2xl font-semibold mb-2">Chào mừng đến với UAR BOX</h3>
            <p className="text-sm text-slate-400 mb-8">Đăng nhập để lưu lịch sử chat và tối ưu hóa trải nghiệm Render kiến trúc của bạn.</p>

            {/* Nút Đăng ký/Đăng nhập bằng Gmail đúng yêu cầu của bạn */}
            <button
              onClick={handleGoogleLogin}
              className="w-full h-12 bg-white text-black hover:bg-slate-200 active:scale-[0.98] transition rounded-xl flex items-center justify-center gap-3 font-medium text-sm shadow-lg mb-4"
            >
              {/* Icon Google giả lập bằng SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Tiếp tục với tài khoản Gmail
            </button>

            <div className="text-[11px] text-slate-500 mt-6 px-4">
              Bằng cách tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của UAR HOME.
            </div>
          </div>
        </div>
      )}

    </div>

  );
}

export default App;