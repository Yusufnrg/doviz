import React from 'react';

const Content = ({ stockData, symbol }) => {
  if (!stockData || !stockData.c) {
    return null;
  }

  const isUp = stockData.d >= 0;

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <div style={{ fontSize: '50px', fontWeight: 'bold', textTransform: 'uppercase' }}>
        {symbol}
      </div>
      <div style={{ fontSize: '20px', fontStyle: 'italic', marginBottom: '20px' }}>
        {new Date().toLocaleDateString('tr-TR')}
      </div>
      
      <div style={{ 
        fontSize: '80px', 
        fontWeight: '900', 
        background: 'rgba(255,255,255,0.2)', 
        borderRadius: '20px', 
        padding: '20px 40px', 
        display: 'inline-block',
        boxShadow: '3px 6px rgba(0,0,0,0.2)'
      }}>
        {stockData.currency === 'TRY' ? '₺' : '$'}{stockData.c}
      </div>
      
      <div style={{ 
        fontSize: '30px', 
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
