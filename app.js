/**
 * IQ Option Pure Client-Side Application
 * 100% Serverless, direct connection to wss://iqoption.com/echo/websocket
 */

const PAIRS_CATALOG = [
    // Gold & Commodities
    { id: 1857, symbol: "XAUUSD-OTC", display: "XAU/USD (OTC) [ทองคำ]", type: "commodity", payout: 93, base_price: 2685.50, pip: 0.1 },
    { id: 1858, symbol: "XAGUSD-OTC", display: "XAG/USD (OTC) [แร่เงิน]", type: "commodity", payout: 91, base_price: 31.80, pip: 0.01 },
    { id: 2086, symbol: "XAU/XAG-OTC", display: "XAU/XAG (OTC) [ทอง/เงิน]", type: "commodity", payout: 91, base_price: 84.50, pip: 0.01 },
    { id: 1859, symbol: "USOUSD-OTC", display: "USO/USD (OTC) [น้ำมัน]", type: "commodity", payout: 90, base_price: 72.40, pip: 0.01 },

    // Crypto
    { id: 1916, symbol: "BTCUSD", display: "BTC/USD [บิตคอยน์]", type: "crypto", payout: 90, base_price: 91500.00, pip: 1.0 },
    { id: 1918, symbol: "ETHUSD", display: "ETH/USD [อีเธอเรียม]", type: "crypto", payout: 88, base_price: 3150.00, pip: 0.1 },

    // Forex Pairs
    { id: 1, symbol: "EURUSD", display: "EUR/USD", type: "binary", payout: 88, base_price: 1.08250, pip: 0.0001 },
    { id: 2, symbol: "EURGBP", display: "EUR/GBP", type: "binary", payout: 85, base_price: 0.85420, pip: 0.0001 },
    { id: 3, symbol: "EURJPY", display: "EUR/JPY", type: "binary", payout: 87, base_price: 162.350, pip: 0.01 },
    { id: 4, symbol: "USDJPY", display: "USD/JPY", type: "binary", payout: 89, base_price: 150.120, pip: 0.01 },
    { id: 5, symbol: "GBPUSD", display: "GBP/USD", type: "binary", payout: 86, base_price: 1.26750, pip: 0.0001 },
    { id: 6, symbol: "GBPJPY", display: "GBP/JPY", type: "binary", payout: 85, base_price: 190.280, pip: 0.01 },
    { id: 7, symbol: "AUDUSD", display: "AUD/USD", type: "binary", payout: 87, base_price: 0.65400, pip: 0.0001 },
    { id: 8, symbol: "USDCAD", display: "USD/CAD", type: "binary", payout: 86, base_price: 1.36500, pip: 0.0001 },
    { id: 9, symbol: "USDCHF", display: "USD/CHF", type: "binary", payout: 85, base_price: 0.89800, pip: 0.0001 },
    { id: 10, symbol: "NZDUSD", display: "NZD/USD", type: "binary", payout: 85, base_price: 0.59850, pip: 0.0001 },

    // OTC 24/7 Pairs
    { id: 76, symbol: "EURUSD-OTC", display: "EUR/USD (OTC)", type: "otc", payout: 92, base_price: 1.08310, pip: 0.0001 },
    { id: 77, symbol: "GBPUSD-OTC", display: "GBP/USD (OTC)", type: "otc", payout: 94, base_price: 1.26820, pip: 0.0001 },
    { id: 78, symbol: "USDJPY-OTC", display: "USD/JPY (OTC)", type: "otc", payout: 93, base_price: 150.250, pip: 0.01 },
    { id: 79, symbol: "AUDUSD-OTC", display: "AUD/USD (OTC)", type: "otc", payout: 91, base_price: 0.65480, pip: 0.0001 },
    { id: 80, symbol: "NZDUSD-OTC", display: "NZD/USD (OTC)", type: "otc", payout: 90, base_price: 0.59910, pip: 0.0001 },
    { id: 81, symbol: "USDCAD-OTC", display: "USD/CAD (OTC)", type: "otc", payout: 92, base_price: 1.36420, pip: 0.0001 },
    { id: 82, symbol: "USDCHF-OTC", display: "USD/CHF (OTC)", type: "otc", payout: 91, base_price: 0.89740, pip: 0.0001 },
    { id: 83, symbol: "EURJPY-OTC", display: "EUR/JPY (OTC)", type: "otc", payout: 95, base_price: 162.480, pip: 0.01 },
    { id: 84, symbol: "GBPJPY-OTC", display: "GBP/JPY (OTC)", type: "otc", payout: 93, base_price: 190.450, pip: 0.01 },
    { id: 85, symbol: "EURGBP-OTC", display: "EUR/GBP (OTC)", type: "otc", payout: 90, base_price: 0.85390, pip: 0.0001 }
];

const state = {
    selectedPair: 'XAUUSD-OTC',
    selectedDisplay: 'XAU/USD (OTC) [ทองคำ]',
    selectedPayout: 93,
    timeframe: '1m',
    accountMode: 'PRACTICE',
    balance: 0.0,
    isScanning: true,
    isAutoTrade: false,
    soundEnabled: true,
    orderAmount: 10.0,
    pairs: PAIRS_CATALOG,
    inZoneList: [],
    signals: [],
    cooldowns: {}, // pair -> expireTime
    filterType: 'ALL',
    searchQuery: '',
};

