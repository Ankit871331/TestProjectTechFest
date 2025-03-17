import React, { useState } from 'react';
import styled from 'styled-components';
import screen from "../assets/screenshare.png";
import endcall from "../assets/endcall.png";
import participations from "../assets/participateSVg.svg";
import { useDispatch, useSelector } from 'react-redux';
import {toggle} from "../Features/counter/toggleConnectUsers"

const GroupFeatures = () => {
  const dispatch = useDispatch();

  const isParticipationsActive = useSelector((state) => state.connectedUsers.isToggled);
  console.log("participation",isParticipationsActive)

  const [clickedIcons, setClickedIcons] = useState({
    mic: true,
    polygon: true,
    screen: false,
    participations:false,

  });

  const [isVisible, setIsVisible] = useState(true); // State to manage visibility

  const handleIconClick = (icon) => {

  if(icon === "participations")
  {
    dispatch(toggle())
  }
    setClickedIcons((prevState) => ({
      ...prevState,
      [icon]: !prevState[icon], // Toggle independently
    }));
  };

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev); // Toggle visibility
  };

  return (
    <>

      {isVisible && (
        <StyledBar>
          {/* Mic SVG */}
          <div
            className={`icon-container ${clickedIcons.mic ? 'clicked' : ''}`}
            onClick={() => handleIconClick('mic')}
          >
            <svg
              className={`icon ${clickedIcons.mic ? 'white-icon' : ''}`}
              fill="#00BFFF"
              height="20px"
              width="20px"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <g>
                <g>
                  <path d="m439.5,236c0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,70-64,126.9-142.7,126.9-78.7,0-142.7-56.9-142.7-126.9 0-11.3-9.1-20.4-20.4-20.4s-20.4,9.1-20.4,20.4c0,86.2 71.5,157.4 163.1,166.7v57.5h-23.6c-11.3,0-20.4,9.1-20.4,20.4 0,11.3 9.1,20.4 20.4,20.4h88c11.3,0 20.4-9.1 20.4-20.4 0-11.3-9.1-20.4-20.4-20.4h-23.6v-57.5c91.6-9.3 163.1-80.5 163.1-166.7z" />
                  <path d="m256,323.5c51,0 92.3-41.3 92.3-92.3v-127.9c0-51-41.3-92.3-92.3-92.3s-92.3,41.3-92.3,92.3v127.9c0,51 41.3,92.3 92.3,92.3zm-52.3-220.2c0-28.8 23.5-52.3 52.3-52.3s52.3,23.5 52.3,52.3v127.9c0,28.8-23.5,52.3-52.3,52.3s-52.3-23.5-52.3-52.3v-127.9z" />
                </g>
              </g>
            </svg>
          </div>

        {/* Video call Icons  */}
          <div
            className={`icon-container ${clickedIcons.polygon ? 'clicked' : ''}`}
            onClick={() => handleIconClick('polygon')}
          >
            <svg
              className={`icon ${clickedIcons.polygon ? 'white-icon' : ''}`}
              viewBox="0 0 32 32"
            >
              <polygon
                fill="none"
                stroke={clickedIcons.polygon ? "white" : "#00BFFF"}
                strokeWidth="2"
                points="23,19 23,13 29,10 29,22"
              />
              <rect
                x="3"
                y="9"
                fill="none"
                stroke={clickedIcons.polygon ? "white" : "#00BFFF"}
                strokeWidth="2"
                width="20"
                height="20"
              />
            </svg>
          </div>
           {/* Participations */}
          <div className={`icon-container screen-icon ${clickedIcons.participations ? 'clicked' : ''}`} onClick={() => handleIconClick('participations')}>
            <img src={participations} alt="Screen Share" className="icon participateIcon" />
          </div>


          {/* Screen Image */}
          <div className="icon-container screen-icon" onClick={() => handleIconClick('screen')}>
            <img src={screen} alt="Screen Share" className="icon" />
          </div>

          {/* End Call Icon */}
          <div className="icon-container endcall-icon">
            <img src={endcall} alt="End Call" className="icon" />
          </div>


        </StyledBar>

      )}
    </>
  );
};

const VisibilityToggle = styled.div`
  position: absolute;
  top: 10px;
  left: 10px;
  cursor: pointer;
  z-index: 10;
  color: blue;
  font-size: 16px;
  font-weight: bold;

  @media (max-width: 768px) {
    font-size: 14px;
  }

  @media (max-width: 480px) {
    font-size: 12px;
  }
`;

const StyledBar = styled.div`
  width: 100%;
  background-color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  border-radius: 30px;
  padding: 10px;
  gap: 15px;
  flex-wrap: wrap;

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
    width: 30px;
    height: 30px;
  }
    .participateIcon
    {
     width: 40px;
    height: 40px;
    }

  .icon-container.clicked {
    background-color: #00bfff;
    border-radius: 30%;
    transform: scale(1.1);
  }

  .white-icon {
    fill: white;
  }

  .screen-icon:hover, .endcall-icon:hover {
    background-color: rgba(255, 255, 255, 0.2);

    border-radius: 50%;
    transform: scale(1.1);
  }
  .screen-icon.clicked, .participations.clicked {
    background-color: rgba(255, 255, 255, 0.2);
     border : 2px solid #00bfff;
    border-radius: 50%;
    transform: scale(1.1);
  }

@media (max-width: 768px) {
  .icon-container {
    width: max(40px, 6vw);
    height: max(40px, 6vw);
  }

  .icon {
    width: max(22px, 4vw);
    height: max(22px, 4vw);
  }
}


 @media (max-width: 480px) {
  .icon-container {
    width: max(40px, 7vw);
    height: max(40px, 7vw);
  }

  .icon {
    width: max(25px, 4vw);
    height: max(25px, 4vw);
  }
}

`;

export default GroupFeatures;
