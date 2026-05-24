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
    layerPreviewZoom: 1,
    tool: "brush",
    secondaryTool: "eraser",
    strokeTool: "brush",
    strokeColor: "#000000",
    activePointerButton: 0,
    brushSize: 1,
    isPanningCanvas: false,
    canvasPanX: 0,
    canvasPanY: 0,
    panStartX: 0,
    panStartY: 0,
    panOriginX: 0,
    panOriginY: 0,
    primaryColor: "#000000",
    secondaryColor: "#ffffff",
    symmetry: false,
    showGrid: false,
    showOnion: false,
    lineMode: "straight",
    bezierBend: 35,
    isDrawing: false,
    startX: 0,
    startY: 0,
    lastX: 0,
    lastY: 0,
    startImageData: null,
    moveCanvas: null,
    currentAnimation: 0,
    currentFrame: 0,
    currentLayer: 0,
    animations: [],
    frames: [],
    palette: [
      "#000000", "#ffffff", "#ffcc4d", "#ff5b7f",
      "#53e086", "#2f7cff", "#7f5cff", "#101322",
      "#3b2f52", "#1f8a70", "#f25f5c", "#70c1b3",
      "#f3ffbd", "#b2dbbf", "#247ba0", "#50514f"
    ],
    customSwatches: [
      "#000000", "#ffffff", "#7f7f7f", "#c0c0c0",
      "#ff0000", "#ff8000", "#ffff00", "#00ff00",
      "#00ffff", "#0000ff", "#8000ff", "#ff00ff",
      "#4b2e2b", "#2b4b32", "#2b374b", "#101322"
    ],
    palettePresetColors: [],
    activeCustomSwatch: 0,
    activePaletteWheelIndex: -1,
    colorMode: "hex",
    colorEditorOpen: false,
    colorEditorTarget: "primary",
    saveBeforeCloseResolver: null,
    suppressPalettePresetRefresh: false,
    exportDialogOpen: false,
    pickedColor: "#000000",
    undoStack: [],
    redoStack: [],
    isPlaying: false,
    playTimer: null,
    dragFrameIndex: null,
    dragLayerIndex: null,
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
    activeMenuGroup: null,
    toolPanelOpen: false
  };

  const els = {
    toolButtons: Array.from(document.querySelectorAll(".tool-btn")),
    activeToolLabel: document.getElementById("activeToolLabel"),
    secondaryToolLabel: document.getElementById("secondaryToolLabel"),
    canvasWrap: document.getElementById("canvasWrap"),
    toolPanel: document.getElementById("toolPanel"),
    toolPanelToggleBtn: document.getElementById("toolPanelToggleBtn"),
    hideToolPanelBtn: document.getElementById("hideToolPanelBtn"),
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
    pasteNewLayerBtn: document.getElementById("pasteNewLayerBtn"),
    pasteNewImageBtn: document.getElementById("pasteNewImageBtn"),
    pasteNoTransparencyBtn: document.getElementById("pasteNoTransparencyBtn"),
    clearSelectionBtn: document.getElementById("clearSelectionBtn"),
    gridToggleBtn: document.getElementById("gridToggleBtn"),
    onionToggleBtn: document.getElementById("onionToggleBtn"),
    symmetryToggleBtn: document.getElementById("symmetryToggleBtn"),
    frameStatus: document.getElementById("frameStatus"),
    playBtn: document.getElementById("playBtn"),
    pauseBtn: document.getElementById("pauseBtn"),
    stopBtn: document.getElementById("stopBtn"),
    previousFrameBtn: document.getElementById("previousFrameBtn"),
    nextFrameBtn: document.getElementById("nextFrameBtn"),
    jumpStartBtn: document.getElementById("jumpStartBtn"),
    jumpEndBtn: document.getElementById("jumpEndBtn"),
    previousAnimationBtn: document.getElementById("previousAnimationBtn"),
    nextAnimationBtn: document.getElementById("nextAnimationBtn"),
    moveFrameLeftBtn: document.getElementById("moveFrameLeftBtn"),
    moveFrameRightBtn: document.getElementById("moveFrameRightBtn"),
    addFrameBtn: document.getElementById("addFrameBtn"),
    dupFrameBtn: document.getElementById("dupFrameBtn"),
    deleteFrameBtn: document.getElementById("deleteFrameBtn"),
    frameDurationInput: document.getElementById("frameDurationInput"),
    frameStrip: document.getElementById("frameStrip"),
    animationSelect: document.getElementById("animationSelect"),
    animationList: document.getElementById("animationList"),
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
    layerPreviewCanvas: document.getElementById("layerPreviewCanvas"),
    layerPreviewZoomInput: document.getElementById("layerPreviewZoomInput"),
    layerPreviewZoomLabel: document.getElementById("layerPreviewZoomLabel"),
    addLayerBtn: document.getElementById("addLayerBtn"),
    deleteLayerBtn: document.getElementById("deleteLayerBtn"),
    clearLayerToolbarBtn: document.getElementById("clearLayerToolbarBtn"),
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
    swapColorsBtn: document.getElementById("swapColorsBtn"),
    saveSwatchBtn: document.getElementById("saveSwatchBtn"),
    clearLayerBtn: document.getElementById("clearLayerBtn"),
    paletteSwatches: document.getElementById("paletteSwatches"),
    customSwatches: document.getElementById("customSwatches"),
    palettePresetInput: document.getElementById("palettePresetInput"),
    applyPalettePresetBtn: document.getElementById("applyPalettePresetBtn"),
    paletteWheelInput: document.getElementById("paletteWheelInput"),
    paletteWheel: document.getElementById("paletteWheel"),
    palettePresetSwatches: document.getElementById("palettePresetSwatches"),
    colorEditorPanel: document.getElementById("colorEditorPanel"),
    colorEditorCloseBtn: document.getElementById("colorEditorCloseBtn"),
    colorEditorTargetLabel: document.getElementById("colorEditorTargetLabel"),
    colorPlane: document.getElementById("colorPlane"),
    colorPlaneHandle: document.getElementById("colorPlaneHandle"),
    colorHueInput: document.getElementById("colorHueInput"),
    colorPreviewChip: document.getElementById("colorPreviewChip"),
    colorModeInput: document.getElementById("colorModeInput"),
    colorValueInput: document.getElementById("colorValueInput"),
    rgbRInput: document.getElementById("rgbRInput"),
    rgbGInput: document.getElementById("rgbGInput"),
    rgbBInput: document.getElementById("rgbBInput"),
    hslHInput: document.getElementById("hslHInput"),
    hslSInput: document.getElementById("hslSInput"),
    hslLInput: document.getElementById("hslLInput"),
    hsvHInput: document.getElementById("hsvHInput"),
    hsvSInput: document.getElementById("hsvSInput"),
    hsvVInput: document.getElementById("hsvVInput"),
    rgbRValue: document.getElementById("rgbRValue"),
    rgbGValue: document.getElementById("rgbGValue"),
    rgbBValue: document.getElementById("rgbBValue"),
    hslHValue: document.getElementById("hslHValue"),
    hslSValue: document.getElementById("hslSValue"),
    hslLValue: document.getElementById("hslLValue"),
    hsvHValue: document.getElementById("hsvHValue"),
    hsvSValue: document.getElementById("hsvSValue"),
    hsvVValue: document.getElementById("hsvVValue"),
    paletteCountLabel: document.getElementById("paletteCountLabel"),
    saveProjectBtn: document.getElementById("saveProjectBtn"),
    openProjectInput: document.getElementById("openProjectInput"),
    openProjectBtn: document.getElementById("openProjectBtn"),
    undoBtn: document.getElementById("undoBtn"),
    redoBtn: document.getElementById("redoBtn"),
    exportPngBtn: document.getElementById("exportPngBtn"),
    downloadSheetBtn: document.getElementById("downloadSheetBtn"),
    downloadJsonBtn: document.getElementById("downloadJsonBtn"),
    copyNotesBtn: document.getElementById("copyNotesBtn"),
    enginePresetInput: document.getElementById("enginePresetInput"),
    exportScaleInput: document.getElementById("exportScaleInput"),
    exportModal: document.getElementById("exportModal"),
    exportModalScaleInput: document.getElementById("exportModalScaleInput"),
    exportModalLayoutInput: document.getElementById("exportModalLayoutInput"),
    exportModalFormatInput: document.getElementById("exportModalFormatInput"),
    exportModalPreviewCanvas: document.getElementById("exportModalPreviewCanvas"),
    exportModalSaveBtn: document.getElementById("exportModalSaveBtn"),
    exportModalCloseBtn: document.getElementById("exportModalCloseBtn"),
    menuBar: document.getElementById("menuBar"),
    menuGroups: Array.from(document.querySelectorAll(".menu-group")),
    menuRoots: Array.from(document.querySelectorAll(".menu-root")),
    menuActionButtons: Array.from(document.querySelectorAll("[data-action]")),
    shortcutLabels: Array.from(document.querySelectorAll("[data-shortcut-label]")),
    shortcutModal: document.getElementById("shortcutModal"),
    shortcutRows: document.getElementById("shortcutRows"),
    shortcutCloseBtn: document.getElementById("shortcutCloseBtn"),
    shortcutResetBtn: document.getElementById("shortcutResetBtn"),
    shortcutCaptureHint: document.getElementById("shortcutCaptureHint"),
    documentTabs: document.getElementById("documentTabs"),
    documentTabScrollLeftBtn: document.getElementById("documentTabScrollLeftBtn"),
    documentTabScrollRightBtn: document.getElementById("documentTabScrollRightBtn"),
    swapSidePanelsBtn: document.getElementById("swapSidePanelsBtn"),
    startupModal: document.getElementById("startupModal"),
    startupNewBtn: document.getElementById("startupNewBtn"),
    startupOpenBtn: document.getElementById("startupOpenBtn"),
    startupCloseBtn: document.getElementById("startupCloseBtn"),
    newProjectModal: document.getElementById("newProjectModal"),
    newProjectWidthInput: document.getElementById("newProjectWidthInput"),
    newProjectHeightInput: document.getElementById("newProjectHeightInput"),
    newProjectCancelBtn: document.getElementById("newProjectCancelBtn"),
    createNewProjectBtn: document.getElementById("createNewProjectBtn"),
    newSizePresetButtons: Array.from(document.querySelectorAll(".new-size-preset")),
    saveBeforeCloseModal: document.getElementById("saveBeforeCloseModal"),
    saveBeforeCloseMessage: document.getElementById("saveBeforeCloseMessage"),
    saveBeforeCloseSaveBtn: document.getElementById("saveBeforeCloseSaveBtn"),
    saveBeforeCloseDontSaveBtn: document.getElementById("saveBeforeCloseDontSaveBtn")
  };

  const shortcutStorageKey = "spritepad_shortcuts_v1";

  const actionGroups = [
    {
      name: "File",
      actions: [
        { id: "newProject", label: "New", defaultKey: "Ctrl+N" },
        { id: "saveProject", label: "Save Project", defaultKey: "Ctrl+S" },
        { id: "openProject", label: "Open Project", defaultKey: "Ctrl+O" },
        { id: "closeCurrentDocument", label: "Close", defaultKey: "Ctrl+W" },
        { id: "exitApp", label: "Exit", defaultKey: "Ctrl+Q" },
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
        { id: "pasteWithTransparency", label: "Paste", defaultKey: "Ctrl+V" },
        { id: "pasteIntoNewLayer", label: "Paste into New Layer", defaultKey: "Ctrl+Shift+V" },
        { id: "pasteIntoNewImage", label: "Paste into New Image", defaultKey: "Ctrl+Alt+V" },
        { id: "pasteNoTransparency", label: "Paste No Transparency", defaultKey: "" },
        { id: "deleteSelection", label: "Delete Selection", defaultKey: "Delete" },
        { id: "selectAll", label: "Select All", defaultKey: "Ctrl+A" },
        { id: "clearSelection", label: "Clear Selection", defaultKey: "Escape" }
      ]
    },
    {
      name: "Tools",
      actions: [
        { id: "toolBrush", label: "Brush", defaultKey: "B" },
        { id: "toolPencil", label: "Pencil", defaultKey: "P" },
        { id: "toolEraser", label: "Eraser", defaultKey: "E" },
        { id: "toolFill", label: "Fill", defaultKey: "F" },
        { id: "toolLine", label: "Line", defaultKey: "L" },
        { id: "toolRect", label: "Rectangle", defaultKey: "R" },
        { id: "toolCircle", label: "Circle", defaultKey: "C" },
        { id: "toolSelect", label: "Select", defaultKey: "S" },
        { id: "toolEyedropper", label: "Color Picker", defaultKey: "I" },
        { id: "toolMove", label: "Move Layer", defaultKey: "M" },
        { id: "toggleBezier", label: "Toggle Bezier Line", defaultKey: "Shift+B" }
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
        { id: "deleteLayer", label: "Delete Layer", defaultKey: "" },
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
        { id: "openShortcuts", label: "Keyboard Shortcuts", defaultKey: "Ctrl+/" },
        { id: "toggleFullscreen", label: "Fullscreen", defaultKey: "Ctrl+Enter" }
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
      blendMode: "source-over",
      canvas: layerCanvas,
      ctx: layerCtx
    };
  }

  function createFrame(duration) {
    let frameDuration = Number(duration);
    if (!frameDuration || frameDuration < 30) frameDuration = 100;

    return {
      duration: frameDuration,
      layers: [createLayer("Layer 1")]
    };
  }

  function createAnimation(name) {
    return {
      name: name,
      duration: 100,
      frames: [createFrame(100)]
    };
  }

  function cloneLayer(layer) {
    const newLayer = createLayer(layer.name);
    newLayer.visible = layer.visible;
    newLayer.opacity = layer.opacity;
    newLayer.blendMode = layer.blendMode || "source-over";
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

  function getZoomPercent() {
    return Math.round((state.zoom / 16) * 100);
  }

  function buildCheckerDataUrl(squareSize) {
    let size = Math.floor(squareSize);
    if (size < 1) size = 1;
    const tileSize = size * 2;
    const svg = "<svg xmlns='http://www.w3.org/2000/svg' width='" + tileSize + "' height='" + tileSize + "' viewBox='0 0 " + tileSize + " " + tileSize + "' shape-rendering='crispEdges'>" +
      "<rect width='" + tileSize + "' height='" + tileSize + "' fill='#585b60'/>" +
      "<rect width='" + size + "' height='" + size + "' fill='#4a4d52'/>" +
      "<rect x='" + size + "' y='" + size + "' width='" + size + "' height='" + size + "' fill='#4a4d52'/>" +
      "</svg>";
    return "url(\"data:image/svg+xml," + encodeURIComponent(svg) + "\")";
  }

  function updateCanvasCheckerboard() {
    const size = Math.max(1, Math.floor(state.zoom));
    canvas.style.backgroundColor = "#585b60";
    canvas.style.backgroundImage = buildCheckerDataUrl(size);
    canvas.style.backgroundSize = (size * 2) + "px " + (size * 2) + "px";
    canvas.style.backgroundRepeat = "repeat";
  }

  function resizeDisplayCanvas() {
    canvas.width = state.width * state.zoom;
    canvas.height = state.height * state.zoom;
    ctx.imageSmoothingEnabled = false;
    els.zoomLabel.textContent = getZoomPercent() + "%";
    updateCanvasCheckerboard();
    updateCanvasPan();
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

      const previousAlpha = targetCtx.globalAlpha;
      const previousComposite = targetCtx.globalCompositeOperation;

      if (opacityOverride !== null && opacityOverride !== undefined) {
        targetCtx.globalAlpha = opacityOverride * layer.opacity;
      } else {
        targetCtx.globalAlpha = layer.opacity;
      }

      targetCtx.globalCompositeOperation = layer.blendMode || "source-over";
      targetCtx.drawImage(layer.canvas, x, y, state.width * scale, state.height * scale);
      targetCtx.globalAlpha = previousAlpha;
      targetCtx.globalCompositeOperation = previousComposite;
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
    if (state.zoom < 2) return;

    ctx.save();
    ctx.strokeStyle = "rgba(230, 236, 245, 0.32)";
    ctx.lineWidth = 1;
    ctx.setLineDash([1, Math.max(2, Math.floor(state.zoom / 3))]);

    const widthPx = state.width * state.zoom;
    const heightPx = state.height * state.zoom;

    for (let x = 0; x <= state.width; x++) {
      const px = Math.round(x * state.zoom) + 0.5;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, heightPx);
      ctx.stroke();
    }

    for (let y = 0; y <= state.height; y++) {
      const py = Math.round(y * state.zoom) + 0.5;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(widthPx, py);
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
    updateLayerPreview();
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
    renderDocumentTabs();
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

  function paintAt(x, y, tool, colorHex) {
    if (tool === "brush") {
      applySymmetryPoints(x, y, function (px, py) {
        applyBrush(px, py, function (bx, by) {
          drawPixel(bx, by, colorHex);
        });
      });
    }

    if (tool === "pencil") {
      applySymmetryPoints(x, y, function (px, py) {
        drawPixel(px, py, colorHex);
      });
    }

    if (tool === "eraser") {
      applySymmetryPoints(x, y, function (px, py) {
        applyBrush(px, py, function (bx, by) {
          erasePixel(bx, by);
        });
      });
    }

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

  function floodFill(x, y, colorHex) {
    const layer = getLayer();
    if (!layer) return;
    const imageData = layer.ctx.getImageData(0, 0, state.width, state.height);
    const target = readPixelFromImageData(imageData, x, y);
    const fill = rgbaFromHex(colorHex, 255);

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

  function sampleCompositeColor(x, y, targetColorSlot) {
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

    const sampled = hexFromRgba(color);
    state.pickedColor = sampled;

    if (targetColorSlot === "secondary") {
      setSecondaryColor(sampled, true);
    } else {
      setPrimaryColor(sampled, true);
    }
  }

  function getLayerSnapshot() {
    return getLayer().ctx.getImageData(0, 0, state.width, state.height);
  }

  function restoreLayerSnapshot(imageData) {
    getLayer().ctx.putImageData(imageData, 0, 0);
  }

  function pushUndo() {
    markCurrentDocumentDirty();
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

  function getToolLabel(tool) {
    if (tool === "brush") return "Pen";
    if (tool === "eyedropper") return "Color Picker";
    if (tool === "rect") return "Rect";
    return tool.charAt(0).toUpperCase() + tool.slice(1);
  }

  function getToolIcon(tool) {
    if (tool === "brush") return "🖌";
    if (tool === "pencil") return "✎";
    if (tool === "eraser") return "▱";
    if (tool === "fill") return "▣";
    if (tool === "line") return "╱";
    if (tool === "rect") return "□";
    if (tool === "circle") return "○";
    if (tool === "select") return "▭";
    if (tool === "eyedropper") return "⌕";
    if (tool === "move") return "✥";
    return "?";
  }

  function updateCanvasPan() {
    canvas.style.transform = "translate(" + state.canvasPanX + "px, " + state.canvasPanY + "px)";
  }

  function beginCanvasPan(event) {
    state.isPanningCanvas = true;
    state.panStartX = event.clientX;
    state.panStartY = event.clientY;
    state.panOriginX = state.canvasPanX;
    state.panOriginY = state.canvasPanY;
    canvas.setPointerCapture(event.pointerId);
  }

  function getWheelPanAmount(delta) {
    if (delta === 0) return 0;

    let direction = 1;
    if (delta < 0) direction = -1;

    let amount = Math.abs(delta);
    if (amount > 32) amount = 32;
    if (amount < 6) amount = 6;

    return direction * amount;
  }

  function handleCanvasWheel(event) {
    event.preventDefault();

    if (event.ctrlKey) {
      if (event.deltaY < 0) {
        changeZoom(1);
      } else {
        changeZoom(-1);
      }
      return;
    }

    const panAmount = getWheelPanAmount(event.deltaY);

    if (event.shiftKey) {
      state.canvasPanX -= panAmount;
      updateCanvasPan();
      return;
    }

    state.canvasPanY -= panAmount;
    updateCanvasPan();
  }

  function beginStroke(event) {
    if (event.button === 2) {
      state.activePointerButton = 2;
      state.strokeTool = state.secondaryTool;
      state.strokeColor = state.secondaryColor;
    } else {
      state.activePointerButton = 0;
      state.strokeTool = state.tool;
      state.strokeColor = state.primaryColor;
    }
  }

  function onPointerDown(event) {
    event.preventDefault();

    if (event.button === 1 || event.altKey) {
      beginCanvasPan(event);
      return;
    }

    beginStroke(event);

    const tool = state.strokeTool;
    const color = state.strokeColor;
    const point = getCanvasPoint(event);
    state.isDrawing = true;
    state.startX = point.x;
    state.startY = point.y;
    state.lastX = point.x;
    state.lastY = point.y;
    canvas.setPointerCapture(event.pointerId);

    if (tool === "select") {
      state.selectionDragStart = {
        x: point.x,
        y: point.y
      };
      setSelectionFromPoints(point.x, point.y, point.x, point.y);
      renderAllUi();
      return;
    }

    if (tool === "eyedropper") {
      if (state.activePointerButton === 2) {
        sampleCompositeColor(point.x, point.y, "secondary");
      } else {
        sampleCompositeColor(point.x, point.y, "primary");
      }
      renderAllUi();
      return;
    }

    pushUndo();

    if (tool === "fill") {
      floodFill(point.x, point.y, color);
      state.isDrawing = false;
      renderAllUi();
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      state.startImageData = getLayerSnapshot();
      renderAllUi();
      return;
    }

    if (tool === "move") {
      state.startImageData = getLayerSnapshot();
      state.moveCanvas = document.createElement("canvas");
      state.moveCanvas.width = state.width;
      state.moveCanvas.height = state.height;
      state.moveCanvas.getContext("2d").putImageData(state.startImageData, 0, 0);
      return;
    }

    paintAt(point.x, point.y, tool, color);
    renderAllUi();
  }

  function getSnappedLinePoint(startX, startY, endX, endY, shouldSnap) {
    if (!shouldSnap) {
      return {
        x: endX,
        y: endY
      };
    }

    const dx = endX - startX;
    const dy = endY - startY;
    const distance = Math.max(Math.abs(dx), Math.abs(dy));
    if (distance === 0) {
      return {
        x: endX,
        y: endY
      };
    }

    const angle = Math.atan2(dy, dx);
    const snappedAngle = Math.round(angle / (Math.PI / 4)) * (Math.PI / 4);

    return {
      x: Math.round(startX + Math.cos(snappedAngle) * distance),
      y: Math.round(startY + Math.sin(snappedAngle) * distance)
    };
  }

  function onPointerMove(event) {
    if (state.isPanningCanvas) {
      event.preventDefault();
      state.canvasPanX = state.panOriginX + (event.clientX - state.panStartX);
      state.canvasPanY = state.panOriginY + (event.clientY - state.panStartY);
      updateCanvasPan();
      return;
    }

    if (!state.isDrawing) return;
    event.preventDefault();

    const tool = state.strokeTool;
    const color = state.strokeColor;
    const point = getCanvasPoint(event);

    if (tool === "select") {
      if (!state.selectionDragStart) return;
      setSelectionFromPoints(state.selectionDragStart.x, state.selectionDragStart.y, point.x, point.y);
      renderAllUi();
      return;
    }

    if (tool === "line" || tool === "rect" || tool === "circle") {
      restoreLayerSnapshot(state.startImageData);
      const shapePoint = getSnappedLinePoint(state.startX, state.startY, point.x, point.y, event.shiftKey && tool === "line");

      if (tool === "line") {
        if (state.lineMode === "bezier") {
          drawBezier(state.startX, state.startY, shapePoint.x, shapePoint.y, color);
        } else {
          drawLine(state.startX, state.startY, shapePoint.x, shapePoint.y, color);
        }
      }

      if (tool === "rect") {
        drawRect(state.startX, state.startY, point.x, point.y, color);
      }

      if (tool === "circle") {
        drawCircle(state.startX, state.startY, point.x, point.y, color);
      }

      renderAllUi();
      return;
    }

    if (tool === "move") {
      restoreLayerSnapshot(state.startImageData);
      const layer = getLayer();
      layer.ctx.clearRect(0, 0, state.width, state.height);
      const dx = point.x - state.startX;
      const dy = point.y - state.startY;
      layer.ctx.drawImage(state.moveCanvas, dx, dy);
      renderAllUi();
      return;
    }


    if (tool === "brush" || tool === "pencil" || tool === "eraser") {
      traceLine(state.lastX, state.lastY, point.x, point.y, function (px, py) {
        paintAt(px, py, tool, color);
      });
    }

    state.lastX = point.x;
    state.lastY = point.y;
    renderAllUi();
  }

  function onPointerUp(event) {
    if (state.isPanningCanvas) {
      event.preventDefault();
      state.isPanningCanvas = false;
      return;
    }

    if (!state.isDrawing) return;
    event.preventDefault();
    state.isDrawing = false;
    state.selectionDragStart = null;
    state.startImageData = null;
    state.moveCanvas = null;
    state.strokeTool = state.tool;
    state.strokeColor = state.primaryColor;
    state.activePointerButton = 0;
    renderAllUi();
  }

  function setTool(tool) {
    state.tool = tool;
    updateToolUi();
  }

  function setSecondaryTool(tool) {
    state.secondaryTool = tool;
    updateToolUi();
  }

  function setToolPanelOpen(isOpen) {
    state.toolPanelOpen = isOpen;

    if (els.toolPanel != null) {
      if (state.toolPanelOpen) {
        els.toolPanel.classList.remove("hidden");
      } else {
        els.toolPanel.classList.add("hidden");
      }
    }

    if (els.toolPanelToggleBtn != null) {
      if (state.toolPanelOpen) {
        els.toolPanelToggleBtn.setAttribute("aria-expanded", "true");
      } else {
        els.toolPanelToggleBtn.setAttribute("aria-expanded", "false");
      }
    }
  }

  function toggleToolPanel() {
    if (state.toolPanelOpen) {
      setToolPanelOpen(false);
    } else {
      setToolPanelOpen(true);
    }
  }

  function updateToolUi() {
    for (let i = 0; i < els.toolButtons.length; i++) {
      const button = els.toolButtons[i];

      if (button.dataset.tool === state.tool) {
        button.classList.add("active");
      } else {
        button.classList.remove("active");
      }

      if (button.dataset.tool === state.secondaryTool) {
        button.classList.add("secondary-active");
      } else {
        button.classList.remove("secondary-active");
      }
    }

    els.activeToolLabel.textContent = getToolIcon(state.tool);
    els.activeToolLabel.title = getToolLabel(state.tool);
    if (els.secondaryToolLabel != null) {
      els.secondaryToolLabel.textContent = getToolIcon(state.secondaryTool);
      els.secondaryToolLabel.title = getToolLabel(state.secondaryTool);
    }
    els.brushSizeLabel.textContent = "px";
    els.lineModeInput.value = state.lineMode;
    els.bezierBendInput.value = state.bezierBend;
    els.bezierBendLabel.textContent = String(state.bezierBend);

    if (state.tool === "line" || state.secondaryTool === "line") {
      els.lineOptionsRow.style.display = "flex";
    } else {
      els.lineOptionsRow.style.display = "none";
    }

    if (state.tool === "select" || state.secondaryTool === "select" || hasSelection() || state.clipboard !== null) {
      els.selectionOptionsRow.style.display = "flex";
    } else {
      els.selectionOptionsRow.style.display = "none";
    }

    els.copySelectionBtn.disabled = !hasSelection();
    els.cutSelectionBtn.disabled = !hasSelection();
    els.clearSelectionBtn.disabled = !hasSelection();
    if (els.pasteWithTransparencyBtn != null) els.pasteWithTransparencyBtn.disabled = state.clipboard === null;
    if (els.pasteNewLayerBtn != null) els.pasteNewLayerBtn.disabled = state.clipboard === null;
    if (els.pasteNewImageBtn != null) els.pasteNewImageBtn.disabled = state.clipboard === null;
    if (els.pasteNoTransparencyBtn != null) els.pasteNoTransparencyBtn.disabled = true;

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
    if (els.animationList == null) return;

    els.animationList.innerHTML = "";

    for (let i = 0; i < state.animations.length; i++) {
      const animation = state.animations[i];
      const item = document.createElement("div");
      item.className = "animation-list-item";
      item.dataset.index = String(i);

      if (i === state.currentAnimation) {
        item.classList.add("active");
      }

      const name = document.createElement("button");
      name.className = "animation-list-name";
      name.type = "button";
      name.textContent = animation.name;
      name.title = "Double-click or right-click to rename";

      const meta = document.createElement("div");
      meta.className = "animation-list-meta";

      const count = document.createElement("span");
      count.className = "animation-list-count";
      count.textContent = animation.frames.length + "f";

      const duration = document.createElement("input");
      duration.className = "animation-list-duration";
      duration.type = "text";
      duration.inputMode = "numeric";
      duration.pattern = "[0-9]*";
      duration.value = animation.duration;
      duration.title = "Animation ms";
      duration.setAttribute("aria-label", "Animation duration in milliseconds");

      const durationSuffix = document.createElement("span");
      durationSuffix.className = "animation-list-duration-suffix";
      durationSuffix.textContent = "ms";

      meta.appendChild(count);
      meta.appendChild(duration);
      meta.appendChild(durationSuffix);
      item.appendChild(name);
      item.appendChild(meta);

      name.addEventListener("click", function () {
        switchAnimation(i);
      });

      name.addEventListener("dblclick", function (event) {
        event.preventDefault();
        renameAnimation(i);
      });

      name.addEventListener("contextmenu", function (event) {
        event.preventDefault();
        renameAnimation(i);
      });

      duration.addEventListener("click", function (event) {
        event.stopPropagation();
      });

      duration.addEventListener("change", function () {
        let nextDuration = Number(duration.value);
        if (nextDuration < 30) nextDuration = 30;
        pushUndo();
        animation.duration = nextDuration;

        for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
          animation.frames[frameIndex].duration = nextDuration;
        }

        if (i === state.currentAnimation) {
          updateAnimationFields();
          updateFrameFields();
        }

        renderAllUi();
      });

      els.animationList.appendChild(item);
    }
  }

  function updateAnimationFields() {
    const animation = getAnimation();
    if (!animation) return;

    if (els.animationSelect != null) {
      els.animationSelect.value = String(state.currentAnimation);
    }

    if (els.animationNameInput != null) {
      els.animationNameInput.value = animation.name;
    }

    els.animationDurationInput.value = animation.duration;

    if (state.animations.length <= 1) {
      els.deleteAnimationBtn.disabled = true;
    } else {
      els.deleteAnimationBtn.disabled = false;
    }
  }

  function renameAnimation(index) {
    if (index < 0) return;
    if (index >= state.animations.length) return;

    const animation = state.animations[index];
    const nextName = window.prompt("Rename animation", animation.name);
    if (nextName === null) return;

    const cleanedName = nextName.trim();
    if (cleanedName === "") return;
    if (cleanedName === animation.name) return;

    pushUndo();
    animation.name = cleanedName;
    renderAllUi();
  }

  function switchAnimation(index) {
    stopAnimation();
    if (index < 0) index = 0;
    if (index >= state.animations.length) index = state.animations.length - 1;
    const previousLayer = state.currentLayer;
    state.currentAnimation = index;
    state.currentFrame = 0;
    syncActiveFrames();
    const frame = getFrame();
    if (frame != null) {
      state.currentLayer = previousLayer;
      if (state.currentLayer >= frame.layers.length) state.currentLayer = frame.layers.length - 1;
      if (state.currentLayer < 0) state.currentLayer = 0;
    }
    renderAllUi();
  }

  function addAnimation() {
    pushUndo();
    const name = "Animation " + state.animations.length;
    const animation = createAnimation(name);
    state.animations.push(animation);
    state.currentAnimation = state.animations.length - 1;
    state.currentFrame = 0;
    state.currentLayer = 0;
    syncActiveFrames();
    renderAllUi();
  }

  function deleteAnimation() {
    if (state.animations.length <= 1) {
      pushUndo();
      clearAllProjectImages();
      renderAllUi();
      return;
    }

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
      thumb.width = 52;
      thumb.height = 52;
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

      const frameMeta = document.createElement("div");
      frameMeta.className = "frame-card-meta";

      const frameIndexLabel = document.createElement("span");
      frameIndexLabel.className = "frame-card-index";
      frameIndexLabel.textContent = String(i + 1);

      const durationWrap = document.createElement("label");
      durationWrap.className = "frame-card-duration-wrap";
      durationWrap.title = "Frame duration in milliseconds";

      const durationInput = document.createElement("input");
      durationInput.className = "frame-card-duration-input";
      durationInput.type = "text";
      durationInput.inputMode = "numeric";
      durationInput.pattern = "[0-9]*";
      durationInput.value = frame.duration;
      durationInput.setAttribute("aria-label", "Frame duration in milliseconds");

      const durationSuffix = document.createElement("span");
      durationSuffix.className = "frame-card-duration-suffix";
      durationSuffix.textContent = "ms";

      durationWrap.appendChild(durationInput);
      durationWrap.appendChild(durationSuffix);
      frameMeta.appendChild(frameIndexLabel);
      frameMeta.appendChild(durationWrap);

      button.appendChild(thumb);
      button.appendChild(frameMeta);

      durationInput.addEventListener("click", function (event) {
        event.stopPropagation();
      });

      durationInput.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      durationInput.addEventListener("input", function () {
        let nextDuration = Number(durationInput.value);
        if (nextDuration < 30) nextDuration = 30;
        frame.duration = nextDuration;
        if (i === state.currentFrame) {
          updateFrameFields();
        }
        updateExportPreview();
      });

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

    els.frameStatus.textContent = "Animation Timeline";
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
    if (state.frames.length <= 1) {
      pushUndo();
      clearFrameImages(getFrame());
      renderAllUi();
      return;
    }

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
    if (state.isPlaying) return;

    state.isPlaying = true;
    scheduleNextFrame();
  }

  function scheduleNextFrame() {
    if (!state.isPlaying) return;

    const frame = getFrame();
    state.playTimer = window.setTimeout(function () {
      stepFrame(1, true);
      scheduleNextFrame();
    }, frame.duration);
  }

  function pauseAnimation() {
    state.isPlaying = false;
    if (state.playTimer !== null) {
      window.clearTimeout(state.playTimer);
      state.playTimer = null;
    }
  }

  function stopAnimation() {
    pauseAnimation();
  }

  function stopTimelinePlayback() {
    pauseAnimation();
    jumpToFrame(0);
  }

  function stepFrame(direction, wrap) {
    syncActiveFrames();
    if (state.frames.length === 0) return;

    let next = state.currentFrame + direction;

    if (wrap) {
      if (next < 0) next = state.frames.length - 1;
      if (next >= state.frames.length) next = 0;
    } else {
      if (next < 0) next = 0;
      if (next >= state.frames.length) next = state.frames.length - 1;
    }

    state.currentFrame = next;
    renderAllUi();
  }

  function jumpToFrame(index) {
    syncActiveFrames();
    if (state.frames.length === 0) return;

    let next = index;
    if (next < 0) next = 0;
    if (next >= state.frames.length) next = state.frames.length - 1;

    state.currentFrame = next;
    renderAllUi();
  }

  function previousAnimation() {
    if (state.animations.length <= 1) return;
    let next = state.currentAnimation - 1;
    if (next < 0) next = state.animations.length - 1;
    switchAnimation(next);
  }

  function nextAnimation() {
    if (state.animations.length <= 1) return;
    let next = state.currentAnimation + 1;
    if (next >= state.animations.length) next = 0;
    switchAnimation(next);
  }

  function renderLayers() {
    els.layerList.innerHTML = "";
    const frame = getFrame();
    if (!frame) return;

    if (els.deleteLayerBtn) {
      els.deleteLayerBtn.disabled = frame.layers.length <= 1;
    }

    const blendModes = [
      { value: "source-over", label: "Normal" },
      { value: "multiply", label: "Multiply" },
      { value: "screen", label: "Screen" },
      { value: "overlay", label: "Overlay" },
      { value: "darken", label: "Darken" },
      { value: "lighten", label: "Lighten" },
      { value: "color-dodge", label: "Dodge" },
      { value: "color-burn", label: "Burn" },
      { value: "hard-light", label: "Hard Light" },
      { value: "soft-light", label: "Soft Light" },
      { value: "difference", label: "Difference" }
    ];

    for (let i = frame.layers.length - 1; i >= 0; i--) {
      const layer = frame.layers[i];
      if (!layer.blendMode) layer.blendMode = "source-over";

      const item = document.createElement("div");
      item.className = "layer-item";
      item.draggable = true;
      item.dataset.index = String(i);

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

      const layerControlRow = document.createElement("div");
      layerControlRow.className = "layer-control-row";

      const blendSelect = document.createElement("select");
      blendSelect.className = "layer-blend-select";
      blendSelect.title = "Layer blend mode";

      for (let modeIndex = 0; modeIndex < blendModes.length; modeIndex++) {
        const option = document.createElement("option");
        option.value = blendModes[modeIndex].value;
        option.textContent = blendModes[modeIndex].label;
        blendSelect.appendChild(option);
      }

      blendSelect.value = layer.blendMode;
      blendSelect.addEventListener("change", function () {
        layer.blendMode = blendSelect.value;
        render();
      });

      const opacityWrap = document.createElement("label");
      opacityWrap.className = "layer-alpha-wrap";
      opacityWrap.draggable = false;
      opacityWrap.title = "Layer alpha / transparency";

      const opacity = document.createElement("input");
      opacity.className = "layer-opacity";
      opacity.type = "range";
      opacity.draggable = false;
      opacity.min = "0";
      opacity.max = "1";
      opacity.step = "0.05";
      opacity.value = layer.opacity;

      const opacityLabel = document.createElement("span");
      opacityLabel.className = "layer-alpha-label";
      opacityLabel.textContent = Math.round(layer.opacity * 100) + "%";

      opacity.addEventListener("input", function () {
        layer.opacity = Number(opacity.value);
        opacityLabel.textContent = Math.round(layer.opacity * 100) + "%";
        render();
      });

      opacity.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      opacity.addEventListener("mousedown", function (event) {
        event.stopPropagation();
      });

      opacity.addEventListener("dragstart", function (event) {
        event.preventDefault();
        event.stopPropagation();
      });

      opacityWrap.addEventListener("pointerdown", function (event) {
        event.stopPropagation();
      });

      opacityWrap.addEventListener("mousedown", function (event) {
        event.stopPropagation();
      });

      opacityWrap.addEventListener("pointerdown", function () {
        item.draggable = false;
      });

      opacityWrap.addEventListener("pointerup", function () {
        item.draggable = true;
      });

      opacityWrap.addEventListener("pointercancel", function () {
        item.draggable = true;
      });

      opacityWrap.appendChild(opacity);
      opacityWrap.appendChild(opacityLabel);

      layerControlRow.appendChild(blendSelect);
      layerControlRow.appendChild(opacityWrap);

      meta.appendChild(nameInput);
      meta.appendChild(layerControlRow);

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
        if (event.target === blendSelect) return;
        if (event.target === visible) return;
        state.currentLayer = i;
        renderAllUi();
      });

      item.addEventListener("dragstart", function (event) {
        if (event.target === nameInput || event.target === opacity || event.target === blendSelect) {
          event.preventDefault();
          return;
        }

        if (event.target.closest("input") || event.target.closest("select") || event.target.closest("label")) {
          event.preventDefault();
          return;
        }

        state.dragLayerIndex = i;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(i));
        item.classList.add("dragging");
      });

      item.addEventListener("dragover", function (event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "move";
        item.classList.add("drag-over");
      });

      item.addEventListener("dragleave", function () {
        item.classList.remove("drag-over");
      });

      item.addEventListener("drop", function (event) {
        event.preventDefault();
        item.classList.remove("drag-over");
        let fromIndex = Number(event.dataTransfer.getData("text/plain"));
        if (Number.isNaN(fromIndex)) {
          fromIndex = state.dragLayerIndex;
        }
        reorderLayer(fromIndex, i);
      });

      item.addEventListener("dragend", function () {
        state.dragLayerIndex = null;
        item.classList.remove("dragging");
        item.classList.remove("drag-over");
      });

      els.layerList.appendChild(item);
    }
  }

  function reorderLayer(fromIndex, toIndex) {
    const frame = getFrame();
    if (!frame) return;
    if (fromIndex === null || fromIndex === undefined) return;
    if (toIndex === null || toIndex === undefined) return;
    if (fromIndex === toIndex) return;
    if (fromIndex < 0) return;
    if (toIndex < 0) return;
    if (fromIndex >= frame.layers.length) return;
    if (toIndex >= frame.layers.length) return;

    pushUndo();
    const moved = frame.layers.splice(fromIndex, 1)[0];
    frame.layers.splice(toIndex, 0, moved);
    state.currentLayer = toIndex;
    renderAllUi();
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

  function deleteLayer() {
    const frame = getFrame();
    if (!frame) return;
    if (frame.layers.length <= 1) return;

    pushUndo();
    frame.layers.splice(state.currentLayer, 1);

    if (state.currentLayer >= frame.layers.length) {
      state.currentLayer = frame.layers.length - 1;
    }

    if (state.currentLayer < 0) {
      state.currentLayer = 0;
    }

    renderAllUi();
  }

  function mergeLayerDown() {
    const frame = getFrame();
    if (state.currentLayer <= 0) return;
    if (frame.layers.length <= 1) return;

    pushUndo();
    const top = frame.layers[state.currentLayer];
    const below = frame.layers[state.currentLayer - 1];
    const previousComposite = below.ctx.globalCompositeOperation;
    below.ctx.globalAlpha = top.opacity;
    below.ctx.globalCompositeOperation = top.blendMode || "source-over";
    below.ctx.drawImage(top.canvas, 0, 0);
    below.ctx.globalAlpha = 1;
    below.ctx.globalCompositeOperation = previousComposite;
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

      swatch.addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });

      swatch.addEventListener("pointerdown", function (event) {
        if (event.button === 2) {
          event.preventDefault();
          setSecondaryColor(color, false);
        } else {
          setPrimaryColor(color, false);
        }
      });

      els.paletteSwatches.appendChild(swatch);
    }

    renderCustomSwatches();
    renderPalettePreset();
    updateActiveColorButtons();
    updateColorEditorFields();
  }

  function renderCustomSwatches() {
    if (!els.customSwatches) return;
    els.customSwatches.innerHTML = "";

    for (let i = 0; i < state.customSwatches.length; i++) {
      const color = state.customSwatches[i];
      const swatch = document.createElement("button");
      swatch.className = "swatch custom-swatch";
      swatch.style.background = color;
      swatch.title = "Custom " + (i + 1) + ": " + color;

      if (i === state.activeCustomSwatch) {
        swatch.classList.add("selected-slot");
      }

      swatch.addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });

      swatch.addEventListener("pointerdown", function (event) {
        state.activeCustomSwatch = i;
        if (event.button === 2) {
          event.preventDefault();
          setSecondaryColor(color, false);
        } else {
          setPrimaryColor(color, false);
        }
      });

      els.customSwatches.appendChild(swatch);
    }
  }

  function addPaletteColor(color) {
    const cleaned = color.toLowerCase();
    const existing = [];

    for (let i = 0; i < state.palette.length; i++) {
      if (state.palette[i].toLowerCase() !== cleaned) {
        existing.push(state.palette[i]);
      }
    }

    state.palette = [color].concat(existing).slice(0, 16);
    renderPalette();
  }

  function saveCurrentSwatch() {
    state.customSwatches[state.activeCustomSwatch] = state.primaryColor;
    renderPalette();
  }

  function swapColors() {
    const oldPrimary = state.primaryColor;
    state.primaryColor = state.secondaryColor;
    state.secondaryColor = oldPrimary;
    state.pickedColor = state.primaryColor;
    els.primaryColorInput.value = state.primaryColor;
    els.secondaryColorInput.value = state.secondaryColor;
    updateActiveColorButtons();
    addPaletteColor(state.primaryColor);
    addPaletteColor(state.secondaryColor);
    renderPalette();
  }

  function replacePickedColor() {
    return;
  }

  function hexToRgb(hex) {
    const cleaned = hex.replace("#", "");
    return {
      r: parseInt(cleaned.substring(0, 2), 16),
      g: parseInt(cleaned.substring(2, 4), 16),
      b: parseInt(cleaned.substring(4, 6), 16)
    };
  }

  function rgbToHex(r, g, b) {
    const rr = clamp(Math.round(r), 0, 255).toString(16).padStart(2, "0");
    const gg = clamp(Math.round(g), 0, 255).toString(16).padStart(2, "0");
    const bb = clamp(Math.round(b), 0, 255).toString(16).padStart(2, "0");
    return "#" + rr + gg + bb;
  }

  function rgbToHsl(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      if (l > 0.5) {
        s = d / (2 - max - min);
      } else {
        s = d / (max + min);
      }

      if (max === r) {
        h = (g - b) / d;
        if (g < b) h += 6;
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }

      h /= 6;
    }

    return {
      h: h * 360,
      s: s,
      l: l
    };
  }

  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    h /= 360;

    let r = l;
    let g = l;
    let b = l;

    if (s !== 0) {
      let q = l * (1 + s);
      if (l >= 0.5) q = l + s - l * s;
      const p = 2 * l - q;
      r = hueToRgb(p, q, h + 1 / 3);
      g = hueToRgb(p, q, h);
      b = hueToRgb(p, q, h - 1 / 3);
    }

    return rgbToHex(r * 255, g * 255, b * 255);
  }

  function hueToRgb(p, q, t) {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  }

  function rgbToHsv(r, g, b) {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const d = max - min;
    let h = 0;
    let s = 0;
    const v = max;

    if (d !== 0) {
      if (max === r) {
        h = ((g - b) / d) % 6;
      } else if (max === g) {
        h = (b - r) / d + 2;
      } else {
        h = (r - g) / d + 4;
      }
      h *= 60;
      if (h < 0) h += 360;
    }

    if (max !== 0) s = d / max;

    return {
      h: h,
      s: s,
      v: v
    };
  }

  function hsvToHex(h, s, v) {
    h = ((h % 360) + 360) % 360;
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0;
    let g = 0;
    let b = 0;

    if (h < 60) {
      r = c;
      g = x;
    } else if (h < 120) {
      r = x;
      g = c;
    } else if (h < 180) {
      g = c;
      b = x;
    } else if (h < 240) {
      g = x;
      b = c;
    } else if (h < 300) {
      r = x;
      b = c;
    } else {
      r = c;
      b = x;
    }

    return rgbToHex((r + m) * 255, (g + m) * 255, (b + m) * 255);
  }

  function parseColorText(value) {
    const text = String(value).trim();
    if (text === "") return null;

    const hexMatch = text.match(/^#?([0-9a-fA-F]{6})$/);
    if (hexMatch) return "#" + hexMatch[1].toLowerCase();

    const numbers = text.match(/-?\d+(?:\.\d+)?/g);
    if (!numbers) return null;

    if (state.colorMode === "rgb" && numbers.length >= 3) {
      return rgbToHex(Number(numbers[0]), Number(numbers[1]), Number(numbers[2]));
    }

    if (state.colorMode === "hsl" && numbers.length >= 3) {
      return hslToHex(Number(numbers[0]), Number(numbers[1]) / 100, Number(numbers[2]) / 100);
    }

    if (state.colorMode === "hsv" && numbers.length >= 3) {
      return hsvToHex(Number(numbers[0]), Number(numbers[1]) / 100, Number(numbers[2]) / 100);
    }

    return null;
  }

  function getEditingColor() {
    if (state.colorEditorTarget === "secondary") return state.secondaryColor;
    return state.primaryColor;
  }

  function positionColorEditor() {
    if (!els.colorEditorPanel) return;

    const modal = els.colorEditorPanel.querySelector(".color-editor-modal");
    if (!modal) return;

    const anchor = document.querySelector(".active-colors");
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const modalWidth = modal.offsetWidth || 360;
    const modalHeight = modal.offsetHeight || 420;

    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + modalWidth > window.innerWidth - 10) {
      left = window.innerWidth - modalWidth - 10;
    }

    if (left < 10) left = 10;

    if (top + modalHeight > window.innerHeight - 10) {
      top = rect.top - modalHeight - 8;
    }

    if (top < 10) top = 10;

    modal.style.left = Math.round(left) + "px";
    modal.style.top = Math.round(top) + "px";
  }

  function openColorEditor(target) {
    state.colorEditorOpen = true;
    state.colorEditorTarget = target;

    if (els.colorEditorTargetLabel) {
      if (target === "secondary") {
        els.colorEditorTargetLabel.textContent = "Secondary color";
      } else {
        els.colorEditorTargetLabel.textContent = "Primary color";
      }
    }

    if (els.colorEditorPanel) {
      els.colorEditorPanel.classList.remove("hidden");
    }

    updateColorEditorFields();
    positionColorEditor();
    window.requestAnimationFrame(positionColorEditor);
  }

  function closeColorEditor() {
    state.colorEditorOpen = false;
    if (els.colorEditorPanel) {
      els.colorEditorPanel.classList.add("hidden");
    }
  }

  function updateActiveColorButtons() {
    if (els.primaryColorInput) {
      els.primaryColorInput.value = state.primaryColor;
      els.primaryColorInput.style.background = state.primaryColor;
    }

    if (els.secondaryColorInput) {
      els.secondaryColorInput.value = state.secondaryColor;
      els.secondaryColorInput.style.background = state.secondaryColor;
    }
  }

  function setSecondaryColor(color, shouldSaveRecent) {
    if (!color) return;
    state.secondaryColor = color.toLowerCase();
    if (els.secondaryColorInput) els.secondaryColorInput.value = state.secondaryColor;
    updateActiveColorButtons();
    if (state.colorEditorTarget === "secondary") updateColorEditorFields();
    if (shouldSaveRecent) addPaletteColor(state.secondaryColor);
  }

  function setEditingColor(color, shouldSaveRecent) {
    if (state.colorEditorTarget === "secondary") {
      setSecondaryColor(color, shouldSaveRecent);
      return;
    }

    setPrimaryColor(color, shouldSaveRecent);
  }

  function setPrimaryColor(color, shouldSaveRecent) {
    if (!color) return;
    state.primaryColor = color.toLowerCase();
    state.pickedColor = state.primaryColor;
    if (els.primaryColorInput) els.primaryColorInput.value = state.primaryColor;
    updateActiveColorButtons();
    if (state.colorEditorTarget === "primary") updateColorEditorFields();

    if (shouldSaveRecent) addPaletteColor(state.primaryColor);
    renderPalette();
  }

  function updateColorEditorFields() {
    if (!els.colorValueInput) return;

    const activeColor = getEditingColor();
    const rgb = hexToRgb(activeColor);
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

    const rgbR = Math.round(rgb.r);
    const rgbG = Math.round(rgb.g);
    const rgbB = Math.round(rgb.b);
    const hslH = Math.round(hsl.h);
    const hslS = Math.round(hsl.s * 100);
    const hslL = Math.round(hsl.l * 100);
    const hsvH = Math.round(hsv.h);
    const hsvS = Math.round(hsv.s * 100);
    const hsvV = Math.round(hsv.v * 100);

    if (els.rgbRInput) els.rgbRInput.value = rgbR;
    if (els.rgbGInput) els.rgbGInput.value = rgbG;
    if (els.rgbBInput) els.rgbBInput.value = rgbB;
    if (els.hslHInput) els.hslHInput.value = hslH;
    if (els.hslSInput) els.hslSInput.value = hslS;
    if (els.hslLInput) els.hslLInput.value = hslL;
    if (els.hsvHInput) els.hsvHInput.value = hsvH;
    if (els.hsvSInput) els.hsvSInput.value = hsvS;
    if (els.hsvVInput) els.hsvVInput.value = hsvV;

    if (els.rgbRValue) els.rgbRValue.textContent = rgbR;
    if (els.rgbGValue) els.rgbGValue.textContent = rgbG;
    if (els.rgbBValue) els.rgbBValue.textContent = rgbB;
    if (els.hslHValue) els.hslHValue.textContent = hslH;
    if (els.hslSValue) els.hslSValue.textContent = hslS + "%";
    if (els.hslLValue) els.hslLValue.textContent = hslL + "%";
    if (els.hsvHValue) els.hsvHValue.textContent = hsvH;
    if (els.hsvSValue) els.hsvSValue.textContent = hsvS + "%";
    if (els.hsvVValue) els.hsvVValue.textContent = hsvV + "%";

    if (state.colorMode === "rgb") {
      els.colorValueInput.value = rgbR + ", " + rgbG + ", " + rgbB;
    } else if (state.colorMode === "hsl") {
      els.colorValueInput.value = hslH + ", " + hslS + "%, " + hslL + "%";
    } else if (state.colorMode === "hsv") {
      els.colorValueInput.value = hsvH + ", " + hsvS + "%, " + hsvV + "%";
    } else {
      els.colorValueInput.value = activeColor;
    }

    updateColorModeRows();
    updateColorVisual(rgbR, rgbG, rgbB, hsvH, hsvS, hsvV);
  }

  function updateColorModeRows() {
    const rows = document.querySelectorAll(".color-channel-row");
    for (let i = 0; i < rows.length; i++) {
      rows[i].classList.add("hidden");
    }

    if (state.colorMode === "rgb") {
      const rgbRows = document.querySelectorAll(".color-mode-rgb");
      for (let i = 0; i < rgbRows.length; i++) rgbRows[i].classList.remove("hidden");
    }

    if (state.colorMode === "hsl") {
      const hslRows = document.querySelectorAll(".color-mode-hsl");
      for (let i = 0; i < hslRows.length; i++) hslRows[i].classList.remove("hidden");
    }

    if (state.colorMode === "hsv") {
      const hsvRows = document.querySelectorAll(".color-mode-hsv");
      for (let i = 0; i < hsvRows.length; i++) hsvRows[i].classList.remove("hidden");
    }
  }

  function updateColorVisual(r, g, b, hue, saturation, value) {
    if (els.colorPreviewChip) {
      els.colorPreviewChip.style.background = rgbToHex(r, g, b);
    }

    if (els.colorHueInput) {
      els.colorHueInput.value = hue;
    }

    if (els.colorPlane) {
      els.colorPlane.style.background = "linear-gradient(to top, #000000, transparent), linear-gradient(to right, #ffffff, " + hsvToHex(hue, 1, 1) + ")";
    }

    if (els.colorPlaneHandle) {
      els.colorPlaneHandle.style.left = saturation + "%";
      els.colorPlaneHandle.style.top = (100 - value) + "%";
    }
  }

  function updateColorFromPlaneEvent(event) {
    if (!els.colorPlane) return;

    const rect = els.colorPlane.getBoundingClientRect();
    let saturation = (event.clientX - rect.left) / rect.width;
    let value = 1 - ((event.clientY - rect.top) / rect.height);

    if (saturation < 0) saturation = 0;
    if (saturation > 1) saturation = 1;
    if (value < 0) value = 0;
    if (value > 1) value = 1;

    const hue = Number(els.colorHueInput.value);
    setEditingColor(hsvToHex(hue, saturation, value), false);
  }

  function updateColorFromHueInput() {
    const activeColor = getEditingColor();
    const rgb = hexToRgb(activeColor);
    const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
    setEditingColor(hsvToHex(Number(els.colorHueInput.value), hsv.s, hsv.v), false);
  }

  function updatePrimaryFromChannelInputs(mode) {
    let color = null;

    if (mode === "rgb") {
      color = rgbToHex(Number(els.rgbRInput.value), Number(els.rgbGInput.value), Number(els.rgbBInput.value));
    }

    if (mode === "hsl") {
      color = hslToHex(Number(els.hslHInput.value), Number(els.hslSInput.value) / 100, Number(els.hslLInput.value) / 100);
    }

    if (mode === "hsv") {
      color = hsvToHex(Number(els.hsvHInput.value), Number(els.hsvSInput.value) / 100, Number(els.hsvVInput.value) / 100);
    }

    setEditingColor(color, false);
  }

  function createTheoryPalette() {
    const preset = els.palettePresetInput.value;
    const baseRgb = hexToRgb(state.primaryColor);
    const baseHsl = rgbToHsl(baseRgb.r, baseRgb.g, baseRgb.b);
    let colors = [];

    if (preset === "oneTone") {
      colors = [hslToHex(baseHsl.h, baseHsl.s, 0.20), hslToHex(baseHsl.h, baseHsl.s, 0.38), hslToHex(baseHsl.h, baseHsl.s, 0.58), hslToHex(baseHsl.h, baseHsl.s, 0.78)];
    } else if (preset === "twoTone") {
      colors = [hslToHex(baseHsl.h, baseHsl.s, 0.28), hslToHex(baseHsl.h, baseHsl.s, 0.62), hslToHex(baseHsl.h + 180, baseHsl.s, 0.34), hslToHex(baseHsl.h + 180, baseHsl.s, 0.68)];
    } else if (preset === "fourTone") {
      colors = [hslToHex(baseHsl.h, baseHsl.s, 0.34), hslToHex(baseHsl.h + 90, baseHsl.s, 0.44), hslToHex(baseHsl.h + 180, baseHsl.s, 0.54), hslToHex(baseHsl.h + 270, baseHsl.s, 0.64)];
    } else if (preset === "analogous") {
      colors = [hslToHex(baseHsl.h - 45, baseHsl.s, 0.48), hslToHex(baseHsl.h - 20, baseHsl.s, 0.56), hslToHex(baseHsl.h, baseHsl.s, 0.60), hslToHex(baseHsl.h + 20, baseHsl.s, 0.56), hslToHex(baseHsl.h + 45, baseHsl.s, 0.48)];
    } else if (preset === "complementary") {
      colors = [hslToHex(baseHsl.h, baseHsl.s, 0.28), hslToHex(baseHsl.h, baseHsl.s, 0.60), hslToHex(baseHsl.h + 180, baseHsl.s, 0.32), hslToHex(baseHsl.h + 180, baseHsl.s, 0.64)];
    } else if (preset === "triad") {
      colors = [hslToHex(baseHsl.h, baseHsl.s, 0.55), hslToHex(baseHsl.h + 120, baseHsl.s, 0.55), hslToHex(baseHsl.h + 240, baseHsl.s, 0.55), hslToHex(baseHsl.h, baseHsl.s, 0.25), hslToHex(baseHsl.h, baseHsl.s, 0.78)];
    } else if (preset === "eightBit") {
      colors = ["#000000", "#ffffff", "#ff0000", "#00ff00", "#0000ff", "#ffff00", "#ff00ff", "#00ffff"];
    } else if (preset === "sixteenBit") {
      colors = ["#000000", "#1d2b53", "#7e2553", "#008751", "#ab5236", "#5f574f", "#c2c3c7", "#fff1e8", "#ff004d", "#ffa300", "#ffec27", "#00e436", "#29adff", "#83769c", "#ff77a8", "#ffccaa"];
    } else if (preset === "gameboy") {
      colors = ["#0f380f", "#306230", "#8bac0f", "#9bbc0f"];
    }

    return colors;
  }

  function renderPalettePreset() {
    if (state.palettePresetColors.length === 0) {
      state.palettePresetColors = createTheoryPalette();
    }

    if (els.palettePresetSwatches) {
      els.palettePresetSwatches.innerHTML = "";

      for (let i = 0; i < state.palettePresetColors.length; i++) {
        const color = state.palettePresetColors[i];
        const swatch = document.createElement("button");
        swatch.className = "swatch preset-swatch";
        swatch.style.background = color;
        swatch.title = color;

        swatch.addEventListener("contextmenu", function (event) {
          event.preventDefault();
        });

        swatch.addEventListener("pointerdown", function (event) {
          if (event.button === 2) {
            event.preventDefault();
            setSecondaryColor(color, true);
          } else {
            setPrimaryColor(color, true);
          }
        });

        els.palettePresetSwatches.appendChild(swatch);
      }
    }

    renderPaletteWheel();
  }

  function renderPaletteWheel() {
    if (!els.paletteWheel) return;
    els.paletteWheel.innerHTML = "";

    const count = state.palettePresetColors.length;
    if (count === 0) return;

    for (let i = 0; i < count; i++) {
      const color = state.palettePresetColors[i];
      const rgb = hexToRgb(color);
      const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);
      const angle = (hsv.h - 90) * Math.PI / 180;
      const radius = hsv.s * 43;
      const x = 50 + Math.cos(angle) * radius;
      const y = 50 + Math.sin(angle) * radius;
      const marker = document.createElement("button");
      marker.className = "palette-wheel-marker";
      marker.style.left = x + "%";
      marker.style.top = y + "%";
      marker.style.background = color;
      marker.title = color + " — drag around the wheel";
      marker.dataset.index = String(i);

      marker.addEventListener("click", function () {
        setPrimaryColor(state.palettePresetColors[i], true);
      });

      marker.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        state.activePaletteWheelIndex = i;
        els.paletteWheel.setPointerCapture(event.pointerId);
      });

      els.paletteWheel.appendChild(marker);
    }
  }

  function updatePaletteWheelColorFromEvent(event) {
    if (!els.paletteWheel) return;
    if (state.activePaletteWheelIndex < 0) return;
    if (state.activePaletteWheelIndex >= state.palettePresetColors.length) return;

    const rect = els.paletteWheel.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = event.clientX - centerX;
    const dy = event.clientY - centerY;
    const radius = Math.sqrt(dx * dx + dy * dy);
    const maxRadius = Math.max(1, rect.width * 0.42);
    let hue = Math.atan2(dy, dx) * 180 / Math.PI + 90;
    hue = ((hue % 360) + 360) % 360;
    let saturation = radius / maxRadius;
    if (saturation > 1) saturation = 1;
    if (saturation < 0.10) saturation = 0.10;

    const currentRgb = hexToRgb(state.palettePresetColors[state.activePaletteWheelIndex]);
    const currentHsv = rgbToHsv(currentRgb.r, currentRgb.g, currentRgb.b);
    const nextColor = hsvToHex(hue, saturation, currentHsv.v);
    state.palettePresetColors[state.activePaletteWheelIndex] = nextColor;
    renderPalettePreset();
  }

  function refreshPalettePreset() {
    state.palettePresetColors = createTheoryPalette();
    renderPalettePreset();
  }

  function updatePaletteCount() {
    if (!els.paletteCountLabel) return;

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

    els.paletteCountLabel.textContent = used.size + " colors used";
  }

  function getMaxFrameCount() {
    let max = 1;

    for (let i = 0; i < state.animations.length; i++) {
      const count = state.animations[i].frames.length;
      if (count > max) max = count;
    }

    return max;
  }

  function getExportLayout() {
    if (els.exportModalLayoutInput && els.exportModalLayoutInput.value) return els.exportModalLayoutInput.value;
    return "horizontalPerAnimation";
  }

  function getExportFormat() {
    if (els.exportModalFormatInput && els.exportModalFormatInput.value) return els.exportModalFormatInput.value;
    return "png";
  }

  function collectExportFrames() {
    const entries = [];

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        entries.push({
          animationIndex: animationIndex,
          frameIndex: frameIndex,
          frame: animation.frames[frameIndex]
        });
      }
    }

    return entries;
  }

  function getExportLayoutSize(layout) {
    const entries = collectExportFrames();
    const total = Math.max(1, entries.length);
    const maxFrames = getMaxFrameCount();

    if (layout === "horizontalStrip") {
      return { columns: total, rows: 1 };
    }

    if (layout === "verticalStrip") {
      return { columns: 1, rows: total };
    }

    if (layout === "verticalPerAnimation") {
      return { columns: state.animations.length, rows: maxFrames };
    }

    if (layout === "packed") {
      const columns = Math.ceil(Math.sqrt(total));
      const rows = Math.ceil(total / columns);
      return { columns: columns, rows: rows };
    }

    return { columns: maxFrames, rows: state.animations.length };
  }

  function drawFrameEntryToSheet(sheetCtx, entry, layout, frameWidth, frameHeight, scale, packedIndex) {
    let column = 0;
    let row = 0;

    if (layout === "horizontalStrip") {
      column = packedIndex;
      row = 0;
    } else if (layout === "verticalStrip") {
      column = 0;
      row = packedIndex;
    } else if (layout === "verticalPerAnimation") {
      column = entry.animationIndex;
      row = entry.frameIndex;
    } else if (layout === "packed") {
      const layoutSize = getExportLayoutSize(layout);
      column = packedIndex % layoutSize.columns;
      row = Math.floor(packedIndex / layoutSize.columns);
    } else {
      column = entry.frameIndex;
      row = entry.animationIndex;
    }

    drawFrameToContext(entry.frame, sheetCtx, column * frameWidth, row * frameHeight, scale, null);
  }

  function createSpriteSheet(scale, layout, flattenBackground) {
    if (!layout) layout = getExportLayout();
    const frameWidth = state.width * scale;
    const frameHeight = state.height * scale;
    const layoutSize = getExportLayoutSize(layout);
    const sheet = document.createElement("canvas");
    sheet.width = frameWidth * layoutSize.columns;
    sheet.height = frameHeight * layoutSize.rows;

    const sheetCtx = sheet.getContext("2d");
    sheetCtx.imageSmoothingEnabled = false;
    sheetCtx.clearRect(0, 0, sheet.width, sheet.height);

    if (flattenBackground) {
      sheetCtx.fillStyle = "#ffffff";
      sheetCtx.fillRect(0, 0, sheet.width, sheet.height);
    }

    const entries = collectExportFrames();
    for (let i = 0; i < entries.length; i++) {
      drawFrameEntryToSheet(sheetCtx, entries[i], layout, frameWidth, frameHeight, scale, i);
    }

    return sheet;
  }

  function createMetadata() {
    const scale = getExportScale();
    const layout = getExportLayout();
    const frameWidth = state.width * scale;
    const frameHeight = state.height * scale;
    const layoutSize = getExportLayoutSize(layout);
    const animations = [];

    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      animations.push({
        name: animation.name,
        duration: animation.duration,
        frameCount: animation.frames.length
      });
    }

    return {
      version: 3,
      app: "SpritePad",
      layout: layout,
      sourceWidth: state.width,
      sourceHeight: state.height,
      scale: scale,
      frameWidth: frameWidth,
      frameHeight: frameHeight,
      columns: layoutSize.columns,
      rows: layoutSize.rows,
      animations: animations
    };
  }

  function getExportScale() {
    let scale = 1;

    if (els.exportModalScaleInput && els.exportModalScaleInput.value) {
      scale = Number(els.exportModalScaleInput.value);
    } else if (els.exportScaleInput && els.exportScaleInput.value) {
      scale = Number(els.exportScaleInput.value);
    }

    if (!scale || scale < 1) scale = 1;
    if (scale > 256) scale = 256;
    return Math.floor(scale);
  }

  function drawExportPreviewToCanvas(targetCanvas, maxWidth, maxHeight) {
    if (!targetCanvas) return;

    const scale = getExportScale();
    const sheet = createSpriteSheet(scale, getExportLayout(), false);
    const targetCtx = targetCanvas.getContext("2d");

    let previewScale = 1;

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

    targetCanvas.width = previewWidth;
    targetCanvas.height = previewHeight;
    targetCtx.imageSmoothingEnabled = false;
    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.drawImage(sheet, 0, 0, previewWidth, previewHeight);
  }

  function updateExportPreview() {
    drawExportPreviewToCanvas(exportPreviewCanvas, 1200, 360);

    if (els.exportModal != null && !els.exportModal.classList.contains("hidden")) {
      drawExportPreviewToCanvas(els.exportModalPreviewCanvas, 900, 420);
    }
  }

  function updateLayerPreview() {
    if (!els.layerPreviewCanvas) return;

    const frame = getFrame();
    if (!frame) return;

    let previewScale = Number(state.layerPreviewZoom);
    if (!previewScale || previewScale < 1) previewScale = 1;
    if (previewScale > 4) previewScale = 4;

    els.layerPreviewCanvas.width = state.width * previewScale;
    els.layerPreviewCanvas.height = state.height * previewScale;

    const previewCtx = els.layerPreviewCanvas.getContext("2d");
    previewCtx.imageSmoothingEnabled = false;
    previewCtx.clearRect(0, 0, els.layerPreviewCanvas.width, els.layerPreviewCanvas.height);
    drawFrameToContext(frame, previewCtx, 0, 0, previewScale, null);

    if (els.layerPreviewZoomInput) els.layerPreviewZoomInput.value = String(previewScale);
    if (els.layerPreviewZoomLabel) els.layerPreviewZoomLabel.textContent = previewScale + "x";
  }

  function openExportDialog() {
    if (!els.exportModal) {
      downloadSpriteSheet();
      return;
    }

    if (els.exportModalScaleInput) els.exportModalScaleInput.value = String(getExportScale());
    els.exportModal.classList.remove("hidden");
    updateExportPreview();
  }

  function closeExportDialog() {
    if (!els.exportModal) return;
    els.exportModal.classList.add("hidden");
  }

  function hasNativeHost() {
    if (!window.chrome) return false;
    if (!window.chrome.webview) return false;
    if (!window.chrome.webview.postMessage) return false;
    return true;
  }

  function postNativeHostMessage(message) {
    if (!hasNativeHost()) return false;

    try {
      window.chrome.webview.postMessage(JSON.stringify(message));
      return true;
    } catch (error) {
      return false;
    }
  }

  function nativeSaveText(text, filename, kind) {
    return postNativeHostMessage({
      type: "saveText",
      filename: filename,
      kind: kind,
      text: text
    });
  }

  function nativeSaveDataUrl(dataUrl, filename, kind) {
    return postNativeHostMessage({
      type: "saveDataUrl",
      filename: filename,
      kind: kind,
      dataUrl: dataUrl
    });
  }

  function nativeSaveCanvas(canvasToSave, filename) {
    return nativeSaveDataUrl(canvasToSave.toDataURL("image/png"), filename, "png");
  }

  function nativeOpenProject() {
    return postNativeHostMessage({
      type: "openProject"
    });
  }

  function nativeExitApp() {
    return postNativeHostMessage({
      type: "exitApp"
    });
  }

  function loadProjectText(text) {
    try {
      const data = JSON.parse(text);
      state.undoStack = [];
      state.redoStack = [];
      loadProjectData(data);
    } catch (error) {
      alert("That project file could not be opened.");
    }
  }

  function setupNativeHostBridge() {
    if (!hasNativeHost()) return;

    window.chrome.webview.addEventListener("message", function (event) {
      let message = event.data;

      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch (error) {
          return;
        }
      }

      if (!message) return;

      if (message.type === "openProjectData") {
        loadProjectText(message.text);
      }

      if (message.type === "hostError") {
        alert(message.message);
      }
    });
  }

  function downloadCanvas(canvasToDownload, filename) {
    const dataUrl = canvasToDownload.toDataURL("image/png");
    if (nativeSaveDataUrl(dataUrl, filename, "png")) return;

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function downloadText(text, filename, kind) {
    if (nativeSaveText(text, filename, kind)) return;

    const blob = new Blob([text], { type: "application/json" });
    const link = document.createElement("a");
    link.download = filename;
    link.href = URL.createObjectURL(blob);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function bytesToBase64(bytes) {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  function writeAscii(bytes, text) {
    for (let i = 0; i < text.length; i++) bytes.push(text.charCodeAt(i) & 255);
  }

  function createStaticGifDataUrl(canvasSource) {
    const temp = document.createElement("canvas");
    temp.width = canvasSource.width;
    temp.height = canvasSource.height;
    const tempCtx = temp.getContext("2d");
    tempCtx.fillStyle = "#ffffff";
    tempCtx.fillRect(0, 0, temp.width, temp.height);
    tempCtx.drawImage(canvasSource, 0, 0);
    const imageData = tempCtx.getImageData(0, 0, temp.width, temp.height);
    const pixels = [];

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i] >> 5;
      const g = imageData.data[i + 1] >> 5;
      const b = imageData.data[i + 2] >> 6;
      pixels.push((r << 5) | (g << 2) | b);
    }

    const bytes = [];
    writeAscii(bytes, "GIF89a");
    bytes.push(temp.width & 255, (temp.width >> 8) & 255, temp.height & 255, (temp.height >> 8) & 255);
    bytes.push(0xF7, 0, 0);

    for (let i = 0; i < 256; i++) {
      const r = ((i >> 5) & 7) * 255 / 7;
      const g = ((i >> 2) & 7) * 255 / 7;
      const b = (i & 3) * 255 / 3;
      bytes.push(Math.round(r), Math.round(g), Math.round(b));
    }

    bytes.push(0x2C, 0, 0, 0, 0, temp.width & 255, (temp.width >> 8) & 255, temp.height & 255, (temp.height >> 8) & 255, 0);
    bytes.push(8);

    const minCodeSize = 8;
    const clearCode = 1 << minCodeSize;
    const endCode = clearCode + 1;
    let codeSize = minCodeSize + 1;
    let nextCode = endCode + 1;
    const dict = new Map();
    for (let i = 0; i < clearCode; i++) dict.set(String.fromCharCode(i), i);

    const output = [];
    let bitBuffer = 0;
    let bitCount = 0;

    function emit(code) {
      bitBuffer |= code << bitCount;
      bitCount += codeSize;
      while (bitCount >= 8) {
        output.push(bitBuffer & 255);
        bitBuffer >>= 8;
        bitCount -= 8;
      }
    }

    emit(clearCode);
    let phrase = String.fromCharCode(pixels[0] || 0);

    for (let i = 1; i < pixels.length; i++) {
      const current = String.fromCharCode(pixels[i]);
      const combo = phrase + current;
      if (dict.has(combo)) {
        phrase = combo;
      } else {
        emit(dict.get(phrase));
        if (nextCode < 4096) {
          dict.set(combo, nextCode);
          nextCode += 1;
          if (nextCode === (1 << codeSize) && codeSize < 12) codeSize += 1;
        } else {
          emit(clearCode);
          dict.clear();
          for (let j = 0; j < clearCode; j++) dict.set(String.fromCharCode(j), j);
          codeSize = minCodeSize + 1;
          nextCode = endCode + 1;
        }
        phrase = current;
      }
    }

    emit(dict.get(phrase));
    emit(endCode);
    if (bitCount > 0) output.push(bitBuffer & 255);

    for (let i = 0; i < output.length; i += 255) {
      const block = output.slice(i, i + 255);
      bytes.push(block.length);
      for (let j = 0; j < block.length; j++) bytes.push(block[j]);
    }

    bytes.push(0, 0x3B);
    return "data:image/gif;base64," + bytesToBase64(bytes);
  }

  function createSvgDataUrl(canvasSource) {
    const imageUrl = canvasSource.toDataURL("image/png");
    const svg = "<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"" + canvasSource.width + "\" height=\"" + canvasSource.height + "\" viewBox=\"0 0 " + canvasSource.width + " " + canvasSource.height + "\"><image href=\"" + imageUrl + "\" width=\"" + canvasSource.width + "\" height=\"" + canvasSource.height + "\" image-rendering=\"pixelated\"/></svg>";
    return "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svg)));
  }

  function createPdfDataUrl(canvasSource) {
    const imageUrl = canvasSource.toDataURL("image/jpeg", 0.92);
    const base64 = imageUrl.split(",")[1];
    const binary = atob(base64);
    const imageBytes = [];
    for (let i = 0; i < binary.length; i++) imageBytes.push(binary.charCodeAt(i));

    const width = canvasSource.width;
    const height = canvasSource.height;
    const parts = [];
    const offsets = [0];
    let total = 0;

    function add(part) {
      parts.push(part);
      total += part.length;
    }

    function addObj(text) {
      offsets.push(total);
      add(text);
    }

    add("%PDF-1.4\n");
    addObj("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    addObj("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    addObj("3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 " + width + " " + height + "] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n");
    offsets.push(total);
    add("4 0 obj\n<< /Type /XObject /Subtype /Image /Width " + width + " /Height " + height + " /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length " + imageBytes.length + " >>\nstream\n");
    let imageBinary = "";
    for (let i = 0; i < imageBytes.length; i += 8192) {
      const chunk = imageBytes.slice(i, i + 8192);
      imageBinary += String.fromCharCode.apply(null, chunk);
    }
    add(imageBinary);
    add("\nendstream\nendobj\n");
    const content = "q\n" + width + " 0 0 " + height + " 0 0 cm\n/Im0 Do\nQ\n";
    addObj("5 0 obj\n<< /Length " + content.length + " >>\nstream\n" + content + "endstream\nendobj\n");
    const xrefOffset = total;
    add("xref\n0 6\n0000000000 65535 f \n");
    for (let i = 1; i < offsets.length; i++) {
      add(String(offsets[i]).padStart(10, "0") + " 00000 n \n");
    }
    add("trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n" + xrefOffset + "\n%%EOF");
    return "data:application/pdf;base64," + btoa(parts.join(""));
  }

  function exportCurrentSheet() {
    const scale = getExportScale();
    const format = getExportFormat();
    const layout = getExportLayout();
    const needsFlatBackground = format === "jpg" || format === "gif" || format === "pdf";
    const sheet = createSpriteSheet(scale, layout, needsFlatBackground);
    let dataUrl = "";
    let filename = "spritepad-export." + format;

    if (format === "jpg") {
      dataUrl = sheet.toDataURL("image/jpeg", 0.92);
      filename = "spritepad-export.jpg";
    } else if (format === "gif") {
      dataUrl = createStaticGifDataUrl(sheet);
      filename = "spritepad-export.gif";
    } else if (format === "pdf") {
      dataUrl = createPdfDataUrl(sheet);
      filename = "spritepad-export.pdf";
    } else if (format === "svg") {
      dataUrl = createSvgDataUrl(sheet);
      filename = "spritepad-export.svg";
    } else {
      dataUrl = sheet.toDataURL("image/png");
      filename = "spritepad-export.png";
    }

    if (nativeSaveDataUrl(dataUrl, filename, format)) {
      closeExportDialog();
      return;
    }

    const link = document.createElement("a");
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    closeExportDialog();
  }

  function downloadSpriteSheet() {
    exportCurrentSheet();
  }

  function downloadMetadata() {
    const metadata = createMetadata();
    downloadText(JSON.stringify(metadata, null, 2), "spritepad-metadata.json", "metadata");
  }

  function createImportNotes() {
    let preset = "generic";
    if (els.enginePresetInput != null) preset = els.enginePresetInput.value;
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
            blendMode: layer.blendMode || "source-over",
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
      customSwatches: state.customSwatches,
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
    state.primaryColor = data.primaryColor || "#000000";
    state.secondaryColor = data.secondaryColor || "#ffffff";
    state.palette = data.palette || state.palette;
    state.customSwatches = data.customSwatches || state.customSwatches;
    state.animations = [];
    state.frames = [];
    state.selection.active = false;
    state.selectionDragStart = null;

    if (data.currentAnimation !== undefined) state.currentAnimation = data.currentAnimation;
    if (data.currentFrame !== undefined) state.currentFrame = data.currentFrame;

    els.primaryColorInput.value = state.primaryColor;
    els.secondaryColorInput.value = state.secondaryColor;
    updateActiveColorButtons();
    els.newWidthInput.value = state.width;
    els.newHeightInput.value = state.height;

    let sourceAnimations = data.animations;
    if (!sourceAnimations && data.frames) {
      sourceAnimations = createAnimationDataFromOldFrames(data);
    }

    if (!sourceAnimations || sourceAnimations.length === 0) {
      sourceAnimations = [{
        name: "Idle",
        duration: 100,
        frames: [{
          duration: 100,
          layers: []
        }]
      }];
    }

    let remaining = 0;

    for (let animationIndex = 0; animationIndex < sourceAnimations.length; animationIndex++) {
      const sourceAnimation = sourceAnimations[animationIndex];
      const animation = {
        name: sourceAnimation.name || ("Animation " + (animationIndex + 1)),
        duration: sourceAnimation.duration || 100,
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
          layer.blendMode = sourceLayer.blendMode || "source-over";
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
    saveCurrentDocumentSnapshot();
    const data = serializeProject();
    downloadText(JSON.stringify(data, null, 2), getCurrentDocumentName() + ".spritepad", "project");
    markCurrentDocumentSaved();
  }

  function openProject(file) {
    const reader = new FileReader();
    reader.onload = function () {
      loadProjectText(reader.result);
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
    if (els.canvasWrap != null) {
      els.canvasWrap.addEventListener("wheel", handleCanvasWheel, { passive: false });
    }
    canvas.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });
    document.addEventListener("contextmenu", function (event) {
      event.preventDefault();
    });

    for (let i = 0; i < els.toolButtons.length; i++) {
      els.toolButtons[i].addEventListener("pointerdown", function (event) {
        event.preventDefault();

        if (event.button === 2) {
          setSecondaryTool(this.dataset.tool);
          return;
        }

        setTool(this.dataset.tool);
        setToolPanelOpen(false);
      });

      els.toolButtons[i].addEventListener("contextmenu", function (event) {
        event.preventDefault();
      });
    }

    if (els.toolPanelToggleBtn != null) {
      els.toolPanelToggleBtn.addEventListener("click", toggleToolPanel);
    }

    if (els.hideToolPanelBtn != null) {
      els.hideToolPanelBtn.addEventListener("click", function () {
        setToolPanelOpen(false);
      });
    }

    els.brushSizeInput.addEventListener("input", function () {
      let size = Number(els.brushSizeInput.value);
      if (!size || size < 1) size = 1;
      if (size > 32) size = 32;
      state.brushSize = Math.floor(size);
      els.brushSizeInput.value = String(state.brushSize);
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

    if (els.animationSelect != null) {
      els.animationSelect.addEventListener("change", function () {
        switchAnimation(Number(els.animationSelect.value));
      });
    }

    if (els.animationNameInput != null) {
      els.animationNameInput.addEventListener("input", function () {
        const animation = getAnimation();
        animation.name = els.animationNameInput.value;
        renderAnimations();
        updateAnimationFields();
        renderFrames();
        updateExportPreview();
      });
    }

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
    els.pauseBtn.addEventListener("click", pauseAnimation);
    els.stopBtn.addEventListener("click", stopTimelinePlayback);
    els.previousFrameBtn.addEventListener("click", function () {
      stepFrame(-1, false);
    });
    els.nextFrameBtn.addEventListener("click", function () {
      stepFrame(1, false);
    });
    els.jumpStartBtn.addEventListener("click", function () {
      jumpToFrame(0);
    });
    els.jumpEndBtn.addEventListener("click", function () {
      jumpToFrame(state.frames.length - 1);
    });
    els.previousAnimationBtn.addEventListener("click", previousAnimation);
    els.nextAnimationBtn.addEventListener("click", nextAnimation);

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

    if (els.documentTabScrollLeftBtn != null) {
      els.documentTabScrollLeftBtn.addEventListener("click", function () {
        scrollDocumentTabs(-1);
      });
    }

    if (els.documentTabScrollRightBtn != null) {
      els.documentTabScrollRightBtn.addEventListener("click", function () {
        scrollDocumentTabs(1);
      });
    }

    if (els.documentTabs != null) {
      els.documentTabs.addEventListener("scroll", updateDocumentTabScrollButtons);
    }

    if (els.swapSidePanelsBtn != null) {
      els.swapSidePanelsBtn.addEventListener("click", swapSidePanels);
    }

    els.addLayerBtn.addEventListener("click", addLayer);
    if (els.deleteLayerBtn) els.deleteLayerBtn.addEventListener("click", deleteLayer);
    if (els.clearLayerToolbarBtn) els.clearLayerToolbarBtn.addEventListener("click", clearLayer);
    els.duplicateLayerBtn.addEventListener("click", duplicateLayer);
    els.mergeLayerBtn.addEventListener("click", mergeLayerDown);
    els.moveLayerUpBtn.addEventListener("click", function () {
      moveLayer(1);
    });
    els.moveLayerDownBtn.addEventListener("click", function () {
      moveLayer(-1);
    });
    if (els.flipHBtn) {
      els.flipHBtn.addEventListener("click", function () {
        flipLayer(true);
      });
    }
    if (els.flipVBtn) {
      els.flipVBtn.addEventListener("click", function () {
        flipLayer(false);
      });
    }
    if (els.rotateLayerBtn) els.rotateLayerBtn.addEventListener("click", rotateLayer90);
    els.outlineBtn.addEventListener("click", applyOutline);

    els.primaryColorInput.addEventListener("click", function () {
      openColorEditor("primary");
    });

    els.primaryColorInput.addEventListener("focus", function () {
      openColorEditor("primary");
    });

    els.primaryColorInput.addEventListener("input", function () {
      openColorEditor("primary");
      setPrimaryColor(els.primaryColorInput.value, false);
    });

    els.primaryColorInput.addEventListener("change", function () {
      setPrimaryColor(els.primaryColorInput.value, true);
    });

    els.secondaryColorInput.addEventListener("click", function () {
      openColorEditor("secondary");
    });

    els.secondaryColorInput.addEventListener("focus", function () {
      openColorEditor("secondary");
    });

    els.secondaryColorInput.addEventListener("input", function () {
      openColorEditor("secondary");
      setSecondaryColor(els.secondaryColorInput.value, false);
    });

    els.secondaryColorInput.addEventListener("change", function () {
      setSecondaryColor(els.secondaryColorInput.value, true);
    });

    if (els.swapColorsBtn != null) {
      els.swapColorsBtn.addEventListener("click", swapColors);
    }

    if (els.saveSwatchBtn != null) {
      els.saveSwatchBtn.addEventListener("click", saveCurrentSwatch);
    }

    if (els.palettePresetInput != null) {
      els.palettePresetInput.addEventListener("change", refreshPalettePreset);
      els.palettePresetInput.addEventListener("click", function () {
        window.setTimeout(refreshPalettePreset, 0);
      });
    }

    if (els.applyPalettePresetBtn != null) {
      els.applyPalettePresetBtn.addEventListener("click", refreshPalettePreset);
    }

    if (els.paletteWheelInput != null) {
      els.paletteWheelInput.addEventListener("input", refreshPalettePreset);
    }

    if (els.paletteWheel != null) {
      els.paletteWheel.addEventListener("pointermove", function (event) {
        if (state.activePaletteWheelIndex < 0) return;
        updatePaletteWheelColorFromEvent(event);
      });

      els.paletteWheel.addEventListener("pointerup", function () {
        state.activePaletteWheelIndex = -1;
      });

      els.paletteWheel.addEventListener("pointercancel", function () {
        state.activePaletteWheelIndex = -1;
      });
    }

    if (els.colorEditorCloseBtn != null) {
      els.colorEditorCloseBtn.addEventListener("click", closeColorEditor);
    }

    if (els.colorEditorPanel != null) {
      els.colorEditorPanel.addEventListener("click", function (event) {
        event.stopPropagation();
      });
    }

    window.addEventListener("resize", function () {
      if (!state.colorEditorOpen) return;
      positionColorEditor();
    });

    if (els.colorHueInput != null) {
      els.colorHueInput.addEventListener("input", updateColorFromHueInput);
    }

    if (els.colorPlane != null) {
      els.colorPlane.addEventListener("pointerdown", function (event) {
        event.preventDefault();
        els.colorPlane.setPointerCapture(event.pointerId);
        updateColorFromPlaneEvent(event);
      });

      els.colorPlane.addEventListener("pointermove", function (event) {
        if (event.buttons !== 1) return;
        updateColorFromPlaneEvent(event);
      });
    }

    if (els.colorModeInput != null) {
      state.colorMode = els.colorModeInput.value;
      els.colorModeInput.addEventListener("change", function () {
        state.colorMode = els.colorModeInput.value;
        updateColorEditorFields();
      });
    }

    if (els.colorValueInput != null) {
      els.colorValueInput.addEventListener("change", function () {
        const color = parseColorText(els.colorValueInput.value);
        setEditingColor(color, true);
      });
    }

    const rgbInputs = [els.rgbRInput, els.rgbGInput, els.rgbBInput];
    for (let i = 0; i < rgbInputs.length; i++) {
      if (rgbInputs[i] == null) continue;
      rgbInputs[i].addEventListener("input", function () {
        updatePrimaryFromChannelInputs("rgb");
      });
    }

    const hslInputs = [els.hslHInput, els.hslSInput, els.hslLInput];
    for (let i = 0; i < hslInputs.length; i++) {
      if (hslInputs[i] == null) continue;
      hslInputs[i].addEventListener("input", function () {
        updatePrimaryFromChannelInputs("hsl");
      });
    }

    const hsvInputs = [els.hsvHInput, els.hsvSInput, els.hsvVInput];
    for (let i = 0; i < hsvInputs.length; i++) {
      if (hsvInputs[i] == null) continue;
      hsvInputs[i].addEventListener("input", function () {
        updatePrimaryFromChannelInputs("hsv");
      });
    }

    if (els.clearLayerBtn) els.clearLayerBtn.addEventListener("click", clearLayer);

    els.copySelectionBtn.addEventListener("click", copySelection);
    els.cutSelectionBtn.addEventListener("click", cutSelection);
    els.pasteWithTransparencyBtn.addEventListener("click", function () {
      pasteSelection(true);
    });
    if (els.pasteNewLayerBtn != null) {
      els.pasteNewLayerBtn.addEventListener("click", pasteIntoNewLayer);
    }
    if (els.pasteNewImageBtn != null) {
      els.pasteNewImageBtn.addEventListener("click", pasteIntoNewImage);
    }
    if (els.pasteNoTransparencyBtn != null) {
      els.pasteNoTransparencyBtn.addEventListener("click", function () {
        pasteSelection(true);
      });
    }
    els.clearSelectionBtn.addEventListener("click", clearSelection);

    els.saveProjectBtn.addEventListener("click", saveProject);
    if (els.openProjectBtn != null) {
      els.openProjectBtn.addEventListener("click", function () {
        if (nativeOpenProject()) return;
        els.openProjectInput.click();
      });
    }
    els.openProjectInput.addEventListener("change", function () {
      if (els.openProjectInput.files.length === 0) return;
      openInputFiles(els.openProjectInput.files);
      els.openProjectInput.value = "";
    });

    els.undoBtn.addEventListener("click", undo);
    els.redoBtn.addEventListener("click", redo);
    els.exportPngBtn.addEventListener("click", openExportDialog);
    if (els.downloadSheetBtn != null) els.downloadSheetBtn.addEventListener("click", downloadSpriteSheet);
    if (els.downloadJsonBtn != null) els.downloadJsonBtn.addEventListener("click", downloadMetadata);
    if (els.copyNotesBtn != null) els.copyNotesBtn.addEventListener("click", copyImportNotes);
    if (els.exportScaleInput != null) {
      els.exportScaleInput.addEventListener("input", function () {
        if (els.exportModalScaleInput != null) els.exportModalScaleInput.value = els.exportScaleInput.value;
        updateExportPreview();
      });
    }
    if (els.layerPreviewZoomInput != null) {
      els.layerPreviewZoomInput.addEventListener("input", function () {
        let value = Number(els.layerPreviewZoomInput.value);
        if (!value || value < 1) value = 1;
        if (value > 4) value = 4;
        state.layerPreviewZoom = value;
        updateLayerPreview();
      });
    }
    if (els.exportModalScaleInput != null) {
      els.exportModalScaleInput.addEventListener("input", function () {
        if (els.exportScaleInput != null) els.exportScaleInput.value = els.exportModalScaleInput.value;
        updateExportPreview();
      });
    }
    if (els.exportModalLayoutInput != null) els.exportModalLayoutInput.addEventListener("change", updateExportPreview);
    if (els.exportModalFormatInput != null) els.exportModalFormatInput.addEventListener("change", updateExportPreview);
    if (els.exportModalSaveBtn != null) els.exportModalSaveBtn.addEventListener("click", exportCurrentSheet);
    if (els.exportModalCloseBtn != null) els.exportModalCloseBtn.addEventListener("click", closeExportDialog);
    if (els.exportModal != null) {
      els.exportModal.addEventListener("click", function (event) {
        if (event.target === els.exportModal) closeExportDialog();
      });
    }
    if (els.enginePresetInput != null) els.enginePresetInput.addEventListener("change", updateExportPreview);

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
    if (tabName === "export") {
      openExportDialog();
      return;
    }

    if (els.layersTab != null) els.layersTab.classList.add("active");
    if (els.paletteTab != null) els.paletteTab.classList.add("active");
    if (els.exportTab != null) els.exportTab.classList.remove("active");
  }

  function executeAction(action) {
    if (!action) return;

    if (action === "newProject") showNewProjectDialog();
    if (action === "saveProject") saveProject();
    if (action === "openProject") {
      if (!nativeOpenProject()) {
        els.openProjectInput.click();
      }
    }
    if (action === "closeCurrentDocument") closeCurrentDocument();
    if (action === "exitApp") exitApp();
    if (action === "downloadSheet") openExportDialog();
    if (action === "downloadJson") downloadMetadata();
    if (action === "copyNotes") copyImportNotes();

    if (action === "undo") undo();
    if (action === "redo") redo();
    if (action === "copySelection") copySelection();
    if (action === "cutSelection") cutSelection();
    if (action === "pasteWithTransparency") pasteSelection(true);
    if (action === "pasteIntoNewLayer") pasteIntoNewLayer();
    if (action === "pasteIntoNewImage") pasteIntoNewImage();
    if (action === "pasteNoTransparency") pasteSelection(true);
    if (action === "deleteSelection") deleteSelection();
    if (action === "selectAll") selectAll();
    if (action === "clearSelection") clearSelection();

    if (action === "toolBrush") setTool("brush");
    if (action === "toolPencil") setTool("pencil");
    if (action === "toolEraser") setTool("eraser");
    if (action === "toolFill") setTool("fill");
    if (action === "toolLine") setTool("line");
    if (action === "toolRect") setTool("rect");
    if (action === "toolCircle") setTool("circle");
    if (action === "toolSelect") setTool("select");
    if (action === "toolEyedropper") setTool("eyedropper");
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
    if (action === "deleteLayer") deleteLayer();
    if (action === "moveLayerUp") moveLayer(1);
    if (action === "moveLayerDown") moveLayer(-1);
    if (action === "flipLayerH") flipLayer(true);
    if (action === "flipLayerV") flipLayer(false);
    if (action === "rotateLayer") rotateLayer90();
    if (action === "outlineLayer") applyOutline();
    if (action === "clearLayer") clearLayer();

    if (action === "playAnimation") {
      if (state.isPlaying) {
        pauseAnimation();
      } else {
        playAnimation();
      }
    }
    if (action === "addAnimation") addAnimation();
    if (action === "deleteAnimation") deleteAnimation();
    if (action === "addFrame") addFrame();
    if (action === "duplicateFrame") duplicateFrame();
    if (action === "deleteFrame") deleteFrame();
    if (action === "moveFrameLeft") moveFrame(-1);
    if (action === "moveFrameRight") moveFrame(1);

    if (action === "openShortcuts") openShortcutsModal();
    if (action === "toggleFullscreen") toggleFullscreen();
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



  function clampImageSize(value, fallback) {
    let size = Number(value);
    if (!Number.isFinite(size)) size = fallback;
    if (size < 1) size = 1;
    if (size > 1024) size = 1024;
    return Math.floor(size);
  }

  function scrollDocumentTabs(direction) {
    if (els.documentTabs == null) return;

    const amount = Math.max(120, Math.floor(els.documentTabs.clientWidth * 0.75));
    els.documentTabs.scrollBy({
      left: amount * direction,
      behavior: "smooth"
    });

    window.setTimeout(updateDocumentTabScrollButtons, 140);
  }

  function updateDocumentTabScrollButtons() {
    if (els.documentTabs == null) return;

    const hasOverflow = els.documentTabs.scrollWidth > els.documentTabs.clientWidth + 2;
    const atStart = els.documentTabs.scrollLeft <= 1;
    const atEnd = els.documentTabs.scrollLeft + els.documentTabs.clientWidth >= els.documentTabs.scrollWidth - 2;

    if (els.documentTabScrollLeftBtn != null) {
      els.documentTabScrollLeftBtn.disabled = !hasOverflow || atStart;
    }

    if (els.documentTabScrollRightBtn != null) {
      els.documentTabScrollRightBtn.disabled = !hasOverflow || atEnd;
    }
  }

  function swapSidePanels() {
    const inspector = document.querySelector(".inspector");
    if (inspector == null) return;
    inspector.classList.toggle("palette-first");
  }

  function ensureDocumentSystem() {
    if (!Array.isArray(state.documents)) state.documents = [];
    if (state.currentDocument === undefined) state.currentDocument = 0;
    if (state.nextDocumentId === undefined) state.nextDocumentId = 1;
  }

  function getCurrentDocumentName() {
    ensureDocumentSystem();
    if (!state.documents[state.currentDocument]) return "Untitled";
    return state.documents[state.currentDocument].name;
  }

  function saveCurrentDocumentSnapshot() {
    ensureDocumentSystem();
    if (!state.documents[state.currentDocument]) return;
    state.documents[state.currentDocument].data = serializeProject();
  }

  function markCurrentDocumentDirty() {
    ensureDocumentSystem();
    if (!state.documents[state.currentDocument]) return;
    state.documents[state.currentDocument].dirty = true;
    renderDocumentTabs();
  }

  function markCurrentDocumentSaved() {
    ensureDocumentSystem();
    if (!state.documents[state.currentDocument]) return;
    state.documents[state.currentDocument].dirty = false;
    saveCurrentDocumentSnapshot();
    renderDocumentTabs();
  }

  function renderDocumentTabs() {
    ensureDocumentSystem();
    if (!els.documentTabs) return;

    els.documentTabs.innerHTML = "";

    for (let i = 0; i < state.documents.length; i++) {
      const documentInfo = state.documents[i];
      const button = document.createElement("button");
      button.className = "document-tab";
      if (i === state.currentDocument) button.classList.add("active");
      button.title = documentInfo.name;

      const name = document.createElement("span");
      name.className = "document-tab-name";
      name.textContent = documentInfo.name + (documentInfo.dirty ? " *" : "");

      const close = document.createElement("span");
      close.className = "document-tab-close";
      close.textContent = "×";
      close.title = "Close image";
      close.setAttribute("aria-label", "Close image");

      button.appendChild(name);
      button.appendChild(close);

      button.addEventListener("click", function () {
        switchDocument(i);
      });

      close.addEventListener("click", function (event) {
        event.preventDefault();
        event.stopPropagation();
        closeDocument(i);
      });

      els.documentTabs.appendChild(button);
    }

    window.requestAnimationFrame(updateDocumentTabScrollButtons);
  }

  function registerCurrentDocument(name) {
    ensureDocumentSystem();
    const safeName = name || ("Image " + state.nextDocumentId);
    const documentInfo = {
      id: state.nextDocumentId,
      name: safeName,
      data: serializeProject(),
      dirty: false
    };
    state.nextDocumentId += 1;
    state.documents.push(documentInfo);
    state.currentDocument = state.documents.length - 1;
    renderDocumentTabs();
  }

  function switchDocument(index) {
    ensureDocumentSystem();
    if (index < 0) return;
    if (index >= state.documents.length) return;
    if (index === state.currentDocument) return;

    saveCurrentDocumentSnapshot();
    state.currentDocument = index;
    state.undoStack = [];
    state.redoStack = [];
    loadProjectData(state.documents[index].data);
    renderDocumentTabs();
  }

  function resetToBlankImage(width, height, animationName) {
    stopAnimation();
    state.width = clampImageSize(width, 32);
    state.height = clampImageSize(height, 32);
    state.animations = [createAnimation(animationName || "Animation 0")];
    state.currentAnimation = 0;
    state.currentFrame = 0;
    state.currentLayer = 0;
    state.selection.active = false;
    state.selectionDragStart = null;
    state.clipboard = state.clipboard;
    state.canvasPanX = 0;
    state.canvasPanY = 0;
    syncActiveFrames();
    resizeDisplayCanvas();
    updateCanvasPan();
  }

  function createNewImageDocument(width, height, name) {
    ensureDocumentSystem();
    if (state.documents.length > 0) saveCurrentDocumentSnapshot();
    resetToBlankImage(width, height, "Animation 0");
    state.undoStack = [];
    state.redoStack = [];
    registerCurrentDocument(name || ("Image " + state.nextDocumentId));
    closeStartupDialog();
    closeNewProjectDialog();
    renderAllUi();
  }

  function clearFrameImages(frame) {
    if (!frame) return;
    for (let i = 0; i < frame.layers.length; i++) {
      frame.layers[i].ctx.clearRect(0, 0, state.width, state.height);
    }
  }

  function clearAllProjectImages() {
    for (let animationIndex = 0; animationIndex < state.animations.length; animationIndex++) {
      const animation = state.animations[animationIndex];
      for (let frameIndex = 0; frameIndex < animation.frames.length; frameIndex++) {
        clearFrameImages(animation.frames[frameIndex]);
      }
    }
  }

  function showStartupDialog() {
    if (!els.startupModal) return;
    els.startupModal.classList.remove("hidden");
  }

  function closeStartupDialog() {
    if (!els.startupModal) return;
    els.startupModal.classList.add("hidden");
  }

  function showNewProjectDialog() {
    if (!els.newProjectModal) return;
    closeStartupDialog();
    if (els.newProjectWidthInput) els.newProjectWidthInput.value = String(state.width || 32);
    if (els.newProjectHeightInput) els.newProjectHeightInput.value = String(state.height || 32);
    els.newProjectModal.classList.remove("hidden");
    if (els.newProjectWidthInput) els.newProjectWidthInput.focus();
  }

  function closeNewProjectDialog() {
    if (!els.newProjectModal) return;
    els.newProjectModal.classList.add("hidden");
  }

  function createNewProjectFromDialog() {
    const width = clampImageSize(els.newProjectWidthInput ? els.newProjectWidthInput.value : 32, 32);
    const height = clampImageSize(els.newProjectHeightInput ? els.newProjectHeightInput.value : 32, 32);
    createNewImageDocument(width, height, "Image " + state.nextDocumentId);
  }

  function setupStartupAndNewProjectEvents() {
    if (els.startupNewBtn != null) {
      els.startupNewBtn.addEventListener("click", showNewProjectDialog);
    }

    if (els.startupOpenBtn != null) {
      els.startupOpenBtn.addEventListener("click", function () {
        if (nativeOpenProject()) return;
        if (els.openProjectInput != null) els.openProjectInput.click();
      });
    }

    if (els.startupCloseBtn != null) {
      els.startupCloseBtn.addEventListener("click", function () {
        if (state.documents.length === 0) {
          createNewImageDocument(32, 32, "Image " + state.nextDocumentId);
        }
        closeStartupDialog();
      });
    }

    if (els.newProjectCancelBtn != null) {
      els.newProjectCancelBtn.addEventListener("click", function () {
        closeNewProjectDialog();
        if (state.documents.length === 0) showStartupDialog();
      });
    }

    if (els.createNewProjectBtn != null) {
      els.createNewProjectBtn.addEventListener("click", createNewProjectFromDialog);
    }

    if (els.saveBeforeCloseSaveBtn != null) {
      els.saveBeforeCloseSaveBtn.addEventListener("click", function () {
        resolveSaveBeforeCloseDialog("save");
      });
    }

    if (els.saveBeforeCloseDontSaveBtn != null) {
      els.saveBeforeCloseDontSaveBtn.addEventListener("click", function () {
        resolveSaveBeforeCloseDialog("dontSave");
      });
    }

    for (let i = 0; i < els.newSizePresetButtons.length; i++) {
      els.newSizePresetButtons[i].addEventListener("click", function () {
        const size = this.dataset.size;
        if (els.newProjectWidthInput) els.newProjectWidthInput.value = size;
        if (els.newProjectHeightInput) els.newProjectHeightInput.value = size;
      });
    }
  }

  function isImageFile(file) {
    if (!file) return false;
    if (file.type && file.type.indexOf("image/") === 0) return true;
    const name = file.name.toLowerCase();
    return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".gif") || name.endsWith(".webp") || name.endsWith(".bmp");
  }

  function cleanDocumentName(filename) {
    if (!filename) return "Image " + state.nextDocumentId;
    return filename.replace(/\.[^/.]+$/, "");
  }

  function openInputFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      if (isImageFile(file)) {
        const reader = new FileReader();
        reader.onload = function () {
          createImageDocumentFromDataUrl(cleanDocumentName(file.name), reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        const reader = new FileReader();
        reader.onload = function () {
          loadProjectText(reader.result, cleanDocumentName(file.name));
        };
        reader.readAsText(file);
      }
    }

    closeStartupDialog();
  }

  function createImageDocumentFromDataUrl(name, dataUrl) {
    const image = new Image();
    image.onload = function () {
      ensureDocumentSystem();
      if (state.documents.length > 0) saveCurrentDocumentSnapshot();

      resetToBlankImage(image.width, image.height, "Animation 0");
      const layer = getLayer();
      if (layer != null) {
        layer.name = "Image";
        layer.ctx.clearRect(0, 0, state.width, state.height);
        layer.ctx.drawImage(image, 0, 0);
      }

      state.undoStack = [];
      state.redoStack = [];
      registerCurrentDocument(name || ("Image " + state.nextDocumentId));
      closeStartupDialog();
      renderAllUi();
    };
    image.src = dataUrl;
  }

  function loadProjectText(text, name) {
    try {
      const data = JSON.parse(text);
      ensureDocumentSystem();
      if (state.documents.length > 0) saveCurrentDocumentSnapshot();

      const safeName = name || data.name || "Project " + state.nextDocumentId;
      const documentInfo = {
        id: state.nextDocumentId,
        name: safeName,
        data: data,
        dirty: false
      };
      state.nextDocumentId += 1;
      state.documents.push(documentInfo);
      state.currentDocument = state.documents.length - 1;
      state.undoStack = [];
      state.redoStack = [];
      loadProjectData(data);
      closeStartupDialog();
      renderDocumentTabs();
    } catch (error) {
      alert("That project file could not be opened.");
    }
  }

  function setupNativeHostBridge() {
    if (!hasNativeHost()) return;

    window.chrome.webview.addEventListener("message", function (event) {
      let message = event.data;

      if (typeof message === "string") {
        try {
          message = JSON.parse(message);
        } catch (error) {
          return;
        }
      }

      if (!message) return;

      if (message.type === "openProjectData") {
        loadProjectText(message.text, message.name || "Project " + state.nextDocumentId);
      }

      if (message.type === "openFiles") {
        for (let i = 0; i < message.files.length; i++) {
          const file = message.files[i];
          if (file.kind === "image") {
            createImageDocumentFromDataUrl(cleanDocumentName(file.name), file.dataUrl);
          } else {
            loadProjectText(file.text, cleanDocumentName(file.name));
          }
        }
        closeStartupDialog();
      }

      if (message.type === "hostError") {
        alert(message.message);
      }
    });
  }


  function showSaveBeforeCloseDialog(documentName) {
    if (!els.saveBeforeCloseModal) {
      return Promise.resolve("dontSave");
    }

    if (els.saveBeforeCloseMessage) {
      els.saveBeforeCloseMessage.textContent = 'Save "' + documentName + '" before closing?';
    }

    els.saveBeforeCloseModal.classList.remove("hidden");

    return new Promise(function (resolve) {
      state.saveBeforeCloseResolver = resolve;
    });
  }

  function resolveSaveBeforeCloseDialog(choice) {
    if (els.saveBeforeCloseModal) {
      els.saveBeforeCloseModal.classList.add("hidden");
    }

    const resolver = state.saveBeforeCloseResolver;
    state.saveBeforeCloseResolver = null;

    if (resolver) {
      resolver(choice);
    }
  }

  async function shouldSaveDocumentBeforeClose(index) {
    ensureDocumentSystem();
    const documentInfo = state.documents[index];
    if (!documentInfo) return true;
    if (!documentInfo.dirty) return true;

    const choice = await showSaveBeforeCloseDialog(documentInfo.name);

    if (choice === "save") {
      const currentIndex = state.currentDocument;
      if (currentIndex !== index) {
        saveCurrentDocumentSnapshot();
        state.currentDocument = index;
        loadProjectData(documentInfo.data);
      }
      saveProject();
      if (currentIndex !== index && state.documents[currentIndex]) {
        state.currentDocument = currentIndex;
        loadProjectData(state.documents[currentIndex].data);
      }
    }

    return true;
  }

  async function closeDocument(index) {
    ensureDocumentSystem();
    if (index < 0) return false;
    if (index >= state.documents.length) return false;

    saveCurrentDocumentSnapshot();
    const canClose = await shouldSaveDocumentBeforeClose(index);
    if (!canClose) return false;

    state.documents.splice(index, 1);

    if (state.documents.length === 0) {
      state.currentDocument = 0;
      resetToBlankImage(32, 32, "Animation 0");
      state.undoStack = [];
      state.redoStack = [];
      renderDocumentTabs();
      renderAllUi();
      showStartupDialog();
      return true;
    }

    if (state.currentDocument >= state.documents.length) {
      state.currentDocument = state.documents.length - 1;
    }

    if (index < state.currentDocument) {
      state.currentDocument -= 1;
    }

    if (state.currentDocument < 0) state.currentDocument = 0;
    state.undoStack = [];
    state.redoStack = [];
    loadProjectData(state.documents[state.currentDocument].data);
    renderDocumentTabs();
    return true;
  }

  function closeCurrentDocument() {
    return closeDocument(state.currentDocument);
  }

  async function exitApp() {
    ensureDocumentSystem();
    saveCurrentDocumentSnapshot();

    while (state.documents.length > 0) {
      state.currentDocument = 0;
      loadProjectData(state.documents[0].data);
      renderDocumentTabs();
      const closed = await closeDocument(0);
      if (!closed) return;
    }

    if (!nativeExitApp()) {
      window.close();
    }
  }

  function pasteIntoNewLayer() {
    if (!state.clipboard) return;
    pushUndo();
    const frame = getFrame();
    if (!frame) return;

    const newLayer = createLayer("Pasted Layer");
    frame.layers.push(newLayer);
    state.currentLayer = frame.layers.length - 1;

    const point = getPastePoint();
    const pasteW = Math.min(state.clipboard.width, state.width - point.x);
    const pasteH = Math.min(state.clipboard.height, state.height - point.y);
    if (pasteW > 0 && pasteH > 0) {
      newLayer.ctx.drawImage(state.clipboard.canvas, 0, 0, pasteW, pasteH, point.x, point.y, pasteW, pasteH);
    }

    state.selection.active = true;
    state.selection.x = point.x;
    state.selection.y = point.y;
    state.selection.w = pasteW;
    state.selection.h = pasteH;
    renderAllUi();
  }

  function pasteIntoNewImage() {
    if (!state.clipboard) return;

    const clip = state.clipboard;
    createNewImageDocument(clip.width, clip.height, "Pasted Image " + state.nextDocumentId);
    const layer = getLayer();
    if (!layer) return;
    layer.ctx.putImageData(clip.imageData, 0, 0);
    renderAllUi();
  }

  function initBlankProject() {
    resetToBlankImage(32, 32, "Animation 0");
    state.undoStack = [];
    state.redoStack = [];
  }

  function boot() {
    ensureDocumentSystem();
    loadShortcuts();
    initBlankProject();
    resizeDisplayCanvas();
    setupNativeHostBridge();
    setupEvents();
    setupStartupAndNewProjectEvents();
    updateShortcutLabels();
    renderAllUi();
    showStartupDialog();
  }

  boot();
})();