const el = {
    balanceDisplay: document.getElementById('balanceDisplay'),
    accountModeBadge: document.getElementById('accountModeBadge'),
    btnSwitchAccount: document.getElementById('btnSwitchAccount'),
    inputOrderAmount: document.getElementById('inputOrderAmount'),
    countdownSeconds: document.getElementById('countdownSeconds'),
    toggleAutoTrade: document.getElementById('toggleAutoTrade'),
    cooldownBadge: document.getElementById('cooldownBadge'),
    btnSoundToggle: document.getElementById('btnSoundToggle'),
    iconSoundOn: document.getElementById('iconSoundOn'),
    iconSoundOff: document.getElementById('iconSoundOff'),
    btnToggleScan: document.getElementById('btnToggleScan'),
    scanButtonText: document.getElementById('scanButtonText'),
    statusBarText: document.getElementById('statusBarText'),
    pairsGrid: document.getElementById('pairsGrid'),
    pairSearchInput: document.getElementById('pairSearchInput'),
    inZoneTableBody: document.getElementById('inZoneTableBody'),
    inZoneCountBadge: document.getElementById('inZoneCountBadge'),
    signalsFeed: document.getElementById('signalsFeed'),
    signalsCountBadge: document.getElementById('signalsCountBadge'),
    chartPairTitle: document.getElementById('chartPairTitle'),
    chartPayoutBadge: document.getElementById('chartPayoutBadge'),
    chartTfLabel: document.getElementById('chartTfLabel'),
    goldTimeframeSelector: document.getElementById('goldTimeframeSelector'),
    chartCurrentPrice: document.getElementById('chartCurrentPrice'),
    chartCCIVal: document.getElementById('chartCCIVal'),
    chartSMAVal: document.getElementById('chartSMAVal'),
    selectManualPair: document.getElementById('selectManualPair'),
    quickBtnGold: document.getElementById('quickBtnGold'),
    selectedAssetTypeBadge: document.getElementById('selectedAssetTypeBadge'),
    btnManualCall: document.getElementById('btnManualCall'),
    btnManualPut: document.getElementById('btnManualPut'),
    callProfitCalc: document.getElementById('callProfitCalc'),
    putProfitCalc: document.getElementById('putProfitCalc'),
    connectionLabel: document.getElementById('connectionLabel'),
    connectionDot: document.getElementById('connectionDot'),
    btnOpenLoginModal: document.getElementById('btnOpenLoginModal'),
    loginModal: document.getElementById('loginModal'),
    btnCloseModal: document.getElementById('btnCloseModal'),
    inputEmail: document.getElementById('inputEmail'),
    inputPassword: document.getElementById('inputPassword'),
    btnSubmitCredentials: document.getElementById('btnSubmitCredentials'),
    loginStatusMsg: document.getElementById('loginStatusMsg'),
    inputSSID: document.getElementById('inputSSID'),
    inputGatewayUrl: document.getElementById('inputGatewayUrl'),
    btnSubmitSSID: document.getElementById('btnSubmitSSID'),
    ssidErrorMsg: document.getElementById('ssidErrorMsg'),
};

