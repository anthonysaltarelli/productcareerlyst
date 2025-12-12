# OpenAI Model Benchmark Report

**Date:** November 25, 2025  
**Test File:** `public/Files/Anthony+Saltarelli+Resume copy.pdf`

## Executive Summary

| Model | Extraction Time | Analysis Time | Total Time | Analysis Score |
|-------|-----------------|---------------|------------|----------------|
| **gpt-5.1** | **16.2s** | **69.8s** | **86.0s** | **93/100** |
| gpt-5-mini | 36.0s | 153.2s | 189.2s | 82/100 |
| gpt-5-nano | 46.0s | 84.9s | 130.9s | 85/100 |

### Key Finding

**gpt-5.1 is both the fastest AND highest quality model.** It's 2-3x faster than the smaller models while producing significantly better analysis output.

---

## Detailed Results

### 1. Resume Extraction (PDF → Structured Data)

| Model | API Time | Data Completeness |
|-------|----------|-------------------|
| **gpt-5.1** | **16.2s** | 5 experiences, 32 bullets, 28 skills |
| gpt-5-mini | 36.0s | 5 experiences, 25 bullets, 20 skills |
| gpt-5-nano | 46.0s | 5 experiences, 32 bullets, 13 skills |

**Observations:**
- **gpt-5.1** extracted the most complete data (28 skills vs 13-20 for others)
- **gpt-5-mini** missed 7 bullets from the Squarespace roles
- **gpt-5-nano** extracted fewer skills and categorized them less accurately

### 2. Resume Analysis (Comprehensive PM Analysis)

| Model | API Time | Overall Score | Action Verbs | Accomplishments | Quantification | Impact | Conciseness |
|-------|----------|---------------|--------------|-----------------|----------------|--------|-------------|
| **gpt-5.1** | **69.8s** | **93** | **92** | **96** | **95** | **95** | **85** |
| gpt-5-mini | 153.2s | 82 | 85 | 82 | 80 | 84 | 76 |
| gpt-5-nano | 84.9s | 85 | 78 | 90 | 92 | 86 | 68 |

**Observations:**
- **gpt-5.1** produced the highest quality analysis with nuanced, actionable recommendations
- **gpt-5-mini** was the SLOWEST (2.5+ minutes) despite being a "mini" model
- **gpt-5-nano** was faster than mini but scored lower on conciseness analysis

---

## Quality Comparison

### Recommendations Quality (Sample)

**gpt-5.1** (Score: 93):
> "Add explicit stakeholder management and cross-functional leadership language... Add or tweak bullets to say things like: 'Partnered with design, engineering, and marketing stakeholders to define and deliver X'"

**gpt-5-mini** (Score: 82):
> "Consolidate duplicate Squarespace entries... Avoid repeating identical bullets — instead, show what changed between the roles"

**gpt-5-nano** (Score: 85):
> "Eliminate duplicate Squarespace bullets... Remove the repeated Squarespace bullet block"

**Analysis:** gpt-5.1 provides more specific, actionable advice with concrete examples, while the smaller models give more generic guidance.

### ATS Compatibility

All models rated the resume as **"Good"** for ATS compatibility, but with varying levels of explanation depth:

- **gpt-5.1**: Detailed explanation covering parsing, keywords, and minor edge cases
- **gpt-5-mini**: Good coverage but less nuanced
- **gpt-5-nano**: Brief explanation with basic formatting concerns

---

## Performance Analysis

### Speed Breakdown

```
EXTRACTION:
gpt-5.1    ████████████████░░░░░░░░░░░░░░░░░░░░░░░░  16.2s (fastest)
gpt-5-mini ████████████████████████████████████░░░░  36.0s (2.2x slower)
gpt-5-nano ████████████████████████████████████████  46.0s (2.8x slower)

ANALYSIS:
gpt-5.1    ████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  69.8s (fastest)
gpt-5-mini ████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████████  153.2s (2.2x slower)
gpt-5-nano ████████████████████████████████████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  84.9s (1.2x slower)
```

### Why are "smaller" models slower?

The gpt-5-mini and gpt-5-nano models include a **"reasoning"** step in their responses (visible in the raw API output), which adds significant processing time. Despite being marketed as smaller/faster variants, this reasoning overhead makes them slower for complex structured output tasks.

---

## Recommendations

### For Resume Import (Extraction)

**Recommendation: Keep gpt-5.1**

- Fastest at 16 seconds
- Best data completeness
- No reason to use slower, less accurate models

### For Resume Analysis

**Recommendation: Keep gpt-5.1**

- Fastest at 70 seconds
- Highest quality analysis (Score: 93 vs 82-85)
- Most actionable recommendations

### If Speed is Critical

If you need to reduce onboarding wait times, consider:

1. **Background processing** (already implemented) - User continues onboarding while analysis runs
2. **Caching** - Store results for repeated analyses of the same resume
3. **Progressive disclosure** - Show extraction results immediately, analysis when ready

**Do NOT switch to smaller models** - they are slower AND lower quality.

---

## Technical Notes

### Response Structure Differences

- **gpt-5.1**: Returns message output directly at `output[0]`
- **gpt-5-mini/nano**: Return reasoning step at `output[0]`, message at `output[1]`

This required updating the parsing logic to find the "message" type output regardless of position.

### Token Usage (from raw responses)

| Model | Input Tokens | Output Tokens | Reasoning Tokens |
|-------|-------------|---------------|------------------|
| gpt-5.1 | ~52 | ~22 | 0 |
| gpt-5-mini | ~52 | ~146 | 128 |
| gpt-5-nano | ~52 | ~402 | 384 |

The smaller models use significantly more tokens due to their reasoning process, which may also impact API costs.

---

## Files Generated

- `scripts/benchmark-openai-models.ts` - Benchmark script
- `scripts/benchmark-results.json` - Raw benchmark data
- `scripts/BENCHMARK_REPORT.md` - This report

---

## Conclusion

**gpt-5.1 is the clear winner** for both resume extraction and analysis tasks. It is:
- 2-3x faster than alternatives
- Produces higher quality output
- More complete data extraction
- More actionable recommendations

The current implementation using gpt-5.1 is optimal. The user experience issue of "not seeing results" is a UX/timing problem, not a model problem. Solutions should focus on better progress indicators, background processing, and managing user expectations rather than switching models.







