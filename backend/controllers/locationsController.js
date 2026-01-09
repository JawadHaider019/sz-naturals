import axios from 'axios';

const GEOAPIFY_API_KEY = '2d3f1042c3f94233a2e3347a80ad8c27';

// Usage tracking
let apiRequests = 0;
const MONTHLY_LIMIT = 10000;

// ============================
// Hardcoded cities & ZIP codes (Primary Fallback)
// ============================
export const citiesData = {
  Punjab: [
    { city: "Lahore", zip: "54000" },
    { city: "Faisalabad", zip: "38000" },
    { city: "Rawalpindi", zip: "46000" },
    { city: "Gujranwala", zip: "52250" },
    { city: "Multan", zip: "60000" },
    { city: "Sargodha", zip: "40100" },
    { city: "Sialkot", zip: "51310" },
    { city: "Bahawalpur", zip: "63100" },
    { city: "Jhang", zip: "35000" },
    { city: "Sheikhupura", zip: "39350" },
    { city: "Gujrat", zip: "50700" },
    { city: "Sahiwal", zip: "57000" },
    { city: "Okara", zip: "56300" },
    { city: "Rahim Yar Khan", zip: "64200" },
    { city: "Kasur", zip: "54660" },
    { city: "Dera Ghazi Khan", zip: "32200" },
    { city: "Wah Cantonment", zip: "47040" },
    { city: "Burewala", zip: "59150" },
    { city: "Hafizabad", zip: "52110" },
    { city: "Chiniot", zip: "35450" },
    { city: "Jhelum", zip: "49600" },
    { city: "Kamoke", zip: "52770" },
    { city: "Khanewal", zip: "58200" },
    { city: "Sadiqabad", zip: "64350" },
    { city: "Muridke", zip: "39000" },
    { city: "Khanpur", zip: "61120" },
    { city: "Bahawalnagar", zip: "63100" },
    { city: "Muzaffargarh", zip: "34200" },
    { city: "Mandi Bahauddin", zip: "50300" },
    { city: "Daska", zip: "51310" },
    { city: "Pakpattan", zip: "57400" },
    { city: "Chakwal", zip: "48800" },
    { city: "Gojra", zip: "36120" },
    { city: "Vehari", zip: "61100" },
    { city: "Ahmedpur East", zip: "63140" },
    { city: "Chishtian", zip: "64350" },
    { city: "Samundri", zip: "36100" },
    { city: "Ferozewala", zip: "40150" },
    { city: "Attock", zip: "43600" },
    { city: "Jaranwala", zip: "37250" },
    { city: "Hasilpur", zip: "63150" },
    { city: "Kamalia", zip: "36300" },
    { city: "Kot Abdul Malik", zip: "56100" },
    { city: "Arif Wala", zip: "57350" },
    { city: "Gujranwala Cantonment", zip: "52260" },
    { city: "Jampur", zip: "33100" },
    { city: "Jatoi", zip: "34400" },
    { city: "Wazirabad", zip: "52000" },
    { city: "Layyah", zip: "31200" },
    { city: "Shujabad", zip: "59250" },
    { city: "Haroonabad", zip: "61120" },
    { city: "Jalalpur Jattan", zip: "52370" },
    { city: "Lodhran", zip: "59300" },
    { city: "Kot Addu", zip: "32220" },
    { city: "Mian Channu", zip: "58000" },
    { city: "Khushab", zip: "40350" },
    { city: "Rajanpur", zip: "33500" },
    { city: "Taxila", zip: "47080" },
    { city: "Bhakkar", zip: "30100" },
    { city: "Narowal", zip: "51800" },
    { city: "Mianwali", zip: "42200" },
    { city: "Shakargarh", zip: "51600" },
    { city: "Mailsi", zip: "61200" },
    { city: "Dipalpur", zip: "57410" },
    { city: "Haveli Lakha", zip: "56150" },
    { city: "Lalamusa", zip: "50760" },
    { city: "Sambrial", zip: "51320" },
    { city: "Bhalwal", zip: "50590" },
    { city: "Taunsa", zip: "32100" },
    { city: "Phool Nagar", zip: "55230" },
    { city: "Pattoki", zip: "57300" },
    { city: "Jauharabad", zip: "41200" },
    { city: "Chichawatni", zip: "57110" },
    { city: "Farooqabad", zip: "39500" },
    { city: "Sangla Hill", zip: "51620" },
    { city: "Gujar Khan", zip: "47650" },
    { city: "Kharian", zip: "50200" },
    { city: "Pasrur", zip: "51400" },
    { city: "Kot Radha Kishan", zip: "54710" },
    { city: "Ludhewala Waraich", zip: "52380" },
    { city: "Renala Khurd", zip: "56200" }
  ],
  Sindh: [
    { city: "Karachi", zip: "74200" },
    { city: "Hyderabad", zip: "71000" },
    { city: "Sukkur", zip: "65200" },
    { city: "Larkana", zip: "77150" },
    { city: "Nawabshah", zip: "67450" },
    { city: "Mirpur Khas", zip: "69000" },
    { city: "Khairpur", zip: "66100" },
    { city: "Jacobabad", zip: "79000" },
    { city: "Dadu", zip: "76300" },
    { city: "Thatta", zip: "73000" },
    { city: "Sanghar", zip: "68000" },
    { city: "Shikarpur", zip: "78100" },
    { city: "Umerkot", zip: "69230" },
    { city: "Jamshoro", zip: "76080" },
    { city: "Badin", zip: "71050" },
    { city: "Tando Adam", zip: "70050" },
    { city: "Tando Allahyar", zip: "70060" },
    { city: "Kotri", zip: "71020" },
    { city: "Ghotki", zip: "65000" },
    { city: "Kamber", zip: "78300" },
    { city: "Sakrand", zip: "67450" },
  ],
  "Khyber Pakhtunkhwa": [
    { city: "Peshawar", zip: "25000" },
    { city: "Mardan", zip: "23200" },
    { city: "Swat", zip: "19130" },
    { city: "Abbottabad", zip: "22010" },
    { city: "Dera Ismail Khan", zip: "29200" },
    { city: "Charsadda", zip: "24650" },
    { city: "Nowshera", zip: "24120" },
    { city: "Bannu", zip: "28100" },
    { city: "Kohat", zip: "26000" },
    { city: "Chitral", zip: "17200" },
    { city: "Mingora", zip: "19130" },
    { city: "Haripur", zip: "22620" },
    { city: "Swabi", zip: "23560" },
  ],
  Balochistan: [
    { city: "Quetta", zip: "87300" },
    { city: "Turbat", zip: "85500" },
    { city: "Gwadar", zip: "91200" },
    { city: "Khuzdar", zip: "89300" },
    { city: "Sibi", zip: "82100" },
    { city: "Zhob", zip: "89000" },
    { city: "Kalat", zip: "85100" },
    { city: "Chaman", zip: "86000" },
  ],
};
// ============================
// Helper Functions
// ============================
const normalizeText = (text) => {
  return text?.toString().toLowerCase().trim().replace(/\s+/g, ' ') || '';
};

