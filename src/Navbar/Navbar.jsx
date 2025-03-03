import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SlideBar from './SlideBar';
import SearchBar from './Search.jsx';
import LoginForm from './LoginForm';
import RegisterForm from './Register';
import signIn from "../assets/SignIn.svg";
import avatar from "../assets/avatarIcon.png";
import cross from "../assets/cross.png";
import { logoutUser } from '../Features/counter/authSlice';

const Navbar = () => {
  const dispatch = useDispatch();
  const { isRegistered, user, isAuthenticated } = useSelector((state) => state.auth);

  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(true);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(!!localStorage.getItem("token"));

  // Handle closing popup when user logs in
  useEffect(() => {
    if (isAuthenticated) {
      setIsUserLoggedIn(true);
      setIsPopupOpen(false); // Close popup only on successful login
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    dispatch(logoutUser());
    localStorage.removeItem("token");
    setIsUserLoggedIn(false);
  };

  return (
    <>
      <nav className="p-4 flex items-center justify-between w-full">
        <div className="flex items-center space-x-4">
          <SlideBar />
          <h1 className="text-xl sm:text-2xl font-bold text-white">TechTalk</h1>
        </div>

        <div className="flex-1 flex justify-center">
          <SearchBar />
        </div>

        <div className="flex items-center space-x-4">
          <img
            src={isUserLoggedIn ? avatar : signIn}
            alt="User Icon"
            onClick={() => setIsPopupOpen(!isPopupOpen)}
            className="cursor-pointer w-10 h-10 rounded-full object-cover"
          />
          {isUserLoggedIn && (
            <button onClick={handleLogout} className="text-white bg-red-500 px-4 py-2 rounded">
              Logout
            </button>
          )}
        </div>
      </nav>

      {isPopupOpen && <div className="fixed inset-0 bg-black opacity-70 z-40"></div>}

      <div className={`fixed inset-0 flex items-center justify-center z-50 transition-transform duration-300 ease-in-out transform ${isPopupOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0'}`}>
        <div className="p-4 rounded-lg shadow-lg relative">
          {isRegister ? (
            <RegisterForm switchToLogin={() => setIsRegister(false)} />
          ) : (
            <LoginForm switchToRegister={() => setIsRegister(true)} />
          )}
          <img src={cross} alt="Close" onClick={() => setIsPopupOpen(false)} className="absolute top-2 right-2 cursor-pointer w-6 h-6" />
        </div>
      </div>
    </>
  );
};

export default Navbar;
