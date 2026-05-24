(function () {
  "use strict";

  const canvas = document.getElementById("pixelCanvas");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const exportPreviewCanvas = document.getElementById("exportPreviewCanvas");
  const exportPreviewCtx = exportPreviewCanvas.getContext("2d");
  exportPreviewCtx.imageSmoothingEnabled = false;

  const state = {
    width: 32,
    height: 32,
    zoom: 16,
    tool: "pencil",
    brushSize: 1,
    primaryColor: "#2f7cff",
    secondaryColor: "#101322",
    symmetry: false,
    showGrid: true,
    showOnion: true,
    lineMode: "straight",
    bezierBend: 35,
    isDrawing: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startImageData: null,
    moveCanvas: null,
    shadeDarken: false,
    currentAnimation: 0,
    currentFrame: 0,
    currentLayer: 0,
    animations: [],
    frames: [],
    palette: [
      "#000000", "#ffffff", "#2f7cff", "#ffcc4d",
      "#ff5b7f", "#53e086", "#7f5cff", "#101322"
    ],
    pickedColor: "#2f7cff",
    undoStack: [],
    redoStack: [],
    isPlaying: false,
    playTimer: null,
    dragFrameIndex: null,
    selection: {
      active: false,
      x: 0,
      y: 0,
      w: 0,
      h: 0
    },
    selectionDragStart: null,
    clipboard: null,
    shortcuts: {},
    shortcutCaptureAction: null,
    menuIsOpen: false,
    activeMenuGroup: null
  };

  const els = {
    toolButtons: Array.from(document.querySelectorAll(".tool-btn")),
    activeToolLabel: document.getElementById("activeToolLabel"),
    brushSizeInput: document.getElementById("brushSizeInput"),
    brushSizeLabel: document.getElementById("brushSizeLabel"),
    zoomInput: document.getElementById("zoomInput"),
    zoomLabel: document.getElementById("zoomLabel"),
    lineOptionsRow: document.getElementById("lineOptionsRow"),
    lineModeInput: document.getElementById("lineModeInput"),
    bezierBendInput: document.getElementById("bezierBendInput"),
    bezierBendLabel: document.getElementById("bezierBendLabel"),
    selectionOptionsRow: document.getElementById("selectionOptionsRow"),
    copySelectionBtn: document.getElementById("copySelectionBtn"),
    cutSelectionBtn: document.getElementById("cutSelectionBtn"),
    pasteWithTransparencyBtn: document.getElementById("pasteWithTransparencyBtn"),
    pasteNoTransparencyBtn: document.getElementById("pasteNoTransparencyBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    gridToggleBtn: document.getElementById("gridToggleBtn"),
    onionToggleBtn: document.getElementById("onionToggleBtn"),
    symmetryToggleBtn: document.getElementById("symmetryToggleBtn"),
    frameStatus: document.getElementById("frameStatus"),
    playBtn: document.getElementById("playBtn"),
    moveFrameLeftBtn: document.getElementById("moveFrameLeftBtn"),
    moveFrameRightBtn: document.getElementById("moveFrameRightBtn"),
    addFrameBtn: document.getElementById("addFrameBtn"),
    dupFrameBtn: document.getElementById("dupFrameBtn"),
    deleteFrameBtn: document.getElementById("deleteFrameBtn"),
    frameDurationInput: document.getElementById("frameDurationInput"),
    frameStrip: document.getElementById("frameStrip"),
    animationSelect: document.getElementById("animationSelect"),
    animationNameInput: document.getElementById("animationNameInput"),
    animationDurationInput: document.getElementById("animationDurationInput"),
    addAnimationBtn: document.getElementById("addAnimationBtn"),
    deleteAnimationBtn: document.getElementById("deleteAnimationBtn"),
    newWidthInput: document.getElementById("newWidthInput"),
    newHeightInput: document.getElementById("newHeightInput"),
    newProjectBtn: document.getElementById("newProjectBtn"),
    templateButtons: Array.from(document.querySelectorAll(".template-btn")),
    tabButtons: Array.from(document.querySelectorAll(".tab-btn")),
    layersTab: document.getElementById("layersTab"),
    paletteTab: document.getElementById("paletteTab"),
    exportTab: document.getElementById("exportTab"),
    layerList: document.getElementById("layerList"),
    addLayerBtn: document.getElementById("addLayerBtn"),
    duplicateLayerBtn: document.getElementById("duplicateLayerBtn"),
    mergeLayerBtn: document.getElementById("mergeLayerBtn"),
    moveLayerUpBtn: document.getElementById("moveLayerUpBtn"),
    moveLayerDownBtn: document.getElementById("moveLayerDownBtn"),
    flipHBtn: document.getElementById("flipHBtn"),
    flipVBtn: document.getElementById("flipVBtn"),
    rotateLayerBtn: document.getElementById("rotateLayerBtn"),
    outlineBtn: document.getElementById("outlineBtn"),
    primaryColorInput: document.getElementById("primaryColorInput"),
    secondaryColorInput: document.getElementById("secondaryColorInput"),
    addColorBtn: document.getElementById("addColorBtn"),
    replaceColorBtn: document.getElementById("replaceColorBtn"),
    clearLayerBtn: document.getElementById("clearLayerBtn"),
    paletteSwatches: document.getElementById("paletteSwatches"),
    paletteLimitInput: document.getElementById("paletteLimitInput"),
    paletteCountLabel: document.getElementById("paletteCountLabel"),
    saveProjectBtn: document.getElementById("saveProjectBtn"),
    openProjectInput: document.getElementById("openProjectInput"),
    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
    exportPngBtn: document.getElementById("exportPngBtn"),
    downloadSheetBtn: document.getElementById("downloadSheetBtn"),
    downloadJsonBtn: document.getElementById("downloadJsonBtn"),
    copyNotesBtn: document.getElementById("copyNotesBtn"),
    enginePresetInput: document.getElementById("enginePresetInput"),
    exportScaleInput: document.getElementById("exportScaleInput"),
    menuBar: document.getElementById("menuBar"),
    menuGroups: Array.from(document.querySelectorAll(".menu-group")),
    menuRoots: Array.from(document.querySelectorAll(".menu-root")),
    menuActionButtons: Array.from(document.querySelectorAll("[data-action]")),
    shortcutLabels: Array.from(document.querySelectorAll("[data-shortcut-label]")),
    shortcutModal: document.getElementById("shortcutModal"),
    shortcutRows: document.getElementById("shortcutRows"),
    shortcutCloseBtn: document.getElementById("shortcutCloseBtn"),
    shortcutResetBtn: document.getElementById("shortcutResetBtn"),
    shortcutCaptureHint: document.getElementById("shortcutCaptureHint")
  };

  const shortcutStorageKey = "spritepad_shortcuts_v1";

  const actionGroups = [
    {
      name: "File",
      actions: [
        { id: "saveProject", label: "Save Project", defaultKey: "Ctrl+S" },
        { id: "openProject", label: "Open Project", defaultKey: "Ctrl+O" },
        { id: "downloadSheet", label: "Export PNG Sheet", defaultKey: "Ctrl+E" },
        { id: "downloadJson", label: "Export JSON", defaultKey: "" },
        { id: "copyNotes", label: "Copy Import Notes", defaultKey: "" }
      ]
    },
    {
      name: "Edit",
      actions: [
        { id: "undo", label: "Undo", defaultKey: "Ctrl+Z" },
        { id: "redo", label: "Redo", defaultKey: "Ctrl+Y" },
        { id: "copySelection", label: "Copy Selection", defaultKey: "Ctrl+C" },
        { id: "cutSelection", label: "Cut Selection", defaultKey: "Ctrl+X" },
        { id: "pasteWithTransparency", label: "Paste With Transparency", defaultKey: "Ctrl+V" },
        { id: "pasteNoTransparency", label: "Paste No Transparency", defaultKey: "Ctrl+Shift+V" },
        { id: "deleteSelection", label: "Delete Selection", defaultKey: "Delete" },
        { id: "selectAll", label: "Select All", defaultKey: "Ctrl+A" },
        { id: "clearSelection", label: "Clear Selection", defaultKey: "Escape" }
      ]
    },
    {
      name: "Tools",
      actions: [
        { id: "toolPencil", label: "Pencil", defaultKey: "P" },
        { id: "toolEraser", label: "Eraser", defaultKey: "E" },
        { id: "toolFill", label: "Fill", defaultKey: "F" },
        { id: "toolLine", label: "Line", defaultKey: "L" },
        { id: "toolRect", label: "Rectangle", defaultKey: "R" },
        { id: "toolCircle", label: "Circle", defaultKey: "C" },
        { id: "toolSelect", label: "Select", defaultKey: "S" },
        { id: "toolEyedropper", label: "Eyedropper", defaultKey: "I" },
        { id: "toolDither", label: "Dither", defaultKey: "D" },
        { id: "toolShade", label: "Shade", defaultKey: "H" },
        { id: "toolMove", label: "Move Layer", defaultKey: "M" },
        { id: "toggleBezier", label: "Toggle Bezier Line", defaultKey: "B" }
      ]
    },
    {
      name: "View",
      actions: [
        { id: "toggleGrid", label: "Toggle Grid", defaultKey: "G" },
        { id: "toggleOnion", label: "Toggle Onion Skin", defaultKey: "O" },
        { id: "toggleSymmetry", label: "Toggle Symmetry", defaultKey: "X" },
        { id: "tabLayers", label: "Show Layers", defaultKey: "Alt+1" },
        { id: "tabPalette", label: "Show Palette", defaultKey: "Alt+2" },
        { id: "tabExport", label: "Show Export", defaultKey: "Alt+3" },
        { id: "zoomIn", label: "Zoom In", defaultKey: "+" },
        { id: "zoomOut", label: "Zoom Out", defaultKey: "-" }
      ]
    },
    {
      name: "Layer",
      actions: [
        { id: "addLayer", label: "Add Layer", defaultKey: "Ctrl+Shift+L" },
        { id: "duplicateLayer", label: "Duplicate Layer", defaultKey: "" },
        { id: "mergeLayerDown", label: "Merge Down", defaultKey: "" },
        { id: "moveLayerUp", label: "Move Layer Up", defaultKey: "" },
        { id: "moveLayerDown", label: "Move Layer Down", defaultKey: "" },
        { id: "flipLayerH", label: "Flip Horizontal", defaultKey: "" },
        { id: "flipLayerV", label: "Flip Vertical", defaultKey: "" },
        { id: "rotateLayer", label: "Rotate 90°", defaultKey: "" },
        { id: "outlineLayer", label: "Outline", defaultKey: "" },
        { id: "clearLayer", label: "Clear Layer", defaultKey: "" }
      ]
    },
    {
      name: "Animation",
      actions: [
        { id: "playAnimation", label: "Play / Stop", defaultKey: "Space" },
        { id: "addAnimation", label: "Add Animation", defaultKey: "" },
        { id: "deleteAnimation", label: "Delete Animation", defaultKey: "" },
        { id: "addFrame", label: "Add Frame", defaultKey: "Ctrl+Shift+F" },
        { id: "duplicateFrame", label: "Duplicate Frame", defaultKey: "Ctrl+D" },
        { id: "deleteFrame", label: "Delete Frame", defaultKey: "Shift+Delete" },
        { id: "moveFrameLeft", label: "Move Frame Left", defaultKey: "Alt+ArrowLeft" },
        { id: "moveFrameRight", label: "Move Frame Right", defaultKey: "Alt+ArrowRight" }
      ]
    },
    {
      name: "Options",
      actions: [
        { id: "openShortcuts", label: "Keyboard Shortcuts", defaultKey: "Ctrl+/" }
      ]
    }
  ];

  const actionInfo = {};
  for (let groupIndex = 0; groupIndex < actionGroups.length; groupIndex++) {
    const group = actionGroups[groupIndex];
    for (let actionIndex = 0; actionIndex < group.actions.length; actionIndex++) {
      const action = group.actions[actionIndex];
      actionInfo[action.id] = action;
    }
  }

  function createDefaultShortcuts() {
    const shortcuts = {};
    for (let groupIndex = 0; groupIndex < actionGroups.length; groupIndex++) {
      const group = actionGroups[groupIndex];
      for (let actionIndex = 0; actionIndex < group.actions.length; actionIndex++) {
        const action = group.actions[actionIndex];
        shortcuts[action.id] = action.defaultKey;
      }
    }
    return shortcuts;
  }

  function createLayer(name) {
    const layerCanvas = document.createElement("canvas");
    layerCanvas.width = state.width;
    layerCanvas.height = state.height;

    const layerCtx = layerCanvas.getContext("2d");
    layerCtx.imageSmoothingEnabled = false;

    return {
      name: name,
      visible: true,
      opacity: 1,
      canvas: layerCanvas,
      ctx: layerCtx
    };
  }

  function createFrame(duration) {
    let frameDuration = Number(duration);
    if (!frameDuration || frameDuration < 30) frameDuration = 120;

    return {
      duration: frameDuration,
      layers: [createLayer("Layer 1")]
    };
  }

  function createAnimation(name) {
    return {
      name: name,
      duration: 120,
      frames: [createFrame(120)]
    };
  }

  function cloneLayer(layer) {
    const newLayer = createLayer(layer.name);
    newLayer.visible = layer.visible;
    newLayer.opacity = layer.opacity;
    newLayer.ctx.clearRect(0, 0, state.width, state.height);
    newLayer.ctx.drawImage(layer.canvas, 0, 0);
    return newLayer;
  }

  function cloneFrame(frame) {
    const newFrame = {
      duration: frame.duration,
      layers: []
    };

    for (let i = 0; i < frame.layers.length; i++) {
      newFrame.layers.push(cloneLayer(frame.layers[i]));
    }

    return newFrame;
  }

  function getAnimation() {
    return state.animations[state.currentAnimation];
  }

  function syncActiveFrames() {
    const animation = getAnimation();
    if (!animation) {
      state.frames = [];
      return;
    }

    state.frames = animation.frames;

    if (state.currentFrame < 0) state.currentFrame = 0;
    if (state.currentFrame >= state.frames.length) state.currentFrame = state.frames.length - 1;
    if (state.currentFrame < 0) state.currentFrame = 0;
  }

  function getFrame() {
    syncActiveFrames();
    return state.frames[state.currentFrame];
  }

  function getLayer() {
    const frame = getFrame();
    if (!frame) return null;
    if (state.currentLayer >= frame.layers.length) state.currentLayer = frame.layers.length - 1;
    if (state.currentLayer < 0) state.currentLayer = 0;
    return frame.layers[state.currentLayer];
  }

  function resizeDisplayCanvas() {
    canvas.width = state.width * state.zoom;
    canvas.height = state.height * state.zoom;
    ctx.imageSmoothingEnabled = false;
    els.zoomLabel.textContent = state.zoom + "x";
  }

  function rgbaFromHex(hex, alpha) {
    const cleaned = hex.replace("#", "");
    const r = parseInt(cleaned.substring(0, 2), 16);
    const g = parseInt(cleaned.substring(2, 4), 16);
    const b = parseInt(cleaned.substring(4, 6), 16);

    return {
      r: r,
      g: g,
      b: b,
      a: alpha
    };
  }

  function rgbaToCss(color) {
    const a = color.a / 255;
    return "rgba(" + color.r + ", " + color.g + ", " + color.b + ", " + a + ")";
  }

  function dataIndex(x, y, width) {
    return (y * width + x) * 4;
  }

  function readPixelFromImageData(imageData, x, y) {
    const index = dataIndex(x, y, imageData.width);
    return {
      r: imageData.data[index],
      g: imageData.data[index + 1],
      b: imageData.data[index + 2],
      a: imageData.data[index + 3]
    };
  }

  function colorsMatch(a, b) {
    if (a.r !== b.r) return false;
    if (a.g !== b.g) return false;
    if (a.b !== b.b) return false;
    if (a.a !== b.a) return false;
    return true;
  }

  function hexFromRgba(color) {
    const r = color.r.toString(16).padStart(2, "0");
    const g = color.g.toString(16).padStart(2, "0");
    const b = color.b.toString(16).padStart(2, "0");
    return "#" + r + g + b;
  }

  function clearMainCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function drawFrameToContext(frame, targetCtx, x, y, scale, opacityOverride) {
    targetCtx.imageSmoothingEnabled = false;

    for (let i = 0; i < frame.layers.length; i++) {
      const layer = frame.layers[i];
      if (!layer.visible) continue;

      if (opacityOverride !== null && opacityOverride !== undefined) {
        targetCtx.globalAlpha = opacityOverride * layer.opacity;
      } else {
        targetCtx.globalAlpha = layer.opacity;
      }

      targetCtx.drawImage(layer.canvas, x, y, state.width * scale, state.height * scale);
      targetCtx.globalAlpha = 1;
    }
  }

  function compositeFrameToCanvas(frame, targetCanvas, scale, opacityOverride) {
    const targetCtx = targetCanvas.getContext("2d");
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    drawFrameToContext(frame, targetCtx, 0, 0, scale, opacityOverride);
  }

  function drawFrameScaled(frame, alpha) {
    drawFrameToContext(frame, ctx, 0, 0, state.zoom, alpha);
  }

  function drawGrid() {
    if (!state.showGrid) return;
    if (state.zoom < 8) return;

    ctx.save();
    ctx.strokeStyle = "rgba(17, 19, 27, 0.24)";
    ctx.lineWidth = 1;

    for (let x = 0; x <= state.width; x++) {
      const px = x * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
      ctx.stroke();
    }

    for (let y = 0; y <= state.height; y++) {
      const py = y * state.zoom + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawSelectionOverlay() {
    if (!state.selection.active) return;
    if (state.selection.w <= 0) return;
    if (state.selection.h <= 0) return;

    const x = state.selection.x * state.zoom;
    const y = state.selection.y * state.zoom;
    const w = state.selection.w * state.zoom;
    const h = state.selection.h * state.zoom;

    ctx.save();
    ctx.fillStyle = "rgba(105, 167, 255, 0.10)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "rgba(255, 255, 255, 0.95)";
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.strokeStyle = "rgba(27, 34, 54, 0.95)";
    ctx.setLineDash([6, 4]);
    ctx.lineDashOffset = 6;
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.restore();
  }

  function render() {
    syncActiveFrames();
    resizeDisplayCanvas();
    clearMainCanvas();

    if (state.showOnion) {
      const prevIndex = state.currentFrame - 1;
      const nextIndex = state.currentFrame + 1;

      if (prevIndex >= 0) {
        drawFrameScaled(state.frames[prevIndex], 0.18);
      }

      if (nextIndex < state.frames.length) {
        drawFrameScaled(state.frames[nextIndex], 0.12);
      }
    }

    const frame = getFrame();
    if (frame) {
      drawFrameScaled(frame, 1);
    }

    drawGrid();
    drawSelectionOverlay();
    updatePaletteCount();
    updateExportPreview();
  }

  function renderAllUi() {
    syncActiveFrames();
    render();
    renderAnimations();
    renderFrames();
    renderLayers();
    renderPalette();
    updateFrameFields();
    updateAnimationFields();
    updateToolUi();
  }

  function getCanvasPoint(event) {
    const rect = canvas.getBoundingClientRect();
    const normalizedX = (event.clientX - rect.left) / rect.width;
    const normalizedY = (event.clientY - rect.top) / rect.height;

    let x = Math.floor(normalizedX * state.width);
    let y = Math.floor(normalizedY * state.height);

    if (x < 0) x = 0;
    if (y < 0) y = 0;
    if (x >= state.width) x = state.width - 1;
    if (y >= state.height) y = state.height - 1;

    return {
      x: x,
      y: y
    };
  }

  function setSelectionFromPoints(x0, y0, x1, y1) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    state.selection.active = true;
    state.selection.x = minX;
    state.selection.y = minY;
    state.selection.w = maxX - minX + 1;
    state.selection.h = maxY - minY + 1;
  }

  function selectAll() {
    state.selection.active = true;
    state.selection.x = 0;
    state.selection.y = 0;
    state.selection.w = state.width;
    state.selection.h = state.height;
    renderAllUi();
  }

  function clearSelection() {
    state.selection.active = false;
    state.selectionDragStart = null;
    renderAllUi();
  }

  function hasSelection() {
    if (!state.selection.active) return false;
    if (state.selection.w <= 0) return false;
    if (state.selection.h <= 0) return false;
    return true;
  }

  function clampSelectionToCanvas() {
    if (!hasSelection()) return;

    if (state.selection.x < 0) state.selection.x = 0;
    if (state.selection.y < 0) state.selection.y = 0;
    if (state.selection.x >= state.width) state.selection.x = state.width - 1;
    if (state.selection.y >= state.height) state.selection.y = state.height - 1;

    if (state.selection.x + state.selection.w > state.width) {
      state.selection.w = state.width - state.selection.x;
    }

    if (state.selection.y + state.selection.h > state.height) {
      state.selection.h = state.height - state.selection.y;
    }
  }

  function copySelection() {
    if (!hasSelection()) return false;
    clampSelectionToCanvas();

    const layer = getLayer();
    if (!layer) return false;

    const clipCanvas = document.createElement("canvas");
    clipCanvas.width = state.selection.w;
    clipCanvas.height = state.selection.h;
    const clipCtx = clipCanvas.getContext("2d");
    clipCtx.imageSmoothingEnabled = false;
    const imageData = layer.ctx.getImageData(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    clipCtx.putImageData(imageData, 0, 0);

    state.clipboard = {
      canvas: clipCanvas,
      width: state.selection.w,
      height: state.selection.h,
      imageData: imageData
    };

    updateToolUi();
    return true;
  }

  function deleteSelection() {
    if (!hasSelection()) return;
    clampSelectionToCanvas();

    const layer = getLayer();
    if (!layer) return;

    pushUndo();
    layer.ctx.clearRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    renderAllUi();
  }

  function cutSelection() {
    if (!hasSelection()) return;
    const copied = copySelection();
    if (!copied) return;

    const layer = getLayer();
    if (!layer) return;

    pushUndo();
    layer.ctx.clearRect(state.selection.x, state.selection.y, state.selection.w, state.selection.h);
    renderAllUi();
  }

  function getPastePoint() {
    if (hasSelection()) {
      return {
        x: state.selection.x,
        y: state.selection.y
      };
    }

    if (!state.clipboard) {
      return {
        x: 0,
        y: 0
      };
    }

    let x = Math.floor((state.width - state.clipboard.width) / 2);
    let y = Math.floor((state.height - state.clipboard.height) / 2);
    if (x < 0) x = 0;
    if (y < 0) y = 0;

    return {
      x: x,
      y: y
    };
  }

  function pasteSelection(includeTransparentPixels) {
    if (!state.clipboard) return;

    const layer = getLayer();
    if (!layer) return;

    const point = getPastePoint();
    const pasteW = Math.min(state.clipboard.width, state.width - point.x);
    const pasteH = Math.min(state.clipboard.height, state.height - point.y);
    if (pasteW <= 0) return;
    if (pasteH <= 0) return;

    pushUndo();

    if (includeTransparentPixels) {
      const source = state.clipboard.imageData;
      const clipped = layer.ctx.createImageData(pasteW, pasteH);

      for (let y = 0; y < pasteH; y++) {
        for (let x = 0; x < pasteW; x++) {
          const sourceIndex = dataIndex(x, y, source.width);
          const targetIndex = dataIndex(x, y, pasteW);
          clipped.data[targetIndex] = source.data[sourceIndex];
          clipped.data[targetIndex + 1] = source.data[sourceIndex + 1];
          clipped.data[targetIndex + 2] = source.data[sourceIndex + 2];
          clipped.data[targetIndex + 3] = source.data[sourceIndex + 3];
        }
      }

      layer.ctx.putImageData(clipped, point.x, point.y);
    } else {
      const source = state.clipboard.imageData;
      const target = layer.ctx.getImageData(point.x, point.y, pasteW, pasteH);

      for (let y = 0; y < pasteH; y++) {
        for (let x = 0; x < pasteW; x++) {
          const sourceIndex = dataIndex(x, y, source.width);
          if (source.data[sourceIndex + 3] === 0) continue;

          const targetIndex = dataIndex(x, y, pasteW);
          target.data[targetIndex] = source.data[sourceIndex];
          target.data[targetIndex + 1] = source.data[sourceIndex + 1];
          target.data[targetIndex + 2] = source.data[sourceIndex + 2];
          target.data[targetIndex + 3] = source.data[sourceIndex + 3];
        }
      }

      layer.ctx.putImageData(target, point.x, point.y);
    }

    state.selection.active = true;
    state.selection.x = point.x;
    state.selection.y = point.y;
    state.selection.w = pasteW;
    state.selection.h = pasteH;
    renderAllUi();
  }

  function drawPixel(x, y, colorHex) {
    if (x < 0) return;
    if (y < 0) return;
    if (x >= state.width) return;
    if (y >= state.height) return;

    const layer = getLayer();
    if (!layer) return;
    const color = rgbaFromHex(colorHex, 255);
    layer.ctx.fillStyle = rgbaToCss(color);
    layer.ctx.fillRect(x, y, 1, 1);
  }

  function erasePixel(x, y) {
    if (x < 0) return;
    if (y < 0) return;
    if (x >= state.width) return;
    if (y >= state.height) return;

    const layer = getLayer();
    if (!layer) return;
    layer.ctx.clearRect(x, y, 1, 1);
  }

  function applyBrush(x, y, callback) {
    const half = Math.floor(state.brushSize / 2);
    const startX = x - half;
    const startY = y - half;

    for (let py = 0; py < state.brushSize; py++) {
      for (let px = 0; px < state.brushSize; px++) {
        const drawX = startX + px;
        const drawY = startY + py;
        if (drawX < 0) continue;
        if (drawY < 0) continue;
        if (drawX >= state.width) continue;
        if (drawY >= state.height) continue;
        callback(drawX, drawY);
      }
    }
  }

  function applySymmetryPoints(x, y, callback) {
    callback(x, y);

    if (!state.symmetry) return;

    const mirrorX = state.width - 1 - x;
    if (mirrorX !== x) {
      callback(mirrorX, y);
    }
  }

  function paintAt(x, y) {
    if (state.tool === "pencil") {
      applySymmetryPoints(x, y, function (px, py) {
        applyBrush(px, py, function (bx, by) {
          drawPixel(bx, by, state.primaryColor);
        });
      });
    }

    if (state.tool === "eraser") {
      applySymmetryPoints(x, y, function (px, py) {
        applyBrush(px, py, function (bx, by) {
          erasePixel(bx, by);
        });
      });
    }

    if (state.tool === "dither") {
      applySymmetryPoints(x, y, function (px, py) {
        applyBrush(px, py, function (bx, by) {
          const even = (bx + by) % 2 === 0;
          if (even) {
            drawPixel(bx, by, state.primaryColor);
          } else {
            drawPixel(bx, by, state.secondaryColor);
          }
        });
      });
    }

    if (state.tool === "shade") {
      shadeAt(x, y);
    }
  }

  function shadeAt(x, y) {
    const layer = getLayer();
    if (!layer) return;
    const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
    const index = dataIndex(x, y, state.width);
    if (imageData.data[index + 3] === 0) return;

    let amount = 18;
    if (state.shadeDarken) {
      amount = -18;
    }

    imageData.data[index] = clamp(imageData.data[index] + amount, 0, 255);
    imageData.data[index + 1] = clamp(imageData.data[index + 1] + amount, 0, 255);
    imageData.data[index + 2] = clamp(imageData.data[index + 2] + amount, 0, 255);
    layer.ctx.putImageData(imageData, 0, 0);
  }

  function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
  }

  function traceLine(x0, y0, x1, y1, callback) {
    let dx = Math.abs(x1 - x0);
    let sx = -1;
    if (x0 < x1) sx = 1;

    let dy = -Math.abs(y1 - y0);
    let sy = -1;
    if (y0 < y1) sy = 1;

    let err = dx + dy;

    while (true) {
      callback(x0, y0);

      if (x0 === x1 && y0 === y1) break;

      const e2 = 2 * err;
      if (e2 >= dy) {
        err += dy;
        x0 += sx;
      }

      if (e2 <= dx) {
        err += dx;
        y0 += sy;
      }
    }
  }

  function drawLine(x0, y0, x1, y1, colorHex) {
    traceLine(x0, y0, x1, y1, function (px, py) {
      applyBrush(px, py, function (bx, by) {
        drawPixel(bx, by, colorHex);
      });
    });
  }

  function drawBezier(x0, y0, x1, y1, colorHex) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance <= 0) {
      drawPixel(x0, y0, colorHex);
      return;
    }

    const midX = (x0 + x1) / 2;
    const midY = (y0 + y1) / 2;
    const perpX = -dy / distance;
    const perpY = dx / distance;
    const bend = (state.bezierBend / 100) * distance;
    const controlX = midX + perpX * bend;
    const controlY = midY + perpY * bend;
    let steps = Math.ceil(distance * 8);
    if (steps < 16) steps = 16;

    let previous = null;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const inv = 1 - t;
      const x = Math.round(inv * inv * x0 + 2 * inv * t * controlX + t * t * x1);
      const y = Math.round(inv * inv * y0 + 2 * inv * t * controlY + t * t * y1);

      if (previous === null) {
        drawLine(x, y, x, y, colorHex);
      } else {
        drawLine(previous.x, previous.y, x, y, colorHex);
      }

      previous = {
        x: x,
        y: y
      };
    }
  }

  function drawRect(x0, y0, x1, y1, colorHex) {
    const minX = Math.min(x0, x1);
    const maxX = Math.max(x0, x1);
    const minY = Math.min(y0, y1);
    const maxY = Math.max(y0, y1);

    for (let x = minX; x <= maxX; x++) {
      drawPixel(x, minY, colorHex);
      drawPixel(x, maxY, colorHex);
    }

    for (let y = minY; y <= maxY; y++) {
      drawPixel(minX, y, colorHex);
      drawPixel(maxX, y, colorHex);
    }
  }

  function drawCircle(cx, cy, ex, ey, colorHex) {
    const rx = Math.abs(ex - cx);
    const ry = Math.abs(ey - cy);
    const radius = Math.max(rx, ry);

    if (radius <= 0) {
      drawPixel(cx, cy, colorHex);
      return;
    }

    let steps = radius * 32;
    if (steps < 48) steps = 48;

    let first = null;
    let previous = null;

    for (let i = 0; i <= steps; i++) {
      const angle = (Math.PI * 2 * i) / steps;
      const x = Math.round(cx + Math.cos(angle) * radius);
      const y = Math.round(cy + Math.sin(angle) * radius);

      if (first === null) {
        first = {
          x: x,
          y: y
        };
      }

      if (previous === null) {
        drawPixel(x, y, colorHex);
      } else {
        drawLine(previous.x, previous.y, x, y, colorHex);
      }

      previous = {
        x: x,
        y: y
      };
    }

    if (first !== null && previous !== null) {
      drawLine(previous.x, previous.y, first.x, first.y, colorHex);
    }
  }

  function floodFill(x, y) {
    const layer = getLayer();
    if (!layer) return;
    const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
    const target = readPixelFromImageData(imageData, x, y);
    const fill = rgbaFromHex(state.primaryColor, 255);

    if (colorsMatch(target, fill)) return;

    const stack = [{ x: x, y: y }];
    const visited = new Set();

    while (stack.length > 0) {
      const current = stack.pop();
      const key = current.x + "," + current.y;
      if (visited.has(key)) continue;
      visited.add(key);

      if (current.x < 0) continue;
      if (current.y < 0) continue;
      if (current.x >= state.width) continue;
      if (current.y >= state.height) continue;

      const index = dataIndex(current.x, current.y, state.width);
      const currentColor = {
        r: imageData.data[index],
        g: imageData.data[index + 1],
        b: imageData.data[index + 2],
        a: imageData.data[index + 3]
      };

      if (!colorsMatch(currentColor, target)) continue;

      imageData.data[index] = fill.r;
      imageData.data[index + 1] = fill.g;
      imageData.data[index + 2] = fill.b;
      imageData.data[index + 3] = fill.a;

      stack.push({ x: current.x + 1, y: current.y });
      stack.push({ x: current.x - 1, y: current.y });
      stack.push({ x: current.x, y: current.y + 1 });
      stack.push({ x: current.x, y: current.y - 1 });
    }

    layer.ctx.putImageData(imageData, 0, 0);
  }

  function sampleCompositeColor(x, y) {
    const temp = document.createElement("canvas");
    temp.width = state.width;
    temp.height = state.height;
    compositeFrameToCanvas(getFrame(), temp, 1, null);
    const sampleCtx = temp.getContext("2d");
    const sample = sampleCtx.getImageData(x, y, 1, 1).data;
    if (sample[3] === 0) return;

    const color = {
      r: sample[0],
      g: sample[1],
      b: sample[2],
      a: sample[3]
    };

    state.pickedColor = hexFromRgba(color);
    state.primaryColor = state.pickedColor;
    els.primaryColorInput.value = state.primaryColor;
    addPaletteColor(state.primaryColor);
  }

  function getLayerSnapshot() {
    return getLayer().ctx.getImageData(0, 0, state.width, state.height);
  }

  function restoreLayerSnapshot(imageData) {
    getLayer().ctx.putImageData(imageData, 0, 0);
  }

  function pushUndo() {
    const snapshot = serializeProject();
    state.undoStack.push(snapshot);
    if (state.undoStack.length > 60) {
      state.undoStack.shift();
    }
    state.redoStack = [];
  }

  function undo() {
    if (state.undoStack.length === 0) return;
    const current = serializeProject();
    state.redoStack.push(current);
    const previous = state.undoStack.pop();
    loadProjectData(previous);
  }

  function redo() {
    if (state.redoStack.length === 0) return;
    const current = serializeProject();
    state.undoStack.push(current);
    const next = state.redoStack.pop();
    loadProjectData(next);
  }

  function onPointerDown(event) {
    event.preventDefault();
    const point = getCanvasPoint(event);
    state.isDrawing = true;
    state.startX = point.x;
    state.startY = point.y;
    state.lastX = point.x;
    state.lastY = point.y;
    state.shadeDarken = event.shiftKey;
    canvas.setPointerCapture(event.pointerId);

    if (state.tool === "select") {
      state.selectionDragStart = {
        x: point.x,
        y: point.y
      };
      setSelectionFromPoints(point.x, point.y, point.x, point.y);
      renderAllUi();
      return;
    }

    if (state.tool === "eyedropper") {
      sampleCompositeColor(point.x, point.y);
      renderAllUi();
      return;
    }

    pushUndo();

    if (state.tool === "fill") {
      floodFill(point.x, point.y);
      state.isDrawing = false;
      renderAllUi();
      return;
    }

    if (state.tool === "line" || state.tool === "rect" || state.tool === "circle") {
      state.startImageData = getLayerSnapshot();
      renderAllUi();
      return;
    }

    if (state.tool === "move") {
      state.startImageData = getLayerSnapshot();
      state.moveCanvas = document.createElement("canvas");
      state.moveCanvas.width = state.width;
      state.moveCanvas.height = state.height;
      state.moveCanvas.getContext("2d").putImageData(state.startImageData, 0, 0);
      return;
    }

    paintAt(point.x, point.y);
    renderAllUi();
  }

  function onPointerMove(event) {
    if (!state.isDrawing) return;
    event.preventDefault();
    const point = getCanvasPoint(event);

    if (state.tool === "select") {
      if (!state.selectionDragStart) return;
      setSelectionFromPoints(state.selectionDragStart.x, state.selectionDragStart.y, point.x, point.y);
      renderAllUi();
      return;
    }

    if (state.tool === "line" || state.tool === "rect" || state.tool === "circle") {
      restoreLayerSnapshot(state.startImageData);

      if (state.tool === "line") {
        if (state.lineMode === "bezier") {
          drawBezier(state.startX, state.startY, point.x, point.y, state.primaryColor);
        } else {
          drawLine(state.startX, state.startY, point.x, point.y, state.primaryColor);
        }
      }

      if (state.tool === "rect") {
        drawRect(state.startX, state.startY, point.x, point.y, state.primaryColor);
      }

      if (state.tool === "circle") {
        drawCircle(state.startX, state.startY, point.x, point.y, state.primaryColor);
      }

      renderAllUi();
      return;
    }

    if (state.tool === "move") {
      restoreLayerSnapshot(state.startImageData);
      const layer = getLayer();
      layer.ctx.clearRect(0, 0, state.width, state.height);
      const dx = point.x - state.startX;
      const dy = point.y - state.startY;
      layer.ctx.drawImage(state.moveCanvas, dx, dy);
      renderAllUi();
      return;
    }

    state.shadeDarken = event.shiftKey;

    if (state.tool === "pencil") {
      traceLine(state.lastX, state.lastY, point.x, point.y, function (px, py) {
        paintAt(px, py);
      });
    }

    if (state.tool === "eraser" || state.tool === "dither" || state.tool === "shade") {
      traceLine(state.lastX, state.lastY, point.x, point.y, function (px, py) {
        paintAt(px, py);
      });
    }

    state.lastX = point.x;
    state.lastY = point.y;
    renderAllUi();
  }

  function onPointerUp(event) {
    if (!state.isDrawing) return;
    event.preventDefault();
    state.isDrawing = false;
    state.selectionDragStart = null;
    state.startImageData = null;
    state.moveCanvas = null;
    renderAllUi();
  }

  function setTool(tool) {
    state.tool = tool;
    updateToolUi();
  }

  function updateToolUi() {
    for (let i = 0; i < els.toolButtons.length; i++) {
      const button = els.toolButtons[i];
      if (button.dataset.tool === state.tool) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    }

    const pretty = state.tool.charAt(0).toUpperCase() + state.tool.slice(1);
    els.activeToolLabel.textContent = pretty;
    els.brushSizeLabel.textContent = state.brushSize + "px";
    els.lineModeInput.value = state.lineMode;
    els.bezierBendInput.value = state.bezierBend;
    els.bezierBendLabel.textContent = String(state.bezierBend);

    if (state.tool === "line") {
      els.lineOptionsRow.style.display = "flex";
    } else {
      els.lineOptionsRow.style.display = "none";
    }

    if (state.tool === "select" || hasSelection() || state.clipboard !== null) {
      els.selectionOptionsRow.style.display = "flex";
    } else {
      els.selectionOptionsRow.style.display = "none";
    }

    els.copySelectionBtn.disabled = !hasSelection();
    els.cutSelectionBtn.disabled = !hasSelection();
    els.clearSelectionBtn.disabled = !hasSelection();
    els.pasteWithTransparencyBtn.disabled = state.clipboard === null;
    els.pasteNoTransparencyBtn.disabled = state.clipboard === null;

    if (state.showGrid) {
      els.gridToggleBtn.classList.add("active");
    } else {
      els.gridToggleBtn.classList.remove("active");
    }

    if (state.showOnion) {
      els.onionToggleBtn.classList.add("active");
    } else {
      els.onionToggleBtn.classList.remove("active");
    }

    if (state.symmetry) {
      els.symmetryToggleBtn.classList.add("active");
    } else {
      els.symmetryToggleBtn.classList.remove("active");
    }
  }

  function renderAnimations() {
    const previousValue = String(state.currentAnimation);
    els.animationSelect.innerHTML = "";

    for (let i = 0; i < state.animations.length; i++) {
      const animation = state.animations[i];
      const option = document.createElement("option");
      option.value = String(i);
      option.textContent = animation.name + " (" + animation.frames.length + ")";
      els.animationSelect.appendChild(option);
    }

    els.animationSelect.value = previousValue;
  }

  function updateAnimationFields() {
    const animation = getAnimation();
    if (!animation) return;
    els.animationSelect.value = String(state.currentAnimation);
    els.animationNameInput.value = animation.name;
    els.animationDurationInput.value = animation.duration;

    if (state.animations.length <= 1) {
      els.deleteAnimationBtn.disabled = true;
    } else {
      els.deleteAnimationBtn.disabled = false;
    }
  }

  function switchAnimation(index) {
    stopAnimation();
    state.currentAnimation = index;
    state.currentFrame = 0;
    state.currentLayer = 0;
    syncActiveFrames();
    renderAllUi();
  }

  function addAnimation() {
    pushUndo();
    const name = "Animation " + (state.animations.length + 1);
    const animation = createAnimation(name);
    state.animations.push(animation);
    state.currentAnimation = state.animations.length - 1;
    state.currentFrame = 0;
    state.currentLayer = 0;
    syncActiveFrames();
    renderAllUi();
  }

  function deleteAnimation() {
    if (state.animations.length <= 1) return;
    pushUndo();
    state.animations.splice(state.currentAnimation, 1);
    if (state.currentAnimation >= state.animations.length) {
      state.currentAnimation = state.animations.length - 1;
    }
    state.currentFrame = 0;
    state.currentLayer = 0;
    syncActiveFrames();
    renderAllUi();
  }

  function setAnimationDuration(value) {
    const animation = getAnimation();
    if (!animation) return;

    let duration = Number(value);
    if (duration < 30) duration = 30;
    animation.duration = duration;

    for (let i = 0; i < animation.frames.length; i++) {
      animation.frames[i].duration = duration;
    }

    renderAllUi();
  }

  function renderFrames() {
    syncActiveFrames();
    els.frameStrip.innerHTML = "";

    for (let i = 0; i < state.frames.length; i++) {
      const frame = state.frames[i];
      const button = document.createElement("button");
      button.className = "frame-card";
      button.draggable = true;
      button.dataset.index = String(i);

      if (i === state.currentFrame) {
        button.classList.add("active");
      }

      const thumb = document.createElement("canvas");
      thumb.width = 72;
      thumb.height = 54;
      thumb.className = "frame-thumb";
      const thumbCtx = thumb.getContext("2d");
      thumbCtx.imageSmoothingEnabled = false;
      const scaleX = thumb.width / state.width;
      const scaleY = thumb.height / state.height;
      const scale = Math.floor(Math.min(scaleX, scaleY));
      let finalScale = scale;
      if (finalScale < 1) finalScale = 1;
      const drawW = state.width * finalScale;
      const drawH = state.height * finalScale;
      const dx = Math.floor((thumb.width - drawW) / 2);
      const dy = Math.floor((thumb.height - drawH) / 2);
      drawFrameToContext(frame, thumbCtx, dx, dy, finalScale, null);

      const label = document.createElement("span");
      label.textContent = (i + 1) + " · " + frame.duration + "ms";

      button.appendChild(thumb);
      button.appendChild(label);

      button.addEventListener("click", function () {
        state.currentFrame = i;
        if (state.currentLayer >= getFrame().layers.length) {
          state.currentLayer = getFrame().layers.length - 1;
        }
        renderAllUi();
      });

      button.addEventListener("dragstart", function (event) {
        state.dragFrameIndex = i;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(i));
      });

      button.addEventListener("dragover", function (event) {
        event.preventDefault();
        button.classList.add("drag-over");
      });

      button.addEventListener("dragleave", function () {
        button.classList.remove("drag-over");
      });

      button.addEventListener("drop", function (event) {
        event.preventDefault();
        button.classList.remove("drag-over");
        let fromIndex = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isNaN(fromIndex)) {
          fromIndex = state.dragFrameIndex;
        }
        reorderFrame(fromIndex, i);
      });

      button.addEventListener("dragend", function () {
        state.dragFrameIndex = null;
        button.classList.remove("drag-over");
      });

      els.frameStrip.appendChild(button);
    }

    const animation = getAnimation();
    let name = "Animation";
    if (animation) {
      name = animation.name;
    }
    els.frameStatus.textContent = name + " · Frame " + (state.currentFrame + 1) + " of " + state.frames.length;
  }

  function updateFrameFields() {
    const frame = getFrame();
    if (!frame) return;
    els.frameDurationInput.value = frame.duration;
  }

  function addFrame() {
    pushUndo();
    const animation = getAnimation();
    const newFrame = createFrame(animation.duration);
    state.frames.splice(state.currentFrame + 1, 0, newFrame);
    state.currentFrame += 1;
    state.currentLayer = 0;
    renderAllUi();
  }

  function duplicateFrame() {
    pushUndo();
    const copy = cloneFrame(getFrame());
    state.frames.splice(state.currentFrame + 1, 0, copy);
    state.currentFrame += 1;
    renderAllUi();
  }

  function deleteFrame() {
    if (state.frames.length <= 1) return;
    pushUndo();
    state.frames.splice(state.currentFrame, 1);
    if (state.currentFrame >= state.frames.length) {
      state.currentFrame = state.frames.length - 1;
    }
    state.currentLayer = 0;
    renderAllUi();
  }

  function moveFrame(direction) {
    const target = state.currentFrame + direction;
    if (target < 0) return;
    if (target >= state.frames.length) return;
    reorderFrame(state.currentFrame, target);
  }

  function reorderFrame(fromIndex, toIndex) {
    if (fromIndex === null || fromIndex === undefined) return;
    if (fromIndex === toIndex) return;
    if (fromIndex < 0) return;
    if (toIndex < 0) return;
    if (fromIndex >= state.frames.length) return;
    if (toIndex >= state.frames.length) return;

    pushUndo();
    const moved = state.frames.splice(fromIndex, 1)[0];
    state.frames.splice(toIndex, 0, moved);
    state.currentFrame = toIndex;
    renderAllUi();
  }

  function playAnimation() {
    if (state.isPlaying) {
      stopAnimation();
      return;
    }

    state.isPlaying = true;
    els.playBtn.textContent = "Stop";
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (!state.isPlaying) return;

    const frame = getFrame();
    state.playTimer = window.setTimeout(function () {
      state.currentFrame += 1;
      if (state.currentFrame >= state.frames.length) {
        state.currentFrame = 0;
      }
      renderAllUi();
      scheduleNextFrame();
    }, frame.duration);
  }

  function stopAnimation() {
    state.isPlaying = false;
    els.playBtn.textContent = "Play";
    if (state.playTimer !== null) {
      window.clearTimeout(state.playTimer);
      state.playTimer = null;
    }
  }

  function renderLayers() {
    els.layerList.innerHTML = "";
    const frame = getFrame();
    if (!frame) return;

    for (let i = frame.layers.length - 1; i >= 0; i--) {
      const layer = frame.layers[i];
      const item = document.createElement("div");
      item.className = "layer-item";
      if (i === state.currentLayer) {
        item.classList.add("active");
      }

      const thumb = document.createElement("canvas");
      thumb.width = 34;
      thumb.height = 34;
      thumb.className = "layer-thumb";
      const thumbCtx = thumb.getContext("2d");
      thumbCtx.imageSmoothingEnabled = false;
      thumbCtx.drawImage(layer.canvas, 0, 0, 34, 34);

      const meta = document.createElement("div");
      meta.className = "layer-meta";

      const nameInput = document.createElement("input");
      nameInput.className = "layer-name-input";
      nameInput.type = "text";
      nameInput.value = layer.name;
      nameInput.addEventListener("input", function () {
        layer.name = nameInput.value;
      });

      const opacity = document.createElement("input");
      opacity.className = "layer-opacity";
      opacity.type = "range";
      opacity.min = "0";
      opacity.max = "1";
      opacity.step = "0.05";
      opacity.value = layer.opacity;
      opacity.addEventListener("input", function () {
        layer.opacity = Number(opacity.value);
        render();
      });

      meta.appendChild(nameInput);
      meta.appendChild(opacity);

      const visible = document.createElement("input");
      visible.className = "layer-visibility";
      visible.type = "checkbox";
      visible.checked = layer.visible;
      visible.title = "Visible";
      visible.addEventListener("change", function () {
        layer.visible = visible.checked;
        renderAllUi();
      });

      item.appendChild(thumb);
      item.appendChild(meta);
      item.appendChild(visible);

      item.addEventListener("click", function (event) {
        if (event.target === nameInput) return;
        if (event.target === opacity) return;
        if (event.target === visible) return;
        state.currentLayer = i;
        renderAllUi();
      });

      els.layerList.appendChild(item);
    }
  }

  function addLayer() {
    pushUndo();
    const frame = getFrame();
    frame.layers.push(createLayer("Layer " + (frame.layers.length + 1)));
    state.currentLayer = frame.layers.length - 1;
    renderAllUi();
  }

  function duplicateLayer() {
    pushUndo();
    const frame = getFrame();
    const layer = getLayer();
    const copy = cloneLayer(layer);
    copy.name = layer.name + " Copy";
    frame.layers.splice(state.currentLayer + 1, 0, copy);
    state.currentLayer += 1;
    renderAllUi();
  }

  function mergeLayerDown() {
    const frame = getFrame();
    if (state.currentLayer <= 0) return;
    if (frame.layers.length <= 1) return;

    pushUndo();
    const top = frame.layers[state.currentLayer];
    const below = frame.layers[state.currentLayer - 1];
    below.ctx.globalAlpha = top.opacity;
    below.ctx.drawImage(top.canvas, 0, 0);
    below.ctx.globalAlpha = 1;
    frame.layers.splice(state.currentLayer, 1);
    state.currentLayer -= 1;
    renderAllUi();
  }

  function moveLayer(direction) {
    const frame = getFrame();
    const target = state.currentLayer + direction;
    if (target < 0) return;
    if (target >= frame.layers.length) return;

    pushUndo();
    const layer = frame.layers.splice(state.currentLayer, 1)[0];
    frame.layers.splice(target, 0, layer);
    state.currentLayer = target;
    renderAllUi();
  }

  function flipLayer(horizontal) {
    pushUndo();
    const layer = getLayer();
    const temp = document.createElement("canvas");
    temp.width = state.width;
    temp.height = state.height;
    const tempCtx = temp.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(layer.canvas, 0, 0);

    layer.ctx.clearRect(0, 0, state.width, state.height);
    layer.ctx.save();

    if (horizontal) {
      layer.ctx.translate(state.width, 0);
      layer.ctx.scale(-1, 1);
    } else {
      layer.ctx.translate(0, state.height);
      layer.ctx.scale(1, -1);
    }

    layer.ctx.drawImage(temp, 0, 0);
    layer.ctx.restore();
    renderAllUi();
  }

  function rotateLayer90() {
    if (state.width !== state.height) {
      alert("Rotate 90° currently needs a square sprite.");
      return;
    }

    pushUndo();
    const layer = getLayer();
    const temp = document.createElement("canvas");
    temp.width = state.width;
    temp.height = state.height;
    const tempCtx = temp.getContext("2d");
    tempCtx.imageSmoothingEnabled = false;
    tempCtx.drawImage(layer.canvas, 0, 0);

    layer.ctx.clearRect(0, 0, state.width, state.height);
    layer.ctx.save();
    layer.ctx.translate(state.width, 0);
    layer.ctx.rotate(Math.PI / 2);
    layer.ctx.drawImage(temp, 0, 0);
    layer.ctx.restore();
    renderAllUi();
  }

  function applyOutline() {
    pushUndo();
    const layer = getLayer();
    const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
    const outline = rgbaFromHex(state.secondaryColor, 255);
    const newData = layer.ctx.createImageData(state.width, state.height);
    newData.data.set(imageData.data);

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const index = dataIndex(x, y, state.width);
        if (imageData.data[index + 3] !== 0) continue;
        if (!hasSolidNeighbor(imageData, x, y)) continue;

        newData.data[index] = outline.r;
        newData.data[index + 1] = outline.g;
        newData.data[index + 2] = outline.b;
        newData.data[index + 3] = outline.a;
      }
    }

    layer.ctx.putImageData(newData, 0, 0);
    renderAllUi();
  }

  function hasSolidNeighbor(imageData, x, y) {
    const points = [
      { x: x + 1, y: y },
      { x: x - 1, y: y },
      { x: x, y: y + 1 },
      { x: x, y: y - 1 }
    ];

    for (let i = 0; i < points.length; i++) {
      const point = points[i];
      if (point.x < 0) continue;
      if (point.y < 0) continue;
      if (point.x >= state.width) continue;
      if (point.y >= state.height) continue;
      const index = dataIndex(point.x, point.y, state.width);
      if (imageData.data[index + 3] !== 0) return true;
    }

    return false;
  }

  function clearLayer() {
    pushUndo();
    getLayer().ctx.clearRect(0, 0, state.width, state.height);
    renderAllUi();
  }

  function renderPalette() {
    els.paletteSwatches.innerHTML = "";

    for (let i = 0; i < state.palette.length; i++) {
      const color = state.palette[i];
      const swatch = document.createElement("button");
      swatch.className = "swatch";
      swatch.style.background = color;
      swatch.title = color;

      if (color.toLowerCase() === state.primaryColor.toLowerCase()) {
        swatch.classList.add("active");
      }

      swatch.addEventListener("click", function () {
        state.primaryColor = color;
        state.pickedColor = color;
        els.primaryColorInput.value = color;
        renderPalette();
      });

      els.paletteSwatches.appendChild(swatch);
    }
  }

  function addPaletteColor(color) {
    const cleaned = color.toLowerCase();

    for (let i = 0; i < state.palette.length; i++) {
      if (state.palette[i].toLowerCase() === cleaned) {
        renderPalette();
        return;
      }
    }

    state.palette.push(color);
    renderPalette();
  }

  function replacePickedColor() {
    pushUndo();
    const layer = getLayer();
    const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
    const from = rgbaFromHex(state.pickedColor, 255);
    const to = rgbaFromHex(state.primaryColor, 255);

    for (let y = 0; y < state.height; y++) {
      for (let x = 0; x < state.width; x++) {
        const index = dataIndex(x, y, state.width);
        const current = {
          r: imageData.data[index],
          g: imageData.data[index + 1],
          b: imageData.data[index + 2],
          a: imageData.data[index + 3]
        };

        if (!colorsMatch(current, from)) continue;

        imageData.data[index] = to.r;
        imageData.data[index + 1] = to.g;
        imageData.data[index + 2] = to.b;
        imageData.data[index + 3] = to.a;
      }
    }

    layer.ctx.putImageData(imageData, 0, 0);
    state.pickedColor = state.primaryColor;
    renderAllUi();
  }

  function updatePaletteCount() {
    const used = new Set();

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        const frame = animation.frames[frameIndex];
        for (let layerIndex = 0; layerIndex < frame.layers.length; layerIndex++) {
          const layer = frame.layers[layerIndex];
          const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            if (imageData.data[i + 3] === 0) continue;
            const color = imageData.data[i] + "," + imageData.data[i + 1] + "," + imageData.data[i + 2];
            used.add(color);
          }
        }
      }
    }

    const limit = Number(els.paletteLimitInput.value);
    els.paletteCountLabel.textContent = used.size + " colors used";

    const meter = els.paletteCountLabel.closest(".palette-meter");
    if (used.size > limit) {
      meter.classList.add("limit-warning");
    } else {
      meter.classList.remove("limit-warning");
    }
  }

  function getMaxFrameCount() {
    let max = 1;

    for (let i = 0; i < state.animations.length; i++) {
      const count = state.animations[i].frames.length;
      if (count > max) max = count;
    }

    return max;
  }

  function createSpriteSheet(scale) {
    const maxFrames = getMaxFrameCount();
    const frameWidth = state.width * scale;
    const frameHeight = state.height * scale;
    const sheet = document.createElement("canvas");
    sheet.width = frameWidth * maxFrames;
    sheet.height = frameHeight * state.animations.length;

    const sheetCtx = sheet.getContext("2d");
    sheetCtx.imageSmoothingEnabled = false;
    sheetCtx.clearRect(0, 0, sheet.width, sheet.height);

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      const y = animationIndex * frameHeight;

      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        const frame = animation.frames[frameIndex];
        const x = frameIndex * frameWidth;
        drawFrameToContext(frame, sheetCtx, x, y, scale, null);
      }
    }

    return sheet;
  }

  function createMetadata() {
    const scale = Number(els.exportScaleInput.value);
    const frameWidth = state.width * scale;
    const frameHeight = state.height * scale;
    const animations = [];

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      const frames = [];

      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        frames.push({
          index: frameIndex,
          x: frameIndex * frameWidth,
          y: animationIndex * frameHeight,
          width: frameWidth,
          height: frameHeight,
          duration: animation.frames[frameIndex].duration
        });
      }

      animations.push({
        name: animation.name,
        row: animationIndex,
        y: animationIndex * frameHeight,
        duration: animation.duration,
        frameCount: animation.frames.length,
        frames: frames
      });
    }

    return {
      version: 2,
      app: "SpritePad",
      enginePreset: els.enginePresetInput.value,
      layout: "animation_rows",
      sourceWidth: state.width,
      sourceHeight: state.height,
      scale: scale,
      frameWidth: frameWidth,
      frameHeight: frameHeight,
      columns: getMaxFrameCount(),
      rows: state.animations.length,
      animations: animations
    };
  }

  function updateExportPreview() {
    if (!els.exportScaleInput) return;
    const scale = Number(els.exportScaleInput.value);
    const sheet = createSpriteSheet(scale);

    let previewScale = 1;
    const maxWidth = 1200;
    const maxHeight = 360;

    if (sheet.width > maxWidth) {
      previewScale = maxWidth / sheet.width;
    }

    if (sheet.height * previewScale > maxHeight) {
      previewScale = maxHeight / sheet.height;
    }

    let previewWidth = Math.floor(sheet.width * previewScale);
    let previewHeight = Math.floor(sheet.height * previewScale);
    if (previewWidth < 1) previewWidth = 1;
    if (previewHeight < 1) previewHeight = 1;

    exportPreviewCanvas.width = previewWidth;
    exportPreviewCanvas.height = previewHeight;
    exportPreviewCtx.imageSmoothingEnabled = false;
    exportPreviewCtx.clearRect(0, 0, exportPreviewCanvas.width, exportPreviewCanvas.height);
    exportPreviewCtx.drawImage(sheet, 0, 0, previewWidth, previewHeight);
  }

  function downloadCanvas(canvasToDownload, filename) {
    const link = document.createElement("a");
    link.download = filename;
    link.href = canvasToDownload.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadText(text, filename) {
    const blob = new Blob([text], { type: "application/json" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function downloadSpriteSheet() {
    const scale = Number(els.exportScaleInput.value);
    const sheet = createSpriteSheet(scale);
    downloadCanvas(sheet, "spritepad-animation-rows.png");
  }

  function downloadMetadata() {
    const metadata = createMetadata();
    downloadText(JSON.stringify(metadata, null, 2), "spritepad-metadata.json");
  }

  function createImportNotes() {
    const preset = els.enginePresetInput.value;
    const scale = Number(els.exportScaleInput.value);
    const frameWidth = state.width * scale;
    const frameHeight = state.height * scale;
    let notes = "SpritePad Import Notes\n";
    notes += "Layout: one animation per row\n";
    notes += "Frame size: " + frameWidth + "x" + frameHeight + "\n";
    notes += "Rows: " + state.animations.length + "\n";
    notes += "Columns: " + getMaxFrameCount() + "\n\n";

    for (let i = 0; i < state.animations.length; i++) {
      const animation = state.animations[i];
      notes += "Row " + (i + 1) + ": " + animation.name + " — " + animation.frames.length + " frames — " + animation.duration + "ms default\n";
    }

    notes += "\n";

    if (preset === "stencyl") {
      notes += "Stencyl: import each row as its own animation. Use the frame size above and match each row name to the animation name.\n";
    }

    if (preset === "godot") {
      notes += "Godot: slice the sheet by the frame size above. Each row maps to a named animation in AnimatedSprite2D/SpriteFrames.\n";
    }

    if (preset === "unity") {
      notes += "Unity: set Sprite Mode to Multiple, slice by grid using the frame size above, then build clips from each row.\n";
    }

    if (preset === "gamemaker") {
      notes += "GameMaker: split rows into separate animation strips or import by grid using the frame dimensions above.\n";
    }

    if (preset === "generic") {
      notes += "Generic: slice by grid. Each animation is a row; unused cells at the end of shorter rows are transparent.\n";
    }

    return notes;
  }

  function copyImportNotes() {
    const notes = createImportNotes();
    navigator.clipboard.writeText(notes).then(function () {
      alert("Import notes copied.");
    }).catch(function () {
      alert(notes);
    });
  }

  function serializeProject() {
    const animations = [];

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      const frames = [];

      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        const frame = animation.frames[frameIndex];
        const layers = [];

        for (let layerIndex = 0; layerIndex < frame.layers.length; layerIndex++) {
          const layer = frame.layers[layerIndex];
          layers.push({
            name: layer.name,
            visible: layer.visible,
            opacity: layer.opacity,
            dataUrl: layer.canvas.toDataURL("image/png")
          });
        }

        frames.push({
          duration: frame.duration,
          layers: layers
        });
      }

      animations.push({
        name: animation.name,
        duration: animation.duration,
        frames: frames
      });
    }

    return {
      version: 2,
      width: state.width,
      height: state.height,
      currentAnimation: state.currentAnimation,
      currentFrame: state.currentFrame,
      currentLayer: state.currentLayer,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      palette: state.palette,
      animations: animations
    };
  }

  function createAnimationDataFromOldFrames(data) {
    const animationMap = [];
    const animationNames = [];

    for (let i = 0; i < data.frames.length; i++) {
      const sourceFrame = data.frames[i];
      let name = sourceFrame.tag;
      if (!name) name = "Idle";

      let animationIndex = animationNames.indexOf(name);
      if (animationIndex < 0) {
        animationNames.push(name);
        animationMap.push({
          name: name,
          duration: sourceFrame.duration,
          frames: []
        });
        animationIndex = animationMap.length - 1;
      }

      animationMap[animationIndex].frames.push(sourceFrame);
    }

    return animationMap;
  }

  function loadProjectData(data) {
    stopAnimation();
    state.width = data.width;
    state.height = data.height;
    state.currentAnimation = 0;
    state.currentFrame = 0;
    state.currentLayer = data.currentLayer || 0;
    state.primaryColor = data.primaryColor || "#2f7cff";
    state.secondaryColor = data.secondaryColor || "#101322";
    state.palette = data.palette || state.palette;
    state.animations = [];
    state.frames = [];
    state.selection.active = false;
    state.selectionDragStart = null;

    if (data.currentAnimation !== undefined) state.currentAnimation = data.currentAnimation;
    if (data.currentFrame !== undefined) state.currentFrame = data.currentFrame;

    els.primaryColorInput.value = state.primaryColor;
    els.secondaryColorInput.value = state.secondaryColor;
    els.newWidthInput.value = state.width;
    els.newHeightInput.value = state.height;

    let sourceAnimations = data.animations;
    if (!sourceAnimations && data.frames) {
      sourceAnimations = createAnimationDataFromOldFrames(data);
    }

    if (!sourceAnimations || sourceAnimations.length === 0) {
      sourceAnimations = [{
        name: "Idle",
        duration: 120,
        frames: [{
          duration: 120,
          layers: []
        }]
      }];
    }

    let remaining = 0;

    for (let animationIndex = 0; animationIndex < sourceAnimations.length; animationIndex++) {
      const sourceAnimation = sourceAnimations[animationIndex];
      const animation = {
        name: sourceAnimation.name || ("Animation " + (animationIndex + 1)),
        duration: sourceAnimation.duration || 120,
        frames: []
      };

      for (let frameIndex = 0; frameIndex < sourceAnimation.frames.length; frameIndex++) {
        const sourceFrame = sourceAnimation.frames[frameIndex];
        const frame = {
          duration: sourceFrame.duration || animation.duration,
          layers: []
        };

        for (let layerIndex = 0; layerIndex < sourceFrame.layers.length; layerIndex++) {
          const sourceLayer = sourceFrame.layers[layerIndex];
          const layer = createLayer(sourceLayer.name || ("Layer " + (layerIndex + 1)));
          layer.visible = sourceLayer.visible;
          if (layer.visible === undefined) layer.visible = true;
          layer.opacity = sourceLayer.opacity;
          if (layer.opacity === undefined) layer.opacity = 1;
          frame.layers.push(layer);
          remaining += 1;

          const image = new Image();
          image.onload = function () {
            layer.ctx.clearRect(0, 0, state.width, state.height);
            layer.ctx.drawImage(image, 0, 0);
            remaining -= 1;
            if (remaining === 0) {
              syncActiveFrames();
              renderAllUi();
            }
          };
          image.src = sourceLayer.dataUrl;
        }

        if (frame.layers.length === 0) {
          frame.layers.push(createLayer("Layer 1"));
        }

        animation.frames.push(frame);
      }

      if (animation.frames.length === 0) {
        animation.frames.push(createFrame(animation.duration));
      }

      state.animations.push(animation);
    }

    if (state.currentAnimation >= state.animations.length) state.currentAnimation = state.animations.length - 1;
    if (state.currentAnimation < 0) state.currentAnimation = 0;
    syncActiveFrames();

    if (remaining === 0) {
      renderAllUi();
    }
  }

  function saveProject() {
    const data = serializeProject();
    downloadText(JSON.stringify(data, null, 2), "spritepad-project.spritepad");
  }

  function openProject(file) {
    const reader = new FileReader();
    reader.onload = function () {
      try {
        const data = JSON.parse(reader.result);
        state.undoStack = [];
        state.redoStack = [];
        loadProjectData(data);
      } catch (error) {
        alert("That project file could not be opened.");
      }
    };
    reader.readAsText(file);
  }

  function applySpriteSize() {
    const width = Number(els.newWidthInput.value);
    const height = Number(els.newHeightInput.value);
    if (width < 4 || height < 4) return;
    if (width > 256 || height > 256) return;

    if (width === state.width && height === state.height) return;

    const confirmed = window.confirm("Apply the new sprite size now? Existing art will be preserved from the top-left corner.");
    if (!confirmed) return;

    pushUndo();
    state.width = width;
    state.height = height;

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        const frame = animation.frames[frameIndex];
        for (let layerIndex = 0; layerIndex < frame.layers.length; layerIndex++) {
          const layer = frame.layers[layerIndex];
          const oldCanvas = layer.canvas;
          const newCanvas = document.createElement("canvas");
          newCanvas.width = state.width;
          newCanvas.height = state.height;
          const newCtx = newCanvas.getContext("2d");
          newCtx.imageSmoothingEnabled = false;
          newCtx.drawImage(oldCanvas, 0, 0);
          layer.canvas = newCanvas;
          layer.ctx = newCtx;
        }
      }
    }

    if (hasSelection()) {
      clampSelectionToCanvas();
    }

    renderAllUi();
  }

  function setupEvents() {
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);

    for (let i = 0; i < els.toolButtons.length; i++) {
      els.toolButtons[i].addEventListener("click", function () {
        setTool(this.dataset.tool);
      });
    }

    els.brushSizeInput.addEventListener("input", function () {
      state.brushSize = Number(els.brushSizeInput.value);
      updateToolUi();
    });

    els.zoomInput.addEventListener("input", function () {
      state.zoom = Number(els.zoomInput.value);
      render();
    });

    els.lineModeInput.addEventListener("change", function () {
      state.lineMode = els.lineModeInput.value;
      updateToolUi();
    });

    els.bezierBendInput.addEventListener("input", function () {
      state.bezierBend = Number(els.bezierBendInput.value);
      updateToolUi();
    });

    els.gridToggleBtn.addEventListener("click", function () {
      state.showGrid = !state.showGrid;
      renderAllUi();
    });

    els.onionToggleBtn.addEventListener("click", function () {
      state.showOnion = !state.showOnion;
      renderAllUi();
    });

    els.symmetryToggleBtn.addEventListener("click", function () {
      state.symmetry = !state.symmetry;
      updateToolUi();
    });

    els.animationSelect.addEventListener("change", function () {
      switchAnimation(Number(els.animationSelect.value));
    });

    els.animationNameInput.addEventListener("input", function () {
      const animation = getAnimation();
      animation.name = els.animationNameInput.value;
      renderAnimations();
      updateAnimationFields();
      renderFrames();
      updateExportPreview();
    });

    els.animationDurationInput.addEventListener("change", function () {
      setAnimationDuration(els.animationDurationInput.value);
    });

    els.addAnimationBtn.addEventListener("click", addAnimation);
    els.deleteAnimationBtn.addEventListener("click", deleteAnimation);

    els.addFrameBtn.addEventListener("click", addFrame);
    els.dupFrameBtn.addEventListener("click", duplicateFrame);
    els.deleteFrameBtn.addEventListener("click", deleteFrame);
    els.moveFrameLeftBtn.addEventListener("click", function () {
      moveFrame(-1);
    });
    els.moveFrameRightBtn.addEventListener("click", function () {
      moveFrame(1);
    });
    els.playBtn.addEventListener("click", playAnimation);

    els.frameDurationInput.addEventListener("input", function () {
      let duration = Number(els.frameDurationInput.value);
      if (duration < 30) duration = 30;
      getFrame().duration = duration;
      renderFrames();
      updateExportPreview();
    });

    els.newProjectBtn.addEventListener("click", applySpriteSize);

    for (let i = 0; i < els.templateButtons.length; i++) {
      els.templateButtons[i].addEventListener("click", function () {
        for (let j = 0; j < els.templateButtons.length; j++) {
          els.templateButtons[j].classList.remove("active");
        }
        this.classList.add("active");
        els.newWidthInput.value = this.dataset.size;
        els.newHeightInput.value = this.dataset.size;
      });
    }

    for (let i = 0; i < els.tabButtons.length; i++) {
      els.tabButtons[i].addEventListener("click", function () {
        setTab(this.dataset.tab);
      });
    }

    els.addLayerBtn.addEventListener("click", addLayer);
    els.duplicateLayerBtn.addEventListener("click", duplicateLayer);
    els.mergeLayerBtn.addEventListener("click", mergeLayerDown);
    els.moveLayerUpBtn.addEventListener("click", function () {
      moveLayer(1);
    });
    els.moveLayerDownBtn.addEventListener("click", function () {
      moveLayer(-1);
    });
    els.flipHBtn.addEventListener("click", function () {
      flipLayer(true);
    });
    els.flipVBtn.addEventListener("click", function () {
      flipLayer(false);
    });
    els.rotateLayerBtn.addEventListener("click", rotateLayer90);
    els.outlineBtn.addEventListener("click", applyOutline);

    els.primaryColorInput.addEventListener("input", function () {
      state.primaryColor = els.primaryColorInput.value;
      state.pickedColor = state.primaryColor;
    });

    els.primaryColorInput.addEventListener("change", function () {
      addPaletteColor(state.primaryColor);
    });

    els.secondaryColorInput.addEventListener("input", function () {
      state.secondaryColor = els.secondaryColorInput.value;
    });

    els.secondaryColorInput.addEventListener("change", function () {
      addPaletteColor(state.secondaryColor);
    });

    els.addColorBtn.addEventListener("click", function () {
      addPaletteColor(state.primaryColor);
    });

    els.replaceColorBtn.addEventListener("click", replacePickedColor);
    els.clearLayerBtn.addEventListener("click", clearLayer);
    els.paletteLimitInput.addEventListener("input", updatePaletteCount);

    els.copySelectionBtn.addEventListener("click", copySelection);
    els.cutSelectionBtn.addEventListener("click", cutSelection);
    els.pasteWithTransparencyBtn.addEventListener("click", function () {
      pasteSelection(true);
    });
    els.pasteNoTransparencyBtn.addEventListener("click", function () {
      pasteSelection(false);
    });
    els.clearSelectionBtn.addEventListener("click", clearSelection);

    els.saveProjectBtn.addEventListener("click", saveProject);
    els.openProjectInput.addEventListener("change", function () {
      if (els.openProjectInput.files.length === 0) return;
      openProject(els.openProjectInput.files[0]);
      els.openProjectInput.value = "";
    });

    els.undoBtn.addEventListener("click", undo);
    els.redoBtn.addEventListener("click", redo);
    els.exportPngBtn.addEventListener("click", downloadSpriteSheet);
    els.downloadSheetBtn.addEventListener("click", downloadSpriteSheet);
    els.downloadJsonBtn.addEventListener("click", downloadMetadata);
    els.copyNotesBtn.addEventListener("click", copyImportNotes);
    els.exportScaleInput.addEventListener("change", updateExportPreview);
    els.enginePresetInput.addEventListener("change", updateExportPreview);

    for (let i = 0; i < els.menuRoots.length; i++) {
      els.menuRoots[i].addEventListener("click", function (event) {
        event.stopPropagation();
        toggleMenuGroup(els.menuGroups[i]);
      });
    }

    for (let i = 0; i < els.menuGroups.length; i++) {
      els.menuGroups[i].addEventListener("mouseenter", function () {
        if (!state.menuIsOpen) return;
        openMenuGroup(this);
      });
    }

    for (let i = 0; i < els.menuActionButtons.length; i++) {
      els.menuActionButtons[i].addEventListener("click", function (event) {
        event.stopPropagation();
        closeMenu();
        executeAction(this.dataset.action);
      });
    }

    document.addEventListener("pointerdown", function (event) {
      if (!state.menuIsOpen) return;
      if (els.menuBar.contains(event.target)) return;
      closeMenu();
    });

    els.shortcutCloseBtn.addEventListener("click", closeShortcutsModal);
    els.shortcutResetBtn.addEventListener("click", resetShortcuts);
    els.shortcutModal.addEventListener("click", function (event) {
      if (event.target === els.shortcutModal) {
        closeShortcutsModal();
      }
    });

    window.addEventListener("keydown", handleKeys);
  }

  function toggleMenuGroup(group) {
    if (state.menuIsOpen && state.activeMenuGroup === group) {
      closeMenu();
      return;
    }

    openMenuGroup(group);
  }

  function openMenuGroup(group) {
    if (group == null) return;

    state.menuIsOpen = true;
    state.activeMenuGroup = group;
    els.menuBar.classList.add("menu-open");

    for (let i = 0; i < els.menuGroups.length; i++) {
      if (els.menuGroups[i] === group) {
        els.menuGroups[i].classList.add("active");
      } else {
        els.menuGroups[i].classList.remove("active");
      }
    }
  }

  function closeMenu() {
    state.menuIsOpen = false;
    state.activeMenuGroup = null;

    if (els.menuBar != null) {
      els.menuBar.classList.remove("menu-open");
    }

    for (let i = 0; i < els.menuGroups.length; i++) {
      els.menuGroups[i].classList.remove("active");
    }
  }

  function setTab(tabName) {
    for (let i = 0; i < els.tabButtons.length; i++) {
      const button = els.tabButtons[i];
      if (button.dataset.tab === tabName) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }
    }

    els.layersTab.classList.remove("active");
    els.paletteTab.classList.remove("active");
    els.exportTab.classList.remove("active");

    if (tabName === "layers") els.layersTab.classList.add("active");
    if (tabName === "palette") els.paletteTab.classList.add("active");
    if (tabName === "export") els.exportTab.classList.add("active");
  }

  function executeAction(action) {
    if (!action) return;

    if (action === "saveProject") saveProject();
    if (action === "openProject") els.openProjectInput.click();
    if (action === "downloadSheet") downloadSpriteSheet();
    if (action === "downloadJson") downloadMetadata();
    if (action === "copyNotes") copyImportNotes();

    if (action === "undo") undo();
    if (action === "redo") redo();
    if (action === "copySelection") copySelection();
    if (action === "cutSelection") cutSelection();
    if (action === "pasteWithTransparency") pasteSelection(true);
    if (action === "pasteNoTransparency") pasteSelection(false);
    if (action === "deleteSelection") deleteSelection();
    if (action === "selectAll") selectAll();
    if (action === "clearSelection") clearSelection();

    if (action === "toolPencil") setTool("pencil");
    if (action === "toolEraser") setTool("eraser");
    if (action === "toolFill") setTool("fill");
    if (action === "toolLine") setTool("line");
    if (action === "toolRect") setTool("rect");
    if (action === "toolCircle") setTool("circle");
    if (action === "toolSelect") setTool("select");
    if (action === "toolEyedropper") setTool("eyedropper");
    if (action === "toolDither") setTool("dither");
    if (action === "toolShade") setTool("shade");
    if (action === "toolMove") setTool("move");
    if (action === "toggleBezier") toggleBezierMode();

    if (action === "toggleGrid") {
      state.showGrid = !state.showGrid;
      renderAllUi();
    }
    if (action === "toggleOnion") {
      state.showOnion = !state.showOnion;
      renderAllUi();
    }
    if (action === "toggleSymmetry") {
      state.symmetry = !state.symmetry;
      updateToolUi();
    }
    if (action === "tabLayers") setTab("layers");
    if (action === "tabPalette") setTab("palette");
    if (action === "tabExport") setTab("export");
    if (action === "zoomIn") changeZoom(1);
    if (action === "zoomOut") changeZoom(-1);

    if (action === "addLayer") addLayer();
    if (action === "duplicateLayer") duplicateLayer();
    if (action === "mergeLayerDown") mergeLayerDown();
    if (action === "moveLayerUp") moveLayer(1);
    if (action === "moveLayerDown") moveLayer(-1);
    if (action === "flipLayerH") flipLayer(true);
    if (action === "flipLayerV") flipLayer(false);
    if (action === "rotateLayer") rotateLayer90();
    if (action === "outlineLayer") applyOutline();
    if (action === "clearLayer") clearLayer();

    if (action === "playAnimation") playAnimation();
    if (action === "addAnimation") addAnimation();
    if (action === "deleteAnimation") deleteAnimation();
    if (action === "addFrame") addFrame();
    if (action === "duplicateFrame") duplicateFrame();
    if (action === "deleteFrame") deleteFrame();
    if (action === "moveFrameLeft") moveFrame(-1);
    if (action === "moveFrameRight") moveFrame(1);

    if (action === "openShortcuts") openShortcutsModal();
  }

  function toggleBezierMode() {
    if (state.lineMode === "bezier") {
      state.lineMode = "straight";
    } else {
      state.lineMode = "bezier";
      setTool("line");
    }

    updateToolUi();
  }

  function changeZoom(direction) {
    let next = state.zoom + direction;
    if (next < Number(els.zoomInput.min)) next = Number(els.zoomInput.min);
    if (next > Number(els.zoomInput.max)) next = Number(els.zoomInput.max);
    state.zoom = next;
    els.zoomInput.value = String(next);
    renderAllUi();
  }

  function normalizeShortcutEvent(event) {
    let key = event.key;
    if (!key) return "";

    if (key === "Control") return "";
    if (key === "Meta") return "";
    if (key === "Alt") return "";
    if (key === "Shift") return "";

    if (key === " ") key = "Space";
    if (key === "Esc") key = "Escape";
    if (key.length === 1) key = key.toUpperCase();

    const parts = [];
    if (event.ctrlKey || event.metaKey) parts.push("Ctrl");
    if (event.altKey) parts.push("Alt");
    if (event.shiftKey) parts.push("Shift");
    parts.push(key);

    return parts.join("+");
  }

  function loadShortcuts() {
    state.shortcuts = createDefaultShortcuts();

    try {
      const saved = window.localStorage.getItem(shortcutStorageKey);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      for (const action in parsed) {
        if (!Object.prototype.hasOwnProperty.call(parsed, action)) continue;
        if (!Object.prototype.hasOwnProperty.call(actionInfo, action)) continue;
        state.shortcuts[action] = parsed[action];
      }
    } catch (error) {
      state.shortcuts = createDefaultShortcuts();
    }
  }

  function saveShortcuts() {
    try {
      window.localStorage.setItem(shortcutStorageKey, JSON.stringify(state.shortcuts));
    } catch (error) {
      return;
    }
  }

  function getActionLabel(actionId) {
    if (!actionInfo[actionId]) return actionId;
    return actionInfo[actionId].label;
  }

  function getActionForShortcut(combo) {
    if (!combo) return "";

    for (const action in state.shortcuts) {
      if (!Object.prototype.hasOwnProperty.call(state.shortcuts, action)) continue;
      if (state.shortcuts[action] === combo) return action;
    }

    return "";
  }

  function setShortcut(actionId, combo) {
    if (!Object.prototype.hasOwnProperty.call(actionInfo, actionId)) return;

    if (combo !== "") {
      for (const action in state.shortcuts) {
        if (!Object.prototype.hasOwnProperty.call(state.shortcuts, action)) continue;
        if (action === actionId) continue;
        if (state.shortcuts[action] === combo) {
          state.shortcuts[action] = "";
        }
      }
    }

    state.shortcuts[actionId] = combo;
    saveShortcuts();
    updateShortcutLabels();
    renderShortcutRows();
  }

  function formatShortcut(combo) {
    if (!combo) return "";
    return combo.replace("ArrowLeft", "←").replace("ArrowRight", "→").replace("ArrowUp", "↑").replace("ArrowDown", "↓");
  }

  function updateShortcutLabels() {
    for (let i = 0; i < els.shortcutLabels.length; i++) {
      const label = els.shortcutLabels[i];
      const action = label.dataset.shortcutLabel;
      const combo = state.shortcuts[action] || "";
      label.textContent = formatShortcut(combo);
    }

    els.undoBtn.title = state.shortcuts.undo || "";
    els.redoBtn.title = state.shortcuts.redo || "";
    els.saveProjectBtn.title = state.shortcuts.saveProject || "";
    els.exportPngBtn.title = state.shortcuts.downloadSheet || "";
  }

  function openShortcutsModal() {
    renderShortcutRows();
    state.shortcutCaptureAction = null;
    els.shortcutCaptureHint.classList.add("hidden");
    els.shortcutModal.classList.remove("hidden");
  }

  function closeShortcutsModal() {
    state.shortcutCaptureAction = null;
    els.shortcutCaptureHint.classList.add("hidden");
    els.shortcutModal.classList.add("hidden");
  }

  function resetShortcuts() {
    state.shortcuts = createDefaultShortcuts();
    saveShortcuts();
    updateShortcutLabels();
    renderShortcutRows();
  }

  function renderShortcutRows() {
    els.shortcutRows.innerHTML = "";

    for (let groupIndex = 0; groupIndex < actionGroups.length; groupIndex++) {
      const group = actionGroups[groupIndex];
      const heading = document.createElement("h3");
      heading.textContent = group.name;
      els.shortcutRows.appendChild(heading);

      for (let actionIndex = 0; actionIndex < group.actions.length; actionIndex++) {
        const action = group.actions[actionIndex];
        const row = document.createElement("div");
        row.className = "shortcut-row";

        const name = document.createElement("div");
        name.className = "shortcut-name";
        name.textContent = action.label;

        const key = document.createElement("button");
        key.className = "shortcut-key";
        key.textContent = formatShortcut(state.shortcuts[action.id]) || "Unassigned";
        key.addEventListener("click", function () {
          state.shortcutCaptureAction = action.id;
          els.shortcutCaptureHint.textContent = "Assigning " + action.label + ". Press a key combo… Esc cancels.";
          els.shortcutCaptureHint.classList.remove("hidden");
        });

        const clear = document.createElement("button");
        clear.className = "ghost-btn micro-btn";
        clear.textContent = "Clear";
        clear.addEventListener("click", function () {
          setShortcut(action.id, "");
        });

        row.appendChild(name);
        row.appendChild(key);
        row.appendChild(clear);
        els.shortcutRows.appendChild(row);
      }
    }
  }

  function isTypingTarget(element) {
    if (!element) return false;
    if (element.tagName === "INPUT") return true;
    if (element.tagName === "SELECT") return true;
    if (element.tagName === "TEXTAREA") return true;
    if (element.isContentEditable) return true;
    return false;
  }

  function handleKeys(event) {
    if (event.key === "Escape" && state.menuIsOpen) {
      closeMenu();
      event.preventDefault();
      return;
    }
    if (state.shortcutCaptureAction !== null) {
      event.preventDefault();

      if (event.key === "Escape") {
        state.shortcutCaptureAction = null;
        els.shortcutCaptureHint.classList.add("hidden");
        return;
      }

      const captured = normalizeShortcutEvent(event);
      if (!captured) return;
      setShortcut(state.shortcutCaptureAction, captured);
      state.shortcutCaptureAction = null;
      els.shortcutCaptureHint.classList.add("hidden");
      return;
    }

    const active = document.activeElement;
    if (isTypingTarget(active)) return;

    const combo = normalizeShortcutEvent(event);
    if (!combo) return;

    const action = getActionForShortcut(combo);
    if (!action) return;

    event.preventDefault();
    executeAction(action);
  }

  function initDemoSprite() {
    const idle = {
      name: "Idle",
      duration: 140,
      frames: [createFrame(140), createFrame(140), createFrame(140), createFrame(140)]
    };

    const blink = {
      name: "Blink",
      duration: 110,
      frames: [createFrame(110), createFrame(110)]
    };

    state.animations = [idle, blink];
    state.currentAnimation = 0;
    state.currentFrame = 0;
    state.currentLayer = 0;
    syncActiveFrames();

    for (let i = 0; i < idle.frames.length; i++) {
      const layer = idle.frames[i].layers[0];
      layer.name = "Sprite";
      const bob = i % 2;

      layer.ctx.fillStyle = "#2f7cff";
      layer.ctx.fillRect(12, 10 + bob, 8, 10);
      layer.ctx.fillStyle = "#101322";
      layer.ctx.fillRect(14, 13 + bob, 2, 2);
      layer.ctx.fillRect(18, 13 + bob, 2, 2);
      layer.ctx.fillStyle = "#ffcc4d";
      layer.ctx.fillRect(13, 21 + bob, 3, 5);
      layer.ctx.fillRect(18, 21 + bob, 3, 5);
    }

    for (let j = 0; j < blink.frames.length; j++) {
      const layer = blink.frames[j].layers[0];
      layer.name = "Sprite";
      layer.ctx.fillStyle = "#2f7cff";
      layer.ctx.fillRect(12, 10, 8, 10);
      layer.ctx.fillStyle = "#101322";
      if (j === 0) {
        layer.ctx.fillRect(14, 13, 2, 2);
        layer.ctx.fillRect(18, 13, 2, 2);
      } else {
        layer.ctx.fillRect(14, 14, 2, 1);
        layer.ctx.fillRect(18, 14, 2, 1);
      }
      layer.ctx.fillStyle = "#ffcc4d";
      layer.ctx.fillRect(13, 21, 3, 5);
      layer.ctx.fillRect(18, 21, 3, 5);
    }
  }

  function boot() {
    loadShortcuts();
    initDemoSprite();
    resizeDisplayCanvas();
    setupEvents();
    updateShortcutLabels();
    renderAllUi();
  }

  boot();
})();
