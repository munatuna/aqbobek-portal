import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import StudentDashboard from "./pages/StudentDashboard";
import TeacherDashboard from "./pages/TeacherDashboard";
import ParentDashboard from "./pages/ParentDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import KioskPage from "./pages/KioskPage";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/" replace />;
  return <Layout>{children}</Layout>;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={
        user.role === "Ученик" ? "/student" :
        user.role === "Учитель" ? "/teacher" :
        user.role === "Родитель" ? "/parent" : "/admin"
      } replace /> : <LoginPage />} />
      <Route path="/student" element={<ProtectedRoute allowedRoles={["Ученик"]}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={["Учитель"]}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/parent" element={<ProtectedRoute allowedRoles={["Родитель"]}><ParentDashboard /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute allowedRoles={["Админ"]}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/kiosk" element={<KioskPage />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
