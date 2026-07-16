import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Landing() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex h-20 items-center justify-between px-6 lg:px-12">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="قرار" className="h-8 w-8" />
          <span className="text-xl font-bold text-foreground">قرار</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium">تسجيل الدخول</Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium">حساب جديد</Button>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 text-center py-20">
        <div className="max-w-3xl space-y-8">
          <h1 className="text-5xl lg:text-7xl font-bold tracking-tight text-foreground leading-tight">
            مساحة هادئة <br className="hidden sm:block" />
            <span className="text-primary">لاتخاذ قرارات أفضل</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            توقف عن التخمين وابدأ في الرؤية بوضوح. أداة تفكير شخصية تساعدك على تقييم خياراتك بناءً على ما يهمك حقاً.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/sign-up">
              <Button size="lg" className="h-14 px-8 text-lg w-full sm:w-auto">
                ابدأ التفكير الآن
              </Button>
            </Link>
          </div>
        </div>

        <div className="mt-32 max-w-5xl w-full mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-card border border-border p-8 rounded-2xl text-start">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">حدد المشكلة</h3>
            <p className="text-muted-foreground">اكتب سؤالك بوضوح وأضف جميع الخيارات المتاحة أمامك.</p>
          </div>
          <div className="bg-card border border-border p-8 rounded-2xl text-start">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">ضع المعايير</h3>
            <p className="text-muted-foreground">حدد ما يهمك حقاً وأعطِ كل معيار وزنه المناسب لاحتياجاتك.</p>
          </div>
          <div className="bg-card border border-border p-8 rounded-2xl text-start">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
            </div>
            <h3 className="text-xl font-semibold mb-3">اكتشف الإجابة</h3>
            <p className="text-muted-foreground">قيّم الخيارات وشاهد النتيجة تظهر أمامك بوضوح مبني على البيانات.</p>
          </div>
        </div>
      </main>
      
      <footer className="py-8 text-center text-muted-foreground border-t border-border mt-20">
        <p>© {new Date().getFullYear()} قرار. جميع الحقوق محفوظة.</p>
      </footer>
    </div>
  );
}
