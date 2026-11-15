/**
 * IQ Option Direct Browser WebSocket Client (100% Serverless)
 * Connects directly from any browser/mobile to wss://iqoption.com/echo/websocket
 * Zero backend server required.
 */

class IQOptionDirectClient {
    constructor() {
        this.ws = null;
        this.isConnected = false;
        this.authFailed = false;
        const savedSSID = typeof localStorage !== 'undefined' ? localStorage.getItem('pohlor_iq_ssid') : null;
        this.ssid = savedSSID || "9f5f3aea7d7037a7b1f118ea1932028p"; // Current valid session token
        const savedGateway = typeof localStorage !== 'undefined' ? localStorage.getItem('pohlor_ws_gateway') : null;
        this.gatewayUrl = savedGateway || ""; // Cloudflare Worker Gateway URL
        this.accountType = "PRACTICE"; // PRACTICE or REAL
        this.balance = 0.0;
        this.balances = [];
        this.activeBalanceId = null;
        this.userId = null;
        this.userName = "";
        this.candlesCache = {}; // key: "pair_size" -> [Candle]
        this.activeIdMap = {};
        this.idToPair = {};
        this.onBalanceUpdate = null;
        this.onCandleUpdate = null;
        this.onAuthStatus = null;
        this._initDefaults();
    }

    _initDefaults() {
        const defaults = {
            // Gold, Metals & Commodities
            "XAUUSD-OTC": 1857,
            "XAUUSD": 1857,
            "XAGUSD-OTC": 1858,
            "XAU/XAG-OTC": 2086,
            "USOUSD-OTC": 1859,
            // Crypto
            "BTCUSD": 1916,
            "ETHUSD": 1918,
            // Normal Forex
            "EURUSD": 1, "EURGBP": 2, "EURJPY": 3, "USDJPY": 4, "GBPUSD": 5,
            "GBPJPY": 6, "AUDUSD": 7, "USDCAD": 8, "USDCHF": 9, "NZDUSD": 10,
            "AUDJPY": 11, "EURAUD": 12, "GBPAUD": 13, "CADJPY": 14, "CHFJPY": 15,
            // OTC Forex
            "EURUSD-OTC": 76, "GBPUSD-OTC": 77, "USDJPY-OTC": 78, "AUDUSD-OTC": 79,
            "NZDUSD-OTC": 80, "USDCAD-OTC": 81, "USDCHF-OTC": 82, "EURJPY-OTC": 83,
            "GBPJPY-OTC": 84, "EURGBP-OTC": 85
        };
        for (const [sym, aid] of Object.entries(defaults)) {
            this.activeIdMap[sym] = aid;
            this.idToPair[aid] = sym;
        }
    }

    connect(ssid, mode = "PRACTICE", gatewayUrl = null) {
        if (ssid) {
            this.ssid = ssid.trim();
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('pohlor_iq_ssid', this.ssid);
            }
        }
        if (gatewayUrl !== null && gatewayUrl !== undefined) {
            this.gatewayUrl = gatewayUrl.trim();
            if (typeof localStorage !== 'undefined') {
                localStorage.setItem('pohlor_ws_gateway', this.gatewayUrl);
            }
        }
        this.accountType = mode;
        this.authFailed = false;

        if (this.ws) {
            try { this.ws.close(); } catch(e) {}
        }

        let wsUrl = "wss://iqoption.com/echo/websocket";
        if (this.gatewayUrl) {
            let u = this.gatewayUrl;
            if (u.startsWith("http://")) u = u.replace("http://", "ws://");
            else if (u.startsWith("https://")) u = u.replace("https://", "wss://");
            else if (!u.startsWith("ws://") && !u.startsWith("wss://")) u = "wss://" + u;
            wsUrl = u;
        } else if (typeof window !== 'undefined' && window.location && window.location.host && window.location.host.includes("workers.dev")) {
            // Automatically use internal WebSocket Gateway on Cloudflare Workers
            wsUrl = `wss://${window.location.host}/ws`;
        }

