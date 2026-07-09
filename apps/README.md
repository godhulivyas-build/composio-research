# Apps

Input folder for the SaaS applications to be researched.

## Structure

- `apps.json` - List of SaaS applications to research

## Format

```json
[
  {
    "name": "Stripe",
    "description": "Payment processing platform"
  },
  {
    "name": "Salesforce",
    "description": "CRM and business cloud"
  }
]
```

## Usage

Place your list of 100 SaaS applications in `apps.json` before running the research pipeline.

```bash
npm run research
```
