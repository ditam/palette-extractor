
// VGA, baby!
const WIDTH = 640;
const HEIGHT = 480;

let ctx;

function roundRGB(number, roundTo) {
  const rounded = Math.round(number/roundTo)*roundTo;
  return Math.min(255, rounded);
}

// expects the '<r>,<g>,<b>' format that we use for indexing colorCounter
function getHexColorsFromRGB(concatenatedRGBString) {
  const colors = concatenatedRGBString.split(',');
  let hexCode = '#';
  colors.forEach(colorString => {
    const color = parseInt(colorString, 10);
    if (color < 16) {
      hexCode += '0';
    }
    hexCode += color.toString(16);
  });
  return hexCode;
}

function showTopColors(counter) {
  const resultsContainer = $('#results');
  resultsContainer.empty();
  const entries = Object.entries(counter);
  entries.sort((a,b) => { return a[1] - b[1]; }); // sort ascending
  const top = entries[entries.length -1];
  for (let i = 1; i < 30; i++) {
    if (entries.length === 0) return;
    const color = entries.pop();
    const percentOfTop = color[1] / top[1] * 100;
    const line = $('<div>').addClass('color-line');
    const sample = $('<span>').addClass('color-sample').css({
      'background-color': 'rgb(' + color[0] + ')'
    });
    line.append(sample);
    const label = $('<span>').text(getHexColorsFromRGB(color[0])).addClass('color-label')
    line.append(label);

    // action icons
    const actions = $('<div>').addClass('actions');
    const copyIcon = $('<div>').addClass('icon copy').attr('title', 'Copy color code');
    const swatchIcon = $('<div>').addClass('icon swatch').attr('title', 'Toggle swatch');;
    actions.append(copyIcon);
    actions.append(swatchIcon);
    line.append(actions);

    // percentage visualization
    const percentBar = $('<span>').addClass('color-percent-container');
    const percentValue = $('<span>').addClass('color-percent-bar').css('width', percentOfTop + '%');
    percentValue.appendTo(percentBar);
    percentBar.appendTo(line);

    line.appendTo(resultsContainer);
  }
}

function copyClickHandler(event) {
  const colorLabel = $(this).closest('.color-line').find('.color-label');
  const colorCode = colorLabel.text();
  navigator.clipboard.writeText(colorCode);
  const feedback = $('<span>').addClass('feedback').text('copied');
  feedback.insertAfter(colorLabel);
  feedback.fadeOut(800, () => { feedback.remove(); });
}

const currentSwatches = {};
function swatchClickHandler(event) {
  const colorLabel = $(this).closest('.color-line').find('.color-label');
  const colorCode = colorLabel.text();
  if (colorCode in currentSwatches) {
    delete currentSwatches[colorCode];
    $(this).removeClass('active');
  } else {
    currentSwatches[colorCode] = true;
    $(this).addClass('active');
  }
  renderSwatches(currentSwatches);
}

function renderSwatches(currentSwatches) {
  const container = $('#swatch-container');
  container.empty();
  Object.keys(currentSwatches).forEach((color) => {
    const swatch = $('<div>').addClass('swatch');
    swatch.css('background-color', color);
    swatch.appendTo(container);
  });
}

function clearSwatches() {
  Object.keys(currentSwatches).forEach((key) => { delete currentSwatches[key]; });
  renderSwatches(currentSwatches);
}

const _d = 20; // round color channels to this integer
function processImageData() {
  console.log('processing...');
  const imageData = ctx.getImageData(0, 0, WIDTH, HEIGHT);
  const data = imageData.data;
  const colorCounter = {};
  // see format: https://developer.mozilla.org/en-US/docs/Web/API/ImageData
  for (let i = 0; i < data.length; i += 4) {
    const red = data[i] = data[i];
    const green = data[i + 1] = data[i + 1];
    const blue = data[i + 2] = data[i + 2];
    // NB: we ignore alpha values
    const colorKey = roundRGB(red, _d) + ',' + roundRGB(green, _d) + ',' + roundRGB(blue, _d);

    if (!(colorKey in colorCounter)) {
      colorCounter[colorKey] = 0;
    }
    colorCounter[colorKey] = colorCounter[colorKey] + 1;
  }
  showTopColors(colorCounter);
}

function drawImageFileToCanvas(file) {
  const fileReader = new FileReader();
  fileReader.addEventListener('load', (evt) => {
    const img = new Image();
    img.addEventListener('load', () => {
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
      $('body').removeClass('empty');
      $('#results').empty();
      clearSwatches();
    });
    img.src = evt.target.result;
  });
  fileReader.readAsDataURL(file);
}

function dropHandler(event) {
  // Prevent default behavior (Prevent file from being opened)
  event.preventDefault();

  // more jquery and drop hacks...
  event.dataTransfer = event.originalEvent.dataTransfer;

  let file = null;

  if (event.dataTransfer.items) {
    if (event.dataTransfer.items.length === 0) return;
    if (event.dataTransfer.items[0].kind !== 'file') return;
    file = event.dataTransfer.items[0].getAsFile();
  } else {
    if (event.dataTransfer.files.length === 0) return;
    file = event.dataTransfer.files[0];
  }

  drawImageFileToCanvas(file);
}

function handleImageSelect() {
  if (!this.files || !this.files[0]) return;
  drawImageFileToCanvas(this.files[0]);
}

$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  $('#fileInput').on('change', handleImageSelect);
  $('#runButton').on('click', processImageData);

  const dropZone = $('#drop-zone');
  dropZone.on('dragenter', () => { console.log('ENTER'); });
  dropZone.on('dragleave', () => { console.log('LEAVE'); });
  // we need to cancel dragover to make drop fire... https://stackoverflow.com/q/19223352/4083826
  dropZone.on('dragover', false);
  dropZone.on('drop', dropHandler);
  dropZone.on('click', () => { $('#fileInput').trigger('click'); });

  // delegated event handlers for color line actions
  $('#sidebar').on('click', '.icon.copy', copyClickHandler);
  $('#sidebar').on('click', '.icon.swatch', swatchClickHandler);
});
