import React, { useState } from 'react';
import signIn from "../assets/SignIn.svg";

export default function SlideBar() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSidebar = () => {
    setIsOpen(!isOpen);
  };

  return (
    <>
      {/* Hamburger Menu Button */}
      <button
        className="flex flex-col space-y-1.5 cursor-pointer p-2 hover:bg-gray-800 rounded-md transition-colors"
        onClick={toggleSidebar}
        aria-label="Toggle menu"
      >
        <span className="w-6 h-[3px] bg-white rounded"></span>
        <span className="w-6 h-[3px] bg-white rounded"></span>
        <span className="w-6 h-[3px] bg-white rounded"></span>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full bg-[#131212] text-white z-50 transition-all duration-300 ease-in-out overflow-hidden`}
        style={{
          width: isOpen ? '280px' : '0px',
        }}
      >
        <div className="p-6 h-full flex flex-col min-w-[280px]">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-semibold tracking-tight">Menu</h2>
            <button
              className="bg-red-600 px-3 py-1 rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
              onClick={toggleSidebar}
            >
              Close
            </button>
          </div>

          <ul className="space-y-4 flex-grow">
            <li>
              <a href="#" className="text-lg hover:text-gray-300 transition-colors block">
                Home
              </a>
            </li>
            <li>
              <a href="#" className="text-lg hover:text-gray-300 transition-colors block">
                Profile
              </a>
            </li>
            <li>
              <a href="#" className="text-lg hover:text-gray-300 transition-colors block">
                Settings
              </a>
            </li>
            <li>
              <a href="#" className="text-lg hover:text-gray-300 transition-colors block">
                Logout
              </a>
            </li>
            <li className="flex items-center">
              <img src={signIn} alt="Sign In" className="h-6 w-6 mr-3" />
              <a href="#" className="text-lg hover:text-gray-300 transition-colors">
                Sign In
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}