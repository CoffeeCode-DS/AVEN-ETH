import { Routes, Route } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

import Login from "./pages/Login.jsx";
import ClientDashboard from "./pages/ClientDashboard.jsx";
import FreelancerDashboard from "./pages/FreelancerDashboard.jsx";
import Agreements from "./pages/Agreements.jsx";
import CreateAgreement from "./pages/CreateAgreement.jsx";
import AgreementDetail from "./pages/AgreementDetail.jsx";
import WorkSession from "./pages/WorkSession.jsx";
import WorkSessions from "./pages/WorkSessions.jsx";
import Transactions from "./pages/Transactions.jsx";
import Blockchain from "./pages/Blockchain.jsx";
import Security from "./pages/Security.jsx";
import Notifications from "./pages/Notifications.jsx";
import Profile from "./pages/Profile.jsx";
import Reputation from "./pages/Reputation.jsx";
import Attestations from "./pages/Attestations.jsx";
import Wallet from "./pages/Wallet.jsx";
import Landing from "./pages/Landing.jsx";

function Dashboard() {
  const { user } = useAuth();
  return user?.role === "CLIENT" ? <ClientDashboard /> : <FreelancerDashboard />;
}

function HomeRoute() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#000000]">
        <div className="h-8 w-8 rounded-full border-[3px] border-white/10 border-t-[#6366F1] animate-spin" />
      </div>
    );
  }
  // If not logged in, show Landing page by default
  if (!user) return <Landing />;
  // If logged in, show the Dashboard overview
  return (
    <ProtectedRoute>
      <Dashboard />
    </ProtectedRoute>
  );
}

export default function App() {
  return (
    <Routes>
      {/* Root domain: shows Landing for guests, Dashboard for logged-in users */}
      <Route path="/" element={<HomeRoute />} />
      <Route path="/landing" element={<Landing />} />
      <Route path="/login" element={<Login />} />

      {/* Authenticated Dashboard Overview */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/overview"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/wallet"
        element={
          <ProtectedRoute>
            <Wallet />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agreements"
        element={
          <ProtectedRoute>
            <Agreements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agreements/new"
        element={
          <ProtectedRoute role="CLIENT">
            <CreateAgreement />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agreements/:id"
        element={
          <ProtectedRoute>
            <AgreementDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/agreements/:id/work"
        element={
          <ProtectedRoute role="FREELANCER">
            <WorkSession />
          </ProtectedRoute>
        }
      />

      <Route
        path="/work-sessions"
        element={
          <ProtectedRoute role="FREELANCER">
            <WorkSessions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <Transactions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/blockchain"
        element={
          <ProtectedRoute>
            <Blockchain />
          </ProtectedRoute>
        }
      />

      <Route
        path="/security"
        element={
          <ProtectedRoute>
            <Security />
          </ProtectedRoute>
        }
      />

      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        }
      />

      <Route
        path="/reputation"
        element={
          <ProtectedRoute>
            <Reputation />
          </ProtectedRoute>
        }
      />

      <Route
        path="/attestations"
        element={
          <ProtectedRoute>
            <Attestations />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="*"
        element={<HomeRoute />}
      />
    </Routes>
  );
}
