import React, { useState, useEffect } from 'react';
import { Search, Calendar, MapPin, Award, ExternalLink, Filter, Loader } from 'lucide-react';

const App = () => {
  // State variables (like variables that cause re-render when changed)
  const [hackathons, setHackathons] = useState([]);
  const [filteredHackathons, setFilteredHackathons] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWebsite, setSelectedWebsite] = useState('all');
  const [loading, setLoading] = useState(true);

  // Fetch hackathons from backend when component loads
  useEffect(() => {
    const fetchHackathons = async () => {
      setLoading(true);
      try {
        // Call your Python backend
        const response = await fetch('http://localhost:8000/hackathons');
        const data = await response.json();
        
        console.log('Fetched hackathons:', data); // Debug log
        
        setHackathons(data);
        setFilteredHackathons(data);
      } catch (error) {
        console.error('Error fetching hackathons:', error);
        alert('Failed to fetch hackathons. Make sure backend is running!');
      } finally {
        setLoading(false);
      }
    };
    
    fetchHackathons();
  }, []); // Empty array means run once when component loads

  // Filter hackathons when search or website filter changes
  useEffect(() => {
    let filtered = hackathons;

    // Filter by selected website
    if (selectedWebsite !== 'all') {
      filtered = filtered.filter(h => h.source === selectedWebsite);
    }

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(h => 
        h.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        h.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    setFilteredHackathons(filtered);
  }, [searchQuery, selectedWebsite, hackathons]);

  // Get unique website names for filter dropdown
  const websites = ['all', ...new Set(hackathons.map(h => h.source))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-pink-50">
      {/* Header Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-pink-600 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Award className="w-10 h-10" />
            HackHub
          </h1>
          <p className="text-purple-100 text-lg">Discover hackathons from across the web, all in one place</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Search and Filter Box */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search hackathons by name, description, or tags..."
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Website Filter Dropdown */}
            <div className="relative">
              <Filter className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                className="pl-12 pr-8 py-3 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none transition-colors appearance-none bg-white cursor-pointer min-w-[200px]"
                value={selectedWebsite}
                onChange={(e) => setSelectedWebsite(e.target.value)}
              >
                {websites.map(site => (
                  <option key={site} value={site}>
                    {site === 'all' ? 'All Websites' : site}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-gray-600">
            Found <span className="font-semibold text-purple-600">{filteredHackathons.length}</span> hackathons
          </div>
        </div>

        {/* Loading Spinner */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader className="w-12 h-12 animate-spin text-purple-600" />
          </div>
        )}

        {/* Hackathons Grid */}
        {!loading && filteredHackathons.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredHackathons.map(hackathon => (
              <div 
                key={hackathon.id}
                className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group hover:-translate-y-1"
              >
                {/* Source Badge */}
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 px-4 py-2">
                  <span className="text-white text-sm font-semibold">{hackathon.source}</span>
                </div>

                {/* Card Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-purple-600 transition-colors">
                    {hackathon.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {hackathon.description}
                  </p>

                  {/* Info: Date, Location, Prize */}
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center gap-2 text-gray-700">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">{hackathon.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <MapPin className="w-4 h-4 text-pink-500" />
                      <span className="text-sm">{hackathon.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-700">
                      <Award className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm font-semibold text-green-600">{hackathon.prize}</span>
                    </div>
                  </div>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {hackathon.tags.map((tag, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* View Details Button */}
                  <a
                    href={hackathon.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                  >
                    View Details
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results Message */}
        {!loading && filteredHackathons.length === 0 && (
          <div className="text-center py-20">
            <div className="text-gray-400 mb-4">
              <Search className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-2xl font-bold text-gray-700 mb-2">No hackathons found</h3>
            <p className="text-gray-500">Try adjusting your search or filter criteria</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;