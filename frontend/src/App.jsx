import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import EntriesPage from './pages/EntriesPage';
import EntryFormPage from './pages/EntryFormPage';
import SocietiesPage from './pages/SocietiesPage';
import HeadingsPage from './pages/HeadingsPage';
import ReportsPage from './pages/ReportsPage';
import UsersPage from './pages/UsersPage';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: { fontSize: '14px', maxWidth: '380px' },
          success: { iconTheme: { primary: '#33965f', secondary: '#fff' } },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<DashboardPage />} />

          <Route path="/societies" element={
            <ProtectedRoute roles={['super_admin']}>
              <SocietiesPage />
            </ProtectedRoute>
          } />

          <Route path="/headings" element={
            <ProtectedRoute roles={['super_admin', 'society_admin']}>
              <HeadingsPage />
            </ProtectedRoute>
          } />

          <Route path="/entries" element={<EntriesPage />} />
          <Route path="/entries/new" element={
            <ProtectedRoute roles={['super_admin', 'society_admin', 'editor']}>
              <EntryFormPage />
            </ProtectedRoute>
          } />
          <Route path="/entries/:entryId/edit" element={
            <ProtectedRoute roles={['super_admin', 'society_admin', 'editor']}>
              <EntryFormPage />
            </ProtectedRoute>
          } />

          <Route path="/reports" element={
            <ProtectedRoute roles={['super_admin', 'society_admin', 'auditor']}>
              <ReportsPage />
            </ProtectedRoute>
          } />

          <Route path="/users" element={
            <ProtectedRoute roles={['super_admin', 'society_admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
