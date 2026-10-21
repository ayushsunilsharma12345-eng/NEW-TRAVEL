import React, { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../../types/travel';
import { chatWithAgentApi } from '../../services/api';
import { sound } from '../../utils/audio';
import {
  Send,
  Sparkles,
  Bot,
  User,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  X,
  Compass
} from 'lucide-react';

interface AgentChatProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt?: (prompt: string) => void;
}

const DEFAULT_PROMPTS = [
  'How to do Tokyo on a $1200 budget?',
  'Best hidden food streets in Rome',
  'What should I pack for Bali rainy season?',
  'Tips for flying long-haul without jet lag',
  'How early should I book European train passes?'
];

export const AgentChat: React.FC<AgentChatProps> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: "👋 Hello! I am your AI Travel Intelligence Agent. Ask me anything about flights, budgeting, local customs, packing advice, or hidden gem exploration. How can I assist your wanderlust today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      suggestedActions: [
        'How to do Tokyo on a $1200 budget?',
        'Best hidden food streets in Rome',
        'Compare Bali vs Phuket costs'
      ]
    }
  ]);
  const [inputValue, setInputValue] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputValue;
    if (!query.trim() || isLoading) return;

    sound.playClick();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const response = await chatWithAgentApi(query, messages);
      const assistantMsg: ChatMessage = {
        id: `asst-${Date.now()}`,
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: response.suggestedActions,
      };
      setMessages(prev => [...prev, assistantMsg]);
      sound.playSuccessChime();
    } catch {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        text: "I had a moment of connection turbulence! You can continue planning trips directly via the Itinerary Planner or inspect destinations on the 3D Globe.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    sound.playClick();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClear = () => {
    sound.playClick();
    setMessages([
      {
        id: 'welcome-reset',
        role: 'assistant',
        text: "Conversation refreshed! Ask me anything about destinations, flights, or itineraries.",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        suggestedActions: DEFAULT_PROMPTS.slice(0, 3)
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[450px] bg-slate-900/95 border-l border-slate-800 shadow-2xl flex flex-col backdrop-blur-xl animate-in slide-in-from-right duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/80">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm text-white flex items-center gap-2">
              AI Travel Intelligence Agent
            </div>
            <div className="text-[11px] text-cyan-400 font-medium">Powered by Google Gemini 3.8</div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleClear}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Clear Chat"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition-colors"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Prompts Bar */}
      <div className="px-4 py-2 bg-slate-950/40 border-b border-slate-800/80 flex items-center gap-1.5 overflow-x-auto text-[11px]">
        <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
        <span className="text-slate-500 shrink-0">Prompts:</span>
        {DEFAULT_PROMPTS.slice(0, 3).map(prompt => (
          <button
            key={prompt}
            onClick={() => handleSendMessage(prompt)}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} space-y-1.5`}
          >
            <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-mono px-1">
              {msg.role === 'assistant' ? (
                <>
                  <Bot className="w-3 h-3 text-cyan-400" />
                  <span>AI Agent · {msg.timestamp}</span>
                </>
              ) : (
                <>
                  <User className="w-3 h-3 text-emerald-400" />
                  <span>You · {msg.timestamp}</span>
                </>
              )}
            </div>

            <div
              className={`relative group max-w-[88%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-tr-none shadow-md'
                  : 'bg-slate-950/80 border border-slate-800 text-slate-200 rounded-tl-none shadow-sm'
              }`}
            >
              <div className="whitespace-pre-wrap">{msg.text}</div>

              {/* Copy message button */}
              <button
                onClick={() => handleCopy(msg.id, msg.text)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded bg-slate-800/80 text-slate-400 hover:text-white transition-opacity"
                title="Copy"
              >
                {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              </button>
            </div>

            {/* Suggested action chips from model */}
            {msg.suggestedActions && msg.suggestedActions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1 max-w-[88%]">
                {msg.suggestedActions.map((action, aIdx) => (
                  <button
                    key={aIdx}
                    onClick={() => handleSendMessage(action)}
                    className="text-[10px] px-2.5 py-1 rounded-full bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-800/40 text-cyan-300 font-medium transition-colors text-left"
                  >
                    ↳ {action}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 bg-slate-950/70 border border-slate-800 rounded-2xl w-fit">
            <div className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-400">Agent thinking...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Footer */}
      <div className="p-3.5 border-t border-slate-800 bg-slate-950">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Ask about flights, stays, food, visas..."
            className="flex-1 bg-slate-900 border border-slate-800 focus:border-cyan-400 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
          />
          <button
            type="submit"
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white disabled:opacity-50 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed shadow-md"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