const findCityInState = (city, state) => {
  const normalizedCity = normalizeText(city);
  const normalizedState = normalizeText(state);
  
  const stateData = citiesData[Object.keys(citiesData).find(
    s => normalizeText(s) === normalizedState
  )];
  
  if (!stateData) return null;
  
  return stateData.find(c => 
    normalizeText(c.city) === normalizedCity ||
    normalizeText(c.city).includes(normalizedCity) ||
    normalizedCity.includes(normalizeText(c.city))
  );
};

const validateZipCodeLocal = (zipCode, city, state) => {
  const cityData = findCityInState(city, state);
  if (!cityData) return false;
  
  return cityData.zip === zipCode.toString();
};

const getCitiesForState = (state) => {
  const normalizedState = normalizeText(state);
  const stateKey = Object.keys(citiesData).find(
    s => normalizeText(s) === normalizedState
  );
  
  return stateKey ? citiesData[stateKey] : [];
};

// ============================
// Enhanced City and ZIP Code Validation
// ============================
export const validateCityAndZipCode = async (req, res) => {
  try {
    const { city, state, zipCode, country = 'Pakistan' } = req.body;

    console.log('📍 Validation request received:', { city, state, zipCode, country });

    if (!city || !state) {
      return res.status(400).json({ 
        success: false, 
        message: 'City and state are required' 
      });
    }

    // Step 1: Try local validation first (from hardcoded data)
    const localCityValidation = validateCityLocal(city, state);
    
    // Step 2: If local validation fails or needs enhancement, use API
    let apiCityValidation = null;
    if (!localCityValidation.isValid) {
      apiCityValidation = await validateCityInState(city, state, country);
    }

    // Step 3: ZIP code validation
    let zipValidation = null;
    if (zipCode) {
      const localZipValid = validateZipCodeLocal(zipCode, city, state);
      zipValidation = {
        isValid: localZipValid,
        source: 'Local Database',
        message: localZipValid ? 
          `ZIP code ${zipCode} is valid for ${city}` : 
          `ZIP code ${zipCode} not found for ${city}`
      };
      
      // If local validation fails, try API
      if (!localZipValid) {
        const apiZipValidation = await validateZipCode(zipCode, city, state, country);
        if (apiZipValidation.isValid) {
          zipValidation = apiZipValidation;
        }
      }
    }

    // Combine validations - prefer local over API when available
    const finalCityValidation = localCityValidation.isValid ? localCityValidation : apiCityValidation;
    const isValid = finalCityValidation?.isValid && (!zipCode || zipValidation?.isValid);

    const result = {
      isValid: !!isValid,
      cityValidation: finalCityValidation || localCityValidation,
      zipValidation,
      message: getValidationMessage(finalCityValidation || localCityValidation, zipValidation)
    };

    console.log('✅ Validation result:', result);

    res.json({
      success: true,
      data: result,
      sources: {
        city: finalCityValidation?.source || localCityValidation.source,
        zip: zipValidation?.source || 'Not applicable'
      },
      usage: { 
        monthlyUsed: apiRequests, 
        monthlyRemaining: MONTHLY_LIMIT - apiRequests 
      }
    });

  } catch (error) {
    console.error('❌ Error in validateCityAndZipCode:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to validate location', 
      error: error.message,
      details: error.response?.data 
    });
  }
};

