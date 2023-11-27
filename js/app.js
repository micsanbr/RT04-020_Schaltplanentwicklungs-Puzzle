
////////////////////////////////////////////////////////////////
const svgContainerId = 'svg-container';
const svgViewportId = 'svg-viewport';
const svgLibraryCardsAId = 'svg-library-cards-a';
const svgLibraryCardsBId = 'svg-library-cards-b';
const svgViewportBoundsId = 'bounds';
const modalLibraryCardsAId = 'modal-library-cards-a';
const modalLibraryCardsBId = 'modal-library-cards-b';
const svgConnectionLinesId = 'connection-lines';

////////////////////////////////////////////////////////////////
// Pan - Zoom
// https://github.com/timmywil/panzoom
const panzoomOptions = {
  minScale: 1,
  maxScale: 3,
  step: 0.25,
  contain: 'outside',
};

// Animation size
window.devicePixelRatio = window.devicePixelRatio || window.screen.deviceXDPI / window.screen.logicalXDPI;
const desiredWidth = 1280;
const desiredHeight = 640;
const headerHeight = 81; // including 1px border
var desiredAspectRatio = desiredWidth / desiredHeight;
var svgFitScaling = 1;

// Types
const SELECTION_TYPE_CARD = 'CARD';
const SELECTION_TYPE_DROP_ZONE = 'DROP_ZONE';
// Cards
const cardsA = '#card-a-1, #card-a-2, #card-a-3, #card-a-4, #card-a-5, #card-a-6';
const cardsB = '#card-b-1, #card-b-2, #card-b-3, #card-b-4, #card-b-5, #card-b-6, #card-b-7, #card-b-8, #card-b-9, #card-b-10, #card-b-11';
// Drop zones
const dropZonesA = '#drop-zone-a-1, #drop-zone-a-2, #drop-zone-a-3, #drop-zone-a-4, #drop-zone-a-5, #drop-zone-a-6';
const dropZonesB = '#drop-zone-b-1, #drop-zone-b-2, #drop-zone-b-3, #drop-zone-b-4, #drop-zone-b-5, #drop-zone-b-6, #drop-zone-b-7, #drop-zone-b-8, #drop-zone-b-9, #drop-zone-b-10, #drop-zone-b-11, #drop-zone-b-12, #drop-zone-b-13, #drop-zone-b-14, #drop-zone-b-15, #drop-zone-b-16, #drop-zone-b-17, #drop-zone-b-18';

////////////////////////////////////////////////////////////////
// App Init, Everything loaded including media files
// http://api.jquery.com/load-event
$(window).on('load', function () {
  applyCssStyleToSvg(svgLibraryCardsAId);
  applyCssStyleToSvg(svgLibraryCardsBId);
  applyCssStyleToSvg(svgViewportId);
  initApplication();
  initAnimation();
});

////////////////////////////////////////////////////////////////
// App Init, DOM loaded
$(document).ready(function () { });

////////////////////////////////////////////////////////////////
// Variables
var panzoom;
var svgViewport;

var lineMode = false;
var polylines = [];

var activeCard = null;
var activeDropZone = null;

