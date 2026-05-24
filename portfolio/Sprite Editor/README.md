# SpritePad

SpritePad is a lightweight pixel art and sprite animation editor built for fast game-asset creation.

## Run

Open `index.html` in a modern browser.

## Current Features

- Pixel drawing canvas
- Desktop application menu bar with File, Edit, Tools, View, Layer, Animation, and Options menus
- Assignable keyboard shortcuts saved in local storage
- Rectangular pixel selection with copy, cut, delete, select all, and clear selection
- Paste with transparency or paste without transparency
- Pencil, eraser, fill, line, rectangle, circle, rectangular select, eyedropper, dither, shade, move layer
- Straight line and Bezier line modes
- Connected pixel-rounded circle outlines
- Brush size, zoom, grid, onion skin, horizontal symmetry
- Layers with rename, visibility, opacity, duplicate, merge, reorder, flip, rotate, outline, clear
- Palette swatches, picked-color replacement, palette limit warning
- Multiple named animations
- Animation-wide duration control
- Per-frame duration control
- Frame add, duplicate, delete, move left, move right
- Drag-and-drop frame reordering
- Playback for the selected animation
- Apply sprite size immediately after confirmation while preserving existing art top-left
- Save/open `.spritepad` project files
- Export sprite sheet with each animation on its own row
- Export JSON metadata
- Copy import notes for Generic, Stencyl, Godot, Unity, and GameMaker

## Export Layout

The PNG export uses one animation per row:

- Row 1 = first animation
- Row 2 = second animation
- Columns = frames
- Shorter animations leave transparent cells at the end of the row

The JSON metadata includes row, frame position, frame size, duration, and animation names.


## Icon Credit

Tool rail icons use local SVGs adapted from Pixelarticons by Gerrit Halfmann, MIT license. See `assets/LICENSE_PIXELARTICONS.txt`.
