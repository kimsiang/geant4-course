"""Wrap the course pages (primer + week pages) in the learning-player shell.

What it does, on every page, idempotently:
  * an inline SVG icon sprite after <body>
  * a skip link and a sticky top bar (brand, week, week progress, language toggle)
    in place of the old one-line bar
  * a left navigator listing the page's items (sections) with type icon, time
    estimate and completion tick; on phones assets/course.js turns it into a drawer
  * each <section class="run"> becomes an item: id, data-type, data-min and a
    type pill above its macro command
  * a breadcrumb and a "Start / Continue" button in the hero
  * an end-of-week completion card before the pager (filled in by course.js)
It also writes assets/syllabus.js, which the course home uses for the syllabus,
time estimates and progress.

Item types and times:
  overview 3 min · reading = English words / 110 per minute (technical text, read
  with a pen) + 1.5 min per box, figure, table or equation + code lines / 30 · display 3 ·
  interactive 10 · quiz 1.5 per question · review 5 · share 5 ·
  lab = the week's stated study time minus everything else (at least 30 min).

Usage: python3 tools/shell.py [--out DIR] [pages...]   (default: primer, setup, week01..12)
"""
import html
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ------------------------------------------------------------------ manifest
JS = (ROOT / "assets/course.js").read_text(encoding="utf-8")
WEEKS = {}
for m in re.finditer(r"\{ n: (\d+), +stage: (\d+),.*?file: '([^']+)'.*?en: '([^']*)', zh: '([^']*)' \}", JS):
    WEEKS[int(m.group(1))] = dict(stage=int(m.group(2)), file=m.group(3), en=m.group(4), zh=m.group(5))
STAGES = {1: ("See it", "观测"), 2: ("Measure it", "度量"), 3: ("Understand it", "理解"), 4: ("Build it", "建造"), 5: ("Trust it", "信任")}

# study time for pages whose hero does not state one (Week 12: proposal, pilot run, rehearsal)
STUDY_MIN = {12: 240}
BRAND, BRAND_ZH = "From Track to Truth", "从径迹到真相"
BRAND_SUB, BRAND_SUB_ZH = "Geant4 muon simulation in 12 weeks", "12 周 Geant4 缪子模拟"

# start-here pages (no week number): file -> (progress key, title en, title zh)
SPECIAL = {
    "primer.html": ("primer", "Background primer", "入门背景"),
    "setup.html": ("setup", "Week 0 · Set up your computer", "第 0 周 · 配置你的电脑"),
}

TYPES = {  # en, zh, icon
    "overview": ("Overview", "概览", "overview"),
    "reading": ("Reading", "阅读", "reading"),
    "display": ("Event display", "事例显示", "display"),
    "interactive": ("Interactive", "交互", "interactive"),
    "lab": ("Hands-on lab", "动手实验", "lab"),
    "quiz": ("Practice quiz", "练习测验", "quiz"),
    "errors": ("Reading", "阅读", "errors"),
    "review": ("Checklist", "清单", "review"),
    "share": ("Share", "分享", "share"),
}

