import { scan } from "react-scan";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "@/App.tsx";
import { initPartyConnection } from "./store/partyConnection";

import "./index.css";
import { initQuiz } from "./store/quiz";

if (process.env.NODE_ENV === "development") {
	scan({
		enabled: false,
	});
}

initPartyConnection("QUIZ");
initQuiz();

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);


if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}

declare global {
  interface ImportMeta {
    hot: {
      data: {
        root?: {
          render: (node: React.ReactNode) => void;
        };
        [key: string]: unknown;
      };
      accept: () => void;
    };
  }
}
