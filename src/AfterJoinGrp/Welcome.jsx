import React, { useState } from 'react';
import styled from 'styled-components';
import ChatBox from './Chatbox';
import vscodeIcon from '../assets/vscode.svg';
import drawIcon from '../assets/drawing.svg';
import toolsIcon from '../assets/moreTools.svg';
import { Tooltip } from 'react-tooltip';
import 'react-tooltip/dist/react-tooltip.css'; // Import the CSS


const ChatRoom = () => {
  const [isChatBoxVisible, setIsChatBoxVisible] = useState(true);
  const [isVSCodeIconClicked, setIsVSCodeIconClicked] = useState(false);
  const [isDrawIconClicked, setIsDrawIconClicked] = useState(false);
  const [isToolsIconClicked, setIsToolsIconClicked] = useState(false);

  const handleChatIconClick = () => {
    setIsChatBoxVisible(!isChatBoxVisible);
  };

  const handleVSCodeIconClick = () => {
    setIsVSCodeIconClicked(!isVSCodeIconClicked);
  };

  const handleDrawIconClick = () => {
    setIsDrawIconClicked(!isDrawIconClicked);
  };

  const handleToolsIconClick = () => {
    setIsToolsIconClicked(!isToolsIconClicked);
  };

  return (
    <>
      <StyledSidebar>
        <div className={`icon-container ${isChatBoxVisible ? 'clicked' : ''}`} onClick={handleChatIconClick} data-tooltip-id="Chat"
        data-tooltip-content="Chat Box">
          <svg
            className={`icon ${isChatBoxVisible ? 'white-icon' : ''}`}
            width="40px"
            height="40px"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M7 9H17M7 13H12M21 20L17.6757 18.3378C17.4237 18.2118 17.2977 18.1488 17.1656 18.1044C17.0484 18.065 16.9277 18.0365 16.8052 18.0193C16.6672 18 16.5263 18 16.2446 18H6.2C5.07989 18 4.51984 18 4.09202 17.782C3.71569 17.5903 3.40973 17.2843 3.21799 16.908C3 16.4802 3 15.9201 3 14.8V7.2C3 6.07989 3 5.51984 3.21799 5.09202C3.40973 4.71569 3.71569 4.40973 4.09202 4.21799C4.51984 4 5.0799 4 6.2 4H17.8C18.9201 4 19.4802 4 19.908 4.21799C20.2843 4.40973 20.5903 4.71569 20.782 5.09202C21 5.51984 21 6.0799 21 7.2V20Z"
              stroke={isChatBoxVisible ? "white" : "#00BFFF"}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <Tooltip id="Chat" place="left" />
        </div>

        <div className={`icon-container ${isVSCodeIconClicked ? 'vscode-clicked' : ''}`} onClick={handleVSCodeIconClick} data-tooltip-id="vscode"
        data-tooltip-content="Code Editor">
          <img src={vscodeIcon} alt="VSCode" className={`icon ${isVSCodeIconClicked ? 'white-icon' : ''}`} />
        </div>

        <Tooltip id="vscode" place="left" />


        <div className={`icon-container ${isDrawIconClicked ? 'draw-clicked' : ''}`} onClick={handleDrawIconClick} data-tooltip-id="Draw"
        data-tooltip-content="Drawing Box">
          <img src={drawIcon} alt="Draw" className={`icon ${isDrawIconClicked ? 'white-icon' : ''}`} />
        </div>
        <Tooltip id="Draw" place="left" />


        <div className={`icon-container ${isToolsIconClicked ? 'tools-clicked' : ''}`} onClick={handleToolsIconClick} data-tooltip-id="Tools"
        data-tooltip-content="more tools">
          <img src={toolsIcon} alt="Tools" className={`icon ${isToolsIconClicked ? 'white-icon' : ''}`} />
        </div>
        <Tooltip id="Tools" place="left" />
      </StyledSidebar>
      <ChatBox isVisible={isChatBoxVisible} toggleChatBox={handleChatIconClick} />
    </>
  );
};

const StyledSidebar = styled.div`
  width: 80px;
  height: 100vh;
  background-color: #1a1a1a;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 20px;
  gap : 50px;

  .icon-container {
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 60px;
    height: 60px;
  }

  .icon {
    width: 40px;
    height: 40px;
  }

  .icon-container.clicked,
  .icon-container.vscode-clicked,
  .icon-container.draw-clicked,
  .icon-container.tools-clicked {
    background-color: #00BFFF;
    border-radius: 8px;
    width: 60px;
    height: 60px;
  }

  .icon-container.tools-clicked {
    background-color: #00BFFF;
  }

  .white-icon {
    stroke: white;
    filter: brightness(0) invert(1);
  }


`;

export default ChatRoom;
