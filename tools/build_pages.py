"""Build the hand-written landing pages: the AI workflow automation service page,
the Bangla homepage (/bn/) and the case studies under /work/.

Usage:  python tools/build_pages.py      (no extra packages needed)

The page text lives in this file. The Person details (name, alternate names,
profile links) are read from the JSON-LD in index.html, so the new pages always
match the homepage. After editing a page here, bump its date in STATIC_PAGES,
run this script, then run tools/build_thoughts.py (it writes the sitemap and
llms-full.txt, which include these pages).
"""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://rubelpublic.github.io'
PERSON_ID = SITE + '/#person'

# (path, last modified, sitemap priority). build_thoughts.py reads this list for the sitemap.
STATIC_PAGES = [
    ('/services/ai-workflow-automation-bangladesh/', '2026-11-28', '0.9'),
    ('/courses/ai-power-user/', '2026-11-28', '0.8'),
    ('/lab/hand-particles/', '2026-11-28', '0.6'),
    ('/bn/', '2026-11-24', '0.9'),
    ('/work/proyojon-shop/', '2026-11-24', '0.7'),
    ('/work/cap-on-head/', '2026-11-24', '0.7'),
]
DATES = {p: d for p, d, _ in STATIC_PAGES}
E = html.escape


def home_person():
    """The Person node from index.html, trimmed to what every page needs."""
    s = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
    for block in re.findall(r'<script type="application/ld\+json">(.*?)</script>', s, re.S):
        for node in json.loads(block).get('@graph', []):
            if node.get('@id') == PERSON_ID:
                keep = ('@type', '@id', 'name', 'alternateName', 'url', 'image', 'jobTitle', 'sameAs')
                return {k: node[k] for k in keep if k in node}
    raise SystemExit('index.html has no Person node with @id ' + PERSON_ID)


PERSON = home_person()
SOCIAL = [(label, url) for label, url in [
    ('Facebook', 'https://www.facebook.com/rapar.rubel'), ('Instagram', 'https://www.instagram.com/rapar.rubel/'),
    ('X', 'https://x.com/raparrubel1'), ('GitHub', 'https://github.com/rubelpublic')] if url in PERSON.get('sameAs', [])]


def crumbs_ld(items):
    return {'@type': 'BreadcrumbList', 'itemListElement': [
        {'@type': 'ListItem', 'position': i + 1, 'name': n, 'item': u} for i, (n, u) in enumerate(items)]}