// ============================
// Local City Validation (Hardcoded Data)
// ============================
const validateCityLocal = (city, state) => {
  const cityData = findCityInState(city, state);
  
  if (cityData) {
    return {
      isValid: true,
      city: cityData.city,
      state: state,
      zipCode: cityData.zip,
      confidence: 100,
      source: 'Local Database',
      message: `City "${cityData.city}" found in ${state}`,
      verified: true
    };
  }
  
  return {
    isValid: false,
    confidence: 0,
    source: 'Local Database',
    message: `City "${city}" not found in ${state}`
  };
};

// ============================
// API-based City Validation (Fallback)
// ============================
const validateCityInState = async (city, state, country) => {
  try {
    if (apiRequests >= MONTHLY_LIMIT) {
      return {
        isValid: false,
        confidence: 0,
        message: 'API limit reached',
        source: 'Geoapify API (Limit Exceeded)'
      };
    }

    const searchQuery = `${city}, ${state}, ${country}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=10`;

    console.log(`🔍 API Validating city: "${city}" in state: "${state}"`);

    const response = await axios.get(url, { timeout: 10000 });
    apiRequests++;

    if (response.data?.features?.length > 0) {
      const matchingCities = response.data.features.filter(feature => {
        const props = feature.properties;
        const isPakistan = props.country === 'Pakistan';
        const stateMatch = props.state?.toLowerCase().includes(state.toLowerCase());
        const cityMatch = props.city?.toLowerCase().includes(city.toLowerCase()) || 
                         props.name?.toLowerCase().includes(city.toLowerCase());
        
        return isPakistan && stateMatch && cityMatch;
      });

      if (matchingCities.length > 0) {
        const bestMatch = matchingCities[0].properties;
        return {
          isValid: true,
          city: bestMatch.city || bestMatch.name,
          state: bestMatch.state,
          zipCode: bestMatch.postcode,
          confidence: Math.round((bestMatch.rank?.confidence || 0) * 100),
          coordinates: bestMatch.lat && bestMatch.lon ? {
            latitude: bestMatch.lat,
            longitude: bestMatch.lon
          } : null,
          message: `Location "${bestMatch.city || bestMatch.name}" found in ${bestMatch.state}`,
          source: 'Geoapify API',
          verified: bestMatch.rank?.confidence > 0.7
        };
      }
    }

    return {
      isValid: false,
      confidence: 0,
      message: `City "${city}" not found in ${state}`,
      source: 'Geoapify API'
    };

  } catch (error) {
    console.error('❌ API Error validating city:', error.message);
    return {
      isValid: false,
      confidence: 0,
      message: 'City validation service unavailable',
      source: 'API Error'
    };
  }
};

