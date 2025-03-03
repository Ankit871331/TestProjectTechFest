import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups, addNewGroup } from '../Features/counter/createGroup';
import { io } from "socket.io-client";
import Navbar from '../Navbar/Navbar';
import Card from '../GroupCard/Card';
import CreateGroup from '../Navbar/CreateGroupBtn';

const socket = io(import.meta.env.VITE_SOCKETIO);

export default function Home() {
    const dispatch = useDispatch();
    const groupsState = useSelector((state) => state.group);
    console.log("group",groupsState)

    // Fetch groups on mount
    useEffect(() => {
        dispatch(fetchGroups());
    }, [dispatch]);

    // Listen for new group events
    useEffect(() => {
        socket.on("newGroup", (newGroup) => {
            console.log("New Group Received:", newGroup);

            // Check if the group already exists
            dispatch(addNewGroup(newGroup));
        });

        // Cleanup listener on unmount
        return () => {
            socket.off("newGroup");
        };
    },  [dispatch, groupsState.groups]);

    useEffect(() => {
        socket.on("userJoined", (joinedUser) => {
            console.log("🔄 User joined, refetching groups...", joinedUser);
            dispatch(fetchGroups());  // Refetch groups when a user joins
        });

        return () => {
            socket.off("userJoined"); // Cleanup event listener
        };
    }, [dispatch]);


    return (
        <div className="">
            <Navbar />
            <CreateGroup />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
                {groupsState.groups.slice().reverse().map((group, index) => {
                    // Extract connected users directly from the group data
                    const members = group.connectedUsers.map(user => ({
                        initial: user.name.charAt(0).toUpperCase(),
                        name: user.name
                    }));

                    return (
                        <Card
                            key={index}
                            uniqueId={group._id}
                            language={group.Language}
                            topic={group.Topic}
                            members={members} // Pass extracted connected users' names
                        />
                    );
                })}
            </div>
        </div>
    );
}
