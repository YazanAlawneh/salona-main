import React, {useEffect, useState, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Image,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import styles from './Explore.styles';
import Colors from '../../../constants/Colors';
import SearchBarWithMenu from '../../../components/SearchBarWithMenu/SearchBarWithMenu';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useGetAllSalonsQuery} from '../../../redux/api/salonApi';
import {Salon} from '../../../types/salon';
import Footer from '../../../components/Footer/Footer';
import {SalonQueryParams} from '../../../redux/api/salonApi';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useTranslation} from '../../../contexts/TranslationContext';
import {GOOGLE_MAPS_API_KEY} from '@env';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useGuestMode} from '../../../contexts/GuestModeContext';
const {width} = Dimensions.get('window');

interface NearbySalon {
  id: number;
  name: string;
  description: string;
  salon_latitude: string;
  salon_longitude: string;
  distance: number;
  image_url: string | null;
  rating_avg: any;
  travelTime?: string;
}

interface NearbySalonsResponse {
  success: boolean;
  salons: NearbySalon[];
}

const ExploreScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const {t, isRTL} = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<
    'most_popular' | 'rated_review' | 'cost_low_to_high'
  >('most_popular');
  const [priceRange, setPriceRange] = useState<string | undefined>();
  const [isGridView, setIsGridView] = useState(false);
  const [rating, setRating] = useState<number | undefined>();
  const [categories, setCategories] = useState<string[] | undefined>();
  const [categoryNames, setCategoryNames] = useState<string[] | undefined>();
  const [nearbySalons, setNearbySalons] = useState<NearbySalon[]>([]);
  const {isGuestMode, exitToLogin, exitToSignup} = useGuestMode();
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Handle filters from the Filter screen
  useEffect(() => {
    if (route.params?.filters) {
      const {price_range, sort_by, rating, categories, search, categoryNames} =
        route.params.filters;
      if (price_range) setPriceRange(price_range);
      if (sort_by) setSortBy(sort_by as typeof sortBy);
      if (rating) setRating(rating);
      if (search) setSearchQuery(search);

      // Handle category names and IDs separately
      if (categoryNames && categoryNames.length > 0) {
        // Set display names
        setCategoryNames(categoryNames);
        // Keep the original category IDs for API calls
        if (categories && categories.length > 0) {
          setCategories(categories);
        }
      } else if (categories && categories.length > 0) {
        // Fallback to category IDs
        setCategories(categories);
      }
    }
  }, [route.params?.filters]);

  // Combine all query parameters
  const queryParams: SalonQueryParams = {
    ...(searchQuery && {search: searchQuery}),
    // ...(sortBy && { sort_by: sortBy }),
    // ...(priceRange && { price_range: priceRange }),
    ...(rating && {rating}),
    ...(categories && categories.length > 0 && {category_id: categories[0]}),
  };

  console.log('API Query Parameters:', queryParams);
  console.log('Categories state:', categories);
  console.log('Category Names state:', categoryNames);
  console.log('Search Query state:', searchQuery);

  // Use the combined parameters in the API call
  const {
    data: salonsData,
    isLoading,
    error,
  } = useGetAllSalonsQuery(queryParams);

  // Log API response
  useEffect(() => {
    if (salonsData) {
      console.log('API Responseee:', {
        total_salons: salonsData.salons?.length,
        salons: salonsData.salons,
        salonsData: salonsData,
      });
    }
    if (error) {
      console.error('API Error:', error);
    }
  }, [salonsData, error]);

  const getCurrentLocation = async () => {
    try {
      console.log('🔍 [DEBUG] [ExploreScreen] Starting location fetch...');
      console.log('🔍 [DEBUG] [ExploreScreen] Google Maps API Key available:', !!GOOGLE_MAPS_API_KEY);
      
      const response = await fetch(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_MAPS_API_KEY}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            considerIp: true,
          }),
        },
      );

      console.log('🔍 [DEBUG] [ExploreScreen] Location API response status:', response.status);
      const data = await response.json();
      console.log('🔍 [DEBUG] [ExploreScreen] Location API response data:', data);

      if (data.location) {
        console.log('✅ [DEBUG] [ExploreScreen] Location obtained from Google Geolocation API:', {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy,
        });

        setCurrentLocation(data.location);
        fetchNearbySalons(data.location.lat, data.location.lng);
      } else {
        console.error('❌ [DEBUG] [ExploreScreen] Failed to get location from Google Geolocation API');
        console.error('❌ [DEBUG] [ExploreScreen] Response data:', data);
      }
    } catch (error) {
      console.error('❌ [DEBUG] [ExploreScreen] Error getting location:', error);
    }
  };

  const fetchNearbySalons = async (latitude: number, longitude: number) => {
    try {
      console.log('🔍 [DEBUG] [ExploreScreen] Starting nearby salons fetch...');
      console.log('🔍 [DEBUG] [ExploreScreen] Coordinates:', { latitude, longitude });
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 [DEBUG] [ExploreScreen] Token available:', !!token);

      const nearbySalonsUrl = `https://bella-glam.com/api/nearby-salons?latitude=${latitude}&longitude=${longitude}&radius=1000000`;
      console.log('🔍 [DEBUG] [ExploreScreen] Nearby salons URL:', nearbySalonsUrl);

      const response = await fetch(nearbySalonsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log('🔍 [DEBUG] [ExploreScreen] Nearby salons API response status:', response.status);
      const data: NearbySalonsResponse = await response.json();
      console.log('🔍 [DEBUG] [ExploreScreen] Nearby salons API response:', data);

      if (data.success) {
        console.log('✅ [DEBUG] [ExploreScreen] Successfully fetched nearby salons:', data.salons.length);
        console.log('🔍 [DEBUG] [ExploreScreen] Nearby salons data:', data.salons);
        
        // Get travel times for each salon
        console.log('🔍 [DEBUG] [ExploreScreen] Starting travel time calculation for', data.salons.length, 'salons...');
        const salonsWithTravelTime = await Promise.all(
          data.salons.map(async (salon, index) => {
            try {
              console.log(`🔍 [DEBUG] [ExploreScreen] Processing salon ${index + 1}/${data.salons.length}:`, salon.name);
              console.log(`🔍 [DEBUG] [ExploreScreen] Salon coordinates:`, { 
                lat: salon.salon_latitude, 
                lng: salon.salon_longitude 
              });
              
              const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latitude},${longitude}&destinations=${salon.salon_latitude},${salon.salon_longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
              console.log(`🔍 [DEBUG] [ExploreScreen] Distance matrix URL for ${salon.name}:`, distanceMatrixUrl);
              
              const distanceResponse = await fetch(distanceMatrixUrl);
              console.log(`🔍 [DEBUG] [ExploreScreen] Distance matrix response status for ${salon.name}:`, distanceResponse.status);
              
              const distanceData = await distanceResponse.json();
              console.log(`🔍 [DEBUG] [ExploreScreen] Distance matrix data for ${salon.name}:`, distanceData);

              if (distanceData.rows[0]?.elements[0]?.duration?.text) {
                const travelTime = distanceData.rows[0].elements[0].duration.text;
                console.log(`✅ [DEBUG] [ExploreScreen] Travel time for ${salon.name}:`, travelTime);
                return {
                  ...salon,
                  travelTime: travelTime,
                };
              } else {
                console.log(`⚠️ [DEBUG] [ExploreScreen] No travel time data for ${salon.name}`);
                return salon;
              }
            } catch (error) {
              console.error(`❌ [DEBUG] [ExploreScreen] Error fetching travel time for ${salon.name}:`, error);
              return salon;
            }
          }),
        );

        console.log('✅ [DEBUG] [ExploreScreen] Final nearby salons with travel time:', salonsWithTravelTime);
        setNearbySalons(salonsWithTravelTime);
      } else {
        console.error('❌ [DEBUG] [ExploreScreen] Failed to fetch nearby salons');
        console.error('❌ [DEBUG] [ExploreScreen] Response data:', data);
      }
    } catch (error) {
      console.error('❌ [DEBUG] [ExploreScreen] Error fetching nearby salons:', error);
    }
  };

  useEffect(() => {
    getCurrentLocation();
  }, []);

  const handleSearch = (text: string) => {
    setSearchQuery(text);
  };

  const handleFilterPress = () => {
    navigation.navigate('FilterScreen');
  };

  const handleSortPress = () => {
    // Cycle through sort options
    const sortOptions: Array<
      'most_popular' | 'rated_review' | 'cost_low_to_high'
    > = ['most_popular', 'rated_review', 'cost_low_to_high'];
    const currentIndex = sortOptions.indexOf(sortBy);
    const nextIndex = (currentIndex + 1) % sortOptions.length;
    setSortBy(sortOptions[nextIndex]);
  };

  const getSortByText = () => {
    switch (sortBy) {
      case 'most_popular':
        return t.explore.sortBy.mostPopular;
      case 'rated_review':
        return t.explore.sortBy.topRated;
      case 'cost_low_to_high':
        return t.explore.sortBy.priceLowToHigh;
      default:
        return t.explore.sortBy.default;
    }
  };

  const handleViewToggle = () => {
    setIsGridView(!isGridView);
  };

  const handleCardPress = (salon: Salon) => {
    console.log(`${salon.name} card pressed`);
    navigation.navigate('SalonProfileScreen', {
      salon,
      initialTab: route.params?.filters?.initialTab || 'Services',
    });
  };

  const handleMenuPress = () => {
    console.log('Menu button pressed');
  };

  // Calculate average rating for a salon
  const getAverageRating = (salon: Salon) => {
    if (!salon.ratings_received || salon.ratings_received.length === 0) {
      return 0;
    }

    const sum = salon.ratings_received.reduce(
      (acc, rating) => acc + rating.rate,
      0,
    );
    return sum / salon.ratings_received.length;
  };

  // Map salons with distance and travel time information
  const mappedSalons = useMemo(() => {
    console.log('🔍 [DEBUG] [ExploreScreen] Mapping salons...');
    console.log('🔍 [DEBUG] [ExploreScreen] salonsData:', salonsData);
    console.log('🔍 [DEBUG] [ExploreScreen] salonsData.salons:', salonsData?.salons);

    if (!salonsData?.salons) {
      console.log('⚠️ [DEBUG] [ExploreScreen] No salons data available');
      return [];
    }

    console.log('🔍 [DEBUG] [ExploreScreen] Processing salons:', salonsData.salons.length);
    console.log('🔍 [DEBUG] [ExploreScreen] Available nearby salons:', nearbySalons.length);

    const salonsWithDistance = salonsData.salons.map((salon: Salon, index) => {
      console.log(`🔍 [DEBUG] [ExploreScreen] Processing salon ${index + 1}/${salonsData.salons.length}:`, salon.name, 'ID:', salon.id);
      
      // Find matching nearby salon to get distance and travel time
      const nearbySalon = nearbySalons.find(ns => ns.id === salon.id);
      console.log(`🔍 [DEBUG] [ExploreScreen] Found nearby salon match for ${salon.name}:`, !!nearbySalon);
      
      if (nearbySalon) {
        console.log(`🔍 [DEBUG] [ExploreScreen] Nearby salon data for ${salon.name}:`, {
          distance: nearbySalon.distance,
          travelTime: nearbySalon.travelTime,
          coordinates: {
            lat: nearbySalon.salon_latitude,
            lng: nearbySalon.salon_longitude
          }
        });
      }
      
      const distanceText = nearbySalon?.distance
        ? nearbySalon.distance < 1
          ? `${Math.round(nearbySalon.distance * 1000)}m`
          : `${nearbySalon.distance.toFixed(1)} km`
        : undefined;

      console.log(`🔍 [DEBUG] [ExploreScreen] Distance text for ${salon.name}:`, distanceText);
      console.log(`🔍 [DEBUG] [ExploreScreen] Travel time for ${salon.name}:`, nearbySalon?.travelTime);

      const mappedSalon = {
        ...salon,
        distance: distanceText,
        travelTime: nearbySalon?.travelTime,
        distanceValue: nearbySalon?.distance, // Keep the numeric value for sorting
      };
      
      console.log(`✅ [DEBUG] [ExploreScreen] Mapped salon ${salon.name}:`, mappedSalon);
      return mappedSalon;
    });

    console.log('🔍 [DEBUG] [ExploreScreen] Starting sort by distance...');
    // Sort by distance: salons with distance first (closest to furthest), then salons without distance
    const sortedSalons = salonsWithDistance.sort((a, b) => {
      console.log(`🔍 [DEBUG] [ExploreScreen] Comparing ${a.name} (${a.distanceValue}) vs ${b.name} (${b.distanceValue})`);
      
      // If both have distance, sort by distance value
      if (a.distanceValue !== undefined && b.distanceValue !== undefined) {
        const result = a.distanceValue - b.distanceValue;
        console.log(`🔍 [DEBUG] [ExploreScreen] Both have distance, result: ${result}`);
        return result;
      }
      // If only one has distance, prioritize the one with distance
      if (a.distanceValue !== undefined && b.distanceValue === undefined) {
        console.log(`🔍 [DEBUG] [ExploreScreen] Only ${a.name} has distance, prioritizing it`);
        return -1;
      }
      if (a.distanceValue === undefined && b.distanceValue !== undefined) {
        console.log(`🔍 [DEBUG] [ExploreScreen] Only ${b.name} has distance, prioritizing it`);
        return 1;
      }
      // If neither has distance, maintain original order
      console.log(`🔍 [DEBUG] [ExploreScreen] Neither has distance, maintaining order`);
      return 0;
    });

    console.log('✅ [DEBUG] [ExploreScreen] Final mappedSalons:', sortedSalons.length, 'salons');
    console.log('🔍 [DEBUG] [ExploreScreen] Sorted salons order:', sortedSalons.map(s => ({ name: s.name, distance: s.distance, distanceValue: s.distanceValue })));
    return sortedSalons;
  }, [salonsData?.salons, nearbySalons]);

  const renderSalonItem = ({
    item,
  }: {
    item: Salon & {
      distance?: string;
      travelTime?: string;
      distanceValue?: number;
    };
  }) => {
    console.log(
      'Rendering salon:',
      item.name,
      'ID:',
      item.id,
      'Distance:',
      item.distance,
      'Travel Time:',
      item.travelTime,
    );

    return (
      <View style={localStyles.salonWrapper}>
        <TouchableOpacity
          style={localStyles.salonCard}
          onPress={() => handleCardPress(item)}>
          <View style={localStyles.imageContainer}>
            <Image
              source={
                item.image_url
                  ? {uri: item.image_url}
                  : require('../../../assets/images/beautician1.png')
              }
              style={localStyles.salonImage}
            />
            <View style={localStyles.ratingOverlay}>
              <Icon name="star" size={12} color="#fafe35ff" />
              <Text style={localStyles.ratingOverlayText}>
                {getAverageRating(item).toFixed(1)}
              </Text>
            </View>
          </View>
          <View style={localStyles.salonInfo}>
            <Text style={localStyles.salonName}>{item.name}</Text>
            {/* <View style={localStyles.locationContainer}>
              <Icon
                name="location-on"
                size={15}
                color={Colors.gold}
                style={localStyles.locationIcon}
              />
              <Text numberOfLines={1} style={localStyles.locationText}>
                {item.distance
                  ? `${item.distance}${
                      item.travelTime ? ` • ${item.travelTime}` : ''
                    }`
                  : 'Distance unavailable'}
              </Text>
            </View> */}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={{flex: 1}}>
      <ImageBackground
        source={require('../../../assets/images/pink-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.mainContainer}>
          <View style={styles.container}>
            <SearchBarWithMenu
              onSearchChange={handleSearch}
              onMenuPress={handleMenuPress}
            />

            <Text style={styles.resultCount}>
              {categoryNames && categoryNames.length > 0
                ? categoryNames[0]
                : searchQuery
                ? `Search: ${searchQuery}`
                : t.explore.all}
            </Text>

            <View
              style={[
                styles.filterSortContainer,
                {flexDirection: !isRTL ? 'row' : 'row-reverse'},
              ]}>
              <TouchableOpacity
                style={styles.filterOption}
                onPress={handleFilterPress}>
                <Icon name="filter-list" size={20} color={Colors.white} />
                <Text style={styles.optionText}>{t.explore.filters}</Text>
              </TouchableOpacity>
              {/* <TouchableOpacity
              style={styles.sortOption}
              onPress={handleSortPress}>
              <Icon name="swap-vert" size={20} color={Colors.gold} />
              <Text style={styles.optionText}>{getSortByText()}</Text>
            </TouchableOpacity> */}
              <TouchableOpacity
                style={styles.gridOption}
                onPress={handleViewToggle}>
                <Icon
                  name={isGridView ? 'view-list' : 'grid-view'}
                  size={20}
                  color={Colors.white}
                />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <ActivityIndicator size="large" color={Colors.gold} />
              </View>
            ) : error ? (
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                }}>
                <Text style={{color: Colors.red}}>{t.explore.error}</Text>
              </View>
            ) : (
              <FlatList
                data={mappedSalons}
                keyExtractor={item => item.id.toString()}
                numColumns={isGridView ? 2 : 1}
                key={isGridView ? 'grid' : 'list'}
                showsVerticalScrollIndicator={false}
                columnWrapperStyle={isGridView ? styles.cardWrapper : undefined}
                renderItem={
                  isGridView
                    ? renderSalonItem
                    : ({
                        item,
                      }: {
                        item: Salon & {
                          distance?: string;
                          travelTime?: string;
                          distanceValue?: number;
                        };
                      }) => (
                        <View style={styles.listItemContainer}>
                          <TouchableOpacity
                            style={styles.listCard}
                            onPress={() => handleCardPress(item)}>
                            <Image
                              source={
                                item.image_url
                                  ? {uri: item.image_url}
                                  : require('../../../assets/images/beautician1.png')
                              }
                              style={styles.listCardImage}
                              resizeMode="cover"
                            />
                            <View style={styles.listCardInfo}>
                              <Text
                                style={styles.listCardName}
                                numberOfLines={1}>
                                {item.name}
                              </Text>
                              <Text
                                style={styles.listCardProfession}
                                numberOfLines={1}>
                                {item.bio || t.explore.defaultProfession}
                              </Text>
                              <View style={styles.salonMetaRow}>
                                <View style={styles.listCardRating}>
                                  <Icon
                                    name="star"
                                    size={16}
                                    color="rgb(253, 217, 11)"
                                  />
                                  <Text style={styles.listCardRatingText}>
                                    {getAverageRating(item).toFixed(1)}
                                  </Text>
                                </View>
                                {/* <View style={styles.listCardRating}>
                                  <Icon
                                    name="access-time"
                                    size={16}
                                    color={Colors.gold}
                                  />
                                  <Text style={styles.listCardRatingText}>
                                    {item.travelTime}
                                  </Text>
                                </View>
                                <View style={styles.listCardRating}>
                                  <Icon
                                    name="place"
                                    size={16}
                                    color={Colors.gold}
                                  />
                                  <Text style={styles.listCardRatingText}>
                                    {item.distance}
                                  </Text>
                                </View> */}
                              </View>
                            </View>
                          </TouchableOpacity>
                        </View>
                      )
                }
              />
            )}
          </View>
          {!isGuestMode && <Footer />}
        </View>
      </SafeAreaView>
    </View>
  );
};

const localStyles = StyleSheet.create({
  salonWrapper: {
    width: '48.8%',
    marginBottom: 16,
    marginRight: '2.4%',
  },
  salonCard: {
    backgroundColor: Colors.black,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    width: '100%',
    shadowColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  salonImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  salonInfo: {
    padding: 12,
    backgroundColor: Colors.black,
  },
  salonName: {
    fontSize: 14,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 16,
  },
  locationIcon: {
    marginTop: 2,
  },
  locationText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: Colors.white,
    marginLeft: 4,
    marginRight: 4,
    flex: 1,
    opacity: 0.9,
  },
  ratingOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  ratingOverlayText: {
    fontSize: 12,
    fontFamily: 'Maitree-Regular',
    color: '#FFFFFF',
    marginLeft: 4,
  },
});

export default ExploreScreen;
