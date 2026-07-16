import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trash2, RotateCcw, Users, CheckCircle2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import {
  useListTrashedDecisions,
  useRestoreDecision,
  usePermanentlyDeleteDecision,
  getListTrashedDecisionsQueryKey,
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

export default function TrashPage() {
  const { data: decisions, isLoading } = useListTrashedDecisions();
  const restoreDecision = useRestoreDecision();
  const permanentDelete = usePermanentlyDeleteDecision();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListTrashedDecisionsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getListDecisionsQueryKey() });
  };

  const handleRestore = (id: number) => {
    restoreDecision.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          toast({ title: "تمت استعادة القرار" });
        },
        onError: () => {
          toast({ title: "تعذّرت الاستعادة", description: "حاول مرة أخرى.", variant: "destructive" });
        },
      }
    );
  };

  const handlePermanentDelete = (id: number) => {
    permanentDelete.mutate(
      { id },
      {
        onSuccess: () => {
          invalidate();
          setDeletingId(null);
          toast({ title: "تم الحذف نهائياً" });
        },
        onError: () => {
          setDeletingId(null);
          toast({ title: "تعذّر الحذف", description: "حاول مرة أخرى.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <AppHeader />

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link href="/decisions">
              <Button variant="ghost" size="icon" aria-label="رجوع">
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <Trash2 className="h-7 w-7 text-muted-foreground" />
              سلة المحذوفات
            </h1>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-40 bg-card rounded-2xl border border-border animate-pulse" />
            ))}
          </div>
        ) : !decisions || decisions.length === 0 ? (
          <div className="text-center py-32 border-2 border-dashed border-border rounded-3xl bg-card/30">
            <div className="h-16 w-16 bg-muted text-muted-foreground rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-semibold mb-2 text-foreground">السلة فارغة</h2>
            <p className="text-muted-foreground max-w-sm mx-auto">
              القرارات التي تحذفها ستظهر هنا، ويمكنك استعادتها أو حذفها نهائياً.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {decisions.map((decision) => (
              <div
                key={decision.id}
                className="bg-card border border-border rounded-2xl p-6 flex flex-col justify-between h-48 opacity-90"
              >
                <div>
                  <h3 className="font-semibold text-lg text-foreground line-clamp-2 mb-2 leading-tight">
                    {decision.question}
                  </h3>
                  {decision.deletedAt && (
                    <p className="text-sm text-muted-foreground mb-2">
                      حُذف في {format(new Date(decision.deletedAt), "dd MMMM yyyy", { locale: ar })}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-1.5">
                    {decision.status === "decided" && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                        <CheckCircle2 className="h-3 w-3" /> معتمد
                      </span>
                    )}
                    {decision.teamId && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                        <Users className="h-3 w-3" /> جماعي
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-primary hover:text-primary"
                    disabled={restoreDecision.isPending}
                    onClick={() => handleRestore(decision.id)}
                  >
                    <RotateCcw className="h-4 w-4" />
                    استعادة
                  </Button>

                  <AlertDialog open={deletingId === decision.id} onOpenChange={(open) => !open && setDeletingId(null)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setDeletingId(decision.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        حذف نهائي
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent dir="rtl">
                      <AlertDialogHeader>
                        <AlertDialogTitle>حذف القرار نهائياً؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          هذا الإجراء لا يمكن التراجع عنه. سيتم حذف القرار وجميع الخيارات والمعايير والتقييمات والتعليقات المرتبطة به نهائياً.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handlePermanentDelete(decision.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          حذف نهائياً
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
