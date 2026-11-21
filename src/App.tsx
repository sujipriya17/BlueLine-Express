import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { BookingProvider } from './context/BookingContext';
import { ToastProvider } from './context/ToastContext';
import { AboutUsPage } from './pages/AboutUsPage';
import { AdminAddBusPage } from './pages/admin/AdminAddBusPage';
import { AdminAddRoutePage } from './pages/admin/AdminAddRoutePage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminEditBusPage } from './pages/admin/AdminEditBusPage';
import { AdminLoginPage } from './pages/admin/AdminLoginPage';
import { AdminManageBookingsPage } from './pages/admin/AdminManageBookingsPage';
import { AdminManageBusesPage } from './pages/admin/AdminManageBusesPage';
import { AdminManagePassengersPage } from './pages/admin/AdminManagePassengersPage';
import { AdminManageRoutesPage } from './pages/admin/AdminManageRoutesPage';
import { AdminManageSeatsPage } from './pages/admin/AdminManageSeatsPage';
import { AdminReportsPage } from './pages/admin/AdminReportsPage';
import { AvailableBusesPage } from './pages/AvailableBusesPage';
import { BookingCancellationPage } from './pages/BookingCancellationPage';
import { BookingConfirmationPage } from './pages/BookingConfirmationPage';
import { BookingDetailsPage } from './pages/BookingDetailsPage';
import { CancellationHistoryPage } from './pages/CancellationHistoryPage';
import { ContactUsPage } from './pages/ContactUsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { MyBookingsPage } from './pages/MyBookingsPage';
import { PassengerDashboardPage } from './pages/PassengerDashboardPage';
import { PassengerDetailsPage } from './pages/PassengerDetailsPage';
import { PaymentPage } from './pages/PaymentPage';
import { RegisterPage } from './pages/RegisterPage';
import { SearchBusesPage } from './pages/SearchBusesPage';
import { SeatSelectionPage } from './pages/SeatSelectionPage';

export default function App() {
  return (
    <AuthProvider>
      <BookingProvider>
        <ToastProvider>
          <BrowserRouter>
            <Routes>
              {/* Public & Passenger Routes */}
              <Route path="/" element={<HomePage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/search" element={<SearchBusesPage />} />
              <Route path="/buses" element={<AvailableBusesPage />} />
              <Route path="/buses/:id/seats" element={<SeatSelectionPage />} />
              <Route path="/about" element={<AboutUsPage />} />
              <Route path="/contact" element={<ContactUsPage />} />

              {/* Protected Passenger Routes */}
              <Route
                path="/booking/passengers"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <PassengerDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/payment"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <PaymentPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/booking/confirmation/:bookingId"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <BookingConfirmationPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <PassengerDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-bookings"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <MyBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/bookings/:id"
                element={
                  <ProtectedRoute>
                    <BookingDetailsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/cancellations/new"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <BookingCancellationPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/cancel-booking" element={<Navigate to="/cancellations/new" replace />} />
              <Route
                path="/cancellations/history"
                element={
                  <ProtectedRoute requiredRole="PASSENGER">
                    <CancellationHistoryPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin Portal Routes */}
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/buses"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminManageBusesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/buses/new"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminAddBusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/buses/:id/edit"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminEditBusPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/routes"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminManageRoutesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/routes/new"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminAddRoutePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/passengers"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminManagePassengersPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/bookings"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminManageBookingsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/seats"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminManageSeatsPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/reports"
                element={
                  <ProtectedRoute requiredRole="ADMIN">
                    <AdminReportsPage />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </BookingProvider>
    </AuthProvider>
  );
}
