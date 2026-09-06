# Prompt for Claude Code — Langå screenplay tool

Build a small local web app for developing a screenplay. Weekend-sized. No frameworks I have to learn; plain Node (Express or similar) serving a single-page UI, or Python/Flask if simpler. No database: all data lives as files in a `data/` folder in this repo so that Claude Code and git can read and edit it directly.

## Data model (files, one per item, JSON or YAML)

- `data/scenes/slug.json` — title, order (running order, set by dragging), slug, strand (NOW / THEN / LONDON), date in story, setting (INT. / EXT. / …), location id, time (DAY / NIGHT / …), character ids, summary, purpose, open questions (list), status (idea / discussed / drafted / locked), script (Fountain text, optional), images (list of paths), notes (free text).
- `data/characters/slug.json` — name, age in 1943, role, known facts (list, each with a source), invented facts (list), arc notes, relationships (list of character ids with a label), images, notes.
- `data/locations/slug.json` — name, description, real/invented, images, notes.
- `data/research/slug.json` — title, source, summary, which scenes or characters it touches.
- `data/framing.json` — narrator, listener, strands, weight, open questions.

Keep keys flat and readable. Never invent a schema field the UI doesn't show.

## UI

- Left nav: Scenes, Characters, Locations, Research, Framing.
- Scenes view: a board with columns by status, cards draggable between columns; a second view sorted by story date on a timeline. Filter by strand.
- Every item opens in an editable panel. Every text field is plain text or Markdown. Save writes the file immediately.
- Each item has an images strip; clicking an image opens it full size. Images are files under `images/` and referenced by relative path.
- A "sketch" field on every item: free text, no structure, for half-formed ideas.
- A read-only "Script" page that concatenates the Fountain of all locked scenes in order.

## Rules

- Files are the truth. The UI must never hold state the file doesn't.
- Overwrite nothing on load; if a file is malformed, show it raw and let me fix it.
- No accounts, no cloud, no build step beyond `npm install && npm start`.
- Seed the data folder from the existing files: SCENES.md, CHARACTERS.md, FRAMING.md, RESEARCH.md, characters/*.md. Keep the originals; don't delete them.

Start with the data model and the scenes board. Show me that before doing the rest.
