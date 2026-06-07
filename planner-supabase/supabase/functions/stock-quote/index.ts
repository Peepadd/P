import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { symbols } = await req.json();

    if (!symbols) {
      return new Response(JSON.stringify({ error: "Missing symbols" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const symbolList = symbols.split(",").map((s: string) => s.trim().toUpperCase()).filter(Boolean);

    if (symbolList.length === 0) {
      return new Response(JSON.stringify({ error: "No valid symbols" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = [];

    const fetches = symbolList.map(async (symbol: string, index: number) => {
      // Stagger
      await new Promise((resolve) => setTimeout(resolve, index * 200));

      try {
        const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
        const res = await fetch(url, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });

        if (!res.ok) return null;

        const data = await res.json();
        const result = data?.chart?.result?.[0];

        if (!result?.meta || result.meta.regularMarketPrice == null) return null;

        const price = result.meta.regularMarketPrice;
        const previousClose = result.meta.chartPreviousClose;
        const change = previousClose != null ? price - previousClose : null;
        const changePercent =
          change != null && previousClose != null && previousClose !== 0
            ? (change / previousClose) * 100
            : null;

        return {
          symbol,
          price,
          change,
          changePercent,
          currency: result.meta.currency ?? "USD",
        };
      } catch {
        return null;
      }
    });

    const settled = await Promise.allSettled(fetches);
    for (const s of settled) {
      if (s.status === "fulfilled" && s.value) {
        results.push(s.value);
      }
    }

    // Add placeholders for failed
    const foundSymbols = new Set(results.map((r) => r.symbol));
    for (const sym of symbolList) {
      if (!foundSymbols.has(sym)) {
        results.push({
          symbol: sym,
          price: null,
          change: null,
          changePercent: null,
          currency: "USD",
        });
      }
    }

    return new Response(JSON.stringify({ data: results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch stock data" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
