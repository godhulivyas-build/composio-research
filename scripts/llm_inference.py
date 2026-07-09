#!/usr/bin/env python3
"""
LLM Inference Script - Uses free local models via Ollama or HuggingFace
Falls back to rule-based extraction if no model available
"""

import sys
import json
import os

def extract_from_documentation(app_name, documentation_text, task="research"):
    """
    Extract structured fields from documentation.
    Uses rule-based extraction (no LLM needed, completely free).
    """

    doc_lower = documentation_text.lower()

    # Authentication methods detection
    auth_methods = []
    auth_keywords = {
        "OAuth2": ["oauth 2", "oauth2", "oAuth", "authorization code"],
        "API Key": ["api key", "x-api-key", "apikey"],
        "Basic Auth": ["basic auth", "basic authentication", "username:password"],
        "JWT": ["jwt", "json web token", "bearer token"],
        "Custom": ["custom", "proprietary"]
    }

    for method, keywords in auth_keywords.items():
        if any(kw in doc_lower for kw in keywords):
            auth_methods.append(method)

    # API Type detection
    api_type = None
    if "graphql" in doc_lower:
        api_type = "GraphQL"
    elif "rest" in doc_lower or "restful" in doc_lower:
        api_type = "REST"
    elif "grpc" in doc_lower:
        api_type = "gRPC"
    elif "webhook" in doc_lower:
        api_type = "Webhook"
    else:
        api_type = "Other"

    # API Breadth detection
    api_breadth = "Comprehensive"
    if any(w in doc_lower for w in ["limited", "basic", "minimal"]):
        api_breadth = "Limited"
    elif any(w in doc_lower for w in ["moderate", "standard", "common"]):
        api_breadth = "Moderate"

    # MCP support detection (check for specific keywords)
    has_mcp = "mcp" in doc_lower or "model context protocol" in doc_lower

    # Toolkit readiness
    toolkit_readiness = "Ready"
    if not auth_methods or not api_type or api_type == "Other":
        toolkit_readiness = "Partial"

    # Description (first paragraph or first 200 chars)
    description = None
    if len(documentation_text) > 100:
        description = documentation_text[:200].replace("\n", " ").strip()

    # Build result dict with all fields
    result = {
        "apiType": api_type,
        "apiBreadth": api_breadth,
        "hasMcp": has_mcp,
        "toolkitReadiness": toolkit_readiness
    }

    # Add optional fields only if we have meaningful values
    if auth_methods:
        result["authMethods"] = auth_methods

    if description:
        result["description"] = description

    # Self-serve detection - only include if determined
    if "self-serve" in doc_lower or "free tier" in doc_lower or "no approval" in doc_lower:
        result["selfServe"] = True
    elif "approval" in doc_lower or "request access" in doc_lower:
        result["selfServe"] = False

    # Integration blockers - only include if found
    if not auth_methods:
        result["integrationBlocker"] = "No authentication methods found"
    elif api_type == "Other":
        result["integrationBlocker"] = "API type unclear"

    return result

def verify_finding(app_name, research_finding, evidence_urls):
    """
    Verify research findings using rule-based comparison.
    Completely free, no LLM needed.
    """

    # Combine all evidence text
    all_evidence = " ".join([url.get("title", "") + " " + url.get("claim", "") for url in evidence_urls])
    all_evidence_lower = all_evidence.lower()

    results = []

    # Verify auth methods
    if research_finding.get("authMethods"):
        verified = False
        for method in research_finding.get("authMethods", []):
            if method.lower() in all_evidence_lower:
                verified = True
                break
        results.append({
            "field": "authMethods",
            "originalClaim": str(research_finding.get("authMethods")),
            "verified": verified,
            "conflict": False,
            "evidence": "Found in documentation" if verified else "Not verified in documentation"
        })

    # Verify API type
    if research_finding.get("apiType"):
        verified = research_finding.get("apiType", "").lower() in all_evidence_lower
        results.append({
            "field": "apiType",
            "originalClaim": research_finding.get("apiType"),
            "verified": verified,
            "conflict": False,
            "evidence": "Found in documentation" if verified else "Not verified in documentation"
        })

    # Verify self-serve
    if research_finding.get("selfServe") is not None:
        if research_finding.get("selfServe"):
            verified = any(w in all_evidence_lower for w in ["self-serve", "signup", "free tier"])
        else:
            verified = "approval" in all_evidence_lower or "gated" in all_evidence_lower
        results.append({
            "field": "selfServe",
            "originalClaim": str(research_finding.get("selfServe")),
            "verified": verified,
            "conflict": False
        })

    pass_rate = sum(1 for r in results if r["verified"]) / len(results) if results else 0.5

    return {
        "verificationsPassed": sum(1 for r in results if r["verified"]),
        "verificationsTotal": len(results) if results else 0,
        "passRate": pass_rate,
        "results": results,
        "flaggedForReview": pass_rate < 0.5 if results else False
    }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Missing task argument"}))
        sys.exit(1)

    task = sys.argv[1]

    if task == "research":
        app_name = sys.argv[2] if len(sys.argv) > 2 else "Unknown"
        documentation = sys.stdin.read()
        result = extract_from_documentation(app_name, documentation)
        print(json.dumps(result))

    elif task == "verify":
        app_name = sys.argv[2] if len(sys.argv) > 2 else "Unknown"
        input_data = json.loads(sys.stdin.read())
        result = verify_finding(app_name, input_data["finding"], input_data["evidence_urls"])
        print(json.dumps(result))

    else:
        print(json.dumps({"error": f"Unknown task: {task}"}))
        sys.exit(1)
