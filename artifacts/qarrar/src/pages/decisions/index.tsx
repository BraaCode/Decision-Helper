import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Plus, ChevronLeft, Trash2, CheckCircle2, CircleDashed, Users } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import {
  useListDecisions,
  useDeleteDecision,
  getListDecisionsQueryKey,
} from "@workspace/api-client-react";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function DecisionsList() {
  const { data: decisions, isLoading } = useListDecisions();
  const deleteDecision = useDeleteDecision();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = (id: number) => {
    deleteDecision.mutate(
      { id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey() });
          setDeletingId(null);
        },
        onError: () => {
          toast({
            title: "تعذّر حذف القرار",
            description: "حدث خطأ أثناء الحذف. حاول مرة أخرى.",
            variant: "destructive",
          });
          setDeletingId(null);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">قراراتي</h1>
          <div className="flex items-center gap-2">
            <Link href="/decisions/trash">
              <Button variant="ghost" className="gap-2 text-muted-foreground">
                <Trash2 className="h-4 w-4" />
                <span>سلة المحذوفات</span>
              </Button>
            </Link>
            <Link href="/decisions/new">
              <Button className="gap-2">
                <Plus className="h-5 w-5" />
                <span>قرار جديد</span>
              </Button>
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : decisions?.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-border rounded-3xl bg-card/30">
            <div className="h-16 w-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v18"/><path d="m3 12 9-9 9 9"/></svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">لا توجد قرارات بعد</h2>
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
              مساحتك جاهزة. ابدأ بتسجيل أول قرار تود التفكير فيه بوضوح.
            </p>
            <Link href="/decisions/new">
              <Button size="lg" className="h-12 px-8">
                ابدأ أول قرار
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decisions?.map((decision) => (
              <div
                key={decision.id}
                className="group relative bg-card border border-border rounded-2xl p-6 transition-all hover:shadow-md hover:border-primary/30 flex flex-col justify-between h-48"
              >
                <div>
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-2 leading-tight">
                    {decision.question}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    {format(new Date(decision.createdAt), "dd MMMM yyyy", { locale: ar })}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {decision.status === "decided" ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> معتمد
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <CircleDashed className="h-3 w-3" /> قيد التصويت
                      </span>
                    )}
                    {decision.teamId && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <Users className="h-3 w-3" /> جماعي
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="relative z-10 flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <Link href={`/decisions/${decision.id}`} className="flex items-center text-sm font-medium text-primary hover:text-primary/80">
                    <span>عرض التفاصيل</span>
                    <ChevronLeft className="h-4 w-4 ms-1" />
                  </Link>

                  <AlertDialog open={deletingId === decision.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 -me-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeletingId(decision.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>نقل القرار إلى سلة المحذوفات؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          سيُنقل القرار إلى سلة المحذوفات، ويمكنك استعادته أو حذفه نهائياً من هناك في أي وقت.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(decision.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          نقل إلى السلة
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
                
                <Link href={`/decisions/${decision.id}`} className="absolute inset-0 z-0" aria-label="عرض القرار" />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
