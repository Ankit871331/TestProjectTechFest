import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { createGroup } from "../Features/counter/createGroup"; // Import the action

const CreateGroup = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [topic, setTopic] = useState(""); // State for topic input
  const [language, setLanguage] = useState(""); // State for language input
  const dispatch = useDispatch();

  const togglePopup = () => {
    setIsOpen(!isOpen);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!topic || !language) return;

    const groupData = { Topic: topic, Language: language };

    // Dispatch the Redux action
    dispatch(createGroup(groupData));

    // Log data to console
    console.log("Group created successfully:", groupData);

    // Close popup and reset form
    setIsOpen(false);
    setTopic("");
    setLanguage("");
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