        console.log(`[IQ Direct] Connecting to WebSocket target: ${wsUrl}`);
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log("[IQ Direct] WebSocket connected. Sending auth token...");
            this.ws.send(JSON.stringify({ name: "ssid", msg: this.ssid }));
        };

        this.ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                this._handleMessage(data);
            } catch (err) {
                console.error("[IQ Direct] Parse error:", err);
            }
        };

        this.ws.onclose = () => {
            this.isConnected = false;
            if (this.authFailed) {
                console.warn("[IQ Direct] Connection stopped due to invalid/expired SSID.");
                if (this.onAuthStatus) this.onAuthStatus(false, "SSID ไม่ถูกต้องหรือหมดอายุ");
                return;
            }
            console.warn("[IQ Direct] WebSocket disconnected. Retrying in 3s...");
            if (this.onAuthStatus) this.onAuthStatus(false, "การเชื่อมต่อถูกตัด กำลังลองใหม่...");
            setTimeout(() => this.connect(this.ssid, this.accountType), 3000);
        };

        this.ws.onerror = (err) => {
            console.error("[IQ Direct] WebSocket error:", err);
            if (this.onAuthStatus) this.onAuthStatus(false, "เกิดข้อผิดพลาดในการเชื่อมต่อ");
        };
    }

    _handleMessage(data) {
        const name = data.name;
        const msg = data.msg;

        if (name === "profile") {
            if (msg && msg.user_id) {
                this.isConnected = true;
                this.authFailed = false;
                this.userId = msg.user_id;
                this.userName = msg.name || msg.first_name || `User ${this.userId}`;
                this.balances = msg.balances || [];
                this._applyBalanceMode();
                if (this.onAuthStatus) {
                    this.onAuthStatus(true, `เชื่อมต่อสำเร็จ (${this.userName})`);
                }
                // Subscribe to all pairs and Gold extra timeframes
                this._subscribeAll();
            } else if (msg === false) {
                this.isConnected = false;
                this.authFailed = true;
                if (this.onAuthStatus) this.onAuthStatus(false, "SSID ไม่ถูกต้องหรือหมดอายุ");
            }
        } else if (name === "balances") {
            if (Array.isArray(msg)) {
                this.balances = msg;
                this._applyBalanceMode();
            }
        } else if (name === "candles") {
            const reqId = data.request_id || "";
            const rawCandles = msg && Array.isArray(msg.candles) ? msg.candles : [];
            if (reqId.startsWith("candles_") && rawCandles.length > 0) {
                const cacheKey = reqId.replace("candles_", "");
                const cList = rawCandles.map(c => ({
                    time: Number(c.from || c.time || 0),
                    open: Number(c.open || 0),
                    high: Number(c.max || 0),
                    low: Number(c.min || 0),
                    close: Number(c.close || 0),
                    volume: Number(c.volume || 0),
                }));
                cList.sort((a, b) => a.time - b.time);
                this.candlesCache[cacheKey] = cList;
                if (this.onCandleUpdate) this.onCandleUpdate(cacheKey, cList);
            }
        } else if (name === "candle-generated") {
            if (msg && typeof msg === "object") {
                const aid = msg.active_id;
                const size = msg.size || 60;
                const pair = this.idToPair[aid];
                if (pair) {
                    const cTime = Number(msg.from || 0);
                    const cOpen = Number(msg.open || 0);
                    const cHigh = Number(msg.max || 0);
                    const cLow = Number(msg.min || 0);
                    const cClose = Number(msg.close || 0);
                    const cVol = Number(msg.volume || 0);

                    const targetKeys = (size === 60) ? [pair, `${pair}_60`] : [`${pair}_${size}`];
                    for (const k of targetKeys) {
                        const candles = this.candlesCache[k];
                        if (candles && candles.length > 0) {
                            const last = candles[candles.length - 1];
                            if (last.time === cTime) {
                                last.high = Math.max(last.high, cHigh);
                                last.low = Math.min(last.low, cLow);
                                last.close = cClose;
                                last.volume = cVol;
                            } else if (cTime > last.time) {
                                candles.push({
                                    time: cTime,
                                    open: cOpen,
                                    high: cHigh,
                                    low: cLow,
                                    close: cClose,
                                    volume: cVol,
                                });
                                if (candles.length > 300) candles.shift();
                            }
                            if (this.onCandleUpdate) this.onCandleUpdate(k, candles);
                        }
                    }
                }
            }
        }
    }

    _applyBalanceMode() {
        const targetType = (this.accountType === "PRACTICE") ? 4 : 1;
        for (const b of this.balances) {
            if (b.type === targetType) {
                this.activeBalanceId = b.id;
                this.balance = Number(b.amount || 0);
                break;
            }
        }
        if (this.onBalanceUpdate) {
            this.onBalanceUpdate(this.balance, this.accountType);
        }
    }

    switchBalance(mode) {
        this.accountType = mode;
        this._applyBalanceMode();
        if (this.ws && this.activeBalanceId) {
            this.ws.send(JSON.stringify({
                name: "sendMessage",
                msg: {
                    name: "internal-billing.change-balance",
                    version: "1.0",
                    body: { user_balance_id: this.activeBalanceId },
                },
            }));
        }
    }

    _subscribeAll() {
        if (!this.ws || !this.isConnected) return;
        const now = Math.floor(Date.now() / 1000);

        for (const [pair, aid] of Object.entries(this.activeIdMap)) {
            // 1. Fetch past 120 1-minute candles
            this.ws.send(JSON.stringify({
                name: "sendMessage",
                request_id: `candles_${pair}`,
                msg: {
                    name: "get-candles",
                    version: "2.0",
                    body: { active_id: aid, size: 60, to: now, count: 120 },
                },
            }));

            // 2. Subscribe to 1m live ticks
            this.ws.send(JSON.stringify({
                name: "subscribeMessage",
                msg: {
                    name: "candle-generated",
                    params: { routingFilters: { active_id: aid, size: 60 } },
                },
            }));

            // Extra timeframes specifically for Gold
            if (pair.toLowerCase().includes("xau") || pair.toLowerCase().includes("gold")) {
                for (const extraSize of [10, 900]) {
                    this.ws.send(JSON.stringify({
                        name: "sendMessage",
                        request_id: `candles_${pair}_${extraSize}`,
                        msg: {
                            name: "get-candles",
                            version: "2.0",
                            body: { active_id: aid, size: extraSize, to: now, count: 120 },
                        },
                    }));
                    this.ws.send(JSON.stringify({
                        name: "subscribeMessage",
                        msg: {
                            name: "candle-generated",
                            params: { routingFilters: { active_id: aid, size: extraSize } },
                        },
                    }));
                }
            }
        }
    }

    requestCandles(pair, size = 60) {
        if (!this.ws || !this.isConnected) return;
        const aid = this.activeIdMap[pair];
        if (!aid) return;
        const now = Math.floor(Date.now() / 1000);
        const reqId = (size === 60) ? `candles_${pair}` : `candles_${pair}_${size}`;
        this.ws.send(JSON.stringify({
            name: "sendMessage",
            request_id: reqId,
            msg: {
                name: "get-candles",
                version: "2.0",
                body: { active_id: aid, size: size, to: now, count: 120 },
            },
        }));
    }

    getCandles(pair, size = 60) {
        const key = (size === 60) ? pair : `${pair}_${size}`;
        if (!this.candlesCache[key] || this.candlesCache[key].length < 10) {
            this.requestCandles(pair, size);
        }
        return this.candlesCache[key] || [];
    }

    placeOrder(pair, direction, amount = 10.0) {
        if (!this.isConnected || !this.ws) {
            alert("ยังไม่ได้เชื่อมต่อ IQ Option");
            return false;
        }

        const aid = this.activeIdMap[pair] || 1;
        const now = Math.floor(Date.now() / 1000);
        let exp = (Math.floor(now / 60) + 1) * 60;
        if (exp - now < 10) exp += 60;

        const buyMsg = {
            name: "sendMessage",
            msg: {
                name: "binary-options.open-option",
                version: "1.0",
                body: {
                    user_balance_id: this.activeBalanceId,
                    active_id: aid,
                    option_type_id: 3, // Turbo / 1-5min binary
                    direction: direction.toLowerCase(),
                    expired: exp,
                    price: Number(amount),
                },
            },
        };
        this.ws.send(JSON.stringify(buyMsg));
        return true;
    }
}

window.iqDirectClient = new IQOptionDirectClient();
