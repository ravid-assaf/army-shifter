export interface Person {
  id: string;
  name: string;
  maxShifts: number;
  color: string;
}

export interface ShiftSettings {
  shiftsPerDay: number;
  startDate: string;
  numberOfDays: number;
  personsPerShift: number[];
}

export type AvailabilityStatus = 'available' | 'unavailable' | 'preferred' | 'required';

export interface Availability {
  personId: string;
  dayIndex: number;
  shiftIndex: number;
  status: AvailabilityStatus;
}

export interface ShiftAssignment {
  personId: string;
  dayIndex: number;
  shiftIndex: number;
}

export interface AppState {
  settings: ShiftSettings;
  persons: Person[];
  availability: Availability[];
  assignments: ShiftAssignment[];
} 