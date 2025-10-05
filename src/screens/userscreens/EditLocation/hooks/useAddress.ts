import {useState, useEffect} from 'react';
import {Alert} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../../../../redux/store';
import {
  addAddress,
  deleteAddress,
  updateAddress,
  setUser,
} from '../../../../redux/slices/authSlice';
import {Address} from '../types';
import {useToggleFavoriteAddressMutation} from '../../../../redux/api/salonApi';
import {useTranslation} from '../../../../contexts/TranslationContext';
export const useAddress = () => {
  const [loading, setLoading] = useState(false);
  const [fetchingAddresses, setFetchingAddresses] = useState(false);
  const dispatch = useDispatch();
  const {user, token} = useSelector((state: RootState) => state.auth);
  const [toggleFavorite] = useToggleFavoriteAddressMutation();
  const {t} = useTranslation();
  // Add token logging
  useEffect(() => {
    if (token) {
      console.log('Auth token exists, length:', token.length);
      console.log('Token prefix:', token.substring(0, 10) + '...');
    } else {
      console.log('No auth token found');
    }
  }, [token]);

  const fetchUserAddresses = async () => {
    if (!token) {
      console.error('No token available for fetching addresses');
      return;
    }

    try {
      setFetchingAddresses(true);
      const url = 'https://bella-glam.com/api/addresses';
      console.log('Fetching addresses from URL:', url);
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
          // Note: no 'Content-Type' on GET to avoid 400 from some backends
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log('Addresses API error body:', errorText);
        throw new Error(`Failed to fetch addresses: ${response.status}`);
      }

      const data = await response.json();
      console.log('Fetched addresses:', data);

      // Update the user's addresses in Redux
      if (user && data.addresses) {
        const updatedUser = {
          ...user,
          addresses: data.addresses.map((addr: any) => ({
            id: addr.id,
            description: addr.description,
            locationLink: addr.location_link || '',
            isFavorite: addr.is_favorite === 1,
            isPrimary: addr.is_primary === 1,
            latitude: parseFloat(addr.latitude),
            longitude: parseFloat(addr.longitude),
          })),
        };
        dispatch(setUser(updatedUser));
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
      // Avoid user-facing alert here to prevent noisy dialogs when opening map
    } finally {
      setFetchingAddresses(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserAddresses();
    }
  }, [token]);

  const handleAddAddress = async (
    description: string,
    locationLink: string,
    latitude: number,
    longitude: number,
  ): Promise<number | null> => {
    try {
      console.log('Starting to add address...');
      console.log('Using token:', token ? 'Token exists' : 'No token found');
      const userId = (user as any)?.id;

      if (!token || !userId) {
        Alert.alert(
          'Login required',
          'Please log in to add and save addresses.'
        );
        return null;
      }

      // if (!token) {
      //   throw new Error('Authentication token is missing. Please log in again.');
      // }

      setLoading(true);

      const response = await fetch('https://bella-glam.com/api/new-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          description,
          location_link: locationLink,
          is_favorite: false,
          latitude: latitude.toString(),
          longitude: longitude.toString(),
        }),
      });
console.log('URL:', "'https://bella-glam.com/api/new-address'");
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      const responseText = await response.text();
      console.log('Raw response:', responseText);

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Authentication failed. Please log in again.');
        }
        throw new Error(
          `Failed to add address: ${response.status} ${responseText}`,
        );
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Parsed response:', data);
      } catch (parseError) {
        console.error('Error parsing response:', parseError);
        throw new Error('Invalid response from server');
      }

      if (!data.address?.id) {
        throw new Error('Invalid response format: missing address ID');
      }

      const newAddress: Address = {
        id: data.address.id,
        description,
        locationLink,
        isFavorite: false,
        isPrimary: false,
        latitude,
        longitude,
      };

      dispatch(addAddress(newAddress));
      // Alert.alert(t.editLocation.addressAdded);

      // Refresh the addresses list after adding a new one
      await fetchUserAddresses();

      return data.address.id;
    } catch (error) {
      console.error('Error in handleAddAddress:', error);
      Alert.alert('Failed to add address', 'Please try again.');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: number) => {
    if (!token) {
      Alert.alert(t.editLocation.error.addressAdded);
      return;
    }

    Alert.alert(
      t.editLocation.deleteAddress,
      t.editLocation.deleteAddressText,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              const response = await fetch(
                `https://bella-glam.com/api/addresses/${addressId}`,
                {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                  },
                },
              );

              if (!response.ok) {
                throw new Error(`Failed to delete address: ${response.status}`);
              }

              dispatch(deleteAddress(addressId));
              Alert.alert(t.editLocation.addressDeleted);
            } catch (error) {
              console.error('Error deleting address:', error);
              Alert.alert(t.editLocation.error.addressDeleted);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleToggleFavorite = async (addressId: number) => {
    if (!token) {
      Alert.alert(t.editLocation.error.addressAdded);
      return;
    }

    try {
      setLoading(true);
      const addresses: Address[] = ((user as any)?.addresses ?? []) as Address[];
      const address = addresses.find(a => a.id === addressId);
      if (!address) {
        throw new Error('Address not found');
      }

      const response = await fetch(
        `https://bella-glam.com/api/update-address/${addressId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to update favorite status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Toggle favorite response:', data);

      dispatch(updateAddress({id: addressId, isFavorite: !address.isFavorite}));
      Alert.alert(t.editLocation.FavUpdated);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert(t.editLocation.error.addressAdded);
    } finally {
      setLoading(false);
    }
  };

  const handleSetPrimary = async (addressId: number) => {
    if (!token) {
      Alert.alert(t.editLocation.error.addressAdded);
      return;
    }

    try {
      setLoading(true);
      dispatch(updateAddress({id: addressId, isPrimary: true}));
    } catch (error) {
      Alert.alert(t.editLocation.error.addressAdded);
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    fetchingAddresses,
    handleAddAddress,
    handleDeleteAddress,
    handleToggleFavorite,
    handleSetPrimary,
    fetchUserAddresses,
  };
};
