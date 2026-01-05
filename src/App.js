import React, { useState, useEffect } from 'react';
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
        // 1. Dolar Kuru (Frankfurter API)
        const usdRes = await fetch('https://api.frankfurter.app/latest?from=USD&to=TRY');
        const usdData = await usdRes.json();
        
        // 2. Euro Kuru (Frankfurter API)
        const eurRes = await fetch('https://api.frankfurter.app/latest?from=EUR&to=TRY');
        const eurData = await eurRes.json();

        // 3. Bitcoin (Finnhub)
        const btcRes = await fetch(`${api.base}?symbol=BINANCE:BTCUSDT&token=${api.key}`);
        const btcData = await btcRes.json();

        // 4. Ethereum (Finnhub)
        const ethRes = await fetch(`${api.base}?symbol=BINANCE:ETHUSDT&token=${api.key}`);
        const ethData = await ethRes.json();

        setMarketRates({
          usd: usdData.rates.TRY,
          eur: eurData.rates.TRY,
          btc: btcData,
          eth: ethData
        });

      } catch (err) {
        console.error("Piyasa verileri çekilirken hata:", err);
      }
    };

    fetchMarketData();
  }, []);

  const fetchWithTimeout = async (url, options = {}) => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(id);
      return response;
    } catch (err) {
      clearTimeout(id);
      throw err;
    }
  };

  const fetchYahooData = async (symbol) => {
    const targetUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
    const proxies = [
      'https://api.allorigins.win/raw?url=',
      'https://corsproxy.io/?'
    ];

    for (const proxy of proxies) {
      try {
        const res = await fetchWithTimeout(proxy + encodeURIComponent(targetUrl));
        if (res.ok) {
          const data = await res.json();
          if (data.chart && data.chart.result) {
             return data;
          }
        }
      } catch (e) {
        console.log(`Proxy ${proxy} failed for ${symbol}`, e);
      }
    }
    throw new Error('Veri çekilemedi (Tüm proxyler başarısız)');
  };

  const fetchStockData = async (symbol) => {
    let searchSymbol = symbol.toUpperCase();

    // 1. ÖZEL DURUM: Dolar ve Euro Araması (Frankfurter API - Ücretsiz)
    if (['DOLAR', 'USD', 'EURO', 'EUR'].includes(searchSymbol)) {
      const fromCurrency = (searchSymbol === 'DOLAR' || searchSymbol === 'USD') ? 'USD' : 'EUR';
      const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=TRY`);
      
      if (!res.ok) throw new Error('Kur verisi alınamadı');
      
      const data = await res.json();
      return {
        c: data.rates.TRY,
        d: 0, // Anlık değişim verisi bu API'de yok
        dp: 0,
        symbol: `${fromCurrency}/TRY`
      };
    }

    // 2. ÖZEL DURUM: Martı Tag ve Diğer Eşleşmeler
    if (searchSymbol === 'MARTI' || searchSymbol === 'MARTI TAG') searchSymbol = 'MRT'; // NYSE'de işlem görüyor
    
    // 3. BIST (Borsa İstanbul) Kontrolü (Yahoo Finance - Proxy ile)
    if (searchSymbol.includes('.IS')) {
      try {
        const data = await fetchYahooData(searchSymbol);
        const meta = data.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return {
          c: price,
          d: change.toFixed(2),
          dp: changePercent.toFixed(2),
          symbol: meta.symbol,
          currency: meta.currency
        };
      } catch (err) {
        console.error("BIST Hatası:", err);
        throw new Error('BIST verisi alınamadı. Lütfen tekrar deneyin.');
      }
    }

    // 4. ÖZEL DURUM: Altın (Yahoo Finance Proxy)
    if (['XAU/USD', 'GOLD', 'ALTIN'].includes(searchSymbol)) {
      try {
        const data = await fetchYahooData('GC=F');
        const meta = data.chart.result[0].meta;
        const price = meta.regularMarketPrice;
        const prevClose = meta.chartPreviousClose;
        const change = price - prevClose;
        const changePercent = (change / prevClose) * 100;

        return {
          c: price,
          d: change.toFixed(2),
          dp: changePercent.toFixed(2),
          symbol: 'XAU/USD',
          currency: 'USD'
        };
      } catch (err) {
        console.error("Altın Hatası:", err);
        throw new Error('Altın verisi alınamadı. Lütfen tekrar deneyin.');
      }
    }

    // 5. HİSSE SENEDİ VE KRİPTO (Finnhub API)
    if (searchSymbol === 'BITCOIN' || searchSymbol === 'BTC') searchSymbol = 'BINANCE:BTCUSDT';
    if (searchSymbol === 'ETHEREUM' || searchSymbol === 'ETH') searchSymbol = 'BINANCE:ETHUSDT';
    if (searchSymbol === 'DOGE' || searchSymbol === 'DOGECOIN') searchSymbol = 'BINANCE:DOGEUSDT';
    if (searchSymbol === 'SOL' || searchSymbol === 'SOLANA') searchSymbol = 'BINANCE:SOLUSDT';
    if (searchSymbol === 'XRP' || searchSymbol === 'RIPPLE') searchSymbol = 'BINANCE:XRPUSDT';
    if (searchSymbol === 'AVAX' || searchSymbol === 'AVALANCHE') searchSymbol = 'BINANCE:AVAXUSDT';
    
    const res = await fetch(`${api.base}?symbol=${searchSymbol}&token=${api.key}`);
    if (!res.ok) {
      if (res.status === 401) throw new Error('API Anahtarı hatası (Yetkisiz). Lütfen geçerli bir key girin.');
      if (res.status === 403) throw new Error('Bu sembole erişim yetkiniz yok (Premium veri olabilir).');
      if (res.status === 429) throw new Error('Çok fazla istek yapıldı (Rate Limit).');
      throw new Error(`Veri çekilemedi: ${res.status}`);
    }
    const result = await res.json();
    
    if (result.c === 0 && result.d === null) {
       throw new Error('Sembol bulunamadı. BIST hisseleri için sonuna .IS ekleyin (Örn: THYAO.IS, GARAN.IS).');
    }
    return result;
  };

  const handleStockSelect = async (symbol) => {
    setLoading(true);
    setError('');
    setStockData({});
    setSelectedStock(symbol); // Detay görünümüne geç

    try {
      const data = await fetchStockData(symbol);
      setStockData(data);
    } catch (err) {
      setError(err.message || 'Bir hata oluştu.');
      // Hata olsa bile detay sayfasında kalabiliriz veya geri dönebiliriz.
      // Şimdilik detay sayfasında hata mesajı gösterelim.
    } finally {
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
                        name: stockData.symbol 
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
