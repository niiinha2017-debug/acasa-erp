#!/usr/bin/env python
from __future__ import annotations

from pathlib import Path
import datetime
import re

ROOT = Path(__file__).resolve().parent.parent

GRADLE_FILES = [
    ROOT / "frontend" / "android" / "app" / "build.gradle",
    ROOT / "frontend-ponto" / "android" / "app" / "build.gradle",
]

HTML_FILE = ROOT / "aplicativo-site" / "index.html"


def bump_version_code(text: str) -> tuple[str, int]:
    pattern = re.compile(r"^\s*versionCode\s+(\d+)\s*$", re.M)
    m = pattern.search(text)
    if not m:
        raise ValueError("versionCode not found")
    current = int(m.group(1))
    new = current + 1
    new_text = pattern.sub(f"    versionCode {new}", text, count=1)
    return new_text, new


def update_cache_buster(text: str, stamp: str) -> str:
    # Replace any ?v=YYYYMMDD-N pattern with the new stamp
    return re.sub(r"\?v=\d{8}-\d+", f"?v={stamp}", text)


def main() -> int:
    new_codes = []
    for path in GRADLE_FILES:
        raw = path.read_text(encoding="utf-8")
        updated, new_code = bump_version_code(raw)
        if updated != raw:
            path.write_text(updated, encoding="utf-8")
        new_codes.append((path, new_code))

    stamp = datetime.datetime.now().strftime("%Y%m%d-1")
    if HTML_FILE.exists():
        html_raw = HTML_FILE.read_text(encoding="utf-8")
        html_updated = update_cache_buster(html_raw, stamp)
        if html_updated != html_raw:
            HTML_FILE.write_text(html_updated, encoding="utf-8")

    print("Bumped versionCode:")
    for path, code in new_codes:
        print(f"- {path}: {code}")
    print(f"Updated cache buster to ?v={stamp} in {HTML_FILE}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
