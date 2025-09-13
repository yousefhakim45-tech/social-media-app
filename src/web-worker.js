import React, { useState, useEffect, useRef } from "react";
import styled, { ThemeProvider, createGlobalStyle } from "styled-components";
import { motion, AnimatePresence } from "framer-motion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import WordCloud from "react-d3-cloud";
import { MdSettingsVoice } from "react-icons/md";
import { FiSettings } from "react-icons/fi";
import JSZip from "jszip";
import html2canvas from "html2canvas";

// 🧠 Themes
const lightTheme = { bg: "#fff4e6", text: "#222", card: "#fff", accent: "#00acc1" };
const darkTheme = { bg: "#1e1e2f", text: "#e0e0e0", card: "#2a2a3f", accent: "#00acc1" };

// 🌐 Global Style
const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: 'Segoe UI', sans-serif;
    background: ${({ theme }) => theme.bg};
    color: ${({ theme }) => theme.text};
    transition: background 0.5s ease, color 0.5s ease;
  }
`;

// 📦 Styled Components
const Wrapper = styled.div`
  padding: 2rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;
const Button = styled(motion.button)`
  margin: 0.5rem;
  padding: 0.6rem 1.4rem;
  border-radius: 12px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
`;
const Card = styled(motion.div)`
  background: ${({ theme }) => theme.card};
  border-radius: 1rem;
  padding: 1.5rem;
  max-width: 900px;
  width: 100%;
  margin-top: 1.5rem;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.3);
`;
const Preview = styled.pre`
  background: #111;
  padding: 1.25rem;
  border-radius: 1rem;
  max-height: 300px;
  overflow: auto;
  color: #eee;
  font-family: 'Fira Code', monospace;
  font-size: 0.9rem;
  border-left: 5px solid ${({ theme }) => theme.accent};
  box-shadow: 0 0 10px rgba(0,0,0,0.3);
`;
const SearchInput = styled.input`
  padding: 0.6rem 1rem;
  border-radius: 1rem;
  border: none;
  margin-top: 1rem;
  width: 240px;
`;

// 🧵 Inline Worker
const createWorker = () => {
  const code = `
    self.onmessage = ({ data }) => {
      const { id, type, payload } = data;

      if (type === 'ANALYZE') {
        const lines = payload.split('\\n');
        const map = {};
        for (let line of lines) {
          const words = line.toLowerCase().match(/\\b(\\w+)\\b/g) || [];
          for (let word of words) {
            map[word] = (map[word] || 0) + 1;
          }
        }
        const result = Object.entries(map)
          .map(([word, count]) => ({ word, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 100);
        postMessage({ id, type: 'ANALYZE_DONE', payload: result });
      }

      if (type === 'SEARCH') {
        const { text, keyword } = payload;
        const matches = [...text.matchAll(new RegExp(keyword, 'gi'))].length;
        postMessage({ id, type: 'SEARCH_DONE', payload: matches });
      }
    };
  `;
  return new Worker(URL.createObjectURL(new Blob([code], { type: "application/javascript" })));
};

