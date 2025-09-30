import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Service,
  Salon,
  SalonResponse,
  CreateServiceRequest,
  DeleteServiceRequest,
  CreatePackageRequest,
  UpdatePackageRequest,
  DeletePackageRequest,
  UpdateAvailabilityRequest,
  GetAvailabilityRequest,
  Category,
  Package,
  Address,
} from '../../types/salon';
import {setOnlineStatus} from '../slices/authSlice';
type CreateAppointmentResponse = {
  message: string;
  appointment_id: number;
  total_amount: number;
};

// Add interface for nearby salon
export interface NearbySalon {
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

// API Configuration
// Previous API URL (commented out)
// const API_BASE_URL = 'https://spa.dev2.prodevr.com/api';

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

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}

export interface SalonAvailability {
  day: string;
  opening_time: string;
  closing_time: string;
  periods: TimeSlot[];
}

export interface UpdateServiceRequest {
  salonId: number;
  services: Array<{
    id: number;
    service: string;
    price: number;
    description: string;
    time: string;
  }>;
}

export interface CreateAppointmentRequest {
  salon_id: number;
  address_id: number;
  appointment_day: string;
  appointment_time: string;
  note?: string;
  services: number[];
}

// Add interface for salon query parameters
export interface SalonQueryParams {
  search?: string;
  category_id?: string;
  rating?: string | number;
  price_range?: string;
  sort_by?: 'most_popular' | 'rated_review' | 'cost_low_to_high';
}

export interface UpdateAddressRequest {
  id: number;
  description: string;
  is_favorite: boolean | number;
  latitude: string;
  longitude: string;
}

export interface UpdateAvailabilityRequest {
  id: number;
  opening_time: string;
  closing_time: string;
  is_open: number;
}

