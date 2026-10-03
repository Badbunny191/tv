export async function onRequest(context) {
  const { request } = context;
  const requestUrl = new URL(request.url);
  const targetUrl = requestUrl.searchParams.get("url");

  if (!targetUrl) {
    return new Response("Missing target url parameter", { status: 400 });
  }

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const parsedTarget = new URL(targetUrl);
    const headers = new Headers();
    headers.set("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36");
    headers.set("Referer", `${parsedTarget.protocol}//${parsedTarget.host}/`);
    headers.set("Origin", `${parsedTarget.protocol}//${parsedTarget.host}`);

    const upstreamResponse = await fetch(targetUrl, {
      method: "GET",
      headers: headers,
    });

    if (!upstreamResponse.ok) {
      return new Response(`Upstream error: ${upstreamResponse.statusText}`, {
        status: upstreamResponse.status,
      });
    }

    const contentType = upstreamResponse.headers.get("content-type") || "";
    const isPlaylist = targetUrl.includes(".m3u8") || 
                       contentType.includes("application/vnd.apple.mpegurl") || 
                       contentType.includes("application/x-mpegurl");

    if (isPlaylist) {
      const text = await upstreamResponse.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf("/") + 1);

      const rewrittenLines = text.split("\n").map((line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) {
          if (trimmed.includes('URI="')) {
            return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
              const fullUri = uri.startsWith("http") ? uri : new URL(uri, baseUrl).toString();
              return `URI="${requestUrl.origin}/proxy?url=${encodeURIComponent(fullUri)}"`;
            });
          }
          return line;
        }

        const absoluteUrl = trimmed.startsWith("http") ? trimmed : new URL(trimmed, baseUrl).toString();
        return `${requestUrl.origin}/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      });

      const responseHeaders = new Headers();
      responseHeaders.set("Content-Type", "application/vnd.apple.mpegurl");
      responseHeaders.set("Access-Control-Allow-Origin", "*");
      responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
      responseHeaders.set("Cache-Control", "no-cache, no-store, must-revalidate");

      return new Response(rewrittenLines.join("\n"), {
        status: 200,
        headers: responseHeaders,
      });
    }

    const responseHeaders = new Headers(upstreamResponse.headers);
    responseHeaders.set("Access-Control-Allow-Origin", "*");
    responseHeaders.set("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
    responseHeaders.delete("Content-Security-Policy");
    responseHeaders.delete("X-Frame-Options");

    return new Response(upstreamResponse.body, {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch (error) {
    return new Response(`Proxy Error: ${error.message}`, { status: 500 });
  }
}