function initApplication() {
  // Get the SVG viewport
  svgViewport = document.querySelector('#' + svgViewportId);
  // Create a Panzoom 
  panzoom = Panzoom(svgViewport, panzoomOptions);

  // Buttons
  $('#zoom-out button').attr('disabled', 'disabled');

  $('#line-mode').click(function (e) {
    toggleLineMode();
  });

  $('#confirm-line').click(function (e) {
    completeLine();
    beginLine();
  });

  $('#delete-line').click(function (e) {
    deleteLine();
  });

  $('#reload').click(function (e) {
    location.reload();
  });

  $('#save-image').click(function (e) {
    saveImage();
  });

  $('#zoom-in').click(function (e) {
    panzoom.zoomIn();
  });

  $('#zoom-out').click(function (e) {
    panzoom.zoomOut();
  });

  // Disable document zoom on iOS
  // This is a bit dirty but unfortunately required because Apple decided
  // to ignore "user-scalable=no" in the meta tag "viewport" for accessibility reasons
  document.addEventListener('gesturestart', function (e) {
    e.preventDefault();
  });

  // On zoom
  svgViewport.parentElement.addEventListener('wheel', panzoom.zoomWithWheel);

  svgViewport.addEventListener('panzoomzoom', (event) => {
    updateZoomButtons();
  })

  var updateAspectRatio = function () {
    // Get the window size minus header and footer
    var viewportWidth = window.innerWidth;
    var viewportHeight = window.innerHeight - headerHeight;

    // Scale to fit viewport
    var desiredWidthRatio = viewportWidth / desiredWidth;
    var desiredHeightRatio = viewportHeight / desiredHeight;
    svgFitScaling = Math.min(desiredWidthRatio, desiredHeightRatio);
    var scaledWidth = desiredWidth * svgFitScaling;
    var scaledHeight = desiredHeight * svgFitScaling;

    // Enforce aspect ratio using scaled size
    var aspectRatio = scaledWidth / scaledHeight;
    var w = scaledWidth;
    var h = scaledHeight;

    if (aspectRatio < 1) {
      w = scaledWidth;
      h = scaledWidth / desiredAspectRatio;
    } else {
      w = scaledHeight * desiredAspectRatio;
      h = scaledHeight;
    }

    // Get the offsets
    var offsetLeft = (viewportWidth - w) / 2;
    var offsetTop = (viewportHeight - h) / 2;
    var offsetRight = (viewportWidth - w) / 2;
    var offsetBottom = (viewportHeight - h) / 2;
    var letterBoxOrPillarBox = '-';
    if (offsetLeft > 1) {
      letterBoxOrPillarBox = 'Pillarbox';
    } else if (offsetTop > 1) {
      letterBoxOrPillarBox = 'Letterbox';
    }

    // Apply to elements
    var svgWidth = w + 'px';
    var svgHeight = h + 'px';
    var margin = offsetTop + 'px ' + offsetRight + 'px ' + offsetBottom + 'px ' + offsetLeft + 'px';

    // console.log({ width: svgWidth, height: svgHeight, margin: margin, letterBoxOrPillarBox: letterBoxOrPillarBox });

    $('#' + svgContainerId).css({ width: svgWidth, height: svgHeight, margin: margin });
    $('#' + svgViewportId).attr({ width: svgWidth, height: svgHeight });
  }

  window.onresize = updateAspectRatio;
  updateAspectRatio();
}

// Transfer css styles to svg elements directly
function applyCssStyleToSvg(svgId) {
  // Get the CSS Style tag automatically created by Adobe Illustrator that contains .st0 .st1 .st2 etc.
  var $svgStyle = $('#' + svgId + ' style');
  var svgStyleText = $svgStyle.text();
  svgStyleText = svgStyleText.replace(/\s+/g, ' ');
  $svgStyle.remove();

  // Parse the styles
  var styleRules = svgStyleText.split(' }').map((element) => {
    var a = element.split(' { ');
    a[0] = a[0].substring(a[0].indexOf('.') + 1);
    return a;
  });

  // Get the SVG's html code
  var $svg = $('#' + svgId);
  var svgText = $svg.prop('outerHTML');

  // Replace the class attributes with style attributes
  styleRules.forEach((element) => {
    svgText = svgText.replaceAll('class="' + element[0] + '"', 'style="' + element[1] + '"');
  });

  // Replace the svg with the modified one
  $svg.replaceWith(svgText);
}

function initAnimation() {
  $('#' + svgViewportId + ' #' + svgViewportBoundsId).click(function (e) { deselectAll(); })
  $(cardsA).click(function (e) { selectCard(e); });
  $(cardsB).click(function (e) { selectCard(e); });
  $(dropZonesA).click(function (e) { selectDropZone(e); });
  $(dropZonesB).click(function (e) { selectDropZone(e); });

  // Add point to line
  $('#' + svgViewportId).click(function (e) {
    if (!lineMode) {
      return;
    }

    if (polylines.length > 0) {
      // Get the last polyline
      var polyline = polylines[polylines.length - 1];

      // Create a new point
      var point = svgViewport.createSVGPoint();

      // console.log(e);
      point.x = e.pageX;
      point.y = e.pageY;
      // Thank you Apple as usual!
      // https://bugs.webkit.org/show_bug.cgi?id=209220
      // Ancestor transform matrix propagation is broken on iOS so ... let's calculate the SVG 2D matrix manually!
      // var transformMatrix = svgViewport.getScreenCTM().inverse();
      // console.log(transformMatrix);
      var transformMatrix = svgViewport.createSVGMatrix();
      var svgPosition = $('#' + svgViewportId).position();
      var zoomFitScaling = 1.0 / (svgFitScaling * panzoom.getScale());
      transformMatrix.a = zoomFitScaling;
      transformMatrix.b = 0;
      transformMatrix.c = 0;
      transformMatrix.d = zoomFitScaling;
      transformMatrix.e = -svgPosition.left * zoomFitScaling;
      transformMatrix.f = -svgPosition.top * zoomFitScaling;
      // console.log(transformMatrix);
      // Transform point
      point = point.matrixTransform(transformMatrix);
      // console.log(point);
      // Get the number of points of the current polyline
      var pointCount = polyline.points.length / 2;
      // Snap new point to the previous point
      if (pointCount > 0) {
        var previousPoint = svgViewport.createSVGPoint();
        var previousPointIndex = pointCount - 1;
        previousPoint.x = polyline.points[previousPointIndex * 2 + 0];
        previousPoint.y = polyline.points[previousPointIndex * 2 + 1];
        point = snapPointToPreviousPoint(point, previousPoint);
      }
      // Push the point on the current polyline
      polyline.points.push(point.x);
      polyline.points.push(point.y);
      if (polyline.points.length >= 4) { // 4 coordinates = 2 points
        $('#confirm-line button').removeAttr('disabled');
      } else {
        $('#confirm-line button').attr('disabled', 'disabled');
      }
    }
    // Render
    updateSvgPolylines();
  });
}

