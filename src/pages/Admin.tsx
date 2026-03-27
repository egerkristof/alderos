import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { LogOut, Save, RefreshCw } from "lucide-react";

const Admin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [prompts, setPrompts] = useState<{ id: string; name: string; description: string; prompt_text: string; updated_at: string }[]>([]);
  const [editingPrompt, setEditingPrompt] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Analytics state
  const [events, setEvents] = useState<any[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"prompts" | "analytics">("prompts");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      setLoading(false);
      fetchPrompts();
      fetchEvents();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/admin/login");
    });

    checkAuth();
    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchPrompts = async () => {
    const { data } = await supabase.from("system_prompts").select("*").order("name");
    if (data) setPrompts(data);
  };

  const fetchEvents = async () => {
    setEventsLoading(true);
    const { data } = await supabase
      .from("usage_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data) setEvents(data);
    setEventsLoading(false);
  };

  const handleSavePrompt = async (id: string) => {
    setSaving(true);
    setSaveSuccess(false);
    const { error } = await supabase
      .from("system_prompts")
      .update({ prompt_text: editText, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (!error) {
      setSaveSuccess(true);
      setEditingPrompt(null);
      fetchPrompts();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
    setSaving(false);
  };

  const handleLogout = async () => {
    localStorage.removeItem("alderos_remember_admin");
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <main className="bg-background min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground font-body">Loading...</p>
      </main>
    );
  }

  // Analytics computations
  const totalEvents = events.length;
  const preselected = events.filter((e) => e.event_type === "preselected").length;
  const custom = events.filter((e) => e.event_type === "custom").length;
  const aiMode = events.filter((e) => e.mode === "ai").length;
  const trainingMode = events.filter((e) => e.mode === "training").length;

  // Group by session
  const sessionMap: Record<string, any[]> = {};
  events.forEach((e) => {
    const sid = e.session_id || e.id;
    if (!sessionMap[sid]) sessionMap[sid] = [];
    sessionMap[sid].push(e);
  });
  const sessions = Object.entries(sessionMap).sort(([, a], [, b]) => {
    const latestA = Math.max(...a.map((e: any) => new Date(e.created_at).getTime()));
    const latestB = Math.max(...b.map((e: any) => new Date(e.created_at).getTime()));
    return latestB - latestA;
  });
  const multiQuestionSessions = sessions.filter(([, evts]) => evts.length > 1).length;
  const uniqueSessions = sessions.length;

  // Group by challenge_id for preselected
  const challengeCounts: Record<string, number> = {};
  events.filter((e) => e.event_type === "preselected" && e.challenge_id).forEach((e) => {
    challengeCounts[e.challenge_id] = (challengeCounts[e.challenge_id] || 0) + 1;
  });

  // Group by language
  const langCounts: Record<string, number> = {};
  events.forEach((e) => {
    const l = e.language || "en";
    langCounts[l] = (langCounts[l] || 0) + 1;
  });

  return (
    <main className="bg-background min-h-screen px-6 py-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div>
            <h1 className="text-3xl font-heading font-semibold text-foreground">Alderos Admin</h1>
            <p className="text-sm text-muted-foreground font-body mt-1">Manage prompts and view analytics</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {/* Success banner */}
        {saveSuccess && (
          <div className="mb-6 px-4 py-3 rounded-lg bg-primary/10 text-primary text-sm font-body">
            Prompt saved successfully. Changes are live.
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("prompts")}
            className={`px-4 py-2.5 text-sm font-body transition-colors border-b-2 -mb-px ${
              activeTab === "prompts" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Agent Prompts
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2.5 text-sm font-body transition-colors border-b-2 -mb-px ${
              activeTab === "analytics" ? "border-accent text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            Usage Analytics
          </button>
        </div>

        {/* Prompts Tab */}
        {activeTab === "prompts" && (
          <div className="space-y-6">
            {prompts.map((prompt) => (
              <div key={prompt.id} className="rounded-xl border border-border bg-card p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-heading font-semibold text-foreground">{prompt.name}</h3>
                    {prompt.description && (
                      <p className="text-sm text-muted-foreground font-body mt-0.5">{prompt.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground/60 font-body">
                    Updated: {new Date(prompt.updated_at).toLocaleDateString()}
                  </span>
                </div>

                {editingPrompt === prompt.id ? (
                  <div className="space-y-3">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="w-full h-80 px-4 py-3 rounded-lg border border-border bg-background text-foreground font-mono text-xs
                                 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/40 transition-all resize-y"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSavePrompt(prompt.id)}
                        disabled={saving}
                        className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-body
                                   hover:opacity-90 transition-opacity disabled:opacity-50"
                      >
                        <Save className="w-3.5 h-3.5" /> {saving ? "Saving..." : "Save changes"}
                      </button>
                      <button
                        onClick={() => setEditingPrompt(null)}
                        className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <pre className="whitespace-pre-wrap text-xs text-foreground/80 font-mono bg-background rounded-lg p-4 border border-border max-h-60 overflow-y-auto">
                      {prompt.prompt_text}
                    </pre>
                    <button
                      onClick={() => { setEditingPrompt(prompt.id); setEditText(prompt.prompt_text); }}
                      className="mt-3 text-sm text-accent hover:text-accent/80 font-body transition-colors"
                    >
                      Edit prompt
                    </button>
                  </div>
                )}
              </div>
            ))}

            {prompts.length === 0 && (
              <p className="text-muted-foreground font-body text-center py-12">No prompts found.</p>
            )}
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div>
            <div className="flex justify-end mb-6">
              <button
                onClick={fetchEvents}
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground font-body transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh
              </button>
            </div>

            {/* Stats cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {[
                { label: "Total submissions", value: totalEvents },
                { label: "Unique sessions", value: uniqueSessions },
                { label: "Multi-question sessions", value: multiQuestionSessions },
                { label: "Avg questions/session", value: uniqueSessions ? (totalEvents / uniqueSessions).toFixed(1) : "0" },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-heading font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Preselected", value: preselected },
                { label: "Custom questions", value: custom },
                { label: "AI mode", value: aiMode },
                { label: "Training mode", value: trainingMode },
              ].map((stat) => (
                <div key={stat.label} className="rounded-xl border border-border bg-card p-4 text-center">
                  <p className="text-2xl font-heading font-semibold text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground font-body mt-1">{stat.label}</p>
                </div>
              ))}
            </div>

            {/* Challenge breakdown */}
            {Object.keys(challengeCounts).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <h3 className="text-sm font-body font-medium text-foreground mb-4">Preselected challenge breakdown</h3>
                <div className="space-y-2">
                  {Object.entries(challengeCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([id, count]) => (
                      <div key={id} className="flex items-center justify-between text-sm font-body">
                        <span className="text-foreground/80">{id}</span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Language breakdown */}
            {Object.keys(langCounts).length > 0 && (
              <div className="rounded-xl border border-border bg-card p-6 mb-6">
                <h3 className="text-sm font-body font-medium text-foreground mb-4">Language breakdown</h3>
                <div className="flex gap-4">
                  {Object.entries(langCounts)
                    .sort(([, a], [, b]) => b - a)
                    .map(([lang, count]) => (
                      <div key={lang} className="text-center">
                        <p className="text-lg font-heading font-semibold text-foreground">{count}</p>
                        <p className="text-xs text-muted-foreground font-body uppercase">{lang}</p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Sessions view */}
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <h3 className="text-sm font-body font-medium text-foreground p-4 border-b border-border">
                Recent sessions ({sessions.length})
              </h3>
              {eventsLoading ? (
                <p className="text-muted-foreground font-body text-center py-8">Loading...</p>
              ) : sessions.length === 0 ? (
                <p className="text-muted-foreground font-body text-center py-8">No submissions yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {sessions.slice(0, 30).map(([sessionId, sessionEvents]) => {
                    const sortedEvents = [...sessionEvents].sort(
                      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                    );
                    const firstEvent = sortedEvents[0];
                    const lastEvent = sortedEvents[sortedEvents.length - 1];
                    const isMulti = sortedEvents.length > 1;
                    const hasSessionId = firstEvent.session_id != null;

                    // Duration for multi-question sessions
                    const durationMs = new Date(lastEvent.created_at).getTime() - new Date(firstEvent.created_at).getTime();
                    const durationMin = Math.round(durationMs / 60000);

                    return (
                      <div key={sessionId} className="p-5">
                        {/* Session header */}
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            {/* Session icon */}
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-body font-semibold ${
                              isMulti
                                ? "bg-accent/15 text-accent"
                                : "bg-muted text-muted-foreground"
                            }`}>
                              {sortedEvents.length}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-body font-medium text-foreground">
                                  {isMulti ? `${sortedEvents.length} questions` : "1 question"}
                                </span>
                                {isMulti && durationMin > 0 && (
                                  <span className="text-[0.65rem] text-muted-foreground/60 font-body">
                                    ({durationMin} min session)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[0.65rem] text-muted-foreground font-body">
                                  {new Date(firstEvent.created_at).toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}
                                  {", "}
                                  {new Date(firstEvent.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                <span className="text-[0.65rem] text-muted-foreground/40 font-body uppercase">{firstEvent.language || "en"}</span>
                                {!hasSessionId && (
                                  <span className="text-[0.6rem] text-muted-foreground/40 font-body italic">pre-tracking</span>
                                )}
                              </div>
                            </div>
                          </div>
                          <span className="text-[0.55rem] text-muted-foreground/30 font-mono select-all">{sessionId.slice(0, 8)}</span>
                        </div>

                        {/* Questions list */}
                        <div className={`ml-11 space-y-2 ${isMulti ? "border-l-2 border-accent/15 pl-4" : "pl-0"}`}>
                          {sortedEvents.map((event: any, idx: number) => (
                            <div key={event.id} className="flex items-start gap-2">
                              {isMulti && (
                                <span className="text-[0.6rem] text-muted-foreground/40 font-mono mt-1 w-4 flex-shrink-0">{idx + 1}.</span>
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5 mb-0.5">
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-body font-medium ${
                                    event.event_type === "custom"
                                      ? "bg-accent/10 text-accent"
                                      : "bg-primary/10 text-primary"
                                  }`}>
                                    {event.event_type}
                                  </span>
                                  <span className={`inline-block px-1.5 py-0.5 rounded text-[0.6rem] font-body ${
                                    event.mode === "training"
                                      ? "bg-muted text-muted-foreground"
                                      : "bg-secondary text-secondary-foreground"
                                  }`}>
                                    {event.mode || "ai"}
                                  </span>
                                  {isMulti && (
                                    <span className="text-[0.55rem] text-muted-foreground/40 font-body">
                                      {new Date(event.created_at).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-foreground/80 font-body leading-snug">{event.challenge_text}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default Admin;