def faq_ld(url, faqs):
    return {'@type': 'FAQPage', '@id': url + '#faq', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': a}} for q, a in faqs]}


def faq_html(faqs, title='Quick answers'):
    qa = ''.join(f'<details class="qa"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in faqs)
    return f'<section class="faq" aria-labelledby="faq-h"><h2 id="faq-h">{title}</h2>{qa}</section>'


THEME_BTN = ('<button type="button" class="theme-btn" id="theme-btn" aria-label="Toggle dark or light mode"><svg viewBox="0 0 24 24" fill="none" '
             'stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 '
             '1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg></button>')


def page(path, *, lang='en', title, desc, og_type='website', graph, crumbs, body, nav, footer, extra_head='', alternates=None):
    url = SITE + path
    alt = ''.join(f'<link rel="alternate" hreflang="{h}" href="{u}">\n' for h, u in (alternates or []))
    ld = json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False, indent=1)
    trail = ' › '.join(f'<a href="{u.replace(SITE, "") or "/"}">{E(n)}</a>' for n, u in crumbs[:-1])
    trail += f' › <span aria-current="page">{E(crumbs[-1][0])}</span>'
    bn = lang == 'bn'
    out = f'''<!doctype html>
<html lang="{lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}">
<meta name="author" content="Rapar Rubel (Rubel Miah)">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="{url}">
{alt}<link rel="alternate" type="application/rss+xml" title="Thoughts by Rapar Rubel" href="{SITE}/thoughts/feed.xml">
<meta name="theme-color" content="#0D1B1E" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#F6F1E7" media="(prefers-color-scheme: light)">
<meta property="og:type" content="{og_type}">
<meta property="og:site_name" content="Rapar Rubel">
<meta property="og:title" content="{E(title)}">
<meta property="og:description" content="{E(desc)}">
<meta property="og:url" content="{url}">
<meta property="og:image" content="{SITE}/assets/og-image.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:locale" content="{'bn_BD' if bn else 'en_US'}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:site" content="@raparrubel1">
<meta name="twitter:creator" content="@raparrubel1">
<meta name="twitter:title" content="{E(title)}">
<meta name="twitter:description" content="{E(desc)}">
<meta name="twitter:image" content="{SITE}/assets/og-image.jpg">
<link rel="icon" type="image/png" sizes="48x48" href="/assets/favicon-48.png">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/bricolage-grotesque-400-latin.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/fonts/fonts.css">
<link rel="stylesheet" href="/thoughts/thoughts.css">
<style>.t-nav a{{white-space:nowrap}}@media (max-width:420px){{.t-nav{{gap:12px}}}}</style>
{extra_head}<script>try{{var t=localStorage.getItem('theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t;}}catch(e){{}}</script>
<script type="application/ld+json">
{ld}
</script>
</head>
<body>
<a class="skip" href="#main">{'মূল লেখায় যান' if bn else 'Skip to content'}</a>
<header class="t-hud">
  <a class="home" href="{'/bn/' if bn else '/'}" aria-label="Rapar Rubel — {'হোম' if bn else 'portfolio home'}"><img src="/assets/mark.png" alt="" width="97" height="74"><span class="mono">Rapar Rubel</span></a>
  <nav class="t-nav mono" aria-label="Main">
    {nav}
    {THEME_BTN}
  </nav>
</header>
<main id="main">
<p class="crumbs">{trail}</p>
{body}
</main>
<footer>
  {footer}
</footer>
<script>
(function(){{
  var r=document.documentElement,b=document.getElementById('theme-btn');
  var light=function(){{return r.dataset.theme?r.dataset.theme==='light':matchMedia('(prefers-color-scheme: light)').matches;}};
  b.addEventListener('click',function(){{var n=light()?'dark':'light';r.dataset.theme=n;try{{localStorage.setItem('theme',n)}}catch(e){{}}}});
}})();
</script>
</body>
</html>
'''
    d = os.path.join(ROOT, path.strip('/'))
    os.makedirs(d, exist_ok=True)
    open(os.path.join(d, 'index.html'), 'w', encoding='utf-8', newline='\n').write(out)
    print('  ' + path)


EN_NAV = ('<a href="/services/ai-workflow-automation-bangladesh/" class="hide-sm">Services</a><a href="/thoughts/">Thoughts</a>'
          '<a href="/bn/" lang="bn" hreflang="bn">বাংলা</a><a href="/#contact" class="cta">Contact</a>')
EN_FOOT = '''<p>© 2026 Rubel Miah · Rapar Rubel · Rubel Public — AI expert &amp; AI workflow builder, Dhaka, Bangladesh</p>
  <p><a href="/">Portfolio</a> · <a href="/services/ai-workflow-automation-bangladesh/">AI workflow automation</a> · <a href="/courses/ai-power-user/">AI course in Bangla</a> · <a href="/work/proyojon-shop/">Proyojon Shop case study</a> · <a href="/work/cap-on-head/">CAP ON HEAD case study</a> · <a href="/thoughts/">Thoughts</a> · <a href="/bn/" lang="bn">বাংলা</a> · <a href="/#contact">Contact</a></p>'''
AUTHOR = ('<aside class="author" aria-labelledby="author-h"><img src="/assets/portrait-600.webp" alt="Rapar Rubel (Rubel Miah)" width="72" height="72" loading="lazy">'
          '<div><h2 id="author-h">Rapar Rubel <span class="mono" style="color:var(--muted)">· Rubel Miah</span></h2><p>Independent AI expert and AI workflow builder in Dhaka, '
          'Bangladesh. I build AI agents, automation and AI-powered content that work in Bangla, Banglish and English — and test them inside my own ventures.</p>'
          '<div class="links"><a href="/" rel="me">Portfolio</a> ' + ' '.join(f'<a href="{u}" rel="me noopener" target=_blank>{n}</a>' for n, u in SOCIAL) + '</div></div></aside>')


def services():
    p = '/services/ai-workflow-automation-bangladesh/'
    url = SITE + p
    faqs = [
        ('What is AI workflow automation?', 'AI workflow automation means designing a system where AI handles a repeatable business task from start to finish, such as reading incoming messages, sorting them, drafting replies and updating records, while a person checks the decisions that matter.'),
        ('Can the AI understand and reply in Banglish?', 'Yes. Every agent Rapar Rubel builds is designed and tested with real customer messages in Bangla, Banglish and English, including spelling variations, and replies in the language the customer used.'),
        ('What is a good first workflow to automate?', 'Pick a task that is repetitive, happens many times a week and has a clear right answer. Answering your 20 most common customer questions, or sorting incoming enquiries by type and urgency, are typical first workflows.'),
        ('What should a business not automate?', "Anything where a wrong answer is expensive and nobody is watching: pricing promises, legal advice, refunds, or anything involving a customer's money or documents. AI can prepare that work, but a person should make the final call."),
        ('Who builds AI workflows for businesses in Bangladesh?', 'Rapar Rubel (Rubel Miah), also known as Rubel AI, is an independent AI expert and AI workflow builder in Dhaka who designs AI agents and workflow automation for founders, SMEs and teams, in Bangla, Banglish and English.'),
        ('How much does an AI chatbot or automation cost in Bangladesh?', 'It depends on channels, connections and language. Bangladeshi AI agencies listed on Clutch and DesignRush in November 2026 start at about $1,000 per project; a small first version on one channel can cost less. Rapar Rubel scopes each project after seeing your real customer messages.'),
        ('Can you build a chatbot for my Facebook Page?', 'Yes. A Facebook Page AI chatbot can answer Bangla, Banglish and English inbox messages, collect order details and hand unusual conversations to your team with a summary. The same approach works for WhatsApp and website chat.'),
        ('How do I start a project with Rapar Rubel?', 'Send a short brief through the form on rubelpublic.github.io, email rubel.public@gmail.com, or call or WhatsApp +880 1676-464807. Describe one task that repeats every day and he will reply with how he would approach it.'),
    ]
    trail = [('Rapar Rubel', SITE + '/'), ('Services', url), ('AI workflow automation', url)]
    graph = [PERSON,
             {'@type': 'Service', '@id': url + '#service', 'name': 'AI workflow automation for Bangladeshi businesses',
              'serviceType': 'AI workflow automation, AI chatbot and AI agent development', 'url': url,
              'description': 'AI agents and workflow automation that read customer messages in Bangla, Banglish and English, sort enquiries, draft replies and content, and hand important decisions to a person.',
              'provider': {'@id': PERSON_ID}, 'brand': {'@id': SITE + '/#service'}, 'areaServed': {'@type': 'Country', 'name': 'Bangladesh'},
              'availableLanguage': ['bn', 'en'], 'audience': {'@type': 'BusinessAudience', 'audienceType': 'Founders, SMEs and teams'}},
             {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': 'AI Automation & AI Chatbots in Bangladesh | Rapar Rubel',
              'inLanguage': 'en', 'isPartOf': {'@id': SITE + '/#website'}, 'about': {'@id': url + '#service'}, 'dateModified': DATES[p]},
             crumbs_ld(trail), faq_ld(url, faqs)]
    body = f'''<article class="post">
  <h1>AI Automation &amp; AI Chatbots for Bangladeshi Businesses</h1>
  <p class="lede">I build AI agents and automations that read customer messages in Bangla, Banglish and English, answer common questions, sort enquiries and draft content — with a person checking every decision that matters.</p>
  <section class="tldr" aria-labelledby="tldr-h"><h2 id="tldr-h">Short answer</h2><ul>
    <li>I'm Rapar Rubel (Rubel Miah), an independent AI expert and AI workflow builder in Dhaka.</li>
    <li>I automate one repeatable task at a time: customer questions, enquiry intake, content drafts, finding files.</li>
    <li>Every system is built around the exact words your customers type — Bangla, Banglish or English.</li>
    <li>Most projects start with one list: your 20 most-asked customer questions.</li></ul></section>
  <h2 id="what-can-ai-automate">What can AI automate in your business?</h2>
  <p>A business is full of small jobs that repeat every day. These are the ones I usually start with:</p>
  <ul>
    <li><strong>Customer questions.</strong> An agent that answers price, size, delivery and availability questions in the customer's own language — "dam koto?", "Dhaka te delivery kobe?" — and passes anything unusual to your team.</li>
    <li><strong>Enquiry intake.</strong> The system gathers the customer's problem, context and documents, classifies the request by type and urgency, and lists what's missing before a person picks it up.</li>
    <li><strong>Content drafts.</strong> AI drafts several caption or post options in the right language and brand voice; a person picks and polishes the best one.</li>
    <li><strong>Finding information.</strong> Ask for a file or a record the way you'd ask a colleague, in any of the three languages.</li>
  </ul>
  <h2 id="ai-chatbots">AI chatbots for Facebook Page, WhatsApp and website</h2>
  <p>Most Bangladeshi customers message a business before they buy — usually on its Facebook Page. I build AI chatbots that answer those messages in <strong>Bangla, Banglish and English</strong>: price, size, stock, delivery and payment questions, order details collected into your sheet, and a clean hand-off to your team for anything unusual.</p>
  <ul>
    <li><a href="/thoughts/facebook-page-ai-chatbot-bangladesh/">How a Facebook Page AI chatbot works</a> (and the <a href="/thoughts/facebook-page-chatbot-bangla/" lang="bn">বাংলা গাইড</a>)</li>
    <li><a href="/thoughts/ai-chatbot-cost-in-bangladesh/">How much an AI chatbot costs in Bangladesh</a></li>
    <li><a href="/thoughts/ai-agency-vs-freelancer-bangladesh/">AI agency, freelancer or independent builder: how to choose</a></li>
  </ul>
  <h2 id="real-examples">What does this look like in real work?</h2>
  <ul>
    <li><strong>Proyojon Solutions</strong> — for this legal and business advisory concept I designed an AI-assisted intake: <em>problem → context → documents</em>, then <em>matter type → urgency → required files</em>, before a professional is assigned.</li>
    <li><strong><a href="https://mimai.onrender.com">MimAI</a></strong> — an AI file assistant I designed and built with Claude Code. It finds files in the user's own Google Drive from questions in Bangla, Banglish or English. <a href="/thoughts/building-mimai-with-claude-code/">How I built it</a>.</li>
    <li><strong>Paloan</strong> — my own AI agent for audience research, content drafts, planning and workflows. A guide version <a href="/#paloan">answers questions on my portfolio</a>.</li>
  </ul>
  <h2 id="how-a-project-runs">How does a project run?</h2>
  <ol>
    <li><strong>Map one workflow on paper</strong> — trigger, understand, decide, act, check.</li>
    <li><strong>Build a small working version</strong> and test it with real messages from your business, not invented ones.</li>
    <li><strong>Run it alongside your team</strong> before it handles anything on its own.</li>
    <li><strong>Pick the next workflow</strong> once the first one is reliable.</li>
  </ol>
  <p>I explain the five parts of a workflow in <a href="/thoughts/what-an-ai-workflow-builder-does/">What Does an AI Workflow Builder Actually Do?</a></p>
  <h2 id="what-not-to-automate">What I won't automate</h2>
  <p>Anything where a wrong answer is expensive and nobody is watching: pricing promises, legal advice, refunds, a customer's money or documents. AI can <strong>prepare</strong> that work; a person makes the final call.</p>
  <h2 id="who-its-for">Who is this for?</h2>
  <p>Founders, SMEs and teams in Bangladesh whose customers write the way they talk — in retail, fashion, property, travel and services. If your inbox is full of Banglish, an English-only chatbot will miss most of it. (<a href="/thoughts/ai-that-speaks-banglish/">Why I build AI that speaks Banglish</a>.)</p>
  <h2 id="training">Want your team to do it themselves?</h2>
  <p>I also teach <strong><a href="/courses/ai-power-user/">AI Power User</a></strong>, a practical AI course in Bangla: 10 classes, 18–20 hours, about 70% hands-on, from beginner to intermediate. Every module ends with something built, tested or automated.</p>
  {faq_html(faqs)}
  {AUTHOR}
</article>
<section class="cta"><h2>Have one task that repeats every day?</h2><p>Tell me what it is. I'll reply with how I'd automate it.</p>
  <a class="btn btn-primary" href="/#brief">Send a brief →</a><a class="btn btn-ghost" href="https://wa.me/8801676464807">WhatsApp</a></section>'''
    page(p, title='AI Automation & AI Chatbots in Bangladesh | Rapar Rubel',
         desc='AI chatbots and workflow automation for Bangladeshi businesses, built to understand Bangla, Banglish and English. By Rapar Rubel, AI workflow builder in Dhaka.',
         graph=graph, crumbs=trail, body=body, nav=EN_NAV, footer=EN_FOOT)


def case(slug, name, title, desc, h1, lede, facts, sections, site_url, faqs):
    p = f'/work/{slug}/'
    url = SITE + p
    trail = [('Rapar Rubel', SITE + '/'), ('Work', SITE + '/#projects'), (name, url)]
    graph = [PERSON,
             {'@type': 'Article', '@id': url + '#article', 'headline': h1, 'description': desc, 'url': url, 'mainEntityOfPage': url,
              'author': {'@id': PERSON_ID}, 'publisher': {'@id': PERSON_ID}, 'datePublished': DATES[p], 'dateModified': DATES[p],
              'inLanguage': 'en', 'image': SITE + '/assets/og-image.jpg', 'about': {'@type': 'Organization', 'name': name, 'url': site_url}},
             crumbs_ld(trail), faq_ld(url, faqs)]
    facts_html = ''.join(f'<li><b>{E(k)}:</b> {v}</li>' for k, v in facts)
    body = f'''<article class="post">
  <h1>{E(h1)}</h1>
  <p class="meta">Case study by <b><a href="/" rel="author">Rapar Rubel</a></b> (Rubel Miah)</p>
  <p class="lede">{lede}</p>
  <section class="tldr" aria-labelledby="tldr-h"><h2 id="tldr-h">At a glance</h2><ul>{facts_html}</ul></section>
  {sections}
  {faq_html(faqs)}
  {AUTHOR}
</article>
<section class="cta"><h2>Want the same thinking for your brand?</h2><p>Send a short brief and I'll reply with how I'd approach it.</p>
  <a class="btn btn-primary" href="/#brief">Send a brief →</a><a class="btn btn-ghost" href="/services/ai-workflow-automation-bangladesh/">AI workflow automation</a></section>'''
    page(p, og_type='article', title=title, desc=desc, graph=graph, crumbs=trail, body=body, nav=EN_NAV, footer=EN_FOOT)


def case_studies():
    case('proyojon-shop', 'Proyojon Shop',
         'Proyojon Shop Case Study: Retail & E-commerce | Rapar Rubel',
         'How Rapar Rubel built Proyojon Shop, a China-to-Bangladesh retail and import business, and its online store proyojon.shop: pricing, categories and content.',
         'Proyojon Shop: Building a China-to-Bangladesh Retail Business and Its Online Store',
         'Proyojon Shop sells toys, stationery, bags and accessories sourced in China across Bangladesh. It is one of my own ventures, and the place where I learned to make the commercial logic add up before scaling anything.',
         [('Business', 'Retail and import — toys, stationery, bags and accessories'), ('Market', 'Bangladesh, sourced from China'),
          ('My role', 'Business model, pricing logic, category strategy, product content and creative'),
          ('Website', '<a href="https://www.proyojon.shop">proyojon.shop</a>')],
         '''<h2 id="the-job">What was the job?</h2>
  <p>An import business lives or dies on its numbers. A product that looks cheap at the factory can lose money once shipping, duties, packaging and delivery are added. The job was to build a retail operation where every product's real cost is known — and an online store where customers can find and trust those products.</p>
  <h2 id="what-i-did">What did I do?</h2>
  <ul>
    <li><strong>Costing from factory to shelf.</strong> Every product is costed and tracked from the factory price to the shelf, so pricing decisions are based on the full cost, not the purchase price.</li>
    <li><strong>Category strategy.</strong> Toys, stationery, bags and accessories organised the way Bangladeshi shoppers look for them.</li>
    <li><strong>Product content and creative.</strong> Product content, creative QA and campaign assets for the store and social media.</li>
    <li><strong>The online store.</strong> <a href="https://www.proyojon.shop">proyojon.shop</a> brings the categories, product content and pricing logic together in one place.</li>
  </ul>
  <h2 id="what-it-taught-me">What did it teach me?</h2>
  <p>Proyojon Shop (with its retail arm, Proyojon 360) is the proof behind my strategy work: business models, pricing, offers and operating plans that add up <em>before</em> execution scales.</p>''',
         'https://www.proyojon.shop',
         [('What is Proyojon Shop?', 'Proyojon Shop is a retail and import business in Bangladesh selling toys, stationery, bags and accessories sourced in China, with an online store at proyojon.shop. It was built by Rapar Rubel (Rubel Miah).'),
          ('What did Rapar Rubel do for Proyojon Shop?', 'He built the business and its online store: product costing from factory price to shelf, pricing logic, category strategy, product content, creative QA and campaign assets.')])

    case('cap-on-head', 'CAP ON HEAD',
         'CAP ON HEAD Case Study: Product Photography | Rapar Rubel',
         'How Rapar Rubel plans content, product photography and product presentation for CAP ON HEAD, a Bangladesh cap brand, across social media and caponhead.com.',
         'CAP ON HEAD: Content and Product Photography That Lets Every Cap Sell Itself',
         'CAP ON HEAD is a Bangladesh cap brand. I run its content, product photography and product presentation — how every cap looks, reads and sells on social media and on <a href="https://caponhead.com/">caponhead.com</a>.',
         [('Brand', 'CAP ON HEAD, a cap brand in Bangladesh'), ('Category', 'Fashion accessories — caps'),
          ('My role', 'Content, product photography and product presentation'), ('Channels', 'Social media and <a href="https://caponhead.com/">caponhead.com</a>')],
         '''<h2 id="the-job">What was the job?</h2>
  <p>A cap is a product people buy with their eyes. Online, the photo and a few lines of text have to do everything a shop assistant would: show the shape, the colour, the fit and the feeling. The job was to make every cap present itself clearly — on a phone screen, in a feed, and on the product page.</p>
  <h2 id="what-i-do">What do I do?</h2>
  <ul>
    <li><strong>Product-led photography.</strong> Every cap's photo and angle is planned for how it will look on social media and on the website, so the product sells itself.</li>
    <li><strong>Product descriptions.</strong> Each cap's description is planned alongside its photo, so the two tell the same story.</li>
    <li><strong>Website merchandising.</strong> How caps are presented and grouped on <a href="https://caponhead.com/">caponhead.com</a>.</li>
    <li><strong>Social content.</strong> Product-led posts for the brand's social media channels.</li>
  </ul>
  <h2 id="how-i-think">How does this fit my content process?</h2>
  <p>It is step 4 — <em>Create</em> — of the five-step process I use for every brand: listen, decode, frame, create, test. For a visual product the "create" step leans on photography rather than long copy. I explain the whole process in <a href="/thoughts/content-starts-in-the-audiences-head/">Content Starts in the Audience's Head</a>.</p>''',
         'https://caponhead.com/',
         [('Who does content and product photography for CAP ON HEAD?', 'Rapar Rubel (Rubel Miah), an AI expert and content strategist in Dhaka, runs content, product photography and product presentation for CAP ON HEAD on social media and caponhead.com.'),
          ('What is CAP ON HEAD?', 'CAP ON HEAD is a cap brand in Bangladesh that sells caps through social media and its website, caponhead.com.')])


def bangla_home():
    p = '/bn/'
    url = SITE + p
    faqs = [
        ('Rapar Rubel কে?', 'Rapar Rubel হলো রুবেল মিয়া (Rubel Miah)-র অনলাইন নাম। তিনি ঢাকা, বাংলাদেশের একজন স্বাধীন এআই এক্সপার্ট ও এআই ওয়ার্কফ্লো বিল্ডার। তিনি বাংলা, বাংলিশ ও ইংরেজিতে কাজ করে এমন এআই এজেন্ট, অটোমেশন ও এআই-চালিত প্রোডাক্ট তৈরি করেন।'),
        ('এআই কি বাংলিশ বুঝতে পারে?', 'হ্যাঁ। আসল কাস্টমারের বাংলিশ মেসেজ দিয়ে ডিজাইন ও টেস্ট করলে এআই "dam koto", "kobe pabo" ধরনের প্রশ্ন ভালোভাবে বুঝতে পারে এবং কাস্টমার যে ভাষায় লিখেছেন সেই ভাষায় উত্তর দিতে পারে।'),
        ('ছোট ব্যবসায় প্রথমে কোন কাজটি অটোমেট করা উচিত?', 'যে কাজটি বারবার হয়, সপ্তাহে অনেকবার হয় এবং যার একটি পরিষ্কার সঠিক উত্তর আছে। যেমন: কাস্টমারের সবচেয়ে বেশি করা ২০টি প্রশ্নের উত্তর দেওয়া, বা আসা মেসেজগুলোকে ধরন ও জরুরিতা অনুযায়ী সাজানো।'),
        ('AI Power User কোর্সটি কী?', 'AI Power User হলো বাংলায় শেখানো একটি প্র্যাকটিক্যাল এআই কোর্স: ১০টি ক্লাস, ১৮–২০ ঘণ্টা, প্রায় ৭০% হাতে-কলমে অনুশীলন, বিগিনার থেকে ইন্টারমিডিয়েট লেভেল। প্রতিটি মডিউল শেষ হয় কিছু একটা তৈরি, টেস্ট বা অটোমেট করার মাধ্যমে।'),
        ('কীভাবে যোগাযোগ করব?', 'ইমেইল করুন rubel.public@gmail.com-এ, অথবা কল বা হোয়াটসঅ্যাপ করুন +880 1676-464807 নম্বরে। তিনি ঢাকায় থাকেন (GMT+6)।'),
    ]
    trail = [('Rapar Rubel', SITE + '/'), ('বাংলা', url)]
    graph = [dict(PERSON, knowsLanguage=['bn', 'en']),
             {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': 'Rapar Rubel — এআই এক্সপার্ট ও এআই ওয়ার্কফ্লো বিল্ডার, বাংলাদেশ',
              'inLanguage': 'bn', 'isPartOf': {'@id': SITE + '/#website'}, 'about': {'@id': PERSON_ID}, 'dateModified': DATES[p]},
             crumbs_ld(trail), faq_ld(url, faqs)]
    nav = '<a href="#services">সেবা</a><a href="#work" class="hide-sm">কাজ</a><a href="/" lang="en" hreflang="en">English</a><a href="#contact" class="cta">যোগাযোগ</a>'
    foot = '''<p>© ২০২৬ রুবেল মিয়া · Rapar Rubel · Rubel Public — এআই এক্সপার্ট ও এআই ওয়ার্কফ্লো বিল্ডার, ঢাকা, বাংলাদেশ</p>
  <p><a href="/" lang="en">English</a> · <a href="/services/ai-workflow-automation-bangladesh/" lang="en">AI workflow automation</a> · <a href="/thoughts/" lang="en">Thoughts</a> · <a href="#contact">যোগাযোগ</a></p>'''
    work = [('Paloan', 'এআই এজেন্ট', 'আমার নিজের এআই এজেন্ট — অডিয়েন্স রিসার্চ, কনটেন্ট ড্রাফট, পরিকল্পনা ও ওয়ার্কফ্লোর জন্য।', '/#paloan'),
            ('MimAI মিমাই', 'এআই অ্যাপ', 'নিজের Google Drive থেকে বাংলা, বাংলিশ বা ইংরেজিতে জিজ্ঞেস করে ফাইল খুঁজে দেয় এমন এআই ফাইল অ্যাসিস্ট্যান্ট। Claude Code দিয়ে তৈরি।', 'https://mimai.onrender.com'),
            ('Proyojon Shop', 'রিটেইল · ইমপোর্ট', 'চীন থেকে আনা খেলনা, স্টেশনারি, ব্যাগ ও এক্সেসরিজ, সারা বাংলাদেশে বিক্রি। প্রতিটি প্রোডাক্টের খরচ ফ্যাক্টরি থেকে শেলফ পর্যন্ত হিসাব করা।', '/work/proyojon-shop/'),
            ('CAP ON HEAD', 'ক্যাপ ব্র্যান্ড', 'কনটেন্ট, প্রোডাক্ট ফটোগ্রাফি ও প্রোডাক্ট প্রেজেন্টেশন — সোশ্যাল মিডিয়া ও ওয়েবসাইটে প্রতিটি ক্যাপ কীভাবে দেখায় ও বিক্রি হয়।', '/work/cap-on-head/'),
            ('Proyojon Abashon', 'প্রপার্টি', 'ঢাকার ল্যান্ড শেয়ার ও প্রপার্টি ম্যানেজমেন্ট প্ল্যাটফর্ম, সাথে ক্রেতা সুরক্ষা — দলিল, DAP ও হোম লোন নিয়ে সচেতনতা সিরিজ।', 'https://www.proyojonabashon.com'),
            ('Proyojon Vromon', 'ভ্রমণ', 'ভ্রমণ হোক প্রয়োজন — ভ্রমণের গল্প, হোটেল, টিকেট ও ট্রাভেল শপ, বাংলা পাঠকদের জন্য।', 'https://proyojonvromon.com/')]
    cards = ''.join(f'<a class="card" href="{u}"><span class="mono">{E(k)}</span><h3>{E(n)}</h3><p>{E(d)}</p></a>' for n, k, d, u in work)
    body = f'''<article class="post">
  <p class="mono" style="color:var(--marigold)">এআই এক্সপার্ট · এআই ওয়ার্কফ্লো বিল্ডার · ঢাকা, বাংলাদেশ</p>
  <h1>Rapar Rubel <span style="display:block;font-size:.5em;color:var(--muted)">রুবেল মিয়া</span></h1>
  <p class="lede">আমি এআই-কে ব্যবসার আসল প্রবৃদ্ধিতে রূপ দিই — বেশি কাস্টমার, কম ঝামেলার কাজ, দ্রুত ফলাফল। আমার তৈরি এআই এজেন্ট ও অটোমেশন বাংলা, বাংলিশ ও ইংরেজি — তিন ভাষাই বোঝে।</p>
  <section class="tldr" aria-labelledby="tldr-h"><h2 id="tldr-h">সংক্ষেপে</h2><ul>
    <li>আমি রুবেল মিয়া, অনলাইনে Rapar Rubel — ঢাকার একজন স্বাধীন এআই এক্সপার্ট ও এআই ওয়ার্কফ্লো বিল্ডার।</li>
    <li>ব্যবসার বারবার হওয়া কাজ — কাস্টমারের প্রশ্ন, মেসেজ সাজানো, কনটেন্ট ড্রাফট — এআই দিয়ে অটোমেট করি।</li>
    <li>কাস্টমার যেভাবে লেখেন, ঠিক সেই শব্দ দিয়ে প্রতিটি সিস্টেম ডিজাইন করি।</li>
    <li>এগুলো আগে নিজের ব্যবসায় পরীক্ষা করি, তারপর অন্যদের জন্য বানাই।</li></ul></section>
  <h2 id="services">আমি কী করি</h2>
  <ul>
    <li><strong>এআই ওয়ার্কফ্লো ও এজেন্ট:</strong> কাস্টমারের প্রশ্নের উত্তর, ইনকোয়ারি গ্রহণ ও সাজানো, কনটেন্ট ড্রাফট — গুরুত্বপূর্ণ সিদ্ধান্ত মানুষ দেখে নেয়। <a href="/services/ai-workflow-automation-bangladesh/" lang="en">বিস্তারিত (English)</a></li>
    <li><strong>ব্যবসার কৌশল:</strong> বিজনেস মডেল, প্রাইসিং, অফার, ফানেল ও অপারেটিং প্ল্যান — যাতে বড় করার আগেই হিসাব মেলে।</li>
    <li><strong>কনটেন্ট ও ব্র্যান্ড সাইকোলজি:</strong> অডিয়েন্স রিসার্চ, বাংলা ও বাংলিশ কপি, সোশ্যাল ক্রিয়েটিভ, এআই ভিডিও।</li>
    <li><strong>ওয়েবসাইট ও অ্যাপ:</strong> ব্রিফ থেকে লঞ্চ পর্যন্ত ওয়েবসাইট, ওয়েব অ্যাপ ও ইন্টারনাল টুল।</li>
    <li><strong>এআই ট্রেনিং:</strong> টিমের জন্য বাংলা ও ইংরেজিতে প্র্যাকটিক্যাল এআই প্রশিক্ষণ।</li>
  </ul>
  <h2 id="approach">কনটেন্ট শুরু হয় অডিয়েন্সের মাথায়, ব্র্যান্ডের পেজে নয়</h2>
  <ol>
    <li><strong>শুনুন:</strong> কমেন্ট, ইনবক্স, রিভিউ ও সার্চে মানুষ ঠিক কোন শব্দ ব্যবহার করে তা সংগ্রহ করুন।</li>
    <li><strong>বুঝুন:</strong> প্রশ্নের নিচে লুকানো প্রয়োজন, ভয় ও আশা খুঁজে বের করুন।</li>
    <li><strong>ফ্রেম করুন:</strong> একটি অ্যাঙ্গেল, একটি আবেগ — ব্র্যান্ড হোক একটি প্রয়োজনের উত্তর।</li>
    <li><strong>তৈরি করুন:</strong> প্ল্যাটফর্ম ও ভাষা অনুযায়ী — বাংলিশ ক্যাপশন, বাংলা এক্সপ্লেইনার, ছোট এআই ভিডিও।</li>
    <li><strong>পরীক্ষা ও সিস্টেম:</strong> সেভ, শেয়ার, রিপ্লাই ও বিক্রি দেখে যা কাজ করে তা পুনরাবৃত্তিযোগ্য সিস্টেমে পরিণত করুন।</li>
  </ol>
  <h2 id="work">কিছু কাজ</h2>
  <div class="cards">{cards}</div>
  <h2 id="course">AI Power User — বাংলায় এআই কোর্স</h2>
  <p>১০টি ক্লাস · ১৮–২০ ঘণ্টা · প্রায় ৭০% হাতে-কলমে · বিগিনার থেকে ইন্টারমিডিয়েট। লক্ষ্য ইন্টারফেস মুখস্থ করা নয় — সঠিক টুল বেছে নেওয়া, পুনরাবৃত্তিযোগ্য ওয়ার্কফ্লো ডিজাইন করা এবং কাজের কিছু তৈরি করা।</p>
  {faq_html(faqs, 'সাধারণ প্রশ্ন')}
</article>
<section class="cta" id="contact"><h2>কোনো প্রয়োজন আছে? চলুন কথা বলি।</h2><p>rubel.public@gmail.com · <span style="white-space:nowrap">+880 1676-464807</span> (কল / হোয়াটসঅ্যাপ)</p>
  <a class="btn btn-primary" href="https://wa.me/8801676464807">হোয়াটসঅ্যাপে মেসেজ দিন →</a><a class="btn btn-ghost" href="mailto:rubel.public@gmail.com">ইমেইল</a></section>'''
    page(p, lang='bn', title='Rapar Rubel — এআই এক্সপার্ট ও ওয়ার্কফ্লো বিল্ডার, ঢাকা',
         desc='Rapar Rubel (রুবেল মিয়া) ঢাকার একজন এআই এক্সপার্ট ও এআই ওয়ার্কফ্লো বিল্ডার। বাংলা, বাংলিশ ও ইংরেজি বোঝে এমন এআই এজেন্ট, অটোমেশন ও কনটেন্ট তৈরি করেন।',
         graph=graph, crumbs=trail, body=body, nav=nav, footer=foot,
         alternates=[('en', SITE + '/'), ('bn', url), ('x-default', SITE + '/')],
         extra_head='<style>body{font-family:"Hind Siliguri",var(--body)}h1,h2,h3,summary{font-family:"Tiro Bangla",var(--display)}.post h1{line-height:1.1}</style>\n')


LLMS_BLOCK = '''
## Key pages
- [AI automation and AI chatbots in Bangladesh](https://rubelpublic.github.io/services/ai-workflow-automation-bangladesh/): what Rapar Rubel automates (including Facebook Page, WhatsApp and website chatbots in Bangla, Banglish and English), real examples, how projects run, what he will not automate
- [AI Power User — AI course in Bangla](https://rubelpublic.github.io/courses/ai-power-user/): Rapar Rubel's practical AI course taught in Bangla, 10 classes, 18–20 hours, about 70% hands-on, beginner to intermediate; for individuals and company teams
- [Proyojon Shop case study](https://rubelpublic.github.io/work/proyojon-shop/): China-to-Bangladesh retail and import business and its online store
- [CAP ON HEAD case study](https://rubelpublic.github.io/work/cap-on-head/): content, product photography and product presentation for a Bangladesh cap brand
- [বাংলা পেজ (Bangla homepage)](https://rubelpublic.github.io/bn/): the same profile in Bangla
'''


def course():
    p = '/courses/ai-power-user/'
    url = SITE + p
    modules = [
        ('Understand AI', "What today's AI models can and cannot do, how they work in plain language, and how to choose the right model or tool for a job instead of using one chatbot for everything."),
        ('Use AI', 'Prompting that gets useful answers in Bangla, Banglish and English: giving context, examples and constraints, checking the output, and fixing it when it is wrong.'),
        ('Create with AI', 'Writing, images, audio and video with AI: drafting posts, scripts and visuals for real projects, and keeping your own voice and brand in the result.'),
        ('Automate with AI', 'Turning a task you repeat every week into a workflow with tools such as n8n, Make or Zapier: trigger, understand, decide, act, check.'),
        ('Think with AI', 'Using AI for research, planning and decisions: breaking down problems, comparing options and spotting when the AI is confidently wrong.'),
        ('Capstone: your Personal AI Operating System', 'You design and build your own set of AI tools, prompts and workflows for your work or business, and present it working.'),
    ]
    faqs = [
        ('Is there an AI course in Bangla for beginners?', 'Yes. AI Power User is a practical AI course taught in Bangla by Rapar Rubel (Rubel Miah) in Dhaka. It runs for 10 classes and 18–20 hours, takes learners from beginner to intermediate, and is about 70% hands-on practice.'),
        ('What will I be able to do after the course?', 'Choose the right AI model or tool for a task, write prompts that give useful results in Bangla, Banglish and English, create content with AI, automate a repeatable task as a workflow, and run your own Personal AI Operating System built in the capstone.'),
        ('Do I need coding or technical knowledge?', 'No. The course starts from the basics. Every module ends with something built, tested or automated, so you learn by doing rather than by memorizing interfaces.'),
        ('Is the course available for company teams?', 'Yes. AI Power User is designed for individual learners and for teams in Bangladesh. For a team batch or training at your office, contact Rapar Rubel to plan the schedule and focus areas.'),
        ('When is the next batch and what does it cost?', 'Batch dates and fees are shared directly. Message Rapar Rubel on WhatsApp at +880 1676-464807 or email rubel.public@gmail.com to join the list for the next batch.'),
    ]
    trail = [('Rapar Rubel', SITE + '/'), ('Courses', url), ('AI Power User', url)]
    graph = [PERSON,
             {'@type': 'Course', '@id': url + '#course', 'name': 'AI Power User — practical AI course in Bangla', 'url': url,
              'description': 'A practical AI course taught in Bangla: choosing the right AI model or tool, prompting in Bangla, Banglish and English, creating content, automating workflows and building a Personal AI Operating System. 10 classes, 18–20 hours, about 70% hands-on.',
              'provider': {'@id': PERSON_ID}, 'creator': {'@id': PERSON_ID}, 'inLanguage': 'bn', 'educationalLevel': 'Beginner to intermediate',
              'timeRequired': 'PT20H', 'teaches': [m for m, _ in modules],
              'syllabusSections': [{'@type': 'Syllabus', 'name': m, 'description': d} for m, d in modules],
              'audience': {'@type': 'Audience', 'audienceType': 'Learners, professionals and teams in Bangladesh'}},
             {'@type': 'WebPage', '@id': url + '#page', 'url': url, 'name': 'AI Course in Bangla: AI Power User | Rapar Rubel',
              'inLanguage': 'en', 'isPartOf': {'@id': SITE + '/#website'}, 'about': {'@id': url + '#course'}, 'dateModified': DATES[p]},
             crumbs_ld(trail), faq_ld(url, faqs)]
    mods = ''.join(f'<li><strong>{E(m)}.</strong> {E(d)}</li>' for m, d in modules)
    body = f'''<article class="post">
  <h1>AI Power User: a Practical AI Course in Bangla</h1>
  <p class="lede">Learn to use AI for real work — choosing the right tool, prompting in Bangla, Banglish and English, creating content and automating the tasks you repeat every week. Every module ends with something built, tested or automated.</p>
  <section class="tldr" aria-labelledby="tldr-h"><h2 id="tldr-h">Short answer</h2><ul>
    <li><strong>10 classes, 18–20 hours</strong>, taught in Bangla by Rapar Rubel (Rubel Miah) in Dhaka.</li>
    <li><strong>About 70% hands-on</strong> practice, from beginner to intermediate.</li>
    <li>Six modules: Understand, Use, Create, Automate and Think with AI, plus a capstone.</li>
    <li>For individual learners and for company teams.</li></ul></section>
  <h2 id="who-its-for">Who is it for?</h2>
  <p>Business owners, marketers, freelancers, students and teams in Bangladesh who already use ChatGPT a little and want to use AI properly in their daily work. No coding needed.</p>
  <h2 id="syllabus">What you will learn</h2>
  <ol>{mods}</ol>
  <h2 id="how-its-taught">How it is taught</h2>
  <p>The focus is on choosing the right model or tool, designing repeatable workflows and producing useful work — not memorizing buttons that change every month. Examples come from real Bangladeshi businesses: Facebook Page inboxes full of Banglish, product content, property enquiries and online shops. I use the same methods in my own ventures and client work; see <a href="/services/ai-workflow-automation-bangladesh/">AI automation</a> and <a href="/thoughts/n8n-vs-make-vs-zapier-bangladesh/">n8n vs Make vs Zapier</a>.</p>
  <h2 id="teams">Training for teams</h2>
  <p>For a company batch, I adapt the modules to your team's real tasks — customer messages, content, reporting — so people leave with workflows they use the next day.</p>
  <h2 id="next-batch">Next batch</h2>
  <p>Batch dates and fees are shared directly. <a href="https://wa.me/8801676464807">Message me on WhatsApp</a> or email <a href="mailto:rubel.public@gmail.com">rubel.public@gmail.com</a> to join the list.</p>
  {faq_html(faqs)}
  {AUTHOR}
</article>
<section class="cta"><h2>Want to join the next batch?</h2><p>Tell me whether it is for you or your team, and what you want to use AI for.</p>
  <a class="btn btn-primary" href="https://wa.me/8801676464807">WhatsApp →</a><a class="btn btn-ghost" href="/#brief">Send a brief</a></section>'''
    page(p, title='AI Course in Bangla: AI Power User | Rapar Rubel',
         desc='AI Power User: a practical AI course in Bangla by Rapar Rubel in Dhaka. 10 classes, 18–20 hours, 70% hands-on: prompting, AI content, automation and your own AI system.',
         graph=graph, crumbs=trail, body=body, nav=EN_NAV, footer=EN_FOOT)


def update_llms():
    p = os.path.join(ROOT, 'llms.txt')
    s = open(p, encoding='utf-8').read()
    start, end = '<!-- PAGES -->', '<!-- /PAGES -->'
    if start in s and end in s:
        s = s[:s.index(start) + len(start)] + LLMS_BLOCK + s[s.index(end):]
    else:
        s = s.replace('<!-- THOUGHTS -->', start + LLMS_BLOCK + end + '\n\n<!-- THOUGHTS -->', 1)
    open(p, 'w', encoding='utf-8', newline='\n').write(s)


if __name__ == '__main__':
    print('Built pages:')
    services()
    course()
    case_studies()
    bangla_home()
    update_llms()
    print('Now run: python tools/build_thoughts.py  (sitemap + llms-full.txt)')
