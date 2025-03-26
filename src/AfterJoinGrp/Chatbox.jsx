import React, { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserProfile } from "../Features/counter/getProfile";
import styled from "styled-components";
import ScrollToBottom, { useScrollToBottom } from "react-scroll-to-bottom";
import { io } from "socket.io-client";
import sendIcon from "../assets/sendicon.png";

const socket = io(import.meta.env.VITE_SERVER_BASE_URL);

const ChatBox = ({ isVisible, toggleChatBox }) => {
  const scrollToBottom = useScrollToBottom();
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const groupId = profile?.user?.groupId;
  const senderName = profile?.user?.name;
  const user_id = profile?.user?._id;


  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    if (groupId) {
      socket.emit("joinRoom", {groupId,user_id});
      console.log(`📢 Joined room: ${groupId}`);

      // Listen for messages broadcasted by the server
      socket.on("receiveGroupMessage", (message) => {
        console.log("📩 Received message:", message);
        setMessages((prev) => [...prev, message]);
      });

      return () => {
        socket.off("receiveGroupMessage");
      };
    }
  }, [groupId]);

  useEffect(() => {
    scrollToBottom({ behavior: "smooth" });
  }, [messages]);

  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "40px";
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  };

  const handleSend = () => {
    if (input.trim() && groupId && senderName) {
      const messageData = {
        user_id :user_id ,
        groupId,
        sender: senderName,
        message: input,
        time: new Date().toISOString(),
      };

      // Send the message to the server
      socket.emit("sendGroupMessage", messageData);

      // Clear the input without appending the message locally
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
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.user_id  === user_id ? "me" : "other"}`}
          >
            {message.user_id !== user_id && (
              <div className="sender-name">{message.sender}</div>
            )}
            {message.message}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </ScrollToBottom>
      <div className="chatbox-footer " >
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
  width: 300px;
  height: 100vh;
  background-color: #1a1a1a;
  color: white;
  transition: right 0.3s ease-in-out;
  display: flex;
  flex-direction: column;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.5);
  z-index: 99999; /* Ensure the chatbox appears above everything */

  &.visible {
    right: 0;
  }

  @media (max-width: 600px) {
    width: 100%;
    right: -100%;
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
