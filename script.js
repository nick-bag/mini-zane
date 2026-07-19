const TOTAL_PAGES = 8;
const PRINT_LAYOUT = [8, 1, 2, 7, 6, 3, 4, 5];
const ROTATED_PAGES = new Set([8, 1, 2, 7]);
const SPREADS = [
  { title: "Outside", pages: [1, 8] },
  { title: "Inside spread 1", pages: [2, 3] },
  { title: "Inside spread 2", pages: [4, 5] },
  { title: "Inside spread 3", pages: [6, 7] },
];
const CANVAS_WIDTH = 3300;
const CANVAS_HEIGHT = 2550;

const state = {
  pages: Array.from({ length: TOTAL_PAGES }, () => null),
  dragIndex: null,
};

const photoInput = document.querySelector("#photo-input");
const sheetPreview = document.querySelector("#sheet-preview");
const bookletPreview = document.querySelector("#booklet-preview");
const photoCount = document.querySelector("#photo-count");
const statusMessage = document.querySelector("#status-message");
const downloadButton = document.querySelector("#download-button");
const printButton = document.querySelector("#print-button");
const clearButton = document.querySelector("#clear-button");

const sheetCellTemplate = document.querySelector("#sheet-cell-template");
const spreadTemplate = document.querySelector("#spread-template");

let imageId = 0;

photoInput.addEventListener("change", handleBulkUpload);
downloadButton.addEventListener("click", () => exportSheet("download"));
printButton.addEventListener("click", () => exportSheet("print"));
clearButton.addEventListener("click", clearAllPhotos);

render();

function handleBulkUpload(event) {
  const files = Array.from(event.target.files || []).filter((file) =>
    file.type.startsWith("image/")
  );

  if (!files.length) {
    return;
  }

  let nextEmptyIndex = state.pages.findIndex((page) => page === null);

  for (const file of files) {
    if (nextEmptyIndex === -1) {
      break;
    }

    assignFileToPage(file, nextEmptyIndex);
    nextEmptyIndex = state.pages.findIndex((page, index) => index > nextEmptyIndex && page === null);
  }

  photoInput.value = "";
  render();
}

function assignFileToPage(file, index) {
  const previous = state.pages[index];
  if (previous) {
    URL.revokeObjectURL(previous.url);
  }

  state.pages[index] = {
    id: `page-image-${imageId += 1}`,
    name: file.name,
    file,
    url: URL.createObjectURL(file),
  };
}

function clearAllPhotos() {
  state.pages.forEach((page) => {
    if (page) {
      URL.revokeObjectURL(page.url);
    }
  });

  state.pages = Array.from({ length: TOTAL_PAGES }, () => null);
  state.dragIndex = null;
  render();
}

function removePhoto(index) {
  const page = state.pages[index];
  if (!page) {
    return;
  }

  URL.revokeObjectURL(page.url);
  state.pages[index] = null;
  render();
}

function movePhoto(fromIndex, toIndex) {
  if (fromIndex === null || toIndex === null || fromIndex === toIndex) {
    return;
  }

  const nextPages = [...state.pages];
  const dragged = nextPages[fromIndex];
  const target = nextPages[toIndex];
  nextPages[toIndex] = dragged;
  nextPages[fromIndex] = target;
  state.pages = nextPages;
  state.dragIndex = null;
  render();
}

function render() {
  renderSheetPreview();
  renderBookletPreview();
  updateStatus();
}

function renderSheetPreview() {
  sheetPreview.innerHTML = "";

  PRINT_LAYOUT.forEach((pageNumber) => {
    const cell = sheetCellTemplate.content.firstElementChild.cloneNode(true);
    const image = cell.querySelector(".sheet-image");
    const label = cell.querySelector(".sheet-label");
    const page = state.pages[pageNumber - 1];

    label.textContent = `Page ${pageNumber}`;
    if (ROTATED_PAGES.has(pageNumber)) {
      cell.classList.add("is-rotated");
    }

    if (page) {
      image.style.backgroundImage = `url("${page.url}")`;
    } else {
      cell.classList.add("is-empty");
      image.style.backgroundImage = "";
    }

    sheetPreview.appendChild(cell);
  });
}

function renderBookletPreview() {
  bookletPreview.innerHTML = "";

  SPREADS.forEach((spread) => {
    const card = spreadTemplate.content.firstElementChild.cloneNode(true);
    const heading = card.querySelector("h3");
    const pagesContainer = card.querySelector(".spread-pages");

    heading.textContent = spread.title;

    spread.pages.forEach((pageNumber) => {
      const page = state.pages[pageNumber - 1];
      const pageNode = document.createElement("article");
      pageNode.className = "booklet-page";
      pageNode.dataset.pageIndex = String(pageNumber - 1);
      pageNode.draggable = Boolean(page);

      if (page) {
        pageNode.classList.add("is-draggable");
      }

      const frame = document.createElement("div");
      frame.className = "booklet-frame";

      const image = document.createElement("div");
      image.className = "booklet-image";
      if (page) {
        image.style.backgroundImage = `url("${page.url}")`;
      } else {
        frame.classList.add("is-empty");
      }
      frame.appendChild(image);

      const caption = document.createElement("div");
      caption.className = "booklet-caption";
      const captionMain = document.createElement("div");
      captionMain.className = "booklet-caption-main";
      const strong = document.createElement("strong");
      strong.textContent = `Page ${pageNumber}`;
      captionMain.append(strong);

      const removeButton = document.createElement("button");
      removeButton.className = "remove-button";
      removeButton.type = "button";
      removeButton.textContent = "Remove";
      removeButton.disabled = !page;
      removeButton.addEventListener("click", () => removePhoto(pageNumber - 1));

      caption.append(captionMain, removeButton);

      pageNode.addEventListener("dragstart", (event) => {
        if (!state.pages[pageNumber - 1]) {
          event.preventDefault();
          return;
        }

        state.dragIndex = pageNumber - 1;
        pageNode.classList.add("is-dragging");
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("text/plain", String(pageNumber - 1));
      });

      pageNode.addEventListener("dragend", () => {
        state.dragIndex = null;
        bookletPreview.querySelectorAll(".is-dragging, .is-drag-over").forEach((element) => {
          element.classList.remove("is-dragging", "is-drag-over");
        });
      });

      pageNode.addEventListener("dragover", (event) => {
        if (state.dragIndex === null) {
          return;
        }

        event.preventDefault();
        pageNode.classList.add("is-drag-over");
      });

      pageNode.addEventListener("dragleave", () => {
        pageNode.classList.remove("is-drag-over");
      });

      pageNode.addEventListener("drop", (event) => {
        event.preventDefault();
        pageNode.classList.remove("is-drag-over");
        movePhoto(state.dragIndex, pageNumber - 1);
      });

      pageNode.append(frame, caption);
      pagesContainer.appendChild(pageNode);
    });

    bookletPreview.appendChild(card);
  });
}

