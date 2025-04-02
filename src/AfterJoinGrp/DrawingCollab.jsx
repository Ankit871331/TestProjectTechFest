import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import undoSvg from "../assets/undo.svg";
import redoSvg from "../assets/redo.svg";
import eraser from "../assets/eraser.svg";
import pencile from "../assets/pencil.svg";
import gallery from "../assets/gallery.svg";
import clearCanvasSvg from "../assets/clear_canvas.svg";

const DrawingBoard = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const ydoc = useRef(new Y.Doc());
  const yArray = useRef(null);
  const cursorLabelsRef = useRef({});
  const socketRef = useRef(null);
  const historyRef = useRef({ undo: [], redo: [] });
  const dbRef = useRef(null);
  const modeRef = useRef("pencil");
  const [color, setColor] = useState("#000000");
  const [mode, setMode] = useState("pencil");
  const [isTextEditing, setIsTextEditing] = useState(false);
  const [activeTool, setActiveTool] = useState(null);
    const groupId = useSelector((state) => state.passingGroupId.groupId);
  const { profile } = useSelector((state) => state.user);
  const userName = profile?.user?.name || "Anonymous";
  // const groupId = profile?.user?.groupId
  console.log("profile",profile)
  console.log("groupId",groupId)

  const socket = io(import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:5000", {

    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  useEffect(() => {
    const openDB = () => {
      const request = indexedDB.open("DrawingBoardDB", 2);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains("drawings")) {
          db.createObjectStore("drawings", { keyPath: "id", autoIncrement: true });
        }
        if (!db.objectStoreNames.contains("state")) {
          db.createObjectStore("state", { keyPath: "key" });
        }
        console.log("IndexedDB stores created");
      };

      request.onsuccess = (event) => {
        dbRef.current = event.target.result;
        console.log("IndexedDB opened successfully");
        loadFromIndexedDB();
      };

      request.onerror = (event) => {
        console.error("IndexedDB error:", event.target.error);
      };
    };

    openDB();
  }, []);

  const loadFromIndexedDB = () => {
    if (!dbRef.current || !fabricCanvasRef.current) return;

    const transaction = dbRef.current.transaction(["drawings"], "readonly");
    const store = transaction.objectStore("drawings");
    const request = store.getAll();

    request.onsuccess = (event) => {
      const drawings = event.target.result;
      console.log("Loaded drawings from IndexedDB:", drawings);
      const canvas = fabricCanvasRef.current;
      canvas.clear();
      canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));

      if (drawings.length > 0) {
        drawings.forEach((item) => {
          if (item.type === "path") {
            fabric.Path.fromObject(item.data, (path) => canvas.add(path));
          } else {
            fabric.util.enlivenObjects([item.data], (objects) => {
              objects.forEach((obj) => canvas.add(obj));
            });
          }
        });
      }

      Object.values(cursorLabelsRef.current).forEach((label) => canvas.add(label));
      canvas.renderAll();
    };

    request.onerror = (event) => {
      console.error("Error loading drawings from IndexedDB:", event.target.error);
    };
  };

  const saveToIndexedDB = (type, data) => {
    if (!dbRef.current) return;
    const transaction = dbRef.current.transaction(["drawings"], "readwrite");
    const store = transaction.objectStore("drawings");
    const request = store.add({ type, data });

    request.onsuccess = (event) => {
      console.log(`Saved ${type} to IndexedDB with ID:`, event.target.result);
      data.dbId = event.target.result;
    };

    request.onerror = (event) => {
      console.error("Error saving to IndexedDB:", event.target.error);
    };
  };

  const deleteFromIndexedDB = (dbId) => {
    if (!dbRef.current || !dbId) return;
    const transaction = dbRef.current.transaction(["drawings"], "readwrite");
    const store = transaction.objectStore("drawings");
    const request = store.delete(dbId);

    request.onsuccess = () => {
      console.log(`Deleted object with ID ${dbId} from IndexedDB`);
    };

    request.onerror = (event) => {
      console.error("Error deleting from IndexedDB:", event.target.error);
    };
  };

  const clearIndexedDB = () => {
    if (!dbRef.current) return;

    const transaction = dbRef.current.transaction(["drawings", "state"], "readwrite");
    const drawingStore = transaction.objectStore("drawings");
    const stateStore = transaction.objectStore("state");

    drawingStore.clear().onsuccess = () => console.log("IndexedDB 'drawings' store cleared");
    stateStore.clear().onsuccess = () => console.log("IndexedDB 'state' store cleared");
    transaction.oncomplete = () => console.log("IndexedDB fully cleared");
  };

  useEffect(() => {
    const initializeCanvas = () => {
      if (!window.fabric || !window.fabric.Canvas) {
        console.error("Fabric.js not loaded from CDN. Check index.html script.");
        return;
      }

      const fabric = window.fabric;

      if (!canvasRef.current) {
        console.log("Canvas ref not ready yet, retrying...");
        requestAnimationFrame(initializeCanvas);
        return;
      }

      // Calculate initial dimensions
      const updateCanvasSize = () => {
        const toolbarHeight = 70; // Approximate height of toolbar (50px height + 20px gap)
        const canvasHeight = window.innerHeight - toolbarHeight - 20; // 20px bottom margin
        const canvasWidth = Math.min(window.innerWidth * 0.9, 1200); // 90% of viewport width, max 1200px

        canvasRef.current.width = canvasWidth;
        canvasRef.current.height = canvasHeight;

        if (fabricCanvasRef.current) {
          fabricCanvasRef.current.setWidth(canvasWidth);
          fabricCanvasRef.current.setHeight(canvasHeight);
          fabricCanvasRef.current.renderAll();
          console.log(`Canvas resized to ${canvasWidth}x${canvasHeight}`);
        }
      };

      if (!fabricCanvasRef.current) {
        try {
          const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: modeRef.current === "pencil" && !isTextEditing,
            backgroundColor: "#ffffff",
          });
          fabricCanvasRef.current = canvas;
          updateCanvasSize(); // Set initial size
          canvas.freeDrawingBrush.width = modeRef.current === "eraser" ? 20 : 3;
          canvas.freeDrawingBrush.color = color;
          console.log("Fabric canvas initialized:", canvas);

          canvas.on("object:moving", (e) => {
            const obj = e.target;
            obj.setCoords();
            const bounds = obj.getBoundingRect();
            const canvasWidth = canvas.getWidth();
            const canvasHeight = canvas.getHeight();

            if (bounds.left < 0) obj.left = bounds.width / 2;
            if (bounds.top < 0) obj.top = bounds.height / 2;
            if (bounds.left + bounds.width > canvasWidth) obj.left = canvasWidth - bounds.width / 2;
            if (bounds.top + bounds.height > canvasHeight) obj.top = canvasHeight - bounds.height / 2;
            canvas.renderAll();
          });

          canvas.on("object:modified", (e) => {
            const obj = e.target;
            const updatedData = obj.toJSON();
            socketRef.current.emit("object-update", updatedData, "groupId");
            saveToIndexedDB(obj.type, updatedData);
            console.log("Object modified (moved/resized):", updatedData);
          });

          canvas.on("mouse:move", (event) => {
            const pointer = canvas.getPointer(event.e);
            const cursorData = { x: pointer.x, y: pointer.y, name: userName, socketId: socketRef.current.id };
            socketRef.current.emit("draw-cursor-update", cursorData, "groupId");
          });

          canvas.on("path:created", (event) => {
            if (isTextEditing) return;
            const pathData = event.path.toJSON();
            console.log("Path created:", pathData);
            if (modeRef.current === "eraser") {
              const objects = canvas.getObjects().filter((obj) => obj.selectable && obj.type !== "text");
              objects.forEach((obj) => {
                if (obj.intersectsWithObject(event.path)) {
                  canvas.remove(obj);
                  socketRef.current.emit("erase-update", obj.toJSON(), "groupId");
                  historyRef.current.undo.push({ type: "erase", data: obj.toJSON() });
                  historyRef.current.redo = [];
                  console.log("Erased object:", obj.toJSON());
                }
              });
              canvas.remove(event.path);
            } else {
              yArray.current.push([pathData]);
              historyRef.current.undo.push({ type: "path", data: pathData });
              historyRef.current.redo = [];
              socketRef.current.emit("drawing-update", pathData, "groupId");
              saveToIndexedDB("path", pathData);
            }
            canvas.renderAll();
          });

          canvas.on("mouse:down", (event) => {
            console.log("Mouse down event - Mode:", modeRef.current, "isTextEditing:", isTextEditing);
            const pointer = canvas.getPointer(event.e);
            const target = canvas.findTarget(event.e);

            if (modeRef.current === "text" && !isTextEditing) {
              if (!target) {
                canvas.discardActiveObject();
                const text = new fabric.Textbox("", {
                  left: pointer.x,
                  top: pointer.y,
                  fontSize: 20,
                  fill: color,
                  editable: true,
                  selectable: true,
                  width: 200,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  lockRotation: true,
                  hasControls: true,
                });
                canvas.add(text);
                canvas.setActiveObject(text);
                setIsTextEditing(true);
                canvas.renderAll();
                text.enterEditing();
                console.log("Text box added, editing started");

                text.on("editing:exited", () => {
                  setIsTextEditing(false);
                  const textData = text.toJSON();
                  if (text.text.trim() === "") {
                    canvas.remove(text);
                    if (text.dbId) {
                      deleteFromIndexedDB(text.dbId);
                      socketRef.current.emit("remove-update", textData, "groupId");
                    }
                    console.log("Empty text box removed and deleted from DB");
                  } else {
                    historyRef.current.undo.push({ type: "text", data: textData });
                    historyRef.current.redo = [];
                    socketRef.current.emit("object-update", textData, "groupId");
                    saveToIndexedDB("text", textData);
                    console.log("Text editing exited:", textData);
                  }
                  canvas.renderAll();
                });
              } else if (target.type === "textbox") {
                canvas.setActiveObject(target);
                canvas.renderAll();
                console.log("Selected text box for moving/resizing:", target.text);
              }
            } else if (!target && !isTextEditing) {
              canvas.discardActiveObject();
              canvas.renderAll();
              console.log("Deselected active object");
            }
          });

          canvas.on("mouse:dblclick", (event) => {
            console.log("Double click event - Mode:", modeRef.current, "isTextEditing:", isTextEditing);
            const target = canvas.findTarget(event.e);

            if (target && target.type === "textbox" && !isTextEditing) {
              canvas.setActiveObject(target);
              target.enterEditing();
              setIsTextEditing(true);
              canvas.renderAll();
              console.log("Editing existing text box on double-click:", target.text);

              target.on("editing:exited", () => {
                setIsTextEditing(false);
                const textData = target.toJSON();
                if (target.text.trim() === "") {
                  canvas.remove(target);
                  if (target.dbId) {
                    deleteFromIndexedDB(target.dbId);
                    socketRef.current.emit("remove-update", textData, "groupId");
                  }
                  console.log("Empty text box removed and deleted from DB");
                } else {
                  historyRef.current.undo.push({ type: "text", data: textData });
                  historyRef.current.redo = [];
                  socketRef.current.emit("object-update", textData, "groupId");
                  saveToIndexedDB("text", textData);
                  console.log("Text editing exited:", textData);
                }
                canvas.renderAll();
              });
            }
          });

          // Handle window resize
          window.addEventListener("resize", updateCanvasSize);
        } catch (error) {
          console.error("Error initializing Fabric canvas:", error);
          return;
        }
      }

      socketRef.current = socket;
      yArray.current = ydoc.current.getArray("drawings");
      const canvas = fabricCanvasRef.current;

      socketRef.current.emit("joinDrawRoom", "groupId");
      console.log("Joined room: groupId");

      socketRef.current.on("init-drawings", (data) => {
        console.log("Received initial drawings:", data);
        const drawings = data || [];
        yArray.current.delete(0, yArray.current.length);
        yArray.current.insert(0, drawings);
        canvas.clear();
        canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
        drawings.forEach((pathData) => {
          fabric.Path.fromObject(pathData, (path) => canvas.add(path));
        });
        Object.values(cursorLabelsRef.current).forEach((label) => canvas.add(label));
        canvas.renderAll();
        if (drawings.length > 0) {
          const transaction = dbRef.current.transaction(["drawings"], "readonly");
          const store = transaction.objectStore("drawings");
          store.getAll().onsuccess = (event) => {
            if (event.target.result.length === 0) {
              drawings.forEach((pathData) => saveToIndexedDB("path", pathData));
            }
          };
        }
      });

      socketRef.current.on("drawing-update", (path) => {
        console.log("Received drawing update:", path);
        yArray.current.push([path]);
        fabric.Path.fromObject(path, (newPath) => {
          canvas.add(newPath);
          canvas.renderAll();
        });
        saveToIndexedDB("path", path);
      });

      socketRef.current.on("object-update", (objectData) => {
        console.log("Received object update:", objectData);
        fabric.util.enlivenObjects([objectData], (objects) => {
          objects.forEach((obj) => {
            const existing = canvas.getObjects().find((o) => o.type === obj.type && Math.abs(o.left - obj.left) < 1 && Math.abs(o.top - obj.top) < 1);
            if (!existing) {
              canvas.add(obj);
            } else {
              existing.set(objectData);
            }
            canvas.renderAll();
          });
        });
      });

      socketRef.current.on("erase-update", (objectData) => {
        console.log("Received erase update:", objectData);
        const objects = canvas.getObjects();
        const objToRemove = objects.find((obj) => JSON.stringify(obj.toJSON()) === JSON.stringify(objectData));
        if (objToRemove) {
          canvas.remove(objToRemove);
          canvas.renderAll();
          console.log("Removed erased object:", objectData);
        }
      });

      socketRef.current.on("remove-update", (objectData) => {
        console.log("Received remove update:", objectData);
        const objects = canvas.getObjects();
        const objToRemove = objects.find((obj) => JSON.stringify(obj.toJSON()) === JSON.stringify(objectData));
        if (objToRemove) {
          canvas.remove(objToRemove);
          if (objToRemove.dbId) {
            deleteFromIndexedDB(objToRemove.dbId);
          }
          canvas.renderAll();
          console.log("Removed object from canvas and DB:", objectData);
        }
      });

      socketRef.current.on("undo-update", (action) => {
        console.log("Received undo update:", action);
        if (action.type === "path" || action.type === "text" || action.type === "image") {
          const objects = canvas.getObjects();
          const objToRemove = objects.find((obj) => JSON.stringify(obj.toJSON()) === JSON.stringify(action.data));
          if (objToRemove) {
            canvas.remove(objToRemove);
            canvas.renderAll();
          }
        }
      });

      socketRef.current.on("redo-update", (action) => {
        console.log("Received redo update:", action);
        if (action.type === "path") {
          fabric.Path.fromObject(action.data, (path) => {
            canvas.add(path);
            canvas.renderAll();
          });
        } else if (action.type === "text" || action.type === "image") {
          fabric.util.enlivenObjects([action.data], (objects) => {
            objects.forEach((obj) => canvas.add(obj));
            canvas.renderAll();
          });
        }
      });

      socketRef.current.on("clear-canvas", () => {
        console.log("Received clear canvas command");
        yArray.current.delete(0, yArray.current.length);
        canvas.clear();
        canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
        Object.values(cursorLabelsRef.current).forEach((label) => canvas.add(label));
        historyRef.current.undo = [];
        historyRef.current.redo = [];
        clearIndexedDB();
        canvas.renderAll();
      });

      socketRef.current.on("draw-cursor-update", (cursorData) => {
        console.log("Received cursor update:", cursorData);
        const { x, y, name, socketId } = cursorData;
        if (socketId === socketRef.current.id) return;

        const canvas = fabricCanvasRef.current;
        const clampedX = Math.max(0, Math.min(x, canvas.getWidth()));
        const clampedY = Math.max(20, Math.min(y, canvas.getHeight()));

        if (!cursorLabelsRef.current[socketId]) {
          const label = new fabric.Text(name, {
            left: clampedX,
            top: clampedY - 20,
            fontSize: 20,
            fill: "red",
            backgroundColor: "rgba(255, 255, 255, 0.8)",
            selectable: false,
            evented: false,
            opacity: 1,
          });
          canvas.add(label);
          label.bringToFront();
          cursorLabelsRef.current[socketId] = label;
          console.log(`Added cursor label for ${socketId}: ${name}`);
        } else {
          const label = cursorLabelsRef.current[socketId];
          label.set({ left: clampedX, top: clampedY - 20 });
          label.bringToFront();
          console.log(`Updated cursor label for ${socketId}: ${name}`);
        }
        canvas.renderAll();
      });

      socketRef.current.on("connect", () => {
        console.log("Connected to Socket.IO server with ID:", socketRef.current.id);
      });

      socketRef.current.on("connect_error", (error) => {
        console.error("Socket.IO connection error:", error.message);
      });
    };

    requestAnimationFrame(initializeCanvas);

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
      ydoc.current.destroy();
      if (fabricCanvasRef.current) {
        Object.values(cursorLabelsRef.current).forEach((label) =>
          fabricCanvasRef.current.remove(label)
        );
        cursorLabelsRef.current = {};
        fabricCanvasRef.current.dispose();
        fabricCanvasRef.current = null;
        console.log("Fabric canvas disposed");
      }
      if (dbRef.current) dbRef.current.close();
      window.removeEventListener("resize", () => {}); // Clean up resize listener
    };
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.freeDrawingBrush.color = modeRef.current === "eraser" ? "#ffffff" : color;
      canvas.freeDrawingBrush.width = modeRef.current === "eraser" ? 20 : 3;
      canvas.isDrawingMode = (modeRef.current === "pencil" || modeRef.current === "eraser") && !isTextEditing;

      if (modeRef.current === "eraser" && !isTextEditing) {
        canvas.freeDrawingCursor = "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"8\" stroke=\"black\" stroke-width=\"2\" fill=\"white\"/></svg>') 10 10, auto";
      } else if (modeRef.current === "text" && !isTextEditing) {
        canvas.defaultCursor = "text";
        canvas.freeDrawingCursor = "text";
      } else if (modeRef.current === "pencil" && !isTextEditing) {
        canvas.freeDrawingCursor = "crosshair";
      } else {
        canvas.defaultCursor = "default";
        canvas.freeDrawingCursor = "default";
      }

      canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
      console.log("Brush updated - Mode:", modeRef.current, "Color:", canvas.freeDrawingBrush.color, "Cursor:", canvas.freeDrawingCursor);
      canvas.renderAll();
    }
  }, [color, mode, isTextEditing]);

  const handleUndo = () => {
    if (isTextEditing) return;
    const canvas = fabricCanvasRef.current;
    if (historyRef.current.undo.length > 0) {
      const lastAction = historyRef.current.undo.pop();
      if (lastAction.type === "path" || lastAction.type === "text" || lastAction.type === "image") {
        const objects = canvas.getObjects();
        const objToRemove = objects.find((obj) => JSON.stringify(obj.toJSON()) === JSON.stringify(lastAction.data));
        if (objToRemove) {
          canvas.remove(objToRemove);
          historyRef.current.redo.push(lastAction);
          socketRef.current.emit("undo-update", lastAction, "groupId");
          canvas.renderAll();
          console.log("Undo performed:", lastAction);
        }
      } else if (lastAction.type === "erase") {
        fabric.util.enlivenObjects([lastAction.data], (objects) => {
          objects.forEach((obj) => canvas.add(obj));
          historyRef.current.redo.push(lastAction);
          socketRef.current.emit("redo-update", lastAction, "groupId");
          canvas.renderAll();
          console.log("Undo erase performed:", lastAction);
        });
      }
    }
    setActiveTool(null);
  };

  const handleRedo = () => {
    if (isTextEditing) return;
    const canvas = fabricCanvasRef.current;
    if (historyRef.current.redo.length > 0) {
      const nextAction = historyRef.current.redo.pop();
      if (nextAction.type === "path" || nextAction.type === "image") {
        fabric.Path.fromObject(nextAction.data, (path) => {
          canvas.add(path);
          historyRef.current.undo.push(nextAction);
          socketRef.current.emit("redo-update", nextAction, "groupId");
          canvas.renderAll();
        });
      } else if (nextAction.type === "text") {
        fabric.util.enlivenObjects([nextAction.data], (objects) => {
          objects.forEach((obj) => {
            canvas.add(obj);
            historyRef.current.undo.push(nextAction);
            socketRef.current.emit("redo-update", nextAction, "groupId");
            canvas.renderAll();
          });
        });
      } else if (nextAction.type === "erase") {
        const objToRemove = canvas.getObjects().find((obj) => JSON.stringify(obj.toJSON()) === JSON.stringify(nextAction.data));
        if (objToRemove) {
          canvas.remove(objToRemove);
          historyRef.current.undo.push(nextAction);
          socketRef.current.emit("undo-update", nextAction, "groupId");
          canvas.renderAll();
        }
      }
      console.log("Redo performed:", nextAction);
    }
    setActiveTool(null);
  };

  const handleEraser = () => {
    if (isTextEditing) return;
    const newActiveTool = activeTool === "eraser" ? null : "eraser";
    modeRef.current = newActiveTool === "eraser" ? "eraser" : "default";
    setMode(newActiveTool === "eraser" ? "eraser" : "default");
    setActiveTool(newActiveTool);
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.freeDrawingBrush.width = 20;
      canvas.freeDrawingBrush.color = "#ffffff";
      canvas.isDrawingMode = newActiveTool === "eraser";
      canvas.freeDrawingCursor = newActiveTool === "eraser" ? "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"20\" height=\"20\"><circle cx=\"10\" cy=\"10\" r=\"8\" stroke=\"black\" stroke-width=\"2\" fill=\"white\"/></svg>') 10 10, auto" : "default";
      canvas.renderAll();
      console.log(`Switched to ${newActiveTool === "eraser" ? "eraser" : "default"} mode`);
    }
  };

  const handlePencil = () => {
    if (isTextEditing) return;
    const newActiveTool = activeTool === "pencil" ? null : "pencil";
    modeRef.current = newActiveTool === "pencil" ? "pencil" : "default";
    setMode(newActiveTool === "pencil" ? "pencil" : "default");
    setActiveTool(newActiveTool);
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.freeDrawingBrush.width = 3;
      canvas.freeDrawingBrush.color = color;
      canvas.isDrawingMode = newActiveTool === "pencil";
      canvas.freeDrawingCursor = newActiveTool === "pencil" ? "crosshair" : "default";
      canvas.renderAll();
      console.log(`Switched to ${newActiveTool === "pencil" ? "pencil" : "default"} mode`);
    }
  };

  const handleText = () => {
    if (isTextEditing) {
      console.log("Already in text editing, ignoring click");
      return;
    }
    const newActiveTool = activeTool === "text" ? null : "text";
    modeRef.current = newActiveTool === "text" ? "text" : "default";
    setMode(newActiveTool === "text" ? "text" : "default");
    setActiveTool(newActiveTool);
    if (fabricCanvasRef.current) {
      const canvas = fabricCanvasRef.current;
      canvas.isDrawingMode = false;
      canvas.defaultCursor = newActiveTool === "text" ? "text" : "default";
      canvas.freeDrawingCursor = newActiveTool === "text" ? "text" : "default";
      console.log(`Switched to ${newActiveTool === "text" ? "text" : "default"} mode with I-beam cursor`);
      canvas.renderAll();
    }
  };

  const handleBold = () => {
    if (isTextEditing) return;
    const canvas = fabricCanvasRef.current;
    const activeObject = canvas.getActiveObject();
    if (activeObject && (activeObject.type === "textbox" || activeObject.type === "text")) {
      const isBold = activeObject.fontWeight === "bold";
      activeObject.set("fontWeight", isBold ? "normal" : "bold");
      canvas.renderAll();
      const updatedData = activeObject.toJSON();
      socketRef.current.emit("object-update", updatedData, "groupId");
      saveToIndexedDB("text", updatedData);
      console.log("Toggled bold for text:", updatedData);
    } else {
      console.log("No text object selected for bold");
    }
    const newActiveTool = activeTool === "bold" ? null : "bold";
    setActiveTool(newActiveTool);
  };

  const handleGallery = (event) => {
    if (isTextEditing) return;
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        fabric.Image.fromURL(e.target.result, (img) => {
          img.set({ left: 50, top: 50, scaleX: 0.5, scaleY: 0.5 });
          fabricCanvasRef.current.add(img);
          const imgData = img.toJSON();
          historyRef.current.undo.push({ type: "image", data: imgData });
          historyRef.current.redo = [];
          socketRef.current.emit("object-update", imgData, "groupId");
          saveToIndexedDB("image", imgData);
          fabricCanvasRef.current.renderAll();
          console.log("Image added from gallery:", imgData);
        });
      };
      reader.readAsDataURL(file);
    }
    setActiveTool(null);
  };

  const handleClearCanvas = () => {
    if (isTextEditing) return;
    const canvas = fabricCanvasRef.current;
    yArray.current.delete(0, yArray.current.length);
    canvas.clear();
    canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas));
    Object.values(cursorLabelsRef.current).forEach((label) => {
      canvas.add(label);
      label.bringToFront();
    });
    historyRef.current.undo = [];
    historyRef.current.redo = [];
    socketRef.current.emit("clear-canvas", "groupId");
    clearIndexedDB();
    canvas.renderAll();
    console.log("Canvas and IndexedDB fully cleared");
    setActiveTool(null);
  };

  const getButtonStyle = (tool) => ({
    background: activeTool === tool ? "#00BFFF" : "none",
    border: "none",
    cursor: "pointer",
    padding: "5px",
    borderRadius: "5px",
    transition: "background 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "10px 0" }}>
      <div
        style={{
           // Responsive width
          maxWidth: "1200px", // Maximum width
          height: "50px",
          backgroundColor: "#2C2C2C",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          gap: "15px",
          borderRadius: "10px",
        }}
      >
        <button onClick={handleUndo} style={getButtonStyle("undo")}>
          <img src={undoSvg} alt="Undo" style={{ height: "35px", width: "35px" }} />
        </button>
        <button onClick={handleRedo} style={getButtonStyle("redo")}>
          <img src={redoSvg} alt="Redo" style={{ height: "35px", width: "35px" }} />
        </button>
        <button
          onClick={handleBold}
          style={{
            ...getButtonStyle("bold"),
            color: "white",
            fontSize: "30px",
            fontWeight: 400,
          }}
        >
          B
        </button>
        <button
          onClick={handleText}
          style={{
            ...getButtonStyle("text"),
            color: "white",
            fontSize: "30px",
            fontWeight: 400,
          }}
        >
          T
        </button>
        <button onClick={handleEraser} style={getButtonStyle("eraser")}>
          <img src={eraser} alt="Eraser" style={{ height: "35px", width: "35px" }} />
        </button>
        <button onClick={handlePencil} style={getButtonStyle("pencil")}>
          <img src={pencile} alt="Pencil" style={{ height: "35px", width: "35px" }} />
        </button>
        <label htmlFor="gallery-input" style={{ background: "none", border: "none", cursor: "pointer" }}>
          <img src={gallery} alt="Gallery" style={{ height: "35px", width: "35px" }} />
        </label>
        <input
          id="gallery-input"
          type="file"
          accept="image/*"
          onChange={handleGallery}
          style={{ display: "none" }}
        />
        <button onClick={handleClearCanvas} style={getButtonStyle("clear")}>
        <img src={clearCanvasSvg} alt="Clear Canvas" style={{ height: "35px", width: "35px" }} />
        </button>
        <label style={{ color: "white" }}>Pick Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          style={{ border: "none", background: "none", cursor: "pointer" }}
        />
      </div>
      <canvas
        ref={canvasRef}
        style={{
          border: "1px solid white",
          display: "block",
          width: "90%", // Responsive width
          maxWidth: "1200px", // Maximum width
          height: "calc(100vh - 30px - 20px)", // Full height minus toolbar and bottom margin
        }}
      />
    </div>
  );
};

export default DrawingBoard;