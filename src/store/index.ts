import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AppState, Person, ShiftSettings, Availability, ShiftAssignment } from '../types';
import { v4 as uuidv4 } from 'uuid';

interface StoreState extends AppState {
  // Settings actions
  setSettings: (settings: Partial<ShiftSettings>) => void;
  
  // Person actions
  addPerson: (name: string, maxShifts: number) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  removePerson: (id: string) => void;
  
  // Availability actions
  setAvailability: (personId: string, dayIndex: number, shiftIndex: number, status: string) => void;
  
  // Assignment actions
  setAssignments: (assignments: ShiftAssignment[]) => void;
  updateAssignment: (dayIndex: number, shiftIndex: number, personId: string | null) => void;
  
  // Reset action
  resetStore: () => void;
}

const initialState: AppState = {
  settings: {
    shiftsPerDay: 3,
    startDate: new Date().toISOString().split('T')[0],
    numberOfDays: 7,
    personsPerShift: [1, 1, 1],
  },
  persons: [],
  availability: [],
  assignments: [],
};

export const useStore = create<StoreState>()(
  persist(
    (set) => ({
      ...initialState,

      setSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      addPerson: (name, maxShifts) =>
        set((state) => ({
          persons: [
            ...state.persons,
            {
              id: uuidv4(),
              name,
              maxShifts,
              color: `#${Math.floor(Math.random()*16777215).toString(16)}`,
            },
          ],
        })),

      updatePerson: (id, updates) =>
        set((state) => ({
          persons: state.persons.map((person) =>
            person.id === id ? { ...person, ...updates } : person
          ),
        })),

      removePerson: (id) =>
        set((state) => ({
          persons: state.persons.filter((person) => person.id !== id),
          availability: state.availability.filter((a) => a.personId !== id),
          assignments: state.assignments.filter((a) => a.personId !== id),
        })),

      setAvailability: (personId, dayIndex, shiftIndex, status) =>
        set((state) => {
          const existingIndex = state.availability.findIndex(
            (a) =>
              a.personId === personId &&
              a.dayIndex === dayIndex &&
              a.shiftIndex === shiftIndex
          );

          if (existingIndex >= 0) {
            const newAvailability = [...state.availability];
            newAvailability[existingIndex] = {
              ...newAvailability[existingIndex],
              status: status as any,
            };
            return { availability: newAvailability };
          }

          return {
            availability: [
              ...state.availability,
              { personId, dayIndex, shiftIndex, status: status as any },
            ],
          };
        }),

      setAssignments: (assignments) =>
        set(() => ({
          assignments,
        })),

      updateAssignment: (dayIndex, shiftIndex, personId) =>
        set((state) => {
          const newAssignments = state.assignments.filter(
            (a) => !(a.dayIndex === dayIndex && a.shiftIndex === shiftIndex)
          );
          if (personId) {
            newAssignments.push({ personId, dayIndex, shiftIndex });
          }
          return { assignments: newAssignments };
        }),

      resetStore: () => set(initialState),
    }),
    {
      name: 'shift-scheduler-storage',
    }
  )
); 