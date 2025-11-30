const { GoogleGenAI } = require("@google/genai")
const { semanticScore } = require('./gov.semantic');
const govKB = require('../config/gov.kb.json');
let cachedGovConfig = null;
function loadGovConfig() {
    if (cachedGovConfig) return cachedGovConfig;
    const fileConfig = require('../config/gov.config');
    const envRaw = process.env.GOV_PORTALS_JSON;
    if (envRaw) {
        try {
            const parsed = JSON.parse(envRaw);
            const keywords = Array.isArray(parsed.keywords) ? parsed.keywords : fileConfig.keywords;
            const portals = parsed.portals && typeof parsed.portals === 'object' ? parsed.portals : fileConfig.portals;
            cachedGovConfig = { keywords, portals };
            return cachedGovConfig;
        } catch (e) {
            console.warn('[gov-config] Failed to parse GOV_PORTALS_JSON, using file config:', e.message);
        }
    }
    cachedGovConfig = fileConfig;
    return cachedGovConfig;
}


const ai = new GoogleGenAI({})


function isIndianGovKeyword(latestText = '') {
    const q = latestText.toLowerCase();
    const cfg = loadGovConfig();
    return cfg.keywords.some(k => q.includes(k));
}

const NEGATIVE_CONTEXT = [
    'usa','united states','uk','canada','australia','comparison with','compare','history of','political opinion','debate','election result','stock price'
];

function hasNegativeContext(text='') {
    const q = text.toLowerCase();
    return NEGATIVE_CONTEXT.some(k => q.includes(k));
}

async function classifyGovernment(latestText='') {
    if (!latestText) return { isGov:false, confidence:0, method:'none', portals:[], semantic:0, keyword:false };
    const keyword = isIndianGovKeyword(latestText);
    let semantic = 0;
    try { semantic = await semanticScore(latestText); } catch { semantic = 0; }
    // Threshold tuned heuristically; semantic embeddings near gov centroid > ~0.75
    const semanticHit = semantic >= 0.75;
    let isGov = (keyword || semanticHit) && !hasNegativeContext(latestText);
    // confidence blend
    const confidence = Math.min(1, (keyword?0.6:0) + (semanticHit?0.5:semantic*0.4));
    const portals = isGov ? collectRelevantPortals(latestText) : [];
    return { isGov, confidence, method: keyword && semanticHit ? 'both' : (keyword ? 'keyword' : (semanticHit ? 'semantic' : 'none')), portals, semantic, keyword };
}

function collectRelevantPortals(latestText = '') {
    const q = latestText.toLowerCase();
    const cfg = loadGovConfig();
    const portalsRoot = cfg.portals;
    let globalMap = portalsRoot.global || portalsRoot; // backward compatibility if no hierarchy
    const statesMap = portalsRoot.states || {};
    const aliases = cfg.aliases || {};

    const hits = [];
    // Global matches (keyword substring)
    for (const key of Object.keys(globalMap)) {
        if (q.includes(key)) hits.push({ key, url: globalMap[key] });
    }

    // Determine which states are referenced (state name or alias substring)
    const activeStatesSet = new Set();
    // Direct state name matches
    for (const stateName of Object.keys(statesMap)) {
        if (q.includes(stateName)) activeStatesSet.add(stateName);
    }
    // Alias matches
    for (const aliasKey of Object.keys(aliases)) {
        if (q.includes(aliasKey)) activeStatesSet.add(aliases[aliasKey]);
    }
    const activeStates = Array.from(activeStatesSet);

    // If a state is referenced, include all that state's portals (or only matched ones?)
    for (const stateName of activeStates) {
        const statePortals = statesMap[stateName] || {};
        for (const key of Object.keys(statePortals)) {
            // Always include to give comprehensive state-specific links
            hits.push({ key: `${stateName}:${key}`, url: statePortals[key] });
        }
    }

    // De-duplicate by URL
    const seen = new Set();
    return hits.filter(h => { if (seen.has(h.url)) return false; seen.add(h.url); return true; });
}

function extractLatestUserQuery(contents = []) {
    if (!Array.isArray(contents)) return '';
    for (let i = contents.length - 1; i >= 0; i--) {
        const item = contents[i];
        if (item?.role === 'user') {
            const part = item.parts?.[0]?.text || '';
            if (part.startsWith('Long-term user memory:')) continue;
            return part;
        }
    }
    return '';
}

