import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserProfile } from './Features/counter/getProfile'; // Import fetchUserProfile


import LoginForm from './Navbar/LoginForm';
import ChatRoom from './AfterJoinGrp/Chatroom';
import Home from './Home/Home';
import TabAnimation from './Navbar/TabAnimation';
import './App.css';

function App() {
  const dispatch = useDispatch();
  const { profile, status, error } = useSelector((state) => state.user);



  // Log the profile when fetched


  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/home" element={<ChatRoom />} />
        <Route path="/form" element={<TabAnimation />} />
      </Routes>
    </Router>
  );
}

export default App;
