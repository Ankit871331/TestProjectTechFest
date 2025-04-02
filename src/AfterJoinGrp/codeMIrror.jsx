import React, { useState, useRef, useEffect } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { useDispatch, useSelector } from "react-redux";
import { fetchGroups } from "../Features/counter/createGroup";
import { fetchUserProfile } from "../Features/counter/getProfile";
import { runCode, stopCode } from "../Features/counter/coderunnerSlice"; // ✅ Import stopCode action
import styled from "styled-components";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Import icons
import { io } from "socket.io-client";



class CustomAwareness {
  constructor(socket) {
    this.socket = socket;
    this.clientId = socket.id || Math.random().toString(36).substring(2); // Fallback client ID
    this.states = new Map();
    this.listeners = [];
    this.localState = {};
  }

  setLocalStateField(field, value) {
    this.localState[field] = value;
    if (this.socket?.connected) {
      this.socket.emit("awareness-update", {
        clientId: this.clientId,
        state: this.localState,
      });
    }
  }

  getLocalState() {
    return this.localState;
  }

  getStates() {
    return this.states;
  }

  on(event, callback) {
    if (event === "change") {
      this.listeners.push(callback);
    }
  }

  off(event, callback) {
    if (event === "change") {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    }
  }

  emitChange() {
    this.listeners.forEach((callback) => callback());
  }

  updateStates(updates) {
    updates.forEach(({ clientId, state }) => {
      if (clientId !== this.clientId) {
        this.states.set(clientId, state);
      }
    });
    this.emitChange();
  }
}