// ============================
// Enhanced Get Cities with Hardcoded Data Primary
// ============================
export const getCities = async (req, res) => {
  try {
    const { state, search, country = 'Pakistan' } = req.query;

    console.log('🏙️ Get cities request:', { state, search, country });

    if (!state) {
      return res.status(400).json({
        success: false,
        message: 'State parameter is required'
      });
    }

    // Get cities from hardcoded database first
    const localCities = getCitiesForState(state);
    
    let filteredCities = localCities.map(cityData => ({
      name: cityData.city,
      state: state,
      zipCode: cityData.zip,
      source: 'Local Database',
      confidence: 100,
      verified: true
    }));

    // Apply search filter if provided
    if (search && search.trim().length > 0) {
      const searchTerm = normalizeText(search);
      filteredCities = filteredCities.filter(city => 
        normalizeText(city.name).includes(searchTerm)
      );
    }

    // If no local results found and under API limit, try API
    if (filteredCities.length === 0 && apiRequests < MONTHLY_LIMIT) {
      const apiCities = await getCitiesFromAPI(state, search, country);
      filteredCities = apiCities;
    }

    console.log(`✅ Returning ${filteredCities.length} cities for ${state}`);

    res.json({
      success: true,
      data: {
        state: state,
        cities: filteredCities,
        count: filteredCities.length,
        sources: filteredCities.length > 0 ? [filteredCities[0].source] : ['No data'],
        searchTerm: search || null,
        fromLocalDatabase: filteredCities.length > 0 && filteredCities[0].source === 'Local Database'
      },
      usage: {
        monthlyUsed: apiRequests,
        monthlyRemaining: MONTHLY_LIMIT - apiRequests
      }
    });

  } catch (error) {
    console.error('❌ Error in getCities:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cities',
      error: error.message,
      details: error.response?.data
    });
  }
};

