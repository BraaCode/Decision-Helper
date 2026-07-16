import { useParams, Link } from "wouter";
import { 
  useGetDecision, 
  useGetDecisionScores,
  getGetDecisionQueryKey,
  getGetDecisionScoresQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { ArrowRight, Trophy, BarChart3 } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

export default function DecisionResults() {
  const { id } = useParams<{ id: string }>();
  const decisionId = parseInt(id || "0", 10);

  const { data: decision, isLoading: isLoadingDecision } = useGetDecision(decisionId, {
    query: { queryKey: getGetDecisionQueryKey(decisionId), enabled: !!decisionId }
  });
  
  const { data: scores, isLoading: isLoadingScores } = useGetDecisionScores(decisionId, {
    query: { queryKey: getGetDecisionScoresQueryKey(decisionId), enabled: !!decisionId }
  });

  const isLoading = isLoadingDecision || isLoadingScores;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-muted-foreground font-medium">جاري تحليل النتائج...</p>
      </div>
    );
  }

  if (!decision || !scores || scores.length === 0) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
        <p className="text-muted-foreground mb-4">لم نتمكن من العثور على هذا القرار.</p>
        <Link href="/decisions">
          <Button>العودة للقرارات</Button>
        </Link>
      </div>
    );
  }

  const winner = scores.find(s => s.isWinner) || scores[0];
  const chartData = scores.map(s => ({
    name: s.label,
    score: Math.round(s.percentage),
    isWinner: s.isWinner,
  }));

  return (
    <div className="min-h-screen bg-background flex flex-col pb-20">
      <header className="border-b border-border bg-card/50 px-6 h-16 flex items-center gap-4 sticky top-0 z-10 backdrop-blur-sm">
        <Link href="/decisions">
          <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted">
            <ArrowRight className="h-5 w-5 text-muted-foreground" />
          </Button>
        </Link>
        <span className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-md">النتيجة</span>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 leading-tight">{decision.question}</h1>
          <p className="text-muted-foreground">بناءً على معاييرك وتقييماتك، هذه هي النتيجة الموضوعية لقرارك.</p>
        </div>

        {/* Winner Card — animates in with winner-reveal */}
        <div className="animate-winner bg-gradient-to-br from-primary/8 via-primary/4 to-transparent border-2 border-primary/25 rounded-3xl p-8 mb-12 text-center relative overflow-hidden shadow-lg shadow-primary/10">
          <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="relative z-10">
            <div className="h-16 w-16 bg-primary text-primary-foreground rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-md shadow-primary/30">
              <Trophy className="h-8 w-8" />
            </div>
            <p className="text-xs font-bold text-primary mb-3 uppercase tracking-widest">الخيار الأفضل</p>
            <div className="text-5xl font-bold text-foreground mb-4 leading-tight">{winner.label}</div>
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
              <span className="text-muted-foreground text-sm">نسبة التوافق</span>
              <span className="text-2xl font-bold text-primary">{Math.round(winner.percentage)}%</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
          {/* Detailed Scores */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
              تفاصيل التقييم
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
                      className={`h-full rounded-full transition-all duration-1000 ease-out ${score.isWinner ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                      style={{ width: `${score.percentage}%` }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground text-start">
                    النقاط: {score.totalScore} من {score.maxScore}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chart — wrapped in dir=ltr so Recharts renders correctly */}
          <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
            <h3 className="text-lg font-semibold mb-6 text-center">مقارنة الخيارات</h3>
            <div className="flex-1 w-full h-[300px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: 'hsl(var(--foreground))', fontSize: 12 }}
                    width={110}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--card))',
                      color: 'hsl(var(--foreground))',
                      textAlign: 'right',
                      direction: 'rtl',
                    }}
                    formatter={(value: number) => [`${value}%`, 'التوافق']}
                  />
                  <Bar dataKey="score" radius={[0, 6, 6, 0]} barSize={32}>
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isWinner ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground)/0.35)'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
