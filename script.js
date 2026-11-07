// Global App State
let assetsData = [
    { name: "Bitcoin", symbol: "BTC", price: 68420.10, change: 3.45, volume: "$32.4B", category: "crypto" },
    { name: "Ethereum", symbol: "ETH", price: 3540.25, change: -1.20, volume: "$14.8B", category: "crypto" },
    { name: "Solana", symbol: "SOL", price: 184.60, change: 7.82, volume: "$5.2B", category: "crypto" },
    { name: "Apple Inc.", symbol: "AAPL", price: 182.30, change: 0.85, volume: "$9.1B", category: "stocks" },
    { name: "Tesla", symbol: "TSLA", price: 248.90, change: -2.45, volume: "$11.3B", category: "stocks" },
    { name: "NVIDIA", symbol: "NVIDIA", price: 875.40, change: 4.12, volume: "$18.6B", category: "stocks" },
    { name: "Cardano", symbol: "ADA", price: 0.58, change: 1.15, volume: "$850M", category: "crypto" },
    { name: "Microsoft", symbol: "MSFT", price: 425.20, change: 1.05, volume: "$7.4B", category: "stocks" }
];

let portfolio = [
    { symbol: "BTC", holdings: 0.35, avgPrice: 65200.00 },
    { symbol: "ETH", holdings: 4.20, avgPrice: 3400.00 },
    { symbol: "AAPL", holdings: 15, avgPrice: 175.50 }
];

let selectedAsset = assetsData[0];
let buyingPower = 24580.50;
let canvas, ctx;

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    initNavigation();
    initMarquee();
    initWatchlist();
    initChart();
    initOrderBook();
    initPortfolio();
    initEventListeners();
    
    // Live price simulation loop every 2 seconds
    setInterval(simulateLivePrices, 2000);
});

// Navigation Tab Switching
function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    navItems.forEach(item => {
        item.addEventListener("click", (e) => {
            e.preventDefault();
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");
            
            const targetTab = item.getAttribute("data-tab");
            document.querySelectorAll(".content-view").forEach(view => {
                view.classList.remove("active");
            });
            document.getElementById(targetTab + "View").classList.add("active");
        });
    });
}

// Top Marquee Feed
function initMarquee() {
    const marqueeContainer = document.getElementById("tickerMarquee");
    let html = "";
    assetsData.concat(assetsData).forEach(asset => {
        const changeClass = asset.change >= 0 ? "positive" : "negative";
        const sign = asset.change >= 0 ? "+" : "";
        html += `<div class="marquee-item">
            <span><strong>${asset.symbol}</strong> $${asset.price.toLocaleString()}</span>
            <span class="${changeClass}">(${sign}${asset.change}%)</span>
        </div>`;
    });
    marqueeContainer.innerHTML = html;
}

// Watchlist Table Population
function initWatchlist() {
    const tbody = document.getElementById("watchlistBody");
    renderWatchlistTable(assetsData);

    // Filter Buttons
    document.querySelectorAll(".filter-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const filter = btn.getAttribute("data-filter");
            if(filter === "all") renderWatchlistTable(assetsData);
            else renderWatchlistTable(assetsData.filter(a => a.category === filter));
        });
    });
}

function renderWatchlistTable(data) {
    const tbody = document.getElementById("watchlistBody");
    tbody.innerHTML = data.map(asset => `
        <tr>
            <td>
                <div class="asset-cell">
                    <div class="asset-icon">${asset.symbol.substring(0,2)}</div>
                    ${asset.name}
                </div>
            </td>
            <td>${asset.symbol}</td>
            <td>$${asset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
            <td class="${asset.change >= 0 ? 'positive' : 'negative'}">${asset.change >= 0 ? '+' : ''}${asset.change}%</td>
            <td>${asset.volume}</td>
            <td><button class="primary-btn" style="padding: 6px 12px; font-size: 0.8rem;" onclick="selectAssetForChart('${asset.symbol}')">Trade</button></td>
        </tr>
    `).join("");
}

