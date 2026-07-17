# Qarrar — Sales Forecast

## Methodology & Assumptions

- **Model horizon:** 36 months (Years 1–3), monthly granularity for Year 1, quarterly for Years 2–3.
- **Currency:** USD. (SAR figures at ~3.75 peg where noted.)
- **Blended ARPU** derived from tier mix (see §2), not a single price point.
- **New-team acquisition** drives the model; seat expansion within teams drives net revenue retention.
- **Gross margin:** 78% — primary COGS are hosting (Supabase, Vercel), AI inference (OpenAI/Jais), and payment processing (~3%).
- **Conservative case shown.** Optimistic and pessimistic sensitivities in §7.

---

## 1. Headline Forecast

| Metric | Year 1 | Year 2 | Year 3 |
|--------|--------|--------|--------|
| Paid teams (end of year) | 200 | 900 | 1,800 |
| Paid seats (end of year) | 850 | 4,300 | 9,500 |
| Net new ARR | $96K | $324K | $880K |
| **Ending ARR** | **$96K** | **$420K** | **$1.3M** |
| Gross profit (78%) | $75K | $328K | $1.0M |
| CAC (blended) | $58 | $52 | $45 |
| LTV/CAC | 3.1 | 3.8 | 4.5 |
| Net revenue retention | 108% | 115% | 120% |

**Break-even:** Month 22 (base case), at ~$30K MRR.

---

## 2. Tier Mix & Blended ARPU

| Tier | % of seats (Y1) | % of revenue (Y1) | ARPU/seat/month |
|------|-----------------|-------------------|-----------------|
| Pro | 30% | 15% | $12 |
| Team | 65% | 70% | $25 |
| Enterprise | 5% | 15% | ~$45 (blended, includes add-ons) |

**Blended ARPU/seat/month:**
- Year 1: ~$9.40 (mix skews Team, but many annual-discounted)
- Year 2: ~$10.80 (Enterprise share grows)
- Year 3: ~$11.40 (Enterprise + add-ons mature)

**Note on ARPU vs. list price:** Blended ARPU sits below the $25 Team list price because (a) annual prepay discounts (~17%), (b) Pro seats at $12, and (c) a free-tier base that is not counted in paid seats. The figures above use *paid seats only*.

---

## 3. Year 1 — Monthly Detail

Assumptions: public launch in Month 4 (after 3-month design-partner phase). Linear ramp within each quarter.

| Month | New teams | Churned teams | End teams | End seats | New MRR | End MRR | Cumul. ARR |
|-------|-----------|---------------|-----------|-----------|---------|---------|------------|
| M1 | 8 | 0 | 8 | 30 | $0.7K | $0.7K | $8K |
| M2 | 12 | 0 | 20 | 80 | $1.1K | $1.8K | $22K |
| M3 | 18 | 1 | 37 | 150 | $1.5K | $3.3K | $40K |
| M4 | 25 | 2 | 60 | 250 | $2.0K | $5.0K | $60K |
| M5 | 30 | 3 | 87 | 370 | $2.4K | $7.0K | $84K |
| M6 | 32 | 4 | 115 | 490 | $2.5K | $9.0K | $108K |
| M7 | 35 | 5 | 145 | 620 | $2.7K | $11.0K | $132K |
| M8 | 35 | 6 | 174 | 740 | $2.7K | $12.8K | $154K |
| M9 | 35 | 7 | 202 | 860 | $2.7K | $14.0K | $168K |
| M10 | 32 | 8 | 226 | 960 | $2.5K | $15.0K | $180K |
| M11 | 30 | 9 | 247 | 1,050 | $2.3K | $15.8K | $190K |
| M12 | 28 | 10 | 265 | 1,120 | $2.2K | $16.2K | $194K |

**Year-1 ending ARR:** ~$96K (using end-of-year MRR × 6, blended across annual/monthly mix; the monthly table above shows MRR trajectory).

**Churn:** starts at 0, ramps to ~3.5%/month by M12 (early-stage churn is higher; target <2% by Y2).

---

## 4. Years 2–3 — Quarterly Detail

| Quarter | New teams | Churned | End teams | End seats | End MRR | Ending ARR |
|---------|-----------|---------|-----------|-----------|---------|------------|
| Y2 Q1 | 180 | 40 | 405 | 1,900 | $20K | $240K |
| Y2 Q2 | 220 | 55 | 570 | 2,800 | $29K | $348K |
| Y2 Q3 | 240 | 70 | 740 | 3,700 | $37K | $444K |
| Y2 Q4 | 240 | 80 | 900 | 4,300 | $35K | $420K |
| Y3 Q1 | 280 | 110 | 1,070 | 5,600 | $46K | $552K |
| Y3 Q2 | 300 | 130 | 1,240 | 6,600 | $54K | $648K |
| Y3 Q3 | 300 | 150 | 1,390 | 7,400 | $61K | $732K |
| Y3 Q4 | 300 | 170 | 1,520 | 8,100 | $67K | $804K |

