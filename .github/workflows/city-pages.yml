name: Pages par ville

on:
  workflow_dispatch:
  schedule:
    - cron: "40 7 * * *"
  push:
    branches: [main]
    paths:
      - city-pages.js
      - .github/workflows/city-pages.yml

permissions:
  contents: write
  pages: write

concurrency:
  group: split-data
  cancel-in-progress: false

jobs:
  pages:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    steps:
      - uses: actions/checkout@v4

      - name: Fabriquer les pages « Sorties à … » et le plan du site
        run: node city-pages.js

      - name: Enregistrer
        run: |
          git config user.name "whazup-bot"
          git config user.email "bot@whazup.fr"
          git add sorties sitemap.xml
          if git diff --cached --quiet; then
            echo "Rien de nouveau à enregistrer"
          else
            git commit -m "Pages par ville (automatique)"
            git pull --rebase origin main
            git push origin HEAD:main
          fi

      - name: Relancer la publication du site
        run: |
          curl -s -X POST \
            -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/${{ github.repository }}/pages/builds || true
