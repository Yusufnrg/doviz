const fetchWithTimeout = async (url, options = {}) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), 10000); // Timeout 10 saniyeye çıkarıldı
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
  // Cache busting: Her 1 dakikada bir değişen timestamp.
  // Bu sayede proxy'ler 1 dakika boyunca cache kullanabilir, Yahoo'ya yük azalır ve rate limit riski düşer.
  const cacheBuster = Math.floor(Date.now() / 60000);
  
  const hosts = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
  
  for (const host of hosts) {
    const targetUrl = `https://${host}/v8/finance/chart/${symbol}?interval=1d&range=5d&_t=${cacheBuster}`;
    
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

  throw new Error('Veri çekilemedi (Tüm proxyler ve hostlar denendi)');
};

export const fetchStockPrice = async (symbol, apiKey) => {
  let searchSymbol = symbol.trim().toUpperCase();
  let currentPrice = null;
  let currency = '$';

  // 1. Dolar ve Euro (Frankfurter)
  if (['DOLAR', 'USD', 'EURO', 'EUR'].includes(searchSymbol)) {
    const fromCurrency = (searchSymbol === 'DOLAR' || searchSymbol === 'USD') ? 'USD' : 'EUR';
    const res = await fetchWithTimeout(`https://api.frankfurter.app/latest?from=${fromCurrency}&to=TRY`);
    if (!res.ok) throw new Error('Kur verisi alınamadı');
    const data = await res.json();
    currentPrice = data.rates.TRY;
    currency = '₺';
    return { price: currentPrice, currency };
  }
  
  // 2. Martı Tag
  if (searchSymbol === 'MARTI' || searchSymbol === 'MARTI TAG') {
    searchSymbol = 'MRT';
  }
  
  // 3. BIST (Yahoo Finance Proxy)
  if (searchSymbol.includes('.IS')) {
    currency = '₺'; // Fallback durumunda para birimini korumak için
    try {
      const data = await fetchYahooData(searchSymbol);
      // regularMarketPrice bazen null gelebilir, bu durumda son kapanış fiyatını alalım
      const result = data.chart.result[0];
      currentPrice = result.meta.regularMarketPrice;
      
      if (!currentPrice && result.indicators.quote && result.indicators.quote[0] && result.indicators.quote[0].close) {
        const closes = result.indicators.quote[0].close;
        // Son geçerli fiyatı bul (null olmayan)
        for (let i = closes.length - 1; i >= 0; i--) {
          if (closes[i]) {
            currentPrice = closes[i];
            break;
          }
        }
      }
      
      if (!currentPrice) throw new Error('Fiyat bulunamadı');

      return { price: currentPrice, currency };
    } catch (err) {
      console.error("Yahoo BIST failed, trying Finnhub fallback...", err);
      // Hata fırlatma, Finnhub'a düşsün
    }
  }

  // 4. Altın (Yahoo Finance Proxy + GoldPrice.org Fallback)
  if (['XAU/USD', 'GOLD', 'ALTIN'].includes(searchSymbol)) {
    // 1. Yöntem: Yahoo Finance
    try {
      const data = await fetchYahooData('GC=F');
      currentPrice = data.chart.result[0].meta.regularMarketPrice;
      currency = '$'; 
      return { price: currentPrice, currency };
    } catch (err) {
      console.log("Yahoo Gold failed, trying GoldPrice.org...");
    }

    // 2. Yöntem: GoldPrice.org
    try {
      const res = await fetchWithTimeout('https://data-asg.goldprice.org/dbXRates/USD');
      if (res.ok) {
        const data = await res.json();
        if (data.items && data.items[0]) {
          currentPrice = data.items[0].xauPrice;
          currency = '$';
          return { price: currentPrice, currency };
        }
      }
    } catch (err) {
      console.log("GoldPrice.org failed.");
    }

    throw new Error('Altın verisi alınamadı');
  }
  
  // 5. Finnhub (ABD & Kripto)
  // Kripto Eşleşmeleri
  if (searchSymbol === 'BITCOIN' || searchSymbol === 'BTC') searchSymbol = 'BINANCE:BTCUSDT';
  if (searchSymbol === 'ETHEREUM' || searchSymbol === 'ETH') searchSymbol = 'BINANCE:ETHUSDT';
  if (searchSymbol === 'DOGE' || searchSymbol === 'DOGECOIN') searchSymbol = 'BINANCE:DOGEUSDT';
  if (searchSymbol === 'SOL' || searchSymbol === 'SOLANA') searchSymbol = 'BINANCE:SOLUSDT';
  if (searchSymbol === 'XRP' || searchSymbol === 'RIPPLE') searchSymbol = 'BINANCE:XRPUSDT';
  if (searchSymbol === 'AVAX' || searchSymbol === 'AVALANCHE') searchSymbol = 'BINANCE:AVAXUSDT';
  if (searchSymbol === 'ADA' || searchSymbol === 'CARDANO') searchSymbol = 'BINANCE:ADAUSDT';

  const res = await fetchWithTimeout(`https://finnhub.io/api/v1/quote?symbol=${searchSymbol}&token=${apiKey}`);
  if (!res.ok) throw new Error('Veri çekilemedi');
  const data = await res.json();
  
  if (data.c === 0 && data.d === null) {
    throw new Error('Sembol bulunamadı.');
  }
  
  currentPrice = data.c;
  return { price: currentPrice, currency };
};
