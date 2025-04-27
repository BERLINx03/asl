import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const location = useLocation();
  
  return (
    <nav className="navbar">
      <div className="navbar-logo">
        <Link to="/">ASL Learning</Link>
      </div>
      <ul className="navbar-links">
        <li className={location.pathname === '/detection' ? 'active' : ''}>
          <Link to="/detection">Detection</Link>
        </li>
        <li className={location.pathname.includes('/exercises') ? 'active' : ''}>
          <Link to="/exercises">Exercises</Link>
        </li>
        <li className={location.pathname === '/dictionary' ? 'active' : ''}>
          <Link to="/dictionary">Dictionary</Link>
        </li>
        <li className={location.pathname.includes('/pvp') ? 'active' : ''}>
          <div className="dropdown">
            <span>PvP</span>
            <div className="dropdown-content">
              <Link to="/pvp/create">Create Match</Link>
              <Link to="/pvp/join">Join Match</Link>
              <Link to="/pvp/active">Active Matches</Link>
              <Link to="/pvp/history">Match History</Link>
            </div>
          </div>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar; 