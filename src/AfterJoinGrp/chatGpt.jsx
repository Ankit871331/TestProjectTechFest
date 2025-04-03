import React, { useState, useRef, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import styled from "styled-components";
import sendIcon from "../assets/sendicon.png";
import { fetchChatGptResponse } from "../Features/counter/chatGpt";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const ChatGptBox = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [copiedStates, setCopiedStates] = useState({});
  const textareaRef = useRef(null);

  const dispatch = useDispatch();
  const { response, loading, error } = useSelector((state) => state.chatGpt);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "40px";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  // Typing effect for assistant messages
  useEffect(() => {
    if (isTyping && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.role === "assistant" && lastMessage.typing) {
        const fullText = lastMessage.content;
        let currentIndex = typingText.length;

        const typingSpeed = 50;
        const timer = setInterval(() => {
          if (currentIndex < fullText.length) {
            setTypingText(fullText.slice(0, currentIndex + 1));
            currentIndex++;
          } else {
            clearInterval(timer);
            setIsTyping(false);
            setMessages((prev) =>
              prev.map((msg, idx) =>
                idx === prev.length - 1 ? { ...msg, typing: false } : msg
              )
            );
            setTypingText("");
          }
        }, typingSpeed);

        return () => clearInterval(timer);
      }
    }
  }, [isTyping, messages, typingText]);

  // Handle new response from Redux store
  useEffect(() => {
    if (!loading && response && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (
        lastMessage.role === "user" &&
        !messages.some((msg) => msg.content === response && msg.role === "assistant")
      ) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: response, typing: true },
        ]);
        setIsTyping(true);
        setTypingText("");
      }
    }
  }, [response, loading, messages]);

  const handleSend = () => {
    if (input.trim()) {
      const newMessages = [...messages, { role: "user", content: input }];
      setMessages(newMessages);
      setInput("");
      dispatch(fetchChatGptResponse(input));
    }
  };

  const copyToClipboard = (text, codeBlockKey) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setCopiedStates((prev) => ({ ...prev, [codeBlockKey]: true }));
        setTimeout(() => {
          setCopiedStates((prev) => ({ ...prev, [codeBlockKey]: false }));
        }, 2000);
      },
      (err) => console.error("Failed to copy code:", err)
    );
  };

  const renderMessageContent = (msg) => {
    if (msg.role === "assistant" && msg.typing) {
      return (
        <>
          {typingText}
          <TypingIndicator />
        </>
      );
    }

    const content = msg.content;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)(```|$)/g;
    let lastIndex = 0;
    const elements = [];
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const startIndex = match.index;
      if (startIndex > lastIndex) {
        elements.push(content.slice(lastIndex, startIndex));
      }

      const language = match[1] || "text";
      const codeContent = match[2].trim();
      const codeBlockKey = `${msg.role}-${startIndex}`;
      const isCopied = copiedStates[codeBlockKey] || false;

      elements.push(
        <CodeBlock key={codeBlockKey}>
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: "10px",
              borderRadius: "4px",
              background: "#222",
            }}
            showLineNumbers={false}
          >
            {codeContent}
          </SyntaxHighlighter>
          <CopyButton onClick={() => copyToClipboard(codeContent, codeBlockKey)}>
            {isCopied ? "Copied" : "Copy"}
          </CopyButton>
        </CodeBlock>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      elements.push(content.slice(lastIndex));
    }

    return elements.length > 0 ? elements : content;
  };

  return (
    <StyledChatBox>
      <ChatContent>
        <div className="chatbox-header">
          <h2>peerBot</h2>
          <button className="close-btn">×</button>
        </div>
        <div className="chatbox-content">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.role}`}>
              {renderMessageContent(msg)}
            </div>
          ))}
          {loading && <div className="message assistant">Thinking...</div>}
          {error && <div className="message assistant error">Error: {error}</div>}
        </div>
        <div className="chatbox-footer">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask Grok anything..."
            className="chat-input"
            rows={1}
          />
          <button onClick={handleSend} className="send-btn" disabled={loading}>
            <img src={sendIcon} alt="Send" />
          </button>
        </div>
      </ChatContent>
    </StyledChatBox>
  );
};

const TypingIndicator = () => (
  <span className="typing-indicator">...</span>
);

const CodeBlock = styled.div`
  position: relative;
  margin: 5px 0;
  width: 100%;
`;

const CopyButton = styled.button`
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 2px 8px;
  background-color: #00bfff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0099cc;
  }
`;

const StyledChatBox = styled.div`
  position: fixed;
  right: 0;
  width: 300px;
  height: 99vh;
  z-index: 9999;
`;

const ChatContent = styled.div`
  width: 300px;
  height: 99vh;
  background-color: #1a1a1a;
  color: white;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  animation: slideInFromRight 0.3s ease-in-out forwards;

  @keyframes slideInFromRight {
    from {
      transform: translateX(100%);
    }
    to {
      transform: translateX(0);
    }
  }

  .chatbox-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #0a0a0a;
  }

  .chatbox-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: bold;
    color: #00bfff;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 20px;
    cursor: pointer;
    transition: color 0.2s;
  }

  .close-btn:hover {
    color: #ff4444;
  }

  .chatbox-content {
    flex: 1;
    padding: 10px;
    display: flex;
    flex-direction: column;
    background-color: #1a1a1a;
    /* Removed overflow-y: auto to disable scrolling */
  }

  .message {
    padding: 8px 12px;
    margin-bottom: 10px;
    border-radius: 8px;
    flex-direction: column;
    width: fit-content;
    max-width: 80%;
    word-wrap: break-word;
    font-size: 14px;
    display: flex;
    align-items: center;
  }

  .user {
    background-color: #00bfff;
    align-self: flex-end;
  }

  .assistant {
    background-color: #333;
    align-self: flex-start;
  }

  .error {
    background-color: #ff4444;
    color: white;
  }

  .typing-indicator {
    margin-left: 5px;
    color: #aaa;
    animation: blink 1s infinite;
  }

  @keyframes blink {
    0% { opacity: 0.2; }
    50% { opacity: 1; }
    100% { opacity: 0.2; }
  }

  .chatbox-footer {
    display: flex;
    padding: 10px;
    background-color: #333;
    align-items: center;
  }

  .chat-input {
    flex: 1;
    padding: 10px;
    border: none;
    border-radius: 4px;
    outline: none;
    resize: none;
    min-height: 40px;
    max-height: 120px;
    background-color: #444;
    color: white;
    overflow-y: hidden; /* Disable scrollbar in textarea */
  }

  .chat-input::placeholder {
    color: #aaa;
  }

  .send-btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-left: 10px;
    opacity: ${(props) => (props.disabled ? 0.5 : 1)};
    pointer-events: ${(props) => (props.disabled ? "none" : "auto")};
  }

  .send-btn img {
    width: 24px;
    height: 24px;
    filter: brightness(1.5);
  }

  .send-btn:hover img {
    filter: brightness(2);
  }
`;

export default ChatGptBox;