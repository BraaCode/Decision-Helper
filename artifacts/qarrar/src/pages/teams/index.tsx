import { useState } from "react";
import { Link } from "wouter";
import { useUser } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/app-header";
import { Users, Plus, ChevronLeft, KeyRound } from "lucide-react";
import { useListTeams, useCreateTeam, useJoinTeam, getListTeamsQueryKey } from "@workspace/api-client-react";

export default function TeamsPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: teams, isLoading } = useListTeams();
  const createTeam = useCreateTeam();
  const joinTeam = useJoinTeam();
  const [newName, setNewName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  const memberName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "";

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getListTeamsQueryKey() });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createTeam.mutate(
      { data: { name: newName.trim(), memberName } },
      {
        onSuccess: () => {
          setNewName("");
          invalidate();
          toast({ title: "تم إنشاء الفريق", description: "شارك رمز الدعوة مع زملائك للانضمام." });
        },
        onError: () => toast({ title: "تعذّر إنشاء الفريق", variant: "destructive" }),
      },
    );
  };

  const handleJoin = () => {
    if (!joinCode.trim()) return;
    joinTeam.mutate(
      { data: { code: joinCode.trim(), memberName } },
      {
        onSuccess: (team) => {
          setJoinCode("");
          invalidate();
          toast({ title: `انضممت إلى «${team.name}»` });
        },
        onError: () => toast({ title: "رمز الدعوة غير صالح", variant: "destructive" }),
      },
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />
      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-foreground mb-8">فرق العمل</h1>

        <div className="grid gap-4 sm:grid-cols-2 mb-10">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><Plus className="h-4 w-4 text-primary" /> فريق جديد</h2>
            <p className="text-sm text-muted-foreground mb-4">أنشئ مساحة مشتركة لقرارات فريقك.</p>
            <div className="flex gap-2">
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="اسم الفريق" className="h-11"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()} />
              <Button onClick={handleCreate} disabled={createTeam.isPending || !newName.trim()} className="h-11">إنشاء</Button>
            </div>
          </div>
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="font-semibold mb-1 flex items-center gap-2"><KeyRound className="h-4 w-4 text-primary" /> الانضمام بفريق</h2>
            <p className="text-sm text-muted-foreground mb-4">أدخل رمز الدعوة الذي وصلك من زميلك.</p>
            <div className="flex gap-2">
              <Input value={joinCode} onChange={(e) => setJoinCode(e.target.value)} placeholder="رمز الدعوة" className="h-11" dir="ltr"
                onKeyDown={(e) => e.key === "Enter" && handleJoin()} />
              <Button onClick={handleJoin} disabled={joinTeam.isPending || !joinCode.trim()} variant="outline" className="h-11">انضمام</Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2].map((i) => <div key={i} className="h-32 bg-card rounded-2xl border border-border animate-pulse" />)}
          </div>
        ) : teams?.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-3xl bg-card/30">
            <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">لا فرق بعد — أنشئ فريقاً أو انضم برمز دعوة.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {teams?.map((team) => (
              <Link key={team.id} href={`/teams/${team.id}`}>
                <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full flex flex-col justify-between">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="h-11 w-11 shrink-0 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg text-foreground leading-tight">{team.name}</h3>
                      <p className="text-sm text-muted-foreground">{team.memberCount} {team.memberCount === 1 ? "عضو" : "أعضاء"}</p>
                    </div>
                  </div>
                  <div className="flex items-center text-sm font-medium text-primary">
                    فتح الفريق <ChevronLeft className="h-4 w-4 ms-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