const CodeEditor = () => {
  const socket = io(import.meta.env.VITE_SERVER_BASE_URL);
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const dispatch = useDispatch();
  const { output, isLoading, error } = useSelector((state) => state.codeexecution);
  const [code, setCode] = useState("// Start typing your code here...");
  const ydocRef = useRef(new Y.Doc());
  const awarenessRef = useRef(null);
  const [language, setLanguage] = useState("javascript");
  const socketRef = useRef(null);
  const [isTerminalOpen, setIsTerminalOpen] = useState(true); // State to manage terminal visibility
  const controllerRef = useRef(null); // ✅ Stores AbortController instance
  const [cursors, setCursors] = useState({});
  const handleEditorChange = (value) => setCode(value);
  const { profile } = useSelector((state) => state.user);
  const groupsState = useSelector((state) => state.group);
  const [isEditorReady, setIsEditorReady] = useState(false);
    const groupId = useSelector((state) => state.passingGroupId.groupId);
  // const groupId = profile?.user?.groupId;
  const currentUserId = profile?.user?._id;

  const targetGroup = groupsState?.groups?.find(
    (group) => group._id === groupId
  );
  console.log("targetGroup", targetGroup)
  let participants = targetGroup?.connectedUsers || []; // Fetch connected users of the group


  const userNameFromParticipants = participants.find(
    (participant) => participant._id === currentUserId
  )?.name;
  const userName = "Anonymous";
  const userColor = `hsl(${Math.random() * 360}, 100%, 70%)`; // Random color for each user
  console.log("userName", userName);

  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchUserProfile());
  }, [dispatch]);


  useEffect(() => {
    socketRef.current = socket;

    awarenessRef.current = new CustomAwareness(socketRef.current); // Initialize CustomAwareness
    // Set initial local state for awareness
    awarenessRef.current.setLocalStateField("user", {
      name: userName,
      color: userColor,
    });

    socketRef.current.on("connect", () => {
      console.log("Connected with ID:", socketRef.current.id);
      if (groupId != null) {
        socketRef.current.emit("joinroom", groupId);
        console.log("Emitted joinroom with groupId:", groupId);
      } else {
        console.log("groupId is null");
      }
    });

    socketRef.current.on("reconnect", (attempt) => {
      console.log("Reconnected after attempt:", attempt);
      socketRef.current.emit("joinroom", groupId);
    });

    socketRef.current.on("connect_error", (error) => {
      console.error("Connection error:", error);
    });

    socketRef.current.on("init-doc", (data) => {
      try {
        Y.applyUpdate(ydocRef.current, new Uint8Array(data));
        console.log("Received initial doc for groupId:", groupId);
      } catch (error) {
        console.error("Failed to apply initial document update:", error);
      }
    });

    socketRef.current.on("update-doc", ({ update, userName }) => {
      Y.applyUpdate(ydocRef.current, new Uint8Array(update));
      console.log("Received doc update for groupId:", groupId, "by:", userName);

      if (editorRef.current) {
        const model = editorRef.current.getModel();
        const currentValue = model.getValue();
        const newValue = ydocRef.current.getText("monaco").toString();
        if (currentValue !== newValue) {
          editorRef.current.executeEdits("remote-update", [
            { range: model.getFullModelRange(), text: newValue },
          ]);
        }
      }

    });

    socketRef.current.on("cursor-update", ({ clientId, userName, color, position }) => {
      setCursors((prevCursors) => {
        const newCursors = { ...prevCursors, [clientId]: { name: userName, color, position } };
        console.log("Updated cursors:", newCursors);
        return newCursors;
      });

    });

    socketRef.current.on("awareness-update", (updates) => {
      awarenessRef.current.updateStates([updates]);
      const states = awarenessRef.current.getStates();
      console.log("Awareness states:", states);
      const newCursors = {};
      states.forEach((state, clientId) => {
        if (state.cursor && state.user) {
          newCursors[clientId] = {
            name: state.user.name,
            color: state.user.color,
            position: state.cursor,
          };
        }
      });
      setCursors((prevCursors) => {
        const updatedCursors = { ...prevCursors, ...newCursors };
        console.log("Updated cursors from awareness:", updatedCursors);
        return updatedCursors;
      });
    });

    return () => {
      socketRef.current.disconnect();
      ydocRef.current.destroy();
    };
  }, [groupId]);

  const bindEditor = (editor, monaco) => {
    console.log("bindEditor called with:", { editor: !!editor, monaco: !!monaco });
    console.log("Raw arguments:", { editor, monaco });

    editorRef.current = editor;
    // If monaco is undefined, try to get it from the editor instance or wait for beforeMount
    monacoRef.current = monaco || window.monaco || editorRef.current?.monaco;

    if (!editorRef.current) {
      console.error("Editor instance not provided to bindEditor");
      return;
    }
    if (!monacoRef.current) {
      console.error("Monaco instance not available; decorations will fail");
    }

    const updateDecorations = () => {
      if (!editorRef.current || !monacoRef.current) {
        console.log("Refs not ready in updateDecorations:", {
          editor: !!editorRef.current,
          monaco: !!monacoRef.current,
        });
        return;
      }
      const newDecorations = Object.entries(cursors)
        .filter(([clientId]) => clientId !== socketRef.current.id)
        .map(([clientId, { name, color, position }]) => ({
          range: new monacoRef.current.Range(position.lineNumber, position.column, position.lineNumber, position.column),
          options: {
            className: `cursor-${clientId}`,
            isWholeLine: false,
            afterContentClassName: `cursor-label-${clientId}`,
            hoverMessage: { value: name },
            stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          },
        }));
      console.log("Applying decorations in bindEditor:", newDecorations);
      const appliedDecorations = editorRef.current.deltaDecorations([], newDecorations);
      console.log("Applied decorations IDs in bindEditor:", appliedDecorations);
    };

    if (!editorRef.current.binding) {
      console.log("😁Binding editor to ydoc for socket:", socketRef.current?.id);
      const yText = ydocRef.current.getText("monaco");

      const binding = new MonacoBinding(
        yText,
        editor.getModel(),
        new Set([editor]),
        awarenessRef.current
      );
      editorRef.current.binding = binding;

      editor.onDidChangeCursorPosition((event) => {
        const position = event.position;
        console.log("Cursor moved:", { userName, position });
        awarenessRef.current.setLocalStateField("cursor", {
          lineNumber: position.lineNumber,
          column: position.column,
        });
        if (socketRef.current?.connected) {
          socketRef.current.emit("cursor-update", {
            clientId: socketRef.current.id,
            userName,
            color: userColor,
            position: { lineNumber: position.lineNumber, column: position.column },
          });
        }
      });

      if (monacoRef.current) {
        awarenessRef.current.on("change", updateDecorations);
        editor.onDidChangeModelDecorations(updateDecorations);
        updateDecorations(); // Initial call
      } else {
        console.error("Cannot attach listeners; monacoRef is not set");
      }

      ydocRef.current.on("update", (update) => {
        console.log("😁Yjs update triggered on client:", socketRef.current?.id);
        if (socketRef.current?.connected) {
          socketRef.current.emit("update-doc", { update: Array.from(update), userName });
          console.log("😁Sent update-doc from editor for groupId:", groupId);
        } else {
          console.error("😁Socket not connected, cannot send update-doc");
        }
      });

      return () => {
        binding.destroy();
        awarenessRef.current.off("change", updateDecorations);
        editor.dispose();
      };
    }
  };

  // Optional: Use beforeMount to ensure Monaco is available
  const handleBeforeMount = (monaco) => {
    console.log("beforeMount called with monaco:", monaco);
    if (!monacoRef.current) {
      monacoRef.current = monaco;
      console.log("Monaco set in beforeMount:", monacoRef.current);
    }
  };



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
          onMount={(editor) => {
            bindEditor(editor); // ✅ Bind Monaco Editor properly here
          }}
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
      <style>
        {Object.entries(cursors)
          .map(
            ([clientId, { name, color }]) => `
      .cursor-${clientId} {
        background: ${color} !important;
        width: 2px !important;
        height: 1.2em !important;
        z-index: 1000;
      }
      .cursor-label-${clientId}:after {
        content: "${name}";
        position: absolute;
        top: -25px; /* Adjusted for visibility */
        left: 2px; /* Adjusted to align with cursor */
        font-size: 12px;
        color: white;
        background: ${color};
        padding: 3px 6px;
        border-radius: 4px;
        font-weight: bold;
        white-space: nowrap;
        box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.3);
        z-index: 1001;
      }
    `
          )
          .join("")}
      </style>


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
  @media (max-width: 1222px) {
    width: calc(100vw - 100px);
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
