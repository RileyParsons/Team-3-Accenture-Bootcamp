'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Tag, ExternalLink, Loader2, Search, Navigation, DollarSign, Users } from 'lucide-react';
import { getEvents, Event, getProfile } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suburb, setSuburb] = useState('');
  const [postcode, setPostcode] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searchPostcode, setSearchPostcode] = useState('');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'low-cost'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'tech' | 'student' | 'networking'>('all');
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    loadUserLocation();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [events, priceFilter, categoryFilter]);

  const loadUserLocation = async () => {
    try {
      // Try to get location from user profile first
      const storedUser = localStorage.getItem('savesmart_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        if (userData.userId) {
          const profile = await getProfile(userData.userId);
          if (profile.location || profile.postcode) {
            setSuburb(profile.location || '');
            setPostcode(profile.postcode || '');
            setSearchSuburb(profile.location || '');
            setSearchPostcode(profile.postcode || '');
            loadEvents(profile.location, profile.postcode || undefined);
            return;
          }
        }
      }
    } catch (err) {
      console.log('Could not load user location from profile');
    }

    // If no profile location, load default events for Melbourne
    loadEvents('Melbourne', '3000');
  };

  const loadEvents = async (filterSuburb?: string, filterPostcode?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEvents(filterSuburb, filterPostcode);
      setEvents(data);
      setFilteredEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...events];

    // Price filter
    if (priceFilter === 'free') {
      filtered = filtered.filter(event =>
        event.discount?.description?.toLowerCase().includes('free') ||
        event.discount?.percentage === 100
      );
    } else if (priceFilter === 'low-cost') {
      filtered = filtered.filter(event =>
        event.discount?.amount ||
        (event.discount?.percentage && event.discount.percentage > 0)
      );
    }

    // Category filter (based on event name and description)
    if (categoryFilter === 'tech') {
      filtered = filtered.filter(event => {
        const text = `${event.name} ${event.description}`.toLowerCase();
        return text.includes('tech') || text.includes('coding') ||
               text.includes('developer') || text.includes('programming') ||
               text.includes('software') || text.includes('startup') ||
               text.includes('innovation') || text.includes('digital');
      });
    } else if (categoryFilter === 'student') {
      filtered = filtered.filter(event => {
        const text = `${event.name} ${event.description}`.toLowerCase();
        return text.includes('student') || text.includes('university') ||
               text.includes('campus') || text.includes('graduate') ||
               text.includes('young professional') || text.includes('career');
      });
    } else if (categoryFilter === 'networking') {
      filtered = filtered.filter(event => {
        const text = `${event.name} ${event.description}`.toLowerCase();
        return text.includes('networking') || text.includes('meetup') ||
               text.includes('community') || text.includes('social');
      });
    }

    setFilteredEvents(filtered);
  };

  const handleUseCurrentLocation = async () => {
    setIsLoadingLocation(true);
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async () => {
            // In a real app, you'd reverse geocode these coordinates to get suburb/postcode
            // For now, we'll just use Melbourne as default
            setSuburb('Melbourne');
            setPostcode('3000');
            setSearchSuburb('Melbourne');
            setSearchPostcode('3000');
            loadEvents('Melbourne', '3000');
            setIsLoadingLocation(false);
          },
          (error) => {
            console.error('Error getting location:', error);
            setError('Could not access your location. Please enter manually.');
            setIsLoadingLocation(false);
          }
        );
      } else {
        setError('Geolocation is not supported by your browser.');
        setIsLoadingLocation(false);
      }
    } catch (err) {
      console.error('Error with geolocation:', err);
      setIsLoadingLocation(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSearchSuburb(suburb);
    setSearchPostcode(postcode);
    loadEvents(suburb || undefined, postcode || undefined);
  };

  const handleClearFilters = () => {
    setSuburb('');
    setPostcode('');
    setSearchSuburb('');
    setSearchPostcode('');
    setPriceFilter('all');
    setCategoryFilter('all');
    loadEvents('Melbourne', '3000');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventCategory = (event: Event): string[] => {
    const text = `${event.name} ${event.description}`.toLowerCase();
    const categories: string[] = [];

    if (text.includes('tech') || text.includes('coding') || text.includes('developer')) {
      categories.push('Tech');
    }
    if (text.includes('student') || text.includes('university') || text.includes('graduate')) {
      categories.push('Student');
    }
    if (text.includes('networking') || text.includes('meetup')) {
      categories.push('Networking');
    }
    if (text.includes('free') || event.discount?.percentage === 100) {
      categories.push('Free');
    }

    return categories;
  };

  if (isLoading && events.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Events</h1>
        <p className="text-gray-600">Discover free and low-cost events for students and tech professionals</p>
      </div>

      {/* Search Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 mb-1">
                Suburb
              </label>
              <input
                type="text"
                id="suburb"
                value={suburb}
                onChange={(e) => setSuburb(e.target.value)}
                placeholder="Enter suburb (e.g., Melbourne)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label htmlFor="postcode" className="block text-sm font-medium text-gray-700 mb-1">
                Postcode
              </label>
              <input
                type="text"
                id="postcode"
                value={postcode}
                onChange={(e) => setPostcode(e.target.value)}
                placeholder="Enter postcode (e.g., 3000)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>

            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              {isLoadingLocation ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Navigation className="h-5 w-5" />
              )}
              <span>Use My Location</span>
            </button>

            {(searchSuburb || searchPostcode || priceFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </form>

        {/* Additional Filters */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Price Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="inline h-4 w-4 mr-1" />
                Price
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setPriceFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    priceFilter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('free')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    priceFilter === 'free'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Free
                </button>
                <button
                  type="button"
                  onClick={() => setPriceFilter('low-cost')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    priceFilter === 'low-cost'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Low Cost
                </button>
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="inline h-4 w-4 mr-1" />
                Category
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categoryFilter === 'all'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('tech')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categoryFilter === 'tech'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Tech
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('student')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categoryFilter === 'student'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('networking')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    categoryFilter === 'networking'
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Networking
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Active Filters Summary */}
      {(searchSuburb || searchPostcode) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing events for:{' '}
          {searchSuburb && <span className="font-medium">{searchSuburb}</span>}
          {searchSuburb && searchPostcode && ', '}
          {searchPostcode && <span className="font-medium">{searchPostcode}</span>}
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-sm text-gray-600">
        Found <span className="font-semibold">{filteredEvents.length}</span> event{filteredEvents.length !== 1 ? 's' : ''}
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <p className="text-gray-500 mb-2">No events found matching your criteria.</p>
          <p className="text-sm text-gray-400">Try adjusting your filters or search in a different location.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            const categories = getEventCategory(event);
            return (
              <div
                key={event.eventId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                  {/* Event Info */}
                  <div className="flex-1 mb-4 md:mb-0 md:pr-6">
                    {/* Category Tags */}
                    {categories.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {categories.map((category) => (
                          <span
                            key={category}
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              category === 'Free'
                                ? 'bg-green-100 text-green-700'
                                : category === 'Tech'
                                ? 'bg-blue-100 text-blue-700'
                                : category === 'Student'
                                ? 'bg-purple-100 text-purple-700'
                                : 'bg-orange-100 text-orange-700'
                            }`}
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    )}

                    <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                    <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>

                    {/* Event Details */}
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-start space-x-2">
                        <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>{formatDate(event.date)}</span>
                      </div>
                      <div className="flex items-start space-x-2">
                        <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                        <span>
                          {event.location.venue}, {event.location.suburb} {event.location.postcode}
                        </span>
                      </div>
                      {event.discount && (
                        <div className="flex items-start space-x-2">
                          <Tag className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                          <span className="text-green-600 font-medium">
                            {event.discount.description}
                            {event.discount.amount && ` - Save $${event.discount.amount}`}
                            {event.discount.percentage && event.discount.percentage < 100 && ` - Save ${event.discount.percentage}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <a
                      href={event.externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
                    >
                      <span>View on Eventbrite</span>
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>

                {/* Source Badge */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <span className="text-xs text-gray-500">
                    Source: {event.source === 'eventbrite' ? 'Eventbrite' : 'Mock Data'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