// 🎯 Main Component
export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [worker] = useState(() => createWorker());
  const [wordData, setWordData] = useState([]);
  const [keyword, setKeyword] = useState("");
  const [matchCount, setMatchCount] = useState(null);
  const [errors, setErrors] = useState([]);
  const [logs, setLogs] = useState([]);
  const [progress, setProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const fileTextRef = useRef("");
  const previewRef = useRef();

  useEffect(() => {
    worker.onmessage = ({ data }) => {
      if (data.type === "ANALYZE_DONE") {
        setWordData(data.payload);
        localStorage.setItem("lastWords", JSON.stringify(data.payload));
        setIsLoading(false);
      }
      if (data.type === "SEARCH_DONE") setMatchCount(data.payload);
    };
    return () => worker.terminate();
  }, [worker]);

  const readFiles = async (files) => {
    fileTextRef.current = "";
    setIsLoading(true);
    setProgress(0);
    setLogs([]);
    const total = files.length;
    let completed = 0;

    console.time("📊 File analysis duration");

    await Promise.all(
      Array.from(files).map(async (file) => {
        try {
          const reader = new FileReader();
          const result = await new Promise((resolve, reject) => {
            reader.onload = () => resolve(reader.result);
            reader.onerror = () => reject(reader.error);
            reader.readAsArrayBuffer(file);
          });

          if (file.name.endsWith(".docx")) {
            const zip = await JSZip.loadAsync(result);
            const xml = zip.files["word/document.xml"];
            if (xml) {
              const text = await xml.async("text");
              fileTextRef.current += text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ") + "\n";
            }
          } else if (file.name.endsWith(".pdf")) {
            const rawText = new TextDecoder("utf-8").decode(result);
            const extracted = rawText.match(/(?:BT\\s)(.*?)(?:\\sET)/gs);
            fileTextRef.current += (extracted || []).join(" ").replace(/[^\w\s]/g, "") + "\n";
          } else if (file.name.endsWith(".zip")) {
            const zip = await JSZip.loadAsync(result);
            for (const name of Object.keys(zip.files)) {
              if (name.endsWith(".txt")) {
                const txt = await zip.files[name].async("string");
                fileTextRef.current += txt + "\n";
              }
            }
          } else {
            const text = await new Promise((resolve, reject) => {
              const r = new FileReader();
              r.onload = () => resolve(r.result);
              r.onerror = () => reject(r.error);
              r.readAsText(file);
            });
            fileTextRef.current += text + "\n";
          }

          setLogs((l) => [...l, `✅ Processed: ${file.name}`]);
        } catch (err) {
          setErrors((e) => {
            const exists = e.some((er) => er.msg === `Error reading ${file.name}`);
            return exists ? e : [...e, { id: Date.now(), msg: `Error reading ${file.name}` }];
          });
          setLogs((l) => [...l, `❌ Failed: ${file.name}`]);
        } finally {
          completed += 1;
          setProgress(Math.round((completed / total) * 100));
        }
      })
    );

    worker.postMessage({ id: "analyze", type: "ANALYZE", payload: fileTextRef.current });
    console.timeEnd("📊 File analysis duration");
  };

  const handleSearch = (e) => {
    const kw = e.target.value;
    setKeyword(kw);
    if (fileTextRef.current && kw.length > 1) {
      worker.postMessage({ id: "search", type: "SEARCH", payload: { text: fileTextRef.current, keyword: kw } });
    }
  };

  const handleVoiceSearch = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.start();
    recognition.onresult = (e) => {
      const kw = e.results[0][0].transcript;
      setKeyword(kw);
      if (fileTextRef.current && kw.length > 1) {
        worker.postMessage({ id: "voice", type: "SEARCH", payload: { text: fileTextRef.current, keyword: kw } });
      }
    };
  };

  const exportPNG = async () => {
    if (!previewRef.current) return;
    const canvas = await html2canvas(previewRef.current);
    const link = document.createElement("a");
    link.download = "preview.png";
    link.href = canvas.toDataURL();
    link.click();
  };

  return (
    <ThemeProvider theme={theme === "light" ? lightTheme : darkTheme}>
      <GlobalStyle />
      <Wrapper>
        <motion.h1 animate={{ opacity: [0, 1], y: [-20, 0] }}>📄 Universal File Analyzer</motion.h1>

        <div>
          <Button onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "🌙 Dark" : "☀️ Light"}</Button>
          <Button onClick={handleVoiceSearch}><MdSettingsVoice size={20} /> Voice</Button>
          <Button onClick={() => setShowSettings(!showSettings)}><FiSettings size={20} /> Settings</Button>
          <label>
            <input
              type="file"
              multiple
              accept=".txt,.log,.csv,.zip,.pdf,.docx"
              style={{ display: "none" }}
              onChange={(e) => readFiles(e.target.files)}
            />
            <Button as="span">📂 Upload</Button>
          </label>
          <Button onClick={exportPNG}>🖼 Export Preview</Button>
        </div>

        <SearchInput value={keyword} onChange={handleSearch} placeholder="🔍 Search word..." />

        {matchCount !== null && <div>🔎 Found: {matchCount} matches</div>}

        {showSettings && (
          <Card initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
            <h3>⚙️ Settings</h3>
            <p>Coming soon: regex tools, export formats, themes...</p>
          </Card>
        )}

{isLoading && (
  <Card>
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
      style={{
        margin: "1rem auto",
        border: "6px solid #ccc",
        borderTop: "6px solid #00acc1",
        borderRadius: "50%",
        width: "40px",
        height: "40px",
      }}
    />
    <p style={{ textAlign: "center" }}>Reading files... {progress}%</p>
    {logs.length > 0 && (
      <Preview>
        {logs.slice(-10).map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </Preview>
    )}
  </Card>
)}


        {wordData.length > 0 && (
          <Card>
            <h3>📊 Word Frequency</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={wordData.slice(0, 15)}>
                <XAxis dataKey="word" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#00acc1" />
              </BarChart>
            </ResponsiveContainer>
            <h3>🌈 Word Cloud</h3>
            <WordCloud
              data={wordData.slice(0, 50)}
              fontSizeMapper={(word) => Math.log2(word.count) * 12}
              rotate={0}
              width={600}
              height={300}
            />
          </Card>
        )}

        {fileTextRef.current && (
          <Card ref={previewRef}>
            <h3>📝 File Preview</h3>
            <Preview>{fileTextRef.current.slice(0, 2000)}</Preview>
          </Card>
        )}

        <AnimatePresence>
          {errors.map((err) => (
            <Card key={err.id} initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -20, opacity: 0 }}>
              ❌ {err.msg}
            </Card>
          ))}
        </AnimatePresence>
      </Wrapper>
    </ThemeProvider>
  );
}
