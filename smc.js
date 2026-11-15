/**
 * SMC Zone and Liquidity Gate Detection Engine (Pure Client-Side)
 * Detects Bullish/Bearish Impulse Candles, Demand/Supply Zones,
 * Liquidity (LQ) pools, and enforces the Silent Alert Gate.
 */

window.SMCEngine = {
    detectSwings(candles, left = 1, right = 1) {
        const swingHighs = [];
        const swingLows = [];
        const n = candles.length;

        for (let i = left; i < n - right; i++) {
            const h = candles[i].high;
            const l = candles[i].low;

            let isSH = true;
            for (let k = 1; k <= left; k++) {
                if (candles[i - k].high >= h) { isSH = false; break; }
            }
            if (isSH) {
                for (let k = 1; k <= right; k++) {
                    if (candles[i + k].high >= h) { isSH = false; break; }
                }
            }
            if (isSH) swingHighs.push({ index: i, price: h });

            let isSL = true;
            for (let k = 1; k <= left; k++) {
                if (candles[i - k].low <= l) { isSL = false; break; }
            }
            if (isSL) {
                for (let k = 1; k <= right; k++) {
                    if (candles[i + k].low <= l) { isSL = false; break; }
                }
            }
            if (isSL) swingLows.push({ index: i, price: l });
        }

        return { swingHighs, swingLows };
    },

    analyzeSMCZones(candles, atrValues) {
        const n = candles.length;
        if (n < 10) return [];

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);

        if (!atrValues) {
            atrValues = window.IndicatorEngine.atr(highs, lows, closes, 14);
        }

        const { swingHighs, swingLows } = this.detectSwings(candles, 1, 1);
        const zones = [];

        // 1. Search for Impulse Candles and their Base Candles
        for (let i = 1; i < n; i++) {
            const c = candles[i];
            const prev = candles[i - 1];
            const body = Math.abs(c.close - c.open);
            const cAtr = i < atrValues.length ? atrValues[i] : atrValues[atrValues.length - 1];

            if (cAtr <= 0) continue;
            const isImpulse = body > (1.8 * cAtr);
            if (!isImpulse) continue;

            // Bullish Impulse -> Demand Zone on previous base candle
            if (c.close > c.open) {
                zones.push({
                    zone_type: 'DEMAND',
                    base_index: i - 1,
                    impulse_index: i,
                    zone_high: prev.high,
                    zone_low: prev.low,
                    time: prev.time,
                    has_lq: false,
                    lq_price: null,
                    lq_index: null,
                    lq_swept: false,
                    is_mitigated: false,
                    in_zone: false,
                });
            }
            // Bearish Impulse -> Supply Zone on previous base candle
            else if (c.close < c.open) {
                zones.push({
                    zone_type: 'SUPPLY',
                    base_index: i - 1,
                    impulse_index: i,
                    zone_high: prev.high,
                    zone_low: prev.low,
                    time: prev.time,
                    has_lq: false,
                    lq_price: null,
                    lq_index: null,
                    lq_swept: false,
                    is_mitigated: false,
                    in_zone: false,
                });
            }
        }

        // 2. Evaluate Liquidity (LQ) and Mitigation for recent zones
        const currIdx = n - 1;
        const currCandle = candles[currIdx];

        const recentZones = zones.slice(-15);
        for (const zone of recentZones) {
            if (zone.zone_type === 'DEMAND') {
                // Swing Low forms ABOVE Demand Zone
                const qualSl = swingLows.filter(s => s.index > zone.impulse_index && s.price > zone.zone_high);
                if (qualSl.length > 0) {
                    zone.has_lq = true;
                    // lowest swing low above zone
                    let best = qualSl[0];
                    for (const s of qualSl) {
                        if (s.price < best.price) best = s;
                    }
                    zone.lq_index = best.index;
                    zone.lq_price = best.price;
                }

                let invalidated = false;
                let swept = false;
                for (let k = zone.impulse_index + 1; k < n; k++) {
                    const ck = candles[k];
                    if (ck.close < zone.zone_low) {
                        invalidated = true;
                        break;
                    }
                    if (zone.has_lq && zone.lq_price !== null) {
                        if (k >= zone.lq_index && ck.low <= zone.lq_price) {
                            swept = true;
                        }
                    }
                }
                zone.is_mitigated = invalidated;
                zone.lq_swept = swept;

                if (!zone.is_mitigated && currCandle.low <= zone.zone_high && currCandle.high >= zone.zone_low) {
                    zone.in_zone = true;
                }
            } else {
                // SUPPLY: Swing High forms BELOW Supply Zone
                const qualSh = swingHighs.filter(s => s.index > zone.impulse_index && s.price < zone.zone_low);
                if (qualSh.length > 0) {
                    zone.has_lq = true;
                    let best = qualSh[0];
                    for (const s of qualSh) {
                        if (s.price > best.price) best = s;
                    }
                    zone.lq_index = best.index;
                    zone.lq_price = best.price;
                }

                let invalidated = false;
                let swept = false;
                for (let k = zone.impulse_index + 1; k < n; k++) {
                    const ck = candles[k];
                    if (ck.close > zone.zone_high) {
                        invalidated = true;
                        break;
                    }
                    if (zone.has_lq && zone.lq_price !== null) {
                        if (k >= zone.lq_index && ck.high >= zone.lq_price) {
                            swept = true;
                        }
                    }
                }
                zone.is_mitigated = invalidated;
                zone.lq_swept = swept;

                if (!zone.is_mitigated && currCandle.high >= zone.zone_low && currCandle.low <= zone.zone_high) {
                    zone.in_zone = true;
                }
            }
        }

        return recentZones;
    },

    checkSilentAlertGate(zone) {
        if (!zone) return false;
        if (zone.is_mitigated) return false;
        if (!zone.has_lq) return false;
        if (!zone.lq_swept) return false;
        if (!zone.in_zone) return false;
        return true;
    }
};