ICONS = {
    "overview": '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="0.9" fill="currentColor"/>',
    "reading": '<path d="M3 5.6C5.6 4.2 8.6 4.3 12 6.3c3.4-2 6.4-2.1 9-.7v13.2c-2.6-1.4-5.6-1.3-9 .7-3.4-2-6.4-2.1-9-.7z"/><path d="M12 6.3v13.2"/>',
    "display": '<path d="M12 2.8 20 7.3v9.4l-8 4.5-8-4.5V7.3z"/><path d="m4 7.3 8 4.5 8-4.5M12 11.8v9.4"/>',
    "interactive": '<path d="M4 6h9M17 6h3M4 12h3M11 12h9M4 18h11M19 18h1"/><circle cx="15" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="17" cy="18" r="2"/>',
    "lab": '<rect x="3" y="4.5" width="18" height="15" rx="2.5"/><path d="m7.5 9.5 3 2.5-3 2.5M12.5 15h4"/>',
    "quiz": '<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8v.4M12 16.8v.1"/>',
    "errors": '<path d="M12 3.8 21 19.5H3z"/><path d="M12 10v4.4M12 17v.1"/>',
    "review": '<path d="M10.5 6.5H20M10.5 12H20M10.5 17.5H20"/><path d="m4 6.5 1.4 1.4L8 5.3M4 12l1.4 1.4L8 10.8M4 17.5l1.4 1.4L8 16.3"/>',
    "share": '<circle cx="17.5" cy="5.5" r="2.5"/><circle cx="6.5" cy="12" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="m8.7 10.7 6.6-3.9M8.7 13.3l6.6 3.9"/>',
    "clock": '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    "check": '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    "arrow-r": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "arrow-l": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    "menu": '<path d="M4 7h16M4 12h16M4 17h16"/>',
    "close": '<path d="m6 6 12 12M18 6 6 18"/>',
    "chev": '<path d="m6 9 6 6 6-6"/>',
    "home": '<path d="M3.5 11 12 4l8.5 7"/><path d="M6 9.5V20h12V9.5"/>',
    "globe": '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.6 2.8 2.6 14.2 0 17M12 3.5c-2.6 2.8-2.6 14.2 0 17"/>',
    "play": '<path d="M8 5.5v13l10.5-6.5z"/>',
    "user": '<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20c1.3-3.8 4.2-5.5 7.5-5.5s6.2 1.7 7.5 5.5"/>',
    "flag": '<path d="M5.5 21V4M5.5 4.5h11l-2.2 4 2.2 4h-11"/>',
    "layers": '<path d="M12 3.5 21 8.5l-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
    "code": '<path d="m8.5 7-5 5 5 5M15.5 7l5 5-5 5"/>',
    "cap": '<path d="M2.5 9.5 12 5l9.5 4.5L12 14z"/><path d="M6.5 11.5v4.3c3.3 2.3 7.7 2.3 11 0v-4.3M21.5 9.5v5"/>',
    "lang": '<path d="M4 5h9M8.5 3v2c0 4-2 7-5 8.5M6 9c1.2 2 3.3 3.6 6 4.4"/><path d="m12.5 21 4-9 4 9M14 17.8h5"/>',
}
LOGO = ('<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="8" class="logo-bg"/>'
        '<path d="M5 25 15.5 15" class="logo-mu"/><path d="M15.5 15c3.5-3 7-5.6 11.5-6.5" class="logo-pos"/>'
        '<path d="M15.5 15c1.8 3.6 4.6 6.5 9 8.5" class="logo-neu"/><circle cx="15.5" cy="15" r="2.2" class="logo-v"/></svg>')


def sprite():
    syms = "".join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONS.items())
    return ('<!--shell:sprite--><svg class="sprite" aria-hidden="true" focusable="false" style="position:absolute;width:0;height:0;overflow:hidden">'
            + syms + '</svg><!--/shell:sprite-->')


def icon(name, cls="ic"):
    return f'<svg class="{cls}" aria-hidden="true" focusable="false"><use href="#i-{name}"/></svg>'


def bi(en, zh):
    return f'<span lang="en">{en}</span><span lang="zh-Hans">{zh}</span>'


def strip_tags(s):
    return html.unescape(re.sub(r"<[^>]+>", " ", s))


def cap1(s):
    return s[:1].upper() + s[1:] if s else s


# ------------------------------------------------------------------ classification
def classify(label_en):
    l = label_en.strip().lower()
    if l.startswith("learning goals"):
        return "overview"
    if l.startswith("background"):
        return "reading"
    if l.startswith("event display"):
        return "display"
    if l.startswith("interactive"):
        return "interactive"
    if l.startswith("hands-on"):
        return "lab"
    if l.startswith("self-check"):
        return "quiz"
    if l.startswith("common errors"):
        return "errors"
    if l.startswith("review"):
        return "review"
    if l.startswith("share"):
        return "share"
    return "reading"


