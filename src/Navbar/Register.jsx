import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { registerUser } from '../Features/counter/authSlice';
import { fetchUserProfile } from '../Features/counter/getProfile'; // Import profile fetch action
import styled from 'styled-components';
import LoginForm from './LoginForm';

const RegisterForm = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const dispatch = useDispatch();
  const { loading, error, isRegistered } = useSelector((state) => state.auth);
  const { profile } = useSelector((state) => state.user); // Fetch user profile from Redux state

  useEffect(() => {
    if (isRegistered && formData.email) {
      dispatch(fetchUserProfile(formData.email)); // Fetch user profile after successful registration
    }
  }, [isRegistered, dispatch, formData.email]);



  if (showLogin) {
    return <LoginForm goToRegister={() => setShowLogin(false)} />;
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    dispatch(registerUser({
      name: formData.name,
      email: formData.email,
      password: formData.password
    })).then((action) => {
      if (action.payload) {
        console.log('API Response:', action.payload);
        localStorage.setItem('token', action.payload.token); // Store token
        dispatch(fetchUserProfile(formData.email)); // Fetch user profile after registration
      } else {
        console.error('Registration Failed:', action.error.message);
      }
    });
  };

  return (
    <StyledWrapper>
      <form className="form" onSubmit={handleSubmit}>
        <p className="title">Register</p>
        <p className="message">Signup now and get full access to our app.</p>

        {error && <p className="error">{error}</p>}

        <div className="flex">
          <label>
            <input
              className="input"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
            <span>Full Name</span>
          </label>
        </div>

        <label>
          <input
            className="input"
            type="email"
            name="email"
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
            value={formData.password}
            onChange={handleChange}
            required
          />
          <span>Password</span>
        </label>

        <label>
          <input
            className="input"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <span>Confirm Password</span>
        </label>

        <button className="submit" type="submit" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </button>

        <p className="signin">
          Already have an account?{' '}
          <a href="#" onClick={(e) => { e.preventDefault(); setShowLogin(true); }}>
            Sign in
          </a>
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
    padding-left: 30px;
    color: #00bfff;
  }

  .message {
    font-size: 14.5px;
    color: rgba(255, 255, 255, 0.7);
  }

  .signin {
    text-align: center;
    font-size: 14px;
  }

  .signin a {
    color: #00bfff;
    cursor: pointer;
  }

  .signin a:hover {
    text-decoration: underline;
  }

  .form label {
    position: relative;
  }

  .form label .input {
    background-color: #333;
    color: #fff;
    width: 100%;
    padding: 20px 10px 5px;
    outline: 0;
    border: 1px solid rgba(105, 105, 105, 0.4);
    border-radius: 10px;
  }

  .form label .input + span {
    position: absolute;
    left: 10px;
    top: 10px;
    font-size: 14px;
    transition: 0.3s ease;
    color: rgba(255, 255, 255, 0.5);
  }

  .form label .input:focus + span,
  .form label .input:valid + span {
    top: 2px;
    font-size: 12px;
    color: #00bfff;
  }

  .submit {
    padding: 10px;
    border-radius: 10px;
    color: #fff;
    font-size: 16px;
    background-color: #00bfff;
    cursor: pointer;
    border: none;
  }

  .submit:hover {
    background-color: #00bfff96;
  }

  .error {
    color: red;
    text-align: center;
  }
`;

export default RegisterForm;
