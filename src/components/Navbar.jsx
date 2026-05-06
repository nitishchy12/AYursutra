import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Leaf, LogOut, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
    setIsOpen(false);
  };

  const toggleMenu = () => setIsOpen(!isOpen);

  // Styling
  const navStyle = {
    position: 'fixed',
    top: 0,
    width: '100%',
    backgroundColor: 'var(--surface-color)',
    boxShadow: 'var(--shadow-sm)',
    zIndex: 1000,
    padding: '1rem 0',
  };

  const containerStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '0 20px',
  };

  const logoStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '1.5rem',
    fontWeight: '700',
    color: 'var(--primary-dark)',
  };

  const desktopMenuStyle = {
    display: 'flex',
    gap: '2rem',
    alignItems: 'center',
  };

  const mobileMenuBtnStyle = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: 'var(--text-primary)',
  };

  const mobileMenuStyle = {
    display: isOpen ? 'flex' : 'none',
    flexDirection: 'column',
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    backgroundColor: 'var(--surface-color)',
    padding: '1rem 20px',
    boxShadow: 'var(--shadow-md)',
    gap: '1rem',
  };

  const navLinkStyle = {
    fontWeight: '600',
    color: 'var(--text-secondary)',
  };

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <Link to="/" style={logoStyle}>
          <Leaf color="var(--primary-color)" />
          AyurSutra
        </Link>

        {/* Desktop Menu */}
        <div style={desktopMenuStyle} className="hidden-mobile">
          {currentUser && (
            <>
              <Link style={navLinkStyle} to="/remedies">Herbs</Link>
              <Link style={navLinkStyle} to="/dosha-test">Dosha Test</Link>
              <Link style={navLinkStyle} to="/therapy">Therapy</Link>
              <Link style={navLinkStyle} to="/centers">Centers</Link>
              <Link style={navLinkStyle} to="/chat">AI Advisor</Link>
              <Link style={navLinkStyle} to="/community">Community</Link>
            </>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            {currentUser ? (
              <>
                <Link to="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: 'var(--primary-dark)', fontWeight: '600' }}>
                  <User size={20} />
                  {userData?.name || 'Dashboard'}
                </Link>
                <NotificationCenter />
                <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <LogOut size={16} /> Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Login</Link>
                <Link to="/signup" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Sign Up</Link>
              </>
            )}
          </div>
        </div>

        {/* Mobile menu toggle */}
        <button style={mobileMenuBtnStyle} className="show-mobile" onClick={toggleMenu}>
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div style={mobileMenuStyle}>
        {currentUser && (
          <>
            <Link style={navLinkStyle} to="/remedies" onClick={toggleMenu}>Herbs</Link>
            <Link style={navLinkStyle} to="/dosha-test" onClick={toggleMenu}>Dosha Test</Link>
            <Link style={navLinkStyle} to="/therapy" onClick={toggleMenu}>Therapy</Link>
            <Link style={navLinkStyle} to="/centers" onClick={toggleMenu}>Centers</Link>
            <Link style={navLinkStyle} to="/chat" onClick={toggleMenu}>AI Advisor</Link>
            <Link style={navLinkStyle} to="/community" onClick={toggleMenu}>Community</Link>
          </>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem' }}>
          {currentUser ? (
            <>
              <Link to="/dashboard" className="btn btn-primary" onClick={toggleMenu}>
                <User size={20} /> Dashboard
              </Link>
              <button onClick={handleLogout} className="btn btn-secondary" style={{ display: 'flex', justifyContent: 'center' }}>
                <LogOut size={20} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" onClick={toggleMenu}>Login</Link>
              <Link to="/signup" className="btn btn-primary" onClick={toggleMenu}>Sign Up</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
