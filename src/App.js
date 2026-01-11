import React, { useState, useEffect, useRef } from 'react';
import './App.css';
import Header from './components/Header';
import Footer from './components/Footer';
import Content from './components/Content';
import MarketOverview from './components/MarketOverview';
import BuyPage from './components/BuyPage';
import Portfolio from './components/Portfolio';
import Profile from './components/Profile';
import StockList from './components/StockList';
import StockDetail from './components/StockDetail';
import { fetchQuote } from './utils/stockApi';

const api = {
  key: "d5d4t8pr01qvl80nnqpgd5d4t8pr01qvl80nnqq0", // https://finnhub.io/ adresinden alacağınız key'i buraya yapıştırın.
  base: "https://finnhub.io/api/v1/quote"
}

function App() {
  const [activeTab, setActiveTab] = useState('market'); // 'market', 'buy', 'portfolio'
  const [query, setQuery] = useState('');
  const [stockData, setStockData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [portfolio, setPortfolio] = useState([]); // Portföy verisi
  const [balance, setBalance] = useState(10000); // Başlangıç bakiyesi 10.000 TL
  const [selectedStock, setSelectedStock] = useState(null); // Seçilen hisse detayı için

  const latestSelectRequestIdRef = useRef(0);

  const addToPortfolio = (item) => {
    const totalCost = item.amount * item.price;
    if (totalCost > balance) {
      alert("Yetersiz Bakiye!");
      return false; // İşlem başarısız
    }
    setBalance(prev => prev - totalCost);
    setPortfolio([...portfolio, item]);
    return true; // İşlem başarılı
  };

  const addFunds = (amount) => {
    setBalance(prev => prev + amount);
  };

  const removeFromPortfolio = (symbol, amount, price) => {
    const newPortfolio = portfolio.map(item => {
      if (item.symbol === symbol) {
        return { ...item, amount: item.amount - amount };
      }
      return item;
    }).filter(item => item.amount > 0);
    
    setPortfolio(newPortfolio);
    setBalance(prev => prev + (amount * price));
  };
  
  // Piyasa Özeti Verileri
  const [marketRates, setMarketRates] = useState({
    usd: null,
    eur: null,
    btc: null,
    eth: null
  });

  // Uygulama açıldığında verileri çek
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Finnhub-only: USD/TRY ve EUR/TRY
        const usdQuote = await fetchQuote('USD', api.key);
        const eurQuote = await fetchQuote('EUR', api.key);

        setMarketRates({
          usd: usdQuote.c,
          eur: eurQuote.c,
          btc: null,
          eth: null
        });

      } catch (err) {
        console.error("Piyasa verileri çekilirken hata:", err);
      }
    };

    fetchMarketData();
  }, []);

  const fetchStockData = async (symbol) => {
    return await fetchQuote(symbol, api.key);
  };

  const handleStockSelect = async (symbol) => {
    const requestId = ++latestSelectRequestIdRef.current;
    setLoading(true);
    setError('');
    setStockData({});
    setSelectedStock(symbol); // Detay görünümüne geç

    try {
      const data = await fetchStockData(symbol);
      if (requestId !== latestSelectRequestIdRef.current) return;
      setStockData(data);
    } catch (err) {
      if (requestId !== latestSelectRequestIdRef.current) return;
      setError(err.message || 'Bir hata oluştu.');
      // Hata olsa bile detay sayfasında kalabiliriz veya geri dönebiliriz.
      // Şimdilik detay sayfasında hata mesajı gösterelim.
    } finally {
      if (requestId !== latestSelectRequestIdRef.current) return;
      setLoading(false);
    }
  };

  const search = async evt => {
    if (evt.key === "Enter") {
      setLoading(true);
      setError('');
      setStockData({});

      try {
        const data = await fetchStockData(query);
        setStockData(data);
      } catch (err) {
        setError(err.message || 'Bir hata oluştu.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  }

  const getBackground = () => {
    if (typeof stockData.c == "undefined") return 'app default';
    if (stockData.d > 0) return 'app up';
    if (stockData.d < 0) return 'app down';
    return 'app default';
  }

  return (
    <div className={getBackground()}>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="main-container">
        {activeTab === 'market' ? (
          <>
            {/* Sol Taraf: Liste */}
            <div className="left-sidebar">
              <StockList onSelect={handleStockSelect} />
            </div>

            {/* Orta: Arama ve Detay */}
            <div className="content-area">
              {selectedStock ? (
                <>
                  {loading && <div className="loading-msg">Yükleniyor...</div>}
                  {error && <div className="error-msg">{error} <button onClick={() => setSelectedStock(null)}>Geri Dön</button></div>}
                  {!loading && !error && (
                    <StockDetail 
                      stock={stockData.c ? { 
                        symbol: selectedStock, 
                        price: stockData.c, 
                        change: stockData.dp, 
                        name: stockData.symbol,
                        currency: stockData.currency
                      } : null} 
                      api={api}
                      onBack={() => { setSelectedStock(null); setStockData({}); }} 
                    />
                  )}
                </>
              ) : (
                <>
                  <div className="search-box">
                    <input 
                      type="text"
                      className="search-bar"
                      placeholder="Hisse Sembolü (Örn: AAPL)..."
                      onChange={e => setQuery(e.target.value)}
                      value={query}
                      onKeyPress={search}
                    />
                  </div>

                  {loading && <div className="loading-msg">Yükleniyor...</div>}
                  
                  {error && <div className="error-msg">{error}</div>}

                  {(typeof stockData.c != "undefined") && (
                    <Content stockData={stockData} symbol={query} />
                  )}
                </>
              )}
            </div>

            {/* Sağ Taraf: Piyasa Özeti */}
            <div className="sidebar-area">
              <MarketOverview rates={marketRates} />
            </div>
          </>
        ) : activeTab === 'buy' ? (
          <BuyPage onBuy={addToPortfolio} api={api} balance={balance} />
        ) : activeTab === 'portfolio' ? (
          <Portfolio portfolio={portfolio} onSell={removeFromPortfolio} api={api} />
        ) : (
          <Profile balance={balance} onAddFunds={addFunds} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;
