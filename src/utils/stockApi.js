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

const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

const requireApiKey = (apiKey) => {
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('Finnhub API key gerekli');
  }
};

const normalizeToFinnhubSymbol = (rawSymbol) => {
  const input = String(rawSymbol ?? '').trim();
  const upper = input.toUpperCase();

  // USD ve EUR için özel işaretleyici - exchangerate API kullanılacak
  if (upper === 'DOLAR' || upper === 'USD') return { symbol: 'USD_TRY_FOREX', currency: '₺', isForex: true };
  if (upper === 'EURO' || upper === 'EUR') return { symbol: 'EUR_TRY_FOREX', currency: '₺', isForex: true };

  // Altın (ons / USD)
  if (upper === 'XAU/USD' || upper === 'GOLD' || upper === 'ALTIN') return { symbol: 'OANDA:XAU_USD', currency: '$' };
  
  // Altın alternatif
  if (upper === 'GC=F') return { symbol: 'GC=F', currency: '$' };

  // Kripto (USDT bazlı)
  if (upper === 'BITCOIN' || upper === 'BTC') return { symbol: 'BINANCE:BTCUSDT', currency: '$' };
  if (upper === 'ETHEREUM' || upper === 'ETH') return { symbol: 'BINANCE:ETHUSDT', currency: '$' };
  if (upper === 'DOGE' || upper === 'DOGECOIN') return { symbol: 'BINANCE:DOGEUSDT', currency: '$' };
  if (upper === 'SOL' || upper === 'SOLANA') return { symbol: 'BINANCE:SOLUSDT', currency: '$' };
  if (upper === 'XRP' || upper === 'RIPPLE') return { symbol: 'BINANCE:XRPUSDT', currency: '$' };
  if (upper === 'AVAX' || upper === 'AVALANCHE') return { symbol: 'BINANCE:AVAXUSDT', currency: '$' };
  if (upper === 'ADA' || upper === 'CARDANO') return { symbol: 'BINANCE:ADAUSDT', currency: '$' };

  // Martı Tag özel eşleşme (eski davranış korunuyor)
  if (upper === 'MARTI' || upper === 'MARTI TAG') return { symbol: 'MRT', currency: '$' };

  // BIST kaldırıldı
  if (upper.includes('.IS')) {
    throw new Error('BIST (.IS) bu sürümde desteklenmiyor');
  }

  // Varsayılan: kullanıcı ne girdiyse Finnhub symbol olarak dene
  return { symbol: upper, currency: '$' };
};

const finnhubGetJson = async (url) => {
  const res = await fetchWithTimeout(url);
  if (!res.ok) {
    throw new Error('Veri çekilemedi');
  }
  return await res.json();
};

const getFinnhubCandleEndpoint = (finnhubSymbol) => {
  if (finnhubSymbol.startsWith('BINANCE:')) return 'crypto/candle';
  if (finnhubSymbol.startsWith('OANDA:')) return 'forex/candle';
  if (finnhubSymbol.startsWith('FX:')) return 'forex/candle';
  return 'stock/candle';
};

export const fetchCandles = async ({ symbol, apiKey, resolution, from, to }) => {
  requireApiKey(apiKey);
  const { symbol: finnhubSymbol } = normalizeToFinnhubSymbol(symbol);
  const endpoint = getFinnhubCandleEndpoint(finnhubSymbol);
  const url = `${FINNHUB_BASE_URL}/${endpoint}?symbol=${encodeURIComponent(finnhubSymbol)}&resolution=${encodeURIComponent(resolution)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}&token=${encodeURIComponent(apiKey)}`;
  const data = await finnhubGetJson(url);
  if (!data || data.s !== 'ok') {
    throw new Error('Geçmiş veri alınamadı');
  }
  return data;
};

export const fetchQuote = async (symbol, apiKey) => {
  const { symbol: finnhubSymbol, currency, isForex } = normalizeToFinnhubSymbol(symbol);
  
  // USD ve EUR için özel forex API kullan
  if (isForex) {
    try {
      const res = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/USD');
      const data = await res.json();
      
      if (finnhubSymbol === 'USD_TRY_FOREX') {
        const tryRate = data.rates.TRY;
        return {
          c: tryRate,
          d: 0,
          dp: 0,
          h: tryRate,
          l: tryRate,
          o: tryRate,
  const { symbol: finnhubSymbol, currency, isForex } = normalizeToFinnhubSymbol(symbol);
  
  // USD ve EUR için özel forex API kullan
  if (isForex) {
    try {
      if (finnhubSymbol === 'USD_TRY_FOREX') {
        const res = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/USD');
        const data = await res.json();
        return { price: data.rates.TRY, currency: '₺' };
      }
      
      if (finnhubSymbol === 'EUR_TRY_FOREX') {
        const res = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/EUR');
        const data = await res.json();
        return { price: data.rates.TRY, currency: '₺' };
      }
    } catch (err) {
      throw new Error('Döviz kuru alınamadı');
    }
  }

  // Diğer semboller için Finnhub
  requireApiKey(apiKey);          currency: '₺'
        };
      }
      
      if (finnhubSymbol === 'EUR_TRY_FOREX') {
        const eurRes = await fetchWithTimeout('https://api.exchangerate-api.com/v4/latest/EUR');
        const eurData = await eurRes.json();
        const tryRate = eurData.rates.TRY;
        return {
          c: tryRate,
          d: 0,
          dp: 0,
          h: tryRate,
          l: tryRate,
          o: tryRate,
          pc: tryRate,
          symbol: 'EUR/TRY',
          currency: '₺'
        };
      }
    } catch (err) {
      throw new Error('Döviz kuru alınamadı');
    }
  }

  // Diğer semboller için Finnhub
  requireApiKey(apiKey);
  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${encodeURIComponent(apiKey)}`;
  const data = await finnhubGetJson(url);

  if (!data || (data.c === 0 && data.d === null)) {
    throw new Error('Sembol bulunamadı.');
  }

  return {
    ...data,
    symbol: finnhubSymbol,
    currency
  };
};

export const fetchStockPrice = async (symbol, apiKey) => {
  requireApiKey(apiKey);
  const { symbol: finnhubSymbol, currency } = normalizeToFinnhubSymbol(symbol);

  const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(finnhubSymbol)}&token=${encodeURIComponent(apiKey)}`;
  const data = await finnhubGetJson(url);

  if (!data || (data.c === 0 && data.d === null)) {
    throw new Error('Sembol bulunamadı.');
  }

  return { price: data.c, currency };
};
