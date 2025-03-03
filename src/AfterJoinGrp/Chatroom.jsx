import React, { useState } from "react";
import LeftBar from "./leftBar";
import GroupFeatures from "./groupFeatures";
import styled from "styled-components";

export default function Chatroom() {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev); // Toggle visibility
  };

  return (
    <ChatroomContainer>
      <LeftBar />
      <BottomCenterWrapper>
        <VisibilityToggle onClick={toggleVisibility}>
          {isVisible ? 'Hide' : 'Show'}
        </VisibilityToggle>
        {isVisible && <GroupFeatures />}
      </BottomCenterWrapper>
    </ChatroomContainer>
  );
}

// Styled Components
const ChatroomContainer = styled.div`
  display: flex;
  height: 100vh; /* Ensure it takes full viewport height */
  overflow: hidden;
  position: relative;
`;

const BottomCenterWrapper = styled.div`
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000; /* Ensure it stays above other elements */

  padding: 10px;
  border-radius: 8px;
`;

const VisibilityToggle = styled.div`
  position: absolute;
  top: -30px; /* Position it above the GroupFeatures component */
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
  z-index: 10;
  color: #3cb1e2;
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 20px; /* Add margin-bottom to create separation */

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;
