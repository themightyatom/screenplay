# Langå screenplay tool

Local, file-backed tool for developing the screenplay. No database, no build step.

```
npm install
npm start          # http://localhost:3210
```

`npm run seed` re-creates any missing files in `data/` from the markdown sources. It never overwrites.

## Files are the truth

Everything lives in `data/` as one JSON file per item. Edit them in the UI, in an editor, or with Claude Code; the UI re-reads on every view and writes on every change.

```
data/
  framing.json                 narrator, listener, strands, weight, open, notes, sketch, images
  scenes/slug.json             title, slug, order, strand, date, setting, location, time, characters,
                               summary, purpose, open, status, script (Fountain), images, notes, sketch
  characters/slug.json         name, active, age_1943, role, fate, known[{fact,source}], invented[],
                               arc, relationships[{character,label}], images, notes, sketch
  locations/slug.json          name, active, description, real, images, notes, sketch
  research/slug.json           title, source, summary, scenes[], characters[], images, notes, sketch
images/                        uploads land in images/<type>/<id>/; items reference them by relative path
```

- `strand` is one of `NOW`, `THEN`, `LONDON`.
- `status` is one of `idea`, `discussed`, `drafted`, `locked`.
- `date` is a plain sortable string (`1943-11-17`, `1943-10`, `2026`).
- `setting` is a Fountain scene-heading prefix (`INT.`, `EXT.`, `INT./EXT.`, `EXT./INT.`, `I/E.`, `EST.`); `time` is the tail (`DAY`, `NIGHT`, `CONTINUOUS`, … or free text). The UI composes `SETTING LOCATION - TIME` as the scene heading and can insert it into the script.
- Character and location references use the file name without `.json`.
- Scenes are not numbered. `order` is the running order, an integer set by dragging cards on the board (within a column or between columns); the timeline sorts by date, then order, and the compiled script follows order.
- Changing a scene's slug renames its file.
- A malformed file is shown raw in the UI and can be fixed there; nothing is overwritten on load.
- New characters, locations and research notes are named on creation; the name's slug becomes the file name and stays fixed (other files reference it). Scenes are the exception: re-slugging a scene renames its file.
- Delete never removes a file. It moves it to `data/_trash/<type>/<timestamp>_<file>`. Move it back by hand to restore.
- Every editor shows what else references the item ("Referenced by") so a delete is an informed one; dangling references show as red chips.

The original markdown (SCENES.md, CHARACTERS.md, FRAMING.md, RESEARCH.md, characters/*.md) is kept as source; the JSON is what the tool reads.
- `active` on characters and locations means "in the film". Inactive ones stay on file as reference and are shown greyed out; the toggle is in the editor header.
- Writing mode: the ⤢ button on a scene's Script field (or double-clicking a scene card) opens the Fountain full width in the main pane, with the scene brief folded above it. Saves as you type.
- The first image on an item is its cover: shown large at the top of character and location editors and as a muted background on tiles and scene cards. ★ on a thumbnail makes it the cover.