export const salonApi = createApi({
  reducerPath: 'salonApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders,
  }),
  tagTypes: ['Salon', 'Appointments', 'Service', 'Address'],
  endpoints: builder => ({
    getSalonById: builder.query<SalonResponse, number>({
      query: id => `salons/${id}`,
      providesTags: (result, error, id) => [{type: 'Salon', id}],
      transformResponse: (response: any) => {
        return {
          salons: response.salon,
        };
      },
    }),
    getAllSalons: builder.query<SalonResponse, SalonQueryParams>({
      query: (params = {}) => ({
        url: 'salons',
        params: {
          ...params,
        },
      }),
    }),
    createService: builder.mutation<
      {services: Service[]},
      CreateServiceRequest
    >({
      query: ({salonId, services}) => ({
        url: `salons/${salonId}/create-service`,
        method: 'POST',
        body: {services},
      }),
      invalidatesTags: (result, error, {salonId}) => [
        {type: 'Salon', id: salonId},
      ],
    }),
    updateService: builder.mutation<
      {services: Service[]},
      UpdateServiceRequest
    >({
      query: ({salonId, services}) => ({
        url: `salons/${salonId}/update-service`,
        method: 'POST',
        body: {services},
      }),
      invalidatesTags: (result, error, {salonId}) => [
        {type: 'Salon', id: salonId},
      ],
    }),
    deleteService: builder.mutation<void, DeleteServiceRequest>({
      query: ({salonId, serviceId}) => ({
        url: `salons/${salonId}/delete-service`,
        method: 'POST',
        body: {services: [{id: serviceId}]},
      }),
      invalidatesTags: (result, error, {salonId}) => [
        {type: 'Salon', id: salonId},
      ],
    }),
    createPackage: builder.mutation<{success: boolean}, CreatePackageRequest>({
      query: packageData => ({
        url: 'salons/create-package',
        method: 'POST',
        body: packageData,
      }),
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
          // Refetch salon data to get updated packages
          dispatch(salonApi.util.invalidateTags(['Salon']));
        } catch (error) {
          console.error('Error creating package:', error);
        }
      },
    }),
    updatePackage: builder.mutation<{success: boolean}, UpdatePackageRequest>({
      query: ({salonId, packageId, package: packageData}) => ({
        url: `salons/${salonId}/update-package/${packageId}`,
        method: 'POST',
        body: packageData,
      }),
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
          // Refetch salon data to get updated packages
          dispatch(salonApi.util.invalidateTags(['Salon']));
        } catch (error) {
          console.error('Error updating package:', error);
        }
      },
    }),
    deletePackage: builder.mutation<{success: boolean}, DeletePackageRequest>({
      query: ({salonId, packageId}) => ({
        url: `salons/${salonId}/delete-package`,
        method: 'POST',
      }),
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
          // Refetch salon data to get updated packages
          dispatch(salonApi.util.invalidateTags(['Salon']));
        } catch (error) {
          console.error('Error deleting package:', error);
        }
      },
    }),
    updateAvailability: builder.mutation<
      SalonResponse,
      UpdateAvailabilityRequest
    >({
      query: ({id, opening_time, closing_time, is_open}) => ({
        url: `salons/1/update-availabilities`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: {
          id,
          opening_time,
          closing_time,
          is_open,
        },
      }),
      invalidatesTags: (result, error, {id}) => [{type: 'Salon', id}],
    }),
    updateSalonCategories: builder.mutation<
      {success: boolean},
      {salonId: number; categoryIds: number[]}
    >({
      query: ({salonId, categoryIds}) => ({
        url: `salons/${salonId}/categories`,
        method: 'PUT',
        body: {category_ids: categoryIds},
      }),
      invalidatesTags: (result, error, {salonId}) => [
        {type: 'Salon', id: salonId},
      ],
    }),
    getAvailability: builder.query<SalonAvailability, GetAvailabilityRequest>({
      query: ({salonId, date}) => ({
        url: `salons/${salonId}/availability`,
        method: 'POST',
        body: {date},
      }),
    }),
    getAppointments: builder.query<
      {
        appointments: Array<{
          id: number;
          appointment_day: string;
          appointment_time: string;
          status: string;
          total_amount: string;
          salon: {
            id: number;
            name: string;
            image_url: string | null;
          };
          services: Array<{
            id: number;
            service: string;
            price: string;
            time: string;
          }>;
        }>;
      },
      {status?: 'booked' | 'completed' | 'cancelled'}
    >({
      query: ({status}) => {
        const url = `${API_BASE_URL}/appointments${
          status ? `?status=${status}` : ''
        }`;
        console.log('Making appointments request to:', url);
        console.log('Request headers:', {
          Authorization: 'Bearer [token]', // Don't log actual token
          'Content-Type': 'application/json',
        });
        return {
          url: `appointments${status ? `?status=${status}` : ''}`,
          method: 'GET',
        };
      },
      providesTags: ['Appointments'],
      async onQueryStarted(arg, {queryFulfilled}) {
        try {
          const {data} = await queryFulfilled;
          console.log('Appointments API response:', data);
        } catch (error: any) {
          console.error('Error in appointments query:', {
            message: error.message,
            status: error.status,
            data: error.data,
            meta: error.meta,
            request: {
              url: error.meta?.request?.url,
              method: error.meta?.request?.method,
              headers: error.meta?.request?.headers,
            },
          });
        }
      },
    }),
    uploadAssets: builder.mutation<
      {success: boolean},
      {salonId: number; assets: FormData}
    >({
      query: ({salonId, assets}) => ({
        url: `salons/${salonId}/assets`,
        method: 'POST',
        body: assets,
        formData: true,
      }),
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        try {
          await queryFulfilled;
          dispatch(salonApi.util.invalidateTags(['Salon']));
        } catch (error) {
          console.error('Error uploading assets:', error);
        }
      },
    }),
    toggleFavoriteAddress: builder.mutation<
      void,
      {addressId: string; isFavorite: boolean}
    >({
      query: ({addressId, isFavorite}) => ({
        url: '/addresses/favorite',
        method: 'PATCH',
        body: {addressId, isFavorite},
      }),
      invalidatesTags: ['Address'],
    }),
    createAppointment: builder.mutation<
      {
        success: boolean;
        id?: number;
        appointment_id?: number;
        message?: string;
        total_amount?: number;
      },
      CreateAppointmentRequest
    >({
      query: appointmentData => ({
        url: 'users/appointments',
        method: 'POST',
        body: appointmentData,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
      }),
      transformResponse: (response: any) => {
        const appointment_id = response?.appointment_id ?? response?.id;
        const success = !!appointment_id || response?.success === true;
        return {
          success,
          id: appointment_id ?? response?.id,
          appointment_id,
          message: response?.message,
          total_amount: response?.total_amount,
        };
      },
      invalidatesTags: ['Appointments'],
      async onQueryStarted(arg, {queryFulfilled}) {
        try {
          const {data} = await queryFulfilled;
          console.log('Appointment created successfully (normalized):', data);
        } catch (error: any) {
          console.error('Error creating appointment:', {
            message: error.message,
            status: error.status,
            data: error.data,
            originalError: error.originalError,
          });
          throw error;
        }
      },
    }),
    getCategories: builder.query<
      {success: boolean; categories: Category[]},
      void
    >({
      query: () => ({
        url: 'categories',
        method: 'GET',
      }),
      providesTags: ['Category'],
    }),
    getFavorites: builder.query<Salon[], void>({
      query: () => {
        console.log('Fetching favorites from API');
        return 'favorites';
      },
      transformResponse: (response: any) => {
        console.log('Favorites API response:', response);
        return response;
      },
      providesTags: ['Salon'],
    }),
    toggleFavoriteSalon: builder.mutation<void, {salon_id: number}>({
      query: body => {
        console.log('Toggling favorite for salon:', body.salon_id);
        return {
          url: 'favorite-salon',
          method: 'POST',
          body,
        };
      },
      invalidatesTags: ['Salon'],
    }),
    contactUs: builder.mutation<
      {success: boolean},
      {email: string; note: string}
    >({
      query: body => ({
        url: 'new-contact-us',
        method: 'POST',
        body,
      }),
    }),
    deleteUser: builder.mutation<{success: boolean}, void>({
      query: () => ({
        url: 'delete-user',
        method: 'DELETE',
      }),
    }),
    toggleSalonStatus: builder.mutation<
      {is_online: boolean; message: string; success: boolean},
      void
    >({
      query: () => ({
        url: 'salons/toggle-status',
        method: 'PUT',
      }),
      async onQueryStarted(arg, {dispatch, queryFulfilled}) {
        try {
          const {data} = await queryFulfilled;
          // Dispatch action to update is_online in auth state
          dispatch(setOnlineStatus(data.is_online));
        } catch (error) {
          console.error('Error toggling salon status:', error);
        }
      },
    }),
    updateAddress: builder.mutation<
      {success: boolean; message: string},
      UpdateAddressRequest
    >({
      query: ({id, ...updateData}) => ({
        url: `update-address/${id}`,
        method: 'GET',
        params: updateData,
      }),
      invalidatesTags: ['Address'],
    }),
    markAppointmentAsRead: builder.mutation<{success: boolean}, number>({
      query: appointmentId => ({
        url: `salons/mark-appointment-read/${appointmentId}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }),
      invalidatesTags: ['Appointments'],
    }),
    getPackages: builder.query<
      {success: boolean; packages: {data: Package[]}},
      void
    >({
      query: () => ({
        url: 'salons/get-package',
        method: 'GET',
      }),
      providesTags: ['Package'],
    }),
    getAddresses: builder.query<{addresses: Address[]}, void>({
      query: () => ({
        url: 'addresses',
        method: 'GET',
      }),
      providesTags: ['Address'],
    }),
    getNearbySalons: builder.query<
      {success: boolean; salons: NearbySalon[]},
      {latitude: number; longitude: number; radius?: number}
    >({
      query: ({latitude, longitude, radius = 10}) => ({
        url: `nearby-salons?latitude=${latitude}&longitude=${longitude}&radius=${radius}`,
        method: 'GET',
      }),
      providesTags: ['Salon'],
    }),
    createAddress: builder.mutation<
      {address: Address},
      {
        description: string;
        is_favorite: boolean;
        latitude: string;
        longitude: string;
      }
    >({
      query: addressData => ({
        url: 'new-address',
        method: 'POST',
        body: addressData,
      }),
      invalidatesTags: ['Address'],
    }),
    updatePrimaryAddress: builder.mutation<{success: boolean}, number>({
      query: addressId => ({
        url: `update-primary-address/${addressId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Address'],
    }),
  }),
});

export const {
  useGetSalonByIdQuery,
  useGetAllSalonsQuery,
  useCreateServiceMutation,
  useUpdateServiceMutation,
  useDeleteServiceMutation,
  useCreatePackageMutation,
  useUpdatePackageMutation,
  useDeletePackageMutation,
  useUpdateAvailabilityMutation,
  useUpdateSalonCategoriesMutation,
  useGetAvailabilityQuery,
  useGetAppointmentsQuery,
  useUploadAssetsMutation,
  useToggleFavoriteAddressMutation,
  useCreateAppointmentMutation,
  useGetCategoriesQuery,
  useGetFavoritesQuery,
  useToggleFavoriteSalonMutation,
  useContactUsMutation,
  useDeleteUserMutation,
  useToggleSalonStatusMutation,
  useUpdateAddressMutation,
  useMarkAppointmentAsReadMutation,
  useGetPackagesQuery,
  useGetAddressesQuery,
  useGetNearbySalonsQuery,
  useCreateAddressMutation,
  useUpdatePrimaryAddressMutation,
} = salonApi;
