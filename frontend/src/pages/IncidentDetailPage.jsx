import React, { useMemo, useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import { getUser } from '../services/api';

// --- Default Schema (editable in the Schema tab) ---
const DEFAULT_SCHEMA = {
  name: "Retail Support – Conversational Policy Schema",
  version: "1.0",
  thresholds: { highConfidence: 0.8, interjectMinConfidence: 0.6 },
  supportProtocols: [
    "Refund window: 30 days from delivery.",
    "If defect reported after refund window, offer: (a) free repair or replacement if covered, (b) 30% store credit, or (c) escalate to human if order value > $100.",
    "Never disclose or confirm full payment card numbers. Only last4 may be referenced if already presented by the user.",
    "Authentication is required before account changes (cancellations, address changes).",
    "Escalate politely if the customer threatens chargeback, legal action, or claims injury.",
  ],
  rules: [
    {
      id: "R-001",
      title: "Refund past window must not be auto-approved",
      description:
        "If the user requests a full refund beyond 30 days, the bot must not process it automatically; offer repair/credit or escalate.",
      severity: 5,
      match: { userIncludes: ["refund", "return"], daysSinceOrderOver: 30 },
      action: "interject",
      onViolationGuidance:
        "Explain refund window, offer repair or 30% store credit, or escalate to a human specialist for exceptions.",
    },
    {
      id: "R-002",
      title: "Avoid promising outcomes outside policy",
      description:
        "Do not promise a full refund or replacement when policy conditions are not met.",
      severity: 4,
      match: { botIncludes: ["processed a full refund", "absolutely! i've processed"] },
      action: "modify",
      onViolationGuidance:
        "Replace promises with compliant alternatives and set expectations per policy.",
    },
    {
      id: "R-003",
      title: "No sensitive data collection",
      description:
        "Do not ask for or reveal full card numbers, SSNs, or passwords. Card last4 is permitted only if user provides it first.",
      severity: 4,
      match: { botIncludes: ["full card number", "security number", "password"] },
      action: "stop",
      onViolationGuidance:
        "Mask or avoid sensitive data. Ask for non-sensitive identifiers or use verified account channel.",
    },
    {
      id: "R-004",
      title: "Escalate high-value exceptions",
      description:
        "If order value > $100 AND outside standard policy, escalate to a human.",
      severity: 3,
      match: { userIncludes: ["$", "dollars", "order"] },
      action: "interject",
      onViolationGuidance:
        "Offer to bring a specialist in for out-of-policy high-value cases.",
    },
  ],
};

// --- Simple heuristic extractors for the demo ---
function detectDaysSinceMention(text) {
  const m = text.match(/(\d{1,3})\s*day/gi);
  if (!m) return null;
  const n = parseInt(m[0].match(/\d{1,3}/)[0], 10);
  return isNaN(n) ? null : n;
}

function detectOrderValue(text) {
  const m = text.match(/\$(\d{1,6})(?:\.(\d{1,2}))?/);
  if (!m) return null;
  return parseFloat(m[1] + (m[2] ? "." + m[2] : ""));
}

// --- Core Audit Logic ---
function audit(conversation, schema) {
  const user = conversation.findLast((m) => m.role === "user");
  const bot = conversation.findLast((m) => m.role === "bot");
  if (!user || !bot) {
    return {
      outcome: "allow",
      confidence: 0.0,
      triggeredRules: [],
      rationale: ["Insufficient context to audit (need user + bot)."],
    };
  }

  const userText = user.text.toLowerCase();
  const botText = bot.text.toLowerCase();
  const daysMentioned = detectDaysSinceMention(user.text) ?? 0;
  const orderValue = detectOrderValue(user.text) ?? 0;

  const triggered = [];

  for (const rule of schema.rules) {
    let hit = false;
    const match = rule.match || {};
    if (match.userIncludes) {
      hit = hit || match.userIncludes.some((kw) => userText.includes(kw.toLowerCase()));
    }
    if (match.botIncludes) {
      hit = hit || match.botIncludes.some((kw) => botText.includes(kw.toLowerCase()));
    }
    if (typeof match.daysSinceOrderOver === "number") {
      if (daysMentioned > match.daysSinceOrderOver) hit = true;
    }
    if (hit) triggered.push(rule);
  }

  const maxSeverity = schema.rules.reduce((a, r) => a + r.severity, 0) || 1;
  const sevSum = triggered.reduce((a, r) => a + r.severity, 0);
  let confidence = Math.min(1, sevSum / maxSeverity + (orderValue > 100 ? 0.1 : 0));
  confidence = Math.max(0, Math.min(confidence, 1));

  let outcome = "allow";
  const actions = new Set(triggered.map((r) => r.action));

  if (triggered.length === 0) {
    outcome = "allow";
  } else if (actions.has("stop")) {
    outcome = "stop";
  } else if (actions.has("modify")) {
    outcome = "interject-modify";
  } else {
    outcome = "interject-ask-user";
  }

  let suggestedReply;
  if (outcome !== "allow") {
    const guidance = triggered
      .sort((a, b) => b.severity - a.severity)
      .map((r) => `• (${r.id}) ${r.onViolationGuidance}`)
      .join("\n");

    const refundWindow = 30;
    const base =
      `Thanks for flagging this. I can't process a full refund because it's beyond our ${refundWindow}-day refund window. ` +
      `I can offer a free repair/replacement if covered or a 30% store credit. If you prefer, I can bring in a human specialist to review exceptions.`;

    suggestedReply = `${base}\n\nGuidance applied:\n${guidance}`;
  }

  const rationale = triggered.map((r) =>
    `${r.id}: ${r.title} (severity ${r.severity})`
  );

  return { outcome, confidence, triggeredRules: triggered, rationale, suggestedReply };
}

// --- UI Helpers ---
const Badge = ({ children, tone = "gray" }) => {
  const tones = {
    gray: "bg-gray-100 text-gray-800",
    red: "bg-red-100 text-red-800",
    green: "bg-green-100 text-green-800",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>{children}</span>
  );
};

const Card = ({ children, className = "" }) => (
  <div className={`rounded-2xl shadow-sm border border-gray-200 bg-white ${className}`}>{children}</div>
);

function ConfidenceMeter({ value }) {
  const pct = Math.round(value * 100);
  const ring = 282.743; // 2 * PI * 45 for a 90 radius circle in SVG (approx)
  const dash = (pct / 100) * ring;
  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="120" height="120" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r="45" stroke="#e5e7eb" strokeWidth="12" fill="none" />
        <circle
          cx="60"
          cy="60"
          r="45"
          stroke="#111827"
          strokeWidth="12"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${ring - dash}`}
          transform="rotate(-90 60 60)"
        />
        <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" className="text-xl" style={{ fontFamily: 'ui-sans-serif, system-ui' }}>
          {pct}%
        </text>
      </svg>
      <div className="text-sm text-gray-600">Auditor confidence</div>
    </div>
  );
}

function Pill({ label }) {
  return <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium">{label}</span>;
}

// --- Main Component ---
export default function IncidentDetailPage() {
  const { userId, incidentId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userName, setUserName] = useState('');
  const [initialConversation, setInitialConversation] = useState([]);

  const [activeTab, setActiveTab] = useState("conversation");
  const [schemaText, setSchemaText] = useState(JSON.stringify(DEFAULT_SCHEMA, null, 2));
  const [schemaError, setSchemaError] = useState(null);

  useEffect(() => {
    loadUserData();
  }, [userId]);

  const loadUserData = async () => {
    try {
      const response = await getUser(userId);
      const user = response.data.user;
      setUserName(user.email);
      setInitialConversation(user.conversationHistory || []);
      setError('');
    } catch (err) {
      setError('Failed to load user data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const parsedSchema = useMemo(() => {
    try {
      const obj = JSON.parse(schemaText);
      setSchemaError(null);
      return obj;
    } catch (e) {
      setSchemaError(e.message);
      return null;
    }
  }, [schemaText]);

  const [conversation, setConversation] = useState([]);

  useEffect(() => {
    setConversation(initialConversation);
  }, [initialConversation]);

  const decision = useMemo(() => {
    if (!parsedSchema) return { outcome: "allow", confidence: 0, triggeredRules: [], rationale: ["Invalid schema"] };
    return audit(conversation, parsedSchema);
  }, [conversation, parsedSchema]);

  // Controls for applying auditor suggestion
  const applySuggestion = () => {
    if (!decision.suggestedReply) return;

    // Find the last bot message index
    const lastBotIndex = conversation.map((m, i) => m.role === 'bot' ? i : -1).filter(i => i !== -1).pop();

    const newMsgs = [
      ...conversation.slice(0, lastBotIndex + 1),
      {
        id: `auditor-${Date.now()}`,
        role: "auditor",
        text: "AI Auditor interjected and modified the bot response.",
        meta: { decision },
      },
      {
        id: `bot-modified-${Date.now()}`,
        role: "bot",
        text: decision.suggestedReply,
        meta: { originalBotText: conversation[lastBotIndex]?.text, decision },
      },
    ];
    setConversation(newMsgs);
  };

  const allowOriginal = () => {
    const newMsgs = [
      ...conversation,
      {
        id: `auditor-override-${Date.now()}`,
        role: "auditor",
        text: "AI Auditor was overridden by user. Original bot response sent.",
        meta: { decision },
      },
    ];
    setConversation(newMsgs);
  };

  const requestHuman = () => {
    const newMsgs = [
      ...conversation,
      {
        id: `auditor-human-${Date.now()}`,
        role: "auditor",
        text: "AI Auditor stopped the bot and requested human interjection.",
        meta: { decision },
      },
    ];
    setConversation(newMsgs);
  };

  const resetDemo = () => setConversation(initialConversation);

  const handleBack = () => {
    navigate(`/audit/${userId}`);
  };

  // Renderers
  const renderMessage = (m) => {
    const isUser = m.role === "user";
    const isBot = m.role === "bot";
    const isAuditor = m.role === "auditor";

    return (
      <div key={m.id} className="flex gap-3 items-start">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-semibold"
             style={{ background: isUser ? '#0ea5e9' : isBot ? '#22c55e' : '#111827' }}>
          {isUser ? 'U' : isBot ? 'B' : 'A'}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-semibold text-gray-900">{isUser ? 'Customer' : isBot ? 'Chatbot' : 'AI Auditor'}</div>
            {isAuditor && <Badge tone="amber">interjection</Badge>}
          </div>
          <div className={`whitespace-pre-wrap leading-6 ${isAuditor ? 'bg-amber-50 border border-amber-200' : 'bg-gray-50 border border-gray-200'} p-3 rounded-xl`}>{m.text}</div>
          {m.meta?.originalBotText && (
            <div className="mt-2 text-sm text-gray-700">
              <div className="mb-1 font-medium">Original bot response (suppressed):</div>
              <div className="line-through text-gray-500 bg-red-50 border border-red-200 p-2 rounded-lg">{m.meta.originalBotText}</div>
            </div>
          )}
          {m.meta?.decision && (
            <div className="mt-2 text-xs text-gray-600 flex gap-2 flex-wrap">
              {m.meta.decision.triggeredRules.map((r) => (
                <Pill key={r.id} label={`${r.id}: ${r.title}`} />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  const outcomeTone = {
    allow: { label: "Allowed", tone: "green" },
    stop: { label: "Stopped", tone: "red" },
    "interject-modify": { label: "Interject + Modify", tone: "amber" },
    "interject-ask-user": { label: "Interject + Ask User", tone: "amber" },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="text-lg text-red-600 mb-4">{error}</div>
        <button onClick={handleBack} className="px-4 py-2 rounded-xl bg-black text-white text-sm">
          Back to Incidents
        </button>
      </div>
    );
  }

  // CRITICAL FIX: Check if there are no auditor messages yet (violation not addressed) AND violations exist
  const hasUnresolvedViolations = !conversation.some(m => m.role === 'auditor') && decision.outcome !== 'allow';

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">AI Auditor Demo</h1>
          <p className="text-gray-600">Real-time policy enforcement for customer support chatbots</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge tone={outcomeTone[decision.outcome].tone}>{outcomeTone[decision.outcome].label}</Badge>
          <button onClick={resetDemo} className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-white bg-gray-100 text-sm">Reset demo</button>
          <button onClick={handleBack} className="px-3 py-2 rounded-xl border border-gray-300 hover:bg-white bg-gray-100 text-sm">← Back</button>
        </div>
      </header>

      {/* Tabs */}
      <div className="mb-4 flex gap-2">
        <button onClick={() => setActiveTab("conversation")} className={`px-4 py-2 rounded-xl text-sm font-medium border ${activeTab==='conversation'? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-100 border-gray-200 hover:bg-white'}`}>Conversation</button>
        <button onClick={() => setActiveTab("schema")} className={`px-4 py-2 rounded-xl text-sm font-medium border ${activeTab==='schema'? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-100 border-gray-200 hover:bg-white'}`}>Schema</button>
        <button onClick={() => setActiveTab("auditlog")} className={`px-4 py-2 rounded-xl text-sm font-medium border ${activeTab==='auditlog'? 'bg-white border-gray-300 shadow-sm' : 'bg-gray-100 border-gray-200 hover:bg-white'}`}>Audit Log</button>
      </div>

      {activeTab === "conversation" && (
        <div className="grid grid-cols-12 gap-6">
          {/* Conversation Column */}
          <div className="col-span-9">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm text-gray-600">Customer–Chatbot thread</div>
                <div className="flex items-center gap-2">
                  <Badge tone={outcomeTone[decision.outcome].tone}>{outcomeTone[decision.outcome].label}</Badge>
                  <Badge>rules matched: {decision.triggeredRules.length}</Badge>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                {conversation.map(renderMessage)}

                {/* CRITICAL FIX: Interjection controls shown when violations exist and not yet addressed */}
                {hasUnresolvedViolations && (
                  <div className="mt-2">
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-semibold">AI Auditor interjection point</div>
                        <Badge tone="amber">action required</Badge>
                      </div>
                      <p className="text-sm text-gray-800 mb-3">The auditor prevented the bot from sending its last reply because it likely violates your schema.</p>
                      <div className="grid grid-cols-12 gap-4">
                        <div className="col-span-8">
                          <div className="text-sm text-gray-600 mb-1">Suggested compliant reply</div>
                          <div className="bg-white border border-gray-200 rounded-lg p-3 whitespace-pre-wrap">
                            {decision.suggestedReply || "—"}
                          </div>
                        </div>
                        <div className="col-span-4">
                          <div className="text-sm text-gray-600 mb-1">Triggered rules</div>
                          <ul className="text-sm list-disc pl-5">
                            {decision.triggeredRules.map((r) => (
                              <li key={r.id} className="mb-1"><span className="font-medium">{r.id}</span>: {r.title}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={applySuggestion} className="px-3 py-2 rounded-xl bg-black text-white text-sm">Approve & Send modified</button>
                        <button onClick={requestHuman} className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm">Stop & Request human</button>
                        <button onClick={allowOriginal} className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm">Override & Send original</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar */}
          <div className="col-span-3">
            <Card className="p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <div className="font-semibold">Decision</div>
                <Badge tone={outcomeTone[decision.outcome].tone}>{outcomeTone[decision.outcome].label}</Badge>
              </div>
              <div className="mb-3">
                <ConfidenceMeter value={decision.confidence} />
              </div>
              <div className="text-sm text-gray-700">
                <div className="font-medium mb-1">Rationale</div>
                <ul className="list-disc pl-5">
                  {decision.rationale.map((r, i) => (
                    <li key={i} className="mb-1">{r}</li>
                  ))}
                </ul>
              </div>
            </Card>

            <Card className="p-4">
              <div className="font-semibold mb-2">Schema Summary</div>
              {parsedSchema ? (
                <div className="text-sm text-gray-700">
                  <div className="mb-2"><span className="font-medium">Name:</span> {parsedSchema.name}</div>
                  <div className="mb-2"><span className="font-medium">Version:</span> {parsedSchema.version}</div>
                  <div className="mb-2">
                    <div className="font-medium mb-1">Protocols</div>
                    <ul className="list-disc pl-5 space-y-1">
                      {parsedSchema.supportProtocols.slice(0, 3).map((p, i) => (<li key={i}>{p}</li>))}
                    </ul>
                    {parsedSchema.supportProtocols.length > 3 && (
                      <div className="text-xs text-gray-500 mt-1">…and {parsedSchema.supportProtocols.length - 3} more in Schema tab</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-red-600">Invalid schema JSON</div>
              )}
            </Card>
          </div>
        </div>
      )}

      {activeTab === "schema" && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <Card className="p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="font-semibold">Customer-defined schema</div>
                  <div className="text-sm text-gray-600">Source this from your support protocol documentation. Edit below and return to the Conversation tab to re-run the auditor.</div>
                </div>
                <div className="flex gap-2">
                  <button
                    className="px-3 py-2 rounded-xl border border-gray-300 bg-white text-sm"
                    onClick={() => setSchemaText(JSON.stringify(DEFAULT_SCHEMA, null, 2))}
                  >Reset to default</button>
                  <button
                    className="px-3 py-2 rounded-xl bg-black text-white text-sm"
                    onClick={() => setActiveTab("conversation")}
                  >Re-run audit</button>
                </div>
              </div>

              {schemaError && (
                <div className="mb-3 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-800">Schema JSON error: {schemaError}</div>
              )}

              <textarea
                value={schemaText}
                onChange={(e) => setSchemaText(e.target.value)}
                className="w-full h-[520px] font-mono text-sm p-3 rounded-xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-gray-900"
                spellCheck={false}
              />
            </Card>
          </div>

          <div className="col-span-4">
            <Card className="p-4">
              <div className="font-semibold mb-2">Tips</div>
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
                <li>Map each SOP rule to an <span className="font-medium">id</span>, <span className="font-medium">title</span>, <span className="font-medium">severity</span>, and <span className="font-medium">action</span> (stop/interject/modify).</li>
                <li>Use <span className="font-medium">match.userIncludes</span> and <span className="font-medium">match.botIncludes</span> for quick keyword demos. Real systems would use classifiers + semantic patterns.</li>
                <li>Tune <span className="font-medium">thresholds</span> to change when the auditor interrupts the chatbot.</li>
                <li>Provide <span className="font-medium">onViolationGuidance</span> so the auditor can draft a compliant reply automatically.</li>
              </ul>
            </Card>
          </div>
        </div>
      )}

      {activeTab === "auditlog" && (
        <Card className="p-4">
          <div className="font-semibold mb-2">Audit Log (demo)</div>
          <div className="text-sm text-gray-700">This demo shows one interjection. In a full app, you'd see a chronological list of decisions with diffs, assignee, and resolution status.</div>
        </Card>
      )}

      <footer className="mt-8 text-xs text-gray-500">Demo-only logic. In production, plug your realtime chat stream + policy engine here.</footer>
    </div>
  );
}
