import { useParams, Link } from "wouter";
import { useState } from "react";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetDecision,
  useGetDecisionScores,
  useUpsertRating,
  useDecideDecision,
  useListComments,
  useAddComment,
  useGetDecisionAudit,
  getGetDecisionQueryKey,
  getGetDecisionScoresQueryKey,
  getListCommentsQueryKey,
  getGetDecisionAuditQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { ArrowRight, Trophy, BarChart3, Vote, MessagesSquare, ScrollText, Printer, CheckCircle2, Send } from "lucide-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

type Tab = "results" | "vote" | "discussion" | "log";

export default function DecisionResults() {
  const { id } = useParams<{ id: string }>();
  const decisionId = parseInt(id || "0", 10);
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("results");
  const [commentBody, setCommentBody] = useState("");

  const myName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "";

  const { data: decision, isLoading: isLoadingDecision } = useGetDecision(decisionId, {
    query: { queryKey: getGetDecisionQueryKey(decisionId), enabled: !!decisionId },
  });
  const { data: scoresData, isLoading: isLoadingScores } = useGetDecisionScores(decisionId, {
    query: { queryKey: getGetDecisionScoresQueryKey(decisionId), enabled: !!decisionId },
  });
  const { data: comments } = useListComments(decisionId, {
    query: { queryKey: getListCommentsQueryKey(decisionId), enabled: !!decisionId },
  });
  const { data: audit } = useGetDecisionAudit(decisionId, {
    query: { queryKey: getGetDecisionAuditQueryKey(decisionId), enabled: !!decisionId && tab === "log" },
  });

  const upsertRating = useUpsertRating();
  const decideDecision = useDecideDecision();
  const addComment = useAddComment();

  const invalidateScores = () => {
    queryClient.invalidateQueries({ queryKey: getGetDecisionScoresQueryKey(decisionId) });
    queryClient.invalidateQueries({ queryKey: getGetDecisionQueryKey(decisionId) });
  };

  const isLoading = isLoadingDecision || isLoadingScores;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-medium">جاري تحليل النتائج...</p>
      </div>
    );
  }

  if (!decision || !scoresData || scoresData.scores.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذا القرار.</p>
        <Link href="/decisions"><Button>العودة للقرارات</Button></Link>
      </div>
    );
  }

  const scores = scoresData.scores;
  const winner = scores.find((s) => s.isWinner) || scores[0];
  const isDecided = decision.status === "decided";
  const decidedOption = isDecided ? decision.options.find((o) => o.id === decision.decidedOptionId) : null;
  const displayWinner = decidedOption ? scores.find((s) => s.optionId === decidedOption.id) || winner : winner;
  const chartData = scores.map((s) => ({ name: s.label, score: Math.round(s.percentage), isWinner: s.isWinner }));

  const myRating = (optionId: number, criterionId: number) =>
    decision.myRatings.find((r) => r.optionId === optionId && r.criterionId === criterionId)?.score ?? 3;

  const handleRate = (optionId: number, criterionId: number, score: number) => {
    upsertRating.mutate(
      { id: decisionId, data: { optionId, criterionId, score } },
      {
        onSuccess: invalidateScores,
        onError: () => toast({ title: "تعذّر حفظ التقييم", variant: "destructive" }),
      },
    );
  };

  const handleDecide = (optionId: number) => {
    decideDecision.mutate(
      { id: decisionId, data: { optionId } },
      {
        onSuccess: () => {
          invalidateScores();
          queryClient.invalidateQueries({ queryKey: getGetDecisionAuditQueryKey(decisionId) });
          toast({ title: "تم اعتماد القرار نهائياً" });
        },
        onError: () => toast({ title: "تعذّر اعتماد القرار", variant: "destructive" }),
      },
    );
  };

  const handleComment = () => {
    if (!commentBody.trim()) return;
    addComment.mutate(
      { id: decisionId, data: { body: commentBody.trim(), authorName: myName } },
      {
        onSuccess: () => {
          setCommentBody("");
          queryClient.invalidateQueries({ queryKey: getListCommentsQueryKey(decisionId) });
        },
        onError: () => toast({ title: "تعذّر إضافة التعليق", variant: "destructive" }),
      },
    );
  };

  const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "results", label: "النتيجة", icon: <BarChart3 className="h-4 w-4" /> },
    { key: "vote", label: "تصويتي", icon: <Vote className="h-4 w-4" /> },
    { key: "discussion", label: `النقاش${comments?.length ? ` (${comments.length})` : ""}`, icon: <MessagesSquare className="h-4 w-4" /> },
    { key: "log", label: "السجل", icon: <ScrollText className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20 print:pb-0">
      <AppHeader />
      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between gap-4 mb-8 print:hidden">
          <Link href={decision.teamId ? `/teams/${decision.teamId}` : "/decisions"}>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted shrink-0">
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </Button>
          </Link>
          <Button variant="outline" onClick={() => window.print()} className="gap-2 shrink-0">
            <Printer className="h-4 w-4" /> تصدير PDF
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3 leading-tight">{decision.question}</h1>
          <p className="text-muted-foreground text-sm">
            {decision.createdByName ? `بواسطة ${decision.createdByName} · ` : ""}
            {scoresData.voterCount} {scoresData.voterCount === 1 ? "مصوّت" : "مصوّتين"} ·{" "}
            {isDecided
              ? `قرار معتمد ${decision.decidedAt ? format(new Date(decision.decidedAt), "dd MMMM yyyy", { locale: ar }) : ""}`
              : "قيد التصويت"}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center justify-center gap-1 mb-10 bg-muted/60 rounded-xl p-1 max-w-md mx-auto print:hidden">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 text-sm font-medium rounded-lg py-2 px-2 transition-colors ${
                tab === t.key ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Results stay mounted so PDF export (print) always includes them */}
        {(
          <div className={tab === "results" ? "" : "hidden print:block"}>
            {/* Winner Card */}
            <div className="animate-winner bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-2 border-primary/25 rounded-3xl p-8 mb-12 text-center relative overflow-hidden shadow-lg shadow-primary/10">
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
              <div className="relative z-10">
                <div className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-primary/30">
                  {isDecided ? <CheckCircle2 className="h-8 w-8" /> : <Trophy className="h-8 w-8" />}
                </div>
                <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">
                  {isDecided ? "القرار النهائي المعتمد" : "الخيار المتصدر"}
                </p>
                <div className="text-5xl font-bold text-foreground mb-4 leading-tight">{displayWinner.label}</div>
                <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
                  <span className="text-muted-foreground text-sm">نسبة التوافق</span>
                  <span className="text-2xl font-bold text-primary">{Math.round(displayWinner.percentage)}%</span>
                </div>
                {!isDecided && decision.isCreator && (
                  <div className="mt-6 print:hidden">
                    <Button onClick={() => handleDecide(displayWinner.optionId)} disabled={decideDecision.isPending} className="gap-2">
                      <CheckCircle2 className="h-4 w-4" /> اعتماد هذا الخيار نهائياً
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-muted-foreground" /> تفاصيل التقييم
                </h3>
                <div className="space-y-6">
                  {scores.map((score, idx) => (
                    <div key={score.optionId} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <span className="font-medium text-foreground flex items-center gap-2">
                          <span className="text-muted-foreground text-sm font-mono w-4">{idx + 1}.</span>
                          {score.label}
                          {score.isWinner && <Trophy className="h-4 w-4 text-primary ms-1" />}
                        </span>
                        <span className="font-bold font-mono">{Math.round(score.percentage)}%</span>
                      </div>
                      <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-1000 ease-out ${score.isWinner ? "bg-primary" : "bg-muted-foreground/40"}`}
                          style={{ width: `${score.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
                <h3 className="text-lg font-semibold mb-6 text-center">مقارنة الخيارات</h3>
                <div className="flex-1 w-full h-[300px]" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                        tick={{ fill: "hsl(var(--foreground))", fontSize: 12 }} width={110} />
                      <Tooltip
                        cursor={{ fill: "hsl(var(--muted)/0.5)" }}
                        contentStyle={{ borderRadius: "8px", border: "1px solid hsl(var(--border))",
                          backgroundColor: "hsl(var(--card))", color: "hsl(var(--foreground))",
                          textAlign: "right", direction: "rtl" }}
                        formatter={(value: number) => [`${value}%`, "التوافق"]}
                      />
                      <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.isWinner ? "hsl(var(--primary))" : "hsl(var(--muted-foreground)/0.35)"} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "vote" && (
          <div className="space-y-8 print:hidden">
            {isDecided ? (
              <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card/30">
                <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
                <p className="text-muted-foreground">هذا القرار معتمد نهائياً — التصويت مغلق.</p>
              </div>
            ) : (
              <>
                {!scoresData.myVoteComplete && (
                  <div className="bg-accent border border-primary/20 rounded-xl p-4 text-sm text-accent-foreground">
                    قيّم كل خيار مقابل كل معيار — تقييمك يُحتسب بشكل مستقل ثم يُدمج مع آراء بقية الفريق.
                  </div>
                )}
                {decision.criteria.map((crit) => (
                  <div key={crit.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                    <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                      <h3 className="font-semibold text-lg">{crit.label}</h3>
                      <span className="text-sm px-2.5 py-1 bg-background rounded-full border border-border text-muted-foreground">
                        أهمية: {crit.weight}/5
                      </span>
                    </div>
                    <div className="p-5 space-y-6">
                      {decision.options.map((opt) => {
                        const score = myRating(opt.id, crit.id);
                        return (
                          <div key={opt.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <div className="sm:w-1/3 font-medium text-foreground">{opt.label}</div>
                            <div className="flex-1 flex items-center gap-4">
                              <Slider value={[score]} min={1} max={5} step={1}
                                onValueChange={([val]) => handleRate(opt.id, crit.id, val)} className="flex-1" />
                              <span className="w-8 text-center font-bold text-primary bg-primary/10 rounded-md py-1">{score}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "discussion" && (
          <div className="max-w-2xl mx-auto print:hidden">
            <div className="space-y-4 mb-6">
              {(comments ?? []).length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-border rounded-2xl bg-card/30">
                  <MessagesSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">لا تعليقات بعد — ابدأ النقاش.</p>
                </div>
              ) : (
                comments!.map((c) => (
                  <div key={c.id} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
                    <div className="h-9 w-9 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                      {(c.authorName || "؟").charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{c.authorName || "عضو"}</span>
                        <span className="text-xs text-muted-foreground shrink-0" dir="ltr">
                          {format(new Date(c.createdAt), "dd MMM, HH:mm", { locale: ar })}
                        </span>
                      </div>
                      <p className="text-sm text-foreground whitespace-pre-wrap">{c.body}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2 items-end">
              <Textarea value={commentBody} onChange={(e) => setCommentBody(e.target.value)}
                placeholder="أضف تعليقاً أو وجهة نظر..." className="bg-card min-h-[80px]" />
              <Button onClick={handleComment} disabled={addComment.isPending || !commentBody.trim()} size="icon" className="h-11 w-11 shrink-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {tab === "log" && (
          <div className="max-w-2xl mx-auto print:hidden">
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {(audit ?? []).length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">لا نشاط مسجل بعد.</p>
              ) : (
                audit!.map((e) => (
                  <div key={e.id} className="p-4 flex items-start justify-between gap-4">
                    <p className="text-sm text-foreground">
                      <span className="font-semibold">{e.actorName || "عضو"}</span> — {e.detail}
                    </p>
                    <span className="text-xs text-muted-foreground shrink-0" dir="ltr">
                      {format(new Date(e.createdAt), "dd MMM yyyy, HH:mm", { locale: ar })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
