/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useRef, useEffect } from "react";
import Icon from "@/components/ui/icon";

const SpeechRecognition =
  (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

export default function Index() {
  const [query, setQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [rippleKeys, setRippleKeys] = useState<number[]>([]);
  const [suggestions] = useState([
    "Погода в Москве",
    "Курс доллара сегодня",
    "Рецепт борща",
    "Новости России",
  ]);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = "ru-RU";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (e: any) => {
        const text = e.results[0][0].transcript;
        setQuery(text);
        setIsListening(false);
      };
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
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

  const toggleVoice = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setQuery("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      window.open(
        `https://yandex.ru/search/?text=${encodeURIComponent(query)}`,
        "_blank"
      );
    }
  };

  const handleSuggestion = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  return (
    <div className="search-root">
      <div className="noise-overlay" />

      <header className="search-header">
        <nav className="search-nav">
          <span className="logo-text">ПОИСК</span>
          <div className="nav-links">
            <a href="#" className="nav-link">Картинки</a>
            <a href="#" className="nav-link">Новости</a>
            <a href="#" className="nav-link">Карты</a>
          </div>
        </nav>
      </header>

      <main className="search-main">
        <div className="hero-section">
          <div className="logo-block">
            <div className="logo-orb" />
            <h1 className="logo-headline">Найдите всё</h1>
            <p className="logo-subline">Голосовой поиск на русском языке</p>
          </div>

          <form onSubmit={handleSearch} className="search-form">
            <div
              className={`search-box ${isFocused ? "focused" : ""} ${
                isListening ? "listening" : ""
              }`}
            >
              <Icon name="Search" size={20} className="search-icon" />
              <input
                ref={inputRef}
                type="text"
                value={isListening ? "Говорите..." : query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Введите запрос..."
                className="search-input"
                readOnly={isListening}
              />
              {query && !isListening && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="clear-btn"
                >
                  <Icon name="X" size={16} />
                </button>
              )}
              <div className="divider-line" />
              <button
                type="button"
                onClick={toggleVoice}
                className={`mic-btn ${isListening ? "mic-active" : ""}`}
              >
                {rippleKeys.map((id) => (
                  <span key={id} className="mic-ripple" />
                ))}
                <Icon
                  name={isListening ? "MicOff" : "Mic"}
                  size={20}
                  className="mic-icon"
                />
              </button>
            </div>

            <button type="submit" className="search-submit">
              Найти
            </button>
          </form>

          <div className="suggestions">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSuggestion(s)}
                className="suggestion-chip"
              >
                {s}
              </button>
            ))}
          </div>

          {!SpeechRecognition && (
            <p className="no-speech-warning">
              Ваш браузер не поддерживает голосовой ввод
            </p>
          )}
        </div>
      </main>

      <footer className="search-footer">
        <span>© 2026 · Голосовой поиск</span>
      </footer>
    </div>
  );
}