def titles(kind, en, zh):
    """Navigator title for an item, from its macro-command label."""
    en, zh = en.strip(), zh.strip()
    fixed = {
        "overview": ("Overview and goals", "概览与目标"),
        "display": ("3D event display", "三维事例显示"),
        "quiz": ("Practice quiz", "练习测验"),
        "errors": ("Common errors", "常见错误"),
        "review": ("Review notes", "复习要点"),
    }
    if kind in fixed:
        return fixed[kind]
    if en.lower().startswith("background"):
        return ("Background", "背景知识")
    if kind == "share":
        return (cap1(en), zh)
    if kind == "interactive":
        rest_en = re.sub(r"^interactive( toy model)?\s*·?\s*", "", en, flags=re.I)
        rest_zh = re.sub(r"^(交互玩具模型|交互)\s*·?\s*", "", zh)
        return (("Interactive: " + rest_en) if rest_en else "Interactive toy model",
                ("交互：" + rest_zh) if rest_zh else "交互玩具模型")
    if kind == "lab":
        rest_en = re.sub(r"^hands-on\s*·?\s*", "", en, flags=re.I)
        rest_zh = re.sub(r"^动手(任务|实验)\s*·?\s*", "", zh)
        if rest_en.lower().startswith(("route", "check")):
            return (cap1(rest_en), rest_zh or "动手实验")
        return ("Hands-on: " + rest_en if rest_en else "Hands-on lab",
                "动手：" + rest_zh if rest_zh else "动手实验")
    # lesson "4.1 · the Bethe formula"
    m = re.match(r"^([\d.]+)\s*·\s*(.*)$", en)
    mz = re.match(r"^([\d.]+)\s*·\s*(.*)$", zh)
    if m:
        return (f"{m.group(1)} {cap1(m.group(2))}", f"{mz.group(1)} {mz.group(2)}" if mz else zh)
    return (cap1(en), zh)


def minutes(kind, body, nquiz):
    if kind == "overview":
        return 3
    if kind == "display":
        return 3
    if kind == "interactive":
        return 10
    if kind == "quiz":
        return max(5, round(1.5 * nquiz))
    if kind in ("review", "share"):
        return 5
    # reading: English words + code
    b = re.sub(r'<(\w+)[^>]*lang="zh-Hans"[^>]*>.*?</\1>', " ", body, flags=re.S)
    code = re.findall(r"<pre\b.*?</pre>", b, flags=re.S)
    lines = sum(c.count("\n") for c in code)
    b = re.sub(r"<pre\b.*?</pre>", " ", b, flags=re.S)
    b = re.sub(r"<script\b.*?</script>|<svg\b.*?</svg>", " ", b, flags=re.S)
    words = len(strip_tags(b).split())
    blocks = len(re.findall(r'class="(box|aside|fig-svg|evd-fig|fig|tbl|g4ex|eq)"', body))
    m = words / 110 + 1.5 * blocks + lines / 30
    if kind == "errors":
        m = min(m, 12)
    return max(3, int(round(m)))


def round5(m):
    return int(5 * round(m / 5)) if m >= 15 else m


def fmt_min(m):
    if m >= 60:
        m = 5 * round(m / 5)
    if m < 60:
        return f"{m} min"
    h, r = divmod(m, 60)
    return f"{h} h {r} min" if r else f"{h} h"


def fmt_min_zh(m):
    if m >= 60:
        m = 5 * round(m / 5)
    if m < 60:
        return f"{m} 分钟"
    h, r = divmod(m, 60)
    return f"{h} 小时 {r} 分钟" if r else f"{h} 小时"


# ------------------------------------------------------------------ page processing
SEC = re.compile(r'<section class="run[^"]*"([^>]*)>(.*?)</section>', re.S)
CMD = re.compile(r'<p class="cmd">(.*?)<span lang="en">(.*?)</span><span lang="zh-Hans">(.*?)</span></p>', re.S)


# Content-Security-Policy for the hosted course (GitHub Pages or any static host). It limits where
# a page may connect: this site plus the AI providers that assets/assistant.js may call with the
# student's own key (keep AI_HOSTS in sync with ALLOWED_HOSTS there). It is inserted by a tiny
# inline script so it is skipped inside the claude.ai preview, whose host adds its own scripts.
AI_HOSTS = ["api.anthropic.com", "api.deepseek.com", "api.moonshot.cn", "dashscope.aliyuncs.com",
            "open.bigmodel.cn", "api.siliconflow.cn", "api.openai.com", "openrouter.ai"]
CSP = ("default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; "
       "img-src 'self' data: blob:; font-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; "
       "form-action 'none'; connect-src 'self' " + " ".join("https://" + h for h in AI_HOSTS))


def csp_block():
    return ("<!--shell:csp--><script>(function(){if(/(^|\\.)(claude\\.ai|claudeusercontent\\.com)$/.test(location.hostname))return;"
            "var m=document.createElement('meta');m.httpEquiv='Content-Security-Policy';m.content=\"" + CSP + "\";"
            "document.head.appendChild(m);})();</script><!--/shell:csp-->")


