// Import the Pinecone library
const { Pinecone } = require('@pinecone-database/pinecone')

// Initialize a Pinecone client with your API key
const pc = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });

const cohortChatGptIndex = pc.Index('cohort-chat-gpt');

async function createMemory({ vectors, metadata = {}, messageId }) {
    // Pinecone expects string ids and JSON-serializable metadata (strings/numbers/booleans)
    const safeMeta = { ...metadata };
    if (safeMeta.user != null) safeMeta.user = String(safeMeta.user);
    if (safeMeta.chat != null) safeMeta.chat = String(safeMeta.chat);
    if (safeMeta.messageId != null) safeMeta.messageId = String(safeMeta.messageId);

    const id = String(messageId);

    try {
        await cohortChatGptIndex.upsert([ {
            id,
            values: vectors,
            metadata: safeMeta
        } ]);
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

    try {
        const data = await cohortChatGptIndex.query({
            vector: queryVector,
            topK: limit,
            filter,
            includeMetadata: true
        });
        return data.matches || [];
    } catch (e) {
        console.error('Pinecone query error:', e?.message || e);
        return [];
    }
}

async function deleteMemoriesByMessageIds(ids = []) {
    const stringIds = (ids || []).map(id => String(id));
    if (!stringIds.length) return;
    // Some SDK versions use deleteMany, others use delete
    const chunks = [];
    const size = 500;
    for (let i = 0; i < stringIds.length; i += size) chunks.push(stringIds.slice(i, i + size));
    for (const batch of chunks) {
        let deleted = false;
        try {
            if (typeof cohortChatGptIndex.deleteMany === 'function') {
                await cohortChatGptIndex.deleteMany({ ids: batch });
                deleted = true;
            }
        } catch (e) {
            console.warn('deleteMany(ids) not available or failed, trying delete()', e?.message || e);
        }
        if (!deleted) {
            try {
                if (typeof cohortChatGptIndex.delete === 'function') {
                    await cohortChatGptIndex.delete({ ids: batch });
                    deleted = true;
                }
            } catch (e) {
                console.error('Pinecone delete(ids) error:', e?.message || e);
            }
        }
    }
}

async function deleteMemoriesByFilter(filter = {}) {
    const safeFilter = { ...filter };
    if (safeFilter.user != null) safeFilter.user = String(safeFilter.user);
    if (safeFilter.chat != null) safeFilter.chat = String(safeFilter.chat);
    // Try both deleteMany and delete to be SDK-compatible
    try {
        if (typeof cohortChatGptIndex.deleteMany === 'function') {
            await cohortChatGptIndex.deleteMany({ filter: safeFilter });
            return;
        }
    } catch (e) {
        console.warn('deleteMany(filter) not available or failed, trying delete()', e?.message || e);
    }
    try {
        if (typeof cohortChatGptIndex.delete === 'function') {
            await cohortChatGptIndex.delete({ filter: safeFilter });
        }
    } catch (e) {
        console.error('Pinecone delete(filter) error:', e?.message || e);
    }
}

module.exports = { createMemory, queryMemory, deleteMemoriesByMessageIds, deleteMemoriesByFilter }