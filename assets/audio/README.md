# Worship Wagon Music Library

Add music files directly to `assets/audio/tracks/`, then commit and push them to GitHub. The `Generate Audio Catalog` GitHub Action will create or update `assets/audio/catalog.json` automatically. The player is available at `https://worshipwagon.org/player` after deployment.

Use a flat folder and prefer MP3 or M4A/AAC files for dependable playback on both iPhone and Android. The player displays each filename without its extension, replacing hyphens and underscores with spaces. For example, `01-How-Great-Is-Our-God.mp3` displays as `01 How Great Is Our God`.

If GitHub Actions is disabled or cannot push its generated update, run this from the repository root before committing:

```sh
node scripts/generate-audio-catalog.mjs
```