// Select Asset to view on Chart
function selectAssetForChart(symbol) {
    const asset = assetsData.find(a => a.symbol === symbol);
    if(asset) {
        selectedAsset = asset;
        document.getElementById("currentAssetBadge").innerText = `${asset.symbol} / USD`;
        document.getElementById("mainAssetPrice").innerText = `$${asset.price.toLocaleString()}`;
        const changeEl = document.getElementById("mainAssetChange");
        changeEl.innerText = `${asset.change >= 0 ? '+' : ''}${asset.change}%`;
        changeEl.className = `price-change ${asset.change >= 0 ? 'positive' : 'negative'}`;
        
        // Switch to dashboard tab if not already
        document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
        document.querySelector('[data-tab="dashboard"]').classList.add("active");
        document.querySelectorAll(".content-view").forEach(v => v.classList.remove("active"));
        document.getElementById("dashboardView").classList.add("active");
        
        drawChart();
    }
}

// HTML5 Canvas Price Chart
function initChart() {
    canvas = document.getElementById("priceCanvas");
    ctx = canvas.getContext("2d");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    drawChart();

    // Timeframe buttons
    document.querySelectorAll(".tf-btn").forEach(btn => {
        btn.addEventListener("click", () => {
            document.querySelectorAll(".tf-btn").forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            drawChart();
        });
    });
}

function resizeCanvas() {
    if(!canvas) return;
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
    drawChart();
}

