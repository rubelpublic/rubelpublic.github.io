"""Build the Thoughts blog.

Write a post as Markdown in thoughts/_posts/<slug>.md (copy an existing one for the format), then run:

    python tools/build_thoughts.py

It (re)generates:
  thoughts/<slug>/index.html   each post: SEO meta, Open Graph, BlogPosting + FAQPage + Breadcrumb JSON-LD
  thoughts/<slug>/og.jpg       share image per post
  thoughts/index.html          the Thoughts index (Blog JSON-LD)
  thoughts/feed.xml            RSS feed
  sitemap.xml                  all pages with lastmod
  llms.txt                     "Thoughts" section for AI assistants
  index.html                   "Latest thoughts" strip between <!-- THOUGHTS:START --> / <!-- THOUGHTS:END -->
Requires: pip install markdown pillow
"""
import html, json, os, re, sys
from datetime import date
from email.utils import format_datetime
from datetime import datetime, timezone
import markdown

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://rubelpublic.github.io'
POSTS_DIR = os.path.join(ROOT, 'thoughts', '_posts')
PERSON_ID = SITE + '/#person'
AUTHOR = {
    'name': 'Rapar Rubel', 'real': 'Rubel Miah',
    'bio': 'Independent AI expert and AI workflow builder in Dhaka, Bangladesh. I build AI agents, automation and AI-powered content that work in Bangla, Banglish and English — and test them inside my own ventures.',
    'links': [('Portfolio', SITE + '/'), ('Facebook', 'https://www.facebook.com/rapar.rubel'), ('Instagram', 'https://www.instagram.com/rapar.rubel/'),
              ('X', 'https://x.com/raparrubel1'), ('GitHub', 'https://github.com/rubelpublic')],
}
esc = lambda s: html.escape(s, quote=True)


# ---------------- parsing ----------------
def parse(path):
    raw = open(path, encoding='utf-8').read()
    m = re.match(r'^---\n(.*?)\n---\n(.*)$', raw, re.S)
    if not m:
        sys.exit(f'{path}: missing --- front matter ---')
    meta, body = {'tldr': [], 'faq': []}, m.group(2)
    for line in m.group(1).splitlines():
        if not line.strip():
            continue
        k, _, v = line.partition(':')
        k, v = k.strip(), v.strip()
        if k == 'tldr':
            meta['tldr'].append(v)
        elif k == 'faq':
            q, _, a = v.partition('::')
            meta['faq'].append((q.strip(), a.strip()))
        else:
            meta[k] = v
    for need in ('title', 'slug', 'description', 'date'):
        if need not in meta:
            sys.exit(f'{path}: front matter needs "{need}"')
    meta['tags'] = [t.strip() for t in meta.get('tags', '').split(',') if t.strip()]
    meta.setdefault('updated', meta['date'])
    md = markdown.Markdown(extensions=['extra', 'toc', 'sane_lists'])
    meta['html'] = md.convert(body)
    words = len(re.findall(r'\w+', re.sub(r'<[^>]+>', ' ', meta['html'])))
    meta['words'], meta['minutes'] = words, max(1, round(words / 220))
    meta['url'] = f"{SITE}/thoughts/{meta['slug']}/"
    if len(meta['description']) > 160:
        print(f"  ! {meta['slug']}: description is {len(meta['description'])} chars (aim for <= 160)")
    return meta


def nice_date(d):
    return datetime.strptime(d, '%Y-%m-%d').strftime('%-d %B %Y') if os.name != 'nt' else datetime.strptime(d, '%Y-%m-%d').strftime('%d %B %Y').lstrip('0')


# ---------------- shared page parts ----------------
THEME_JS = "<script>try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}catch(e){}</script>"
SUN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>'


def head(title, desc, url, image, extra_ld, og_type='article', published=None, modified=None, tags=()):
    art = ''
    if og_type == 'article':
        art = (f'<meta property="article:published_time" content="{published}">\n<meta property="article:modified_time" content="{modified}">\n'
               f'<meta property="article:author" content="{SITE}/">\n' + ''.join(f'<meta property="article:tag" content="{esc(t)}">\n' for t in tags))
    return f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<meta name="author" content="Rapar Rubel (Rubel Miah)">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
