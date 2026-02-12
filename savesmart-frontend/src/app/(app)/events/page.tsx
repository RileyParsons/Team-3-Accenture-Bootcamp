'use client';

import { useState, useEffect } from 'react';
import { Calendar, MapPin, Tag, ExternalLink, Loader2, Search } from 'lucide-react';
import { getEvents, Event } from '@/lib/api';

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [suburb, setSuburb] = useState('');
  const [postcode, setPostcode] = useState('');
  const [searchSuburb, setSearchSuburb] = useState('');
  const [searchPostcode, setSearchPostcode] = useState('');

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async (filterSuburb?: string, filterPostcode?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await getEvents(filterSuburb, filterPostcode);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
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
    loadEvents();
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
        <p className="text-gray-600">Discover events with deals and discounts near you</p>
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
                placeholder="Enter suburb"
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
                placeholder="Enter postcode"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={isLoading}
              className="flex items-center space-x-2 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
            >
              <Search className="h-5 w-5" />
              <span>Search</span>
            </button>
            {(searchSuburb || searchPostcode) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="px-6 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
              >
                Clear Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Active Filters */}
      {(searchSuburb || searchPostcode) && (
        <div className="mb-4 text-sm text-gray-600">
          Showing events for:{' '}
          {searchSuburb && <span className="font-medium">{searchSuburb}</span>}
          {searchSuburb && searchPostcode && ', '}
          {searchPostcode && <span className="font-medium">{searchPostcode}</span>}
        </div>
      )}

      {/* Events List */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No events found. Try adjusting your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {events.map((event) => (
            <div
              key={event.eventId}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                {/* Event Info */}
                <div className="flex-1 mb-4 md:mb-0">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{event.name}</h3>
                  <p className="text-gray-600 mb-4">{event.description}</p>

                  {/* Event Details */}
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-start space-x-2">
                      <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
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
                          {event.discount.percentage && ` - Save ${event.discount.percentage}%`}
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
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                  >
                    <span>View Details</span>
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
          ))}
        </div>
      )}
    </div>
  );
}
