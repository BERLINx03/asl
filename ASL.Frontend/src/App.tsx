import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import {
  Login,
  Register,
  DetectionPage,
  AtoFExercise,
  // GtoKExercise,
  // LtoPExercise,
  // QtoUExercise,
  // VtoZExercise,
  ExercisesPage,
  DictionaryPage,
  CreateMatch,
  JoinMatch,
  ActiveMatches,
  MatchHistory
} from './pages';
import { Navbar } from './components';
import './App.css';
// import GamePage from './pages/pvp/GamePage';
import GameBPage from './pages/pvp/GameBPage';

// Layout component that includes Navbar
const Layout = ({ children, requireAuth = true }: { children: React.ReactNode, requireAuth?: boolean }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const isDetectionPage = location.pathname === '/detection';
  
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // Special case for detection page - no padding/margins
  if (isDetectionPage) {
    return (
      <div className="app-layout detection-page-container">
        {isAuthenticated && <Navbar />}
        <main className="app-content detection-page-content">
          {children}
        </main>
      </div>
    );
  }
  
  // Regular layout for other pages
  return (
    <div className="app-layout">
      {isAuthenticated && <Navbar />}
      <main className="app-content">
        {children}
      </main>
    </div>
  );
};

const App = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/detection" />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route 
          path="/detection" 
          element={
            <Layout>
              <DetectionPage />
            </Layout>
          } 
        />
        
        {/* Exercise Routes */}
        <Route 
          path="/exercises" 
          element={
            <Layout>
              <ExercisesPage />
            </Layout>
          } 
        />
        <Route 
          path="/exercises/a-f" 
          element={
            <Layout>
              <AtoFExercise />
            </Layout>
          } 
        />
        {/* TODO: Add the other exercises */}
        {/* <Route 
          path="/exercises/g-k" 
          element={
            <Layout>
              <GtoKExercise />
            </Layout>
          } 
        />
        <Route 
          path="/exercises/l-p" 
          element={
            <Layout>
              <LtoPExercise />
            </Layout>
          } 
        />
        <Route 
          path="/exercises/q-u" 
          element={
            <Layout>
              <QtoUExercise />
            </Layout>
          } 
        />
        <Route 
          path="/exercises/v-z" 
          element={
            <Layout>
              <VtoZExercise />
            </Layout>
          } 
        />
         */}
        {/* Dictionary Route */}
        <Route 
          path="/dictionary" 
          element={
            <Layout>
              <DictionaryPage />
            </Layout>
          } 
        />
        
        {/* PvP Routes */}
        {/* <Route 
          path="/pvp/game/:word/:matchid" 
          element={
            <Layout>
              <GamePage />
            </Layout>
          } 
        /> */}
        <Route 
          path="/pvp/gameb/:word/:matchid" 
          element={
            <Layout>
              <GameBPage />
            </Layout>
          } 
        />
         <Route 
          path="/pvp/create" 
          element={
            <Layout>
              <CreateMatch />
            </Layout>
          } 
        />
        <Route 
          path="/pvp/join" 
          element={
            <Layout>
              <JoinMatch />
            </Layout>
          } 
        />
        <Route 
          path="/pvp/active" 
          element={
            <Layout>
              <ActiveMatches />
            </Layout>
          } 
        />
        <Route 
          path="/pvp/history" 
          element={
            <Layout>
              <MatchHistory />
            </Layout>
          } 
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