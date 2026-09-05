import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamChat, verifyPayment, getPaymentKey, cancelOrder, refundOrder } from '../services/api';

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

// ─── Interactive Refundable/Cancellable Order Cards ─────────────────────────
function RefundableOrderCards({ orders, onCancelOrder, cancellingOrderId, cancelledOrderIds }) {
  if (!orders || orders.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginTop: '0.65rem' }}>
      {orders.map((order) => {
        const isCancelledOrRefunded = cancelledOrderIds?.has(order.id) || order.status === 'REFUNDED' || order.status === 'CANCELLED';
        const isCancelling = cancellingOrderId === order.id;
        const isPaid = order.status === 'PAID';
        const displayStatus = isCancelledOrRefunded
          ? (isPaid ? 'REFUNDED' : 'CANCELLED')
          : (order.status || 'PENDING');

        const itemSummary = Array.isArray(order.item) && order.item.length > 0
          ? order.item.map((i) => (i.product?.name || 'Item') + (i.quantity > 1 ? ` (x${i.quantity})` : '')).join(', ')
          : (order.items || `Order #${order.id}`);

        const priceNum = Number(order.price) || 0;

        return (
          <div
            key={order.id}
            style={{
              background: isCancelledOrRefunded ? 'rgba(100,116,139,0.08)' : 'rgba(99,102,241,0.08)',
              border: `1px solid ${isCancelledOrRefunded ? 'rgba(100,116,139,0.25)' : 'rgba(99,102,241,0.28)'}`,
              borderRadius: '11px',
              padding: '0.8rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.35rem',
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span>📦</span>
                  <span>Order #{order.id}</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: '1.25' }}>
                  {itemSummary}
                </div>
                {order.createdAt && (
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </div>
                )}
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontWeight: 800, color: isCancelledOrRefunded ? 'var(--text-muted)' : 'var(--primary-color)', fontSize: '0.98rem' }}>
                  ₹{priceNum.toLocaleString('en-IN')}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    marginTop: '0.2rem',
                    color: isCancelledOrRefunded
                      ? '#a78bfa'
                      : isPaid
                        ? '#4ade80'
                        : '#f59e0b',
                  }}
                >
                  {isCancelledOrRefunded ? '↩️ ' + displayStatus : isPaid ? '✅ PAID' : '⏳ PENDING'}
                </div>
              </div>
            </div>

            {!isCancelledOrRefunded ? (
              <button
                onClick={() => onCancelOrder && onCancelOrder(order.id, order.status)}
                disabled={isCancelling}
                style={{
                  marginTop: '0.4rem',
                  padding: '0.5rem 0.85rem',
                  background: isPaid
                    ? 'linear-gradient(135deg, #ef4444, #dc2626)'
                    : 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none',
                  borderRadius: '7px',
                  color: '#fff',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                  cursor: isCancelling ? 'wait' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.4rem',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  transition: 'opacity 0.15s, transform 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <span>{isCancelling ? '⏳' : isPaid ? '↩️' : '🚫'}</span>
                <span>
                  {isCancelling
                    ? 'Processing...'
                    : isPaid
                      ? 'Tap to Cancel & Refund Order'
                      : 'Tap to Cancel Order'}
                </span>
              </button>
            ) : (
              <div style={{ marginTop: '0.3rem', fontSize: '0.78rem', color: '#a78bfa', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span>✅</span>
                <span>Order cancelled and refund processed.</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Parse refundable/cancellable orders from AI message content ─────────────
function extractRefundableOrders(content) {
  if (!content) return null;

  // 1. Try to find a fenced ```orders ... ``` or ```json ... ``` block
  const ordersBlockMatch = content.match(/```(?:orders|json)?\s*(\[[\s\S]*?\])\s*```/i);
  if (ordersBlockMatch) {
    try {
      const parsed = JSON.parse(ordersBlockMatch[1]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        return parsed;
      }
    } catch (e) {}
  }

  // 2. Try to find any raw JSON array where items have an id
  try {
    const jsonMatch = content.match(/\[\s*\{[\s\S]*?"id"\s*:[\s\S]*?\}\s*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Markdown Table rows: | Order ID | Items | Price | Status |
  const tableRows = [...content.matchAll(/\|\s*(?:#|Order\s*ID:?\s*)?(\d+)\s*\|\s*([^|]+)\|\s*(?:₹|INR|\$)?\s*([0-9,]+(?:\.[0-9]+)?)\s*\|\s*([^|]+)\|/gi)];
  if (tableRows.length > 0) {
    const parsedOrders = tableRows.map(r => ({
      id: parseInt(r[1], 10),
      items: r[2].trim() || `Order #${r[1]}`,
      price: parseFloat(r[3].replace(/,/g, '')) || 0,
      status: /PAID/i.test(r[4]) ? 'PAID' : (/CANCELLED/i.test(r[4]) ? 'CANCELLED' : (/REFUNDED/i.test(r[4]) ? 'REFUNDED' : 'PENDING')),
    }));
    if (parsedOrders.length > 0) return parsedOrders;
  }

  // 4. Fallback: Parse from text / list mentions (e.g. "Order #4: ₹143,800", "Order ID: 4", or numbered list)
  const orderRegex = /(?:Order\s*(?:#|ID:?\s*)|#)(\d+)([\s\S]*?)(?=(?:Order\s*(?:#|ID:?\s*)|#\d+|$))/gi;
  const sections = [...content.matchAll(orderRegex)];
  if (sections.length > 0) {
    const parsedOrders = [];
    for (const sec of sections) {
      const id = parseInt(sec[1], 10);
      if (isNaN(id) || id <= 0) continue;
      const text = sec[2];
      const priceMatch = text.match(/(?:₹|INR|\$|Total:?\s*|Price:?\s*)\s*([0-9,]+(?:\.[0-9]+)?)/i);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0;
      const isPaid = /\bPAID\b/i.test(text);
      const isCancelled = /\bCANCELLED\b/i.test(text);
      const isRefunded = /\bREFUNDED\b/i.test(text);
      const status = isRefunded ? 'REFUNDED' : isCancelled ? 'CANCELLED' : isPaid ? 'PAID' : 'PENDING';
      const itemsMatch = text.match(/(?:Items?|Products?):\s*([^\n\r]+)/i);
      const items = itemsMatch ? itemsMatch[1].trim() : `Order #${id}`;
      if (price > 0 || isPaid || isCancelled || isRefunded || itemsMatch) {
        parsedOrders.push({ id, price, status, items });
      }
    }
    const unique = Array.from(new Map(parsedOrders.map(o => [o.id, o])).values());
    if (unique.length > 0) return unique;
  }

  return null;
}

// ─── Parse payment order details from AI message content ─────────────────────
function extractPaymentOrder(content) {
  if (!content) return null;

  // 1. Try to find a ```payment ... ``` block
  const paymentBlockMatch = content.match(/```(?:payment|json)?\s*(\{[\s\S]*?"razorpayOrderId"[\s\S]*?\})\s*```/i);
  if (paymentBlockMatch) {
    try {
      const parsed = JSON.parse(paymentBlockMatch[1]);
      if (parsed.razorpayOrderId) return parsed;
    } catch (e) {}
  }

  // 2. Try to find any raw JSON containing razorpayOrderId
  const jsonMatch = content.match(/\{[\s\S]*?"razorpayOrderId"[\s\S]*?\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.razorpayOrderId) return parsed;
    } catch (e) {}
  }

  // 3. Fallback: Parse from plain text regex if LLM formatted as text
  const rzpMatch = content.match(/Razorpay Order ID:\s*([a-zA-Z0-9_]+)/i);
  if (rzpMatch) {
    const rzpOrderId = rzpMatch[1].trim();
    const orderIdMatch = content.match(/Order ID:\s*(\d+)/i);
    const amountMatch = content.match(/Amount:\s*(?:₹|INR)?\s*([0-9,]+(?:\.[0-9]+)?)/i);
    let amountInPaise = 0;
    if (amountMatch) {
      const num = parseFloat(amountMatch[1].replace(/,/g, ''));
      amountInPaise = Math.round(num * 100);
    }
    return {
      razorpayOrderId: rzpOrderId,
      orderId: orderIdMatch ? orderIdMatch[1] : null,
      amount: amountInPaise,
      currency: 'INR',
    };
  }

  return null;
}

// ─── Interactive Payment Order Card ──────────────────────────────────────────
function PaymentOrderCard({ payment, onPayNow, isPaid, isVerifying }) {
  const amountFormatted = payment.amount
    ? (payment.amount / 100).toLocaleString('en-IN', { style: 'currency', currency: payment.currency || 'INR' })
    : '₹0';

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.09), rgba(99,102,241,0.12))',
        border: '1px solid rgba(245,158,11,0.35)',
        borderRadius: '12px',
        padding: '0.85rem 1rem',
        marginTop: '0.65rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.45rem',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span>💳</span>
          <span>Payment Required {payment.orderId ? `(Order #${payment.orderId})` : ''}</span>
        </div>
        <span
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: '999px',
            background: isPaid ? 'rgba(74,222,128,0.2)' : 'rgba(245,158,11,0.2)',
            color: isPaid ? '#4ade80' : '#f59e0b',
            border: `1px solid ${isPaid ? 'rgba(74,222,128,0.4)' : 'rgba(245,158,11,0.4)'}`,
          }}
        >
          {isPaid ? '✅ PAID' : isVerifying ? '⏳ VERIFYING...' : '⚡ PENDING'}
        </span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '0.1rem' }}>
        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
          Order: <code style={{ color: 'var(--text-secondary)' }}>{payment.razorpayOrderId}</code>
        </div>
        <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f59e0b' }}>
          {amountFormatted}
        </div>
      </div>

      {!isPaid && (
        <button
          onClick={onPayNow}
          disabled={isVerifying}
          style={{
            marginTop: '0.35rem',
            padding: '0.55rem 1rem',
            background: 'linear-gradient(135deg, #f59e0b, #d97706)',
            border: 'none',
            borderRadius: '8px',
            color: '#fff',
            fontSize: '0.88rem',
            fontWeight: 700,
            cursor: isVerifying ? 'wait' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            boxShadow: '0 2px 8px rgba(245,158,11,0.3)',
            transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <span>🔒</span>
          <span>{isVerifying ? 'Verifying Payment...' : 'Pay Now with Razorpay'}</span>
        </button>
      )}

      {isPaid && (
        <div style={{ fontSize: '0.8rem', color: '#4ade80', fontWeight: 600, textAlign: 'center', marginTop: '0.2rem' }}>
          🎉 Order placed successfully!
        </div>
      )}
    </div>
  );
}

// ─── Single message bubble ────────────────────────────────────────────────────
function ChatMessage({ msg, onCancelOrder, cancellingOrderId, cancelledOrderIds, onPayNow }) {
  const isUser = msg.role === 'user';

  // Check if this is a refundable-orders response from the AI
  const refundableOrders = !isUser && msg.refundableOrders ? msg.refundableOrders : null;
  const paymentOrder = !isUser && msg.paymentOrder ? msg.paymentOrder : null;

  return (
    <div className={`chat-msg ${isUser ? 'chat-msg-user' : 'chat-msg-ai'}`}>
      {!isUser && <div className="chat-avatar">✦</div>}
      <div className={`chat-bubble ${isUser ? 'chat-bubble-user' : 'chat-bubble-ai'}`}>
        {isUser ? (
          <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
        ) : (
          <div className="chat-markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {msg.displayContent || msg.content}
            </ReactMarkdown>
            {paymentOrder && (
              <PaymentOrderCard
                payment={paymentOrder}
                onPayNow={() => onPayNow(paymentOrder, msg.id)}
                isPaid={msg.isPaid}
                isVerifying={msg.isVerifying}
              />
            )}
            {refundableOrders && refundableOrders.length > 0 && (
              <RefundableOrderCards
                orders={refundableOrders}
                onCancelOrder={onCancelOrder}
                cancellingOrderId={cancellingOrderId}
                cancelledOrderIds={cancelledOrderIds}
              />
            )}
            {refundableOrders && refundableOrders.length === 0 && (
              <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No active orders available for cancellation.
              </div>
            )}
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
  const [cancellingOrderId, setCancellingOrderId] = useState(null);
  const [cancelledOrderIds, setCancelledOrderIds] = useState(new Set());
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

  // Direct touch handler to cancel or refund an order without typing to the LLM
  const handleCancelOrder = useCallback(async (orderId, status) => {
    if (cancellingOrderId) return;
    setCancellingOrderId(orderId);
    const isPaid = status === 'PAID';
    try {
      if (isPaid) {
        await refundOrder(orderId);
      } else {
        await cancelOrder(orderId);
      }

      // 1. Mark as cancelled in local Set
      setCancelledOrderIds(prev => new Set(prev).add(orderId));

      // 2. Update existing messages so any card rendered in chat changes to CANCELLED/REFUNDED
      setMessages(prev => prev.map(m => {
        if (m.refundableOrders) {
          return {
            ...m,
            refundableOrders: m.refundableOrders.map(o =>
              o.id === orderId ? { ...o, status: isPaid ? 'REFUNDED' : 'CANCELLED' } : o
            )
          };
        }
        return m;
      }));

      // 3. Append AI confirmation message to chat
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'ai',
          content: `✅ **Order #${orderId} has been successfully ${isPaid ? 'cancelled and refunded' : 'cancelled'}!**\n\nThe order status has been updated in your account.`,
        }
      ]);

      // 4. Notify app (Orders page) to refresh
      window.dispatchEvent(new CustomEvent('orders-updated', { detail: { orderId } }));
    } catch (err) {
      console.error('Failed to cancel order:', err);
      const errMsg = err?.response?.data?.message || err?.response?.data || err.message || 'Failed to cancel order';
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          role: 'ai',
          content: `⚠️ **Could not cancel Order #${orderId}**: ${typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)}. Please try again or visit your Orders page.`,
        }
      ]);
    } finally {
      setCancellingOrderId(null);
    }
  }, [cancellingOrderId]);

  // Called to open Razorpay modal and handle payment verification
  const handleRazorpayPayment = useCallback(async (paymentOrder, msgId) => {
    try {
      let key = paymentOrder.keyId;
      if (!key) {
        try {
          const keyRes = await getPaymentKey();
          key = keyRes.data?.keyId;
        } catch (e) {
          console.error("Failed to fetch Razorpay key:", e);
        }
      }

      if (!window.Razorpay) {
        alert("Razorpay checkout SDK is not loaded. Please refresh the page.");
        return;
      }

      const options = {
        key: key,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency || 'INR',
        name: 'ShopAI',
        description: `Order Payment ${paymentOrder.orderId ? '#' + paymentOrder.orderId : ''}`,
        order_id: paymentOrder.razorpayOrderId,
        theme: { color: '#f59e0b' },
        handler: async (response) => {
          if (msgId) {
            setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isVerifying: true } : m));
          }
          try {
            await verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            if (msgId) {
              setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isPaid: true, isVerifying: false } : m));
            }
            setMessages(prev => [
              ...prev,
              {
                id: Date.now(),
                role: 'ai',
                content: `🎉 **Payment Successful!**\n\nYour payment for **Order #${paymentOrder.orderId || ''}** has been confirmed (Payment ID: \`${response.razorpay_payment_id}\`). Your order is placed and being prepared!`,
              },
            ]);
          } catch (err) {
            if (msgId) {
              setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isVerifying: false } : m));
            }
            alert('Payment verification failed. Please contact support.');
          }
        },
        modal: {
          ondismiss: () => {
            console.log('Payment modal closed');
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (resp) => {
        alert('Payment failed: ' + (resp.error?.description || 'Payment could not be completed.'));
      });
      rzp.open();
    } catch (err) {
      console.error('Error initiating Razorpay:', err);
      alert('Could not start Razorpay checkout. Please try again.');
    }
  }, []);

  const sendMessage = useCallback((overrideText) => {
    const text = (overrideText || input).trim();
    if (!text || streaming) return;

    setMessages(prev => [...prev, { role: 'user', content: text }]);
    if (!overrideText) setInput('');
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
        const refundableOrders = extractRefundableOrders(accumulated);
        const paymentOrder = extractPaymentOrder(accumulated);
        const msgId = Date.now();

        // If LLM message itself confirms an order cancellation, record it and update state
        const cancelMatch = accumulated.match(/(?:order\s*#?|#)(\d+)[^.\n]*?(?:cancelled|refunded)/i) ||
                            accumulated.match(/(?:cancelled|refunded)[^.\n]*?(?:order\s*#?|#)(\d+)/i);
        if (cancelMatch) {
          const cId = parseInt(cancelMatch[1], 10);
          if (!isNaN(cId)) {
            setCancelledOrderIds(prev => new Set(prev).add(cId));
            setMessages(prev => prev.map(m => {
              if (m.refundableOrders) {
                return {
                  ...m,
                  refundableOrders: m.refundableOrders.map(o =>
                    o.id === cId ? { ...o, status: o.status === 'PAID' ? 'REFUNDED' : 'CANCELLED' } : o
                  )
                };
              }
              return m;
            }));
            window.dispatchEvent(new CustomEvent('orders-updated', { detail: { orderId: cId } }));
          }
        }

        // Clean content for display: hide raw JSON blocks and orders code blocks from chat text
        let cleanContent = accumulated;
        if (paymentOrder) {
          cleanContent = cleanContent
            .replace(/```(?:payment|json)?\s*\{[\s\S]*?"razorpayOrderId"[\s\S]*?\}\s*```/gi, '')
            .trim();
        }
        if (refundableOrders) {
          cleanContent = cleanContent
            .replace(/```(?:orders|json)?\s*\[[\s\S]*?\]\s*```/gi, '')
            .replace(/\[\s*\{[\s\S]*?"id"\s*:[\s\S]*?\}\s*\]/g, '')
            .trim();
        }

        setMessages(prev => [...prev, {
          id: msgId,
          role: 'ai',
          content: accumulated,
          displayContent: cleanContent || accumulated,
          refundableOrders: refundableOrders || undefined,
          paymentOrder: paymentOrder || undefined,
          isPaid: false,
          isVerifying: false,
        }]);
        setStreamingText('');
        setStreaming(false);
        streamRef.current = null;

        // Automatically trigger Razorpay checkout modal
        if (paymentOrder && paymentOrder.razorpayOrderId) {
          setTimeout(() => {
            handleRazorpayPayment(paymentOrder, msgId);
          }, 400);
        }
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
  }, [input, productId, streaming, handleRazorpayPayment]);

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
            <ChatMessage
              key={msg.id || i}
              msg={msg}
              onCancelOrder={handleCancelOrder}
              cancellingOrderId={cancellingOrderId}
              cancelledOrderIds={cancelledOrderIds}
              onPayNow={handleRazorpayPayment}
            />
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
              onClick={() => sendMessage()}
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
