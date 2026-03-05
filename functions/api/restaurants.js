export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400"
    }
  });
}

export async function onRequestGet({ request, env }) {
  const requestUrl = new URL(request.url);
  const lat = Number(requestUrl.searchParams.get("lat"));
  const lon = Number(requestUrl.searchParams.get("lon"));
  const rawRadius = Number(requestUrl.searchParams.get("radius") || 3000);
  const radius = Math.max(300, Math.min(rawRadius, 15000));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return json({ error: "Invalid lat/lon" }, 400);
  }

  if (!env.AMAP_WEB_KEY) {
    return json({ error: "Server missing AMAP_WEB_KEY" }, 500);
  }

  const amapUrl = new URL("https://restapi.amap.com/v3/place/around");
  amapUrl.searchParams.set("key", env.AMAP_WEB_KEY);
  amapUrl.searchParams.set("location", `${lon},${lat}`);
  amapUrl.searchParams.set("keywords", "餐厅");
  amapUrl.searchParams.set("types", "050000");
  amapUrl.searchParams.set("radius", String(radius));
  amapUrl.searchParams.set("offset", "25");
  amapUrl.searchParams.set("page", "1");
  amapUrl.searchParams.set("extensions", "base");
  amapUrl.searchParams.set("sortrule", "distance");
  amapUrl.searchParams.set("output", "JSON");

  const upstream = await fetch(amapUrl.toString(), {
    headers: {
      "User-Agent": "snarky-restaurant-picker/1.0"
    }
  });

  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "no-store"
    }
  });
}

