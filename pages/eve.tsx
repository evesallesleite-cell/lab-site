// Eve AI - Your Personal Health Assistant
// Integrated with your health data, supplements, WHOOP metrics, and more

import { useState, useEffect, useRef } from 'react';
import Head from 'next/head';

export default function EveAI() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hey! I'm Eve, your personal health AI. 🤖

I'm connected to your WHOOP data, blood tests, supplement stack, and genetic insights. I can help you:

• **Analyze your health trends** - Sleep patterns, strain metrics, recovery scores
• **Supplement optimization** - Timing, interactions, personalized recommendations
• **Blood test insights** - What your markers mean for your goals
• **Genetic insights** - How your LifeCode data impacts your decisions
• **Proactive recommendations** - Actionable advice based on your data

What would you like to explore today?`,
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [healthContext, setHealthContext] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    loadHealthContext();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadHealthContext = async () => {
    try {
      const response = await fetch('/api/personal/unified-data');
      const data = await response.json();
      if (data.success) {
        setHealthContext(data.data);
      }
    } catch (error) {
      console.error('Error loading health context:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/personal/eve-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          includeContext: true,
          healthContext: healthContext
        })
      });

      const data = await response.json();

      if (data.success) {
        const eveMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString()
        };
        setMessages(prev => [...prev, eveMessage]);
      }
    } catch (error) {
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm having trouble connecting right now. Let me try again in a moment.",
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    { label: 'How did I sleep this week?', icon: '😴' },
    { label: 'My supplement timing optimal?', icon: '💊' },
    { label: 'Recovery trends lately?', icon: '📊' },
    { label: 'Blood test insights', icon: '🩸' },
    { label: 'Workout recommendations', icon: '🏋️' },
    { label: 'Genetic insights', icon: '🧬' }
  ];

  return (
    <>
      <Head>
        <title>Eve AI - Your Personal Health Assistant</title>
      </Head>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)',
        color: '#fff'
      }}>
        {/* Header */}
        <header style={{
          padding: '20px 30px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.4)'
          }}>
            🤖
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>Eve AI</h1>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.7 }}>
              Your Personal Health Intelligence
              {healthContext && (
                <span style={{ marginLeft: '10px', color: '#4ade80' }}>
                  ● Connected
                </span>
              )}
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <a href="/home" style={{
              padding: '10px 20px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '8px',
              color: '#fff',
              textDecoration: 'none',
              fontSize: '14px'
            }}>
              ← Back to Dashboard
            </a>
          </div>
        </header>

        {/* Main Content */}
        <div style={{
          display: 'flex',
          height: 'calc(100vh - 90px)',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          {/* Quick Actions Sidebar */}
          <div style={{
            width: '250px',
            padding: '20px',
            borderRight: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <h3 style={{ fontSize: '14px', textTransform: 'uppercase', opacity: 0.6, margin: '0 0 10px 0' }}>
              Quick Questions
            </h3>
            {quickPrompts.map((prompt, i) => (
              <button
                key={i}
                onClick={() => setInput(prompt.label)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '10px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontSize: '14px',
                  textAlign: 'left',
                  transition: 'all 0.2s'
                }}
              >
                <span>{prompt.icon}</span>
                <span>{prompt.label}</span>
              </button>
            ))}

            {/* Health Status Card */}
            {healthContext && (
              <div style={{
                marginTop: 'auto',
                padding: '16px',
                background: 'rgba(102, 126, 234, 0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(102, 126, 234, 0.3)'
              }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px' }}>📊 Your Health Data</h4>
                <div style={{ fontSize: '12px', lineHeight: '1.8', opacity: 0.8 }}>
                  <div>💤 {healthContext.whoop?.sleep?.length || 0} sleep records</div>
                  <div>🏋️ {healthContext.whoop?.strain?.length || 0} strain records</div>
                  <div>🩸 {healthContext.bloodTests?.totalAnalytes || 0} blood markers</div>
                  <div>💊 {healthContext.supplements?.totalSupplements || 0} supplements</div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Interface */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Messages */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              padding: '30px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px'
            }}>
              {messages.map((message) => (
                <div
                  key={message.id}
                  style={{
                    display: 'flex',
                    justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div style={{
                    maxWidth: '70%',
                    padding: '16px 24px',
                    borderRadius: message.role === 'user'
                      ? '20px 20px 4px 20px'
                      : '20px 20px 20px 4px',
                    background: message.role === 'user'
                      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                      : 'rgba(255,255,255,0.08)',
                    border: message.role === 'assistant' ? '1px solid rgba(255,255,255,0.1)' : 'none',
                    lineHeight: '1.6',
                    fontSize: '15px',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {message.content}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{
                    padding: '16px 24px',
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: '20px 20px 20px 4px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#667eea',
                      borderRadius: '50%',
                      animation: 'pulse 1.4s infinite'
                    }} />
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#667eea',
                      borderRadius: '50%',
                      animation: 'pulse 1.4s infinite 0.2s'
                    }} />
                    <span style={{
                      width: '8px',
                      height: '8px',
                      background: '#667eea',
                      borderRadius: '50%',
                      animation: 'pulse 1.4s infinite 0.4s'
                    }} />
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={handleSubmit}
              style={{
                padding: '20px 30px',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                display: 'flex',
                gap: '12px',
                alignItems: 'center'
              }}
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about your health..."
                style={{
                  flex: 1,
                  padding: '16px 24px',
                  borderRadius: '30px',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: '#fff',
                  fontSize: '16px',
                  outline: 'none'
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '50%',
                  background: input.trim() && !isLoading
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'rgba(255,255,255,0.1)',
                  border: 'none',
                  cursor: input.trim() && !isLoading ? 'pointer' : 'not-allowed',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  transition: 'all 0.2s'
                }}
              >
                ➤
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </>
  );
}
