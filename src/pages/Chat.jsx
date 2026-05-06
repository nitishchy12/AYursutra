import React, { useEffect, useRef, useState } from 'react';
import { Leaf, Send, Sparkles, User } from 'lucide-react';
import { advisorApi } from '../services/api';

const welcome = { id: 1, role: 'ai', text: 'Namaste. I can answer therapy, prakriti, recovery, and precaution questions using your AyurSutra patient context.' };
const suggestions = ['Ask about my therapy', 'What precautions should I follow?', 'How is my recovery progressing?', 'What should I report to my practitioner?'];

export default function Chat() {
  const [messages, setMessages] = useState([welcome]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  async function send(e) {
    e?.preventDefault();
    if (!input.trim() || loading) return;
    const question = input.trim();
    setMessages((items) => [...items, { id: Date.now(), role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const data = await advisorApi.chat(question);
      setMessages((items) => [...items, { id: Date.now() + 1, role: 'ai', text: data.answer }]);
    } catch (error) {
      setMessages((items) => [...items, {
        id: Date.now() + 1,
        role: 'ai',
        text: 'I could not reach the AI advisor right now. Please try again in a moment, and follow your practitioner instructions for urgent symptoms.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="container page chat-page">
      <header className="text-center">
        <p className="eyebrow"><Sparkles size={14} /> Ayurvedic AI Advisor</p>
        <h1>Personal Panchakarma Guidance</h1>
      </header>
      <section className="panel chat-panel">
        <div className="chat-messages">
          {messages.map((message) => (
            <div key={message.id} className={`chat-bubble ${message.role}`}>
              <span className="avatar">{message.role === 'ai' ? <Leaf size={18} /> : <User size={18} />}</span>
              <p>{message.text}</p>
            </div>
          ))}
          {loading && <div className="chat-bubble ai"><span className="avatar"><Leaf size={18} /></span><p>Reviewing your patient context...</p></div>}
          <div ref={endRef} />
        </div>
        <div className="quick-prompts">
          {suggestions.map((item) => <button key={item} onClick={() => setInput(item)}>{item}</button>)}
        </div>
        <form className="chat-form" onSubmit={send}>
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about your therapy, symptoms, or post-care..." />
          <button className="btn btn-primary" disabled={loading || !input.trim()}><Send size={18} /></button>
        </form>
      </section>
    </div>
  );
}
