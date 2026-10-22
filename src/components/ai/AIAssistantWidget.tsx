import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageProvider';
import { aiService, AIChatMessage } from '../../services/aiService';
import { STORE_CONSTANTS } from '../../lib/constants';
import { formatPKR } from '../../lib/format';

export const AIAssistantWidget: React.FC = () => {
  const { language, t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        language === 'ur'
          ? 'السلام علیکم! میں آرٹس اپیرل کا سٹائلنگ اسسٹنٹ ہوں۔ آج میں آپ کو بہترین لباس کے انتخاب میں کیسے مدد کر سکتا ہوں؟'
          : 'Salam! I am your ARTS APPAREL personal stylist. How can I help you dress sharp today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recommendedProducts, setRecommendedProducts] = useState<any[]>([]);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const newMessages: AIChatMessage[] = [...messages, { role: 'user', content: query.trim() }];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(newMessages, language);
      if (res.quotaExceeded) {
        setQuotaExceeded(true);
      }
      setMessages([...newMessages, { role: 'assistant', content: res.reply }]);
      if (res.products && res.products.length > 0) {
        setRecommendedProducts(res.products);
      }
    } catch {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content:
            language === 'ur'
              ? 'معذرت، رابطہ قائم نہ ہو سکا۔ آپ براہ راست واٹس ایپ پر ہمارے درزی سے بات کر سکتے ہیں۔'
              : 'Our AI stylist encountered a connection issue. You can chat with our team on WhatsApp anytime.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestions = [
    t('ai_assistant.suggest_wedding'),
    t('ai_assistant.suggest_budget'),
    t('ai_assistant.suggest_delivery'),
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-13 h-13 rounded-full bg-black border-2 border-[#E31B23] shadow-2xl flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all focus:outline-none focus:ring-2 focus:ring-[#E31B23]"
          aria-label="Open AI Styling Assistant"
        >
          {isOpen ? (
            <span className="text-xl font-bold">✕</span>
          ) : (
            <div className="flex flex-col items-center justify-center">
              {/* Stylist icon with tie */}
              <svg className="w-6 h-6 text-[#E31B23]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
              </svg>
            </div>
          )}
          {/* Status dot */}
          <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-black" />
        </button>
      </div>

      {/* Assistant Modal / Panel */}
      {isOpen && (
        <div className="fixed bottom-22 right-4 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[380px] h-[520px] max-h-[80vh] bg-[#111111] border border-neutral-800 rounded-[12px] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200 text-white">
          {/* Header */}
          <div className="px-5 py-3.5 bg-black border-b border-neutral-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-[#161616] border border-[#E31B23] flex items-center justify-center">
                <span className="text-[#E31B23] font-serif font-black text-sm">A</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-sm font-bold">{t('ai_assistant.title')}</h3>
                  <span className="px-1.5 py-0.5 text-[9px] font-mono tracking-wider uppercase bg-red-950/80 text-red-300 border border-red-800/80 rounded flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                    gemini-4-argon · Thinking: HIGH
                  </span>
                </div>
                <p className="text-[10px] text-neutral-400">Master Tailor & Bespoke Menswear Consultant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-neutral-400 hover:text-white p-1 text-sm rounded hover:bg-neutral-800"
              aria-label="Close assistant"
            >
              ✕
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[8px] p-3 leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-[#E31B23] text-white'
                      : 'bg-[#1C1C1C] text-neutral-200 border border-neutral-800'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {/* Recommended Products cards if returned */}
            {recommendedProducts.length > 0 && (
              <div className="pt-1 space-y-2">
                <p className="text-[11px] text-neutral-400 font-semibold uppercase tracking-wider">
                  Recommended Tailoring:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {recommendedProducts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/product/${p.slug}`}
                      onClick={() => setIsOpen(false)}
                      className="p-2 rounded bg-neutral-900 border border-neutral-800 hover:border-[#E31B23] transition-colors group flex flex-col"
                    >
                      {p.image && (
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-20 object-cover rounded mb-1.5"
                        />
                      )}
                      <span className="text-white font-medium line-clamp-1 group-hover:text-[#E31B23]">
                        {p.name}
                      </span>
                      <span className="text-[#E31B23] font-bold mt-auto text-[11px]">
                        {formatPKR(p.price)}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Quota Exceeded Fallback Card */}
            {quotaExceeded && (
              <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-[6px] space-y-2">
                <p className="text-red-200 text-xs">
                  {t('ai_assistant.fallback_message')}
                </p>
                <a
                  href={`https://wa.me/${STORE_CONSTANTS.whatsapp_number}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 bg-black border border-neutral-700 text-white hover:border-[#E31B23] px-3 py-1.5 rounded text-xs font-semibold"
                >
                  <span>Chat on WhatsApp</span>
                  <span>→</span>
                </a>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#1C1C1C] border border-neutral-800 rounded-[8px] p-2.5 space-y-1.5 text-neutral-300 text-xs max-w-[90%] shadow-lg">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-[#E31B23] rounded-full animate-ping" />
                    <span className="font-semibold text-white text-[11px] flex items-center gap-1.5">
                      <span>🧠 gemini-4-argon</span>
                      <span className="text-[9px] px-1 py-0.5 bg-red-950 text-red-300 rounded border border-red-800/80 font-mono">
                        ThinkingLevel.HIGH
                      </span>
                    </span>
                  </div>
                  <p className="text-[10px] text-neutral-400 pl-4 leading-normal">
                    Analyzing tailoring silhouette, fabric drape, climate & bespoke occasion styling...
                  </p>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestion Chips */}
          <div className="px-3 py-2 bg-black border-t border-neutral-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px] no-scrollbar">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => handleSend(s)}
                className="whitespace-nowrap px-2.5 py-1 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 shrink-0 transition-colors"
              >
                {s}
              </button>
            ))}
            <button
              onClick={() => handleSend(language === 'ur' ? 'شادی کے تینوں ایونٹس (مہندی، بارات، ولیمہ) کے لیے مکمل لباس اور رنگوں کی میچنگ پلان کریں' : 'Plan a complete 3-day wedding wardrobe (Mehndi, Barat, Walima) with fabrics and styling')}
              className="whitespace-nowrap px-2.5 py-1 rounded-full bg-red-950/40 hover:bg-red-900/60 text-red-200 hover:text-white border border-red-800/60 shrink-0 transition-colors flex items-center gap-1"
            >
              <span>🧠</span>
              <span>{language === 'ur' ? 'شادی وارڈروب پلان (ڈیپ تھنکنگ)' : 'Deep Styling: 3-Day Wedding Plan'}</span>
            </button>
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-[#161616] border-t border-neutral-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={t('ai_assistant.prompt_placeholder')}
              className="flex-1 bg-black border border-neutral-700 px-3 py-2 text-xs rounded text-white focus:outline-none focus:border-[#E31B23]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3.5 py-2 bg-[#E31B23] hover:bg-[#A8121A] disabled:opacity-40 text-white rounded font-medium text-xs transition-colors shrink-0"
              aria-label="Send query"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
};