function updateStatus() {
  const loadedCount = state.pages.filter(Boolean).length;
  const ready = loadedCount > 0;

  photoCount.textContent = `${loadedCount} / ${TOTAL_PAGES} photos loaded`;
  downloadButton.disabled = !ready;
  printButton.disabled = !ready;

  if (ready) {
    statusMessage.textContent =
      "Ready to export. Any unfilled pages will stay blank in the printed zine.";
  } else {
    statusMessage.textContent = "Add at least one photo to enable download and print.";
  }
}

async function exportSheet(mode) {
  let printWindow = null;
  if (mode === "print") {
    printWindow = window.open("", "_blank", "noopener,noreferrer");

    if (!printWindow) {
      statusMessage.textContent = "The print window was blocked. Allow pop-ups and try again.";
      return;
    }
  }

  let canvas;
  try {
    canvas = await buildPrintableCanvas();
  } catch (error) {
    statusMessage.textContent =
      error instanceof Error ? error.message : "The zine sheet could not be rendered.";
    if (printWindow) {
      printWindow.close();
    }
    return;
  }

  if (mode === "download") {
    canvas.toBlob((blob) => {
      if (!blob) {
        return;
      }

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "mini-zine-sheet.png";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }, "image/png");
    return;
  }

  const dataUrl = canvas.toDataURL("image/png");

  printWindow.document.write(`<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <title>Mini Zine Sheet</title>
        <style>
          @page { size: landscape; margin: 0; }
          body { margin: 0; display: grid; place-items: center; background: white; }
          img { width: 100vw; height: auto; display: block; }
        </style>
      </head>
      <body>
        <img src="${dataUrl}" alt="Printable mini zine sheet" />
        <script>
          const image = document.querySelector("img");
          image.addEventListener("load", () => {
            window.print();
          });
        </script>
      </body>
    </html>`);
  printWindow.document.close();
}

async function buildPrintableCanvas() {
  const canvas = document.createElement("canvas");
  canvas.width = CANVAS_WIDTH;
  canvas.height = CANVAS_HEIGHT;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Your browser could not create the print canvas.");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const cellWidth = canvas.width / 4;
  const cellHeight = canvas.height / 2;

  const loadedImages = await Promise.all(
    state.pages.map((page) => (page ? loadImage(page.url) : Promise.resolve(null)))
  );

  PRINT_LAYOUT.forEach((pageNumber, layoutIndex) => {
    const x = (layoutIndex % 4) * cellWidth;
    const y = layoutIndex < 4 ? 0 : cellHeight;
    const image = loadedImages[pageNumber - 1];

    if (image) {
      drawContainedImage(
        ctx,
        image,
        x,
        y,
        cellWidth,
        cellHeight,
        ROTATED_PAGES.has(pageNumber)
      );
    }

    ctx.strokeStyle = "#a1947c";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, cellWidth, cellHeight);
  });

  ctx.save();
  ctx.strokeStyle = "#6d5f49";
  ctx.lineWidth = 3;
  ctx.setLineDash([18, 16]);
  for (let i = 1; i < 4; i += 1) {
    const x = i * cellWidth;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.moveTo(0, cellHeight);
  ctx.lineTo(canvas.width, cellHeight);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#111111";
  ctx.lineWidth = 10;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(cellWidth, cellHeight);
  ctx.lineTo(cellWidth * 3, cellHeight);
  ctx.stroke();
  ctx.restore();

  ctx.strokeStyle = "#7f725d";
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, canvas.width - 6, canvas.height - 6);

  return canvas;
}

function loadImage(sourceUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Could not load image for export."));
    image.src = sourceUrl;
  });
}

function drawContainedImage(ctx, image, x, y, width, height, rotate = false) {
  const padding = 24;
  const availableWidth = width - padding * 2;
  const availableHeight = height - padding * 2;
  const scale = Math.min(availableWidth / image.width, availableHeight / image.height);
  const drawWidth = image.width * scale;
  const drawHeight = image.height * scale;
  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const offsetX = -drawWidth / 2;
  const offsetY = -drawHeight / 2;

  ctx.save();
  ctx.translate(centerX, centerY);
  if (rotate) {
    ctx.rotate(Math.PI);
  }
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
  ctx.restore();
}
