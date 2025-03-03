import React, { useState } from 'react';
import styled from 'styled-components';
import LoginForm from './LoginForm';
import RegisterForm from './Register';

const TabAnimation = () => {
  const [activeTab, setActiveTab] = useState('register');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return (
    <StyledWrapper>
      <div className="tab-container">
        <button
          className={`tab tab--1 ${activeTab === 'register' ? 'active' : ''}`}
          onClick={() => handleTabClick('register')}
        >
          Register
        </button>
        <button
          className={`tab tab--2 ${activeTab === 'login' ? 'active' : ''}`}
          onClick={() => handleTabClick('login')}
        >
          Login
        </button>
        <div className={`indicator ${activeTab === 'register' ? 'left' : 'right'}`} />
      </div>
      <div className="form-container">
        {activeTab === 'register' ? (
          <RegisterForm switchToLogin={() => handleTabClick('login')} />
        ) : (
          <LoginForm switchToRegister={() => handleTabClick('register')} />
        )}
      </div>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .tab-container {
    display: flex;
    justify-content: center; /* Center the tabs */
    align-items: flex-start;
    position: relative;
    padding: 2px;
    background-color: black;
    border-radius: 20px;
    margin: 10px auto; /* Center the container */
    max-width: 450px; /* Increase the width of the tab container */
  }

  .indicator {
    content: "";
    width: 50%;
    height: 28px;
    background: #2D2F2B;
    position: absolute;
    top: 2px;
    z-index: 9;
    border: 0.5px solid rgba(0, 0, 0, 0.04);
    box-shadow: 0px 3px 8px rgba(0, 0, 0, 0.12), 0px 3px 1px rgba(0, 0, 0, 0.04);
    border-radius: 7px;
    transition: all 0.2s ease-out;
  }

  .indicator.left {
    left: 2px;
  }

  .indicator.right {
    left: calc(50% - 2px);
  }

  .tab {
    width: 20%; /* Ensure tabs are half of the container's width */
    max-width: 200px; /* Set a maximum width for the tabs */
    height: 28px;
    position: relative;
    z-index: 99;
    background-color: transparent;
    border: 0;
    outline: none;
    flex: none;
    align-self: stretch;
    flex-grow: 1;
    cursor: pointer;
    font-weight: 500;
    text-align: center;
    transition: color 0.2s ease, background-color 0.2s ease;
    border-radius: 20px; /* Add border-radius to the buttons */
  }

  .tab--1:not(.active) {
    color: white;
    background-color: #2D2F2B;
  }

  .tab--2:not(.active) {
    color: white;
    background-color: #2D2F2B;
  }

  .tab.active {
    color: #ffffff;
    font-weight: 700;
    background-color: #00BFFF; /* Set active tab color to #00BFFF */
  }

  .form-container {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }
`;


export default TabAnimation;
