import React, { useState, useEffect } from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

const CodeSender = () => {
  const [activeTab, setActiveTab] = useState("sending");
  const [codeInput, setCodeInput] = useState("");
  const [receivedCode, setReceivedCode] = useState("");

  // Check backdrop-filter support (for debugging)
  useEffect(() => {
    const supportsBackdropFilter = CSS.supports("backdrop-filter", "blur(5px)");
    console.log("Backdrop-filter supported:", supportsBackdropFilter);
  }, []);

  const handleSend = () => {
    if (codeInput.trim()) {
      console.log("Sending code:", codeInput);
      setReceivedCode(codeInput);
      setCodeInput("");
    }
  };

  const handleCopy = () => {
    if (receivedCode) {
      navigator.clipboard.writeText(receivedCode).then(
        () => console.log("Code copied to clipboard!"),
        (err) => console.error("Failed to copy code:", err)
      );
    }
  };

  return (
    <Wrapper>
      {/* Blurred Background Workaround */}
      <BlurredBackground
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.8 }}
        transition={{ duration: 0.5 }}
      />

      {/* Overlay (Opacity Only) */}
      <Overlay
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 0.5 }}
      />

      {/* Popup Container */}
      <PopupContainer
        initial={{ y: "-100%", opacity: 0 }}
        animate={{ y: "10%", opacity: 0.9 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <TabContainer>
          <Tab
            active={activeTab === "sending"}
            onClick={() => setActiveTab("sending")}
          >
            Sending
          </Tab>
          <Tab
            active={activeTab === "receiving"}
            onClick={() => setActiveTab("receiving")}
          >
            Receiving
          </Tab>
        </TabContainer>

        <Content>
          {activeTab === "sending" && (
            <SendingSection>
              <Textarea
                value={codeInput}
                onChange={(e) => setCodeInput(e.target.value)}
                placeholder="Type your code here..."
              />
              <SyntaxHighlighter
                language="javascript"
                style={vscDarkPlus}
                customStyle={{
                  margin: "10px 0",
                  padding: "10px",
                  borderRadius: "4px",
                  background: "#222",
                  minHeight: "100px",
                  maxHeight: "300px",
                  overflowY: "auto",
                }}
              >
                {codeInput || "// Start typing your code..."}
              </SyntaxHighlighter>
              <SendButton onClick={handleSend}>Send</SendButton>
            </SendingSection>
          )}

          {activeTab === "receiving" && (
            <ReceivingSection>
              <SyntaxHighlighter
                language="javascript"
                style={vscDarkPlus}
                customStyle={{
                  margin: "10px 0",
                  padding: "10px",
                  borderRadius: "4px",
                  background: "#222",
                  minHeight: "100px",
                  maxHeight: "300px",
                  overflowY: "auto",
                  width: "100%",
                }}
              >
                {receivedCode || "// No code received yet..."}
              </SyntaxHighlighter>
              <CopyButton onClick={handleCopy} disabled={!receivedCode}>
                Copy
              </CopyButton>
            </ReceivingSection>
          )}
        </Content>
      </PopupContainer>
    </Wrapper>
  );
};

// Styled Components
const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  z-index: 998;
`;

const BlurredBackground = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: url("https://via.placeholder.com/1920x1080.png?text=Gradient+Background") no-repeat center center;
  background-size: cover;
  filter: blur(5px);
  z-index: 998;
`;

const Overlay = styled(motion.div)`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5); /* Dark overlay */
  backdrop-filter: blur(10px); /* Apply background blur */
  z-index: 999;
`;


const PopupContainer = styled(motion.div)`
  position: relative;
  width: 100%;
  max-width: 600px;
  background-color: #2d2f2b;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
  z-index: 1000;
  overflow: hidden;
`;

const TabContainer = styled.div`
  display: flex;
  border-bottom: 2px solid #444;
  width: 100%;
`;

const Tab = styled.button`
  flex: 1;
  padding: 10px;
  background-color: ${(props) => (props.active ? "#444" : "#333")};
  color: white;
  border: none;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.2s;

  &:hover {
    background-color: #555;
  }
`;

const Content = styled.div`
  padding: 20px;
  width: 100%;
`;

const SendingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ReceivingSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: flex-end;
`;

const Textarea = styled.textarea`
  width: 100%;
  min-height: 100px;
  padding: 10px;
  background-color: #333;
  color: white;
  border: none;
  border-radius: 4px;
  resize: vertical;
  font-family: "Courier New", Courier, monospace;
  font-size: 14px;

  &::placeholder {
    color: #aaa;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 4px #00bfff;
  }
`;

const SendButton = styled.button`
  padding: 8px 16px;
  background-color: #00bfff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  align-self: flex-end;
  transition: background-color 0.2s;

  &:hover {
    background-color: #0099cc;
  }
`;

const CopyButton = styled.button`
  padding: 8px 16px;
  background-color: ${(props) => (props.disabled ? "#666" : "#00bfff")};
  color: white;
  border: none;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? "not-allowed" : "pointer")};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${(props) => (props.disabled ? "#666" : "#0099cc")};
  }
`;

export default CodeSender;