function snapPointToPreviousPoint(point, previousPoint) {
  var snappedPoint = svgViewport.createSVGPoint();
  snappedPoint.x = point.x;
  snappedPoint.y = point.y;

  var dx = Math.abs(point.x - previousPoint.x);
  var dy = Math.abs(point.y - previousPoint.y);

  if (dx > dy) {
    snappedPoint.y = previousPoint.y;
  } else if (dy > dx) {
    snappedPoint.x = previousPoint.x;
  }

  return snappedPoint;
}

function selectCard(e) {
  if (lineMode) { return; }
  // Return card to original position
  if (activeCard == e.currentTarget) {
    if (activeCard.id.indexOf('-a-') != -1) {
      $(activeCard).appendTo('#' + svgLibraryCardsAId);
    } else if (activeCard.id.indexOf('-b-') != -1) {
      $(activeCard).appendTo('#' + svgLibraryCardsBId);
    }
    $(activeCard).attr('transform', 'translate(0, 0)');
  }
  activeCard = toggleSelection(activeCard, e.currentTarget, SELECTION_TYPE_CARD);
  placeCards();
}

function selectDropZone(e) {
  if (lineMode) { return; }
  activeDropZone = toggleSelection(activeDropZone, e.currentTarget, SELECTION_TYPE_DROP_ZONE);
  if (activeDropZone != null) {
    if (activeDropZone.id.indexOf('-a-') != -1) {
      $('#' + modalLibraryCardsAId).moduleModal('open');
    } else if (activeDropZone.id.indexOf('-b-') != -1) {
      $('#' + modalLibraryCardsBId).moduleModal('open');
    }
  }
  placeCards();
}

function toggleSelection(activeElement, currentTarget, selectionType) {
  if (activeElement == null) {
    // No previous selection
    activeElement = currentTarget;
    $(activeElement).addClass('active');
  } else if (activeElement == currentTarget) {
    // Deselect previous selection
    $(activeElement).removeClass('active');
    activeElement = null;
  } else {
    // Deselect previous selection, select new target
    $(activeElement).removeClass('active');
    activeElement = currentTarget;
    $(activeElement).addClass('active');
  }
  return activeElement;
}

function deselectAll() {
  $(activeCard).removeClass('active');
  activeCard = null;
  $(activeDropZone).removeClass('active');
  activeDropZone = null;
}

function placeCards() {
  if (activeCard != null && activeDropZone != null) {
    var activeCardType = activeCard.id.split('-')[1];
    var activeDropZoneType = activeDropZone.id.split('-')[2];
    if (activeCardType == activeDropZoneType) {
      var dragZone = $(activeCard).find('rect').first();
      var dropZone = $(activeDropZone).find('rect').first();
      var dx = $(dropZone).attr('x') - $(dragZone).attr('x');
      var dy = $(dropZone).attr('y') - $(dragZone).attr('y');
      $(activeCard).insertBefore('#' + svgConnectionLinesId); // Insert the card before the connection lines so the saved image will be rendered correctly
      $(activeCard).attr('transform', 'translate(' + dx + ', ' + dy + ')');
      deselectAll();
      // Close library modals
      $('#' + modalLibraryCardsAId).moduleModal('close');
      $('#' + modalLibraryCardsBId).moduleModal('close');
    }
  }
}

