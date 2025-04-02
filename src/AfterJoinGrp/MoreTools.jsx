import React, { useEffect, useRef,useState } from "react";

import styled from "styled-components";
import { setLockState } from "../Features/counter/passingGroupId";
import io from "socket.io-client";
import { fetchUserProfile } from "../Features/counter/getProfile";
import { useSelector, useDispatch } from "react-redux";

const socket = io(import.meta.env.VITE_SERVER_BASE_URL, { transports: ["websocket"] });

const MoreTools = () => {
    const dispatch = useDispatch();

    const { profile } = useSelector((state) => state.user);
    const [groupId, setGroupId] = useState(null);
    console.log("groupIdgroupId", groupId)

    useEffect(() => {
        if (profile?.user?.groupId) {
            setGroupId(profile.user.groupId);
        }
    }, [profile]);


    const isLocked = useSelector((state) => state.passingGroupId.lockedGroups[groupId] || false); // Get lock state from Redux




    const toggleLock = () => {
      
        const newLockState = !isLocked;
        dispatch(setLockState({ groupId, lockState: newLockState }));// Update Redux store
        socket.emit("toggleLock", { groupId, newLockState }); // Emit lock state to all users
    };

    useEffect(() => {
        dispatch(fetchUserProfile());
    }, [dispatch]);

    return (
        <StyledWrapper $isLocked={isLocked}>
            <div>
                <input type="checkbox" id="lock" checked={isLocked} onChange={toggleLock} />
                <label htmlFor="lock" className="lock-label">
                    <span className="lock-wrapper">
                        <span className="shackle" />
                        <svg
                            className="lock-body"
                            width="28"
                            height="28"
                            viewBox="0 0 28 28"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                fillRule="evenodd"
                                clipRule="evenodd"
                                d="M0 5C0 2.23858 2.23858 0 5 0H23C25.7614 0 28 2.23858 28 5V23C28 25.7614 25.7614 28 23 28H5C2.23858 28 0 25.7614 0 23V5ZM16 13.2361C16.6137 12.6868 17 11.8885 17 11C17 9.34315 15.6569 8 14 8C12.3431 8 11 9.34315 11 11C11 11.8885 11.3863 12.6868 12 13.2361V18C12 19.1046 12.8954 20 14 20C15.1046 20 16 19.1046 16 18V13.2361Z"
                                fill="white"
                            />
                        </svg>
                    </span>
                </label>
            </div>
        </StyledWrapper>
    );
};

const StyledWrapper = styled.div`
    min-height: 100px;
    min-width: 100px;
    display: flex;
    justify-content: center;
    align-items: center;

    #lock {
        display: none;
    }

    .lock-label {
        width: 45px;
        height: 45px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: ${({ $isLocked }) => ($isLocked ? "#505050" : "rgb(17, 1, 31)")};
        border: 1px solid white;
        border-radius: 15px;
        cursor: pointer;
        transition: all 0.3s;
    }

    .lock-wrapper {
        width: fit-content;
        height: fit-content;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    }

    .shackle {
        background-color: transparent;
        height: 9px;
        width: 14px;
        border-top-right-radius: 10px;
        border-top-left-radius: 10px;
        border-top: 3px solid white;
        border-left: 3px solid white;
        border-right: 3px solid white;
        transition: all 0.3s;
        transform: ${({ $isLocked }) => ($isLocked ? "rotateY(0deg)" : "rotateY(150deg) translateX(3px)")};
        transform-origin: right;
    }

    .lock-body {
        width: 15px;
        height: auto;
    }

    .lock-label:active {
        transform: scale(0.9);
    }
`;

export default MoreTools;
