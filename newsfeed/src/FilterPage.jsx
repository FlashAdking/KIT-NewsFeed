// FilterModal.jsx
import React, { useState } from 'react';

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (category, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [category]: value
    }));
  };

  const handleSubcategoryChange = (subcategory, checked) => {
    setLocalFilters(prev => ({
      ...prev,
      subcategories: checked 
        ? [...(prev.subcategories || []), subcategory]
        : (prev.subcategories || []).filter(item => item !== subcategory)
    }));
  };

  const handleApply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const handleReset = () => {
    const resetFilters = {
      priceRange: 'all',
      parentCategory: 'all',
      subcategories: [],
      location: 'all',
      eventMode: 'all'
    };
    setLocalFilters(resetFilters);
    onApplyFilters(resetFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="filter-overlay" onClick={onClose}></div>
      <div className="filter-modal">
        <div className="filter-header">
          <h3>🔍 Filter Events</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="filter-content">
          {/* Price Range Filter */}
          <div className="filter-group">
            <label className="filter-label">💰 Price Range</label>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="price"
                  value="all"
                  checked={localFilters.priceRange === 'all'}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                />
                <span>All Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="price"
                  value="free"
                  checked={localFilters.priceRange === 'free'}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                />
                <span>Free Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="price"
                  value="paid"
                  checked={localFilters.priceRange === 'paid'}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                />
                <span>Paid Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="price"
                  value="budget"
                  checked={localFilters.priceRange === 'budget'}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                />
                <span>Under ₹500</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="price"
                  value="premium"
                  checked={localFilters.priceRange === 'premium'}
                  onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                />
                <span>₹500+</span>
              </label>
            </div>
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label className="filter-label">🎯 Event Category</label>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value="all"
                  checked={localFilters.parentCategory === 'all'}
                  onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                />
                <span>All Categories</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value="tech"
                  checked={localFilters.parentCategory === 'tech'}
                  onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                />
                <span>💻 Tech Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value="academic"
                  checked={localFilters.parentCategory === 'academic'}
                  onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                />
                <span>🎓 Academic Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value="cultural"
                  checked={localFilters.parentCategory === 'cultural'}
                  onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                />
                <span>🎭 Cultural Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="category"
                  value="sports"
                  checked={localFilters.parentCategory === 'sports'}
                  onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                />
                <span>🏆 Sports Events</span>
              </label>
            </div>
          </div>

          {/* Subcategories */}
          {localFilters.parentCategory !== 'all' && (
            <div className="filter-group">
              <label className="filter-label">
                🔸 {localFilters.parentCategory === 'tech' ? 'Tech Specializations' :
                     localFilters.parentCategory === 'academic' ? 'Academic Types' :
                     localFilters.parentCategory === 'cultural' ? 'Cultural Types' :
                     'Sports Types'}
              </label>
              <div className="filter-subcategories">
                {getSubcategories(localFilters.parentCategory).map(subcategory => (
                  <label key={subcategory.value} className="filter-checkbox">
                    <input
                      type="checkbox"
                      checked={(localFilters.subcategories || []).includes(subcategory.value)}
                      onChange={(e) => handleSubcategoryChange(subcategory.value, e.target.checked)}
                    />
                    <span>{subcategory.icon} {subcategory.label}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Location Filter */}
          <div className="filter-group">
            <label className="filter-label">📍 Location</label>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value="all"
                  checked={localFilters.location === 'all'}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
                <span>All Locations</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value="bangalore"
                  checked={localFilters.location === 'bangalore'}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
                <span>Bangalore</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value="mumbai"
                  checked={localFilters.location === 'mumbai'}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
                <span>Mumbai</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value="delhi"
                  checked={localFilters.location === 'delhi'}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
                <span>Delhi</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="location"
                  value="hyderabad"
                  checked={localFilters.location === 'hyderabad'}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
                <span>Hyderabad</span>
              </label>
            </div>
          </div>

          {/* Event Mode */}
          <div className="filter-group">
            <label className="filter-label">🌐 Event Format</label>
            <div className="filter-options">
              <label className="filter-option">
                <input
                  type="radio"
                  name="mode"
                  value="all"
                  checked={localFilters.eventMode === 'all'}
                  onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                />
                <span>All Formats</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="mode"
                  value="online"
                  checked={localFilters.eventMode === 'online'}
                  onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                />
                <span>🖥️ Online Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="mode"
                  value="offline"
                  checked={localFilters.eventMode === 'offline'}
                  onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                />
                <span>🏢 In-Person Events</span>
              </label>
              <label className="filter-option">
                <input
                  type="radio"
                  name="mode"
                  value="hybrid"
                  checked={localFilters.eventMode === 'hybrid'}
                  onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                />
                <span>🔗 Hybrid Events</span>
              </label>
            </div>
          </div>
        </div>

        <div className="filter-actions">
          <button className="reset-btn" onClick={handleReset}>
            🔄 Reset Filters
          </button>
          <button className="apply-btn" onClick={handleApply}>
            ✅ Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

// Helper function for subcategories
const getSubcategories = (parentCategory) => {
  const subcategories = {
    tech: [
      { value: 'hackathon', label: 'Hackathons', icon: '💻' },
      { value: 'coding', label: 'Coding Competitions', icon: '⌨️' },
      { value: 'ai-ml', label: 'AI/ML Workshops', icon: '🤖' },
      { value: 'blockchain', label: 'Blockchain Events', icon: '⛓️' }
    ],
    academic: [
      { value: 'workshop', label: 'Workshops', icon: '🔧' },
      { value: 'seminar', label: 'Seminars', icon: '🎤' },
      { value: 'conference', label: 'Conferences', icon: '🏛️' },
      { value: 'research', label: 'Research Presentations', icon: '🔬' }
    ],
    cultural: [
      { value: 'music', label: 'Music Events', icon: '🎵' },
      { value: 'dance', label: 'Dance Competitions', icon: '💃' },
      { value: 'drama', label: 'Drama & Theatre', icon: '🎭' },
      { value: 'art', label: 'Art Exhibitions', icon: '🎨' }
    ],
    sports: [
      { value: 'cricket', label: 'Cricket', icon: '🏏' },
      { value: 'football', label: 'Football', icon: '⚽' },
      { value: 'basketball', label: 'Basketball', icon: '🏀' },
      { value: 'athletics', label: 'Athletics', icon: '🏃' }
    ]
  };
  return subcategories[parentCategory] || [];
};

export default FilterModal;
