/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

const BAD_WORDS = [
  "хуй","пизда","ебать","ебл","блядь","сука","мудак","пиздец",
  "ёбаный","еблан","залупа","ёб","хуйня","пиздеж","шлюха","ёбать",
  "fuck","shit","bitch","asshole","cunt","dick","pussy","nigger",
];

function containsBadWord(text: string): boolean {
  const lower = text.toLowerCase();
  return BAD_WORDS.some((w) => lower.includes(w));
}

function isUrl(text: string): boolean {
  const t = text.trim();
  return /^(https?:\/\/|www\.)/i.test(t) || /^[a-zA-Z0-9-]+\.[a-z]{2,}(\/.*)?$/.test(t);
}

function normalizeUrl(text: string): string {
  const t = text.trim();
  if (/^https?:\/\//i.test(t)) return t;
  return "https://" + t;
}

type MicError = "no-support" | "denied" | null;

interface CustomLink {
  id: number;
  name: string;
  url: string;
}

const STORAGE_KEY = "maks-custom-links";

function loadLinks(): CustomLink[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveLinks(links: CustomLink[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
}

export default function Index() {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [rippleKeys, setRippleKeys] = useState<number[]>([]);
  const [blocked, setBlocked] = useState(false);
  const [micError, setMicError] = useState<MicError>(null);

  const [customLinks, setCustomLinks] = useState<CustomLink[]>(loadLinks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [addError, setAddError] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setMicError("no-support");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "ru-RU";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e: any) => {
      setQuery(e.results[0][0].transcript);
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e: any) => {
      setIsListening(false);
      if (e.error === "not-allowed" || e.error === "denied") setMicError("denied");
    };
    recognitionRef.current = recognition;
  }, []);

  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setRippleKeys((prev) => [...prev.slice(-3), Date.now()]);
      }, 700);
      return () => clearInterval(interval);
    } else {
      setRippleKeys([]);
    }
  }, [isListening]);

  const requestMicPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicError(null);
    } catch {
      setMicError("denied");
    }
  };

  const toggleVoice = async () => {
    if (micError === "no-support") return;
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setMicError("denied");
      return;
    }
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setQuery("");
      setBlocked(false);
      setMicError(null);
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = query.trim();
    if (!q) return;
    if (containsBadWord(q)) { setBlocked(true); return; }
    setBlocked(false);
    if (isUrl(q)) {
      window.open(normalizeUrl(q), "_blank");
    } else {
      window.open(`https://yandex.ru/search/?text=${encodeURIComponent(q)}`, "_blank");
    }
  };

  const handleAddLink = () => {
    const name = newName.trim();
    const url = newUrl.trim();
    if (!name) { setAddError("Введите название"); return; }
    if (!url) { setAddError("Введите адрес сайта"); return; }
    const normalized = normalizeUrl(url);
    const updated = [...customLinks, { id: Date.now(), name, url: normalized }];
    setCustomLinks(updated);
    saveLinks(updated);
    setNewName("");
    setNewUrl("");
    setAddError("");
    setShowAddForm(false);
  };

  const handleDeleteLink = (id: number) => {
    const updated = customLinks.filter((l) => l.id !== id);
    setCustomLinks(updated);
    saveLinks(updated);
  };

  return (
    <div className="mp-root">
      <main className="mp-main">

        {/* LOGO */}
        <div className="mp-logo-wrap">
          <span className="mp-logo-left">МАКС </span>
          <span className="mp-logo-right">
            П
            <span className="mp-logo-icon-wrap">
              <svg viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="mp-logo-svg">
                <circle cx="22" cy="22" r="22" fill="url(#g1)"/>
                <path d="M14 18.5C14 15.46 16.46 13 19.5 13h5C27.54 13 30 15.46 30 18.5c0 2.7-1.87 4.96-4.38 5.56L22 30l-3.62-5.94C15.87 23.46 14 21.2 14 18.5z" fill="white"/>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#a78bfa"/>
                    <stop offset="1" stopColor="#6d28d9"/>
                  </linearGradient>
                </defs>
              </svg>
            </span>
            ИСК
          </span>
        </div>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearch} className="mp-form">
          <div className={`mp-box ${isFocused ? "mp-box--focused" : ""} ${isListening ? "mp-box--listening" : ""} ${blocked ? "mp-box--blocked" : ""}`}>
            <button type="submit" className="mp-icon-btn mp-search-btn">
              <Icon name="Search" size={22} className="mp-icon-search" />
            </button>
            <input
              ref={inputRef}
              type="text"
              value={isListening ? "Говорите..." : query}
              onChange={(e) => { setQuery(e.target.value); setBlocked(false); }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              placeholder="Поиск или адрес сайта..."
              className="mp-input"
              readOnly={isListening}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            {query && !isListening && (
              <button type="button" onClick={() => { setQuery(""); setBlocked(false); }} className="mp-icon-btn">
                <Icon name="X" size={18} className="mp-icon-gray" />
              </button>
            )}
            <button
              type="button"
              onClick={toggleVoice}
              className={`mp-icon-btn ${isListening ? "mp-mic--active" : ""} ${micError ? "mp-mic--error" : ""}`}
              title="Голосовой ввод"
            >
              {rippleKeys.map((id) => <span key={id} className="mp-ripple" />)}
              <Icon
                name={isListening ? "MicOff" : "Mic"}
                size={22}
                className={isListening ? "mp-icon-red" : micError ? "mp-icon-orange" : "mp-icon-gray"}
              />
            </button>
            <button type="button" className="mp-icon-btn"
              onClick={() => window.open("https://yandex.ru/images/", "_blank")} title="Поиск по картинке">
              <Icon name="Camera" size={22} className="mp-icon-gray" />
            </button>
          </div>
        </form>

        {/* ALERTS */}
        {blocked && (
          <div className="mp-alert mp-alert--red">
            <Icon name="ShieldAlert" size={16} />
            <span>Такой запрос заблокирован. Попробуйте другой.</span>
          </div>
        )}
        {micError === "denied" && (
          <div className="mp-alert mp-alert--orange">
            <Icon name="MicOff" size={16} />
            <span>Нет доступа к микрофону.</span>
            <button className="mp-alert-btn" onClick={requestMicPermission}>
              Разрешить
            </button>
          </div>
        )}
        {micError === "no-support" && (
          <div className="mp-alert mp-alert--orange">
            <Icon name="Info" size={16} />
            <span>Голосовой ввод не поддерживается. Используйте Chrome.</span>
          </div>
        )}

        {/* NAV BUTTONS */}
        <div className="mp-nav-btns">
          <a href="https://yandex.ru/images" target="_blank" rel="noreferrer" className="mp-nav-btn">
            <Icon name="Image" size={15} />
            Картинки
          </a>
          <a href="https://dzen.ru/news" target="_blank" rel="noreferrer" className="mp-nav-btn">
            <Icon name="Newspaper" size={15} />
            Новости
          </a>
          {customLinks.map((link) => (
            <div key={link.id} className="mp-nav-btn-wrap">
              <a href={link.url} target="_blank" rel="noreferrer" className="mp-nav-btn mp-nav-btn--custom">
                <Icon name="Globe" size={15} />
                {link.name}
              </a>
              <button className="mp-nav-delete" onClick={() => handleDeleteLink(link.id)} title="Удалить">
                <Icon name="X" size={12} />
              </button>
            </div>
          ))}
          <button className="mp-nav-btn mp-nav-btn--add" onClick={() => setShowAddForm(true)}>
            <Icon name="Plus" size={15} />
            Добавить
          </button>
        </div>

        {/* ADD LINK FORM */}
        {showAddForm && (
          <div className="mp-add-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddForm(false)}>
            <div className="mp-add-modal">
              <div className="mp-add-header">
                <span className="mp-add-title">Новая кнопка</span>
                <button className="mp-add-close" onClick={() => { setShowAddForm(false); setAddError(""); }}>
                  <Icon name="X" size={18} />
                </button>
              </div>
              <div className="mp-add-body">
                <div className="mp-add-field">
                  <label className="mp-add-label">Название</label>
                  <input
                    className="mp-add-input"
                    placeholder="Например: ВКонтакте"
                    value={newName}
                    onChange={(e) => { setNewName(e.target.value); setAddError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                    autoFocus
                  />
                </div>
                <div className="mp-add-field">
                  <label className="mp-add-label">Адрес сайта</label>
                  <input
                    className="mp-add-input"
                    placeholder="Например: vk.com"
                    value={newUrl}
                    onChange={(e) => { setNewUrl(e.target.value); setAddError(""); }}
                    onKeyDown={(e) => e.key === "Enter" && handleAddLink()}
                  />
                </div>
                {addError && <p className="mp-add-error">{addError}</p>}
              </div>
              <div className="mp-add-footer">
                <button className="mp-add-cancel" onClick={() => { setShowAddForm(false); setAddError(""); }}>
                  Отмена
                </button>
                <button className="mp-add-save" onClick={handleAddLink}>
                  Добавить
                </button>
              </div>
            </div>
          </div>
        )}

        <p className="mp-hint">
          Введите запрос или адрес сайта — он откроется в новой вкладке
        </p>
      </main>
    </div>
  );
}
