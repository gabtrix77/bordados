# Migração — Bordados da Mah (Ticto → Cakto)

Teu funil original, migrado. Mesmo design, copy, imagens e estrutura — só trocamos
o encanamento. Nada foi reescrito.

## ✅ O que foi trocado

**Checkouts (Ticto → Cakto), no bundle:**

| Antes (Ticto) | Agora (Cakto) | Oferta |
|---|---|---|
| O77EF862E | `6c5u6mr` | Principal R$29,90 |
| O48C02CB4 | `32ddv5c_883936` | Básico R$17 (decoy) |
| ODA8F3FB0 | `9tox3x7_889775` | Upsell +1.800 R$37 |
| O099DEF50 | `3a5q2v4` | Downsell Top 5 R$19 |
| OC1597A5F | `382kp2w_949204` | Fornecedores R$27 |
| OC06E324E | `g5ddesx` | Clube Fornecedores R$47 |
| O9B3290C3 | `5avavwy` | Front R$47 |
| OB586AA3B | `3brnuf3` | Pack R$97 |

**Tracking (no index.html):**
- Meta Pixel: `1697671081405783` → `1581890469988860`
- UTMify Meta: `69e2e4e5b56bf6b9622dd0e6` → `6a4266dfdb0e4a5cc9c59c4b`
- **TikTok REMOVIDO** (pixel + UTMify TikTok + lógica condicional). Meta dispara em todas as rotas.
- **Ticto Echo removido.**

## 🚀 Deploy (Vercel)

Sobe a pasta inteira. Estrutura:
```
index.html
/assets   (index-CZDm5AAx.js, react-vendor-DbiWhUg4.js, index-DdAfevSH.css)
/images   (42 imagens)
vercel.json   (rewrite SPA — já incluso)
```
No Vercel: "Add New > Project" → arrasta a pasta ou sobe via Git. Sem build,
é estático. O `vercel.json` garante que /quizz, /upsell etc. carreguem o app.

## 🔁 Redirects pós-compra na Cakto (configure em cada produto)

A régua é upsell → downsell → fornecedores → obrigado. Os "não" já avançam no código.
Configure o redirect pós-pagamento de cada produto Cakto:

| Comprou | Redireciona para |
|---|---|
| Upsell R$37 (`9tox3x7`) | a página de downsell do funil |
| Downsell R$19 (`3a5q2v4`) | a página de fornecedores |
| Fornecedores R$27/R$47 | a página de obrigado/entrega |

## ⚠️ 2 ressalvas (não travam o funil)

1. **One-click:** o one-click era da Ticto (`midas.ticto.app`) e não funciona na Cakto.
   Os botões de upsell agora **redirecionam** pro checkout Cakto (compra normal, não 1-clique).
   Pra ter 1-clique de verdade, usar o recurso nativo de one-click da Cakto.

2. **Rota /admin:** o chunk `Admin-Dvm9gUc7.js` não veio no build enviado. As rotas do
   funil funcionam 100%; só o painel `/admin` não abre (não é usado pelo cliente).

## 🧪 Antes de subir tráfego
- Abre no celular e percorre o funil inteiro.
- Confirma com o Meta Pixel Helper que dispara `PageView` e `InitiateCheckout`.
- Confirma que a UTM passa pro checkout Cakto (UTMify).
- Confirma que a Cakto dispara o `Purchase`/`CompletePayment` via CAPI.