// Web Audio API Synthesizer
let audioCtx = null;
function playAudioAlert(type) {
    if (!state.soundEnabled) return;
    try {
        if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        if (audioCtx.state === 'suspended') audioCtx.resume();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        const now = audioCtx.currentTime;
        if (type === 'CALL') {
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(1320, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        } else {
            osc.frequency.setValueAtTime(880, now);
            osc.frequency.exponentialRampToValueAtTime(587, now + 0.15);
            gain.gain.setValueAtTime(0.3, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
            osc.start(now);
            osc.stop(now + 0.35);
        }
    } catch (e) {}
}

function formatPrice(val, pair) {
    if (val === undefined || val === null || isNaN(val)) return '0.00';
    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
    if (num > 500) return num.toFixed(2);
    if (num > 20) return num.toFixed(3);
    return num.toFixed(5);
}

// Chart Initializer
let chart = null;
let candleSeries = null;
let smaSeries = null;
let upperKeltnerSeries = null;
let lowerKeltnerSeries = null;
let currentZoneLines = [];

function initChart() {
    const container = document.getElementById('chartContainer');
    if (!container) return;

    chart = LightweightCharts.createChart(container, {
        layout: {
            background: { color: '#0c101c' },
            textColor: '#94a3b8',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
        },
        grid: {
            vertLines: { color: '#161e30' },
            horzLines: { color: '#161e30' },
        },
        crosshair: {
            mode: LightweightCharts.CrosshairMode.Normal,
            vertLine: { color: '#38bdf8', width: 1, style: 3 },
            horzLine: { color: '#38bdf8', width: 1, style: 3 },
        },
        rightPriceScale: {
            borderColor: '#1e293b',
            scaleMargins: { top: 0.15, bottom: 0.15 },
        },
        timeScale: {
            borderColor: '#1e293b',
            timeVisible: true,
            secondsVisible: true,
        },
    });

    candleSeries = chart.addCandlestickSeries({
        upColor: '#00d084',
        downColor: '#ff4757',
        borderUpColor: '#00d084',
        borderDownColor: '#ff4757',
        wickUpColor: '#00d084',
        wickDownColor: '#ff4757',
    });

    smaSeries = chart.addLineSeries({
        color: '#f59e0b',
        lineWidth: 2,
        title: 'SMA(5)',
    });

    upperKeltnerSeries = chart.addLineSeries({
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dashed,
        title: 'Keltner Upper',
    });

    lowerKeltnerSeries = chart.addLineSeries({
        color: '#06b6d4',
        lineWidth: 1,
        lineStyle: LightweightCharts.LineStyle.Dashed,
        title: 'Keltner Lower',
    });

    new ResizeObserver(entries => {
        if (!entries || entries.length === 0 || !chart) return;
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
    }).observe(container);
}

function clearZoneLines() {
    currentZoneLines.forEach(line => {
        try { candleSeries.removePriceLine(line); } catch (e) {}
    });
    currentZoneLines = [];
}

function drawSMCZones(zones) {
    if (!zones) return;
    const recent = zones.slice(-3);
    recent.forEach(z => {
        const isDemand = z.zone_type === 'DEMAND';
        const color = isDemand ? '#00d084' : '#ff4757';
        const label = isDemand ? 'Demand' : 'Supply';

        const lineHigh = candleSeries.createPriceLine({
            price: z.zone_high,
            color: color,
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Solid,
            axisLabelVisible: true,
            title: `${label} High`,
        });
        currentZoneLines.push(lineHigh);

        const lineLow = candleSeries.createPriceLine({
            price: z.zone_low,
            color: color,
            lineWidth: 1,
            lineStyle: LightweightCharts.LineStyle.Solid,
            axisLabelVisible: true,
            title: `${label} Low`,
        });
        currentZoneLines.push(lineLow);

        if (z.has_lq && z.lq_price) {
            const lqLine = candleSeries.createPriceLine({
                price: z.lq_price,
                color: '#06b6d4',
                lineWidth: 1,
                lineStyle: LightweightCharts.LineStyle.Dotted,
                axisLabelVisible: true,
                title: 'LQ Pool',
            });
            currentZoneLines.push(lqLine);
        }
    });
}

function updateChartMarkers() {
    const pairSignals = state.signals.filter(s => s.pair === state.selectedPair);
    const markers = pairSignals.map(s => ({
        time: s.time,
        position: s.signal_type === 'CALL' ? 'belowBar' : 'aboveBar',
        color: s.signal_type === 'CALL' ? '#00d084' : '#ff4757',
        shape: s.signal_type === 'CALL' ? 'arrowUp' : 'arrowDown',
        text: `${s.signal_type} (${s.price})`,
    }));
    candleSeries.setMarkers(markers);
}

function loadChartData(pair, tf) {
    const currentTf = tf || state.timeframe || '1m';
    let size = 60;
    if (pair.includes('XAU') || pair.toLowerCase().includes('gold')) {
        if (currentTf === '10s') size = 10;
        else if (currentTf === '15m') size = 900;
    }

    const candles = window.iqDirectClient.getCandles(pair, size);
    if (!candles || candles.length === 0) return;

    const highs = candles.map(c => c.high);
    const lows = candles.map(c => c.low);
    const closes = candles.map(c => c.close);

    const sma5 = window.IndicatorEngine.sma(closes, 5);
    const atr14 = window.IndicatorEngine.atr(highs, lows, closes, 14);
    const { upper: upK, lower: lowK } = window.IndicatorEngine.keltnerChannel(highs, lows, closes, 4, 0.1);
    const cci14 = window.IndicatorEngine.cci(highs, lows, closes, 14);
    const zones = window.SMCEngine.analyzeSMCZones(candles, atr14);

    const candleData = candles.map(c => ({
        time: c.time,
        open: c.open,
        high: c.high,
        low: c.low,
        close: c.close,
    }));

    const smaData = candles.map((c, i) => ({ time: c.time, value: sma5[i] }));
    const upKData = candles.map((c, i) => ({ time: c.time, value: upK[i] }));
    const lowKData = candles.map((c, i) => ({ time: c.time, value: lowK[i] }));

    candleSeries.setData(candleData);
    smaSeries.setData(smaData);
    upperKeltnerSeries.setData(upKData);
    lowerKeltnerSeries.setData(lowKData);

    const last = candles[candles.length - 1];
    if (last.close > 500 || pair.includes('XAU') || pair.includes('BTC')) {
        candleSeries.applyOptions({ priceFormat: { type: 'price', precision: 2, minMove: 0.01 } });
    } else if (last.close > 20 || pair.includes('JPY')) {
        candleSeries.applyOptions({ priceFormat: { type: 'price', precision: 3, minMove: 0.001 } });
    } else {
        candleSeries.applyOptions({ priceFormat: { type: 'price', precision: 5, minMove: 0.00001 } });
    }

    el.chartCurrentPrice.innerText = formatPrice(last.close, pair);
    el.chartCCIVal.innerText = (cci14[cci14.length - 1] || 0).toFixed(1);
    el.chartSMAVal.innerText = formatPrice(sma5[sma5.length - 1], pair);

    clearZoneLines();
    drawSMCZones(zones);
    updateChartMarkers();
    chart.timeScale().fitContent();
}

function populateManualPairDropdown() {
    if (!el.selectManualPair) return;
    el.selectManualPair.innerHTML = '';

    const groups = {
        '🥇 ทองคำและสินค้าโภคภัณฑ์': state.pairs.filter(p => p.type === 'commodity' || p.symbol.includes('XAU') || p.symbol.includes('XAG') || p.symbol.includes('USO')),
        '🌐 ตลาด OTC 24/7 (Payout 90-95%)': state.pairs.filter(p => (p.type === 'otc' || p.symbol.includes('-OTC')) && !p.symbol.includes('XAU') && !p.symbol.includes('XAG') && !p.symbol.includes('USO')),
        '💱 ตลาดคู่เงินปกติ': state.pairs.filter(p => p.type === 'binary' && !p.symbol.includes('-OTC')),
        '₿ คริปโตเคอเรนซี': state.pairs.filter(p => p.type === 'crypto' || p.symbol.includes('BTC') || p.symbol.includes('ETH')),
    };

    for (const [groupName, list] of Object.entries(groups)) {
        if (list.length === 0) continue;
        const optgroup = document.createElement('optgroup');
        optgroup.label = groupName;

        list.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.symbol;
            opt.textContent = `${p.display} (${p.payout}%)`;
            if (p.symbol === state.selectedPair) opt.selected = true;
            optgroup.appendChild(opt);
        });
        el.selectManualPair.appendChild(optgroup);
    }
}

