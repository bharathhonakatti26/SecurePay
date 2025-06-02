import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Landing_page from './Components/landing_page';
import Login from './Components/login';
import CreateAccount from './Components/create_account';
import Dashboard from './Components/dashboard';
import Profile from './Components/profile';
import ProtectedRoute from './Components/ProtectedRoute';
import Layout from './Components/Layout'; // Import the Layout component
import Cards from './Components/cards'; // Import the Cards component
import TransactionHistory from './Components/TransactionHistory'; // Import the TransactionHistory component
import FraudReport from './Components/FraudReport'; // Import the FraudReport component
import Support from './Components/Support'; // Import the Support component

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing_page />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-account" element={<CreateAccount />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="profile" element={<Profile />} />
          <Route path="cards" element={<Cards />} />
          <Route path="transaction-history" element={<TransactionHistory />} />
          <Route path="fraud-report" element={<FraudReport />} />
          <Route path="support" element={<Support />} /> {/* Add Support route */}
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
