import React from 'react';

const Content = ({ stockData, symbol }) => {
  if (!stockData || !stockData.c) {
    return null;
  }

  const isUp = stockData.d >= 0;

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <div style={{ fontSize: 'clamp(26px, 7vw, 50px)', fontWeight: 'bold', textTransform: 'uppercase', wordBreak: 'break-word' }}>
        {symbol}
      </div>
      <div style={{ fontSize: 'clamp(14px, 4vw, 20px)', fontStyle: 'italic', marginBottom: '20px' }}>
        {new Date().toLocaleDateString('tr-TR')}
      </div>
      
      <div style={{ 
        fontSize: 'clamp(34px, 12vw, 80px)', 
        fontWeight: '900', 
        background: 'rgba(255,255,255,0.2)', 
        borderRadius: '20px', 
        padding: '16px 20px', 
        display: 'inline-block',
        maxWidth: '100%',
        boxShadow: '3px 6px rgba(0,0,0,0.2)'
      }}>
        {stockData.currency === 'TRY' ? '₺' : '$'}{stockData.c}
      </div>
      
      <div style={{ 
        fontSize: 'clamp(18px, 5vw, 30px)', 
        marginTop: '20px', 
        fontWeight: 'bold',
        color: isUp ? '#d4edda' : '#f8d7da'
      }}>
        {isUp ? '▲' : '▼'} {stockData.dp}% ({stockData.d})
      </div>
    </div>
  );
};

export default Content;