function renderPairs() {
    if (!el.pairsGrid) return;
    el.pairsGrid.innerHTML = '';

    const query = (state.searchQuery || '').trim().toLowerCase();

    const filtered = state.pairs.filter(p => {
        if (query) {
            const symMatch = p.symbol.toLowerCase().includes(query);
            const dispMatch = p.display.toLowerCase().includes(query);
            if (!symMatch && !dispMatch) return false;
        }
        if (state.filterType === 'COMMODITY') return p.type === 'commodity' || p.symbol.includes('XAU') || p.symbol.includes('XAG') || p.symbol.includes('USO');
        if (state.filterType === 'NORMAL') return p.type === 'binary' && !p.symbol.includes('-OTC');
        if (state.filterType === 'OTC') return p.type === 'otc' || p.symbol.includes('-OTC');
        if (state.filterType === 'CRYPTO') return p.type === 'crypto' || p.symbol.includes('BTC') || p.symbol.includes('ETH');
        return true;
    });

    filtered.forEach(p => {
        const isSelected = p.symbol === state.selectedPair;
        const isGold = p.symbol.includes('XAU');
        const btn = document.createElement('button');
        btn.className = `flex items-center justify-between p-2 rounded-xl border text-left transition ${
            isSelected
                ? 'bg-amber-500/20 border-amber-500/60 text-amber-200 ring-1 ring-amber-400'
                : isGold
                    ? 'bg-[#182032] border-amber-500/30 text-amber-300 hover:border-amber-400'
                    : 'bg-[#090d16] border-[#1e293b] text-slate-300 hover:border-slate-500'
        }`;

        let typeLabel = 'ปกติ';
        if (p.type === 'commodity' || isGold) typeLabel = 'โภคภัณฑ์/ทอง';
        else if (p.type === 'crypto') typeLabel = 'คริปโต';
        else if (p.type === 'otc' || p.symbol.includes('-OTC')) typeLabel = '24/7 OTC';

        btn.innerHTML = `
            <div class="flex flex-col">
                <span class="text-xs font-bold font-mono ${isGold ? 'text-amber-300' : ''}">${p.display}</span>
                <span class="text-[9px] text-slate-500">${typeLabel}</span>
            </div>
            <span class="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                p.payout >= 90 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700/50 text-slate-300'
            }">${p.payout}%</span>
        `;
        btn.onclick = () => selectPair(p);
        el.pairsGrid.appendChild(btn);
    });
}

