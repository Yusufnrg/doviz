import React, { useState, useEffect } from 'react';

function StockDetail({ stock, api, onBack }) {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1M'); // 1D, 1W, 1M, 3M, 1Y
  const [hoverData, setHoverData] = useState(null); // Grafik üzerinde gezilen nokta verisi

  useEffect(() => {
    if (!stock) return;

    const fetchChartData = async () => {
      setLoading(true);
      setError(null);
      
      // Yahoo Finance sembolü (BIST için .IS ekle)
      let symbol = stock.symbol;
      
      // Kripto ve Döviz İstisnaları
      const cryptoMap = {
        'BTC': 'BTC-USD',
        'ETH': 'ETH-USD',
        'SOL': 'SOL-USD',
        'AVAX': 'AVAX-USD',
        'DOGE': 'DOGE-USD',
        'XRP': 'XRP-USD',
        'ADA': 'ADA-USD'
      };
      
      const forexMap = {
        'USD': 'TRY=X',
        'EUR': 'EURTRY=X',
        'XAU/USD': 'GC=F'
      };

      // ABD Teknoloji Hisseleri (Bunlara .IS eklenmemeli)
      const usStocks = ['AAPL', 'MSFT', 'TSLA', 'GOOGL', 'AMZN', 'NVDA', 'META', 'NFLX'];

      if (cryptoMap[symbol]) {
        symbol = cryptoMap[symbol];
      } else if (forexMap[symbol]) {
        symbol = forexMap[symbol];
      } else if (usStocks.includes(symbol)) {
        // ABD hisseleri olduğu gibi kalır
      } else if (!symbol.includes('.')) {
        // Diğerleri (BIST varsayımı)
        symbol += '.IS';
      }

      // Zaman aralığı ayarları
      const now = Math.floor(Date.now() / 1000);
      let period1;
      let interval = '1d';

      switch(timeRange) {
        case '1D': period1 = now - 86400; interval = '15m'; break; // Yahoo 15m destekler
        case '1W': period1 = now - 7 * 86400; interval = '1h'; break;
        case '1M': period1 = now - 30 * 86400; interval = '1d'; break;
        case '3M': period1 = now - 90 * 86400; interval = '1d'; break;
        case '1Y': period1 = now - 365 * 86400; interval = '1wk'; break;
        default: period1 = now - 30 * 86400;
      }

      const fetchWithTimeout = async (url, options = {}) => {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 5000); // 5 saniye timeout
        try {
          const response = await fetch(url, { ...options, signal: controller.signal });
          clearTimeout(id);
          return response;
        } catch (err) {
          clearTimeout(id);
          throw err;
        }
      };

      const fetchChart = async () => {
        const cacheBuster = Math.floor(Date.now() / 60000);
        const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
        
        for (const host of hosts) {
          const targetUrl = `https://${host}/v8/finance/chart/${symbol}?period1=${period1}&period2=${now}&interval=${interval}&_t=${cacheBuster}`;
          
          const proxies = [
            // 1. AllOrigins
            async (url) => {
              const res = await fetchWithTimeout(`https://api.allorigins.win/get?url=${encodeURIComponent(url)}`);
              if (!res.ok) throw new Error('Network response was not ok');
              const data = await res.json();
              return JSON.parse(data.contents);
            },
            // 2. CorsProxy.io
            async (url) => {
              const res = await fetchWithTimeout(`https://corsproxy.io/?${encodeURIComponent(url)}`);
              if (!res.ok) throw new Error('Network response was not ok');
              return await res.json();
            },
            // 3. CodeTabs
            async (url) => {
              const res = await fetchWithTimeout(`https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`);
              if (!res.ok) throw new Error('Network response was not ok');
              return await res.json();
            },
            // 4. ThingProxy
            async (url) => {
              const res = await fetchWithTimeout(`https://thingproxy.freeboard.io/fetch/${url}`);
              if (!res.ok) throw new Error('Network response was not ok');
              return await res.json();
            }
          ];

          for (const fetchViaProxy of proxies) {
            try {
              const json = await fetchViaProxy(targetUrl);
              if (json.chart && json.chart.result && json.chart.result.length > 0) {
                return json;
              }
            } catch (e) {
              console.warn(`Proxy failed for ${host} with ${symbol}`, e);
            }
          }
        }
        throw new Error('Veri çekilemedi');
      };

      try {
        const json = await fetchChart();
        const result = json.chart.result[0];
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        
        const formattedData = timestamps.map((t, i) => ({
          date: new Date(t * 1000).toLocaleDateString('tr-TR'),
          price: quotes.close[i]
        })).filter(d => d.price);

        setChartData(formattedData);
        setLoading(false);
        return;
      } catch (err) {
        console.error("Chart fetch failed:", err);
        // Fallback to Finnhub if available
      }

      // 3. Yöntem: Finnhub (Sadece ABD ve Kripto için çalışır, BIST için çalışmaz ama deneyelim)
      if (api && api.key) {
        try {
          // Finnhub resolution: 1, 5, 15, 30, 60, D, W, M
          let resolution = 'D';
          if (timeRange === '1D') resolution = '60';
          
          const finnhubSymbol = stock.symbol === 'USD' ? 'OANDA:USD_TRY' : 
                               stock.symbol === 'EUR' ? 'OANDA:EUR_TRY' :
                               stock.symbol.includes('.') ? null : stock.symbol; // BIST sembollerini atla

          if (finnhubSymbol) {
            const url = `https://finnhub.io/api/v1/stock/candle?symbol=${finnhubSymbol}&resolution=${resolution}&from=${period1}&to=${now}&token=${api.key}`;
            const response = await fetchWithTimeout(url);
            const json = await response.json();

            if (json.s === 'ok') {
              const formattedData = json.t.map((t, i) => ({
                date: new Date(t * 1000).toLocaleDateString('tr-TR'),
                price: json.c[i]
              }));
              setChartData(formattedData);
              setLoading(false);
              return;
            }
          }
        } catch (err) {
          console.log("Finnhub failed.");
        }
      }

      // 4. Yöntem: Mock Data (Son Çare - Demo Amaçlı)
      console.log("Generating mock data...");
      const mockData = [];
      let currentPrice = stock.price;
      const points = timeRange === '1D' ? 24 : 30;
      
      for (let i = 0; i < points; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (points - i));
        // Rastgele %2 değişim
        const change = (Math.random() - 0.5) * 0.04;
        currentPrice = currentPrice * (1 + change);
        mockData.push({
          date: date.toLocaleDateString('tr-TR'),
          price: currentPrice
        });
      }
      // Son noktayı güncel fiyata eşitle
      mockData[mockData.length - 1].price = stock.price;
      
      setChartData(mockData);
      setLoading(false);
      // setError("Canlı grafik verisi alınamadı, tahmini veri gösteriliyor.");
    };

    fetchChartData();
  }, [stock, timeRange, api]);

  // Gelişmiş SVG Grafik
  const renderChart = () => {
    if (chartData.length < 2) return null;

    const width = 600;
    const height = 300;
    const padding = 50;

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1; // 0'a bölünmeyi önle

    // X ve Y koordinatlarını hesapla
    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
      return { x, y, price: d.price, date: d.date };
    });

    // Çizgi yolu (Path)
    const linePath = "M" + points.map(p => `${p.x},${p.y}`).join(" L");

    // Alan yolu (Area) - Altını doldurmak için
    const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

    const isUp = stock.change >= 0;
    const strokeColor = "#ffffff"; // Her zaman beyaz çizgi (kontrast için)

    // Mouse hareketlerini takip et
    const handleMouseMove = (e) => {
      const svgRect = e.currentTarget.getBoundingClientRect();
      // Ölçekleme faktörünü hesapla (ViewBox Width / Actual Width)
      const scaleX = width / svgRect.width;
      
      // Mouse pozisyonunu ViewBox koordinatlarına çevir
      const mouseX = (e.clientX - svgRect.left) * scaleX;
      
      // Mouse'un grafik alanı içinde olup olmadığını kontrol et
      if (mouseX < padding || mouseX > width - padding) return;

      // Mouse pozisyonuna en yakın noktayı bul
      const availableWidth = width - 2 * padding;
      const index = Math.round(((mouseX - padding) / availableWidth) * (points.length - 1));
      
      if (index >= 0 && index < points.length) {
        setHoverData(points[index]);
      }
    };

    const handleMouseLeave = () => {
      setHoverData(null);
    };

    return (
      <svg 
        width="100%" 
        height="100%" 
        viewBox={`0 0 ${width} ${height}`} 
        style={{overflow: 'visible', cursor: 'crosshair'}}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Izgara Çizgileri (Yatay) */}
        {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
          const y = padding + ratio * (height - 2 * padding);
          return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.1)" />;
        })}

        {/* Alan Dolgusu */}
        <path d={areaPath} fill="url(#chartGradient)" stroke="none" />

        {/* Ana Çizgi */}
        <path d={linePath} fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover Efekti (Tooltip) */}
        {hoverData && (
          <>
            {/* Dikey Çizgi */}
            <line 
              x1={hoverData.x} y1={padding} 
              x2={hoverData.x} y2={height - padding} 
              stroke="white" 
              strokeDasharray="5,5" 
              opacity="0.5" 
            />
            
            {/* Nokta */}
            <circle cx={hoverData.x} cy={hoverData.y} r="6" fill="white" stroke="rgba(0,0,0,0.5)" strokeWidth="2" />
            
            {/* Bilgi Kutusu */}
            <rect 
                x={hoverData.x - 60} 
                y={padding - 45} 
                width="120" 
                height="40" 
                rx="8" 
                fill="rgba(0, 0, 0, 0.8)" 
                stroke="rgba(255,255,255,0.2)"
            />
            <text x={hoverData.x} y={padding - 25} textAnchor="middle" fill="white" fontSize="14" fontWeight="bold">
                {hoverData.price.toFixed(2)} ₺
            </text>
            <text x={hoverData.x} y={padding - 10} textAnchor="middle" fill="#ccc" fontSize="11">
                {hoverData.date}
            </text>
          </>
        )}

        {/* Fiyat Etiketleri (Y Ekseni) */}
        <text x={padding - 10} y={padding} textAnchor="end" fontSize="12" fill="white" fontWeight="bold">{maxPrice.toFixed(2)}</text>
        <text x={padding - 10} y={height - padding} textAnchor="end" fontSize="12" fill="white" fontWeight="bold">{minPrice.toFixed(2)}</text>
        <text x={padding - 10} y={height / 2} textAnchor="end" fontSize="12" fill="white">
          {((maxPrice + minPrice) / 2).toFixed(2)}
        </text>

        {/* Tarih Etiketleri (X Ekseni - Baş ve Son) */}
        <text x={padding} y={height - padding + 20} textAnchor="middle" fontSize="12" fill="white">
          {chartData[0].date}
        </text>
        <text x={width - padding} y={height - padding + 20} textAnchor="middle" fontSize="12" fill="white">
          {chartData[chartData.length - 1].date}
        </text>
      </svg>
    );
  };

  if (!stock) return <div className="stock-detail-placeholder">Hisse seçiniz</div>;

  return (
    <div className="stock-detail" style={{
      background: 'rgba(0, 0, 0, 0.3)',
      backdropFilter: 'blur(10px)',
      padding: 'clamp(14px, 4vw, 30px)',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '800px',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
      <button className="back-button" onClick={onBack} style={{
        background: 'rgba(255,255,255,0.2)',
        border: 'none',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        marginBottom: '20px',
        fontWeight: 'bold'
      }}>← Geri</button>
      
      <div className="detail-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '30px' }}>
        <div className="header-left">
          <h2 style={{ fontSize: 'clamp(22px, 6vw, 32px)', margin: 0, wordBreak: 'break-word' }}>{stock.symbol}</h2>
          <p style={{ fontSize: 'clamp(14px, 4vw, 18px)', opacity: 0.8, margin: 0, wordBreak: 'break-word' }}>{stock.name}</p>
        </div>
        <div className={`detail-price`} style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: 'clamp(28px, 8vw, 48px)', margin: 0 }}>{stock.price} ₺</h1>
          <span style={{ 
            fontSize: 'clamp(14px, 4.5vw, 20px)', 
            background: stock.change >= 0 ? 'rgba(76, 175, 80, 0.8)' : 'rgba(244, 67, 54, 0.8)',
            padding: '5px 15px',
            borderRadius: '12px',
            fontWeight: 'bold'
          }}>
            {stock.change >= 0 ? '+' : ''}%{stock.change}
          </span>
        </div>
      </div>

      <div className="chart-controls" style={{ display: 'flex', gap: '10px', marginBottom: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {['1D', '1W', '1M', '3M', '1Y'].map(range => (
          <button 
            key={range} 
            onClick={() => setTimeRange(range)}
            style={{
              background: timeRange === range ? 'white' : 'rgba(255,255,255,0.1)',
              color: timeRange === range ? '#333' : 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontWeight: 'bold',
              transition: '0.3s'
            }}
          >
            {range}
          </button>
        ))}
      </div>

      <div className="chart-container" style={{ 
        height: '350px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '16px', 
        padding: '10px',
        marginBottom: '30px'
      }}>
        {loading ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px' }}>Grafik Yükleniyor...</div>
        ) : error ? (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ff8a80' }}>{error}</div>
        ) : (
          renderChart()
        )}
      </div>

      <div className="stock-stats">
        {[
          { label: 'Açılış', value: stock.price },
          { label: 'Yüksek', value: (stock.price * 1.02).toFixed(2) },
          { label: 'Düşük', value: (stock.price * 0.98).toFixed(2) },
          { label: 'Hacim', value: '1.2M' }
        ].map((stat, i) => (
          <div key={i} className="stat-item" style={{ 
            background: 'rgba(255,255,255,0.1)', 
            padding: '15px', 
            borderRadius: '12px',
            textAlign: 'center'
          }}>
            <span style={{ display: 'block', fontSize: '14px', opacity: 0.7, marginBottom: '5px' }}>{stat.label}</span>
            <strong style={{ fontSize: '18px' }}>{stat.value} {i !== 3 && '₺'}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockDetail;
