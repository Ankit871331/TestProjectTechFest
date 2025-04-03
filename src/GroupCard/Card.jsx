import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import io from 'socket.io-client';
import styled from "styled-components";
import { useSelector, useDispatch } from 'react-redux';
import { fetchUserProfile } from "../Features/counter/getProfile";
import { setLockState, setGroupId } from "../Features/counter/passingGroupId";
import { addUserToGroup } from "../Features/counter/connectedUsersSlice";
import { setFalse, setTrue } from "../Features/counter/toggleConnectUsers";

// Initialize Socket.IO connection
const socket = io(import.meta.env.VITE_SERVER_BASE_URL, { transports: ["websocket"] });

// Function to assign different colors to users
const getColor = (index) => {
  const colors = ["#A294F9", "#FFCFB3", "#AAD7D9", "#F4FF33", "#FF33A1"];
  return colors[index % colors.length];
};

const Card = ({ uniqueId, name, language, topic, members = [], NumberOfMembers }) => {
  console.log("members", members);
  const dispatch = useDispatch();
  const [isLocked, setIsLocked] = useState(false);
  const { profile } = useSelector((state) => state.user);
  const isUserJoinedCall = useSelector((state) => state.connectedUsers.isUserJoinedCall);
  const [lockedGroups, setLockedGroups] = useState({});

  useEffect(() => {
    if (profile?.user?.groupId) {
      console.log(profile.user.groupId);
    }
  }, [profile]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      dispatch(fetchUserProfile());
    }
  }, [dispatch]);

  useEffect(() => {
    socket.on("toggleLock", ({ groupId, lockState }) => {
      dispatch(setLockState({ groupId, newLockState: lockState }));
      console.log("groupId", groupId);
      setLockedGroups((prev) => ({
        ...prev,
        [groupId]: lockState, // Update only the specific group
      }));
    });

    // Listen for user leaving the group
    socket.on("userLeft", ({ groupId, updatedMembers }) => {
      if (groupId === uniqueId) {
        // Update members locally or via Redux if needed
        console.log("User left, updated members:", updatedMembers);
        // Assuming members is updated via props or Redux, no direct state change here
      }
    });

    return () => {
      socket.off("toggleLock");
      socket.off("userLeft");
    };
  }, [dispatch, uniqueId]);

  // Handle joining the room and emitting socket events
  const handleJoinClick = () => {
    if (profile && profile.user && profile.user._id && uniqueId) {
      console.log("NumberOfMembers", NumberOfMembers);
      console.log("groupID", uniqueId);

      dispatch(setGroupId(uniqueId));
      dispatch(addUserToGroup({ groupId: uniqueId, userId: profile.user._id }));

      socket.emit("joinGroup", { groupId: uniqueId, username: profile.user.name });
      if (!isUserJoinedCall) {
        dispatch(setTrue("isUserJoinedCall"));
      }
    }
  };

  // Display up to 3 members with name and circle, placeholders for empty slots
  const displayedMembers = members.slice(0, 3);
  const remainingCount = 3 - displayedMembers.length;
  const extraMembers = members.length - 3;

  // Check if the group is full
  const isGroupFull = members.length >= NumberOfMembers;

  return (
    <div className="bg-[#2D2F2B] text-white rounded-lg shadow-md p-6 w-full max-w-sm">
      {/* Member Circles with Styled Scrollbar */}
      <MemberContainer>
        {displayedMembers.map((member, index) => (
          <div
            key={index}
            className="flex flex-col items-center"
            style={{ minWidth: '4rem' }}
          >
            {/* Circle */}
            <div
              className="rounded-full w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: getColor(index) }}
            >
              {member.initial}
            </div>
            {/* Name */}
            <p className="text-sm mt-2 text-center truncate w-full" title={member.name}>
              {member.name}
            </p>
          </div>
        ))}

        {/* Show dotted placeholders for empty slots */}
        {remainingCount > 0 && Array.from({ length: remainingCount }).map((_, index) => (
          <div key={`placeholder-${index}`} className="flex flex-col items-center" style={{ minWidth: '4rem' }}>
            <PlaceholderCircle>+</PlaceholderCircle>
            <p className="text-sm mt-2 text-center">Waiting</p>
          </div>
        ))}

        {/* Extra Members Count Circle */}
        {extraMembers > 0 && (
          <div className="flex flex-col items-center" style={{ minWidth: '4rem' }}>
            <ExtraMembersCircle>+{extraMembers}</ExtraMembersCircle>
            <p className="text-sm mt-2 text-center">More</p>
          </div>
        )}
      </MemberContainer>

      {/* Group Information */}
      <div className="flex flex-col gap-3 my-4 text-white">
        <p>Topic: {topic}</p>
        <p>Language: {language}</p>
      </div>

      {/* Join Group Button */}
      <div className="flex justify-center">
        <Link to="home" className="w-full">
          <button
            className={`px-4 py-2 rounded-lg w-full transition-transform duration-200
              ${(lockedGroups[uniqueId] || isGroupFull)
                ? "bg-gray-400 cursor-not-allowed" // Disabled state (gray color, no cursor)
                : "bg-[#00BFFF] hover:scale-105 text-white"}`
            }
            onClick={(lockedGroups[uniqueId] || isGroupFull) ? null : handleJoinClick}
            disabled={lockedGroups[uniqueId] || isGroupFull}
          >
            Join
          </button>
        </Link>
      </div>
    </div>
  );
};

const ExtraMembersCircle = styled.div`
  width: 4rem;
  height: 4rem;
  background-color: #4B5563;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: white;
  font-weight: bold;
`;

const MemberContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  overflow-x: auto;
  white-space: nowrap;
  scrollbar-width: none; /* Firefox */
  scrollbar-color: black transparent; /* Firefox */

  /* WebKit browsers */
  &::-webkit-scrollbar {
    height: 1px; /* Super thin scrollbar */
  }
  &::-webkit-scrollbar-thumb {
    background-color: black; /* Black scrollbar */
    border-radius: 10px; /* Rounded ends */
  }
  &::-webkit-scrollbar-track {
    background: transparent; /* Transparent track */
  }
`;

const PlaceholderCircle = styled.div`
  width: 4rem;
  height: 4rem;
  border: 2px dashed gray;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: gray;
`;

export default Card;