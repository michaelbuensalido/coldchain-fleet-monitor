import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Dashboard from './pages/Dashboard';
import VehicleDetail from './pages/VehicleDetail';
import HistoryLog from './pages/HistoryLog';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Navigate to="/fleet" replace />} />
          <Route path="/" element={<Dashboard />} />
          <Route path="/fleet" element={<Dashboard />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/history" element={<HistoryLog />} />
          <Route path="*" element={<Navigate to="/fleet" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
