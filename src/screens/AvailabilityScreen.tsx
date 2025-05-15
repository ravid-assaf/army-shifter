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
  Tooltip,
} from '@mui/material';
import { useStore } from '../store';
import type { AvailabilityStatus } from '../types';

const availabilityColors = {
  available: '#4caf50', // green
  unavailable: '#f44336', // red
  preferred: '#ffeb3b', // yellow
  required: '#2196f3', // blue
};

const availabilityStatuses: AvailabilityStatus[] = [
  'available',
  'unavailable',
  'preferred',
  'required',
];

const shiftLabels = ['M', 'E', 'N']; // Morning, Evening, Night

function getDayNameAndDate(startDate: string, dayIndex: number) {
  const date = new Date(startDate);
  date.setDate(date.getDate() + dayIndex);
  const dayName = date.toLocaleDateString('en-US', { weekday: 'long' });
  const dayDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { dayName, dayDate };
}

const AvailabilityScreen = () => {
  const navigate = useNavigate();
  const { settings, persons, availability, setAvailability } = useStore();

  const getAvailabilityStatus = (personId: string, dayIndex: number, shiftIndex: number) => {
    const found = availability.find(
      (a) => a.personId === personId && a.dayIndex === dayIndex && a.shiftIndex === shiftIndex
    );
    return found?.status || 'available';
  };

  const handleCellClick = (personId: string, dayIndex: number, shiftIndex: number) => {
    const currentStatus = getAvailabilityStatus(personId, dayIndex, shiftIndex);
    const currentIndex = availabilityStatuses.indexOf(currentStatus as AvailabilityStatus);
    const nextIndex = (currentIndex + 1) % availabilityStatuses.length;
    const nextStatus = availabilityStatuses[nextIndex];
    setAvailability(personId, dayIndex, shiftIndex, nextStatus);
  };

  const getDayColor = (dayIndex: number) => {
    return dayIndex % 2 === 0 ? '#f5f5f5' : '#ffffff';
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Availability Matrix
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Legend
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {availabilityStatuses.map((status) => (
            <Box
              key={status}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
              }}
            >
              <Box
                sx={{
                  width: 20,
                  height: 20,
                  backgroundColor: availabilityColors[status],
                  border: '1px solid #ccc',
                  borderRadius: '50%',
                }}
              />
              <Typography>{status}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650, borderCollapse: 'separate', borderSpacing: 0 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', minWidth: 100, background: '#fafafa', borderRight: '2px solid #eee' }}>Person</TableCell>
              {Array.from({ length: settings.numberOfDays }).map((_, dayIndex) => {
                const { dayName, dayDate } = getDayNameAndDate(settings.startDate, dayIndex);
                return (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{ background: '#fafafa', borderRight: '2px solid #eee', borderBottom: 0 }}
                  >
                    <Box sx={{ fontWeight: 'bold', fontSize: 16 }}>{dayName}</Box>
                    <Box sx={{ fontSize: 13, color: '#888' }}>{dayDate}</Box>
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
          <TableBody>
            {persons.map((person) => (
              <TableRow key={person.id}>
                <TableCell sx={{ fontWeight: 'bold', borderRight: '2px solid #eee', background: '#fafafa' }}>{person.name}</TableCell>
                {Array.from({ length: settings.numberOfDays }).map((_, dayIndex) => (
                  <TableCell
                    key={dayIndex}
                    align="center"
                    sx={{ borderRight: '2px solid #eee', borderBottom: '1px solid #eee', padding: '8px 4px', background: getDayColor(dayIndex) }}
                  >
                    <Box sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', gap: 1 }}>
                      {Array.from({ length: settings.shiftsPerDay }).map((_, shiftIndex) => {
                        const status = getAvailabilityStatus(person.id, dayIndex, shiftIndex);
                        const label = shiftLabels[shiftIndex] || `S${shiftIndex + 1}`;
                        return (
                          <Tooltip
                            key={shiftIndex}
                            title={`${person.name} - ${label} - ${dayIndex + 1}`}
                          >
                            <Box
                              onClick={() => handleCellClick(person.id, dayIndex, shiftIndex)}
                              sx={{
                                width: 36,
                                height: 32,
                                backgroundColor: availabilityColors[status],
                                color: status === 'preferred' ? '#000' : '#fff',
                                borderRadius: 1.5,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: 18,
                                mx: 0.5,
                                cursor: 'pointer',
                                border: '2px solid #fff',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                                transition: 'opacity 0.2s',
                                '&:hover': {
                                  opacity: 0.8,
                                },
                              }}
                            >
                              {label}
                            </Box>
                          </Tooltip>
                        );
                      })}
                    </Box>
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button variant="outlined" onClick={() => navigate('/settings')}>
          Back to Settings
        </Button>
        <Button variant="contained" color="primary" onClick={() => navigate('/schedule')}>
          Next: Generate Schedule
        </Button>
      </Box>
    </Box>
  );
};

export default AvailabilityScreen; 