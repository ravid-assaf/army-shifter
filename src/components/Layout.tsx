import React, { ReactNode, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { useStore } from '../store';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const store = useStore();
  const [openResetDialog, setOpenResetDialog] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleReset = () => {
    store.resetStore();
    setOpenResetDialog(false);
    navigate('/settings');
  };

  const showSnackbar = (message: string, severity: 'success' | 'error') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const saveToFile = async (saveAs: boolean = false) => {
    try {
      const data = {
        settings: store.settings,
        persons: store.persons,
        availability: store.availability,
        assignments: store.assignments,
      };

      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      if ('showSaveFilePicker' in window && !saveAs) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: 'shift-schedule.json',
            types: [{
              description: 'JSON File',
              accept: { 'application/json': ['.json'] },
            }],
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          showSnackbar('Settings saved successfully!', 'success');
        } catch (err) {
          // User cancelled or browser doesn't support the API
          saveAs = true;
        }
      }

      if (saveAs) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'shift-schedule.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showSnackbar('Settings saved successfully!', 'success');
      }
    } catch (error) {
      showSnackbar('Error saving settings!', 'error');
      console.error('Error saving settings:', error);
    }
  };

  const loadFromFile = async () => {
    try {
      let file: File;

      if ('showOpenFilePicker' in window) {
        try {
          const [handle] = await (window as any).showOpenFilePicker({
            types: [{
              description: 'JSON File',
              accept: { 'application/json': ['.json'] },
            }],
          });
          file = await handle.getFile();
        } catch (err) {
          // User cancelled or browser doesn't support the API
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.json';
          input.onchange = (e) => {
            const target = e.target as HTMLInputElement;
            if (target.files && target.files[0]) {
              loadFile(target.files[0]);
            }
          };
          input.click();
          return;
        }
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = (e) => {
          const target = e.target as HTMLInputElement;
          if (target.files && target.files[0]) {
            loadFile(target.files[0]);
          }
        };
        input.click();
        return;
      }

      loadFile(file);
    } catch (error) {
      showSnackbar('Error loading settings!', 'error');
      console.error('Error loading settings:', error);
    }
  };

  const loadFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        store.setSettings(data.settings);
        // Update other store values
        Object.entries(data).forEach(([key, value]) => {
          if (key !== 'settings' && key in store) {
            (store as any)[`set${key.charAt(0).toUpperCase() + key.slice(1)}`](value);
          }
        });
        showSnackbar('Settings loaded successfully!', 'success');
      } catch (error) {
        showSnackbar('Error parsing settings file!', 'error');
        console.error('Error parsing settings file:', error);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Shift Scheduler
          </Typography>
          <Button
            color="inherit"
            onClick={() => navigate('/settings')}
            disabled={location.pathname === '/settings'}
          >
            Settings
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/availability')}
            disabled={location.pathname === '/availability'}
          >
            Availability
          </Button>
          <Button
            color="inherit"
            onClick={() => navigate('/schedule')}
            disabled={location.pathname === '/schedule'}
          >
            Schedule
          </Button>
          <Button
            color="inherit"
            startIcon={<SaveIcon />}
            onClick={() => saveToFile(false)}
          >
            Save
          </Button>
          <Button
            color="inherit"
            startIcon={<SaveAsIcon />}
            onClick={() => saveToFile(true)}
          >
            Save As
          </Button>
          <Button
            color="inherit"
            startIcon={<UploadFileIcon />}
            onClick={loadFromFile}
          >
            Load
          </Button>
          <Button color="inherit" onClick={() => setOpenResetDialog(true)}>
            Reset
          </Button>
        </Toolbar>
      </AppBar>

      <Container component="main" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>

      <Dialog open={openResetDialog} onClose={() => setOpenResetDialog(false)}>
        <DialogTitle>Reset All Data</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to reset all data? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenResetDialog(false)}>Cancel</Button>
          <Button onClick={handleReset} color="error" autoFocus>
            Reset
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Layout; 