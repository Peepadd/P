/**
 * Portfolio Calculation Utilities
 * อิงจากตรรกะของโปรเจกต์ ETF
 */

export function computeHoldings(trades) {
  const holdingsMap = new Map();

  for (const trade of trades) {
    const sym = trade.symbol;
    const existing = holdingsMap.get(sym) || {
      symbol: sym,
      totalQuantity: 0,
      totalCost: 0,
      averagePrice: 0,
    };

    if (trade.type === 'BUY') {
      existing.totalQuantity += Number(trade.quantity);
      existing.totalCost += Number(trade.total_value);
    } else {
      const avgCost = existing.totalQuantity > 0 ? existing.totalCost / existing.totalQuantity : 0;
      existing.totalQuantity -= Number(trade.quantity);
      existing.totalCost -= avgCost * Number(trade.quantity);
    }

    if (existing.totalQuantity > 0) {
      existing.averagePrice = existing.totalCost / existing.totalQuantity;
    } else {
      existing.totalCost = 0;
      existing.averagePrice = 0;
    }
    holdingsMap.set(sym, existing);
  }

  return Array.from(holdingsMap.values()).filter((h) => h.totalQuantity > 0);
}

export function computeDividendYOC(dividends, holdings) {
  const divBySymbol = new Map();
  for (const d of dividends) {
    const current = divBySymbol.get(d.symbol) || 0;
    divBySymbol.set(d.symbol, current + Number(d.amount));
  }

  const costBySymbol = new Map();
  for (const h of holdings) {
    costBySymbol.set(h.symbol, h.totalCost);
  }

  const result = [];
  for (const [symbol, totalDividends] of divBySymbol) {
    const costBasis = costBySymbol.get(symbol) || 0;
    result.push({
      symbol,
      totalDividends,
      costBasis,
      yieldOnCost: costBasis > 0 ? (totalDividends / costBasis) * 100 : 0,
    });
  }

  result.sort((a, b) => b.yieldOnCost - a.yieldOnCost);
  return result;
}

export function computeRealizedPL(trades, holdings) {
  let totalPL = 0;
  const holdingsCost = new Map();

  for (const trade of trades) {
    if (trade.type === 'BUY') {
      const current = holdingsCost.get(trade.symbol) || 0;
      holdingsCost.set(trade.symbol, current + Number(trade.total_value));
    } else {
      const costBasis = holdingsCost.get(trade.symbol) || 0;
      const holding = holdings.find((h) => h.symbol === trade.symbol);
      const totalQtySold = Number(trade.quantity);
      const avgCost = costBasis > 0 ? costBasis / (holding ? holding.totalQuantity + totalQtySold : totalQtySold) : 0;
      totalPL += Number(trade.total_value) - avgCost * totalQtySold - Number(trade.broker_fee || 0);

      const remaining = costBasis - avgCost * totalQtySold;
      holdingsCost.set(trade.symbol, Math.max(0, remaining));
    }
  }

  return totalPL;
}