<link rel="alternate" type="application/rss+xml" title="Thoughts by Rapar Rubel" href="{SITE}/thoughts/feed.xml">
<meta name="theme-color" content="#0D1B1E" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F6F1E7" media="(prefers-color-scheme: light)">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Rapar Rubel">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
{art}<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@raparrubel1">
<meta name="twitter:creator" content="@raparrubel1">
<meta name="twitter:title" content="{esc(title)}">
<meta name="twitter:description" content="{esc(desc)}">
<meta name="twitter:image" content="{image}">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/bricolage-grotesque-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/thoughts/thoughts.css">
{THEME_JS}
<script type="application/ld+json">
{json.dumps(extra_ld, ensure_ascii=False, indent=1)}
</script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<div class="read-bar" aria-hidden="true"></div>
<header class="t-hud">
  <a class="home" href="/" aria-label="Rapar Rubel — portfolio home"><img src="/assets/mark.png" alt="" width="97" height="74"><span class="mono">Rapar Rubel</span></a>
  <nav class="t-nav mono" aria-label="Main">
    <a href="/" class="hide-sm">Portfolio</a><a href="/thoughts/"{' aria-current="page"' if og_type == 'website' else ''}>Thoughts</a><a href="/#contact" class="cta">Contact</a>
    <button type="button" class="theme-btn" id="theme-btn" aria-label="Toggle dark or light mode">{SUN}</button>
  </nav>
</header>
'''


FOOT = f'''<footer>
  <p>© {date.today().year} Rubel Miah · Rapar Rubel · Rubel Public — AI expert &amp; AI workflow builder, Dhaka, Bangladesh</p>
  <p><a href="/">Portfolio</a> · <a href="/thoughts/">Thoughts</a> · <a href="/thoughts/feed.xml">RSS</a> · <a href="/#contact">Contact</a></p>
</footer>
<script>
(function(){{
  var r=document.documentElement,b=document.getElementById('theme-btn');
  var light=function(){{return r.dataset.theme?r.dataset.theme==='light':matchMedia('(prefers-color-scheme: light)').matches;}};
  b.addEventListener('click',function(){{var n=light()?'dark':'light';r.dataset.theme=n;try{{localStorage.setItem('theme',n)}}catch(e){{}}}});
  var bar=document.querySelector('.read-bar'),a=document.querySelector('article.post');
  if(a&&bar){{var f=function(){{var t=a.getBoundingClientRect(),h=t.height-innerHeight;bar.style.transform='scaleX('+Math.min(1,Math.max(0,-t.top/(h>0?h:1)))+')';}};addEventListener('scroll',f,{{passive:true}});f();}}
}})();
</script>
</body>
</html>
'''


def person_ld():
    return {'@type': 'Person', '@id': PERSON_ID, 'name': 'Rubel Miah', 'alternateName': ['Rapar Rubel', 'Rubel Public'], 'url': SITE + '/',
            'jobTitle': 'AI Expert & AI Workflow Builder', 'image': SITE + '/assets/portrait.jpg',
            'sameAs': [u for n, u in AUTHOR['links'] if n != 'Portfolio']}


def card(p, level='h3'):
    return (f'<a class="card" href="/thoughts/{p["slug"]}/"><span class="mono">{nice_date(p["date"])} · {p["minutes"]} min read</span>'
            f'<{level}>{esc(p["title"])}</{level}><p>{esc(p["description"])}</p></a>')


# ---------------- pages ----------------
def build_post(p, posts):
    others = [o for o in posts if o['slug'] != p['slug']]
    others.sort(key=lambda o: (-len(set(o['tags']) & set(p['tags'])), o['date']), reverse=False)
    related = others[:3]
    image = f"{SITE}/thoughts/{p['slug']}/og.jpg"
    ld = {'@context': 'https://schema.org', '@graph': [
        person_ld(),
        {'@type': 'BlogPosting', '@id': p['url'] + '#post', 'headline': p['title'], 'description': p['description'], 'image': image,
         'datePublished': p['date'], 'dateModified': p['updated'], 'author': {'@id': PERSON_ID}, 'publisher': {'@id': PERSON_ID},
         'mainEntityOfPage': p['url'], 'url': p['url'], 'inLanguage': 'en', 'articleSection': 'Thoughts', 'keywords': ', '.join(p['tags']),
         'wordCount': p['words'], 'timeRequired': f"PT{p['minutes']}M", 'isPartOf': {'@id': SITE + '/thoughts/#blog'},
         'abstract': ' '.join(p['tldr'])},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Rapar Rubel', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Thoughts', 'item': SITE + '/thoughts/'},
            {'@type': 'ListItem', 'position': 3, 'name': p['title'], 'item': p['url']}]},
    ]}
    if p['faq']:
        ld['@graph'].append({'@type': 'FAQPage', '@id': p['url'] + '#faq', 'mainEntity': [
            {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in p['faq']]})
    title = f"{p['title']} | Rapar Rubel"
    out = head(title, p['description'], p['url'], image, ld, 'article', p['date'], p['updated'], p['tags'])
    tldr = ''.join(f'<li>{esc(t)}</li>' for t in p['tldr'])
    faq = ''.join(f'<details class="qa"><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in p['faq'])
    links = ' '.join(f'<a href="{u}" rel="me noopener"{" target=_blank" if "rubelpublic.github.io" not in u else ""}>{n}</a>' for n, u in AUTHOR['links'])
    out += f'''<main id="main">
