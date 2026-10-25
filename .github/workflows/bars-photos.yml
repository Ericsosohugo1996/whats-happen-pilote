name: Photos des bars (Wikimedia Commons)

on:
  workflow_dispatch:

permissions:
  contents: write
  pages: write

concurrency:
  group: bars-sympa
  cancel-in-progress: false

jobs:
  photos:
    runs-on: ubuntu-latest
    timeout-minutes: 130
    steps:
      - uses: actions/checkout@v4
        with:
          ref: main

      - name: Chercher des photos libres pour les bars retenus
        run: node bars-photos.js

      - name: Enregistrer
        run: |
          git config user.name "whazup-bot"
          git config user.email "bot@whazup.fr"
          git add data/bars-plus
          if git diff --cached --quiet; then
            echo "Rien de nouveau à enregistrer"
          else
            git commit -m "Photos des bars (automatique)"
            git pull --rebase origin main
            git push origin HEAD:main
          fi

      - name: Relancer la publication du site
        run: |
          curl -s -X POST \
            -H "Authorization: Bearer ${{ secrets.GITHUB_TOKEN }}" \
            -H "Accept: application/vnd.github+json" \
            https://api.github.com/repos/${{ github.repository }}/pages/builds || true
