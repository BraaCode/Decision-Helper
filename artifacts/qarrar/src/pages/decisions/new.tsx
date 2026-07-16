import { useState } from "react";
import { useLocation, Link, useSearch } from "wouter";
import { useUser } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { ChevronRight, ChevronLeft, Plus, Trash2, Save, ArrowRight, LayoutTemplate } from "lucide-react";
import {
  useCreateDecision,
  useAddOption,
  useAddCriterion,
  useUpsertRating,
  getGetDecisionQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { decisionTemplates } from "@/lib/templates";

type Step = 1 | 2 | 3 | 4;

export default function DecisionWizard() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const teamId = (() => {
    const raw = new URLSearchParams(search).get("teamId");
    const n = raw ? parseInt(raw, 10) : NaN;
    return Number.isFinite(n) ? n : undefined;
  })();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);

  const myName = user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || "";

  // Form State
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([{ id: 1, label: "" }, { id: 2, label: "" }]);
  const [criteria, setCriteria] = useState([{ id: 1, label: "", weight: 3 }]);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // API Hooks
  const createDecision = useCreateDecision();
  const addOption = useAddOption();
  const addCriterion = useAddCriterion();
  const upsertRating = useUpsertRating();

  const applyTemplate = (id: string) => {
    const tpl = decisionTemplates.find((t) => t.id === id);
    if (!tpl) return;
    setTemplateId(id);
    if (!question.trim()) setQuestion(tpl.question);
    setCriteria(tpl.criteria.map((c, i) => ({ id: Date.now() + i, label: c.label, weight: c.weight })));
  };

  const clearTemplate = () => {
    setTemplateId(null);
    setCriteria([{ id: Date.now(), label: "", weight: 3 }]);
  };

  const handleNext = () => {
    if (step === 1 && !question.trim()) return;
    if (step === 2 && options.filter(o => o.label.trim()).length < 2) return;
    if (step === 3 && criteria.filter(c => c.label.trim()).length < 1) return;
    setStep((s) => (s + 1) as Step);
  };

  const handleBack = () => setStep((s) => (s - 1) as Step);

  const addOptionField = () => {
    if (options.length >= 5) return;
    setOptions([...options, { id: Date.now(), label: "" }]);
  };

  const removeOptionField = (id: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter(o => o.id !== id));
  };

  const addCriterionField = () => {
    setCriteria([...criteria, { id: Date.now(), label: "", weight: 3 }]);
  };

  const removeCriterionField = (id: number) => {
    if (criteria.length <= 1) return;
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const setRating = (optionId: number, criterionId: number, score: number) => {
    setRatings(prev => ({ ...prev, [`${optionId}-${criterionId}`]: score }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const decision = await createDecision.mutateAsync({
        data: { question, teamId, createdByName: myName },
      });
      const decisionId = decision.id;

      const validOptions = options.filter(o => o.label.trim());
      const optionResults = await Promise.all(
        validOptions.map(o => addOption.mutateAsync({ id: decisionId, data: { label: o.label.trim() } }))
      );

      const validCriteria = criteria.filter(c => c.label.trim());
      const criteriaResults = await Promise.all(
        validCriteria.map(c => addCriterion.mutateAsync({ id: decisionId, data: { label: c.label.trim(), weight: c.weight } }))
      );

      const ratingPromises = [];
      for (let i = 0; i < optionResults.length; i++) {
        const opt = optionResults[i];
        const origOptId = validOptions[i].id;
        for (let j = 0; j < criteriaResults.length; j++) {
          const crit = criteriaResults[j];
          const origCritId = validCriteria[j].id;
          const score = ratings[`${origOptId}-${origCritId}`] || 3;
          ratingPromises.push(
            upsertRating.mutateAsync({ id: decisionId, data: { optionId: opt.id, criterionId: crit.id, score } })
          );
        }
      }
      await Promise.all(ratingPromises);

      queryClient.invalidateQueries({ queryKey: getGetDecisionQueryKey(decisionId) });
      setLocation(`/decisions/${decisionId}`);
    } catch {
      toast({
        title: "تعذّر حفظ القرار",
        description: "حدث خطأ أثناء الحفظ. تحقق من اتصالك وحاول مرة أخرى.",
        variant: "destructive",
      });
      setIsSubmitting(false);
    }
  };

  const isStep1Valid = question.trim().length > 0;
  const isStep2Valid = options.filter(o => o.label.trim()).length >= 2;
  const isStep3Valid = criteria.filter(c => c.label.trim()).length >= 1;

  const validOptions = options.filter(o => o.label.trim());
  const validCriteria = criteria.filter(c => c.label.trim());

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border bg-card/50 px-6 h-16 flex items-center justify-between sticky top-0 z-10 backdrop-blur-sm">
        <Link href={teamId ? `/teams/${teamId}` : "/decisions"} className="flex items-center text-sm font-medium text-muted-foreground hover:text-foreground">
          <ArrowRight className="h-4 w-4 me-2" />
          إلغاء
        </Link>
        <div className="flex items-center gap-1.5 text-sm font-medium">
          <span className={step >= 1 ? "text-primary" : "text-muted"}>السؤال</span>
          <span className="text-muted-foreground">/</span>
          <span className={step >= 2 ? "text-primary" : "text-muted"}>الخيارات</span>
          <span className="text-muted-foreground">/</span>
          <span className={step >= 3 ? "text-primary" : "text-muted"}>المعايير</span>
          <span className="text-muted-foreground">/</span>
          <span className={step >= 4 ? "text-primary" : "text-muted"}>التقييم</span>
        </div>
      </header>

      <main className="flex-1 w-full max-w-2xl mx-auto px-6 py-12 flex flex-col">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full animate-in slide-in-from-bottom-4 fade-in">
            {teamId && (
              <div className="mb-6 bg-accent border border-primary/20 rounded-xl p-3 text-sm text-accent-foreground text-center">
                قرار جماعي — سيتمكن جميع أعضاء الفريق من التصويت والنقاش.
              </div>
            )}
            <h1 className="text-3xl font-bold text-foreground mb-4">ما هو القرار الذي تحاول اتخاذه؟</h1>
            <p className="text-muted-foreground mb-6">صغ قرارك في شكل سؤال واضح ومحدد — أو ابدأ من قالب جاهز.</p>

            <div className="flex flex-wrap gap-2 mb-6">
              {decisionTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => (templateId === tpl.id ? clearTemplate() : applyTemplate(tpl.id))}
                  className={`inline-flex items-center gap-1.5 text-sm font-medium rounded-full px-3.5 py-1.5 border transition-colors ${
                    templateId === tpl.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground border-border hover:border-primary/40"
                  }`}
                >
                  <span>{tpl.icon}</span> {tpl.name}
                </button>
              ))}
            </div>
            {templateId && (
              <p className="text-xs text-muted-foreground mb-4 flex items-center gap-1.5">
                <LayoutTemplate className="h-3.5 w-3.5" />
                تم تعبئة المعايير المقترحة تلقائياً — يمكنك تعديلها في الخطوة الثالثة.
              </p>
            )}

            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="مثال: أي سيارة يجب أن أشتري؟"
              className="text-xl h-16 px-6 bg-card border-2"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleNext()}
            />
            <div className="mt-12 flex justify-start">
              <Button onClick={handleNext} disabled={!isStep1Valid} size="lg" className="h-12 px-8 text-lg">
                التالي <ChevronLeft className="h-5 w-5 ms-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="flex-1 flex flex-col max-w-xl mx-auto w-full animate-in slide-in-from-bottom-4 fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-4">ما هي خياراتك؟</h1>
            <p className="text-muted-foreground mb-8">أضف خيارين على الأقل (بحد أقصى 5 خيارات).</p>
            
            <div className="space-y-4">
              {options.map((option, idx) => (
                <div key={option.id} className="flex items-center gap-3">
                  <div className="h-12 w-12 shrink-0 rounded-xl bg-card border border-border flex items-center justify-center text-muted-foreground font-medium">
                    {idx + 1}
                  </div>
                  <Input
                    value={option.label}
                    onChange={(e) => {
                      const newOpts = [...options];
                      newOpts[idx].label = e.target.value;
                      setOptions(newOpts);
                    }}
                    placeholder={`الخيار ${idx + 1}`}
                    className="h-12 bg-card"
                    autoFocus={idx === options.length - 1}
                  />
                  {options.length > 2 && (
                    <Button variant="ghost" size="icon" onClick={() => removeOptionField(option.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="h-5 w-5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {options.length < 5 && (
              <Button variant="outline" onClick={addOptionField} className="mt-6 h-12 border-dashed">
                <Plus className="h-5 w-5 me-2" /> إضافة خيار آخر
              </Button>
            )}

            <div className="mt-auto pt-12 flex justify-between">
              <Button variant="ghost" onClick={handleBack} size="lg" className="h-12 text-lg">
                <ChevronRight className="h-5 w-5 me-2" /> السابق
              </Button>
              <Button onClick={handleNext} disabled={!isStep2Valid} size="lg" className="h-12 px-8 text-lg">
                التالي <ChevronLeft className="h-5 w-5 ms-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="flex-1 flex flex-col max-w-xl mx-auto w-full animate-in slide-in-from-bottom-4 fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-4">ما هي المعايير المهمة؟</h1>
            <p className="text-muted-foreground mb-8">أضف العوامل التي ستؤثر على قرارك، وحدد مدى أهمية كل منها.</p>
            
            <div className="space-y-6">
              {criteria.map((crit, idx) => (
                <div key={crit.id} className="bg-card border border-border p-5 rounded-2xl space-y-4 relative">
                  {criteria.length > 1 && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => removeCriterionField(crit.id)} 
                      className="absolute top-3 end-3 text-muted-foreground hover:text-destructive h-8 w-8"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                  <div className="pe-2">
                    <Label className="text-sm font-semibold mb-2 block text-muted-foreground">اسم المعيار</Label>
                    <Input
                      value={crit.label}
                      onChange={(e) => {
                        const newCrits = [...criteria];
                        newCrits[idx].label = e.target.value;
                        setCriteria(newCrits);
                      }}
                      placeholder="مثال: السعر، الجودة، المسافة..."
                      className="h-11 bg-background"
                      autoFocus={idx === criteria.length - 1}
                    />
                  </div>
                  <div className="pe-2">
                    <div className="flex justify-between items-center mb-3">
                      <Label className="text-sm font-semibold text-muted-foreground">الأهمية: <span className="text-foreground text-base">{crit.weight}</span></Label>
                    </div>
                    <Slider
                      value={[crit.weight]}
                      min={1}
                      max={5}
                      step={1}
                      onValueChange={([val]) => {
                        const newCrits = [...criteria];
                        newCrits[idx].weight = val;
                        setCriteria(newCrits);
                      }}
                      className="py-2"
                    />
                    <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                      <span>أقل أهمية</span>
                      <span>شديد الأهمية</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Button variant="outline" onClick={addCriterionField} className="mt-6 h-12 border-dashed">
              <Plus className="h-5 w-5 me-2" /> إضافة معيار آخر
            </Button>

            <div className="mt-auto pt-12 flex justify-between">
              <Button variant="ghost" onClick={handleBack} size="lg" className="h-12 text-lg">
                <ChevronRight className="h-5 w-5 me-2" /> السابق
              </Button>
              <Button onClick={handleNext} disabled={!isStep3Valid} size="lg" className="h-12 px-8 text-lg">
                التالي <ChevronLeft className="h-5 w-5 ms-2" />
              </Button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full animate-in slide-in-from-bottom-4 fade-in">
            <h1 className="text-3xl font-bold text-foreground mb-4">قيّم خياراتك</h1>
            <p className="text-muted-foreground mb-8">كيف يؤدي كل خيار بالنسبة لكل معيار؟ (1 = سيء جداً، 5 = ممتاز)</p>
            
            <div className="space-y-10 pb-8">
              {validCriteria.map((crit) => (
                <div key={crit.id} className="bg-card border border-border rounded-2xl overflow-hidden">
                  <div className="bg-muted/50 p-4 border-b border-border flex justify-between items-center">
                    <h3 className="font-semibold text-lg">{crit.label}</h3>
                    <span className="text-sm px-2.5 py-1 bg-background rounded-full border border-border text-muted-foreground">
                      أهمية: {crit.weight}/5
                    </span>
                  </div>
                  <div className="p-5 space-y-6">
                    {validOptions.map((opt) => {
                      const score = ratings[`${opt.id}-${crit.id}`] || 3;
                      return (
                        <div key={opt.id} className="flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="w-1/3 font-medium text-foreground">{opt.label}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <Slider
                                value={[score]}
                                min={1}
                                max={5}
                                step={1}
                                onValueChange={([val]) => setRating(opt.id, crit.id, val)}
                                className="flex-1"
                              />
                              <span className="w-8 text-center font-bold text-primary bg-primary/10 rounded-md py-1">
                                {score}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-auto pt-6 flex justify-between sticky bottom-0 bg-background/80 backdrop-blur-md pb-6">
              <Button variant="ghost" onClick={handleBack} size="lg" className="h-12 text-lg" disabled={isSubmitting}>
                <ChevronRight className="h-5 w-5 me-2" /> السابق
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting} size="lg" className="h-12 px-8 text-lg bg-primary hover:bg-primary/90">
                {isSubmitting ? (
                  <span className="animate-pulse">جاري الحفظ...</span>
                ) : (
                  <>احصل على النتيجة <Save className="h-5 w-5 ms-2" /></>
                )}
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