// ============================
// API-based Cities Fetch (Fallback)
// ============================
const getCitiesFromAPI = async (state, search, country) => {
  try {
    let searchQuery = `${state}, ${country}`;
    if (search && search.trim().length > 0) {
      searchQuery = `${search}, ${state}, ${country}`;
    }

    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=50`;

    const response = await axios.get(url, { timeout: 10000 });
    apiRequests++;

    if (response.data?.features?.length > 0) {
      return response.data.features
        .filter(feature => {
          const props = feature.properties;
          return props.country === 'Pakistan' && 
                 props.state?.toLowerCase().includes(state.toLowerCase()) &&
                 (props.city || props.name);
        })
        .map(feature => {
          const props = feature.properties;
          return {
            name: props.city || props.name,
            state: props.state,
            zipCode: props.postcode || 'N/A',
            latitude: props.lat,
            longitude: props.lon,
            confidence: Math.round((props.rank?.confidence || 0) * 100),
            source: 'Geoapify API',
            verified: props.rank?.confidence > 0.7
          };
        })
        .filter((city, index, self) => 
          index === self.findIndex(c => c.name === city.name)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return [];
  } catch (error) {
    console.error('❌ API Error fetching cities:', error.message);
    return [];
  }
};

// ============================
// Enhanced City Suggestions with Hardcoded Data Primary
// ============================
export const getCitySuggestions = async (req, res) => {
  try {
    const { state, query, limit = 10, country = 'Pakistan' } = req.query;

    console.log('💡 City suggestions request:', { state, query, limit });

    if (!state || !query) {
      return res.status(400).json({
        success: false,
        message: 'State and query parameters are required'
      });
    }

    const searchTerm = query.trim();
    if (searchTerm.length === 0) {
      return res.json({
        success: true,
        data: {
          state: state,
          suggestions: [],
          count: 0,
          query: query
        }
      });
    }

    // Get suggestions from hardcoded database first
    const localCities = getCitiesForState(state);
    let suggestions = localCities
      .filter(cityData => 
        normalizeText(cityData.city).includes(normalizeText(searchTerm))
      )
      .map(cityData => ({
        name: cityData.city,
        zipCode: cityData.zip,
        state: state,
        display: `${cityData.city} (${cityData.zip})`,
        confidence: 100,
        source: 'Local Database',
        verified: true
      }))
      .slice(0, parseInt(limit));

    // If no local suggestions and under API limit, try API
    if (suggestions.length === 0 && apiRequests < MONTHLY_LIMIT) {
      const apiSuggestions = await getCitySuggestionsFromAPI(state, query, limit, country);
      suggestions = apiSuggestions;
    }

    console.log(`💡 Found ${suggestions.length} suggestions for "${query}" in ${state}`);

    res.json({
      success: true,
      data: {
        state: state,
        suggestions: suggestions,
        count: suggestions.length,
        query: query,
        hasMore: suggestions.length === parseInt(limit),
        fromLocalDatabase: suggestions.length > 0 && suggestions[0].source === 'Local Database'
      },
      usage: {
        monthlyUsed: apiRequests,
        monthlyRemaining: MONTHLY_LIMIT - apiRequests
      }
    });

  } catch (error) {
    console.error('❌ Error in getCitySuggestions:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to fetch city suggestions',
      error: error.message,
      details: error.response?.data
    });
  }
};

// ============================
// API-based City Suggestions (Fallback)
// ============================
const getCitySuggestionsFromAPI = async (state, query, limit, country) => {
  try {
    const searchQuery = `${query}, ${state}, ${country}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=20`;

    const response = await axios.get(url, { timeout: 10000 });
    apiRequests++;

    if (response.data?.features?.length > 0) {
      return response.data.features
        .filter(feature => {
          const props = feature.properties;
          return props.country === 'Pakistan' && 
                 props.state?.toLowerCase().includes(state.toLowerCase()) &&
                 (props.city || props.name);
        })
        .map(feature => {
          const props = feature.properties;
          return {
            name: props.city || props.name,
            zipCode: props.postcode || 'N/A',
            state: props.state,
            display: `${props.city || props.name}${props.postcode ? ` (${props.postcode})` : ''}`,
            confidence: Math.round((props.rank?.confidence || 0) * 100),
            source: 'Geoapify API',
            verified: props.rank?.confidence > 0.7
          };
        })
        .filter((suggestion, index, self) => 
          index === self.findIndex(s => s.name === suggestion.name)
        )
        .slice(0, parseInt(limit));
    }

    return [];
  } catch (error) {
    console.error('❌ API Error fetching suggestions:', error.message);
    return [];
  }
};

// ============================
// Enhanced ZIP Code Information with Hardcoded Data Primary
// ============================
export const getZipCodeInfo = async (req, res) => {
  try {
    const { zipCode } = req.params;

    console.log('📮 Get ZIP code info request:', { zipCode });

    if (!zipCode) {
      return res.status(400).json({
        success: false,
        message: 'ZIP code parameter is required'
      });
    }

    // Search in hardcoded database first
    const localLocations = [];
    Object.keys(citiesData).forEach(state => {
      citiesData[state].forEach(cityData => {
        if (cityData.zip === zipCode.toString()) {
          localLocations.push({
            zipCode: zipCode,
            city: cityData.city,
            state: state,
            source: 'Local Database',
            confidence: 100,
            verified: true
          });
        }
      });
    });

    let locations = localLocations;

    // If no local results and under API limit, try API
    if (locations.length === 0 && apiRequests < MONTHLY_LIMIT) {
      const apiLocations = await getZipCodeInfoFromAPI(zipCode);
      locations = apiLocations;
    }

    console.log(`✅ Found ${locations.length} locations for ZIP ${zipCode}`);

    res.json({
      success: true,
      data: {
        zipCode: zipCode,
        locations: locations,
        count: locations.length,
        sources: locations.length > 0 ? [locations[0].source] : ['No data found'],
        fromLocalDatabase: locations.length > 0 && locations[0].source === 'Local Database'
      },
      usage: {
        monthlyUsed: apiRequests,
        monthlyRemaining: MONTHLY_LIMIT - apiRequests
      }
    });

  } catch (error) {
    console.error('❌ Error in getZipCodeInfo:', error.response?.data || error.message);
    
    res.status(500).json({
      success: false,
      message: 'Failed to get ZIP code information',
      error: error.response?.data?.message || error.message
    });
  }
};

// ============================
// API-based ZIP Code Info (Fallback)
// ============================
const getZipCodeInfoFromAPI = async (zipCode) => {
  try {
    const searchQuery = `${zipCode}, Pakistan`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=20`;

    const response = await axios.get(url, { timeout: 10000 });
    apiRequests++;

    if (response.data?.features?.length > 0) {
      return response.data.features
        .filter(feature => feature.properties.country === 'Pakistan')
        .map(feature => {
          const props = feature.properties;
          return {
            zipCode: props.postcode,
            city: props.city || props.name,
            state: props.state,
            area: props.suburb || props.district,
            fullAddress: props.formatted,
            latitude: props.lat,
            longitude: props.lon,
            confidence: Math.round((props.rank?.confidence || 0) * 100),
            source: 'Geoapify API',
            verified: props.rank?.confidence > 0.7
          };
        })
        .filter(location => location.confidence > 10);
    }

    return [];
  } catch (error) {
    console.error('❌ API Error fetching ZIP info:', error.message);
    return [];
  }
};

