
import { useEffect, useRef } from "react";

interface TradingViewChartProps {
  symbol?: string;
  interval?: string;
  theme?: "light" | "dark";
  autosize?: boolean;
  height?: number;
  className?: string;
}

export function TradingViewChart({
  symbol = "NASDAQ:AAPL",
  interval = "D",
  theme = "light",
  autosize = true,
  height = 500,
  className = "",
}: TradingViewChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Clean up any existing widgets
    if (containerRef.current) {
      containerRef.current.innerHTML = "";
    }

    // Create the TradingView widget
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.async = true;
    script.onload = () => {
      if (window.TradingView && containerRef.current) {
        new window.TradingView.widget({
          autosize,
          symbol,
          interval,
          timezone: "Etc/UTC",
          theme,
          style: "1",
          locale: "en",
          toolbar_bg: "rgba(0, 0, 0, 0)",
          enable_publishing: false,
          allow_symbol_change: true,
          save_image: false,
          container_id: containerRef.current.id,
          hide_top_toolbar: false,
          hide_legend: false,
          studies: ["RSI@tv-basicstudies", "MAExp@tv-basicstudies"],
        });
      }
    };

    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, interval, theme, autosize]);

  return (
    <div
      ref={containerRef}
      id={`tradingview_chart_${symbol.replace(/[^a-zA-Z0-9]/g, "")}`}
      className={`rounded-lg overflow-hidden border border-border/30 ${className}`}
      style={{ height: autosize ? "100%" : `${height}px` }}
    />
  );
}

// Add missing window.TradingView type
declare global {
  interface Window {
    TradingView: any;
  }
}
