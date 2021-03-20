
const WIDTH = 640;
const HEIGHT = 480;

let ctx;

function roundTo(number, roundTo) {
  return Math.round(number/roundTo)*roundTo;
}

function showTopColors(counter) {
  const resultsContainer = $('#results');
  resultsContainer.empty();
  const entries = Object.entries(counter);
  entries.sort((a,b) => { return a[1] - b[1]; }); // sort ascending
  const top = entries[entries.length -1];
  for (let i = 1; i < 20; i++) {
    const color = entries.pop();
    const percentOfTop = color[1] / top[1] * 100;
    const line = $('<div>');
    const sample = $('<span>').addClass('color-sample').css({
      'background-color': 'rgb(' + color[0] + ')'
    });
    line.append(sample);
    const label = $('<span>').text(`${color[1]} (${color[0]})`).addClass('color-label')
    line.append(label);

    // percentage visualization
    const percentBar = $('<span>').addClass('color-percent-container');
    const percentValue = $('<span>').addClass('color-percent-bar').css('width', percentOfTop + '%');
    percentValue.appendTo(percentBar);
    percentBar.appendTo(line);

    line.appendTo(resultsContainer);
  }
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
    const colorKey = roundTo(red, _d) + ',' + roundTo(green, _d) + ',' + roundTo(blue, _d);

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

  const dropZone = $('#drop_zone');
  dropZone.on('dragenter', () => { console.log('ENTER'); });
  dropZone.on('dragleave', () => { console.log('LEAVE'); });
  // you need to cancel dragover to make drag fire... https://stackoverflow.com/q/19223352/4083826
  dropZone.on('dragover', false);
  dropZone.on('drop', dropHandler);
  dropZone.on('click', () => { $('#fileInput').trigger('click'); });
});
