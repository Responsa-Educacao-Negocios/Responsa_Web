const MP_ACCESS_TOKEN =
  process.env.MP_ENV === "production"
    ? process.env.MP_ACCESS_TOKEN || ""
    : process.env.MP_ACCESS_TOKEN_TEST || "";

const MP_BASE = "https://api.mercadopago.com";

async function mpRequest(method: "GET" | "POST", path: string, body?: object) {
  const res = await fetch(`${MP_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export function mpGet(path: string) {
  return mpRequest("GET", path);
}

export function mpPost(path: string, body: object) {
  return mpRequest("POST", path, body);
}
