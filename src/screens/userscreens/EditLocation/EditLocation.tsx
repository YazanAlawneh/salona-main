import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Colors from '../../../constants/Colors';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../../redux/store';
import {updateAddress as updateAddressAction} from '../../../redux/slices/authSlice';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import LocationMapView from './components/MapView';
import AddressList from './components/AddressList';
import {useLocation} from './hooks/useLocation';
import {useAddress} from './hooks/useAddress';
import {useTranslation} from '../../../contexts/TranslationContext';
import {useUpdateAddressMutation} from '../../../redux/api/salonApi';
import { setSelectedAddress } from '../../../redux/slices/salonSlice';
import {useNavigation} from '@react-navigation/native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Location, Address} from './types';

const EditLocationScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const {user, token} = useSelector((state: RootState) => state.auth);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null,
  );
  const [initialMapLocation, setInitialMapLocation] = useState<Location | null>(
    null,
  );
  const fadeAnim = new Animated.Value(0);
  const {t} = useTranslation();
  const {
    loading: locationLoading,
    requestLocationPermission,
    getCurrentLocation,
  } = useLocation();
  const {
    loading: addressLoading,
    handleAddAddress,
    handleDeleteAddress,
    handleToggleFavorite,
    handleSetPrimary,
  } = useAddress();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const [updateAddressApi] = useUpdateAddressMutation();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    console.log(
      'EditLocation screen mounted, requesting permissions and initializing map...',
    );
    requestLocationPermission();
    // Initialize map with current location or default location
    initializeMap();
  }, []);

  const initializeMap = async () => {
    try {
      console.log('Initializing map with current location...');
      const location = await getCurrentLocation();

      if (location && location.latitude && location.longitude) {
        console.log('Current location obtained:', location);
        const currentLocation = {
          latitude: location.latitude,
          longitude: location.longitude,
        };

        console.log(
          'Setting initial map location to current location:',
          currentLocation,
        );
        setInitialMapLocation(currentLocation);
        setSelectedLocation(currentLocation);
      } else {
        console.log('No current location available, using default');
        // Set default location (Amman, Jordan) if current location fails
        const defaultLocation = {
          latitude: 31.9454,
          longitude: 35.9284,
        };
        console.log(
          'Setting initial map location to default:',
          defaultLocation,
        );
        setInitialMapLocation(defaultLocation);
        setSelectedLocation(defaultLocation);
      }
    } catch (error) {
      console.error(
        'Error getting current location for map initialization:',
        error,
      );
      // Set default location (Amman, Jordan)
      const defaultLocation = {
        latitude: 31.9454,
        longitude: 35.9284,
      };
      console.log(
        'Setting initial map location to default due to error:',
        defaultLocation,
      );
      setInitialMapLocation(defaultLocation);
      setSelectedLocation(defaultLocation);
    }
  };

  const handleMapPress = (location: Location) => {
    console.log('Map pressed at location:', location);
    setSelectedLocation(location);
  };

  const handleConfirmLocation = async () => {
    console.log('handleConfirmLocation called');
    if (!selectedLocation) {
      console.log('No location selected');
      Alert.alert(t.editLocation.errors.noLocation);
      return;
    }
    if (!token || !user?.id) {
      Alert.alert('Login required', 'Please log in to save addresses.');
      return;
    }

    try {
      console.log('Selected location:', selectedLocation);
      console.log('Fetching address from coordinates...');
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${selectedLocation.latitude},${selectedLocation.longitude}&key=AIzaSyB-w38SqAU85WY8NzUDFKw5JX5RakNulaA`,
      );
      const data = await response.json();
      console.log('Geocoding response:', data);

      if (data.results && data.results[0]) {
        console.log('Found address:', data.results[0].formatted_address);
        console.log('Adding address to user profile...');
        const newAddressId = await handleAddAddress(
          data.results[0].formatted_address,
          `https://www.google.com/maps/place/?q=place_id:${data.results[0].place_id}`,
          selectedLocation.latitude,
          selectedLocation.longitude,
        );

        if (newAddressId) {
          const newAddress = {
            id: newAddressId,
            description: data.results[0].formatted_address,
            locationLink: `https://www.google.com/maps/place/?q=place_id:${data.results[0].place_id}`,
            isFavorite: false,
            isPrimary: false,
            latitude: selectedLocation.latitude,
            longitude: selectedLocation.longitude,
          };
          setEditingAddress(newAddress);
          setNewDescription(data.results[0].formatted_address);
          setEditModalVisible(true);
        }

        console.log('Address added successfully');
        setSelectedLocation(null);
      } else {
        console.log('No address found for coordinates');
        Alert.alert(t.editLocation.errors.noAddress);
      }
    } catch (error) {
      console.error('Error in handleConfirmLocation:', error);
      Alert.alert(t.editLocation.errors.noAddress);
    }
  };

  const handleCurrentLocation = async () => {
    console.log('handleCurrentLocation called');
    try {
      console.log('Attempting to get current location...');
      const location = await getCurrentLocation();

      if (!location || !location.latitude || !location.longitude) {
        console.log('No valid location received from getCurrentLocation');
        Alert.alert(
          'Error getting location',
          'Unable to get your current location. Please try again.',
        );
        return;
      }

      console.log('Location received:', location);

      // Show loading state immediately
      setLoading(true);

      try {
        console.log('Fetching address from coordinates...');
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=AIzaSyB-w38SqAU85WY8NzUDFKw5JX5RakNulaA`,
        );
        const data = await response.json();
        console.log('Geocoding response:', data);

        if (data.results && data.results[0]) {
          console.log('Adding address to user profile...');
          const newAddressId = await handleAddAddress(
            data.results[0].formatted_address,
            `https://www.google.com/maps/place/?q=place_id:${data.results[0].place_id}`,
            location.latitude,
            location.longitude,
          );

          if (newAddressId) {
            const newAddress = {
              id: newAddressId,
              description: data.results[0].formatted_address,
              locationLink: `https://www.google.com/maps/place/?q=place_id:${data.results[0].place_id}`,
              isFavorite: false,
              isPrimary: false,
              latitude: location.latitude,
              longitude: location.longitude,
            };
            setEditingAddress(newAddress);
            setNewDescription(data.results[0].formatted_address);
            setEditModalVisible(true);
          }

          console.log('Address added successfully');
        } else {
          console.log('No address found for coordinates');
          Alert.alert(t.editLocation.errors.noAddress);
        }
      } catch (error) {
        console.error('Error in geocoding:', error);
        Alert.alert(
          'Error',
          'Failed to get address for current location. Please try again.',
        );
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error in handleCurrentLocation:', error);
      Alert.alert(
        'Error getting location',
        'Unable to get your current location. Please try again.',
      );
      setLoading(false);
    }
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setNewDescription(address.description);
    setEditModalVisible(true);
  };

  const handleSaveDescription = async () => {
    if (!editingAddress || !newDescription.trim()) {
      Alert.alert('Please enter a valid description');
      return;
    }

    try {
      await updateAddressApi({
        id: editingAddress.id,
        description: newDescription.trim(),
        is_favorite: editingAddress.isFavorite,
        latitude: editingAddress.latitude.toString(),
        longitude: editingAddress.longitude.toString(),
      }).unwrap();

      dispatch(
        updateAddressAction({
          id: editingAddress.id,
          description: newDescription.trim(),
        }),
      );

      // Set as selected address for app-wide usage and return to previous screen
      dispatch(
        setSelectedAddress({
          id: editingAddress.id,
          description: newDescription.trim(),
          locationLink: editingAddress.locationLink,
          isFavorite: editingAddress.isFavorite,
          isPrimary: true,
          latitude: editingAddress.latitude,
          longitude: editingAddress.longitude,
          isCurrentLocation: false,
        })
      );

      navigation.goBack();

      setEditModalVisible(false);
      setEditingAddress(null);
      setNewDescription('');
    } catch (error) {
      console.error('Error updating address:', error);
      Alert.alert('Failed to update address');
    }
  };

  const renderAddressItem = ({item}: {item: Address}) => (
    <Animated.View
      key={item.id}
      style={[styles.addressItem, {opacity: fadeAnim}]}>
      <View style={styles.addressContent}>
        <View style={styles.addressInfo}>
          <Text style={styles.addressText} numberOfLines={2}>
            {item.description}
          </Text>
          {item.isPrimary && (
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryText}>{t.editLocation.primary}</Text>
            </View>
          )}
        </View>
        <View style={styles.addressActions}>
          <TouchableOpacity
            onPress={() => handleEditAddress(item)}
            style={styles.iconButton}>
            <Icon name="edit" size={24} color={Colors.gold} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleDeleteAddress(item.id)}
            style={styles.iconButton}>
            <Icon name="delete" size={24} color={Colors.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <LocationMapView
        onLocationSelect={handleMapPress}
        onConfirm={handleConfirmLocation}
        onCancel={() => {
          console.log('Map view cancelled');
          navigation.goBack();
        }}
        selectedLocation={selectedLocation}
        initialLocation={initialMapLocation}
        loading={addressLoading}
      />

      {/* Edit Address Modal */}
      <Modal
        visible={editModalVisible}
        transparent={true}
        animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t.editLocation.editAddress}</Text>
            <TextInput
              style={styles.modalInput}
              value={newDescription}
              onChangeText={setNewDescription}
              placeholder={t.editLocation.addressDescription}
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setEditModalVisible(false);
                  setEditingAddress(null);
                  setNewDescription('');
                }}>
                <Text style={styles.cancelButtonText}>
                  {t.editLocation.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={handleSaveDescription}>
                <Text style={styles.saveButtonText}>{t.editLocation.save}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  headerPlaceholder: {
    width: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 8,
  },
  currentLocationButton: {
    backgroundColor: Colors.gold,
  },
  pickOnMapButton: {
    backgroundColor: Colors.primary,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  searchContainer: {
    padding: 16,
  },
  addressItem: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressInfo: {
    flex: 1,
    marginRight: 12,
  },
  addressText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  primaryBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  primaryText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  addressActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  saveButton: {
    backgroundColor: Colors.gold,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditLocationScreen;
