#!/usr/bin/env node

import { createServer, request as createProxyRequest } from "node:http";
import { connect } from "node:net";

const listenHost = process.env.CODEXSUN_DEV_DOMAIN_HOST?.trim() || "127.0.0.1";
const listenPort = parsePort(process.env.CODEXSUN_DEV_DOMAIN_PORT || "80");

const hostRoutes = new Map([
  ["app.codexsun.test", { label: "CODEXSUN app portal", port: 7020, type: "platform" }],
  ["aaran.test", { label: "Aaran tenant workspace", port: 7020, type: "platform" }]
]);

const server = createServer((request, response) => {
  const target = resolveTarget(request);
  if (!target) {
    response.writeHead(421, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(
      `Unknown local CODEXSUN host. Use one of: ${Array.from(hostRoutes.keys()).join(", ")}\n`
    );
    return;
  }

  const proxyRequest = createProxyRequest(
    {
      headers: proxyHeaders(request, target),
      host: "127.0.0.1",
      method: request.method,
      path: target.path,
      port: target.port
    },
    (proxyResponse) => {
      response.writeHead(proxyResponse.statusCode ?? 502, proxyResponse.headers);
      proxyResponse.pipe(response);
    }
  );

  proxyRequest.on("error", (error) => proxyFailure(response, target, error));
  request.pipe(proxyRequest);
});

server.on("upgrade", (request, socket, head) => {
  const target = resolveTarget(request);
  if (!target) {
    socket.end("HTTP/1.1 421 Misdirected Request\r\nConnection: close\r\n\r\n");
    return;
  }

  const upstream = connect(target.port, "127.0.0.1", () => {
    const headers = proxyHeaders(request, target);
    const headerLines = Object.entries(headers).flatMap(([name, value]) =>
      Array.isArray(value) ? value.map((entry) => `${name}: ${entry}`) : [`${name}: ${value}`]
    );

    upstream.write(
      `${request.method ?? "GET"} ${target.path} HTTP/${request.httpVersion}\r\n${headerLines.join("\r\n")}\r\n\r\n`
    );
    if (head.length) upstream.write(head);
    socket.pipe(upstream).pipe(socket);
  });

  upstream.on("error", () => {
    if (!socket.destroyed) {
      socket.end("HTTP/1.1 502 Bad Gateway\r\nConnection: close\r\n\r\n");
    }
  });
  socket.on("error", () => upstream.destroy());
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `Local domain gateway cannot start: ${listenHost}:${listenPort} is already in use.`
    );
  } else if (error.code === "EACCES") {
    console.error(
      `Local domain gateway cannot bind ${listenHost}:${listenPort}. Run the terminal with permission to use port ${listenPort}.`
    );
  } else {
    console.error(error);
  }
  process.exit(1);
});

server.listen(listenPort, listenHost, () => {
  console.log(`\nCODEXSUN local domain gateway: http://${listenHost}:${listenPort}`);
  for (const [host, route] of hostRoutes) {
    console.log(`  http://${host} -> ${route.label} on 127.0.0.1:${route.port}`);
  }
  console.log("");
});

function resolveTarget(request) {
  const host = normalizeHost(request.headers.host);
  const route = hostRoutes.get(host);
  if (!route) return null;

  const requestPath = request.url || "/";
  const isPlatformApi =
    route.type === "platform" && /^\/api\/platform(?:[/?]|$)/u.test(requestPath);

  return {
    host,
    path: isPlatformApi ? stripPlatformApiPrefix(requestPath) : requestPath,
    port: isPlatformApi ? 7010 : route.port,
    preserveHost: isPlatformApi,
    route
  };
}

function proxyHeaders(request, target) {
  const headers = { ...request.headers };
  const remoteAddress = request.socket.remoteAddress || "127.0.0.1";
  const priorForwardedFor = request.headers["x-forwarded-for"];

  headers.host = target.preserveHost ? target.host : `127.0.0.1:${target.port}`;
  headers["x-forwarded-for"] = priorForwardedFor
    ? `${String(priorForwardedFor)}, ${remoteAddress}`
    : remoteAddress;
  headers["x-forwarded-host"] = target.host;
  headers["x-forwarded-proto"] = "http";
  return headers;
}

function proxyFailure(response, target, error) {
  if (response.headersSent) {
    response.destroy(error);
    return;
  }

  response.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" });
  response.end(
    `${target.route.label} is not running on 127.0.0.1:${target.port}.\nStart the local domain stack with: npm run dev:domains\n`
  );
}

function normalizeHost(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/u, "");
}

function stripPlatformApiPrefix(value) {
  const remainder = value.slice("/api/platform".length);
  if (!remainder) return "/";
  return remainder.startsWith("?") ? `/${remainder}` : remainder;
}

function parsePort(value) {
  const port = Number(value);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid CODEXSUN_DEV_DOMAIN_PORT: ${value}`);
  }
  return port;
}