<p class="crumbs"><a href="/">Rapar Rubel</a> › <a href="/thoughts/">Thoughts</a> › <span aria-current="page">{esc(p["title"])}</span></p>
<article class="post">
  <h1>{esc(p["title"])}</h1>
  <p class="meta">By <b><a href="/" rel="author">Rapar Rubel</a></b> (Rubel Miah) · <time datetime="{p["date"]}">{nice_date(p["date"])}</time>{f' · updated <time datetime="{p["updated"]}">{nice_date(p["updated"])}</time>' if p["updated"] != p["date"] else ''} · {p["minutes"]} min read</p>
  <ul class="tags">{''.join(f"<li>{esc(t)}</li>" for t in p["tags"])}</ul>
  <section class="tldr" aria-labelledby="tldr-h"><h2 id="tldr-h">Short answer</h2><ul>{tldr}</ul></section>
  {p["html"]}
  {f'<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">Quick answers</h2>{faq}</section>' if faq else ''}
  <aside class="author" aria-labelledby="author-h"><img src="/assets/portrait-600.webp" alt="Rapar Rubel (Rubel Miah)" width="72" height="72" loading="lazy">
    <div><h2 id="author-h">Rapar Rubel <span class="mono" style="color:var(--muted)">· Rubel Miah</span></h2><p>{esc(AUTHOR["bio"])}</p><div class="links">{links}</div></div></aside>
</article>
<section class="related" aria-labelledby="rel-h"><h2 id="rel-h">Keep reading</h2><div class="cards">{''.join(card(o) for o in related)}</div></section>
<section class="cta"><h2>Have a question about AI for your business?</h2><p>Ask my AI agent Paloan, or send me a short brief.</p>
  <a class="btn btn-primary" href="/#paloan">Ask Paloan →</a><a class="btn btn-ghost" href="/#brief">Send a brief</a></section>