def add_csp(text):
    text = re.sub(r"<!--shell:csp-->.*?<!--/shell:csp-->\n?", "", text, flags=re.S)
    return text.replace('<meta charset="utf-8">', '<meta charset="utf-8">\n' + csp_block(), 1)


def add_assistant(text):
    text = re.sub(r'<script src="assets/assistant\.js"></script>\n?', "", text)
    return text.replace('<script src="assets/course.js"></script>\n', '<script src="assets/course.js"></script>\n<script src="assets/assistant.js"></script>\n', 1)


def process(name, out_dir):
    path = ROOT / name
    text = path.read_text(encoding="utf-8")
    special = SPECIAL.get(name)
    is_primer = special is not None          # primer and setup: start-here pages, no week number
    wk = 0 if is_primer else int(re.search(r"week(\d+)", name).group(1))
    key = special[0] if is_primer else f"w{wk:02d}"

    nquiz = 0
    js = ROOT / f"assets/week{wk:02d}.js"
    if wk and js.exists():
        nquiz = js.read_text(encoding="utf-8").count("prompt:")

    # stated study time (hero meta "≈ 2.5 h")
    mt = re.search(r"<b>≈ ([\d.]+) h</b>", text)
    total = int(round(float(mt.group(1)) * 60)) if mt else STUDY_MIN.get(wk)

    # ---- collect items
    items = []
    for m in SEC.finditer(text):
        attrs, body = m.group(1), m.group(2)
        c = CMD.search(body)
        if not c:
            continue
        kind = classify(strip_tags(c.group(2)))
        lab_id = re.search(r'aria-labelledby="([^"]+)"', attrs)
        old_id = re.search(r'\bid="([^"]+)"', attrs)
        sid = old_id.group(1) if old_id else "s-" + (lab_id.group(1)[2:] if lab_id else str(len(items)))
        t_en, t_zh = titles(kind, html.unescape(strip_tags(c.group(2))), html.unescape(strip_tags(c.group(3))))
        fixed = re.search(r'data-min-set="(\d+)"', attrs)
        items.append(dict(id=sid, kind=kind, en=t_en, zh=t_zh, min=int(fixed.group(1)) if fixed else minutes(kind, body, nquiz),
                          fixed=bool(fixed), span=m.span()))
    if not items:
        raise SystemExit(f"{name}: no items found")
    labs = [it for it in items if it["kind"] == "lab" and not it["fixed"]]  # data-min-set="N" pins an item's time
    if total and labs:
        rest = sum(it["min"] for it in items if it not in labs)
        each = max(30, (total - rest) / len(labs))
        for it in labs:
            it["min"] = int(round5(each))
    for it in items:
        it["min"] = round5(it["min"])
    sum_min = sum(it["min"] for it in items)

    # ---- rewrite sections (from the end so spans stay valid)
    for i in range(len(items) - 1, -1, -1):
        it = items[i]
        a, b = it["span"]
        sec = text[a:b]
        m = SEC.match(sec)
        attrs = m.group(1)
        attrs = re.sub(r'\s(id|data-type|data-min|data-item)="[^"]*"', "", attrs)
        typ = TYPES[it["kind"]]
        tag = (f'<p class="item-tag">{icon(typ[2])}<span class="t">{bi(typ[0], typ[1])}</span>'
               f'<span class="d">{bi(fmt_min(it["min"]), fmt_min_zh(it["min"]))}</span></p>')
        body = re.sub(r'<p class="item-tag">.*?</p>\s*', "", m.group(2), flags=re.S)
        body = body.replace('<p class="cmd">', tag + '\n    <p class="cmd">', 1)
        new = f'<section class="run item" id="{it["id"]}" data-type="{it["kind"]}" data-min="{it["min"]}"{attrs}>{body}</section>'
        text = text[:a] + new + text[b:]

    # ---- download link for the week's code, at the top of the (first) lab
    text = re.sub(r"<!--shell:dl-->.*?<!--/shell:dl-->\s*", "", text, flags=re.S)
    if wk and labs and (ROOT / "code" / f"week{wk:02d}").is_dir():
        dl = ('<!--shell:dl--><p class="dl"><a class="btn-s" href="downloads/week%02d-code.zip" download>' % wk + icon("code") +
              bi("Download all files for this lab (zip)", "下载本实验的全部文件（zip）") + '</a>'
              '<a class="dl-all" href="downloads/geant4-course-code.zip" download>' + bi("all weeks", "全部周次") + '</a></p><!--/shell:dl-->\n      ')
        m = re.search(r'<section class="run item" id="%s"[^>]*>.*?</h2>\s*' % re.escape(labs[0]["id"]), text, flags=re.S)
        if m:
            text = text[:m.end()] + dl + text[m.end():]

    # ---- titles for top bar / crumbs
    if is_primer:
        w_en, w_zh = special[1], special[2]
        crumb_en, crumb_zh = "Start here", "从这里开始"
        week_en, week_zh = "Start here", "从这里开始"
    else:
        W = WEEKS[wk]
        w_en, w_zh = W["en"], W["zh"]
        s_en, s_zh = STAGES[W["stage"]]
        crumb_en, crumb_zh = f"Stage {W['stage']} · {s_en}", f"第 {W['stage']} 阶段 · {s_zh}"
        week_en, week_zh = f"Week {wk} of 12", f"第 {wk} / 12 周"

    # ---- hero stage chip: bilingual stage name
    if not is_primer:
        st = WEEKS[wk]["stage"]
        chip = (f'<li class="stage"><b>{st} · <span lang="en">{STAGES[st][0]}</span><span lang="zh-Hans">{STAGES[st][1]}</span></b>'
                '<span lang="en">stage</span><span lang="zh-Hans">阶段</span></li>')
        text = re.sub(r'<li class="stage">.*?</li>', lambda _: chip, text, count=1, flags=re.S)

    # ---- self-hosted fonts instead of Google Fonts (blocked or slow in mainland China)
    text = re.sub(r'<link rel="preconnect" href="https://fonts\.(googleapis|gstatic)\.com"[^>]*>\n?', "", text)
    text = re.sub(r'<link rel="stylesheet" href="https://fonts\.googleapis\.com/[^"]*">\n?', "", text)
    if 'assets/fonts/fonts.css' not in text:
        text = text.replace('<link rel="stylesheet" href="assets/course.css">',
                            '<link rel="stylesheet" href="assets/fonts/fonts.css">\n<link rel="stylesheet" href="assets/course.css">', 1)

    # ---- sprite
    text = re.sub(r"\n*<!--shell:sprite-->.*?<!--/shell:sprite-->", "", text, flags=re.S)
    text = re.sub(r"<body>\n*", lambda _: "<body>\n" + sprite() + "\n", text, count=1)

    # ---- top bar
    langs = ('<span class="lang" role="group" aria-label="Language / 语言">'
             '<button type="button" data-setlang="en" id="lang-en">EN</button>'
             '<button type="button" data-setlang="zh" id="lang-zh">中文</button>'
             '<button type="button" data-setlang="both" id="lang-both">EN+中</button></span>')
    top = ('<!--shell:top--><a class="skip" href="#main">' + bi("Skip to content", "跳到正文") + '</a>\n'
           '<header class="topbar"><div class="tb-in">'
           '<button type="button" class="nav-toggle" aria-controls="nav" aria-expanded="false">' + icon("menu") +
           '<span class="sr">' + bi("Open the item list", "打开目录") + '</span></button>'
           '<a class="brand" href="index.html">' + LOGO + '<b class="wm">' + bi(BRAND, BRAND_ZH) + '</b></a>'
           '<span class="tb-week">' + bi(week_en, week_zh) + '<span class="tb-title">' + bi(w_en, w_zh) + '</span></span>'
           f'<span class="tb-prog" data-prog="{key}" aria-hidden="true"><span class="pbar"><i></i></span><span class="pn"></span></span>'
           + langs + '</div></header><!--/shell:top-->')
    # the old bar (first run) or a previous top (re-run)
    if "<!--shell:top-->" in text:
        text = re.sub(r"<!--shell:top-->.*?<!--/shell:top-->", lambda _: top, text, flags=re.S)
    else:
        text, n = re.subn(r'<div class="wrap">\s*<div class="bar">.*?</div>\s*\n', lambda _: top + '\n<div class="player">\n', text, count=1, flags=re.S)
        if not n:
            raise SystemExit(f"{name}: old bar not found")

    # ---- navigator
    lis = []
    for it in items:
        typ = TYPES[it["kind"]]
        lis.append(f'<li><a href="#{it["id"]}" data-item="{it["id"]}">{icon(typ[2])}'
                   f'<span class="t">{bi(html.escape(it["en"], quote=False), html.escape(it["zh"], quote=False))}'
                   f'<small>{bi(typ[0] + " · " + fmt_min(it["min"]), typ[1] + " · " + fmt_min_zh(it["min"]))}</small></span>'
                   f'<span class="tick" aria-hidden="true">{icon("check")}</span></a></li>')
    nav = ('<!--shell:nav--><nav class="nav" id="nav" aria-label="Items on this page / 本页目录">'
           '<div class="nav-in">'
           '<a class="nav-home" href="index.html">' + icon("arrow-l") + bi("Course home", "课程主页") + '</a>'
           '<p class="nav-week">' + bi(week_en if is_primer else f"Week {wk} · {crumb_en.split(' · ')[1]}",
                                       week_zh if is_primer else f"第 {wk} 周 · {crumb_zh.split(' · ')[1]}") + '</p>'
           '<p class="nav-title">' + bi(w_en, w_zh) + '</p>'
           f'<div class="nav-prog" data-prog="{key}"><span class="pbar"><i></i></span><span class="pn"></span></div>'
           '<ol class="nav-items">' + "".join(lis) + '</ol>'
           '<p class="nav-total">' + icon("clock") + bi(f"About {fmt_min(sum_min)} in total", f"共约 {fmt_min_zh(sum_min)}") + '</p>'
           '</div></nav><div class="nav-scrim" hidden></div>\n<main id="main" tabindex="-1">\n<!--/shell:nav-->')
    if "<!--shell:nav-->" in text:
        text = re.sub(r"<!--shell:nav-->.*?<!--/shell:nav-->", lambda _: nav, text, flags=re.S)
    else:
        text = text.replace('<div class="player">\n', '<div class="player">\n' + nav + "\n", 1)

    # ---- Blender cover banner before the breadcrumb (media/brand/<key>.webp, 800 px variant for phones)
    text = re.sub(r"<!--shell:cover-->.*?<!--/shell:cover-->\s*", "", text, flags=re.S)
    cover = ""
    if (ROOT / f"media/brand/{key}.webp").exists():
        num = "00" if key == "setup" else ("μ" if key == "primer" else f"{wk:02d}")
        cover = (f'<!--shell:cover--><figure class="wk-cover" aria-hidden="true"><img src="media/brand/{key}.webp" '
                 f'srcset="media/brand/{key}-800.webp 800w, media/brand/{key}.webp 1600w" sizes="(max-width: 900px) 100vw, 1100px" '
                 f'alt="" width="1600" height="640" decoding="async" fetchpriority="high"><span class="wk-cover-n">{num}</span></figure><!--/shell:cover-->')
    text = re.sub(r"<title>(.*?)(?: · From Track to Truth)?</title>", lambda m: f"<title>{m.group(1)} · {BRAND}</title>", text, count=1)
    # ---- social preview
    text = re.sub(r"<!--shell:og-->.*?<!--/shell:og-->\n?", "", text, flags=re.S)
    og = (f'<!--shell:og--><meta property="og:title" content="{html.escape(w_en)} · {BRAND}">'
          f'<meta property="og:image" content="media/brand/{key}.webp"><meta name="theme-color" content="#060B16"><!--/shell:og-->\n')
    text = text.replace('<link rel="stylesheet" href="assets/fonts/fonts.css">', og + '<link rel="stylesheet" href="assets/fonts/fonts.css">', 1)

    # ---- breadcrumb before the hero
    crumbs = ('<!--shell:crumbs--><nav class="crumbs" aria-label="Breadcrumb / 路径"><a href="index.html">' + bi(BRAND, BRAND_ZH) +
              '</a><span aria-hidden="true">›</span><span>' + bi(crumb_en, crumb_zh) + '</span><span aria-hidden="true">›</span>'
              '<span aria-current="page">' + bi(w_en if is_primer else f"Week {wk}", w_zh if is_primer else f"第 {wk} 周") + '</span></nav><!--/shell:crumbs-->')
    text = re.sub(r"<!--shell:crumbs-->.*?<!--/shell:crumbs-->\s*", "", text, flags=re.S)
    text = re.sub(r'(\s*)(<section class="hero")', lambda m: m.group(1) + cover + (m.group(1) if cover else "") + crumbs + m.group(1) + m.group(2), text, count=1)

    # ---- hero call to action (after the meta list, or after the lede)
    cta = ('<!--shell:cta--><div class="hero-cta">'
           f'<a class="btn-p" href="#{items[0]["id"]}" data-resume="{key}">' + bi("Start", "开始") + icon("arrow-r") + '</a>'
           + (f'<a class="btn-s" href="#{labs[0]["id"]}">' + icon("lab") + bi("Go to the lab", "直接去实验") + '</a>' if labs else '') +
           '<span class="hero-sum">' + icon("clock") + bi(f"{len(items)} items · about {fmt_min(sum_min)}", f"{len(items)} 项 · 约 {fmt_min_zh(sum_min)}") + '</span>'
           '</div><!--/shell:cta-->')
    text = re.sub(r"<!--shell:cta-->.*?<!--/shell:cta-->\s*", "", text, flags=re.S)
    hero = re.search(r'<section class="hero".*?</section>', text, flags=re.S)
    h = hero.group(0)
    if '<ul class="meta">' in h:
        h2 = re.sub(r'(<ul class="meta">.*?</ul>)', lambda m: m.group(1) + "\n      " + cta, h, count=1, flags=re.S)
    else:
        h2 = re.sub(r'(<p class="lede" lang="zh-Hans">.*?</p>)', lambda m: m.group(1) + "\n      " + cta, h, count=1, flags=re.S)
    text = text.replace(h, h2, 1)

    # ---- completion card before the pager (weeks) / before the footer (primer)
    done = (f'<!--shell:done--><section class="wk-done" id="s-complete" data-key="{key}" data-week="{wk}" aria-labelledby="h-complete">'
            '<h2 id="h-complete" class="bi">' + bi("Your progress on this page", "本页学习进度") + '</h2>'
            '<div class="wk-done-body"></div></section><!--/shell:done-->')
    text = re.sub(r"<!--shell:done-->.*?<!--/shell:done-->\s*", "", text, flags=re.S)
    anchor = '<nav class="pager"' if '<nav class="pager"' in text else "<footer>"
    text = text.replace(anchor, done + "\n\n  " + anchor, 1)

    # ---- close main/player instead of the old .wrap
    if "<!--shell:end-->" not in text:
        text, n = re.subn(r"(</footer>\s*)</div>(\s*<script)", r"\1</main>\n</div><!--shell:end-->\2", text, count=1)
        if not n:
            raise SystemExit(f"{name}: could not close the player")
    text = text.replace('<html lang="en">', '<html lang="en" class="has-player">', 1) if 'class="has-player"' not in text else text

    # keep blank lines between sections stable when other tools re-insert blocks
    text = re.sub(r"(</section>|-->)\n{3,}", r"\1\n\n", text)
    text = add_assistant(add_csp(text))
    (out_dir / name).write_text(text, encoding="utf-8")
    return dict(key=key, week=wk, file=name, en=w_en, zh=w_zh, total=sum_min,
                items=[dict(id=it["id"], type=it["kind"], en=it["en"], zh=it["zh"], min=it["min"]) for it in items])


