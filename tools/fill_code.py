"""Fill every <pre ... data-src="path"> ... </pre> in the given HTML pages with the
HTML-escaped contents of that file, so the code shown on a page is always the code
in code/weekNN/ that was compiled and run. Idempotent.

Usage: python3 tools/fill_code.py week02.html [more pages]
"""
import html
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PAT = re.compile(r'(<pre\b[^>]*\bdata-src="([^"]+)"[^>]*>)(.*?)(</pre>)', re.S)


def fill(page):
    p = ROOT / page
    text = p.read_text(encoding="utf-8")

    def rep(m):
        src = (ROOT / m.group(2)).read_text(encoding="utf-8").rstrip("\n")
        return m.group(1) + html.escape(src, quote=False) + m.group(4)

    new, n = PAT.subn(rep, text)
    p.write_text(new, encoding="utf-8")
    print(f"{page}: filled {n} code blocks")


if __name__ == "__main__":
    for page in sys.argv[1:]:
        fill(page)
