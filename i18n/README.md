# Translations

English is the app's own language and the reference version. Spanish (`es`), French (`fr`) and Portuguese (`pt`)
are translations of every piece of text the app shows, applied where the text reaches the page (`src/lib/i18n.ts`),
so components are written in English only.

- `strings.json` — every English string the app can show, collected from the source by `scripts/i18n-extract.mjs`.
  `{0}`, `{1}` … mark the parts a template fills in ("Step {0} of {1}").
- `es.json`, `fr.json`, `pt.json` — the translations, keyed by the English. A pattern keeps the same `{n}` parts.
- `public/i18n/<code>-<hash>.json` and `src/lib/i18n-files.ts` — built from the above by `scripts/i18n-build.mjs`;
  never edit them by hand.

After changing text in the app:

```bash
node scripts/i18n-extract.mjs            # refresh strings.json
node scripts/i18n-extract.mjs --check    # list what each language is missing
# add the missing entries to es.json, fr.json and pt.json
node scripts/i18n-build.mjs              # write the files the app loads
```

A string with no translation simply shows in English. The recorded voices stay in English; their captions are
translated. Text inside an element with `translate="no"` is left alone (the app's name is one).
