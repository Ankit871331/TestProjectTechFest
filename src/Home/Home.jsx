import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroups } from '../Features/counter/createGroup';
import { io } from "socket.io-client";
import Navbar from '../Navbar/Navbar';
import Card from '../GroupCard/Card';
import CreateGroup from '../Navbar/CreateGroupBtn';

const socket = io(import.meta.env.VITE_SOCKETIO);

export default function Home() {
    const dispatch = useDispatch();
    const groupsState = useSelector((state) => state.group);
    console.log("group", groupsState)


    // ✅ Fetch groups when component mounts
    useEffect(() => {
        dispatch(fetchGroups());
    }, [dispatch]);

    // ✅ Handle real-time socket events
    useEffect(() => {

        socket.on("connect", () => {
            console.log("✅ Connected to Socket.IO Server!", socket.id);
        });
        // Listen for new groups
        socket.on("newGroup", (newGroup) => {
            console.log("📢 New Group Created:", newGroup);
            dispatch(fetchGroups()); // Fetch latest groups
        });

        // ✅ Listen for user joining a group
        socket.on("userJoined", ({ groupId, userId }) => {
            console.log(`📌 User ${userId} joined group ${groupId}, fetching updated groups...`);
            dispatch(fetchGroups());
        });

        // ✅ Listen for user leaving a group
        socket.on("userRemoved", ({ userId, groupId  }) => {
            console.log(`❌ User ${userId} left group ${groupId}, fetching updated groups...`);
            dispatch(fetchGroups());
        });

        // Cleanup listeners on component unmount
        return () => {
            socket.off("newGroup");
            socket.off("userJoined");
            socket.off("userRemoved");
        };
    }, [dispatch]); // ✅ No `groupsState.groups` dependency here

    return (
        <div>
            <Navbar />
            <CreateGroup />
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 px-4">
                {groupsState.groups.slice().reverse().map((group, index) => {
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
                            members={members}
                        />
                    );
                })}
            </div>
        </div>
    );
}
