import { useState, useEffect, useRef } from "react";
import { askGemini } from "./services/geminiService";
import { generateFluxImage } from "./services/fluxService";

import micIcon from "./assets/mic.png";
import sendIcon from "./assets/send.png";
import logoIcon from "./assets/lOGO.png";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [mode, setMode] =
    useState<"chat" | "render">("chat");

  const [selectedImage, setSelectedImage] =
    useState<string | null>(null);

  const messagesEndRef =
    useRef<HTMLDivElement>(null);

const [style] = useState("Modern Luxury");
const [aspectRatio] = useState("16:9");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, loading]);

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

  const handleImageUpload = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedImage(
      URL.createObjectURL(file)
    );
  };

  const handleAsk = async () => {
    if (!message.trim()) return;

    const currentMessage = message;

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
          await askGemini(currentMessage);

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
          await generateFluxImage(prompt);

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

  const latestImage =
    [...messages]
      .reverse()
      .find((m) => m.image)?.image || null;

  return (
    <div className="h-screen overflow-hidden bg-[#0d0d0d] text-white font-sans">

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
          <div className="relative z-10 flex items-center justify-between px-6 py-5 border-b border-white/5">

            <div className="flex items-center gap-3">

              <img
                src={logoIcon}
                alt="logo"
                className="
                w-9
                h-9
                rounded-full
                object-cover
              "
              />

              <div>
                <h1 className="text-[15px] font-medium">
                  UAR BOX 1.0
                </h1>

                <p className="text-xs text-slate-500">
                  Architecture AI
                </p>
              </div>

            </div>

            <button
              onClick={() =>
                setMode("render")
              }
              className="
              px-4
              py-2
              rounded-xl
              bg-[#1c1c1c]
              border
              border-white/10
              hover:bg-[#252525]
              transition
              text-sm
            "
            >
              Render
            </button>

          </div>

          {/* EMPTY */}
          {messages.length === 0 && (
            <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 text-center">

              <h1 className="text-5xl font-semibold tracking-tight mb-5">
                UAR BOX 1.0
              </h1>

              <p className="max-w-2xl text-lg text-slate-400 leading-9">
                Chào bạn, tôi là AI hỗ trợ Kiến Trúc & Nội Thất UAR HOME.
              </p>

            </div>
          )}

          {/* MESSAGES */}
          {messages.length > 0 && (
            <div className="relative z-10 flex-1 overflow-y-auto px-6 pb-40">

              <div className="max-w-4xl mx-auto py-10 space-y-8">

                {messages.map((msg, index) => (
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
                          ? "bg-white text-black"
                          : "bg-[#171717] border border-white/10 text-white"
                      } px-5 py-4 rounded-3xl`}
                    >

                      <div className="whitespace-pre-wrap leading-8 text-[16px]">
                        {msg.content}
                      </div>

                      {msg.image && (
                        <img
                          src={msg.image}
                          alt=""
                          className="mt-4 rounded-2xl"
                        />
                      )}

                    </div>

                  </div>
                ))}

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
          <div className="absolute bottom-0 left-0 right-0 z-20 px-6 pb-8">

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

                  {/* PLUS */}
                  <button
                    className="
                    w-9
                    h-9
                    rounded-full
                    bg-[#202020]
                    border
                    border-white/10
                    hover:bg-[#2a2a2a]
                    transition
                    text-slate-300
                    flex
                    items-center
                    justify-center
                    shrink-0
                  "
                  >
                    +
                  </button>

                  {/* TEXTAREA */}
                  <textarea
                    value={message}
                    rows={1}
                    onChange={(e) =>
                      setMessage(e.target.value)
                    }
                    onKeyDown={(e) => {
                      if (
                        e.key === "Enter" &&
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

                  {/* MIC / SEND */}
                  {message.trim() ? (

                    <button
                      onClick={handleAsk}
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

                    <button
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
                        className="w-4 h-4 object-contain opacity-80"
                      />
                    </button>

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
                onChange={handleImageUpload}
              />

              <div className="text-4xl mb-3">
                +
              </div>

              <div className="text-slate-500">
                Upload Sketch / CAD
              </div>

            </label>

            {selectedImage && (
              <img
                src={selectedImage}
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
                className="
                w-full
                h-full
                object-contain
              "
              />
            ) : (
              <div className="text-slate-500 text-lg">
                Kết quả render sẽ hiển thị ở đây
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default App;