import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  Grid,
  IconButton,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { useStore } from '../store';

const SettingsScreen = () => {
  const navigate = useNavigate();
  const { settings, persons, setSettings, addPerson, updatePerson, removePerson } = useStore();
  const [newPersonName, setNewPersonName] = useState('');
  const [newPersonMaxShifts, setNewPersonMaxShifts] = useState(3);
  const [editingPerson, setEditingPerson] = useState<string | null>(null);
  const shiftLabels = ['M', 'E', 'N']; // Morning, Evening, Night

  const handleSettingsChange = (field: string, value: string | number) => {
    setSettings({ [field]: value });
  };

  const handleAddPerson = () => {
    if (newPersonName.trim()) {
      addPerson(newPersonName.trim(), newPersonMaxShifts);
      setNewPersonName('');
      setNewPersonMaxShifts(3);
    }
  };

  const handleUpdatePerson = (id: string, name: string, maxShifts: number) => {
    updatePerson(id, { name, maxShifts });
    setEditingPerson(null);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Basic Settings
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Shifts per Day"
              type="number"
              value={settings.shiftsPerDay}
              onChange={(e) => handleSettingsChange('shiftsPerDay', parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Start Date"
              type="date"
              value={settings.startDate}
              onChange={(e) => handleSettingsChange('startDate', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Number of Days"
              type="number"
              value={settings.numberOfDays}
              onChange={(e) => handleSettingsChange('numberOfDays', parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Persons per Shift
        </Typography>
        <Grid container spacing={2}>
          {Array.from({ length: settings.shiftsPerDay }).map((_, index) => (
            <Grid item xs={12} sm={4} key={index}>
              <TextField
                fullWidth
                label={shiftLabels[index] || `Shift ${index + 1}`}
                type="number"
                value={settings.personsPerShift[index] || 1}
                onChange={(e) => {
                  const newPersonsPerShift = [...settings.personsPerShift];
                  newPersonsPerShift[index] = parseInt(e.target.value);
                  setSettings({ personsPerShift: newPersonsPerShift });
                }}
                inputProps={{ min: 1 }}
              />
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add Person
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Name"
              value={newPersonName}
              onChange={(e) => setNewPersonName(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={5}>
            <TextField
              fullWidth
              label="Max Shifts"
              type="number"
              value={newPersonMaxShifts}
              onChange={(e) => setNewPersonMaxShifts(parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleAddPerson}
              disabled={!newPersonName.trim()}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Persons List
        </Typography>
        <Grid container spacing={2}>
          {persons.map((person) => (
            <Grid item xs={12} sm={6} md={4} key={person.id}>
              <Card>
                <CardContent>
                  {editingPerson === person.id ? (
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Name"
                          value={person.name}
                          onChange={(e) =>
                            handleUpdatePerson(person.id, e.target.value, person.maxShifts)
                          }
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                          fullWidth
                          label="Max Shifts"
                          type="number"
                          value={person.maxShifts}
                          onChange={(e) =>
                            handleUpdatePerson(person.id, person.name, parseInt(e.target.value))
                          }
                          inputProps={{ min: 1 }}
                        />
                      </Grid>
                    </Grid>
                  ) : (
                    <>
                      <Typography variant="h6">{person.name}</Typography>
                      <Typography color="textSecondary">
                        Max Shifts: {person.maxShifts}
                      </Typography>
                    </>
                  )}
                </CardContent>
                <CardActions>
                  <IconButton
                    onClick={() =>
                      setEditingPerson(editingPerson === person.id ? null : person.id)
                    }
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => removePerson(person.id)}>
                    <DeleteIcon />
                  </IconButton>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => navigate('/availability')}
          disabled={persons.length === 0}
        >
          Next: Set Availability
        </Button>
      </Box>
    </Box>
  );
};

export default SettingsScreen; 