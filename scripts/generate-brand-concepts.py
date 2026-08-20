#!/usr/bin/env python3
"""Generate Briefly NewsStream brand concept illustrations via Google Gemini image models.

Uses GOOGLE_API_KEY from the environment (or dotenv .env / .env.live).
Arabic-first prompts. Brand palette: deep indigo + cyan teal (not GoDaddy purple).

Example:
  set -a && source .env && set +a
  python scripts/generate-brand-concepts.py
"""

from __future__ import annotations

import base64
import json
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "public" / "concepts"
LOGO = ROOT / "public" / "brand" / "logo-mark.png"

MODELS = [
    "gemini-2.5-flash-image",
    "gemini-2.0-flash-preview-image-generation",
]

JOBS = [
    {
        "slug": "concept-ar-first-desk",
        "prompt": (
            "Premium SaaS marketing collage for Briefly NewsStream. "
            "Photoreal Arabic-speaking woman product lead with tablet, soft indigo panel on white, "
            "floating squircle UI badges. Brand colors: deep indigo, cyan teal, white, navy. "
            "Arabic-first badges: ثنائي اللغة and أثر السوق ACTIVE. Tiny stacked news-card B mark. "
            "No city names. No other brand logos. No neon purple AI glow."
        ),
    },
    {
        "slug": "concept-floating-stream",
        "prompt": (
            "Wide 16:9 SaaS banner. Soft indigo-to-cyan wavy blob on white. "
            "Floating squircles: news stream cards, ع/EN, impact dial, JSON braces, abstract globe. "
            "Bottom indigo pill: البث مباشر then Live stream. Professional B2B. No countdown. No WordPress."
        ),
    },
]


def load_key() -> str:
    key = os.environ.get("GOOGLE_API_KEY", "").strip()
    if key:
        return key
    for name in (".env", ".env.live", ".env.vercel"):
        path = ROOT / name
        if not path.exists():
            continue
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("GOOGLE_API_KEY="):
                return line.split("=", 1)[1].strip().strip('"').strip("'")
    return ""


def generate(model: str, key: str, prompt: str, logo_b64: str) -> bytes | None:
    url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={key}"
    body = {
        "contents": [
            {
                "parts": [
                    {"text": prompt},
                    {"inline_data": {"mime_type": "image/png", "data": logo_b64}},
                ]
            }
        ],
        "generationConfig": {"responseModalities": ["TEXT", "IMAGE"]},
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(body).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=180) as resp:
        data = json.loads(resp.read().decode("utf-8"))
    parts = data.get("candidates", [{}])[0].get("content", {}).get("parts", [])
    for part in parts:
        inline = part.get("inlineData") or part.get("inline_data")
        if inline and inline.get("data"):
            return base64.b64decode(inline["data"])
    return None


def main() -> int:
    key = load_key()
    if not key:
        print("GOOGLE_API_KEY is not set", file=sys.stderr)
        return 2
    OUT.mkdir(parents=True, exist_ok=True)
    logo_b64 = base64.b64encode(LOGO.read_bytes()).decode("ascii")
    for job in JOBS:
        saved = False
        for model in MODELS:
            try:
                raw = generate(model, key, job["prompt"], logo_b64)
                if not raw:
                    print(f"no image from {model} for {job['slug']}")
                    continue
                path = OUT / f"{job['slug']}.png"
                path.write_bytes(raw)
                print(f"saved {path} via {model}")
                saved = True
                break
            except urllib.error.HTTPError as err:
                print(f"fail {model}: HTTP {err.code}")
            except Exception as err:  # noqa: BLE001
                print(f"fail {model}: {err}")
        if not saved:
            print(f"FAILED {job['slug']}", file=sys.stderr)
            return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