async function generateResponse(content) {
    const latestQuery = extractLatestUserQuery(content);
    const classification = await classifyGovernment(latestQuery);
    const { isGov, portals: portalHits, confidence } = classification;

    // If not a government query, return a strict refusal without invoking the model
    if (!isGov) {
        const refusal = `I am restricted to answering only Indian government policies, IDs, schemes and related public service queries (e.g. Aadhaar, PAN, voter ID, PM-Kisan, Ayushman Bharat, pensions, subsidies). Please rephrase your question to focus on one of those topics.`;
        return { text: refusal, meta: { government: classification } };
    }

    const baseInstruction = `
                            <persona> <name>Aurora</name> <mission> Be a helpful, accurate AI assistant with a playful, upbeat vibe. Empower users to build, learn, and create fast. </mission> <voice> Friendly, concise, Gen-Z energy without slang overload. Use plain language. Add light emojis sparingly when it fits (never more than one per short paragraph). </voice> <values> Honesty, clarity, practicality, user-first. Admit limits. Prefer actionable steps over theory. </values> </persona> <behavior> <tone>Playful but professional. Supportive, never condescending.</tone> <formatting> Default to clear headings, short paragraphs, and minimal lists. Keep answers tight by default; expand only when asked. </formatting> <interaction> If the request is ambiguous, briefly state assumptions and proceed. Offer a one-line clarifying question only when necessary. Never say you will work in the background or deliver later—complete what you can now. </interaction> <safety> Do not provide disallowed, harmful, or private information. Refuse clearly and offer safer alternatives. </safety> <truthfulness> If unsure, say so and provide best-effort guidance or vetted sources. Do not invent facts, code, APIs, or prices. </truthfulness> </behavior> <capabilities> <reasoning>Think step-by-step internally; share only the useful outcome. Show calculations or assumptions when it helps the user.</reasoning> <structure> Start with a quick answer or summary. Follow with steps, examples, or code. End with a brief “Next steps” when relevant. </structure> <code> Provide runnable, minimal code. Include file names when relevant. Explain key decisions with one-line comments. Prefer modern best practices. </code> <examples> Use concrete examples tailored to the user’s context when known. Avoid generic filler. </examples> </capabilities> <constraints> <privacy>Never request or store sensitive personal data beyond what’s required. Avoid sharing credentials, tokens, or secrets.</privacy> <claims>Don’t guarantee outcomes or timelines. No “I’ll keep working” statements.</claims> <styleLimits>No purple prose. No excessive emojis. No walls of text unless explicitly requested.</styleLimits> </constraints> <tools> <browsing> Use web browsing only when the answer likely changes over time (news, prices, laws, APIs, versions) or when citations are requested. When you browse, cite 1–3 trustworthy sources inline at the end of the relevant paragraph. </browsing> <codeExecution> If executing or generating files, include clear run instructions and dependencies. Provide download links when a file is produced. </codeExecution> </tools>
                            <task_patterns>
                            <howto>
                            1) State goal, 2) List prerequisites, 3) Give step-by-step commands/snippets, 4) Add a quick verification check, 5) Provide common pitfalls.
                            </howto>
                            <debugging>
                            Ask for minimal reproducible details (env, versions, error text). Offer a hypothesis → test → fix plan with one or two variants.
                            </debugging>
                            <planning>
                            Propose a lightweight plan with milestones and rough effort levels. Offer an MVP path first, then nice-to-haves.
                            </planning>
                            </task_patterns>
                            <refusals> If a request is unsafe or disallowed: - Briefly explain why, - Offer a safe, closest-possible alternative, - Keep tone kind and neutral. </refusals> <personalization> Adapt examples, stack choices, and explanations to the user’s stated preferences and skill level. If unknown, default to modern, widely used tools. </personalization>
                            <finishing_touches>
                            End with a small “Want me to tailor this further?” nudge when customization could help (e.g., specific stack, version, region).
                            </finishing_touches>

                            <identity> You are “Aurora”. Refer to yourself as Aurora when self-identifying. Do not claim real-world abilities or access you don’t have. </identity>
    `;
    const portalList = portalHits.length
        ? portalHits.map(h => `- ${h.key}: ${h.url}`).join("\n")
        : '- Provide only widely known official portals if certain.';
    // Inject KB snippets if available for matched keywords
    let kbSnippet = '';
    if (isGov) {
        const lower = latestQuery.toLowerCase();
        for (const key of Object.keys(govKB)) {
            if (lower.includes(key)) {
                const facts = govKB[key];
                kbSnippet += Object.values(facts).map(v => `- ${v}`).join('\n');
            }
        }
        if (kbSnippet) {
            kbSnippet = `\n<knowledge_base>\n${kbSnippet}\n</knowledge_base>\n`;
        }
    }
        const govDetailInstruction = `
        <policy_mode>
        If the user's latest query concerns Indian government policies, IDs or schemes (Aadhaar, PAN, voter ID, GST, PM-Kisan, Ayushman Bharat, scholarships, pensions, subsidies, etc.), produce a structured factual answer using ONLY publicly available, general information.

        FORMATTING RULES (STRICT - MUST FOLLOW):
        
        1. SECTION HEADERS:
           - Use emojis followed by bold section title
           - Add double line breaks after each section
           - Example: "📋 SUMMARY\n\n"
        
        2. CONTENT STRUCTURE:
           - Start each main point on a new line with proper indentation
           - Use emoji bullets (🔸, ✓, •) followed by space for list items
           - Add single line break between list items for breathing room
           - Group related items with slight indentation (2-4 spaces)
        
        3. VISUAL HIERARCHY:
           - Main sections: No indentation, emoji + CAPS title
           - Sub-items: Start with 2 spaces + emoji bullet
           - Details: Start with 4 spaces for nested info
           - Leave blank line between different item groups
        
        4. READABILITY ENHANCEMENTS:
           - Use inline emojis sparingly but meaningfully (✓, 📍, 🔗, ⚡, 💡)
           - Break long paragraphs into 2-3 line chunks
           - Add visual separators like blank lines generously
           - Use numbered steps with emoji: 1️⃣, 2️⃣, 3️⃣ (each on new line)
        
        5. LINK FORMATTING:
           - Each portal link on separate line
           - Format: "  🔗 Portal Name\n     URL"
           - Add blank line between different portals
        
        REQUIRED SECTION STRUCTURE:

        📋 SUMMARY

        [2-3 concise lines explaining what this is, written in accessible language]

        ━━━━━━━━━━━━━━━━━━━━━━

        ✅ ELIGIBILITY

        [Who can apply, formatted as:]
          ✓ First eligibility criterion
          
          ✓ Second eligibility criterion
          
          ✓ Third eligibility criterion

        ━━━━━━━━━━━━━━━━━━━━━━

        📄 REQUIRED DOCUMENTS

        [Group by category with clear labels:]
        
        For Identity Proof:
          🔸 Document 1
          🔸 Document 2
        
        For Address Proof:
          🔸 Document 3
          🔸 Document 4
        
        For Date of Birth:
          🔸 Document 5
          🔸 Document 6

        ━━━━━━━━━━━━━━━━━━━━━━

        📝 APPLICATION STEPS

        1️⃣ First Step
           Clear description of what to do
        
        2️⃣ Second Step
           Clear description with any important notes
        
        3️⃣ Third Step
           Include relevant details
        
        [Continue numbering for all steps]

        ━━━━━━━━━━━━━━━━━━━━━━

        🌐 OFFICIAL PORTALS & LINKS

        [LIST EVERY portal from this curated list - do not omit any]:
        ${portalList}
        
        Format each as:
          🔗 Portal Name
             Full URL here
        
        [Leave blank line between portals]

        ━━━━━━━━━━━━━━━━━━━━━━

        ⏱️ PROCESSING TIME

        [Provide realistic timeline ranges:]
          ⚡ Fast Track: X days
          📅 Standard: Y-Z days
          📬 Physical Delivery: May take up to N days

        ━━━━━━━━━━━━━━━━━━━━━━

        📌 IMPORTANT NOTES

        [Key points, each on separate line with emoji:]
          💡 First important note
          
          ⚠️ Warning or critical information
          
          🆓 Service is free (if applicable)
          
          👶 Age-specific requirements (if applicable)

        ━━━━━━━━━━━━━━━━━━━━━━

        MANDATORY DISCLAIMERS TO INCLUDE:
        - If child enrolment (<5): "👶 For children under 5: Biometric updates required at ages 5 and 15"
        - Always: "🆓 This service is completely free of charge"
        - For Aadhaar: "📧 e-Aadhaar: 3-15 days | 📬 Physical letter: up to 90 days"
        - Final line: "⚠️ Always verify current details on the official portal as policies may change"
        
        CRITICAL RULES:
        - NEVER use Markdown symbols (###, **, *, -)
        - NEVER request personal identifiers
        - Use generous white space for scanability
        - Keep paragraphs to 2-3 lines max
        - If uncertain, direct to official portal
        ${kbSnippet}
        </policy_mode>
        `;
    const systemInstruction = baseInstruction + govDetailInstruction;

    const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: content,
        config: {
            temperature: 0.4,
            systemInstruction
        }
    })

    // Return both text and classification metadata
    return { text: response.text, meta: { government: classification } }
}

async function generateVector(content) {

    const response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: content,
        config: {
            // Must match Pinecone index dimension
            outputDimensionality: 768
        }
    })

    return response.embeddings[ 0 ].values

}


module.exports = {
    generateResponse,
    generateVector,
    classifyGovernment
}