function selectPair(pairInfo) {
    if (!pairInfo) return;
    state.selectedPair = pairInfo.symbol;
    state.selectedDisplay = pairInfo.display;
    state.selectedPayout = pairInfo.payout;

    el.chartPairTitle.innerText = pairInfo.display;
    el.chartPayoutBadge.innerText = `Payout ${pairInfo.payout}%`;

    if (el.selectManualPair) el.selectManualPair.value = pairInfo.symbol;

    if (el.selectedAssetTypeBadge) {
        let label = 'Forex';
        if (pairInfo.symbol.includes('XAU')) label = '🥇 ทองคำ (Commodity)';
        else if (pairInfo.type === 'commodity') label = '📦 โภคภัณฑ์';
        else if (pairInfo.type === 'crypto') label = '₿ คริปโต';
        else if (pairInfo.type === 'otc' || pairInfo.symbol.includes('-OTC')) label = '🌐 OTC 24/7';
        el.selectedAssetTypeBadge.innerText = label;
    }

    if (el.quickBtnGold) {
        if (pairInfo.symbol.includes('XAU')) {
            el.quickBtnGold.classList.add('ring-2', 'ring-amber-400', 'bg-amber-500/35');
        } else {
            el.quickBtnGold.classList.remove('ring-2', 'ring-amber-400', 'bg-amber-500/35');
        }
    }

    const isGold = pairInfo.symbol.includes('XAU') || (pairInfo.display && pairInfo.display.includes('ทอง'));
    if (el.goldTimeframeSelector) {
        if (isGold) {
            el.goldTimeframeSelector.classList.remove('hidden');
        } else {
            el.goldTimeframeSelector.classList.add('hidden');
            state.timeframe = '1m';
            document.querySelectorAll('.gold-tf-btn').forEach(b => {
                if (b.dataset.tf === '1m') {
                    b.className = 'gold-tf-btn px-2.5 py-0.5 rounded-lg text-xs font-bold transition bg-amber-500/30 text-amber-300 border border-amber-500/50';
                } else {
                    b.className = 'gold-tf-btn px-2.5 py-0.5 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white';
                }
            });
        }
    }
    updateTfLabel(isGold);

    renderPairs();
    updateTopBar();
    loadChartData(pairInfo.symbol, state.timeframe);
}

function updateTfLabel(isGold) {
    if (!el.chartTfLabel) return;
    if (isGold) {
        if (state.timeframe === '10s') el.chartTfLabel.innerText = '10-Second Candles (10 วิ)';
        else if (state.timeframe === '15m') el.chartTfLabel.innerText = '15-Minute Candles (15 นาที)';
        else el.chartTfLabel.innerText = '1-Minute Candles (1 นาที)';
    } else {
        el.chartTfLabel.innerText = '1-Minute Candles (1 นาที)';
    }
}

window.quickSelectPair = (sym) => {
    let pair = state.pairs.find(p => p.symbol === sym);
    if (!pair) {
        if (sym === 'XAUUSD-OTC' || sym === 'XAUUSD') {
            pair = { symbol: 'XAUUSD-OTC', display: 'XAU/USD (OTC) [ทองคำ]', payout: 93, type: 'commodity' };
        } else {
            pair = { symbol: sym, display: sym, payout: 88, type: 'otc' };
        }
    }
    if (pair) selectPair(pair);
};

function updateTopBar() {
    el.balanceDisplay.innerText = `$${state.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    el.accountModeBadge.innerText = state.accountMode;
    if (state.accountMode === 'REAL') {
        el.accountModeBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase';
    } else {
        el.accountModeBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 uppercase';
    }

    const amt = parseFloat(el.inputOrderAmount.value) || 10.0;
    const profit = (amt * state.selectedPayout / 100.0).toFixed(2);
    el.callProfitCalc.innerText = `+$${profit}`;
    el.putProfitCalc.innerText = `+$${profit}`;
}

function renderInZoneTable() {
    el.inZoneCountBadge.innerText = `${state.inZoneList.length} คู่`;
    if (!el.inZoneTableBody) return;

    if (state.inZoneList.length === 0) {
        el.inZoneTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="py-6 text-center text-slate-500 text-[11px] font-sans">
                    ยังไม่มีคู่เงินที่กวาด LQ และย่ำเข้ามาในโซน
                </td>
            </tr>
        `;
        return;
    }

    el.inZoneTableBody.innerHTML = state.inZoneList.map(item => `
        <tr class="hover:bg-slate-800/40 transition">
            <td class="py-2 font-bold text-white">${item.display}</td>
            <td class="py-2 text-center">
                <span class="px-1.5 py-0.5 rounded text-[10px] font-bold ${
                    item.zone_type === 'DEMAND' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                }">${item.zone_type}</span>
            </td>
            <td class="py-2 text-center">
                <span class="${item.lq_swept ? 'text-emerald-400' : 'text-slate-500'} font-bold">
                    ${item.lq_swept ? '✓ กวาดแล้ว' : 'รอจังหวะ'}
                </span>
            </td>
            <td class="py-2 text-right font-bold text-emerald-400">${item.payout}%</td>
            <td class="py-2 text-right">
                <button onclick="window.quickSelectPair('${item.pair}')" class="px-2 py-0.5 rounded bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 text-[10px] font-bold">
                    ดูกราฟ
                </button>
            </td>
        </tr>
    `).join('');
}

