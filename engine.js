/**
 * Technical Indicators Engine (Pure Client-Side JavaScript)
 * Zero external dependencies, high precision.
 */

window.IndicatorEngine = {
    trueRange(high, low, close) {
        const n = high.length;
        if (n === 0) return [];
        const tr = new Array(n).fill(0.0);
        tr[0] = high[0] - low[0];
        for (let i = 1; i < n; i++) {
            tr[i] = Math.max(
                high[i] - low[i],
                Math.abs(high[i] - close[i - 1]),
                Math.abs(low[i] - close[i - 1])
            );
        }
        return tr;
    },

    rma(values, period) {
        const n = values.length;
        if (n === 0) return [];
        const res = new Array(n).fill(0.0);
        if (n < period) {
            let cum = 0.0;
            for (let i = 0; i < n; i++) {
                cum += values[i];
                res[i] = cum / (i + 1);
            }
            return res;
        }

        let initSum = 0.0;
        for (let i = 0; i < period; i++) initSum += values[i];
        res[period - 1] = initSum / period;
        for (let i = 0; i < period - 1; i++) {
            let sum_i = 0.0;
            for (let j = 0; j <= i; j++) sum_i += values[j];
            res[i] = sum_i / (i + 1);
        }

        for (let i = period; i < n; i++) {
            res[i] = (res[i - 1] * (period - 1) + values[i]) / period;
        }
        return res;
    },

    atr(high, low, close, period = 14) {
        const tr = this.trueRange(high, low, close);
        return this.rma(tr, period);
    },

    sma(values, period) {
        const n = values.length;
        const res = new Array(n).fill(0.0);
        if (n === 0) return res;
        let cum = 0.0;
        for (let i = 0; i < n; i++) {
            cum += values[i];
            if (i >= period) {
                cum -= values[i - period];
                res[i] = cum / period;
            } else {
                res[i] = cum / (i + 1);
            }
        }
        return res;
    },

    ema(values, period) {
        const n = values.length;
        if (n === 0) return [];
        const res = new Array(n).fill(0.0);
        const alpha = 2.0 / (period + 1);
        res[0] = values[0];
        for (let i = 1; i < n; i++) {
            res[i] = alpha * values[i] + (1.0 - alpha) * res[i - 1];
        }
        return res;
    },

    hlc3(high, low, close) {
        return high.map((h, i) => (h + low[i] + close[i]) / 3.0);
    },

    keltnerChannel(high, low, close, period = 4, offsetMult = 0.1) {
        const tp = this.hlc3(high, low, close);
        const middle = this.ema(tp, period);
        const tr = this.trueRange(high, low, close);
        const trRma = this.rma(tr, period);

        const n = high.length;
        const upper = new Array(n).fill(0.0);
        const lower = new Array(n).fill(0.0);
        for (let i = 0; i < n; i++) {
            const offset = trRma[i] * offsetMult;
            upper[i] = middle[i] + offset;
            lower[i] = middle[i] - offset;
        }
        return { upper, middle, lower };
    },

    cci(high, low, close, period = 14) {
        const tp = this.hlc3(high, low, close);
        const smaTp = this.sma(tp, period);
        const n = tp.length;
        const res = new Array(n).fill(0.0);

        for (let i = 0; i < n; i++) {
            const startIdx = Math.max(0, i - period + 1);
            const count = i - startIdx + 1;
            const mean = smaTp[i];
            let devSum = 0.0;
            for (let k = startIdx; k <= i; k++) {
                devSum += Math.abs(tp[k] - mean);
            }
            const mad = devSum / count;
            if (mad === 0.0) {
                res[i] = 0.0;
            } else {
                res[i] = (tp[i] - mean) / (0.015 * mad);
            }
        }
        return res;
    }
};
