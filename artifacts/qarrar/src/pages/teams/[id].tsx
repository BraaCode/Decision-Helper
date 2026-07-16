import { useParams, Link } from "wouter";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { Users, Copy, Plus, ChevronLeft, ScrollText, CheckCircle2, CircleDashed } from "lucide-react";
import { useGetTeam, useGetTeamAudit, getGetTeamQueryKey, getGetTeamAuditQueryKey } from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

export default function TeamDetail() {
  const { id } = useParams<{ id: string }>();
  const teamId = parseInt(id || "0", 10);
  const { toast } = useToast();
  const [showAudit, setShowAudit] = useState(false);

  const { data: team, isLoading } = useGetTeam(teamId, {
    query: { queryKey: getGetTeamQueryKey(teamId), enabled: !!teamId },
  });
  const { data: audit } = useGetTeamAudit(teamId, {
    query: { queryKey: getGetTeamAuditQueryKey(teamId), enabled: !!teamId && showAudit },
  });

  const copyInvite = () => {
    if (!team) return;
    navigator.clipboard.writeText(team.inviteCode);
    toast({ title: "تم نسخ رمز الدعوة", description: "شاركه مع زملائك — يدخلونه في صفحة الفرق." });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="h-40 bg-card rounded-2xl border border-border animate-pulse" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذا الفريق.</p>
          <Link href="/teams"><Button>العودة للفرق</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex flex-wrap items-start justify-between gap-4 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">{team.name}</h1>
            <p className="text-muted-foreground text-sm">{team.members.length} أعضاء · أُنشئ {format(new Date(team.createdAt), "dd MMMM yyyy", { locale: ar })}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={copyInvite} className="gap-2">
              <Copy className="h-4 w-4" /> رمز الدعوة: <span dir="ltr" className="font-mono">{team.inviteCode}</span>
            </Button>
            <Link href={`/decisions/new?teamId=${team.id}`}>
              <Button className="gap-2"><Plus className="h-4 w-4" /> قرار جماعي</Button>
            </Link>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">قرارات الفريق</h2>
            {team.decisions.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl bg-card/30">
                <p className="text-muted-foreground">لا قرارات جماعية بعد.</p>
              </div>
            ) : (
              team.decisions.map((d) => (
                <Link key={d.id} href={`/decisions/${d.id}`}>
                  <div className="bg-card border border-border rounded-2xl p-5 mb-3 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground mb-1">{d.question}</h3>
                      <p className="text-xs text-muted-foreground">
                        {d.createdByName ? `بواسطة ${d.createdByName} · ` : ""}
                        {format(new Date(d.createdAt), "dd MMM yyyy", { locale: ar })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {d.status === "decided" ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2.5 py-1">
                          <CheckCircle2 className="h-3.5 w-3.5" /> معتمد
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2.5 py-1">
                          <CircleDashed className="h-3.5 w-3.5" /> قيد التصويت
                        </span>
                      )}
                      <ChevronLeft className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              ))
            )}

            <button
              onClick={() => setShowAudit(!showAudit)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground mt-6"
            >
              <ScrollText className="h-4 w-4" /> {showAudit ? "إخفاء سجل النشاط" : "عرض سجل النشاط"}
            </button>
            {showAudit && (
              <div className="bg-card border border-border rounded-2xl divide-y divide-border">
                {(audit ?? []).length === 0 ? (
                  <p className="p-5 text-sm text-muted-foreground">لا نشاط مسجل بعد.</p>
                ) : (
                  audit!.map((e) => (
                    <div key={e.id} className="p-4 flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm text-foreground">
                          <span className="font-semibold">{e.actorName || "عضو"}</span> — {e.detail}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0" dir="ltr">
                        {format(new Date(e.createdAt), "dd MMM, HH:mm", { locale: ar })}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">الأعضاء</h2>
            <div className="bg-card border border-border rounded-2xl divide-y divide-border">
              {team.members.map((m) => (
                <div key={m.id} className="p-4 flex items-center gap-3">
                  <div className="h-9 w-9 shrink-0 bg-primary/10 text-primary rounded-full flex items-center justify-center font-semibold">
                    {(m.name || "؟").charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">{m.name || "عضو"}</p>
                    <p className="text-xs text-muted-foreground">{m.role === "owner" ? "مالك الفريق" : "عضو"}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