def main():
    args = sys.argv[1:]
    out = ROOT
    if args[:1] == ["--out"]:
        out = Path(args[1]); args = args[2:]
    pages = args or ["primer.html", "setup.html"] + [f"week{i:02d}.html" for i in range(1, 13)]
    syl = {}
    for p in pages:
        r = process(p, out)
        syl[r["key"]] = r
        print(f'{p:13s} {len(r["items"]):2d} items  {fmt_min(r["total"]):>11s}  ' + " ".join(f'{i["type"][:3]}{i["min"]}' for i in r["items"]))
    # the course home carries the same icon sprite
    for home in [out / "index.html"] if (out / "index.html").exists() else []:
        t = home.read_text(encoding="utf-8")
        if "<!--shell:sprite-->" in t:
            t = re.sub(r"<!--shell:sprite-->.*?<!--/shell:sprite-->", lambda _: sprite(), t, flags=re.S)
        home.write_text(add_csp(t), encoding="utf-8")
    if len(pages) >= 13:
        (out / "assets").mkdir(exist_ok=True)
        (out / "assets/syllabus.js").write_text(
            "/* Generated by tools/shell.py: items, types and time estimates of every page. Do not edit by hand. */\n"
            "window.G4C_SYLLABUS = " + json.dumps(syl, ensure_ascii=False, indent=1) + ";\n", encoding="utf-8")


if __name__ == "__main__":
    main()