function drawChart() {
    if(!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Generate pseudo historical price points based on current asset price
    const pointsCount = 40;
    const points = [];
    let base = selectedAsset.price * 0.92;
    for(let i = 0; i < pointsCount; i++) {
        base += (Math.random() - 0.48) * (selectedAsset.price * 0.015);
        points.push(base);
    }
    points[points.length - 1] = selectedAsset.price; // match current price

    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const padding = 30;
    const graphHeight = canvas.height - padding * 2;
    const graphWidth = canvas.width;

    const getX = (i) => (i / (pointsCount - 1)) * graphWidth;
    const getY = (val) => canvas.height - padding - ((val - min) / range) * graphHeight;

    // Draw gradient area
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0.0)');

    ctx.beginPath();
    ctx.moveTo(getX(0), canvas.height);
    for(let i = 0; i < points.length; i++) {
        ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.lineTo(getX(points.length - 1), canvas.height);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    for(let i = 0; i < points.length; i++) {
        if(i === 0) ctx.moveTo(getX(i), getY(points[i]));
        else ctx.lineTo(getX(i), getY(points[i]));
    }
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.stroke();
}

// Order Book Simulation
function initOrderBook() {
    const container = document.getElementById("orderBookList");
    let html = `<div class="order-book-row" style="color:var(--text-muted); font-weight:600;"><span>Price (USD)</span><span>Amount</span><span>Total</span></div>`;
    
    let basePrice = 68420;
    for(let i = 0; i < 5; i++) {
        basePrice -= 15;
        html += `<div class="order-book-row" style="color:var(--negative);"><span>$${basePrice.toFixed(2)}</span><span>${(Math.random()*1.5).toFixed(4)}</span><span>$${(basePrice * 1.2).toFixed(2)}</span></div>`;
    }
    for(let i = 0; i < 5; i++) {
        basePrice += 15;
        html += `<div class="order-book-row" style="color:var(--positive);"><span>$${basePrice.toFixed(2)}</span><span>${(Math.random()*1.5).toFixed(4)}</span><span>$${(basePrice * 1.2).toFixed(2)}</span></div>`;
    }
    container.innerHTML = html;
}

// Portfolio View
function initPortfolio() {
    const tbody = document.getElementById("portfolioBody");
    let totalVal = 0;
    let totalCost = 0;

    tbody.innerHTML = portfolio.map(item => {
        const asset = assetsData.find(a => a.symbol === item.symbol) || { price: 100 };
        const currentVal = item.holdings * asset.price;
        const costVal = item.holdings * item.avgPrice;
        const pnl = currentVal - costVal;
        const pnlPercent = (pnl / costVal) * 100;
        
        totalVal += currentVal;
        totalCost += costVal;

        return `
            <tr>
                <td><strong>${item.symbol}</strong></td>
                <td>${item.holdings}</td>
                <td>$${item.avgPrice.toLocaleString()}</td>
                <td>$${currentVal.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                <td class="${pnl >= 0 ? 'positive' : 'negative'}">${pnl >= 0 ? '+' : ''}$${pnl.toFixed(2)} (${pnlPercent.toFixed(2)}%)</td>
                <td><button class="primary-btn" style="padding: 6px 12px; font-size: 0.8rem;" onclick="openTradeModal('sell', '${item.symbol}')">Liquidate</button></td>
            </tr>
        `;
    }).join("");

    const totalPNL = totalVal - totalCost;
    const totalPNLPercent = totalCost > 0 ? (totalPNL / totalCost) * 100 : 0;
    document.getElementById("portfolioTotalVal").innerText = `$${totalVal.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    const pnlEl = document.getElementById("portfolioPNL");
    pnlEl.innerText = `${totalPNL >= 0 ? '+' : ''}$${totalPNL.toLocaleString(undefined, {minimumFractionDigits: 2})} (${totalPNLPercent.toFixed(2)}%)`;
    pnlEl.className = totalPNL >= 0 ? 'positive' : 'negative';
}

// Event Listeners & Modals
function initEventListeners() {
    // Theme Toggle
    document.getElementById("themeToggleBtn").addEventListener("click", () => {
        const isLight = document.body.getAttribute("data-theme") === "light";
        document.body.setAttribute("data-theme", isLight ? "" : "light");
        document.getElementById("themeToggleBtn").innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });

    // Modal controls
    const modal = document.getElementById("tradeModal");
    document.getElementById("openTradeModalBtn").addEventListener("click", () => openTradeModal('buy'));
    document.getElementById("closeModalBtn").addEventListener("click", () => modal.style.display = "none");

    // Execute Buy/Sell from Terminal
    document.getElementById("executeBuyBtn").addEventListener("click", () => executeTrade('buy'));
    document.getElementById("executeSellBtn").addEventListener("click", () => executeTrade('sell'));
    document.getElementById("confirmTradeBtn").addEventListener("click", () => {
        modal.style.display = "none";
        showToast("Transaction confirmed successfully!");
    });

    // Global Search filter
    document.getElementById("globalSearch").addEventListener("input", (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = assetsData.filter(a => a.name.toLowerCase().includes(query) || a.symbol.toLowerCase().includes(query));
        renderWatchlistTable(filtered);
    });
}

function openTradeModal(type, symbol = 'BTC') {
    const modal = document.getElementById("tradeModal");
    const asset = assetsData.find(a => a.symbol === symbol) || selectedAsset;
    document.getElementById("modalTitle").innerText = `${type.toUpperCase()} ${asset.symbol}`;
    document.getElementById("modalAsset").value = `${asset.symbol} / USD`;
    document.getElementById("modalPrice").value = `$${asset.price.toLocaleString()}`;
    modal.style.display = "flex";
}

function executeTrade(type) {
    const symbol = document.getElementById("tradeAssetSelect").value;
    const amount = parseFloat(document.getElementById("tradeAmountInput").value);
    const asset = assetsData.find(a => a.symbol === symbol);
    const cost = amount * asset.price;

    if(type === 'buy') {
        if(buyingPower < cost) {
            alert("Insufficient Buying Power!");
            return;
        }
        buyingPower -= cost;
        let portItem = portfolio.find(p => p.symbol === symbol);
        if(portItem) {
            portItem.avgPrice = ((portItem.avgPrice * portItem.holdings) + cost) / (portItem.holdings + amount);
            portItem.holdings += amount;
        } else {
            portfolio.push({ symbol, holdings: amount, avgPrice: asset.price });
        }
    } else {
        let portItem = portfolio.find(p => p.symbol === symbol);
        if(!portItem || portItem.holdings < amount) {
            alert("Insufficient asset holdings to sell!");
            return;
        }
        portItem.holdings -= amount;
        buyingPower += cost;
    }

    document.getElementById("headerBalance").innerText = `$${buyingPower.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    initPortfolio();
    showToast(`Successfully executed ${type.toUpperCase()} order for ${amount} ${symbol}!`);
}

function showToast(msg) {
    const toast = document.getElementById("toastNotification");
    document.getElementById("toastMessage").innerText = msg;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3000);
}

// Live Simulated Price Engine
function simulateLivePrices() {
    assetsData.forEach(asset => {
        const fluctuation = (Math.random() - 0.49) * (asset.price * 0.003);
        asset.price += fluctuation;
        asset.change = +(asset.change + (Math.random() - 0.5) * 0.05).toFixed(2);
    });

    // Update main displayed price if viewing dashboard
    const mainPriceEl = document.getElementById("mainAssetPrice");
    if(mainPriceEl) {
        mainPriceEl.innerText = `$${selectedAsset.price.toLocaleString(undefined, {minimumFractionDigits: 2})}`;
    }

    initMarquee();
    initWatchlist();
    drawChart();
}