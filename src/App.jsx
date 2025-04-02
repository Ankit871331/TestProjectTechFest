import React from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomJoin from "./VideoCallFeature.jsx/RoomJoin/RoomJoin";
import { WebRTCProvider } from "./VideoCallFeature.jsx/WebRTCContext/WebRTCContext";
import ChatRoom from './AfterJoinGrp/Chatroom';
import Home from './Home/Home';
import TabAnimation from './Navbar/TabAnimation';
import './App.css';
// import ConnectedUsers from './AfterJoinGrp/connectedUsers';
import DrawingBoard from './AfterJoinGrp/DrawingCollab';
import ScreenShare from './AfterJoinGrp/ScreenShare';

function App() {
  return (
    <Router>

      <WebRTCProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<ChatRoom />} />
          <Route path="/form" element={<TabAnimation />} />
          <Route path="/drawing" element={<DrawingBoard />} />

          <Route path="/screenShare" element={<ScreenShare />} />
        </Routes>
      </WebRTCProvider>
    </Router>
  );
}

export default App;
