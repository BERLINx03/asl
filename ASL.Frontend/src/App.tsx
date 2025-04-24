import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import {
  Login,
  Register,
  DetectionPage,
  AtoFExercise,
  GtoKExercise,
  LtoPExercise,
  QtoUExercise,
  VtoZExercise,
  DictionaryPage,
  CreateMatch,
  JoinMatch,
  ActiveMatches,
  MatchHistory
} from './pages';

const App = () => {
  // Mock auth check - in a real app, would check for JWT token
  const isAuthenticated = localStorage.getItem('token') !== null;

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/detection" 
          element={isAuthenticated ? <DetectionPage /> : <Navigate to="/login" />} 
        />
        
        {/* Exercise Routes */}
        <Route 
          path="/exercises/a-f" 
          element={isAuthenticated ? <AtoFExercise /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/exercises/g-k" 
          element={isAuthenticated ? <GtoKExercise /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/exercises/l-p" 
          element={isAuthenticated ? <LtoPExercise /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/exercises/q-u" 
          element={isAuthenticated ? <QtoUExercise /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/exercises/v-z" 
          element={isAuthenticated ? <VtoZExercise /> : <Navigate to="/login" />} 
        />
        
        {/* Dictionary Route */}
        <Route 
          path="/dictionary" 
          element={isAuthenticated ? <DictionaryPage /> : <Navigate to="/login" />} 
        />
        
        {/* PvP Routes */}
        <Route 
          path="/pvp/create" 
          element={isAuthenticated ? <CreateMatch /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/pvp/join" 
          element={isAuthenticated ? <JoinMatch /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/pvp/active" 
          element={isAuthenticated ? <ActiveMatches /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/pvp/history" 
          element={isAuthenticated ? <MatchHistory /> : <Navigate to="/login" />} 
        />
        
        {/* Default Route */}
        <Route path="/" element={<Navigate to={isAuthenticated ? "/detection" : "/login"} />} />
        
        {/* Catch All Route */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
};

export default App; 