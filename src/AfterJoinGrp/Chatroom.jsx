import React, { useState } from "react";
import styled from "styled-components";
import LeftBar from "./leftBar";
import GroupFeatures from "./groupFeatures";
import { useSelector } from "react-redux";
import RoomJoin from "../VideoCallFeature.jsx/RoomJoin/RoomJoin";
import ScreenShare from "./ScreenShare";

export default function Chatroom() {
  const isscreen = useSelector((state) => state.connectedUsers.isScreenOff);
  const isSharingScreen = useSelector((state) => state.connectedUsers.isSharingScreen);
  console.log("isSharingScreen1", isSharingScreen);

  const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);

  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  return (
    <ChatroomContainer>
      {/* Left Sidebar */}
      <LeftBar />

      {/* Center Content */}
      <CenterContent>
        {isParticipationsActive && <RoomJoin />}
      </CenterContent>

      <ScreenShareWrapper>
        <ScreenShare />
    </ScreenShareWrapper>

      {/* Screen Share */}

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
    grid-template-rows: auto 100px; /* Main content | Bottom bar */
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

const ScreenShareWrapper = styled.div`
    position: fixed; /* Ensures it stays independent */
    top: 20px; /* Adjust this value based on navbar height */
    left: 40%;
    transform: translateX(-50%); /* Center horizontally */
    z-index: 50; /* Ensure it's above content but below the navbar */
    width: auto; /* Dynamic width */
    height: auto; /* Dynamic height */
    max-width: 90vw; /* Prevent stretching */
    max-height: 80vh; /* Ensure it doesn't take full screen */
    // background: rgba(0, 0, 0, 0.8); /* Slight background for visibility */
    border-radius: 10px;
    padding: 10px;
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