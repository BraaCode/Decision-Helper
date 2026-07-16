import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-foreground">404</h1>
      <h2 className="mb-6 text-2xl font-semibold text-foreground">الصفحة غير موجودة</h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        عذراً، لم نتمكن من العثور على الصفحة التي تبحث عنها. قد تكون حُذفت أو نُقلت.
      </p>
      <Link href="/">
        <Button className="h-11 px-8 text-base">العودة للرئيسية</Button>
      </Link>
    </div>
  );
}
