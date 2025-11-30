const express = require('express');
const router = express.Router();
const { classifyGovernment } = require('../services/ai.service');

// Lightweight loader reuses existing config and env override logic
function loadGovConfig() {
  const fileConfig = require('../config/gov.config');
  const envRaw = process.env.GOV_PORTALS_JSON;
  if (envRaw) {
    try {
      const parsed = JSON.parse(envRaw);
      const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : fileConfig.keywords;
      const portals = parsed.portals && typeof parsed.portals === 'object' ? parsed.portals : fileConfig.portals;
      const aliases = parsed.aliases && typeof parsed.aliases === 'object' ? parsed.aliases : fileConfig.aliases;
      return { keywords, portals, aliases };
    } catch (e) {
      console.warn('[gov-config-route] Failed to parse GOV_PORTALS_JSON, using file config:', e.message);
    }
  }
  return fileConfig;
}

function collectRelevantPortals(q, cfg) {
  if (!q) return [];
  const text = q.toLowerCase();
  const portalsRoot = cfg.portals;
  const globalMap = portalsRoot.global || portalsRoot;
  const statesMap = portalsRoot.states || {};
  const aliases = cfg.aliases || {};
  const hits = [];
  for (const key of Object.keys(globalMap)) {
    if (text.includes(key)) hits.push({ key, url: globalMap[key], scope: 'global' });
  }
  const activeStatesSet = new Set();
  for (const stateName of Object.keys(statesMap)) {
    if (text.includes(stateName)) activeStatesSet.add(stateName);
  }
  for (const aliasKey of Object.keys(aliases)) {
    if (text.includes(aliasKey)) activeStatesSet.add(aliases[aliasKey]);
  }
  for (const stateName of Array.from(activeStatesSet)) {
    const statePortals = statesMap[stateName] || {};
    for (const key of Object.keys(statePortals)) {
      hits.push({ key: `${stateName}:${key}`, url: statePortals[key], scope: stateName });
    }
  }
  const seen = new Set();
  return hits.filter(h => { if (seen.has(h.url)) return false; seen.add(h.url); return true; });
}

// GET /api/gov/config?q=optional+query
router.get('/config', (req, res) => {
  const cfg = loadGovConfig();
  const q = req.query.q || '';
  const matchedPortals = collectRelevantPortals(q, cfg);
  res.json({
    keywords: cfg.keywords,
    aliases: cfg.aliases || {},
    portals: cfg.portals,
    query: q,
    matchedPortals
  });
});

module.exports = router;
// GET /api/gov/classify?q=...
router.get('/classify', async (req, res) => {
  const q = req.query.q || '';
  try {
    const result = await classifyGovernment(q);
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: 'classification_failed', message: e.message });
  }
});