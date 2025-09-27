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

      const data = await response.json();
      
      if (data.location) {
        console.log('Location obtained from Google Geolocation API:', {
          latitude: data.location.lat,
          longitude: data.location.lng,
          accuracy: data.accuracy
        });

        setCurrentLocation(data.location);
        fetchNearbySalons(data.location.lat, data.location.lng);
      } else {
        console.error('Failed to get location from Google Geolocation API');
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const fetchNearbySalons = async (latitude: number, longitude: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(
        `https://bella-glam.com/api/nearby-salons?latitude=${latitude}&longitude=${longitude}&radius=1000000`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data: NearbySalonsResponse = await response.json();
      // console.log('Nearby salons response:', data);

      if (data.success) {
        // Get travel times for each salon
        const salonsWithTravelTime = await Promise.all(
          data.salons.map(async (salon) => {
            try {
              const distanceResponse = await fetch(
                `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${latitude},${longitude}&destinations=${salon.salon_latitude},${salon.salon_longitude}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`
              );
              const distanceData = await distanceResponse.json();
              
              if (distanceData.rows[0]?.elements[0]?.duration?.text) {
                return {
                  ...salon,
                  travelTime: distanceData.rows[0].elements[0].duration.text
                };
              }
              return salon;
            } catch (error) {
              console.error('Error fetching travel time:', error);
              return salon;
            }
          })
        );

        setNearbySalons(salonsWithTravelTime);
      } else {
        console.error('Failed to fetch nearby salons');
      }
    } catch (error) {
      console.error('Error fetching nearby salons:', error);
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
    return salons.map((salon: any) => {
      // Find matching nearby salon to get distance and travel time
      const nearbySalon = nearbySalons.find(ns => ns.id === salon.id);
      const distanceText = nearbySalon?.distance 
        ? (nearbySalon.distance < 1 
            ? `${Math.round(nearbySalon.distance * 1000)}m` 
            : `${nearbySalon.distance.toFixed(1)} km`)
        : undefined;

      return {
        id: salon.id.toString(),
        title: salon.name,
        image: salon.image_url 
          ? { uri: salon.image_url }
          : require('../../../assets/images/prettyLogo.png'),
        distance: distanceText,
        time: nearbySalon?.travelTime,
        rating: salon.average_rating || '0.0'
      };
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
