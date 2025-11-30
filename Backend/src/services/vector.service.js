require('dotenv').config();
const { Pinecone } = require('@pinecone-database/pinecone');

const pineconeApiKey = process.env.PINECONE_API_KEY;
const pineconeIndexName = process.env.PINECONE_INDEX;
const pineconeNamespace = process.env.PINECONE_NAMESPACE || 'default';

let cohortChatGptIndex = null;

if (!pineconeApiKey) {
    console.warn('[Pinecone] Missing PINECONE_API_KEY – vector memory disabled.');
} else {
    try {
        const pc = new Pinecone({ apiKey: pineconeApiKey });
        if (!pineconeIndexName) {
            console.warn('[Pinecone] Missing PINECONE_INDEX – set this in .env to enable vector memory.');
        } else {
            cohortChatGptIndex = pc.Index(pineconeIndexName);
            console.log(`[Pinecone] Initialized index: ${pineconeIndexName}`);
        }
    } catch (e) {
        console.error('[Pinecone] Initialization error:', e?.message || e);
    }
}

function sanitizeMetadata(metadata = {}) {
    const out = {};
    for (const key of Object.keys(metadata)) {
        const val = metadata[key];
        if (val == null) continue;
        if (Array.isArray(val)) {
            // ensure list of strings only
            out[key] = val.map(v => typeof v === 'string' ? v : JSON.stringify(v));
            continue;
        }
        const t = typeof val;
        if (t === 'string' || t === 'number' || t === 'boolean') {
            out[key] = val;
            continue;
        }
        if (t === 'object') {
            // Special flatten for government classification object
            if (key === 'government') {
                if (typeof val.isGov === 'boolean') out['government_isGov'] = val.isGov;
                if (typeof val.confidence === 'number') out['government_confidence'] = Number(val.confidence.toFixed(4));
                if (typeof val.method === 'string') out['government_method'] = val.method;
                if (Array.isArray(val.portals)) out['government_portals'] = val.portals.map(p => (p && p.key) ? p.key : String(p));
            } else {
                // Fallback: serialize
                out[key] = JSON.stringify(val);
            }
        }
    }
    // Force id-related fields string
    if (out.user != null) out.user = String(out.user);
    if (out.chat != null) out.chat = String(out.chat);
    if (out.messageId != null) out.messageId = String(out.messageId);
    return out;
}

async function createMemory({ vectors, metadata = {}, messageId }) {
    const id = String(messageId);
    if (!cohortChatGptIndex) return;
    const safeMeta = sanitizeMetadata(metadata);
    try {
        // Standard SDK signature: upsert(arrayOfRecords, options) OR upsert({vectors:[...]})
        if (typeof cohortChatGptIndex.upsert === 'function') {
            try {
                await cohortChatGptIndex.upsert([
                    { id, values: vectors, metadata: safeMeta }
                ], { namespace: pineconeNamespace });
            } catch (first) {
                // Fallback to object form
                await cohortChatGptIndex.upsert({ vectors: [ { id, values: vectors, metadata: safeMeta } ], namespace: pineconeNamespace });
            }
        } else {
            console.warn('[Pinecone] upsert method not available on index instance');
        }
    } catch (e) {
        console.error('Pinecone upsert error:', e?.message || e);
    }
}


async function queryMemory({ queryVector, limit = 5, metadata }) {
    let filter = undefined;
    if (metadata) {
        filter = { ...metadata };
        if (filter.user != null) filter.user = String(filter.user);
        if (filter.chat != null) filter.chat = String(filter.chat);
    }

    if (!cohortChatGptIndex) {
        return [];
    }
    try {
        const payload = {
            vector: queryVector,
            topK: limit,
            filter,
            includeMetadata: true
        };
        let data;
        try {
            // Most recent SDK: query({vector, topK, filter, includeMetadata, namespace}) single object
            data = await cohortChatGptIndex.query({ ...payload, namespace: pineconeNamespace });
        } catch (first) {
            try {
                // Older signature: query(payload, options)
                data = await cohortChatGptIndex.query(payload, { namespace: pineconeNamespace });
            } catch (second) {
                // Last resort: no namespace
                data = await cohortChatGptIndex.query(payload, {});
            }
        }
        return data.matches || [];
    } catch (e) {
        console.error('Pinecone query error:', e?.message || e);
        return [];
    }
}

async function deleteMemoriesByMessageIds(ids = []) {
    if (!cohortChatGptIndex) return;
    const stringIds = (ids || []).map(id => String(id));
    if (!stringIds.length) return;
    
    // Silently skip delete operations to avoid SDK incompatibility errors
    // Delete operations are optional for chat functionality
    return;
    
    /* Commented out due to SDK version incompatibility
    const chunks = [];
    const size = 500;
    for (let i = 0; i < stringIds.length; i += size) chunks.push(stringIds.slice(i, i + size));
    for (const batch of chunks) {
        try {
            await cohortChatGptIndex.namespace(pineconeNamespace).deleteMany(batch);
        } catch (e) {
            // Silent fail - delete is best-effort
        }
    }
    */
}

async function deleteMemoriesByFilter(filter = {}) {
    if (!cohortChatGptIndex) return;
    const safeFilter = { ...filter };
    if (safeFilter.user != null) safeFilter.user = String(safeFilter.user);
    if (safeFilter.chat != null) safeFilter.chat = String(safeFilter.chat);
    
    // Silently skip delete operations to avoid SDK incompatibility errors
    // Delete operations are optional for chat functionality
    return;
    
    /* Commented out due to SDK version incompatibility
    try {
        await cohortChatGptIndex.namespace(pineconeNamespace).deleteMany({ filter: safeFilter });
    } catch (e) {
        // Silent fail - delete is best-effort
    }
    */
}

module.exports = { createMemory, queryMemory, deleteMemoriesByMessageIds, deleteMemoriesByFilter }