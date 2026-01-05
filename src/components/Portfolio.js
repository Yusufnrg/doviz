import React, { useState } from 'react';
import { fetchStockPrice } from '../utils/stockApi';

const Portfolio = ({ portfolio, onSell, api }) => {
  const [sellingItem, setSellingItem] = useState(null); // Hangi hisse satılıyor?
  const [sellAmount, setSellAmount] = useState('');
  const [currentPrice, setCurrentPrice] = useState(null);
  const [currentCurrency, setCurrentCurrency] = useState('$');
  const [loading, setLoading] = useState(false);

  const totalValue = portfolio.reduce((acc, item) => acc + (item.amount * item.price), 0);

  const handleSellClick = async (item) => {
    setSellingItem(item);
    setSellAmount('');
    setCurrentPrice(null);
    setLoading(true);

    try {
      const { price, currency } = await fetchStockPrice(item.symbol, api.key);
      setCurrentPrice(price);
      setCurrentCurrency(currency);
    } catch (err) {
      console.error("Fiyat alınamadı", err);
      alert("Güncel fiyat alınamadı, lütfen tekrar deneyin.");
      setSellingItem(null);
    } finally {
      setLoading(false);
    }
  };

  const confirmSell = () => {
    if (!sellAmount || parseFloat(sellAmount) <= 0 || parseFloat(sellAmount) > sellingItem.amount) {
      alert("Geçersiz miktar!");
      return;
    }

    onSell(sellingItem.symbol, parseFloat(sellAmount), currentPrice);
    setSellingItem(null);
    setSellAmount('');
    setCurrentPrice(null);
  };

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '30px',
      borderRadius: '16px',
      backdropFilter: 'blur(5px)',
      maxWidth: '700px',
      margin: '40px auto',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '20px' }}>Portföyüm</h2>
      
      {portfolio.length === 0 ? (
        <p>Henüz hiç hisse senedi almadınız.</p>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', color: 'white' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
                <th style={{ padding: '10px', textAlign: 'left' }}>Sembol</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Adet</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Alış Fiyatı</th>
                <th style={{ padding: '10px', textAlign: 'right' }}>Toplam</th>
                <th style={{ padding: '10px', textAlign: 'center' }}>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {portfolio.map((item, index) => (
                <tr key={index} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <td style={{ padding: '10px', textAlign: 'left', fontWeight: 'bold' }}>{item.symbol}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{item.amount}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{item.price.toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'right' }}>{(item.amount * item.price).toFixed(2)}</td>
                  <td style={{ padding: '10px', textAlign: 'center' }}>
                    <button 
                      onClick={() => handleSellClick(item)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '5px 10px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Sat
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div style={{ marginTop: '20px', fontSize: '20px', fontWeight: 'bold', textAlign: 'right' }}>
            Toplam Maliyet Değeri: ${totalValue.toFixed(2)}
          </div>
        </>
      )}

      {/* Satış Modalı */}
      {sellingItem && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: '#333',
            padding: '30px',
            borderRadius: '12px',
            width: '300px',
            textAlign: 'center',
            color: 'white'
          }}>
            <h3>{sellingItem.symbol} Sat</h3>
            {loading ? (
              <p>Güncel fiyat alınıyor...</p>
            ) : (
              <>
                <p style={{ fontSize: '18px', color: '#d4edda', margin: '10px 0' }}>
                  Güncel Fiyat: {currentCurrency}{currentPrice}
                </p>
                <p style={{ fontSize: '14px', opacity: 0.8 }}>
                  Mevcut Adet: {sellingItem.amount}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', margin: '15px 0' }}>
                  <input 
                    type="number" 
                    step="any"
                    placeholder="Satılacak Adet"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    max={sellingItem.amount}
                    style={{
                      flex: 1,
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none'
                    }}
                  />
                  <button
                    onClick={() => setSellAmount(sellingItem.amount)}
                    style={{
                      padding: '10px',
                      borderRadius: '6px',
                      border: 'none',
                      background: '#ffc107',
                      color: 'black',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Max
                  </button>
                </div>
                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <button 
                    onClick={confirmSell}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Onayla
                  </button>
                  <button 
                    onClick={() => setSellingItem(null)}
                    style={{
                      background: '#6c757d',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    İptal
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
