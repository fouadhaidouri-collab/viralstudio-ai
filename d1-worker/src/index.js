export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Access-Control-Allow-Headers": "Content-Type,X-API-Key" },
      });
    }

    const apiKey = request.headers.get("X-API-Key");
    if (apiKey !== env.API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { "Content-Type": "application/json" } });
    }

    const DB = env.DB;

    if (path === "/query" && request.method === "POST") {
      const { sql, params } = await request.json();
      if (!sql) return new Response(JSON.stringify({ error: "Missing sql" }), { status: 400, headers: { "Content-Type": "application/json" } });
      try {
        const stmt = DB.prepare(sql);
        const bound = params ? stmt.bind(...params) : stmt;
        const result = await bound.all();
        return new Response(JSON.stringify({ success: true, results: result.results }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (path === "/run" && request.method === "POST") {
      const { sql, params } = await request.json();
      if (!sql) return new Response(JSON.stringify({ error: "Missing sql" }), { status: 400, headers: { "Content-Type": "application/json" } });
      try {
        const stmt = DB.prepare(sql);
        const bound = params ? stmt.bind(...params) : stmt;
        const result = await bound.run();
        return new Response(JSON.stringify({ success: true, meta: result.meta }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (path === "/batch" && request.method === "POST") {
      const { statements } = await request.json();
      if (!statements || !Array.isArray(statements)) return new Response(JSON.stringify({ error: "Missing statements array" }), { status: 400, headers: { "Content-Type": "application/json" } });
      try {
        const batch = statements.map((s) => {
          const stmt = DB.prepare(s.sql);
          return s.params ? stmt.bind(...s.params) : stmt;
        });
        const results = await DB.batch(batch);
        return new Response(JSON.stringify({ success: true, results: results.map((r) => r.results) }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    if (path === "/migrate" && request.method === "POST") {
      try {
        const schema = await request.text();
        const statements = schema.split(";").map((s) => s.trim()).filter((s) => s.length > 0);
        const batch = statements.map((s) => DB.prepare(s + ";"));
        await DB.batch(batch);
        return new Response(JSON.stringify({ success: true }), {
          headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { "Content-Type": "application/json" } });
  },
};
