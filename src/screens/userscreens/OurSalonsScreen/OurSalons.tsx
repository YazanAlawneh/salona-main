import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import SwiperComponent from '../../../components/SwiperComponent/SwiperComponent';
import styles from './OurSalons.styles';
import Footer from '../../../components/Footer/Footer';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { RootState } from '../../../redux/store';
import { Salon } from '../../../types/salon';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTranslation } from '../../../contexts/TranslationContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '../../../constants/Colors';
import { GOOGLE_MAPS_API_KEY } from '@env';


interface SalonResponse {
  salons: Salon[];
}

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

const { width } = Dimensions.get('window');

const OurSalonsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { t, isRTL } = useTranslation();
  const [salons, setSalons] = useState<Salon[]>([]);
  const [loading, setLoading] = useState(false);
  const [nearbySalons, setNearbySalons] = useState<NearbySalon[]>([]);
  const [currentLocation, setCurrentLocation] = useState<{lat: number; lng: number} | null>(null);
  const category_id = (route.params as { category_id?: number })?.category_id;

  useEffect(() => {
    console.log('OurSalonsScreen mounted with category_id:', category_id);
    getCurrentLocation();
    fetchSalons();
  }, [category_id]);

  const getCurrentLocation = async () => {
    try {
      console.log('🔍 [DEBUG] Starting location fetch...');
      console.log('🔍 [DEBUG] Google Maps API Key available:', !!GOOGLE_MAPS_API_KEY);
      
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
        }
      );

      console.log('🔍 [DEBUG] Location API response status:', response.status);
      const data = await response.json();
      console.log('🔍 [DEBUG] Location API response data:', data);
      
      if (data.location) {
        console.log('✅ [DEBUG] Location obtained from Google Geolocation API:', {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy
        });

        setCurrentLocation(data.location);
        fetchNearbySalons(data.location.lat, data.location.lng);
      } else {
        console.error('❌ [DEBUG] Failed to get location from Google Geolocation API');
        console.error('❌ [DEBUG] Response data:', data);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error getting location:', error);
    }
  };

  const fetchNearbySalons = async (latitude: number, longitude: number) => {
    try {
      console.log('🔍 [DEBUG] Starting nearby salons fetch...');
      console.log('🔍 [DEBUG] Coordinates:', { latitude, longitude });
      
      const token = await AsyncStorage.getItem('token');
      console.log('🔍 [DEBUG] Token available:', !!token);
      
      const nearbySalonsUrl = `https://bella-glam.com/api/nearby-salons?latitude=${latitude}&longitude=${longitude}&radius=1000000`;
      console.log('🔍 [DEBUG] Nearby salons URL:', nearbySalonsUrl);
      
      const response = await fetch(nearbySalonsUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('🔍 [DEBUG] Nearby salons API response status:', response.status);
      const data: NearbySalonsResponse = await response.json();
      console.log('🔍 [DEBUG] Nearby salons API response:', data);

      if (data.success) {
        console.log('✅ [DEBUG] Successfully fetched nearby salons:', data.salons.length);
        console.log('🔍 [DEBUG] Nearby salons data:', data.salons);
        
        // Get travel times for each salon
        console.log('🔍 [DEBUG] Starting travel time calculation for', data.salons.length, 'salons...');
        const salonsWithTravelTime = await Promise.all(
          data.salons.map(async (salon, index) => {
            try {
              console.log(`🔍 [DEBUG] Processing salon ${index + 1}/${data.salons.length}:`, salon.name);
              console.log(`🔍 [DEBUG] Salon coordinates:`, { 
                lat: salon.salon_latitude, 
                lng: salon.salon_longitude 
              });
              
              const distanceMatrixUrl = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latitude},${longitude}&destinations=${salon.salon_latitude},${salon.salon_longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`;
              console.log(`🔍 [DEBUG] Distance matrix URL for ${salon.name}:`, distanceMatrixUrl);
              
              const distanceResponse = await fetch(distanceMatrixUrl);
              console.log(`🔍 [DEBUG] Distance matrix response status for ${salon.name}:`, distanceResponse.status);
              
              const distanceData = await distanceResponse.json();
              console.log(`🔍 [DEBUG] Distance matrix data for ${salon.name}:`, distanceData);
              
              if (distanceData.rows[0]?.elements[0]?.duration?.text) {
                const travelTime = distanceData.rows[0].elements[0].duration.text;
                console.log(`✅ [DEBUG] Travel time for ${salon.name}:`, travelTime);
                return {
                  ...salon,
                  travelTime: travelTime
                };
              } else {
                console.log(`⚠️ [DEBUG] No travel time data for ${salon.name}`);
                return salon;
              }
            } catch (error) {
              console.error(`❌ [DEBUG] Error fetching travel time for ${salon.name}:`, error);
              return salon;
            }
          })
        );

        console.log('✅ [DEBUG] Final nearby salons with travel time:', salonsWithTravelTime);
        setNearbySalons(salonsWithTravelTime);
      } else {
        console.error('❌ [DEBUG] Failed to fetch nearby salons');
        console.error('❌ [DEBUG] Response data:', data);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error fetching nearby salons:', error);
    }
  };

  const fetchSalons = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      const url = new URL('https://bella-glam.com/api/salons');
      if (category_id) {
        url.searchParams.append('category_id', category_id.toString());
      }
      
      console.log('Fetching salons with URL:', url.toString());
      console.log('Category ID:', category_id);
      console.log('Token:', token ? 'Token exists' : 'No token found');

      const response = await fetch(url.toString(), {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('Response status:', response.status);
      const data: SalonResponse = await response.json();
      console.log('API Response:', data);
      
      if (data.salons && Array.isArray(data.salons)) {
        console.log('Number of salons received:', data.salons.length);
        setSalons(data.salons);
      } else {
        console.log('No salons array in response:', data);
        setSalons([]);
      }
    } catch (error) {
      console.error('Error fetching salons:', error);
      setSalons([]);
    } finally {
      setLoading(false);
    }
  };

  const mappedSalons = useMemo(() => {
    console.log('🔍 [DEBUG] Mapping salons...');
    console.log('🔍 [DEBUG] Total salons to map:', salons.length);
    console.log('🔍 [DEBUG] Total nearby salons available:', nearbySalons.length);
    console.log('🔍 [DEBUG] Salons data:', salons);
    console.log('🔍 [DEBUG] Nearby salons data:', nearbySalons);
    
    return salons.map((salon: any, index) => {
      console.log(`🔍 [DEBUG] Processing salon ${index + 1}/${salons.length}:`, salon.name, 'ID:', salon.id);
      
      // Find matching nearby salon to get distance and travel time
      const nearbySalon = nearbySalons.find(ns => ns.id === salon.id);
      console.log(`🔍 [DEBUG] Found nearby salon match for ${salon.name}:`, !!nearbySalon);
      
      if (nearbySalon) {
        console.log(`🔍 [DEBUG] Nearby salon data for ${salon.name}:`, {
          distance: nearbySalon.distance,
          travelTime: nearbySalon.travelTime,
          coordinates: {
            lat: nearbySalon.salon_latitude,
            lng: nearbySalon.salon_longitude
          }
        });
      }
      
      const distanceText = nearbySalon?.distance 
        ? (nearbySalon.distance < 1 
            ? `${Math.round(nearbySalon.distance * 1000)}m` 
            : `${nearbySalon.distance.toFixed(1)} km`)
        : undefined;

      console.log(`🔍 [DEBUG] Distance text for ${salon.name}:`, distanceText);
      console.log(`🔍 [DEBUG] Travel time for ${salon.name}:`, nearbySalon?.travelTime);

      const mappedSalon = {
        id: salon.id.toString(),
        title: salon.name,
        image: salon.image_url 
          ? { uri: salon.image_url }
          : require('../../../assets/images/prettyLogo.png'),
        distance: distanceText,
        time: nearbySalon?.travelTime,
        rating: salon.average_rating || '0.0'
      };
      
      console.log(`✅ [DEBUG] Mapped salon ${salon.name}:`, mappedSalon);
      return mappedSalon;
    });
  }, [salons, nearbySalons]);

  const handleSalonPress = (salon: any) => {
    // Find the full salon object
    const fullSalon = salons.find(s => s.id.toString() === salon.id);
    if (fullSalon) {
      navigation.navigate('SalonProfileScreen', { salon: fullSalon, initialTab: 'Services' });
    }
  };

  const renderSalonItem = ({ item }: { item: any }) => (
    <View style={localStyles.salonWrapper}>
    <TouchableOpacity
        style={localStyles.salonCard}
      onPress={() => handleSalonPress(item)}
    >
        <View style={localStyles.imageContainer}>
          <Image 
            source={item.image} 
            style={localStyles.salonImage} 
          />
          {item.rating && (
            <View style={localStyles.ratingOverlay}>
              <Icon name="star" size={12} color="#FFB6C1" />
              <Text style={localStyles.ratingOverlayText}>{item.rating}</Text>
            </View>
          )}
        </View>
        <View style={localStyles.salonInfo}>
          <Text style={localStyles.salonName}>{item.title}</Text>
          <View style={localStyles.locationContainer}>
            <Icon name="location-on" size={12} color="#FFB6C1" style={localStyles.locationIcon} />
            <Text numberOfLines={1} style={localStyles.locationText}>
              {item.distance ? `${item.distance}${item.time ? ` • ${item.time}` : ''}` : t.ourSalons.distanceUnavailable}
            </Text>
          </View>
        </View>
    </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.mainContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.gold} />
      </View>
    );
  }

  return (
    <View style={styles.mainContainer}>
      <View style={styles.container}>
        <FlatList
          data={mappedSalons}
          keyExtractor={(item) => item.id} 
          renderItem={renderSalonItem}
          numColumns={2}
          key={'2'}
          contentContainerStyle={styles.salonList}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
              <View style={styles.swiperContainer}>
              {/* <SwiperComponent /> */}
            </View>
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Text style={styles.errorText}>{t.ourSalons.noSalonsFound}</Text>
              </View>
          }
        />
      </View>
      <Footer />
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
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

export default OurSalonsScreen;
