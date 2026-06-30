// /api/track  — recebe os eventos do quiz e conta visitantes DISTINTOS.
// Usa o armazenamento nativo da Vercel (Vercel KV / Upstash Redis) via REST.
// Não guarda nada pessoal: só adiciona o lead_id a conjuntos e conta o tamanho.
module.exports = async (req, res) => {
  if (req.method !== "POST") { res.status(405).json({ ok: false }); return; }

  const url   = process.env.KV_REST_API_URL   || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  // Se o KV ainda não foi conectado, não quebra o quiz — só ignora.
  if (!url || !token) { res.status(200).json({ ok: false, reason: "kv_not_configured" }); return; }

  try {
    let b = req.body;
    if (typeof b === "string") { try { b = JSON.parse(b); } catch { b = {}; } }
    if (!b || typeof b !== "object") b = {};

    const funnel = String(b.p_funnel || "unknown").toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 40) || "unknown";
    const lead   = String(b.p_lead_id || "").slice(0, 80);
    const type   = b.p_type;
    if (!lead) { res.status(200).json({ ok: true }); return; }

    const cmds = [];
    const sadd = (key) => cmds.push(["SADD", key, lead]);

    if (type === "session_start") {
      sadd(`bdm:${funnel}:starts`);
    } else if (type === "step_view" && b.p_step_index != null) {
      const idx = parseInt(b.p_step_index, 10);
      if (!Number.isNaN(idx) && idx >= 0 && idx < 100) {
        sadd(`bdm:${funnel}:step:${idx}`);
        const name = String(b.p_step_name || "").slice(0, 80);
        if (name) cmds.push(["SET", `bdm:${funnel}:sn:${idx}`, name]);
      }
    } else if (type === "checkout_click") {
      sadd(`bdm:${funnel}:checkout`);
    }

    if (cmds.length) {
      await fetch(`${url}/pipeline`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(cmds)
      });
    }
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(200).json({ ok: false });
  }
};
