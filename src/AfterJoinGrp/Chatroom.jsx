import React, { useState } from "react";
import styled from "styled-components";
import LeftBar from "./leftBar";
import GroupFeatures from "./groupFeatures";
import ConnectedUsers from "./connectedUsers";
import { useDispatch, useSelector } from 'react-redux';

import RoomJoin from "../VideoCallFeature.jsx/RoomJoin/RoomJoin";
import VoiceOnly from "../VideoCallFeature.jsx/RoomJoin/Voice";

export default function Chatroom() {
  const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);

  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <ChatroomContainer>
      {/* Left Sidebar */}
      <LeftBar />


      <CenterContent>
        <RoomJoin />
      </CenterContent>

      {/* Group Features at the bottom with toggle */}
      <BottomCenterWrapper>
        <VisibilityToggle onClick={toggleVisibility}>
          {isVisible ? "Hide" : "Show"}
        </VisibilityToggle>
        {isVisible && <GroupFeatures />}
      </BottomCenterWrapper>
    </ChatroomContainer>
  );
}

// Styled Components
const ChatroomContainer = styled.div`
  display: grid;
  grid-template-columns: 300px auto; /* LeftBar takes 300px, rest is flexible */
  grid-template-rows: auto 100px; /* Bottom bar is 100px */
  height: 100vh;
  overflow: hidden;
`;

const CenterContent = styled.div`
  grid-column: 2; /* Place in the second column */
  grid-row: 1; /* Place in the first row */
  display: flex;
  justify-content: left;
  align-items: center;
  height: calc(100vh - 100px); /* Subtract the height of GroupFeatures */
`;

const BottomCenterWrapper = styled.div`
  grid-column: span 2; /* Span across both columns */
  grid-row: 2; /* Place in the second row */
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  height: 100px; /* Fixed height for GroupFeatures */
  max-width: 80vw; /* Prevent it from expanding too much */
  width: 25%; /* Take the full width within the restriction */
  margin: 0 auto; /* Center it horizontally */
`;



const VisibilityToggle = styled.div`
  position: absolute;
  top: -30px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 10;
  color: #3cb1e2;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;


