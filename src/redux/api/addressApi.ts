import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface Address {
  id: number;
  description: string;
  locationLink: string;
  isFavorite: boolean;
  isPrimary: boolean;
  latitude: number;
  longitude: number;
}

export interface AddressResponse {
  addresses: Address[];
}

export interface AddAddressRequest {
  description: string;
  locationLink: string;
  latitude: number;
  longitude: number;
}

// Previous API URL (commented out)
// const API_BASE_URL = 'https://bella-glam.com/api';

// New API URL
const API_BASE_URL = 'https://bella-glam.com/api';

const prepareHeaders = async (headers: Headers) => {
  try {
    const token = await AsyncStorage.getItem('token');
    console.log(
      'Token from storage:',
      token ? 'Token exists' : 'No token found',
    );
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  } catch (error) {
    console.error('Error preparing headers:', error);
    return headers;
  }
};

export const addressApi = createApi({
  reducerPath: 'addressApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders,
  }),
  tagTypes: ['Address'],
  endpoints: builder => ({
    getUserAddresses: builder.query<AddressResponse, void>({
      query: () => 'addresses',
      providesTags: ['Address'],
      transformResponse: (response: any) => {
        return {
          addresses: response.addresses.map((addr: any) => ({
            id: addr.id,
            description: addr.description,
            locationLink: addr.location_link || '',
            isFavorite: addr.is_favorite === 1,
            isPrimary: addr.is_primary === 1,
            latitude: parseFloat(addr.latitude),
            longitude: parseFloat(addr.longitude),
          })),
        };
      },
    }),
    addAddress: builder.mutation<{success: boolean}, AddAddressRequest>({
      query: addressData => ({
        url: 'new-address',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['Address'],
    }),
    deleteAddress: builder.mutation<{success: boolean}, {addressId: number}>({
      query: ({addressId}) => ({
        url: `addresses/${addressId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Address'],
    }),
    setPrimaryAddress: builder.mutation<
      {success: boolean},
      {addressId: number}
    >({
      query: ({addressId}) => ({
        url: `addresses/${addressId}/set-primary`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetUserAddressesQuery,
  useAddAddressMutation,
  useDeleteAddressMutation,
  useSetPrimaryAddressMutation,
} = addressApi;
