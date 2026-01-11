import React, { useState } from 'react';
import { fetchStockPrice } from '../utils/stockApi';
import { popularStocks } from './StockList';

const BuyPage = ({ onBuy, api, balance }) => {
  const [symbol, setSymbol] = useState('');
  const [customSymbol, setCustomSymbol] = useState('');
  const [amount, setAmount] = useState('');
  const [fetchedPrice, setFetchedPrice] = useState(null);
  const [fetchedCurrency, setFetchedCurrency] = useState('$');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [useCustom, setUseCustom] = useState(false);

  const handleFetchPrice = async (selectedSymbol) => {
    const sym = selectedSymbol || (useCustom ? customSymbol : symbol);
    if (!sym) {
      setMessage('⚠️ Lütfen bir sembol seçin veya girin.');
      return;
    }

    setLoading(true);
    setMessage('');
    setFetchedPrice(null);

    try {
      const { price, currency } = await fetchStockPrice(sym, api.key);
      setFetchedPrice(price);
      setFetchedCurrency(currency);
      setMessage(`✅ Fiyat Güncellendi: ${currency}${price}`);
    } catch (err) {
      console.error(err);
      setMessage('❌ Fiyat alınamadı. Sembolü kontrol edin.');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolChange = (e) => {
    const val = e.target.value;
    setSymbol(val);
    setUseCustom(false);
    if (val) {
      handleFetchPrice(val);
    } else {
      setFetchedPrice(null);
      setMessage('');
    }
  };

  const handleCustomSymbolSearch = () => {
    if (customSymbol.trim()) {
      setSymbol('');
      setUseCustom(true);
      handleFetchPrice(customSymbol.trim());
    }
  };

  const handleBuy = (e) => {
    e.preventDefault();
    const currentSymbol = useCustom ? customSymbol : symbol;
    if (!currentSymbol || !amount || !fetchedPrice) {
      setMessage('⚠️ Lütfen sembol seçip fiyatı güncelleyin ve adet belirtin.');
      return;
    }
    
    const success = onBuy({
      symbol: currentSymbol.toUpperCase(),
      amount: parseFloat(amount),
      price: parseFloat(fetchedPrice)
    });

    if (success) {
      setMessage(`✅ Başarılı! ${amount} adet ${currentSymbol.toUpperCase()} portföyünüze eklendi.`);
      setSymbol('');
      setCustomSymbol('');
      setAmount('');
      setFetchedPrice(null);
      setUseCustom(false);
      setTimeout(() => setMessage(''), 3000);
    } else {
      setMessage('❌ Yetersiz Bakiye!');
    }
  };

  // Bakiyenin yettiği maksimum adedi hesapla (6 basamak hassasiyetle aşağı yuvarla)
  const maxAmount = fetchedPrice ? (Math.floor((balance / fetchedPrice) * 1000000) / 1000000) : 0;

  return (
    <div style={{
      background: 'rgba(255, 255, 255, 0.2)',
      padding: '30px',
      borderRadius: '16px',
      backdropFilter: 'blur(5px)',
      maxWidth: '400px',
      margin: '40px auto',
      textAlign: 'center',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      <h2 style={{ marginBottom: '10px' }}>Hisse Satın Al</h2>
      <div style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.8 }}>
        Mevcut Bakiye: <strong>₺{balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</strong>
      </div>
      
      <form onSubmit={handleBuy}>
        <div style={{ marginBottom: '15px' }}>
          <select
            value={symbol}
            onChange={handleSymbolChange}
            disabled={useCustom}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              width: '100%',
              fontSize: '16px',
              background: useCustom ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.9)',
              cursor: useCustom ? 'not-allowed' : 'pointer'
            }}
          >
            <option value="">-- Hisse Seçiniz --</option>
            {popularStocks.map((group, index) => (
              <optgroup key={index} label={group.category}>
                {group.symbols.map(sym => (
                  <option key={sym} value={sym}>{sym}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '15px', textAlign: 'center', opacity: 0.7, fontSize: '14px' }}>
          veya
        </div>

        <div style={{ marginBottom: '15px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Hisse Ara (örn: GOOGL, TSLA)"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value.toUpperCase())}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomSymbolSearch())}
            disabled={symbol !== ''}
            style={{
              padding: '12px',
              borderRadius: '8px',
              border: 'none',
              flex: 1,
              fontSize: '16px',
              background: symbol !== '' ? 'rgba(200, 200, 200, 0.5)' : 'rgba(255, 255, 255, 0.9)'
            }}
          />
          <button
            type="button"
            onClick={handleCustomSymbolSearch}
            disabled={!customSymbol.trim() || symbol !== ''}
            style={{
              padding: '12px 20px',
              borderRadius: '8px',
              border: 'none',
              background: (!customSymbol.trim() || symbol !== '') ? '#6c757d' : '#007bff',
              color: 'white',
              cursor: (!customSymbol.trim() || symbol !== '') ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            🔍 Ara
          </button>
        </div>


        {fetchedPrice && (
          <div style={{ marginBottom: '15px' }}>
            <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#d4edda' }}>
              Anlık Fiyat: {fetchedCurrency}{fetchedPrice}
            </div>
            <div style={{ fontSize: '12px', opacity: 0.8, marginTop: '5px' }}>
              Maksimum Alınabilir: {maxAmount} Adet
            </div>
          </div>
        )}
        
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="number"
            step="any"
            placeholder="Adet"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              padding: '10px',
              borderRadius: '8px',
              border: 'none',
              flex: 1,
              fontSize: '16px'
            }}
          />
          {fetchedPrice && (
            <button
              type="button"
              onClick={() => setAmount(maxAmount)}
              style={{
                padding: '10px',
                borderRadius: '8px',
                border: 'none',
                background: '#ffc107',
                color: 'black',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Max
            </button>
          )}
        </div>

        <button 
          type="submit"
          disabled={!fetchedPrice}
          style={{
            padding: '12px 30px',
            borderRadius: '8px',
            border: 'none',
            background: fetchedPrice ? '#28a745' : '#6c757d',
            color: 'white',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: fetchedPrice ? 'pointer' : 'not-allowed',
            width: '100%',
            transition: '0.3s'
          }}
        >
          SATIN AL
        </button>
      </form>

      {message && (
        <div style={{ 
          marginTop: '20px', 
          padding: '10px', 
          background: message.includes('Başarılı') || message.includes('Güncellendi') ? 'rgba(40, 167, 69, 0.8)' : 'rgba(220, 53, 69, 0.8)',
          borderRadius: '8px',
          fontWeight: 'bold'
        }}>
          {message}
        </div>
      )}
    </div>
  );
};

export default BuyPage;
