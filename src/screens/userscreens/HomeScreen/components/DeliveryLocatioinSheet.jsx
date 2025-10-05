import React, {useState} from 'react';
import {
  FlatList,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTranslation} from '../../../../contexts/TranslationContext';
import {useLocation} from '../../../userscreens/EditLocation/hooks/useLocation';

const DeliveryLocationSheet = ({
  selectedAddress,
  handleSelected,
  addresses,
  setCurrentLocation,
  addNewAddress,
  currenctLocation,
}) => {
  const {t, isRTL} = useTranslation();
  const [loading, setLoading] = useState(false);
  const {getCurrentLocation} = useLocation();

  // Dynamic styles based on RTL
  const dynamicStyles = {
    footerButton: {
      flexDirection: isRTL ? 'row-reverse' : 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: '#fff',
      borderColor: '#ddd',
      borderWidth: 0.5,
      padding: 12,
      borderRadius: 8,
    },
    footerTextContainer: {
      flex: 1,
      alignItems: isRTL ? 'flex-end' : 'flex-start',
    },
    footerText: {
      fontSize: 14,
      fontWeight: '600',
      paddingHorizontal: 12,
      color: '#000',
      textAlign: isRTL ? 'right' : 'left',
    },
    footerTextDisabled: {
      color: '#ccc',
    },
    footerButtonDisabled: {
      opacity: 0.6,
    },
  };

  const handleGetCurrentLocation = async () => {
    setLoading(true);

    try {
      console.log('Getting current location using useLocation hook...');
      const location = await getCurrentLocation();

      if (!location) {
        console.log('No location received from getCurrentLocation');
        Alert.alert(t.home.locationError, t.home.locationPermissionError, [
          {text: 'OK'},
        ]);
        setLoading(false);
        return;
      }

      console.log('Location received:', location);

      try {
        console.log('Fetching address from coordinates...');
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyB-w38SqAU85WY8NzUDFKw5JX5RakNulaA`,
        );
        const data = await response.json();
        console.log('Geocoding response:', data);

        if (data.results && data.results[0]) {
          console.log('Address found, creating location object...');

          // Create a location object with current coordinates and address
          const currentLocationData = {
            id: 'current-location',
            description: data.results[0].formatted_address,
            latitude: location.latitude,
            longitude: location.longitude,
          };

          // Call setCurrentLocation to handle the current location selection
          setCurrentLocation(currentLocationData);
          setLoading(false);
          console.log(
            'Current location selected successfully with address:',
            data.results[0].formatted_address,
          );
        } else {
          console.log('No address found for coordinates');
          // Fallback to coordinates only
          const currentLocationData = {
            id: 'current-location',
            description: t.home.currentLocation,
            latitude: location.latitude,
            longitude: location.longitude,
          };

          // Call setCurrentLocation to handle the current location selection
          setCurrentLocation(currentLocationData);
          setLoading(false);
        }
      } catch (geocodingError) {
        console.error('Error in geocoding:', geocodingError);
        // Fallback to coordinates only
        const currentLocationData = {
          id: 'current-location',
          description: t.home.currentLocation,
          latitude: location.latitude,
          longitude: location.longitude,
        };

        // Call setCurrentLocation to handle the current location selection
        setCurrentLocation(currentLocationData);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in handleGetCurrentLocation:', error);
      Alert.alert(t.home.locationError, t.home.locationPermissionError, [
        {text: 'OK'},
      ]);
      setLoading(false);
    }
  };

  const renderItem = ({item, index}) => (
    <View>
      <TouchableOpacity
        style={styles.itemContainer}
        onPress={() => handleSelected(item)}>
        <Icon name="location-outline" size={20} color="#000" />
        <View style={styles.textContainer}>
          <Text style={styles.address}>{item.description}</Text>
        </View>
        {selectedAddress?.id === item.id && (
          <Icon name="checkmark-circle" size={20} color="#e37673" />
        )}
      </TouchableOpacity>
      {index < addresses.length - 1 && <View style={styles.separator} />}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <TouchableOpacity style={dynamicStyles.footerButton} onPress={addNewAddress}>
        <Icon
          name="navigate-outline"
          size={20}
          color="#000"
          style={styles.footerIcon}
        />
        <View style={dynamicStyles.footerTextContainer}>
          <Text style={dynamicStyles.footerText}>{t.home.differentLocation}</Text>
        </View>
        {/* <Icon
          name={isRTL ? 'chevron-back' : 'chevron-forward'}
          size={20}
          color="#ddd"
          style={styles.footerIcon}
        /> */}
      </TouchableOpacity>

      <TouchableOpacity
        style={[dynamicStyles.footerButton, loading && dynamicStyles.footerButtonDisabled]}
        onPress={handleGetCurrentLocation}
        disabled={loading}>
        <Icon
          name="location"
          size={20}
          color={loading ? '#ccc' : '#000'}
          style={styles.footerIcon}
        />
        <View style={dynamicStyles.footerTextContainer}>
          <Text
            style={[dynamicStyles.footerText, loading && dynamicStyles.footerTextDisabled]}>
            {loading
              ? t.home.gettingLocation
              : currenctLocation?.description || t.home.useCurrentLocation}
          </Text>
          {/* <Text
            style={[
              styles.footerSubText,
              loading && dynamicStyles.footerTextDisabled,
            ]}>
            {currenctLocation?.description || t.home.currentLocation}
          </Text> */}
        </View>
        {loading && (
          <Icon
            name="refresh"
            size={16}
            color="#ccc"
            style={[styles.footerIcon, styles.loadingIcon]}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <FlatList
      data={addresses}
      keyExtractor={item => item.id?.toString?.() ?? String(item.id)}
      renderItem={renderItem}
      ListHeaderComponent={
        <>
          <Text style={styles.header}>{t.home.savedLocations}</Text>
          {(() => {
            console.log('🧭 [DEBUG] DeliveryLocationSheet render:', {
              selectedAddress,
              addressesCount: addresses?.length || 0,
            });
            if (Array.isArray(addresses)) {
              console.log('🧭 [DEBUG] addresses sample:', addresses.slice(0, 3));
            }
            return null;
          })()}
        </>
      }
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default DeliveryLocationSheet;

const styles = StyleSheet.create({
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    fontFamily: 'Poppins-Medium',
    color: 'black',
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 10,
    paddingTop: 8,
  },
  textContainer: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    marginBottom: 2,
    fontFamily: 'Poppins-Bold',
  },
  address: {
    color: '#555',
    fontSize: 13,
    fontFamily: 'Poppins-Regular',
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 8,
  },
  footer: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingTop: 20,
    gap: 16,
  },
  footerButton: {
    // This is now handled by dynamicStyles
  },
  footerButtonDisabled: {
    // This is now handled by dynamicStyles
  },
  footerIcon: {
    marginTop: 2,
  },
  footerText: {
    // This is now handled by dynamicStyles
  },
  footerTextDisabled: {
    // This is now handled by dynamicStyles
  },
  footerTextContainer: {
    // This is now handled by dynamicStyles
  },
  footerSubText: {
    color: '#666',
    fontSize: 12,
  },
  loadingIcon: {
    marginLeft: 'auto',
  },
});
