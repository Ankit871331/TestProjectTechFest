import { useState } from "react";
import { Search } from "lucide-react"; // Using Lucide-react for the search icon

const SearchBar = () => {
  const [query, setQuery] = useState("");

  return (
    <div className="flex items-center bg-[#2D2F2B] rounded-4xl h-[40px] shadow-md p-3 w-full max-w-2xl border border-gray-300 mx-4 sm:mx-8 lg:mx-0">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search something..."
        className="w-full text-base sm:text-lg placeholder:text-gray-400 focus:outline-none bg-transparent text-white"
      />
      <Search className="text-white w-5 h-5 sm:w-6 sm:h-6 mx-2" /> {/* Changed icon size for responsiveness */}
    </div>
  );
};

export default SearchBar;
