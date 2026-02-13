# Meetup.com API Analysis

## Summary

✅ **Meetup.com DOES support event search via their GraphQL API**

Unlike Eventbrite (which shut down public search in 2019), Meetup.com maintains an active GraphQL API with event search capabilities.

## Key Features

### 1. GraphQL API
- **Endpoint**: `https://api.meetup.com/gql-ext`
- **Authentication**: OAuth 2.0 Bearer token
- **Format**: GraphQL queries (more flexible than REST)

### 2. Event Search Capabilities

Based on the API documentation, Meetup supports:

#### For Pro Network Members:
```graphql
query($urlname: ID!) {
  proNetwork(urlname: $urlname) {
    eventsSearch(input: {
      first: 10,
      filter: { status: "UPCOMING" }
    }) {
      totalCount
      edges {
        node {
          id
          title
          description
          dateTime
          duration
          eventUrl
          group {
            name
            urlname
          }
          venue {
            name
            city
            lat
            lng
          }
        }
      }
    }
  }
}
```

#### For Public Events:
- `rankedEvents` query - Returns events based on user location
- Location-based search using lat/lng coordinates
- Category filtering (tech events = category 34)
- Distance-based filtering

### 3. Data Available

Events include:
- ✅ Title, description
- ✅ Date and time
- ✅ Duration
- ✅ Venue details (name, address, coordinates)
- ✅ Group information
- ✅ RSVP counts
- ✅ Event URL
- ✅ Photos
- ✅ Host information

## API Access Requirements

### Standard Access (Free)
- Create a Meetup account
- Register an OAuth application
- Get OAuth token
- **Limitation**: May only access events from groups you manage or Pro Networks you belong to

### Meetup Pro (Paid - Required for Full Access)
- **Cost**: Paid subscription required
- **Benefits**:
  - Full API access
  - Search public events across all groups
  - Access to attendee emails
  - Advanced analytics
  - Custom attendance forms

## Important Considerations

### 1. API Access Restrictions
From the documentation: *"API access and more with Meetup Pro"*

This suggests that **full public event search may require a Meetup Pro subscription**, similar to Eventbrite's restrictions.

### 2. Rate Limiting
- 500 points per 60 seconds
- Queries consume different point amounts
- Rate limit errors include reset time

### 3. Authentication
```bash
curl -X POST https://api.meetup.com/gql-ext \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{"query": "..."}'
```

## Comparison: Meetup vs Eventbrite

| Feature | Meetup.com | Eventbrite |
|---------|-----------|------------|
| Public Event Search | ✅ Yes (with Pro) | ❌ Deprecated (2019) |
| API Type | GraphQL | REST |
| Free Tier | Limited | Own events only |
| Paid Tier | Pro subscription | Distribution partner |
| Location Search | ✅ Yes | ❌ No |
| Category Filter | ✅ Yes | ❌ No |
| Active Development | ✅ Yes (2025 update) | ⚠️ Limited |

## Recommendation for SaveSmart

### Option 1: Meetup Pro Subscription (Best for Production)
**Pros:**
- Full public event search
- Location-based filtering (Melbourne)
- Category filtering (tech events)
- Active API with good documentation
- GraphQL flexibility

**Cons:**
- Requires paid subscription
- Cost may be prohibitive for MVP
- Need to verify Australian event coverage

### Option 2: Free Meetup API (Limited)
**Pros:**
- Free to use
- Can access events from groups you manage
- Good for testing

**Cons:**
- Cannot search public events from other groups
- Limited usefulness for event discovery app

### Option 3: Mock Data (Current - Recommended for MVP)
**Pros:**
- ✅ Already implemented
- ✅ No API costs
- ✅ No rate limits
- ✅ Realistic Melbourne event data
- ✅ Full control over data quality

**Cons:**
- Not real-time data
- Requires manual updates

## Next Steps

### To Test Meetup API:

1. **Create Meetup Account**
   - Go to https://www.meetup.com
   - Sign up for free account

2. **Register OAuth Application**
   - Visit https://secure.meetup.com/meetup_api/oauth_consumers/
   - Create new OAuth consumer
   - Get Client ID and Client Secret

3. **Get OAuth Token**
   - Follow OAuth 2.0 flow
   - Get Bearer token for API requests

4. **Test with Free Tier**
   - Try querying events from groups you join
   - Determine if Pro subscription is needed

5. **Evaluate Coverage**
   - Check if Melbourne has sufficient Meetup events
   - Compare with Eventbrite event coverage
   - Assess data quality

## Code Integration Estimate

If you decide to integrate Meetup API:

**Effort**: ~4-6 hours
- GraphQL client setup
- OAuth authentication flow
- Query construction for event search
- Response transformation to SaveSmart Event model
- Location filtering (Melbourne)
- Category filtering (tech/student events)
- Error handling and fallback
- Testing

**Complexity**: Medium
- GraphQL is more complex than REST
- OAuth flow requires additional setup
- Need to handle pagination (cursor-based)

## Conclusion

**Meetup.com API is viable but likely requires a paid Pro subscription for public event search.**

For your MVP, I recommend:
1. **Continue using mock data** - It's working well and costs nothing
2. **Document Meetup as future enhancement** - Can integrate when budget allows
3. **Consider hybrid approach** - Use mock data + manually curated real events
4. **Explore other free APIs** - Facebook Events, local event aggregators

The current implementation with graceful fallback is production-ready and provides a good user experience.
