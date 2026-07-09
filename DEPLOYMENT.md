# Deployment Guide

## Live Deployment Options

### Option 1: Netlify (Recommended - Easiest)

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=.
```

Netlify will generate a live URL. Copy this and share it with reviewers.

### Option 2: GitHub Pages

1. Push to GitHub
2. Go to Settings > Pages
3. Select "Deploy from a branch"
4. Choose `main` branch
5. GitHub generates a live URL: `https://yourusername.github.io/composio-research`

### Option 3: Vercel

```bash
npm install -g vercel
vercel --prod
```

## Files to Deploy

```
composio-research/
├── case-study.html          # Main deliverable
├── index.html               # Dashboard alternative
├── output/
│   ├── research.json        # 100 apps researched
│   ├── verification.json    # Verification results
│   ├── final_findings.json  # Confidence scored
│   └── analysis.json        # Pattern analysis
├── src/
│   ├── agents/              # Research & verification agents
│   ├── pipeline/            # 4-stage pipeline
│   └── utils/               # Helper functions
├── scripts/
│   └── llm_inference.py     # Rule-based extraction (no API)
├── README.md                # Setup instructions
└── package.json             # Dependencies
```

## Live Verification

After deploying:
1. Open the live URL
2. Scroll to see patterns, methodology, and verification
3. Search the data table for any app (try "Slack", "Stripe", "GitHub")
4. Check blockers section and auth distribution charts

The page should load instantly with all data embedded (no server needed).
