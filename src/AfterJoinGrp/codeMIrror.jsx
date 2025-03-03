import React, { useState, useRef } from "react";
import Editor from "@monaco-editor/react";
import { useDispatch, useSelector } from "react-redux";
import { runCode, stopCode } from "../Features/counter/coderunnerSlice"; // ✅ Import stopCode action
import styled from "styled-components";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Import icons

const CodeEditor = () => {
  const dispatch = useDispatch();
  const { output, isLoading, error } = useSelector((state) => state.codeexecution);

  const [code, setCode] = useState("// Start typing your code here...");
  const [language, setLanguage] = useState("javascript");
  const [isTerminalOpen, setIsTerminalOpen] = useState(true); // State to manage terminal visibility
  const controllerRef = useRef(null); // ✅ Stores AbortController instance

  const handleEditorChange = (value) => setCode(value);

  const handleLanguageChange = (event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);

    // ✅ Reset code only for non-script languages (Java & C++)
    if (["java", "cpp"].includes(newLanguage)) {
      setCode("");
    }
  };

  const handleRunCode = () => {
    console.log("Executing:", { language, code });

    // Create a new AbortController for request cancellation
    controllerRef.current = new AbortController();
    dispatch(runCode({ language, code, signal: controllerRef.current.signal }));
  };

  const handleStopCode = () => {
    if (controllerRef.current) {
      controllerRef.current.abort(); // ✅ Abort request
      dispatch(stopCode()); // ✅ Dispatch Redux action to reset state
      console.log("Execution Stopped!");
    }
  };

  const toggleTerminal = () => {
    setIsTerminalOpen((prev) => !prev); // Correctly update the state
  };

  return (
    <EditorContainer>
      {/* Toolbar with Language Selector & Run/Stop Buttons */}
      <Toolbar>
        <select value={language} onChange={handleLanguageChange}>
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="cpp">C++</option>
          <option value="java">Java</option>
          <option value="c">C</option>
        </select>
        <div>
          <button onClick={handleRunCode} disabled={isLoading}>
            {isLoading ? "Running..." : "Run"}
          </button>
          <button onClick={handleStopCode} disabled={!isLoading} className="stop">
            Stop
          </button>
        </div>
      </Toolbar>

      {/* Code Editor */}
      <EditorWrapper>
        <Editor
          width="100%"
          height="100%"
          language={language}
          value={code}
          theme="vs-dark"
          options={{
            fontSize: 14,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
          }}
          onChange={handleEditorChange}
        />
      </EditorWrapper>

      {/* Terminal Section */}
      <TerminalContainer>
        <TerminalHeader onClick={toggleTerminal}>
          <h4>Terminal</h4>
          {isTerminalOpen ? <FaChevronUp /> : <FaChevronDown />}
        </TerminalHeader>
        {isTerminalOpen && (
          <TerminalContent>
            <TerminalOutput>
              {isLoading ? "Executing..." : error ? `❌ Error: ${error}` : output || "No output"}
            </TerminalOutput>
          </TerminalContent>
        )}
      </TerminalContainer>
    </EditorContainer>
  );
};

// Styled Components (modified and added)
const EditorContainer = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  right: 10px;
  bottom: 10px;
  width: 92vw;
  height: calc(100vh - 30px);
  background: #1e1e1e;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
  padding: 10px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  @media (max-width: 768px) {
    width: calc(100vw - 20px);
    height: 100vh;
  }
`;

const Toolbar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #333;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 10px;

  select {
    padding: 5px;
    background: #222;
    color: white;
    border: none;
    font-size: 14px;
    cursor: pointer;
  }

  button {
    padding: 5px 10px;
    margin-left: 10px;
    background: #4caf50;
    color: white;
    border: none;
    cursor: pointer;
    border-radius: 5px;
  }

  .stop {
    background: #ff4444; /* Red color for stop button */
  }
`;

const EditorWrapper = styled.div`
  flex: 1;
  background: #252525;
  border-radius: 5px;
`;

const TerminalContainer = styled.div`
  width: 100%;
  max-height: 400px; /* Ensure the parent has a max height */
  overflow-y: auto; /* Enable scrolling */
  background: #1e1e1e;
  border-radius: 5px;
  padding: 10px;
`;

const TerminalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: black;
  color : white;
  padding: 10px;
  border-radius: 5px;
  cursor: pointer;
`;

const TerminalContent = styled.div`
  padding: 10px;
`;

const TerminalOutput = styled.pre`
  font-size: 14px;
  white-space: pre-wrap;
  word-wrap: break-word;
  background: black;
  color: white;
  padding: 10px;
  border-radius: 5px;
  max-height: 400px; /* Limit height */
  overflow-y: auto; /* Enable vertical scrolling */
  display: block; /* Ensure it's a block element */
`;



export default CodeEditor;