</main>
''' + FOOT
    d = os.path.join(ROOT, 'thoughts', p['slug'])
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
    og_image(p, os.path.join(d, 'og.jpg'))


def build_index(posts):
    url = SITE + '/thoughts/'
    desc = 'Thoughts by Rapar Rubel (Rubel Miah), AI expert and AI workflow builder in Bangladesh: AI agents, Banglish AI, content strategy and building with AI.'
    ld = {'@context': 'https://schema.org', '@graph': [
        person_ld(),
        {'@type': 'Blog', '@id': url + '#blog', 'name': 'Thoughts by Rapar Rubel', 'url': url, 'description': desc, 'inLanguage': 'en',
         'author': {'@id': PERSON_ID}, 'publisher': {'@id': PERSON_ID},
         'blogPost': [{'@type': 'BlogPosting', 'headline': p['title'], 'url': p['url'], 'datePublished': p['date'], 'dateModified': p['updated'],
                       'description': p['description'], 'author': {'@id': PERSON_ID}} for p in posts]},
        {'@type': 'BreadcrumbList', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Rapar Rubel', 'item': SITE + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': 'Thoughts', 'item': url}]},
    ]}
    out = head('Thoughts — Rapar Rubel on AI agents, Banglish AI & content', desc, url, SITE + '/assets/og-image.jpg', ld, 'website')
    out += f'''<main id="main">
<p class="crumbs"><a href="/">Rapar Rubel</a> › <span aria-current="page">Thoughts</span></p>
<h1>Thoughts</h1>
<p class="lede">My thinking process, written down. I'm <strong>Rapar Rubel</strong> (Rubel Miah), an independent <strong>AI expert and AI workflow builder in Bangladesh</strong>. Here I write about building AI agents, AI that speaks Bangla and Banglish, audience-first content, and what I learn shipping real products. <a class="rss" href="/thoughts/feed.xml">RSS feed</a></p>
<div class="cards">{''.join(card(p, 'h2') for p in posts)}</div>
</main>
''' + FOOT
    open(os.path.join(ROOT, 'thoughts', 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)


def build_feed(posts):
    items = ''.join(f'''  <item>
    <title>{esc(p["title"])}</title>
    <link>{p["url"]}</link>
    <guid isPermaLink="true">{p["url"]}</guid>
    <pubDate>{format_datetime(datetime.strptime(p["date"], "%Y-%m-%d").replace(hour=9, tzinfo=timezone.utc))}</pubDate>
    <dc:creator>Rapar Rubel (Rubel Miah)</dc:creator>
    <description>{esc(p["description"])}</description>
{''.join(f"    <category>{esc(t)}</category>" + chr(10) for t in p["tags"])}  </item>
''' for p in posts)
    feed = f'''<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
