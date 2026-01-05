import React from 'react';

const MarketCard = ({ title, price, change, isCurrency }) => {
  const isUp = change >= 0;
  const changeColor = isUp ? '#d4edda' : '#f8d7da';
  const arrow = isUp ? '▲' : '▼';

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      borderRadius: '10px',
      padding: '15px',
      marginBottom: '10px',
      backdropFilter: 'blur(5px)',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      width: '100%'
    }}>
      <div style={{ textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: '18px' }}>{title}</div>
        <div style={{ fontSize: '24px', fontWeight: '900' }}>
          {isCurrency ? '₺' : '$'}{price}
        </div>
      </div>
      {change !== undefined && (
        <div style={{ 
          color: changeColor, 
          fontWeight: 'bold', 
          textAlign: 'right',
          fontSize: '14px'
        }}>
          <div>{arrow} {change}%</div>
        </div>
      )}
    </div>
  );
};

const MarketOverview = ({ rates }) => {
  return (
    <div className="market-overview">
      <h3 style={{ marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.3)', paddingBottom: '5px' }}>
        Piyasa Özeti
      </h3>
      
      {rates.usd && (
        <MarketCard title="DOLAR" price={rates.usd} isCurrency={true} />
      )}
      
      {rates.eur && (
        <MarketCard title="EURO" price={rates.eur} isCurrency={true} />
      )}
    </div>
  );
};

export default MarketOverview;