function renderSignalsFeed() {
    el.signalsCountBadge.innerText = `${state.signals.length} สัญญาณ`;
    if (!el.signalsFeed) return;

    if (state.signals.length === 0) {
        el.signalsFeed.innerHTML = `
            <div class="py-8 text-center text-slate-500 text-[11px]">
                รอสัญญาณลั่นไก pohlor (Silent Alert Gate Active)
            </div>
        `;
        return;
    }

    el.signalsFeed.innerHTML = state.signals.slice(0, 15).map(s => {
        const isCall = s.signal_type === 'CALL';
        const d = new Date(s.time * 1000);
        const timeStr = d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        return `
            <div class="p-2.5 rounded-xl border ${
                isCall ? 'bg-emerald-950/20 border-emerald-500/30' : 'bg-rose-950/20 border-rose-500/30'
            } transition flex items-center justify-between">
                <div>
                    <div class="flex items-center space-x-2">
                        <span class="text-xs font-bold px-2 py-0.5 rounded-md font-mono ${
                            isCall ? 'bg-emerald-500 text-slate-950' : 'bg-rose-500 text-white'
                        }">${s.signal_type}</span>
                        <span class="text-xs font-bold text-white font-mono">${s.display || s.pair}</span>
                        <span class="text-[10px] text-slate-400 font-mono">${timeStr}</span>
                    </div>
                    <div class="text-[10px] text-slate-400 mt-1 font-mono">
                        ราคา: <span class="text-white">${formatPrice(s.price, s.pair)}</span> • CCI: <span class="${isCall ? 'text-emerald-400' : 'text-rose-400'}">${s.cci}</span> • โซน: <span class="text-slate-300">${s.zone_type}</span>
                    </div>
                </div>
                <button onclick="window.quickSelectPair('${s.pair}')" class="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-cyan-300">
                    เข้าชม
                </button>
            </div>
        `;
    }).join('');
}

// Client-Side Background Scanner Loop (1 Second Interval)
function startClientScanner() {
    setInterval(() => {
        const now = Math.floor(Date.now() / 1000);
        const rem = 59 - (now % 60);
        el.countdownSeconds.innerText = `${rem}s`;
        if (rem <= 5) {
            el.countdownSeconds.classList.add('text-rose-400');
            el.countdownSeconds.classList.remove('text-cyan-400');
        } else {
            el.countdownSeconds.classList.remove('text-rose-400');
            el.countdownSeconds.classList.add('text-cyan-400');
        }

        if (!state.isScanning || !window.iqDirectClient.isConnected) return;

        const inZoneCandidates = [];
        let successCount = 0;

        for (const p of state.pairs) {
            const candles = window.iqDirectClient.getCandles(p.symbol, 60);
            if (!candles || candles.length < 20) continue;
            successCount++;

            const highs = candles.map(c => c.high);
            const lows = candles.map(c => c.low);
            const closes = candles.map(c => c.close);
            const atr14 = window.IndicatorEngine.atr(highs, lows, closes, 14);
            const zones = window.SMCEngine.analyzeSMCZones(candles, atr14);

            for (const z of zones) {
                if (z.in_zone && !z.is_mitigated) {
                    inZoneCandidates.push({
                        pair: p.symbol,
                        display: p.display,
                        payout: p.payout,
                        zone_type: z.zone_type,
                        zone_high: z.zone_high,
                        zone_low: z.zone_low,
                        has_lq: z.has_lq,
                        lq_swept: z.lq_swept,
                    });
                    break;
                }
            }

            // Trigger evaluation
            const sig = window.TriggerEngine.evaluatePohlorTrigger(p.symbol, candles, zones);
            if (sig) {
                sig.display = p.display;
                sig.payout = p.payout;
                const already = state.signals.some(s => s.pair === p.symbol && Math.abs(s.time - sig.time) < 60);
                if (!already) {
                    state.signals.unshift(sig);
                    playAudioAlert(sig.signal_type);
                    renderSignalsFeed();
                    updateChartMarkers();

                    // Auto-Trade execution
                    if (state.isAutoTrade) {
                        const inCd = state.cooldowns[p.symbol] && now < state.cooldowns[p.symbol];
                        if (!inCd) {
                            const amt = parseFloat(el.inputOrderAmount.value) || 10.0;
                            window.iqDirectClient.placeOrder(p.symbol, sig.signal_type, amt);
                            state.cooldowns[p.symbol] = now + 60;
                        }
                    }
                }
            }
        }

        state.inZoneList = inZoneCandidates;
        renderInZoneTable();

        const cdCount = Object.values(state.cooldowns).filter(exp => exp > now).length;
        el.statusBarText.innerText = `ดึงแท่งสำเร็จ ${successCount}/${state.pairs.length} คู่ • พักหลังรู้ผล ${cdCount} คู่ • พบสัญญาณ ${state.signals.length} คู่ (Direct IQ WebSocket)`;

    }, 1000);
}

