import React, { useState } from 'react';
import '../src/css/FilterPage.css';

const FilterModal = ({ isOpen, onClose, filters, onApplyFilters }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    category: false,
    location: false,
    mode: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

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
      <div className="filter-dropdown">
        <div className="filter-dropdown-header">
          <h3>Filter Events</h3>
          <button className="filter-close" onClick={onClose}>×</button>
        </div>

        <div className="filter-dropdown-content">
          
          {/* Price Range Section */}
          <div className="filter-section">
            <button 
              className="filter-section-header"
              onClick={() => toggleSection('price')}
            >
              <span className="filter-section-title">Price Range</span>
              <span className="filter-section-icon">{expandedSections.price ? '▲' : '▼'}</span>
            </button>
            {expandedSections.price && (
              <div className="filter-section-content">
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="price"
                    value="all"
                    checked={localFilters.priceRange === 'all'}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>All Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="price"
                    value="free"
                    checked={localFilters.priceRange === 'free'}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>Free Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="price"
                    value="0-500"
                    checked={localFilters.priceRange === '0-500'}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>₹0 - ₹500</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="price"
                    value="500-1000"
                    checked={localFilters.priceRange === '500-1000'}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>₹500 - ₹1000</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="price"
                    value="1000+"
                    checked={localFilters.priceRange === '1000+'}
                    onChange={(e) => handleFilterChange('priceRange', e.target.value)}
                  />
                  <span>₹1000+</span>
                </label>
              </div>
            )}
          </div>

          {/* Category Section */}
          <div className="filter-section">
            <button 
              className="filter-section-header"
              onClick={() => toggleSection('category')}
            >
              <span className="filter-section-title">Event Category</span>
              <span className="filter-section-icon">{expandedSections.category ? '▲' : '▼'}</span>
            </button>
            {expandedSections.category && (
              <div className="filter-section-content">
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="category"
                    value="all"
                    checked={localFilters.parentCategory === 'all'}
                    onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                  />
                  <span>All Categories</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="category"
                    value="tech"
                    checked={localFilters.parentCategory === 'tech'}
                    onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                  />
                  <span>Tech Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="category"
                    value="academic"
                    checked={localFilters.parentCategory === 'academic'}
                    onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                  />
                  <span>Academic Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="category"
                    value="cultural"
                    checked={localFilters.parentCategory === 'cultural'}
                    onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                  />
                  <span>Cultural Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="category"
                    value="sports"
                    checked={localFilters.parentCategory === 'sports'}
                    onChange={(e) => handleFilterChange('parentCategory', e.target.value)}
                  />
                  <span>Sports Events</span>
                </label>

                {/* Subcategories */}
                {localFilters.parentCategory !== 'all' && (
                  <div className="filter-subcategories">
                    <div className="subcategory-label">Specializations:</div>
                    {getSubcategories(localFilters.parentCategory).map(subcategory => (
                      <label key={subcategory.value} className="filter-checkbox-option">
                        <input
                          type="checkbox"
                          checked={(localFilters.subcategories || []).includes(subcategory.value)}
                          onChange={(e) => handleSubcategoryChange(subcategory.value, e.target.checked)}
                        />
                        <span>{subcategory.label}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Location Section */}
          <div className="filter-section">
            <button 
              className="filter-section-header"
              onClick={() => toggleSection('location')}
            >
              <span className="filter-section-title">Location</span>
              <span className="filter-section-icon">{expandedSections.location ? '▲' : '▼'}</span>
            </button>
            {expandedSections.location && (
              <div className="filter-section-content">
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="location"
                    value="all"
                    checked={localFilters.location === 'all'}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                  <span>All Locations</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="location"
                    value="kolhapur"
                    checked={localFilters.location === 'kolhapur'}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                  <span>Kolhapur</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="location"
                    value="mumbai"
                    checked={localFilters.location === 'mumbai'}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                  <span>Mumbai</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="location"
                    value="pune"
                    checked={localFilters.location === 'pune'}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                  />
                  <span>Pune</span>
                </label>
              </div>
            )}
          </div>

          {/* Event Mode Section */}
          <div className="filter-section">
            <button 
              className="filter-section-header"
              onClick={() => toggleSection('mode')}
            >
              <span className="filter-section-title">Event Format</span>
              <span className="filter-section-icon">{expandedSections.mode ? '▲' : '▼'}</span>
            </button>
            {expandedSections.mode && (
              <div className="filter-section-content">
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="mode"
                    value="all"
                    checked={localFilters.eventMode === 'all'}
                    onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                  />
                  <span>All Formats</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="mode"
                    value="online"
                    checked={localFilters.eventMode === 'online'}
                    onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                  />
                  <span>Online Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="mode"
                    value="offline"
                    checked={localFilters.eventMode === 'offline'}
                    onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                  />
                  <span>In-Person Events</span>
                </label>
                <label className="filter-radio-option">
                  <input
                    type="radio"
                    name="mode"
                    value="hybrid"
                    checked={localFilters.eventMode === 'hybrid'}
                    onChange={(e) => handleFilterChange('eventMode', e.target.value)}
                  />
                  <span>Hybrid Events</span>
                </label>
              </div>
            )}
          </div>

        </div>

        <div className="filter-dropdown-footer">
          <button className="filter-reset-btn" onClick={handleReset}>
            Reset
          </button>
          <button className="filter-apply-btn" onClick={handleApply}>
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
};

const getSubcategories = (parentCategory) => {
  const subcategories = {
    tech: [
      { value: 'hackathon', label: 'Hackathons' },
      { value: 'coding', label: 'Coding Competitions' },
      { value: 'ai-ml', label: 'AI/ML Workshops' },
      { value: 'blockchain', label: 'Blockchain Events' }
    ],
    academic: [
      { value: 'workshop', label: 'Workshops' },
      { value: 'seminar', label: 'Seminars' },
      { value: 'conference', label: 'Conferences' },
      { value: 'research', label: 'Research Presentations' }
    ],
    cultural: [
      { value: 'music', label: 'Music Events' },
      { value: 'dance', label: 'Dance Competitions' },
      { value: 'drama', label: 'Drama & Theatre' },
      { value: 'art', label: 'Art Exhibitions' }
    ],
    sports: [
      { value: 'cricket', label: 'Cricket' },
      { value: 'football', label: 'Football' },
      { value: 'basketball', label: 'Basketball' },
      { value: 'athletics', label: 'Athletics' }
    ]
  };
  return subcategories[parentCategory] || [];
};

export default FilterModal;
