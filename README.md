# Rapar Rubel — Portfolio

Portfolio of **Rubel Miah** (online name **Rapar Rubel**, also **Rubel Public**): business builder and AI & product operator in Dhaka, Bangladesh.

Live: https://rubelpublic.github.io/

## What's here

| File | Purpose |
| --- | --- |
| `index.html` | The site: dark + light mode, responsive on every screen, FAQ, contact, CV download |
| `Rubel-Miah-Rapar-Rubel-CV.pdf` | One-page CV that the "Download CV" buttons serve |
| `cv/index.html` | Web version of the CV (also the source for the PDF) |
| `assets/` | Portrait, logos, share image (`og-image.jpg`) and app icons |
| `robots.txt`, `sitemap.xml` | Search engine crawling |
| `llms.txt` | Plain-text profile for AI answer engines (GEO) |
| `site.webmanifest`, `404.html` | App install metadata and the not-found page |

## Updating

- **Site text:** edit `index.html`. The FAQ appears twice, once as visible text and once in the `FAQPage` JSON-LD block in `<head>`, so keep both in sync.
- **CV:** edit `cv/index.html`, open it in Chrome, Print → Save as PDF (A4, no margins, background graphics on) and replace `Rubel-Miah-Rapar-Rubel-CV.pdf`.
- Commit and push in GitHub Desktop; GitHub Pages republishes in a minute or two.

## Writing a new Thought (blog post)

1. Copy any file in `thoughts/_posts/` and rename it, e.g. `my-new-idea.md`.
2. Edit the top section (title, slug, description up to 160 characters, date, tags, `tldr:` lines, `faq: Question? :: Answer` lines) and write the post below it in Markdown.
3. Run `python tools/build_thoughts.py` (needs `pip install markdown pillow`).
4. Commit and push. The script rebuilds the post page, its share image, the Thoughts index, RSS feed, sitemap, llms.txt and the homepage "Latest thoughts" strip.
