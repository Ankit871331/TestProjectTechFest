import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { loginUser } from '../Features/counter/authSlice';
import { fetchUserProfile } from '../Features/counter/getProfile'; // Updated import path

const LoginForm = ({ goToRegister }) => {
  const dispatch = useDispatch();
  const { authStatus, error, isAuthenticated } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user); // Updated to use the profile slice

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  // Send email to profile API when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchUserProfile(formData.email));
    }
  }, [isAuthenticated, dispatch, formData.email]);

  // Console log the profile once fetched
  useEffect(() => {
    if (profile) {
      console.log('User Profile:', profile);
    }
  }, [profile]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(loginUser(formData));
  };

  return (
    <StyledWrapper>
      <form className="form" onSubmit={handleSubmit}>
        <p className="title">Log In</p>
        <p className="message">Login now and get full access to our app.</p>

        {error && <p className="error-message">{error}</p>}

        <label>
          <input
            className="input"
            type="email"
            name="email"
            placeholder=" "
            value={formData.email}
            onChange={handleChange}
            required
          />
          <span>Email</span>
        </label>

        <label>
          <input
            className="input"
            type="password"
            name="password"
            placeholder=" "
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span>Password</span>
        </label>

        <button className="submit" type="submit" disabled={authStatus === 'loading'}>
          {authStatus === 'loading' ? 'Logging in...' : 'Submit'}
        </button>

        <p className="signin">
          Don't have an account? <a href="#" onClick={goToRegister}>Signup</a>
        </p>
      </form>
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .form {
    display: flex;
    flex-direction: column;
    gap: 10px;
    max-width: 350px;
    padding: 20px;
    border-radius: 20px;
    position: relative;
    background-color: #1a1a1a;
    color: #fff;
    border: 1px solid #333;
  }

  .title {
    font-size: 28px;
    font-weight: 600;
    letter-spacing: -1px;
    position: relative;
    display: flex;
    align-items: center;
    padding-left: 30px;
    color: #00bfff;
  }

  .message,
  .signin {
    font-size: 14.5px;
    color: rgba(255, 255, 255, 0.7);
  }

  .signin {
    text-align: center;
  }

  .signin a {
    color: #00bfff;
  }

  .signin a:hover {
    text-decoration: underline royalblue;
  }

  .error-message {
    color: red;
    font-size: 14px;
    text-align: center;
  }

  .form label {
    position: relative;
  }

  .form label .input {
    background-color: #333;
    color: #fff;
    width: 100%;
    padding: 20px 5px 5px 10px;
    outline: 0;
    border: 1px solid rgba(105, 105, 105, 0.397);
    border-radius: 10px;
  }

  .form label .input + span {
    color: rgba(255, 255, 255, 0.5);
    position: absolute;
    left: 10px;
    bottom: 15px;
    font-size: 0.9em;
    cursor: text;
    transition: all 0.3s ease;
  }

  .form label .input:focus + span,
  .form label .input:valid + span {
    color: #00bfff;
    bottom: 30px;
    font-size: 0.7em;
    font-weight: 600;
  }

  .submit {
    border: none;
    outline: none;
    padding: 10px;
    border-radius: 10px;
    color: #fff;
    font-size: 16px;
    transition: .3s ease;
    background-color: #00bfff;
    cursor: pointer;
  }

  .submit:hover {
    background-color: #00bfff96;
  }

  .submit:disabled {
    background-color: grey;
    cursor: not-allowed;
  }
`;

export default LoginForm;
