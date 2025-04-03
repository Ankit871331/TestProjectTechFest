import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { fetchUserProfile } from "../Features/counter/getProfile";
import { setOwnerId } from "../Features/counter/passingGroupId";
import { X } from "lucide-react";
import { createGroup } from "../Features/counter/createGroup";

const CreateGroup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState("");
  const [language, setLanguage] = useState("");
  const [numberOfMembers, setNumberOfMembers] = useState(""); // New state for number of members
  const { profile } = useSelector((state) => state.user);
  const ownerId = profile?.user?._id;

  const dispatch = useDispatch();

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  useEffect(() => {
    dispatch(fetchUserProfile());
  }, [dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic || !language || !numberOfMembers) return;

    const groupData = {
      Topic: topic,
      Language: language,
      NumberOfMembers: parseInt(numberOfMembers), // Convert to integer
    };

    // Dispatch the Redux action
    dispatch(createGroup(groupData));
    dispatch(setOwnerId(ownerId));

    // Log data to console
    console.log("Group created successfully:", groupData);

    // Close popup and reset form
    setIsOpen(false);
    setTopic("");
    setLanguage("");
    setNumberOfMembers("");
  };

  return (
    <>
      <button
        className="bg-[#2D2F2B] text-white h-10 w-auto px-4 py-2 rounded-[20px] flex justify-center items-center ml-4 text-sm md:text-base whitespace-nowrap"
        onClick={togglePopup}
      >
        + Create Your Group
      </button>

      {/* Overlay for background blur */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
        )}
      </AnimatePresence>

      {/* Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="relative bg-[#2D2F2B] p-6 rounded-[20px] w-full max-w-md shadow-lg transform transition-transform duration-300 ease-in-out scale-100 md:scale-90 sm:scale-75 text-white"
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <button
                className="absolute top-3 right-3 bg-transparent border-none text-gray-300 hover:text-gray-500 focus:outline-none"
                onClick={togglePopup}
              >
                <X className="w-6 h-6" />
              </button>
              <h2 className="text-xl font-bold mb-4">Create Your Group</h2>
              <form onSubmit={handleSubmit}>
                <input
                  type="text"
                  placeholder="Topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-black"
                  required
                />
                <input
                  type="text"
                  placeholder="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-2 mb-4 border border-gray-300 rounded bg-white text-black"
                  required
                />
                <div className="mb-4">
                  <label htmlFor="numberOfMembers" className="block text-sm font-medium mb-1">
                    Number of Members
                  </label>
                  <select
                    id="numberOfMembers"
                    value={numberOfMembers}
                    onChange={(e) => setNumberOfMembers(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded bg-white text-black"
                    required
                  >
                    <option value="" disabled>
                      Select number of members
                    </option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                      <option key={num} value={num}>
                        {num}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex space-x-4">
                  <button
                    type="submit"
                    className="bg-[#4A4A4A] text-white px-4 py-2 rounded-[20px] w-full"
                  >
                    Create Group
                  </button>
                  <button
                    type="button"
                    className="bg-gray-500 text-white px-4 py-2 rounded-[20px] w-full"
                    onClick={togglePopup}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default CreateGroup;