// ============================
// Get All Pakistan States from Hardcoded Data
// ============================
export const getPakistanStates = (req, res) => {
  const states = Object.keys(citiesData).map(state => ({
    name: state,
    cityCount: citiesData[state].length,
    sampleCities: citiesData[state].slice(0, 5).map(c => c.city)
  }));

  res.json({
    success: true,
    data: {
      states: states,
      totalStates: states.length,
      totalCities: Object.values(citiesData).reduce((sum, stateCities) => sum + stateCities.length, 0),
      source: 'Local Database'
    }
  });
};

// ============================
// Get Validation Message
// ============================
const getValidationMessage = (cityValidation, zipValidation) => {
  if (!cityValidation?.isValid) {
    return `Invalid city: ${cityValidation?.message || 'City not found'}`;
  }
  
  if (zipValidation && !zipValidation.isValid) {
    return `City validated but ZIP code issue: ${zipValidation.message}`;
  }
  
  if (cityValidation.isValid && (!zipValidation || zipValidation.isValid)) {
    return 'Location validated successfully';
  }
  
  return 'Please verify your location details';
};

// ============================
// Validate ZIP Code (API Fallback)
// ============================
const validateZipCode = async (zipCode, city, state, country) => {
  try {
    const searchQuery = `${zipCode}, ${city}, ${state}, ${country}`;
    const encodedQuery = encodeURIComponent(searchQuery);
    const url = `https://api.geoapify.com/v1/geocode/search?text=${encodedQuery}&apiKey=${GEOAPIFY_API_KEY}&limit=10`;

    const response = await axios.get(url, { timeout: 10000 });
    apiRequests++;

    if (response.data?.features?.length > 0) {
      const matchingLocations = response.data.features.filter(feature => {
        const props = feature.properties;
        const isPakistan = props.country === 'Pakistan';
        const zipMatch = props.postcode === zipCode.toString();
        const cityMatch = props.city?.toLowerCase().includes(city.toLowerCase()) ||
                         props.name?.toLowerCase().includes(city.toLowerCase());
        
        return isPakistan && zipMatch && cityMatch;
      });

      if (matchingLocations.length > 0) {
        const bestMatch = matchingLocations[0].properties;
        return {
          isValid: true,
          zipCode: bestMatch.postcode,
          city: bestMatch.city || bestMatch.name,
          state: bestMatch.state,
          confidence: Math.round((bestMatch.rank?.confidence || 0) * 100),
          message: `ZIP code ${zipCode} validated for ${bestMatch.city || bestMatch.name}`,
          source: 'Geoapify API'
        };
      }
    }

    return {
      isValid: false,
      confidence: 0,
      message: `ZIP code ${zipCode} not found for ${city} in ${state}`,
      source: 'Geoapify API'
    };

  } catch (error) {
    console.error('❌ Error validating ZIP code:', error.message);
    return {
      isValid: false,
      confidence: 0,
      message: 'ZIP code validation service unavailable',
      source: 'API Error'
    };
  }
};

// ============================
// Get API Usage Statistics
// ============================
export const getUsage = (req, res) => {
  res.json({
    success: true,
    data: {
      monthlyUsed: apiRequests,
      monthlyRemaining: MONTHLY_LIMIT - apiRequests,
      monthlyLimit: MONTHLY_LIMIT,
      utilization: ((apiRequests / MONTHLY_LIMIT) * 100).toFixed(2) + '%'
    }
  });
};