<channel>
  <title>Thoughts by Rapar Rubel</title>
  <link>{SITE}/thoughts/</link>
  <atom:link href="{SITE}/thoughts/feed.xml" rel="self" type="application/rss+xml"/>
  <description>AI agents, Banglish AI, audience-first content and building with AI — by Rapar Rubel (Rubel Miah), AI expert and AI workflow builder in Bangladesh.</description>
  <language>en</language>
{items}</channel>
</rss>
'''
    open(os.path.join(ROOT, 'thoughts', 'feed.xml'), 'w', encoding='utf-8', newline='\n').write(feed)


def build_sitemap(posts):
    newest = max(p['updated'] for p in posts)
    rows = [(SITE + '/', newest, '1.0'), (SITE + '/thoughts/', newest, '0.9'), (SITE + '/cv/', '2026-10-07', '0.7')]
    rows += [(p['url'], p['updated'], '0.8') for p in posts]
    xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
        f'  <url><loc>{u}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>\n' for u, d, pr in rows) + '</urlset>\n'
    open(os.path.join(ROOT, 'sitemap.xml'), 'w', encoding='utf-8', newline='\n').write(xml)


def between(text, start, end, new):
    i, j = text.find(start), text.find(end)
    if i < 0 or j < 0:
        return None
    return text[:i + len(start)] + new + text[j:]


def build_llms(posts):
    p = os.path.join(ROOT, 'llms.txt')
    s = open(p, encoding='utf-8').read()
    block = '\n## Thoughts (blog)\n' + ''.join(f'- [{q["title"]}]({q["url"]}): {q["description"]}\n' for q in posts)
    r = between(s, '<!-- THOUGHTS -->', '<!-- /THOUGHTS -->', block)
    s = r if r is not None else s.rstrip() + '\n\n<!-- THOUGHTS -->' + block + '<!-- /THOUGHTS -->\n'
    open(p, 'w', encoding='utf-8', newline='\n').write(s)


def build_home_strip(posts):
    p = os.path.join(ROOT, 'index.html')
    s = open(p, encoding='utf-8').read()
    cards = ''.join(f'''
      <article class="reveal project-card"><span class="num mono">{nice_date(q["date"])} · {q["minutes"]} min read</span><h3><a href="/thoughts/{q["slug"]}/">{esc(q["title"])}</a></h3><p>{esc(q["description"])}</p><a class="go" href="/thoughts/{q["slug"]}/">Read →</a></article>''' for q in posts[:3])
    block = f'''
  <section class="project-index" id="thoughts" data-scene="Thoughts">
    <p class="mono" data-scramble>Thoughts · latest writing</p>
    <h2>How I think, written down.</h2>
    <div class="project-grid">{cards}
    </div>
    <p><a class="btn btn-ghost" href="/thoughts/">All thoughts →</a></p>
  </section>
  '''
    r = between(s, '<!-- THOUGHTS:START -->', '<!-- THOUGHTS:END -->', block)
    if r is None:
        sys.exit('index.html is missing the <!-- THOUGHTS:START --> / <!-- THOUGHTS:END --> markers')
    open(p, 'w', encoding='utf-8', newline='').write(r)


def og_image(p, path):
    try:
        from PIL import Image, ImageDraw, ImageFont, ImageFilter
    except ImportError:
        return
    W, H = 1200, 630
    bg = Image.new('RGB', (W, H), (13, 27, 30))
    glow = Image.new('RGB', (W, H), (13, 27, 30)); g = ImageDraw.Draw(glow)
    g.ellipse((700, -200, 1500, 600), fill=(70, 58, 140)); g.ellipse((-300, 300, 500, 1000), fill=(120, 84, 26))
    bg = Image.blend(bg, glow.filter(ImageFilter.GaussianBlur(160)), .6)
    d = ImageDraw.Draw(bg)
    F = 'C:/Windows/Fonts/' if os.name == 'nt' else '/usr/share/fonts/truetype/dejavu/'
    def font(name, size, fallback='DejaVuSans-Bold.ttf'):
        for n in (name, fallback):
            try: return ImageFont.truetype(F + n, size)
            except OSError: pass
        return ImageFont.load_default()
    mono, big, small = font('consola.ttf', 24, 'DejaVuSansMono.ttf'), font('segoeuib.ttf', 64), font('segoeui.ttf', 28, 'DejaVuSans.ttf')
    d.text((72, 70), 'THOUGHTS · RAPAR RUBEL', font=mono, fill=(240, 168, 48))
    words, lines, cur = p['title'].split(), [], ''
    for w in words:
        t = (cur + ' ' + w).strip()
        if d.textlength(t, font=big) > W - 160: lines.append(cur); cur = w
        else: cur = t
    lines.append(cur)
    y = 140
    for ln in lines[:4]:
        d.text((70, y), ln, font=big, fill=(237, 230, 216)); y += 78
    d.text((72, H - 110), 'AI expert & AI workflow builder · Dhaka, Bangladesh', font=small, fill=(147, 166, 164))
    d.text((72, H - 70), 'rubelpublic.github.io/thoughts', font=small, fill=(240, 168, 48))
    bg.save(path, quality=86)


def main():
    files = sorted(f for f in os.listdir(POSTS_DIR) if f.endswith('.md'))
    posts = [parse(os.path.join(POSTS_DIR, f)) for f in files]
    posts.sort(key=lambda p: (p['date'], p['title']), reverse=True)
    for p in posts:
        build_post(p, posts)
    build_index(posts); build_feed(posts); build_sitemap(posts); build_llms(posts); build_home_strip(posts)
    print(f'Built {len(posts)} posts:')
    for p in posts:
        print(f"  /thoughts/{p['slug']}/  ({p['minutes']} min, {len(p['description'])}-char description)")


if __name__ == '__main__':
    main()
