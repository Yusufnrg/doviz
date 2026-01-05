import React from 'react';

const Header = ({ activeTab, onTabChange }) => {
  const tabStyle = (tabName) => ({
    padding: '10px 20px',
    margin: '0 10px',
    cursor: 'pointer',
    borderBottom: activeTab === tabName ? '3px solid white' : '3px solid transparent',
    fontWeight: activeTab === tabName ? 'bold' : 'normal',
    opacity: activeTab === tabName ? 1 : 0.7,
    transition: '0.3s'
  });

  return (
    <header style={{ marginTop: '20px', textAlign: 'center' }}>
      <h1>📈 Borsa Takip</h1>
      <p style={{ fontSize: '14px', marginTop: '5px', marginBottom: '20px' }}>Anlık Hisse Senedi Verileri</p>
      
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
        <div style={tabStyle('market')} onClick={() => onTabChange('market')}>
          Piyasa
        </div>
        <div style={tabStyle('buy')} onClick={() => onTabChange('buy')}>
          Satın Al
        </div>
        <div style={tabStyle('portfolio')} onClick={() => onTabChange('portfolio')}>
          Portföy
        </div>
        <div style={tabStyle('profile')} onClick={() => onTabChange('profile')}>
          Profil
        </div>
      </div>
    </header>
  );
};

export default Header;