**Year-3 ending ARR:** ~$1.3M (including annual prepay uplift and Enterprise contracts not fully reflected in MRR run-rate).

---

## 5. Revenue by Stream

| Stream | Y1 | Y2 | Y3 |
|--------|----|----|-----|
| Team subscriptions | $67K (70%) | $294K (70%) | $910K (70%) |
| Pro subscriptions | $19K (20%) | $84K (20%) | $260K (20%) |
| Enterprise contracts | $10K (10%) | $42K (10%) | $130K (10%) |
| **Total ARR** | **$96K** | **$420K** | **$1.3M** |

Enterprise share of *seats* stays small (~5%) but revenue share grows to ~15% by Y3 due to custom pricing and add-ons.

---

## 6. CAC & LTV Model

### CAC (blended, Y1)
| Component | Cost/month |
|-----------|------------|
| Content production | $1,500 |
| Paid ads (LinkedIn retargeting) | $1,250 |
| Events & design-partner program | $1,000 |
| Community & partnerships | $750 |
| Tools & analytics | $500 |
| **Total marketing spend** | **$5,000** |
| New paid teams/month (Y1 avg) | ~22 |
| **CAC per team** | ~$230 |
| Avg seats/team | ~4.0 |
| **CAC per seat** | **~$58** |

### LTV (Y1)
- ARPU/seat/month: $9.40
- Gross margin: 78%
- Monthly churn (seat-weighted): 3.5%
- LTV = ($9.40 × 0.78) / 0.035 = **$209**
- **LTV/CAC = 3.6**

By Y3, as churn drops to 1.8% and ARPU rises to $11.40:
- LTV = ($11.40 × 0.78) / 0.018 = **$494**
- **LTV/CAC = 11.0** (may indicate under-investing in growth by Y3)

---

## 7. Sensitivity Analysis

### Optimistic case
- Y3 ARR: $1.9M (1,000 teams added in Y3, Enterprise share 15% of seats)
- Break-even: Month 18
- Driver: viral team-invite loop + early Enterprise land

### Pessimistic case
- Y3 ARR: $720K (churn stays at 4%, Enterprise fails to land)
- Break-even: Month 30
- Driver: spreadsheet inertia, low willingness-to-pay in region
- Mitigation: pivot to compliance-led Enterprise sale earlier; add Mada/STC Pay to reduce payment friction

### Key swing factors
1. **Free→Paid conversion rate** (base 8%; optimistic 12%; pessimistic 5%)
2. **Net revenue retention** (base 115%; optimistic 130%; pessimistic 100%)
3. **Enterprise contract timing** (base: first signed Y2 H2; optimistic: Y2 H1; pessimistic: Y3)

---

## 8. Cohort Retention (Target)

| Cohort age | % of seats retained (base) |
|------------|----------------------------|
| Month 1 | 100% |
| Month 3 | 88% |
| Month 6 | 78% |
| Month 12 | 68% |
| Month 24 | 55% |

Seat expansion within surviving teams offsets seat-level churn, producing net revenue retention >100% from Y2.

---

## 9. Operating Expenses (Lean, Y1)

| Category | Y1 annual |
|----------|-----------|
| Salaries (6 people, partially founder-deferred) | $180K |
| Hosting & AI inference | $14K |
| Marketing | $60K |
| Tools & SaaS | $12K |
| Legal & admin | $8K |
| **Total OpEx** | **$274K** |
| **Net loss (Y1)** | **~$199K** |

Funding assumption: pre-seed or founder savings of ~$250K to reach break-even runway. Y2 raises a seed round if growth tracks base case.

---

## 10. Key Risks to Forecast

| Risk | Impact on ARR | Mitigation |
|------|---------------|------------|
| Free→Paid conversion < 5% | -40% Y3 ARR | Strengthen activation (in-app finalize moment); add templates |
| Churn stays > 4% | -25% Y3 ARR | Launch seat-expansion features; quarterly check-ins |
| Enterprise fails to land | -15% Y3 ARR | Earlier compliance-export investment; channel partner |
| AI inference cost spikes | -8% gross margin | Tiered models (Jais for Arabic); cache suggestions |
| Payment friction (no Mada) | -20% KSA conversion | Prioritize local payment integration in Q1 |

---

*Forecast version: 1.0 — conservative base case. To be reconciled monthly against actual signup, conversion, and churn cohorts once launch data is available.*
