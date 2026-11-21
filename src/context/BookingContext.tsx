import React, { createContext, useCallback, useContext, useState } from 'react';
import { getTodayDateString } from '../constants/tamilNaduDistricts';
import type { Bus, PassengerDetailInput, SearchParamsState, Seat } from '../types';

interface BookingContextValue {
  searchParams: SearchParamsState;
  setSearchParams: React.Dispatch<React.SetStateAction<SearchParamsState>>;
  recentSearches: SearchParamsState[];
  recordSearch: (params: SearchParamsState) => void;
  selectedBus: Bus | null;
  setSelectedBus: (bus: Bus | null) => void;
  selectedSeats: Seat[];
  setSelectedSeats: React.Dispatch<React.SetStateAction<Seat[]>>;
  passengers: PassengerDetailInput[];
  setPassengers: React.Dispatch<React.SetStateAction<PassengerDetailInput[]>>;
  clearBookingFlow: () => void;
}

const BookingContext = createContext<BookingContextValue | undefined>(undefined);

export function BookingProvider({ children }: { children: React.ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParamsState>({
    origin: 'Chennai',
    destination: 'Madurai',
    date: getTodayDateString(),
    acType: 'ALL',
    seatCategory: 'ALL',
  });

  const [recentSearches, setRecentSearches] = useState<SearchParamsState[]>([]);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [passengers, setPassengers] = useState<PassengerDetailInput[]>([]);

  const recordSearch = useCallback((params: SearchParamsState) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter(
        (item) =>
          !(
            item.origin === params.origin &&
            item.destination === params.destination &&
            item.date === params.date
          )
      );
      return [params, ...filtered].slice(0, 4);
    });
  }, []);

  const clearBookingFlow = useCallback(() => {
    setSelectedBus(null);
    setSelectedSeats([]);
    setPassengers([]);
  }, []);

  return (
    <BookingContext.Provider
      value={{
        searchParams,
        setSearchParams,
        recentSearches,
        recordSearch,
        selectedBus,
        setSelectedBus,
        selectedSeats,
        setSelectedSeats,
        passengers,
        setPassengers,
        clearBookingFlow,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking(): BookingContextValue {
  const ctx = useContext(BookingContext);
  if (!ctx) {
    throw new Error('useBooking must be used within BookingProvider');
  }
  return ctx;
}
