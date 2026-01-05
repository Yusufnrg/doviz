import React from 'react';

export const popularStocks = [
  { category: 'Popüler BIST 100', symbols: ['THYAO.IS', 'GARAN.IS', 'ASELS.IS', 'AKBNK.IS', 'EREGL.IS', 'SISE.IS', 'KCHOL.IS', 'SAHOL.IS', 'TUPRS.IS', 'BIMAS.IS'] },
  { category: 'ABD Teknoloji', symbols: ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX'] },
  { category: 'Kripto Paralar', symbols: ['BTC', 'ETH', 'SOL', 'AVAX', 'DOGE', 'XRP', 'ADA'] },
  { category: 'Döviz & Emtia', symbols: ['USD', 'EUR', 'XAU/USD'] }
];

const StockList = ({ onSelect }) => {
  return (
    <div style={{
      height: '100%',
      overflowY: 'auto',
      padding: '10px',
      background: 'rgba(0, 0, 0, 0.2)',
      borderRadius: '12px',
      color: 'white'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>Piyasa Ekranı</h3>
      
      {popularStocks.map((group, index) => (
        <div key={index} style={{ marginBottom: '20px' }}>
          <h4 style={{ color: '#ffc107', marginBottom: '10px', fontSize: '14px', textTransform: 'uppercase' }}>{group.category}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '10px' }}>
            {group.symbols.map(sym => (
              <div 
                key={sym}
                onClick={() => onSelect(sym)}
                style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '10px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  transition: '0.2s',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}
                onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.2)'}
                onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'}
              >
                {sym.replace('.IS', '')}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StockList;
