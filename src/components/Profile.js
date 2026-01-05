import React, { useState } from 'react';

const Profile = ({ balance, onAddFunds }) => {
  const [amount, setAmount] = useState('');

  const handleAddFunds = (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;
    
    onAddFunds(parseFloat(amount));
    setAmount('');
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '30px',
      borderRadius: '16px',
      backdropFilter: 'blur(5px)',
      maxWidth: '500px',
      margin: '40px auto',
      color: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '30px' }}>Profilim</h2>

      <div style={{ 
        background: 'rgba(0, 0, 0, 0.3)', 
        padding: '20px', 
        borderRadius: '12px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: 0, fontSize: '18px', opacity: 0.8 }}>Mevcut Bakiye</h3>
        <div style={{ fontSize: '36px', fontWeight: 'bold', marginTop: '10px', color: '#d4edda' }}>
          ₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
        </div>
      </div>

      <div style={{ marginBottom: '30px' }}>
        <h3 style={{ marginBottom: '15px' }}>Bakiye Yükle</h3>
        <form onSubmit={handleAddFunds} style={{ display: 'flex', gap: '10px' }}>
          <input 
            type="number" 
            placeholder="Miktar (₺)" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px'
            }}
          />
          <button 
            type="submit"
            style={{
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              background: '#28a745',
              color: 'white',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Yükle
          </button>
        </form>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '20px' }}>
        <h3 style={{ marginBottom: '15px' }}>Hesap Ayarları</h3>
        <div style={{ opacity: 0.7, fontSize: '14px', fontStyle: 'italic' }}>
          Kullanıcı adı değiştirme ve tema ayarları yakında eklenecek...
        </div>
      </div>
    </div>
  );
};

export default Profile;
