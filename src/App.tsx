import { Streamdown } from "streamdown";
import { code } from "@streamdown/code";

const markdown = `# Streamdown layoutshift fixed

Do the following:

* Open dev console > Network tab > check "disable cache" > Reload

You should see the following for codeblock bellow:

* Code not highlighted > Code highlighted (no cls)

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

no cls :^D
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
    </div>
  );
}
