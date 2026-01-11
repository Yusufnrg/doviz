import React from 'react';

function StockDetail({ stock, api, onBack }) {
  const [hoverData, setHoverData] = React.useState(null);
  const getCurrencySign = () => (stock?.currency === '₺' ? '₺' : '$');

  // Basit trend grafiği için demo veri oluştur (memoized - sadece stock değişince yeniden oluştur)
  const chartData = React.useMemo(() => {
    const points = 30;
    const data = [];
    let price = stock.price;
    
    for (let i = 0; i < points; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (points - i));
      const variation = (Math.random() - 0.5) * 0.03; // %3 varyasyon
      price = price * (1 + variation);
      data.push({
        date: date.toLocaleDateString('tr-TR'),
        price: price
      });
    }
    
    // Son noktayı güncel fiyata eşitle
    data[data.length - 1].price = stock.price;
    return data;
  }, [stock.price, stock.symbol]);

  const renderSimpleChart = () => {
    const width = 600;
    const height = 200;
    const padding = 40;

    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice || 1;

    const points = chartData.map((d, i) => {
      const x = padding + (i / (chartData.length - 1)) * (width - 2 * padding);
      const y = height - padding - ((d.price - minPrice) / priceRange) * (height - 2 * padding);
      return { x, y, price: d.price, date: d.date };
    });

    const linePath = "M" + points.map(p => `${p.x},${p.y}`).join(" L");
    const areaPath = `${linePath} L${width - padding},${height - padding} L${padding},${height - padding} Z`;

    const handleMouseMove = (e) => {
      const svgRect = e.currentTarget.getBoundingClientRect();
      const scaleX = width / svgRect.width;
      const mouseX = (e.clientX - svgRect.left) * scaleX;
      
      if (mouseX < padding || mouseX > width - padding) return;

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
        style={{ overflow: 'visible', cursor: 'crosshair' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
        </defs>

        {/* Izgara çizgileri */}
        {[0, 0.5, 1].map(ratio => {
          const y = padding + ratio * (height - 2 * padding);
          return <line key={ratio} x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />;
        })}

        {/* Alan dolgusu */}
        <path d={areaPath} fill="url(#chartGradient)" stroke="none" />

        {/* Ana çizgi */}
        <path d={linePath} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />

        {/* Hover efekti */}
        {hoverData && (
          <>
            <line 
              x1={hoverData.x} 
              y1={padding} 
              x2={hoverData.x} 
              y2={height - padding} 
              stroke="white" 
              strokeDasharray="3,3" 
              opacity="0.5" 
            />
            <circle cx={hoverData.x} cy={hoverData.y} r="5" fill="white" stroke="rgba(0,0,0,0.3)" strokeWidth="2" />
            <rect 
              x={hoverData.x - 55} 
              y={padding - 40} 
              width="110" 
              height="35" 
              rx="6" 
              fill="rgba(0, 0, 0, 0.85)" 
              stroke="rgba(255,255,255,0.2)"
            />
            <text x={hoverData.x} y={padding - 23} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">
              {hoverData.price.toFixed(2)} {getCurrencySign()}
            </text>
            <text x={hoverData.x} y={padding - 10} textAnchor="middle" fill="#ccc" fontSize="10">
              {hoverData.date}
            </text>
          </>
        )}

        {/* Fiyat etiketleri */}
        <text x={padding - 10} y={padding + 5} textAnchor="end" fontSize="11" fill="white" opacity="0.7">
          {maxPrice.toFixed(2)}
        </text>
        <text x={padding - 10} y={height - padding + 5} textAnchor="end" fontSize="11" fill="white" opacity="0.7">
          {minPrice.toFixed(2)}
        </text>

        {/* Tarih etiketleri */}
        <text x={padding} y={height - padding + 20} textAnchor="start" fontSize="10" fill="white" opacity="0.6">
          {chartData[0].date}
        </text>
        <text x={width - padding} y={height - padding + 20} textAnchor="end" fontSize="10" fill="white" opacity="0.6">
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
        <div className="detail-price" style={{ textAlign: 'right' }}>
          <h1 style={{ fontSize: 'clamp(28px, 8vw, 48px)', margin: 0 }}>
            {stock.price} {getCurrencySign()}
          </h1>
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

      <div className="chart-container" style={{ 
        height: '250px', 
        background: 'rgba(0,0,0,0.2)', 
        borderRadius: '16px', 
        padding: '15px',
        marginBottom: '30px'
      }}>
        <div style={{ fontSize: '14px', opacity: 0.6, marginBottom: '10px', textAlign: 'center' }}>
          📊 Son 30 Gün Trend Grafiği
        </div>
        {renderSimpleChart()}
      </div>

      <div className="stock-stats" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
        gap: '15px' 
      }}>
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
            <strong style={{ fontSize: '18px' }}>
              {stat.value} {i !== 3 && getCurrencySign()}
            </strong>
          </div>
        ))}
      </div>
    </div>
  );
}

export default StockDetail;
