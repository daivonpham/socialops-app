# Tokens

```text
shared/theme/tokens.css   # or tokens.ts consumed by CSS vars
--color-bg
--color-fg
--color-primary
--color-danger
--space-1 … --space-8
--radius-sm|md|lg
--font-sans
--text-sm|md|lg
--elevation-1|2
```

## Rules

- Semantic names (`--color-danger`) over raw brand names when possible.
- Dark/light = token sets, not scattered conditionals in features.
- Adapters map kit theme APIs onto the same semantic tokens.
- Do not export Ant `theme` tokens as the public design contract forever — map into platform tokens.
