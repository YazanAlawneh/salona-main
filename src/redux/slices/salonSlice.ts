import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Service, Salon } from '../../types/salon';

interface Address {
  id: number;
  description: string;
  locationLink: string;
  isFavorite: boolean;
  isPrimary: boolean;
  latitude: number;
  longitude: number;
  isCurrentLocation?: boolean;
}

interface SalonsState {
  salons: Salon[]; 
  selectedSalon: Salon | null; 
  selectedAddress: Address | null;
}

const initialState: SalonsState = {
  salons: [],
  selectedSalon: null,
  selectedAddress: null,
};

const salonsSlice = createSlice({
  name: 'salons',
  initialState,
  reducers: {
    setSalons(state, action: PayloadAction<Salon[]>) {
      state.salons = action.payload;
    },
    selectSalon(state, action: PayloadAction<number>) {
      state.selectedSalon = state.salons.find((salon) => salon.id === action.payload) || null;
    },
    clearSelectedSalon(state) {
      state.selectedSalon = null;
    },
    updateSalon(state, action: PayloadAction<Salon>) {
      const index = state.salons.findIndex((salon) => salon.id === action.payload.id);
      if (index !== -1) {
        state.salons[index] = action.payload;
      } else {
        state.salons.push(action.payload);
      }
      if (state.selectedSalon?.id === action.payload.id) {
        state.selectedSalon = action.payload;
      }
    },
    removeService(
      state,
      action: PayloadAction<{ salonId: number; serviceId: number }>
    ) {
      const salon = state.salons.find((salon) => salon.id === action.payload.salonId);
      if (salon) {
        salon.services = salon.services.filter(
          (service) => service.id !== action.payload.serviceId
        );
      }
      if (state.selectedSalon?.id === action.payload.salonId) {
        state.selectedSalon.services = state.selectedSalon.services.filter(
          (service) => service.id !== action.payload.serviceId
        );
      }
    },
    updateServices(state, action: PayloadAction<{ salonId: number; services: Service[] }>) {
      const { salonId, services } = action.payload;
      const salon = state.salons.find((salon) => salon.id === salonId);
      if (salon) {
        salon.services = services;
      }
      if (state.selectedSalon?.id === salonId) {
        state.selectedSalon.services = services;
      }
    },
    addService(state, action: PayloadAction<{ salonId: number; service: Service }>) {
      const { salonId, service } = action.payload;
      const salon = state.salons.find((salon) => salon.id === salonId);
      if (salon) {
        salon.services.push(service);
      }
      if (state.selectedSalon?.id === salonId) {
        state.selectedSalon.services.push(service);
      }
    },
    editService(
      state,
      action: PayloadAction<{
        salonId: number;
        serviceId: number;
        updatedService: { service: string; price: number };
      }>
    ) {
      const salon = state.salons.find((salon) => salon.id === action.payload.salonId);
      if (salon) {
        const service = salon.services.find(
          (service) => service.id === action.payload.serviceId
        );
        if (service) {
          service.service = action.payload.updatedService.service;
          service.price = action.payload.updatedService.price.toString();
        }
      }
      if (state.selectedSalon?.id === action.payload.salonId) {
        const selectedService = state.selectedSalon.services.find(
          (service) => service.id === action.payload.serviceId
        );
        if (selectedService) {
          selectedService.service = action.payload.updatedService.service;
          selectedService.price = action.payload.updatedService.price.toString();
        }
      }
    },
    setSelectedAddress(state, action: PayloadAction<Address | null>) {
      state.selectedAddress = action.payload;
    },
    clearSelectedAddress(state) {
      state.selectedAddress = null;
    },
  },
});

export const { 
  setSalons, 
  selectSalon, 
  clearSelectedSalon,
  updateSalon,
  updateServices,
  removeService,
  editService,
  addService,
  setSelectedAddress,
  clearSelectedAddress
} = salonsSlice.actions;
export default salonsSlice.reducer;
