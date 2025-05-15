import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Alert,
  AlertTitle,
} from '@mui/material';
import { useStore } from '../store';
import type { ShiftAssignment, AvailabilityStatus } from '../types';
import Papa from 'papaparse';

const ScheduleScreen = () => {
  const navigate = useNavigate();
  const { settings, persons, availability, assignments, setAssignments, updateAssignment } =
    useStore();
  const [validationResults, setValidationResults] = useState({
    allShiftsAssigned: false,
    noMultipleShiftsPerDay: false,
    noConsecutiveShifts: false,
  });

  const shiftLabels = ['M', 'E', 'N']; // Morning, Evening, Night

  const generateSchedule = () => {
    let bestAssignments: ShiftAssignment[] = [];
    let foundValid = false;
    for (let attempt = 0; attempt < 100; attempt++) {
      const newAssignments: ShiftAssignment[] = [];
      const personShifts = new Map(persons.map((p) => [p.id, 0]));

      // 1. Assign all required availabilities first
      const requiredAvailabilities = availability.filter((a) => a.status === 'required');
      requiredAvailabilities.forEach((a) => {
        const alreadyAssigned = newAssignments.some(
          (ass) => ass.dayIndex === a.dayIndex && ass.shiftIndex === a.shiftIndex && ass.personId === a.personId
        );
        const person = persons.find((p) => p.id === a.personId);
        const personAssignments = newAssignments.filter((ass) => ass.personId === a.personId).length;
        if (!alreadyAssigned && person && personAssignments < person.maxShifts) {
          newAssignments.push({
            personId: a.personId,
            dayIndex: a.dayIndex,
            shiftIndex: a.shiftIndex,
          });
          personShifts.set(a.personId, (personShifts.get(a.personId) || 0) + 1);
        }
      });

      // 2. Shuffle days and shifts
      const shuffledDays = Array.from({ length: settings.numberOfDays }, (_, i) => i).sort(() => Math.random() - 0.5);
      const shuffledShifts = Array.from({ length: settings.shiftsPerDay }, (_, i) => i).sort(() => Math.random() - 0.5);

      // 3. For each (day, shift) in shuffled order
      for (const dayIndex of shuffledDays) {
        for (const shiftIndex of shuffledShifts) {
          const requiredPersons = settings.personsPerShift[shiftIndex] || 1;
          let currentAssignments = newAssignments.filter(
            (a) => a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
          );
          if (currentAssignments.length >= requiredPersons) continue;

          // 2. Find eligible persons
          let eligiblePersons = persons.filter((person) => {
            const personAssignments = newAssignments.filter((a) => a.personId === person.id).length;
            const isUnavailable = availability.some(
              (a) => a.personId === person.id && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex && a.status === 'unavailable'
            );
            const alreadyAssigned = newAssignments.some(
              (a) => a.personId === person.id && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
            );
            // New: check previous and next shift
            const assignedPrevShift = shiftIndex > 0 && newAssignments.some(
              (a) => a.personId === person.id && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex - 1
            );
            const assignedNextShift = shiftIndex < settings.shiftsPerDay - 1 && newAssignments.some(
              (a) => a.personId === person.id && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex + 1
            );
            // Also check previous day's last shift if this is the first shift of the day
            const assignedPrevDayLastShift =
              shiftIndex === 0 &&
              dayIndex > 0 &&
              newAssignments.some(
                (a) =>
                  a.personId === person.id &&
                  a.dayIndex === dayIndex - 1 &&
                  a.shiftIndex === settings.shiftsPerDay - 1
              );
            // Also check next day's first shift if this is the last shift of the day
            const assignedNextDayFirstShift =
              shiftIndex === settings.shiftsPerDay - 1 &&
              dayIndex < settings.numberOfDays - 1 &&
              newAssignments.some(
                (a) =>
                  a.personId === person.id &&
                  a.dayIndex === dayIndex + 1 &&
                  a.shiftIndex === 0
              );
            return (
              !isUnavailable &&
              !alreadyAssigned &&
              personAssignments < person.maxShifts &&
              !assignedPrevShift &&
              !assignedNextShift &&
              !assignedPrevDayLastShift &&
              !assignedNextDayFirstShift
            );
          });
          if (eligiblePersons.length === 0) continue;
          // Find the minimum number of assignments among eligible persons
          const minAssignments = Math.min(...eligiblePersons.map(person => newAssignments.filter((a) => a.personId === person.id).length));
          eligiblePersons = eligiblePersons.filter(person => newAssignments.filter((a) => a.personId === person.id).length === minAssignments);

          // 3. Preferred assignment
          let preferredPersons = eligiblePersons.filter((person) =>
            availability.some(
              (a) => a.personId === person.id && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex && a.status === 'preferred'
            )
          );
          if (preferredPersons.length > 0) {
            preferredPersons = preferredPersons.sort(() => Math.random() - 0.5);
            const person = preferredPersons[0];
            newAssignments.push({
              personId: person.id,
              dayIndex,
              shiftIndex,
            });
            personShifts.set(person.id, (personShifts.get(person.id) || 0) + 1);
          } else {
            // 4. Fallback: assign first shuffled eligible person
            eligiblePersons = eligiblePersons.sort(() => Math.random() - 0.5);
            const person = eligiblePersons[0];
            newAssignments.push({
              personId: person.id,
              dayIndex,
              shiftIndex,
            });
            personShifts.set(person.id, (personShifts.get(person.id) || 0) + 1);
          }
        }
      }

      // Check if all shifts are fully assigned
      let allAssigned = true;
      for (let dayIndex = 0; dayIndex < settings.numberOfDays; dayIndex++) {
        for (let shiftIndex = 0; shiftIndex < settings.shiftsPerDay; shiftIndex++) {
          const requiredPersons = settings.personsPerShift[shiftIndex] || 1;
          const assignedCount = newAssignments.filter(
            (a) => a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
          ).length;
          if (assignedCount < requiredPersons) {
            allAssigned = false;
            break;
          }
        }
        if (!allAssigned) break;
      }
      if (allAssigned) {
        bestAssignments = newAssignments;
        foundValid = true;
        break;
      }
      // Optionally, keep the best (most filled) schedule so far
      if (newAssignments.length > bestAssignments.length) {
        bestAssignments = newAssignments;
      }
    }
    setAssignments(bestAssignments);
  };

  const validateSchedule = () => {
    const results = {
      allShiftsAssigned: true,
      noMultipleShiftsPerDay: true,
      noConsecutiveShifts: true,
    };

    // Check if all shifts are assigned with required number of persons
    for (let dayIndex = 0; dayIndex < settings.numberOfDays; dayIndex++) {
      for (let shiftIndex = 0; shiftIndex < settings.shiftsPerDay; shiftIndex++) {
        const requiredPersons = settings.personsPerShift[shiftIndex] || 1;
        const assignedPersons = assignments.filter(
          (a) => a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
        ).length;

        if (assignedPersons < requiredPersons) {
          results.allShiftsAssigned = false;
          break;
        }
      }
    }

    // Check for multiple shifts per day
    for (const person of persons) {
      for (let dayIndex = 0; dayIndex < settings.numberOfDays; dayIndex++) {
        const shiftsOnDay = assignments.filter(
          (a) => a.personId === person.id && a.dayIndex === dayIndex
        ).length;

        if (shiftsOnDay > 1) {
          results.noMultipleShiftsPerDay = false;
          break;
        }
      }
    }

    // Check for consecutive shifts
    for (const person of persons) {
      for (let dayIndex = 0; dayIndex < settings.numberOfDays - 1; dayIndex++) {
        const hasNightShift = assignments.some(
          (a) =>
            a.personId === person.id &&
            a.dayIndex === dayIndex &&
            a.shiftIndex === settings.shiftsPerDay - 1
        );
        const hasNextMorningShift = assignments.some(
          (a) =>
            a.personId === person.id &&
            a.dayIndex === dayIndex + 1 &&
            a.shiftIndex === 0
        );

        if (hasNightShift && hasNextMorningShift) {
          results.noConsecutiveShifts = false;
          break;
        }
      }
    }

    setValidationResults(results);
  };

  useEffect(() => {
    validateSchedule();
  }, [assignments]);

  const exportToCSV = () => {
    const data = assignments.map((assignment) => {
      const person = persons.find((p) => p.id === assignment.personId);
      const date = new Date(settings.startDate);
      date.setDate(date.getDate() + assignment.dayIndex);
      return {
        Date: date.toISOString().split('T')[0],
        Shift: `Shift ${assignment.shiftIndex + 1}`,
        Person: person?.name || 'Unknown',
      };
    });

    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'schedule.csv';
    link.click();
  };

  const getPersonShifts = (personId: string) => {
    return assignments.filter((a) => a.personId === personId).length;
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Schedule
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Validation Results
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Alert
            severity={validationResults.allShiftsAssigned ? 'success' : 'error'}
          >
            <AlertTitle>
              {validationResults.allShiftsAssigned
                ? 'All shifts are properly assigned'
                : 'Some shifts are not fully assigned'}
            </AlertTitle>
          </Alert>
          <Alert
            severity={validationResults.noMultipleShiftsPerDay ? 'success' : 'error'}
          >
            <AlertTitle>
              {validationResults.noMultipleShiftsPerDay
                ? 'No person has multiple shifts per day'
                : 'Some persons have multiple shifts per day'}
            </AlertTitle>
          </Alert>
          <Alert
            severity={validationResults.noConsecutiveShifts ? 'success' : 'error'}
          >
            <AlertTitle>
              {validationResults.noConsecutiveShifts
                ? 'No consecutive shifts assigned'
                : 'Some persons have consecutive shifts'}
            </AlertTitle>
          </Alert>
        </Box>
      </Box>

      <Box sx={{ mb: 4, display: 'flex', gap: 2 }}>
        <Button variant="contained" onClick={generateSchedule}>
          Generate Schedule
        </Button>
        <Button variant="outlined" onClick={exportToCSV}>
          Export to CSV
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Day</TableCell>
              {Array.from({ length: settings.shiftsPerDay }).map((_, index) => (
                <TableCell key={index}>{shiftLabels[index] || `Shift ${index + 1}`}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {Array.from({ length: settings.numberOfDays }).map((_, dayIndex) => (
              <TableRow key={dayIndex}>
                <TableCell>
                  {new Date(
                    new Date(settings.startDate).getTime() + dayIndex * 24 * 60 * 60 * 1000
                  ).toLocaleDateString()}
                </TableCell>
                {Array.from({ length: settings.shiftsPerDay }).map((_, shiftIndex) => {
                  const shiftAssignments = assignments.filter(
                    (a) => a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
                  );
                  const requiredPersons = settings.personsPerShift[shiftIndex] || 1;

                  return (
                    <TableCell
                      key={shiftIndex}
                      sx={{
                        backgroundColor:
                          shiftAssignments.length < requiredPersons ? '#ffebee' : 'inherit',
                      }}
                    >
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        {shiftAssignments.map((assignment) => {
                          const person = persons.find((p) => p.id === assignment.personId);
                          return (
                            <Chip
                              key={assignment.personId}
                              label={person?.name}
                              sx={{
                                backgroundColor: person?.color,
                                color: '#000',
                              }}
                            />
                          );
                        })}
                        {shiftAssignments.length < requiredPersons && (
                          <FormControl fullWidth size="small">
                            <InputLabel>Add Person</InputLabel>
                            <Select
                              value=""
                              label="Add Person"
                              onChange={(e) =>
                                updateAssignment(dayIndex, shiftIndex, e.target.value)
                              }
                            >
                              {persons.map((person) => (
                                <MenuItem key={person.id} value={person.id}>
                                  {person.name}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </Box>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Shift counters summary below the table */}
      <Box sx={{ mt: 4 }}>
        <Typography variant="h6" gutterBottom>
          Shift Assignment Summary
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {persons.map((person) => (
            <Chip
              key={person.id}
              label={`${person.name}: ${getPersonShifts(person.id)}/${person.maxShifts}`}
              sx={{ backgroundColor: person.color, color: '#000', fontWeight: 500 }}
            />
          ))}
        </Box>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/availability')}>
          Back to Availability
        </Button>
      </Box>
    </Box>
  );
};

export default ScheduleScreen; 