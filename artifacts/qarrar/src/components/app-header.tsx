import { Link, useLocation } from "wouter";
import { useUser, useClerk } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function AppHeader() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const [location] = useLocation();

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
        location.startsWith(href) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="border-b border-border bg-card/50 px-6 lg:px-12 h-16 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm print:hidden">
      <div className="flex items-center gap-6">
        <Link href="/decisions" className="flex items-center gap-3">
          <img src="/logo.svg" alt="قرار" className="h-8 w-8" />
          <span className="font-bold text-foreground">قرار</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navLink("/decisions", "القرارات")}
          {navLink("/teams", "الفرق")}
        </nav>
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
  );
}
