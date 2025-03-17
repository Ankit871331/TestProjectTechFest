import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups } from '../Features/counter/createGroup';
import { fetchUserProfile } from "../Features/counter/getProfile";

import styled from 'styled-components';

export default function ConnectedUsers() {
  const dispatch = useDispatch();
  const { profile } = useSelector((state) => state.user);
  const userId = profile?.user?._id; // Current user's ID
  const groupId = profile?.user?.groupId; // Target group ID
  const groupsState = useSelector((state) => state.group);

  // Find the group matching the groupId
  const targetGroup = groupsState?.groups?.find((group) => group._id === groupId);
  let participants = targetGroup?.connectedUsers || []; // Fetch connected users of the group

  // Make a copy and sort participants to place the logged-in user's card first
  const sortedParticipants = [...participants].sort((a, b) =>
    a.userId === userId ? -1 : b.userId === userId ? 1 : 0
  );

  useEffect(() => {
    dispatch(fetchGroups());
    dispatch(fetchUserProfile());
  }, [dispatch]);

  return (
    <Container>
      <CardsContainer>
        <ParticipantsGrid>
          {sortedParticipants.map((user, index) => (
            <ParticipantBox key={index}>
              <Rectangle>
                <Circle>
                  {userId === user.userId // Check if the user's ID matches the participant's ID
                    ? "Y" // Display "Y" for "You"
                    : user.name.charAt(0).toUpperCase()} {/* First capital letter */}
                </Circle>
                <Name>
                  {userId === user.userId // Check if the user's ID matches the participant's ID
                    ? "You" // Replace their name with "You"
                    : user.name}
                </Name>
              </Rectangle>
            </ParticipantBox>
          ))}
        </ParticipantsGrid>
      </CardsContainer>
    </Container>
  );
}

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh; /* Full viewport height */
`;

const CardsContainer = styled.div`
  width: 92vw;
  max-width: 700px;
  height: 85vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column; /* Align items from top */
  justify-content: flex-start; /* Start from top */
  align-items: center;
  border-radius: 15px;
  padding: 20px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.3);

  scrollbar-width: none;
  -ms-overflow-style: none;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ParticipantsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  justify-content: center;
  align-items: center;
  padding: 20px; /* Reduced padding so the first row is visible */
  width: 100%;
`;

const ParticipantBox = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const Rectangle = styled.div`
  background-color: #2D2F2B;
  padding: 15px;
  width: 250px; /* Set width smaller */
  height: 300px; /* Set height greater */
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  border-radius: 12px; /* Optional, for slightly rounded corners */
  margin-bottom: 10px;
`;

const Circle = styled.div`
  width: 60px;
  height: 60px;
  background-color: #00bfff;
  color: white;
  font-size: 24px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 10px;
`;

const Name = styled.div`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  color: #74D5E4;
  word-wrap: break-word;
  max-width: 70px; /* Prevents long names from breaking layout */
`;

