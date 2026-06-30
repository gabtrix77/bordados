// /api/stats — valida usuário+senha NO SERVIDOR (env vars) e devolve as métricas.
// A senha nunca fica no código do navegador: é conferida aqui contra ADMIN_PASS.
module.exports = async (req, res) => {
  const expectedUser = process.env.ADMIN_USER || "admin";
  const expectedPass = process.env.ADMIN_PASS;

  const u = req.headers["x-admin-user"] || (req.query && req.query.user) || (req.body && req.body.user) || "";
  const p = req.headers["x-admin-pass"] || (req.query && req.query.pass) || (req.body && req.body.pass) || "";

  if (!expectedPass) { res.status(503).json({ error: "ADMIN_PASS não configurado na Vercel" }); return; }
  if (String(u) !== String(expectedUser) || String(p) !== String(expectedPass)) {
    res.status(401).json({ error: "unauthorized" }); return;
  }

  const url   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    res.status(200).json({ starts: 0, steps: [], completions: 0, completion_rate: 0, checkout_clicks: 0, kv: false });
    return;
  }

  const funnel = String((req.query && req.query.funnel) || "quizz").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40) || "quizz";
  const MAX = 30;

  const cmds = [];
  cmds.push(["SCARD", `bdm:${funnel}:starts`]);
  cmds.push(["SCARD", `bdm:${funnel}:checkout`]);
  for (let i = 0; i < MAX; i++) cmds.push(["SCARD", `bdm:${funnel}:step:${i}`]);
  for (let i = 0; i < MAX; i++) cmds.push(["GET",   `bdm:${funnel}:sn:${i}`]);

  try {
    const r = await fetch(`${url}/pipeline`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(cmds)
    });
    const arr = await r.json();
    const val = (i) => (arr[i] && (arr[i].result !== undefined ? arr[i].result : arr[i]));

    const starts   = Number(val(0) || 0);
    const checkout = Number(val(1) || 0);
    const counts = [], names = [];
    for (let i = 0; i < MAX; i++) counts.push(Number(val(2 + i) || 0));
    for (let i = 0; i < MAX; i++) names.push(val(2 + MAX + i));

    const base = Math.max(starts, counts[0] || 0, 1);
    const steps = [];
    for (let i = 0; i < MAX; i++) {
      const c = counts[i], n = names[i];
      if (c > 0 || (n !== null && n !== undefined && n !== "")) {
        steps.push({ index: i, name: (n || ("Etapa " + i)), leads: c, pct: Math.round(1000 * c / base) / 10 });
      }
    }
    const completions = steps.length ? steps[steps.length - 1].leads : 0;
    const completion_rate = Math.round(1000 * completions / base) / 10;

    res.status(200).json({
      funnel, starts, steps, completions, completion_rate,
      checkout_clicks: checkout, kv: true, updated_at: new Date().toISOString()
    });
  } catch (e) {
    res.status(500).json({ error: "kv_read_failed", detail: String(e).slice(0, 140) });
  }
};
