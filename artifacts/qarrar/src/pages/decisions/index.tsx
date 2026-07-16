import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useUser, useClerk } from "@clerk/react";
import { LogOut, Plus, ChevronLeft, Trash2 } from "lucide-react";
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
  const { user } = useUser();
  const { signOut } = useClerk();
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
      <header className="border-b border-border bg-card/50 px-6 lg:px-12 h-16 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="قرار" className="h-8 w-8" />
          <span className="font-bold text-foreground">قرار</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-muted-foreground hidden sm:block">
            {user?.firstName ? `مرحباً، ${user.firstName}` : user?.primaryEmailAddress?.emailAddress}
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => signOut({ redirectUrl: "/" })}
            className="text-muted-foreground hover:text-foreground"
            title="تسجيل الخروج"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-foreground">قراراتي</h1>
          <Link href="/decisions/new">
            <Button className="gap-2">
              <Plus className="h-5 w-5" />
              <span>قرار جديد</span>
            </Button>
          </Link>
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
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(decision.createdAt), "dd MMMM yyyy", { locale: ar })}
                  </p>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-border mt-auto">
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
                        <AlertDialogTitle>هل أنت متأكد من حذف هذا القرار؟</AlertDialogTitle>
                        <AlertDialogDescription>
                          هذا الإجراء لا يمكن التراجع عنه. سيتم حذف جميع الخيارات والمعايير والتقييمات المرتبطة به.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>إلغاء</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(decision.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                          حذف
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