// Event Listeners Setup
function setupEventListeners() {
    if (el.selectManualPair) {
        el.selectManualPair.onchange = (e) => {
            const sym = e.target.value;
            const found = state.pairs.find(p => p.symbol === sym);
            if (found) selectPair(found);
        };
    }

    if (el.pairSearchInput) {
        el.pairSearchInput.oninput = (e) => {
            state.searchQuery = e.target.value;
            renderPairs();
        };
    }

    // Gold Timeframe Buttons
    document.querySelectorAll('.gold-tf-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.gold-tf-btn').forEach(b => {
                b.className = 'gold-tf-btn px-2.5 py-0.5 rounded-lg text-xs font-bold transition text-slate-400 hover:text-white';
            });
            btn.className = 'gold-tf-btn px-2.5 py-0.5 rounded-lg text-xs font-bold transition bg-amber-500/30 text-amber-300 border border-amber-500/50';
            state.timeframe = btn.dataset.tf;
            const isGold = state.selectedPair.includes('XAU') || (state.selectedDisplay && state.selectedDisplay.includes('ทอง'));
            updateTfLabel(isGold);
            loadChartData(state.selectedPair, state.timeframe);
        };
    });

    // Category Filters
    document.querySelectorAll('.pair-filter-btn').forEach(btn => {
        btn.onclick = () => {
            document.querySelectorAll('.pair-filter-btn').forEach(b => {
                b.className = 'pair-filter-btn px-2 py-0.5 rounded-md text-slate-400 hover:text-slate-200';
            });
            const filter = btn.dataset.filter;
            if (filter === 'COMMODITY') {
                btn.className = 'pair-filter-btn px-2 py-0.5 rounded-md font-bold text-amber-400 bg-[#182032]';
            } else if (filter === 'CRYPTO') {
                btn.className = 'pair-filter-btn px-2 py-0.5 rounded-md font-bold text-cyan-400 bg-[#182032]';
            } else {
                btn.className = 'pair-filter-btn px-2 py-0.5 rounded-md font-semibold text-emerald-400 bg-[#182032]';
            }
            state.filterType = filter;
            renderPairs();
        };
    });

    // Manual Trade Buttons
    el.btnManualCall.onclick = () => {
        const amt = parseFloat(el.inputOrderAmount.value) || 10.0;
        window.iqDirectClient.placeOrder(state.selectedPair, 'CALL', amt);
    };
    el.btnManualPut.onclick = () => {
        const amt = parseFloat(el.inputOrderAmount.value) || 10.0;
        window.iqDirectClient.placeOrder(state.selectedPair, 'PUT', amt);
    };

    el.inputOrderAmount.oninput = updateTopBar;

    el.btnToggleScan.onclick = () => {
        state.isScanning = !state.isScanning;
        if (state.isScanning) {
            el.btnToggleScan.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md bg-emerald-600 hover:bg-emerald-500 text-white';
            el.scanButtonText.innerText = '🟢 สแกน Real-time: กำลังทำงาน';
        } else {
            el.btnToggleScan.className = 'flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-md bg-slate-700 hover:bg-slate-600 text-slate-200';
            el.scanButtonText.innerText = '🔴 สแกน: หยุดชั่วคราว';
        }
    };

    // Auto-Trade Switch
    el.toggleAutoTrade.onchange = (e) => {
        state.isAutoTrade = e.target.checked;
        if (state.isAutoTrade) el.cooldownBadge.classList.remove('hidden');
        else el.cooldownBadge.classList.add('hidden');
    };

    // Sound Toggle
    el.btnSoundToggle.onclick = () => {
        state.soundEnabled = !state.soundEnabled;
        if (state.soundEnabled) {
            el.iconSoundOn.classList.remove('hidden');
            el.iconSoundOff.classList.add('hidden');
            playAudioAlert('CALL');
        } else {
            el.iconSoundOn.classList.add('hidden');
            el.iconSoundOff.classList.remove('hidden');
        }
    };

    // Switch Account Practice / Real
    el.btnSwitchAccount.onclick = () => {
        const nextMode = state.accountMode === 'PRACTICE' ? 'REAL' : 'PRACTICE';
        window.iqDirectClient.switchBalance(nextMode);
    };

    // Modal
    if (el.btnOpenLoginModal && el.loginModal) {
        el.btnOpenLoginModal.onclick = () => el.loginModal.classList.remove('hidden');
    }
    if (el.btnCloseModal && el.loginModal) {
        el.btnCloseModal.onclick = () => el.loginModal.classList.add('hidden');
    }

    // Submit Credentials (Email & Password Login)
    if (el.btnSubmitCredentials) {
        el.btnSubmitCredentials.onclick = async () => {
            const email = el.inputEmail ? el.inputEmail.value.trim() : "";
            const password = el.inputPassword ? el.inputPassword.value.trim() : "";
            const gw = el.inputGatewayUrl ? el.inputGatewayUrl.value.trim() : "https://pohlor-iq.pohlor27.workers.dev";

            if (!email || !password) {
                if (el.loginStatusMsg) {
                    el.loginStatusMsg.innerText = "กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน";
                    el.loginStatusMsg.classList.remove('hidden');
                }
                return;
            }

            if (el.loginStatusMsg) {
                el.loginStatusMsg.innerText = "กำลังเข้าสู่ระบบ IQ Option...";
                el.loginStatusMsg.className = "text-xs text-cyan-300 bg-cyan-500/10 border border-cyan-500/20 p-2.5 rounded-xl font-mono";
                el.loginStatusMsg.classList.remove('hidden');
            }

            try {
                let apiUrl = "/api/login";
                if (gw && gw.startsWith("http")) {
                    const gwOrigin = new URL(gw).origin;
                    apiUrl = `${gwOrigin}/api/login`;
                }

                console.log(`[App] Calling Auth API: ${apiUrl}`);
                const resp = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await resp.json();
                console.log("[App] Auth API Response:", data);

                if (data.code === "success" && (data.ssid || (data.data && data.data.ssid))) {
                    const freshSSID = data.ssid || (data.data && data.data.ssid);
                    if (el.loginStatusMsg) {
                        el.loginStatusMsg.innerText = `เข้าสู่ระบบสำเร็จ! (User ID: ${data.user_id || (data.data && data.data.user_id)})`;
                        el.loginStatusMsg.className = "text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 p-2.5 rounded-xl font-mono";
                    }
                    if (typeof localStorage !== 'undefined') {
                        localStorage.setItem('pohlor_iq_email', email);
                        localStorage.setItem('pohlor_iq_ssid', freshSSID);
                        localStorage.setItem('pohlor_ws_gateway', gw);
                    }
                    if (el.inputSSID) el.inputSSID.value = freshSSID;

                    window.iqDirectClient.connect(freshSSID, state.accountMode, gw);

                    setTimeout(() => {
                        el.loginModal.classList.add('hidden');
                        if (el.loginStatusMsg) el.loginStatusMsg.classList.add('hidden');
                    }, 1200);
                } else {
                    const err = data.message || "อีเมลหรือรหัสผ่านไม่ถูกต้อง หรือต้องยืนยัน 2FA";
                    if (el.loginStatusMsg) {
                        el.loginStatusMsg.innerText = `เกิดข้อผิดพลาด: ${err}`;
                        el.loginStatusMsg.className = "text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-mono";
                    }
                }
            } catch (err) {
                console.error("[App] Login error:", err);
                if (el.loginStatusMsg) {
                    el.loginStatusMsg.innerText = `ไม่สามารถเชื่อมต่อ Gateway: ${err.message}`;
                    el.loginStatusMsg.className = "text-xs text-rose-300 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded-xl font-mono";
                }
            }
        };
    }

    // Submit Manual SSID
    if (el.btnSubmitSSID) {
        el.btnSubmitSSID.onclick = () => {
            const val = el.inputSSID.value.trim();
            const gw = el.inputGatewayUrl ? el.inputGatewayUrl.value.trim() : "";
            if (val) {
                if (typeof localStorage !== 'undefined') {
                    localStorage.setItem('pohlor_iq_ssid', val);
                    localStorage.setItem('pohlor_ws_gateway', gw);
                }
                window.iqDirectClient.connect(val, state.accountMode, gw);
                el.loginModal.classList.add('hidden');
            }
        };
    }
}

