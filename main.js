
const WIDTH = 320;
const HEIGHT = 200;

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
    const sample = $('<span>').css({
      'display': 'inline-block',
      'width': '25px',
      'height': '25px',
      'background-color': 'rgb(' + color[0] + ')'
    });
    line.append(sample);
    const label = $('<span>').text(`${color[1]} (${color[0]})`).css({
      display: 'inline-block',
      width: '150px',
      padding: '0 5px'
    });
    line.append(label);

    // percentage visualization
    const percentBar = $('<span>').css({display: 'inline-block', width: '300px', height: '5px'});
    const percentValue = $('<span>').css({display: 'inline-block', width: percentOfTop + '%', height: '5px', 'background-color': 'grey'});
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

function readImage() {
  if (!this.files || !this.files[0]) return;

  const fileReader = new FileReader();
  fileReader.addEventListener('load', (evt) => {
    const img = new Image();
    img.addEventListener('load', () => {
      console.log('img loaded')
      ctx.clearRect(0, 0, WIDTH, HEIGHT);
      ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);
    });
    img.src = evt.target.result;
  });
  fileReader.readAsDataURL(this.files[0]);
}

$(document).ready(function() {
  const canvas = document.getElementById('main-canvas');
  $(canvas).attr('height', HEIGHT);
  $(canvas).attr('width', WIDTH);

  ctx = canvas.getContext('2d');

  $('#fileInput').on('change', readImage);
  $('#runButton').on('click', processImageData);
});
