"use client";

import React, { useMemo } from "react";

interface SandboxedIframeProps {
  content: string;
  type: string;
}

export const SandboxedIframe: React.FC<SandboxedIframeProps> = ({ content, type }) => {
  const fullHtml = useMemo(() => {
    // If it's pure HTML or contains <!DOCTYPE html> or <html>
    if (
      content.includes("<!DOCTYPE html>") ||
      content.includes("<html") ||
      type === "text/html"
    ) {
      // Inject safety styles and base styling if missing
      if (!content.includes("<!DOCTYPE html>")) {
        return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1.5rem; background: #ffffff; color: #1a1a1a; margin: 0; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
      }
      return content;
    }

    // If it's a React component
    if (type === "application/vnd.ant.react" || content.includes("export default") || content.includes("React.")) {
      return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 0; padding: 1.5rem; background: #ffffff; color: #1a1a1a; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${content
        .replace(/import\s+React.*?from\s+['"].*?['"];?/g, "")
        .replace(/export\s+default\s+function\s+([A-Za-z0-9_]+)/, "function $1")
        .replace(/export\s+default\s+([A-Za-z0-9_]+);?/, "ReactDOM.render(<$1 />, document.getElementById('root'));")}
      
      // If ReactDOM render was not added, try finding the last function component
      if (!document.getElementById('root').hasChildNodes()) {
        const matches = "${content}".match(/function\\s+([A-Z][A-Za-z0-9_]*)/);
        if (matches && matches[1]) {
          ReactDOM.render(React.createElement(eval(matches[1])), document.getElementById('root'));
        }
      }
    } catch(err) {
      document.getElementById('root').innerHTML = '<div style="color:red;padding:1rem;font-family:monospace;">Runtime Error: ' + err.message + '</div>';
    }
  </script>
</body>
</html>`;
    }

    // Fallback HTML wrapper
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 1.5rem; margin: 0; }
  </style>
</head>
<body>
  ${content}
</body>
</html>`;
  }, [content, type]);

  return (
    <iframe
      srcDoc={fullHtml}
      title="Artifact Preview"
      sandbox="allow-scripts allow-modals allow-forms allow-same-origin"
      className="w-full h-full border-0 bg-white"
    />
  );
};
