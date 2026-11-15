/**
 * pohlor Trigger Engine (Pure Client-Side)
 * Evaluates 1-minute CALL and PUT conditions strictly when price is in a qualified SMC Zone.
 */

window.TriggerEngine = {
    evaluatePohlorTrigger(pair, candles, zones) {
        const n = candles.length;
        if (n < 20) return null;

        // Check active zone passing Silent Alert Gate
        const validDemand = zones.filter(z => z.zone_type === 'DEMAND' && window.SMCEngine.checkSilentAlertGate(z));
        const validSupply = zones.filter(z => z.zone_type === 'SUPPLY' && window.SMCEngine.checkSilentAlertGate(z));

        if (validDemand.length === 0 && validSupply.length === 0) {
            return null; // Silent Alert Gate is locked
        }

        const highs = candles.map(c => c.high);
        const lows = candles.map(c => c.low);
        const closes = candles.map(c => c.close);

        const sma5List = window.IndicatorEngine.sma(closes, 5);
        const atr14List = window.IndicatorEngine.atr(highs, lows, closes, 14);
        const { upper: upperK, lower: lowerK } = window.IndicatorEngine.keltnerChannel(highs, lows, closes, 4, 0.1);
        const cci14List = window.IndicatorEngine.cci(highs, lows, closes, 14);

        const currIdx = n - 1;
        const curr = candles[currIdx];
        const prev = candles[currIdx - 1];

        const currSma5 = sma5List[currIdx];
        const currAtr14 = atr14List[currIdx];
        const currUpper = upperK[currIdx];
        const currLower = lowerK[currIdx];
        const currCci = cci14List[currIdx];

        const currLen = curr.high - curr.low;
        const prevLen = prev.high - prev.low;

        if (currAtr14 <= 0) return null;

        // 1. Check CALL (ONLY in Demand Zone)
        if (validDemand.length > 0) {
            const zone = validDemand[validDemand.length - 1];
            const c1 = curr.low > currLower;
            const c2 = curr.close > curr.open;
            const c3 = currCci >= 100;
            const c4 = prevLen > 0 ? (currLen <= 2.0 * prevLen) : true;
            const c5 = curr.high > prev.high;
            const c6 = currLen <= (1.5 * currAtr14);
            const c7 = Math.abs(curr.open - currSma5) <= (1.0 * currAtr14);

            if (c1 && c2 && c3 && c4 && c5 && c6 && c7) {
                return {
                    signal_type: 'CALL',
                    pair: pair,
                    time: curr.time,
                    price: curr.close,
                    zone_type: 'DEMAND',
                    zone_high: zone.zone_high,
                    zone_low: zone.zone_low,
                    cci: Number(currCci.toFixed(2)),
                    sma5: Number(currSma5.toFixed(5)),
                    atr14: Number(currAtr14.toFixed(5)),
                    keltner_upper: Number(currUpper.toFixed(5)),
                    keltner_lower: Number(currLower.toFixed(5)),
                    reason: 'Demand Zone + LQ Swept + pohlor CALL Rules Match',
                };
            }
        }

        // 2. Check PUT (ONLY in Supply Zone)
        if (validSupply.length > 0) {
            const zone = validSupply[validSupply.length - 1];
            const c1 = curr.high < currUpper;
            const c2 = curr.close < curr.open;
            const c3 = currCci <= -100;
            const c4 = prevLen > 0 ? (currLen <= 2.0 * prevLen) : true;
            const c5 = curr.low < prev.low;
            const c6 = currLen <= (1.5 * currAtr14);
            const c7 = Math.abs(curr.open - currSma5) <= (1.0 * currAtr14);

            if (c1 && c2 && c3 && c4 && c5 && c6 && c7) {
                return {
                    signal_type: 'PUT',
                    pair: pair,
                    time: curr.time,
                    price: curr.close,
                    zone_type: 'SUPPLY',
                    zone_high: zone.zone_high,
                    zone_low: zone.zone_low,
                    cci: Number(currCci.toFixed(2)),
                    sma5: Number(currSma5.toFixed(5)),
                    atr14: Number(currAtr14.toFixed(5)),
                    keltner_upper: Number(currUpper.toFixed(5)),
                    keltner_lower: Number(currLower.toFixed(5)),
                    reason: 'Supply Zone + LQ Swept + pohlor PUT Rules Match',
                };
            }
        }

        return null;
    }
};
