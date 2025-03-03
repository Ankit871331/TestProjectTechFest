import React, { useState } from 'react';
import signIn from "../assets/SignIn.svg";

export default function SlideBar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      <div className="flex flex-col space-y-1 cursor-pointer" onClick={toggleSidebar}>
        <div className="w-6 h-[3px] bg-white"></div>
        <div className="w-6 h-[3px] bg-white"></div>
        <div className="w-6 h-[3px] bg-white"></div>
      </div>

      <div
        className={`fixed top-0 left-0 h-full bg-gray-900 text-white p-6 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0 w-3/4 sm:w-1/2 md:w-1/3' : '-translate-x-full w-full'
        }`}
      >
        <button
          className="bg-red-500 px-4 py-2 rounded mb-4"
          onClick={toggleSidebar}
        >
          Close
        </button>
        <ul>
          <li className="mb-2">Home</li>
          <li className="mb-2">Profile</li>
          <li className="mb-2">Settings</li>
          <li className="mb-2">Logout</li>
          <li className="mb-2 flex items-center">
            <img src={signIn} alt="Sign In" className="h-8 w-8 mr-2" />
            <span>Sign In</span>
          </li>
        </ul>
      </div>
    </>
  );
}
