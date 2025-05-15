import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import SettingsScreen from './screens/SettingsScreen';
import AvailabilityScreen from './screens/AvailabilityScreen';
import ScheduleScreen from './screens/ScheduleScreen';
import Layout from './components/Layout';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Navigate to="/settings" replace />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/availability" element={<AvailabilityScreen />} />
            <Route path="/schedule" element={<ScheduleScreen />} />
          </Routes>
        </Layout>
      </Router>
    </ThemeProvider>
  );
}

export default App;
