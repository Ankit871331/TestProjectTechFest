import React, { useEffect, useRef, useState } from "react";
import * as Y from "yjs";
import { io } from "socket.io-client";
import { useSelector } from "react-redux";
import undoSvg from "../assets/undo.svg"
import redoSvg from "../assets/redo.svg"
import eraser from "../assets/eraser.svg"
import pencile from "../assets/pencil.svg"
import clearCanvas from "../assets/clear_canvas.svg"

const DrawingBoard = () => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);
  const ydoc = useRef(new Y.Doc());
  const yArray = useRef(null);
  const cursorLabelsRef = useRef({});
  const socketRef = useRef(null);
  const [color, setColor] = useState("#000000");
  const { profile } = useSelector((state) => state.user);
  const userName = profile?.user?.name || "Anonymous";

  const socket = io(import.meta.env.VITE_SERVER_BASE_URL || "http://localhost:5000", {
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

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

      console.log("Canvas ref available:", canvasRef.current);
      console.log("Canvas context:", canvasRef.current.getContext("2d"));

      if (!fabricCanvasRef.current) {
        try {
          const canvas = new fabric.Canvas(canvasRef.current, {
            isDrawingMode: true,
            backgroundColor: "#ffffff", // Explicitly set to white (hex)
          });
          fabricCanvasRef.current = canvas;
          canvas.freeDrawingBrush.width = 3;
          canvas.freeDrawingBrush.color = color;
          console.log("Fabric canvas initialized with background color white:", canvas);
          console.log("Current background color:", canvas.backgroundColor);

          canvas.on("mouse:move", (event) => {
            const pointer = canvas.getPointer(event.e);
            const cursorData = {
              x: pointer.x,
              y: pointer.y,
              name: userName,
              socketId: socketRef.current.id,
            };
            socketRef.current.emit("draw-cursor-update", cursorData, "groupId");
          });
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
        console.log("Received initial drawings for groupId:", data);
        const drawings = data || [];
        yArray.current.delete(0, yArray.current.length);
        yArray.current.insert(0, drawings);
        canvas.clear(); // Clear canvas before loading initial drawings
        canvas.setBackgroundColor("#ffffff", canvas.renderAll.bind(canvas)); // Ensure white background
        drawings.forEach((pathData) => {
          fabric.Path.fromObject(pathData, (path) => {
            canvas.add(path);
          });
        });
        canvas.renderAll();
        console.log("Background color after init-drawings:", canvas.backgroundColor);
      });

      yArray.current.observe(() => {
        console.log("YArray updated for groupId:", yArray.current.toArray());
        const currentPaths = canvas.getObjects().filter((obj) => obj.type === "path");
        const yArrayPaths = yArray.current.toArray();
        if (yArrayPaths.length > currentPaths.length) {
          const newPathData = yArrayPaths[yArrayPaths.length - 1];
          fabric.Path.fromObject(newPathData, (path) => {
            canvas.add(path);
            canvas.renderAll();
          });
        }
      });

      socketRef.current.on("drawing-update", (path) => {
        console.log("Received drawing update for groupId:", path);
        yArray.current.push([path]);
      });

      canvas.on("path:created", (event) => {
        const pathData = event.path.toJSON();
        console.log("Path created for groupId:", pathData);
        yArray.current.push([pathData]);
        socketRef.current.emit("drawing-update", pathData, "groupId");
      });

      socketRef.current.on("draw-cursor-update", (cursorData) => {
        console.log("Received cursor update for groupId:", cursorData);
        const { x, y, name, socketId } = cursorData;

        console.log("Current socket ID:", socketRef.current.id, "Received socketId:", socketId);
        if (socketId === socketRef.current.id) {
          console.log("Skipping own cursor update for socketId:", socketId);
          return;
        }

        const canvas = fabricCanvasRef.current;
        if (!canvas) {
          console.error("Canvas not initialized yet for cursor update");
          return;
        }

        const clampedX = Math.max(0, Math.min(x, 800));
        const clampedY = Math.max(20, Math.min(y, 500));

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
          console.log(`Added cursor label for ${socketId}: ${name} at ${clampedX}, ${clampedY - 20}`);
          console.log("Canvas objects after add:", canvas.getObjects());
        } else {
          const label = cursorLabelsRef.current[socketId];
          label.set({ left: clampedX, top: clampedY - 20 });
          label.bringToFront();
          console.log(`Updated cursor label for ${socketId}: ${name} to ${clampedX}, ${clampedY - 20}`);
        }
        canvas.renderAll();
        console.log("Canvas rendered, objects:", canvas.getObjects());
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
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
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
    };
  }, []);

  useEffect(() => {
    if (fabricCanvasRef.current) {
      fabricCanvasRef.current.freeDrawingBrush.color = color;
      fabricCanvasRef.current.setBackgroundColor("#ffffff", fabricCanvasRef.current.renderAll.bind(fabricCanvasRef.current)); // Ensure white background on color change
      console.log("Brush color updated to:", color, "Background color:", fabricCanvasRef.current.backgroundColor);
      fabricCanvasRef.current.renderAll();
    }
  }, [color]);

  return (
    <div style={{ textAlign: "center" }}>
      <div>
        <label>Pick Color:</label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
        />
      </div>
      <canvas
        ref={canvasRef}
        width={800}
        height={500}
        style={{ border: "1px solid white" }}
      />
    </div>
  );
};

export default DrawingBoard;