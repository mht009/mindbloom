// src/pages/Explore.jsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

const Explore = () => {
  // Initialize meditationTypes as an empty array
  const [meditationTypes, setMeditationTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchDebounce, setSearchDebounce] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  const observer = useRef();
  const lastMeditationElementRef = useCallback(
    (node) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });

      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  // Fetch meditation types with pagination
  useEffect(() => {
    const fetchMeditationTypes = async () => {
      try {
        setLoading(true);

        let url;
        if (searchTerm) {
          url = `/api/meditation-types/search?q=${searchTerm}&page=${page}&limit=8`;
        } else {
          url = `/api/meditation-types?page=${page}&limit=8`;
        }

        // Add filter if not 'all'
        if (selectedFilter !== "all") {
          url += `&filter=${selectedFilter}`;
        }

        const response = await axios.get(url);

        // Check if the API returned success
        if (response.data.success) {
          // The meditation types are in data.meditationTypes
          const newTypes = response.data.data.meditationTypes || [];
          const pagination = response.data.data.pagination || {};

          setMeditationTypes((prev) =>
            page === 1 ? newTypes : [...prev, ...newTypes]
          );

          // Check if there are more pages to load
          const totalPages = pagination.totalPages || 1;
          setHasMore(newTypes.length > 0 && page < totalPages);
        } else {
          setError(response.data.message || "Failed to load meditation types");
        }
      } catch (err) {
        console.error("Error fetching meditation types:", err);
        setError("Failed to load meditation types. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchMeditationTypes();
  }, [page, searchTerm, selectedFilter]);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;

    // Clear previous timeout
    if (searchDebounce) clearTimeout(searchDebounce);

    // Set new timeout for debounce
    const timeoutId = setTimeout(() => {
      setSearchTerm(value);
      setPage(1); // Reset to first page when searching
    }, 500); // 500ms debounce

    setSearchDebounce(timeoutId);
  };

  // Handle filter change
  const handleFilterChange = (filter) => {
    setSelectedFilter(filter);
    setPage(1); // Reset to first page when filtering
  };

  // Function to navigate to previous meditation type
  const prevMeditationType = () => {
    // This function would be used if implementing a carousel
  };

  // Function to navigate to next meditation type
  const nextMeditationType = () => {
    // This function would be used if implementing a carousel
  };

  // Parse benefits text into an array (if it's a string with bullet points)
  const parseBenefits = (benefitsText) => {
    if (!benefitsText) return [];
    if (Array.isArray(benefitsText)) return benefitsText;

    // If benefits is a string with bullet points (* item), split it into an array
    return benefitsText
      .split("\n")
      .map((item) => item.replace(/^\* /, "").trim())
      .filter((item) => item.length > 0);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-serif text-center text-indigo-900 mb-4">
          Explore Meditation Practices
        </h1>
        <p className="text-center text-gray-600 max-w-2xl mx-auto mb-8">
          Discover a variety of meditation techniques and find the practice that
          resonates with you.
        </p>

        {/* Search and Filter Section */}
        <div className="max-w-4xl mx-auto mb-12">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            {/* Search input */}
            <div className="relative flex-grow">
              <input
                type="text"
                placeholder="Search meditation types..."
                onChange={handleSearch}
                className="w-full p-3 pl-10 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <svg
                className="absolute left-3 top-3.5 h-5 w-5 text-gray-400"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                  clipRule="evenodd"
                />
              </svg>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange("all")}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedFilter === "all"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
              >
                All
              </button>
              <button
                onClick={() => handleFilterChange("beginner")}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedFilter === "beginner"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
              >
                For Beginners
              </button>
              <button
                onClick={() => handleFilterChange("stress")}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedFilter === "stress"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
              >
                Stress Relief
              </button>
              <button
                onClick={() => handleFilterChange("sleep")}
                className={`px-4 py-2 rounded-full text-sm ${
                  selectedFilter === "sleep"
                    ? "bg-indigo-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                } transition-colors`}
              >
                Sleep
              </button>
            </div>
          </div>
        </div>

        {/* Error state */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Meditation Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {Array.isArray(meditationTypes) &&
            meditationTypes.map((type, index) => {
              // If this is the last item and there's more to load, add ref for intersection observer
              const isLastElement = meditationTypes.length === index + 1;
              const benefits = parseBenefits(type.benefits);

              return (
                <div
                  key={type.id || index}
                  ref={isLastElement ? lastMeditationElementRef : null}
                  className="bg-white rounded-lg shadow-md overflow-hidden transition-transform hover:scale-102 hover:shadow-lg"
                >
                  <div className={`h-3 bg-indigo-600`}></div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                      {type.name}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {type.description}
                    </p>

                    {/* Benefits */}
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Benefits:
                    </h4>
                    <ul className="mb-4">
                      {benefits.slice(0, 2).map((benefit, i) => (
                        <li
                          key={i}
                          className="text-gray-600 text-sm flex items-start mb-1"
                        >
                          <span className="text-indigo-500 mr-2">•</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                      {benefits.length > 2 && (
                        <li className="text-gray-600 text-sm italic">
                          +{benefits.length - 2} more benefits
                        </li>
                      )}
                    </ul>

                    <Link
                      to={`/meditation/${type.id}`}
                      className="inline-block px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors"
                    >
                      Learn More
                    </Link>
                  </div>
                </div>
              );
            })}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="loader">
              <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="ml-4 text-gray-600">Loading more...</p>
          </div>
        )}

        {/* End of results */}
        {!loading && !hasMore && meditationTypes.length > 0 && (
          <p className="text-center text-gray-500 py-4">
            You've reached the end of the results
          </p>
        )}

        {/* No results */}
        {!loading && meditationTypes.length === 0 && (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-gray-900">
              No results found
            </h3>
            <p className="mt-1 text-gray-500">
              Try adjusting your search or filter to find what you're looking
              for.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setSelectedFilter("all");
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Explore;
