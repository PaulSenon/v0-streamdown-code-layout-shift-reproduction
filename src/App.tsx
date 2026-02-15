import { useEffect, useRef, useState } from "react";
import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

function ClsCounter() {
  const [cls, setCls] = useState(0);
  const [entries, setEntries] = useState<{ value: number; time: number }[]>([]);
  const observerRef = useRef<PerformanceObserver | null>(null);

  useEffect(() => {
    if (!("PerformanceObserver" in window)) return;

    observerRef.current = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as PerformanceEntry & { hadRecentInput?: boolean }).hadRecentInput) {
          const value = (entry as PerformanceEntry & { value: number }).value;
          setCls((prev) => prev + value);
          setEntries((prev) => [
            ...prev.slice(-19),
            { value, time: Math.round(entry.startTime) },
          ]);
        }
      }
    });

    observerRef.current.observe({ type: "layout-shift", buffered: true });

    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

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
      <ClsCounter />
    </div>
  );
}
