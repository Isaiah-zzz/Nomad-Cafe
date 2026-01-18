import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';
import { ClientAuthProvider, useClientAuth } from './context/ClientAuthContext';
import AdminPrivateRoute from './components/AdminPrivateRoute';
import ClientPrivateRoute from './components/ClientPrivateRoute';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import Customers from './pages/Customers';
import CustomerForm from './pages/CustomerForm';
import CustomerDetail from './pages/CustomerDetail';
import Stories from './pages/Stories';
import AdminStories from './pages/AdminStories';
import StoryForm from './pages/StoryForm';
import StoryDetail from './pages/StoryDetail';

// Client Pages
import ClientLogin from './pages/client/ClientLogin';
import ClientRegister from './pages/client/ClientRegister';
import ClientProfile from './pages/client/ClientProfile';
import ClientStories from './pages/client/ClientStories';
import ClientStoryForm from './pages/client/ClientStoryForm';

const AdminRoutes = () => {
  const { isAuthenticated } = useAdminAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/admin/customers" /> : <AdminLogin />}
      />
      <Route
        path="customers"
        element={
          <AdminPrivateRoute>
            <Customers />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="customers/new"
        element={
          <AdminPrivateRoute>
            <CustomerForm />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="customers/:id"
        element={
          <AdminPrivateRoute>
            <CustomerDetail />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="customers/:id/edit"
        element={
          <AdminPrivateRoute>
            <CustomerForm />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="stories"
        element={
          <AdminPrivateRoute>
            <AdminStories />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="stories/by-customer"
        element={
          <AdminPrivateRoute>
            <Stories />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="stories/new"
        element={
          <AdminPrivateRoute>
            <StoryForm />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="stories/:id"
        element={
          <AdminPrivateRoute>
            <StoryDetail />
          </AdminPrivateRoute>
        }
      />
      <Route
        path="stories/:id/edit"
        element={
          <AdminPrivateRoute>
            <StoryForm />
          </AdminPrivateRoute>
        }
      />
      <Route path="" element={<Navigate to="/admin/customers" />} />
    </Routes>
  );
};

const ClientRoutes = () => {
  const { isAuthenticated } = useClientAuth();

  return (
    <Routes>
      <Route
        path="login"
        element={isAuthenticated ? <Navigate to="/client/profile" /> : <ClientLogin />}
      />
      <Route
        path="register"
        element={isAuthenticated ? <Navigate to="/client/profile" /> : <ClientRegister />}
      />
      <Route
        path="profile"
        element={
          <ClientPrivateRoute>
            <ClientProfile />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="stories"
        element={
          <ClientPrivateRoute>
            <ClientStories />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="stories/new"
        element={
          <ClientPrivateRoute>
            <ClientStoryForm />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="stories/:id"
        element={
          <ClientPrivateRoute>
            <ClientStoryForm />
          </ClientPrivateRoute>
        }
      />
      <Route
        path="stories/published"
        element={
          <ClientPrivateRoute>
            <ClientStories />
          </ClientPrivateRoute>
        }
      />
      <Route path="" element={<Navigate to="/client/profile" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <AdminAuthProvider>
      <ClientAuthProvider>
        <Router>
          <Routes>
            <Route path="/admin/*" element={<AdminRoutes />} />
            <Route path="/client/*" element={<ClientRoutes />} />
            <Route path="/" element={<Navigate to="/client/login" />} />
          </Routes>
        </Router>
      </ClientAuthProvider>
    </AdminAuthProvider>
  );
};

export default App;