function bootstrap() {
    setupEventListeners();
    initChart();
    populateManualPairDropdown();
    renderPairs();
    updateTopBar();

    // Hook IQ Direct callbacks
    window.iqDirectClient.onBalanceUpdate = (bal, mode) => {
        state.balance = bal;
        state.accountMode = mode;
        updateTopBar();
    };

    window.iqDirectClient.onAuthStatus = (ok, msg) => {
        if (ok) {
            el.connectionLabel.innerText = `เชื่อมต่อแล้ว (${window.iqDirectClient.userName})`;
            el.connectionDot.className = 'w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400';
            if (el.ssidErrorMsg) el.ssidErrorMsg.classList.add('hidden');
            loadChartData(state.selectedPair, state.timeframe);
        } else {
            el.connectionLabel.innerText = msg;
            el.connectionDot.className = 'w-2.5 h-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500';
            if (msg.includes('SSID') && el.loginModal) {
                if (el.ssidErrorMsg) {
                    el.ssidErrorMsg.innerText = `${msg} กรุณาระบุ SSID ใหม่ที่ยังไม่หมดอายุ`;
                    el.ssidErrorMsg.classList.remove('hidden');
                }
                el.loginModal.classList.remove('hidden');
            }
        }
    };

    window.iqDirectClient.onCandleUpdate = (key, candles) => {
        let activeKey = state.selectedPair;
        if (state.selectedPair.includes('XAU')) {
            if (state.timeframe === '10s') activeKey = `${state.selectedPair}_10`;
            else if (state.timeframe === '15m') activeKey = `${state.selectedPair}_900`;
        }

        if (key === activeKey && candles.length > 0) {
            const last = candles[candles.length - 1];
            candleSeries.update({
                time: last.time,
                open: last.open,
                high: last.high,
                low: last.low,
                close: last.close,
            });
            el.chartCurrentPrice.innerText = formatPrice(last.close, state.selectedPair);
        }
    };

    // Auto connect direct to IQ Option
    console.log("[App] Initializing Direct IQ Option WebSocket session...");
    const activeEmail = (typeof localStorage !== 'undefined' && localStorage.getItem('pohlor_iq_email')) || "pohlor185@gmail.com";
    const activeSSID = (typeof localStorage !== 'undefined' && localStorage.getItem('pohlor_iq_ssid')) || "9f5f3aea7d7037a7b1f118ea1932028p";
    const activeGateway = (typeof localStorage !== 'undefined' && localStorage.getItem('pohlor_ws_gateway')) || "https://pohlor-iq.pohlor27.workers.dev";
    if (el.inputEmail) el.inputEmail.value = activeEmail;
    if (el.inputSSID) el.inputSSID.value = activeSSID;
    if (el.inputGatewayUrl) el.inputGatewayUrl.value = activeGateway;
    window.iqDirectClient.connect(activeSSID, "PRACTICE", activeGateway);

    startClientScanner();
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
