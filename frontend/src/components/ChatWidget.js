import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat } from '../services/api';

// ─── Code Block Component with Copy to Clipboard ─────────────────────────────
function CodeBlock({ node, inline, className, children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const lang = match ? match[1] : '';
  const codeString = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (inline || !match) {
    return (
      <code className="chat-inline-code" {...props}>
        {children}
      </code>
    );
  }

  return (
    <div className="chat-code-block">
      <div className="chat-code-header">
        <span className="chat-code-lang">{lang || 'text'}</span>
        <button className="chat-code-copy-btn" onClick={handleCopy} title="Copy code">
          {copied ? (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>Copied!</span>
            </>
          ) : (
            <>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="chat-code-pre">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

// ─── Markdown Component Renderers ───────────────────────────────────────────
const markdownComponents = {
  code: CodeBlock,
  table: ({ node, children, ...props }) => (
    <div className="chat-table-wrapper">
      <table className="chat-table" {...props}>{children}</table>
    </div>
  ),
  a: ({ node, children, ...props }) => (
    <a target="_blank" rel="noopener noreferrer" className="chat-link" {...props}>{children}</a>
  ),
  blockquote: ({ node, children, ...props }) => (
    <blockquote className="chat-blockquote" {...props}>{children}</blockquote>
  ),
  h1: ({ node, children, ...props }) => <h4 className="chat-heading chat-h1" {...props}>{children}</h4>,
  h2: ({ node, children, ...props }) => <h5 className="chat-heading chat-h2" {...props}>{children}</h5>,
  h3: ({ node, children, ...props }) => <h6 className="chat-heading chat-h3" {...props}>{children}</h6>,
  ul: ({ node, children, ...props }) => <ul className="chat-list chat-ul" {...props}>{children}</ul>,
  ol: ({ node, children, ...props }) => <ol className="chat-list chat-ol" {...props}>{children}</ol>,
  li: ({ node, children, ...props }) => <li className="chat-list-item" {...props}>{children}</li>,
  hr: ({ node, ...props }) => <hr className="chat-hr" {...props} />,
};

// ─── Single message bubble ────────────────────────────────────────────────────
function ChatMessage({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-ai'}`}>
      {!isUser && <div className="chat-avatar">✦</div>}
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        ) : (
          <div className="chat-markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {msg.content}
            </ReactMarkdown>
          </div>
        )}
      </div>
      {isUser && (
        <div className="chat-avatar chat-avatar-user">
          {localStorage.getItem('username')?.[0]?.toUpperCase() || 'U'}
        </div>
      )}
    </div>
  );
}

// ─── Typing dots animation ─────────────────────────────────────────────────────
function TypingDots() {
  return (
    <div className="chat-msg chat-msg-ai">
      <div className="chat-avatar">✦</div>
      <div className="chat-bubble chat-bubble-ai chat-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ─── ChatWidget ────────────────────────────────────────────────────────────────
function ChatWidget({ productId }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      content: productId
        ? "Hi! I see you're viewing this product. Ask me anything about its **price**, **specifications**, **stock availability**, or comparisons!"
        : "Hi! I'm your **AI Shopping Assistant**. How can I help you discover products, compare prices, or find recommendations today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const streamRef = useRef(null);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingText]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  // Reset welcome message when productId changes
  useEffect(() => {
    setMessages([{
      role: 'ai',
      content: productId
        ? "Hi! I see you're viewing this product. Ask me anything about its **price**, **specifications**, **stock availability**, or comparisons!"
        : "Hi! I'm your **AI Shopping Assistant**. How can I help you discover products, compare prices, or find recommendations today?"
    }]);
  }, [productId]);

  const sendMessage = useCallback(() => {
    const text = input.trim();
    if (!text || streaming) return;

    // Append user message
    setMessages(prev => [...prev, { role: 'user', content: text }]);
    setInput('');
    setStreaming(true);
    setStreamingText('');

    let accumulated = '';

    streamRef.current = streamChat(
      text,
      productId ?? null,
      // onChunk
      (chunk) => {
        accumulated += chunk;
        setStreamingText(accumulated);
      },
      // onDone
      () => {
        setMessages(prev => [...prev, { role: 'ai', content: accumulated }]);
        setStreamingText('');
        setStreaming(false);
        streamRef.current = null;
      },
      // onError
      (err) => {
        console.error('Chat error:', err);
        setMessages(prev => [
          ...prev,
          { role: 'ai', content: '⚠️ *Sorry, something went wrong while communicating with Gemini. Please try again.*' }
        ]);
        setStreamingText('');
        setStreaming(false);
        streamRef.current = null;
      }
    );
  }, [input, productId, streaming]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const stopStreaming = () => {
    streamRef.current?.close();
    if (streamingText) {
      setMessages(prev => [...prev, { role: 'ai', content: streamingText }]);
    }
    setStreamingText('');
    setStreaming(false);
    streamRef.current = null;
  };

  const clearChat = () => {
    setMessages([{
      role: 'ai',
      content: productId
        ? "Chat reset! Ask me anything about this product."
        : "Chat reset! How can I help you?"
    }]);
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        id="chat-widget-trigger"
        className={`chat-fab ${open ? 'chat-fab-active' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Open AI Assistant"
        title="AI Shopping Assistant"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            <path d="M8 10h8M8 14h4" />
          </svg>
        )}
        {!open && <span className="chat-fab-pulse" />}
      </button>

      {/* ── Chat panel ── */}
      <div
        id="chat-panel"
        className={`chat-panel ${open ? 'chat-panel-open' : ''}`}
        aria-hidden={!open}
      >
        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-info">
            <div className="chat-header-avatar">✦</div>
            <div>
              <div className="chat-header-title">Gemini Assistant</div>
              <div className="chat-header-sub">
                {productId ? `Viewing product #${productId}` : 'Online Shopping AI'}
                <span className={`chat-status-dot ${streaming ? 'chat-status-active' : ''}`} />
              </div>
            </div>
          </div>
          <div className="chat-header-actions">
            <button className="chat-icon-btn" onClick={clearChat} title="Clear chat">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" /><path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
              </svg>
            </button>
            <button className="chat-icon-btn" onClick={() => setOpen(false)} title="Minimise">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chat-messages" id="chat-messages-list">
          {messages.map((msg, i) => (
            <ChatMessage key={i} msg={msg} />
          ))}

          {/* Live streaming bubble */}
          {streaming && !streamingText && <TypingDots />}
          {streaming && streamingText && (
            <div className="chat-msg chat-msg-ai">
              <div className="chat-avatar">✦</div>
              <div className="chat-bubble chat-bubble-ai">
                <div className="chat-markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {streamingText}
                  </ReactMarkdown>
                  <span className="chat-stream-cursor" />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input area */}
        <div className="chat-input-area">
          <textarea
            ref={inputRef}
            id="chat-input"
            className="chat-input"
            placeholder={productId ? "Ask about this product…" : "Ask me anything…"}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={streaming}
          />
          {streaming ? (
            <button className="chat-send-btn chat-stop-btn" onClick={stopStreaming} title="Stop generating">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="6" width="12" height="12" rx="2" />
              </svg>
            </button>
          ) : (
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim()}
              title="Send"
              id="chat-send-button"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          )}
        </div>
        <div className="chat-footer-hint">Press Enter to send · Shift+Enter for newline</div>
      </div>
    </>
  );
}

export default ChatWidget;