function triggerDownload(imgURI, filename) {
  var e = new MouseEvent('click', {
    view: window,
    bubbles: false,
    cancelable: true
  });

  var a = document.createElement('a');
  a.setAttribute('download', filename);
  a.setAttribute('href', imgURI);
  a.setAttribute('target', '_blank');

  a.dispatchEvent(e);
}

function saveImage() {
  // Create an offscreen canvas
  var canvas = document.createElement('canvas');
  canvas.width = desiredWidth;
  canvas.height = desiredHeight;
  canvas.style.width = desiredWidth;
  canvas.style.height = desiredHeight;

  // Render the svg on the canvas
  var svgData = new XMLSerializer().serializeToString(svgViewport);
  svgData = svgData.substring(svgData.indexOf('>'));
  svgData = '<svg xmlns="http://www.w3.org/2000/svg" id="' + svgViewportId + '" viewBox="0 0 ' + desiredWidth + ' ' + desiredHeight + '" preserveAspectRatio="xMidYMid" x="0" y="0" width="' + desiredWidth + 'px" height="' + desiredHeight + 'px"\n' + svgData;

  var ctx = canvas.getContext('2d');
  var DOMURL = window.URL || window.webkitURL || window;

  var img = new Image();
  var svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  var url = DOMURL.createObjectURL(svgBlob);

  img.onload = function () {
    ctx.drawImage(img, 0, 0, desiredWidth, desiredHeight);
    DOMURL.revokeObjectURL(url);

    var imgURI = canvas
      .toDataURL('image/jpeg')
      .replace('image/jpeg', 'image/octet-stream');

    var filename = $('header.module-header .header-top .product-name').text().trim().replaceAll(' ', '-') + '.jpg';
    triggerDownload(imgURI, filename);
  };

  img.src = url;
}

function updateZoomButtons() {
  // console.log(event.detail);
  var z = panzoom.getScale();
  if (z < panzoomOptions.maxScale - 0.0001 && !lineMode) {
    $('#zoom-in button').removeAttr('disabled');
  } else {
    $('#zoom-in button').attr('disabled', 'disabled');
  }
  if (z > panzoomOptions.minScale + 0.0001 && !lineMode) {
    $('#zoom-out button').removeAttr('disabled');
  } else {
    $('#zoom-out button').attr('disabled', 'disabled');
  }
}

function beginLine() {
  panzoom.setOptions({ disablePan: true, disableZoom: true, cursor: 'default' });
  updateZoomButtons();

  polylines.push({ points: [], inProgress: true });

  console.log('Polyline ' + polylines.length + ' started.');
}

function completeLine() {
  $('#confirm-line button').attr('disabled', 'disabled');
  panzoom.setOptions({ disablePan: false, disableZoom: false, cursor: 'move' });
  updateZoomButtons();

  console.log('Polyline ' + polylines.length + ' completed.');

  // Remove polyline with less than 2 points
  if (polylines.length > 0) {
    var polyline = polylines[polylines.length - 1];
    polyline.inProgress = false;
    if (polyline.points.length < 4) { // 4 coordinates = 2 points
      console.log('Polyline ' + polylines.length + ' has less than 2 points --> deleted.');
      polylines.pop();
    }
  }

  // update and render
  updateSvgPolylines();
}

function toggleLineMode() {
  lineMode = !lineMode;

  if (lineMode) {
    deselectAll();
    $('#line-mode').addClass('active');
    beginLine();
  } else {
    $('#line-mode').removeClass('active');
    completeLine();
  }
}

function deleteLine() {
  if (lineMode) {
    toggleLineMode()
  }
  polylines.pop();
  updateSvgPolylines();
}

function updateSvgPolylines() {
  var $connectionLines = $('#' + svgConnectionLinesId);
  $connectionLines.empty();

  for (var i = 0; i < polylines.length; i++) {
    var polyline = polylines[i];
    var polylineStyle = (polyline.inProgress)
      ? 'stroke:#666666; stroke-width:1; stroke-dasharray:5.5; fill:none;'
      : 'stroke:#333333; stroke-width:1; fill:none;'
    var svgLine = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    svgLine.setAttribute('id', 'polyline' + i);
    svgLine.setAttribute('points', polyline.points.join(','));
    svgLine.setAttribute('style', polylineStyle);
    $connectionLines.append(svgLine);
  }

  if (polylines.length > 0) {
    $('#delete-line button').removeAttr('disabled');
  } else {
    $('#delete-line button').attr('disabled', 'disabled');
  }
}
