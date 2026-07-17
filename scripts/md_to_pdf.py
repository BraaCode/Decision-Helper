#!/usr/bin/env python3
"""Convert business/*.md to PDF via styled HTML + headless Chromium."""
import os
import subprocess
import sys
import tempfile

import markdown

BUSINESS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "business")

CSS = """
@page { margin: 22mm 18mm 20mm 18mm; }
* { box-sizing: border-box; }
body {
  font-family: 'Segoe UI', 'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
  font-size: 11.5pt;
  line-height: 1.5;
  color: #1a2332;
  max-width: 760px;
  margin: 0 auto;
  padding: 0;
}
h1 {
  font-size: 26pt;
  color: #0d4d4d;
  margin: 0 0 6pt 0;
  padding-bottom: 8pt;
  border-bottom: 3px solid #0d4d4d;
  line-height: 1.2;
}
h2 {
  font-size: 17pt;
  color: #0d4d4d;
  margin: 26pt 0 8pt 0;
  padding-bottom: 4pt;
  border-bottom: 1px solid #c9d6d6;
  page-break-after: avoid;
}
h3 {
  font-size: 13.5pt;
  color: #166060;
  margin: 18pt 0 6pt 0;
  page-break-after: avoid;
}
h4 { font-size: 11.5pt; color: #333; margin: 12pt 0 4pt 0; }
p { margin: 6pt 0; }
ul, ol { margin: 6pt 0 6pt 0; padding-left: 22pt; }
li { margin: 3pt 0; }
strong { color: #0d3d3d; }
em { color: #444; }
hr {
  border: none;
  border-top: 1px solid #d0d0d0;
  margin: 18pt 0;
}
code {
  font-family: 'SF Mono', 'Consolas', 'Menlo', monospace;
  background: #f3f5f7;
  padding: 1pt 4pt;
  border-radius: 3pt;
  font-size: 10pt;
  color: #b0413e;
}
pre {
  background: #f6f8fa;
  padding: 10pt 12pt;
  border-radius: 6pt;
  overflow-x: auto;
  font-size: 10pt;
  line-height: 1.4;
  border: 1px solid #e1e4e8;
}
pre code { background: none; color: #1a2332; padding: 0; }
table {
  border-collapse: collapse;
  width: 100%;
  margin: 10pt 0 14pt 0;
  font-size: 10pt;
  page-break-inside: avoid;
}
th {
  background: #0d4d4d;
  color: #ffffff;
  text-align: left;
  padding: 7pt 9pt;
  font-weight: 600;
  border: 1px solid #0d4d4d;
}
td {
  padding: 6pt 9pt;
  border: 1px solid #c9d6d6;
  vertical-align: top;
}
tr:nth-child(even) td { background: #f5f9f9; }
blockquote {
  border-left: 4px solid #0d4d4d;
  margin: 10pt 0;
  padding: 4pt 14pt;
  color: #444;
  background: #f5f9f9;
  border-radius: 0 4pt 4pt 0;
}
a { color: #0d6d6d; text-decoration: none; }
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en" dir="ltr">
<head>
<meta charset="utf-8">
<style>{css}</style>
</head>
<body>
{body}
</body>
</html>
"""


def md_to_pdf(md_path: str, pdf_path: str) -> None:
    with open(md_path, "r", encoding="utf-8") as f:
        text = f.read()
    html_body = markdown.markdown(
        text,
        extensions=["tables", "fenced_code", "sane_lists", "attr_list", "nl2br"],
    )
    html = HTML_TEMPLATE.format(css=CSS, body=html_body)
    with tempfile.NamedTemporaryFile(
        "w", suffix=".html", delete=False, encoding="utf-8"
    ) as tf:
        tf.write(html)
        html_path = tf.name
    try:
        subprocess.run(
            [
                "chromium",
                "--headless=new",
                "--no-sandbox",
                "--disable-gpu",
                "--disable-dev-shm-usage",
                "--no-pdf-header-footer",
                "--print-to-pdf=" + pdf_path,
                "file://" + html_path,
            ],
            check=True,
            capture_output=True,
            timeout=120,
        )
    finally:
        os.unlink(html_path)


def main() -> int:
    if not os.path.isdir(BUSINESS_DIR):
        print(f"business dir not found: {BUSINESS_DIR}", file=sys.stderr)
        return 1
    files = sorted(f for f in os.listdir(BUSINESS_DIR) if f.endswith(".md"))
    if not files:
        print("no .md files in business/", file=sys.stderr)
        return 1
    for name in files:
        md_path = os.path.join(BUSINESS_DIR, name)
        pdf_path = os.path.join(BUSINESS_DIR, name[:-3] + ".pdf")
        print(f"Converting {name} -> {os.path.basename(pdf_path)} ...")
        md_to_pdf(md_path, pdf_path)
        size = os.path.getsize(pdf_path)
        print(f"  done ({size:,} bytes)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
