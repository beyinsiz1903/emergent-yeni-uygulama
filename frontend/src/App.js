import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import '@/App.css';
import Layout from '@/components/Layout';
import Dashboard from '@/pages/Dashboard';
import Reservations from '@/pages/Reservations';
import ReservationDetail from '@/pages/ReservationDetail';
import NewReservation from '@/pages/NewReservation';
import Calendar from '@/pages/Calendar';
import Guests from '@/pages/Guests';
import Rooms from '@/pages/Rooms';
import RoomTypes from '@/pages/RoomTypes';
import RMS from '@/pages/RMS';
import Loyalty from '@/pages/Loyalty';
import Marketplace from '@/pages/Marketplace';
import Invoices from '@/pages/Invoices';
import ChannelManager from '@/pages/ChannelManager';
import Settings from '@/pages/Settings';
import PaymentSuccess from '@/pages/PaymentSuccess';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="reservations" element={<Reservations />} />
            <Route path="reservations/new" element={<NewReservation />} />
            <Route path="reservations/:id" element={<ReservationDetail />} />
            <Route path="calendar" element={<Calendar />} />
            <Route path="guests" element={<Guests />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="room-types" element={<RoomTypes />} />
            <Route path="rms" element={<RMS />} />
            <Route path="loyalty" element={<Loyalty />} />
            <Route path="marketplace" element={<Marketplace />} />
            <Route path="invoices" element={<Invoices />} />
            <Route path="channels" element={<ChannelManager />} />
            <Route path="settings" element={<Settings />} />
            <Route path="payment-success" element={<PaymentSuccess />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
