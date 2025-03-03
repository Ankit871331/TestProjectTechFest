import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ScrollToBottom from "react-scroll-to-bottom";
import { io } from "socket.io-client";
import sendIcon from "../assets/sendicon.png";
import GroupFeatures from "./groupFeatures";
import vscodeicon from "../assets/vscode.svg";

const socket = io(import.meta.env.VITE_SOCKETIO);

const ChatBox = ({ isVisible, toggleChatBox }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [userId, setUserId] = useState(null);
  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const room = "chatRoom";

  // Set up socket connection and message receiving
  useEffect(() => {
    socket.on("connect", () => {
      setUserId(socket.id);
      console.log("Connected with ID:", socket.id);
    });

    socket.emit("joinRoom", room);

    socket.on("message", (message) => {
      console.log("Received message:", message);
      if (message.sender !== userId) {
        setMessages((prevMessages) => [...prevMessages, { ...message, id: Date.now() }]);
      }
    });

    return () => {
      socket.off("connect");
      socket.off("message");
    };
  }, [userId]);

  // Scroll to the latest message automatically
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-adjust the textarea height
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "40px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  // Handle sending a message
  const handleSend = () => {
    if (input.trim() !== "" && userId) {
      const newMessage = { text: input, sender: userId, id: Date.now() };
      console.log("Sending message:", newMessage);
      setMessages((prevMessages) => [...prevMessages, newMessage]);
      socket.emit("sendMessage", { room, message: input, sender: userId });
      setInput("");
      setTimeout(() => adjustTextareaHeight(), 0);
    }
  };

  return (
    <StyledChatBox className={isVisible ? "visible" : ""}>
      <div className="chatbox-header">
        <h2>Chat</h2>
        <button className="close-btn" onClick={toggleChatBox}>
          &times;
        </button>
      </div>
      <ScrollToBottom className="chatbox-content">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender === userId ? "me" : "other"}`}
          >
            {message.text}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollToBottom>
      <div className="chatbox-footer">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => {
            setInput(e.target.value);
            adjustTextareaHeight();
          }}
          onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
          placeholder="Type a message..."
          className="chat-input"
          rows={1}
        />
        <button onClick={handleSend} className="send-btn">
          <img src={sendIcon} alt="Send" />
        </button>
      </div>
      <BottomCenterWrapper>
        {/* <GroupFeatures /> */}
      </BottomCenterWrapper>
    </StyledChatBox>
  );
};

// Styled Components

const BottomCenterWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
`;

const StyledChatBox = styled.div`
  position: fixed;
  top: 0;
  right: -400px;
  width: 350px;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  z-index: 9999; /* High z-index to overlap everything */

  &.visible {
    right: 0;
  }

  /* Large tablets */
  @media (max-width: 1024px) {
    width: 300px;
  }

  /* Tablets and small laptops */
  @media (max-width: 768px) {
    width: 280px;
  }

  /* Fix for 480px and below */
  @media (max-width: 480px) {
    width: 260px; /* Instead of full width, set a fixed width */
    right: -260px; /* Make sure it's hidden initially */

    &.visible {
      right: 0;
    }
  }

  /* Extra small screens */
  @media (max-width: 400px) {
    width: 230px;
    right: -230px;

    &.visible {
      right: 0;
    }
  }

  .chatbox-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    background-color: #00bfff;
  }

  .close-btn {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
  }

  .chatbox-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: 10px;
    overflow-y: auto;
    max-height: calc(100vh - 100px);
  }

  .message {
    padding: 10px;
    margin-bottom: 10px;
    border-radius: 8px;
    width: fit-content;
    max-width: 80%;
    word-wrap: break-word;
  }

  .me {
    background-color: #00bfff;
    color: white;
    align-self: flex-end;
    margin-left: auto;
  }

  .other {
    background-color: #333;
    color: white;
    align-self: flex-start;
    margin-right: auto;
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
    overflow-y: hidden;
    white-space: pre-wrap;
  }

  .send-btn {
    padding: 0;
    border: none;
    background: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    margin-left: 10px;
  }

  .send-btn img {
    width: 24px;
    height: 24px;
  }
`;





export default ChatBox;
