import {createApi, fetchBaseQuery} from '@reduxjs/toolkit/query/react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {RootState} from '../store';

// Types
interface LoginCredentials {
  email: string;
  password: string;
  fcm_token: string;
  current_lang: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  phone_number?: string;
}

interface UpdateUserData {
  name: string;
  email: string;
  phone_number: string;
  address?: string;
}

interface OtpData {
  otp: string;
  token: string;
}

interface AuthResponse {
  user: {
    id: number;
    name: string;
    email: string;
    type?: string;
    is_active: number;
  };
  token: string;
  message?: string;
  success?: boolean;
  uuid?: string;
}

interface ChangePasswordData {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
}

interface ResetPasswordData {
  old_password: string;
  password: string;
  password_confirmation: string;
}

interface UserInfoResponse {
  message: string;
  data: {
    id: number;
    name: string;
    email: string;
    avatar: string;
    phone_number: string;
    type: string;
    about: string;
    verification_code: string | null;
    email_verified_at: string | null;
    bio: string | null;
    is_online: number;
    is_active: number;
    longitude: string | null;
    latitude: string | null;
    service_fee: string | null;
    created_at: string;
    updated_at: string;
    image_url: string;
    average_rating: string;
  };
}

// Previous API URL (commented out)
// const API_BASE_URL = 'https://bella-glam.com/api';

// New API URL
const API_BASE_URL = 'https://bella-glam.com/api';

const prepareHeaders = async (
  headers: Headers,
  {getState}: {getState: () => RootState},
) => {
  // First try to get the token from Redux state
  const state = getState();
  const tokenFromRedux = state.auth.token;

  // If token exists in Redux, use it
  if (tokenFromRedux) {
    headers.set('Authorization', `Bearer ${tokenFromRedux}`);
  } else {
    // Otherwise, try to get it from AsyncStorage
    const token = await AsyncStorage.getItem('token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
  }

  // Always set Accept and Content-Type headers
  headers.set('Accept', 'application/json');
  headers.set('Content-Type', 'application/json');
  return headers;
};

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders,
    responseHandler: async response => {
      // First try to parse as JSON
      try {
        const data = await response.json();
        return data;
      } catch (err) {
        // If JSON parsing fails, get the text and log it
        const text = await response.text();
        console.error(
          'Server response was not JSON:',
          text.substring(0, 200) + '...',
        );
        // Throw a more informative error
        throw new Error(
          'Server returned invalid JSON response. Status: ' + response.status,
        );
      }
    },
  }),
  endpoints: builder => ({
    register: builder.mutation<AuthResponse, RegisterData>({
      query: userData => ({
        url: '/register',
        method: 'POST',
        body: userData,
      }),
    }),
    verifyOtp: builder.mutation<AuthResponse, OtpData>({
      query: otpData => ({
        url: '/verify-otp',
        method: 'POST',
        body: otpData,
        formData: true,
      }),
    }),
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: credentials => ({
        url: '/login',
        method: 'POST',
        body: {
          ...credentials,
          fcm_token: credentials.fcm_token || 'dummy_fcm_token_123',
          current_lang: credentials.current_lang || 'en',
        },
      }),
      // Add transformErrorResponse to handle errors better
      transformErrorResponse: (response: {status: number; data: any}) => {
        if (response.status === 500) {
          return {
            status: response.status,
            message: 'Internal server error. Please try again later.',
            data: null,
          };
        }
        return response;
      },
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
    }),
    updateUser: builder.mutation<AuthResponse, UpdateUserData>({
      query: userData => ({
        url: '/update-user',
        method: 'POST',
        body: userData,
      }),
    }),
    changePassword: builder.mutation<
      {success: boolean; message: string},
      ChangePasswordData
    >({
      query: passwordData => ({
        url: '/change-password',
        method: 'POST',
        body: passwordData,
      }),
    }),
    resetPassword: builder.mutation<
      {success: boolean; message: string},
      ResetPasswordData
    >({
      query: passwordData => ({
        url: '/reset-password',
        method: 'POST',
        body: passwordData,
      }),
    }),
    getUserInfo: builder.query<UserInfoResponse, void>({
      query: () => ({
        url: '/me',
        method: 'GET',
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useLogoutMutation,
  useUpdateUserMutation,
  useVerifyOtpMutation,
  useChangePasswordMutation,
  useResetPasswordMutation,
  useGetUserInfoQuery,
  useLazyGetUserInfoQuery,
} = authApi;
