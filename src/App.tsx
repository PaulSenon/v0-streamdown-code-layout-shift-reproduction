import { useEffect, useState } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

// Global CLS tracker that starts immediately, outside React lifecycle,
// so it survives StrictMode double-mount and catches all shifts.
const clsTracker = (() => {
  let total = 0;
  const log: { value: number; time: number }[] = [];
  const listeners = new Set<() => void>();

  if (typeof window !== "undefined" && "PerformanceObserver" in window) {
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const e = entry as PerformanceEntry & {
          hadRecentInput?: boolean;
          value: number;
        };
        if (!e.hadRecentInput) {
          console.log("[v0] layout-shift detected:", e.value, "@ ", Math.round(e.startTime), "ms");
          total += e.value;
          log.push({ value: e.value, time: Math.round(e.startTime) });
          if (log.length > 50) log.shift();
          listeners.forEach((fn) => fn());
        }
      }
    });
    obs.observe({ type: "layout-shift", buffered: true });
  }

  return {
    get total() {
      return total;
    },
    get log() {
      return log;
    },
    subscribe(fn: () => void) {
      listeners.add(fn);
      return () => {
        listeners.delete(fn);
      };
    },
  };
})();

function ClsCounter() {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    return clsTracker.subscribe(() => forceUpdate((n) => n + 1));
  }, []);

  const cls = clsTracker.total;
  const entries = clsTracker.log;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9999,
        background: cls === 0 ? "#166534" : cls < 0.1 ? "#854d0e" : "#991b1b",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 12,
        borderRadius: 8,
        padding: "10px 14px",
        minWidth: 180,
        boxShadow: "0 4px 24px rgba(0,0,0,0.25)",
        lineHeight: 1.5,
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
        CLS: {cls.toFixed(4)}
      </div>
      <div style={{ opacity: 0.7, fontSize: 11, marginBottom: 6 }}>
        {cls === 0
          ? "Good (no shifts)"
          : cls < 0.1
            ? "Needs improvement"
            : "Poor (> 0.1)"}
      </div>
      {entries.length > 0 && (
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.2)",
            paddingTop: 6,
            maxHeight: 120,
            overflowY: "auto",
          }}
        >
          {entries.map((e, i) => (
            <div key={i} style={{ fontSize: 10, opacity: 0.8 }}>
              +{e.value.toFixed(4)} @ {e.time}ms
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const markdown = `# Streamdown CLS Code Plugin Demo

Loading codeblock causes cls. To test it:

* Open devtool > Network tab > Disable cache ☑ > Reload page

You should notice the following for the codeblock bellow:

* Loading spinner > Code not higlighted > Code higlighted

\`\`\`typescript
import { useState, useEffect } from "react";

interface FetchState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useFetch<T>(url: string): FetchState<T> {
  const [state, setState] = useState<FetchState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const controller = new AbortController();

    async function fetchData() {
      try {
        setState((prev) => ({ ...prev, loading: true }));
        const response = await fetch(url, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(\`HTTP error! status: \${response.status}\`);
        }

        const data: T = await response.json();
        setState({ data, loading: false, error: null });
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
        setState({
          data: null,
          loading: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    fetchData();
    return () => controller.abort();
  }, [url]);

  return state;
}
\`\`\`
`;

export default function App() {
  return (
    <div
      style={{
        maxWidth: 720,
        margin: "0 auto",
        padding: "48px 24px",
      }}
    >
      <Streamdown plugins={{ code }}>{markdown}</Streamdown>
      <span>will be shifted by above code</span>
      <ClsCounter />
    </div>
  );
}
