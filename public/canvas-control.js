/**
 * Class for managing 2D visualization/interaction for audio demos.
 * @param {Object} canvas
 * @param {Object} elements
 * @param {Function} callbackFunc
 */
function CanvasControl(canvas, listener, callbackFunc) {
  this._canvas = canvas;
  this._elements = [listener];
  this.listener = listener;
  this._callbackFunc = callbackFunc;

  this._context = this._canvas.getContext('2d');
  this._cursorDown = false;

  this._selected = {
    index: -1,
    xOffset: 0,
    yOffset: 0,
  };

  this._lastMoveEventTime = 0;
  this._minimumThreshold = 16;
  
  this._isMoving = false;
  
  
  let that = this;
//   canvas.addEventListener('touchstart', function(event) {
//     that._cursorDownFunc(event);
//   });

//   canvas.addEventListener('mousedown', function(event) {
//     that._cursorDownFunc(event);
//   });

//   canvas.addEventListener('touchmove', function(event) {
//     let currentEventTime = Date.now();
//     if (currentEventTime - that._lastMoveEventTime > that._minimumThreshold) {
//       that._lastMoveEventTime = currentEventTime;
//       if (that._cursorMoveFunc(event)) {
//         event.preventDefault();
//       }
//     }
//   }, true);

  canvas.addEventListener('mousemove', function(event) {
    let currentEventTime = Date.now();
    if (currentEventTime - that._lastMoveEventTime > that._minimumThreshold) {
      that._lastMoveEventTime = currentEventTime;
      that._cursorMoveFunc(event);
    }
  });

  document.addEventListener('touchend', function(event) {
    that._cursorUpFunc(event);
  });

  document.addEventListener('mouseup', function(event) {
    that._cursorUpFunc(event);
  });

  window.addEventListener('resize', function(event) {
    that.resize();
    that.draw();
  }, false);

  this.invokeCallback();
  this.resize();
  this.draw();
}

CanvasControl.prototype.invokeCallback = function() {
  if (this._callbackFunc !== undefined) {
    this._callbackFunc(this._elements);
  }
};

CanvasControl.prototype.resize = function() {
  let canvasWidth = this._canvas.parentNode.clientWidth;
  if (canvasWidth > MAX_CANVAS_WIDTH) {
    canvasWidth = MAX_CANVAS_WIDTH;
  }
  this._canvas.width = canvasWidth;
  this._canvas.height = canvasWidth * MAX_CANVAS_HEIGHT / MAX_CANVAS_WIDTH;
};

CanvasControl.prototype.draw = function() {
  this._context.globalAlpha = 1;
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);

  this._context.lineWidth = 5;
  this._context.strokeStyle = '#bbb';
  this._context.strokeRect(0, 0, this._canvas.width, this._canvas.height);

  for (let i = 0; i < this._elements.length; i++) {
    const icon = this._elements[i].icon;
    const isPerson = this._elements[i].isPerson;

    if (icon) {
      const width = this._elements[i].width * this._canvas.width / MAX_CANVAS_WIDTH;
      const height = this._elements[i].height * this._canvas.height / MAX_CANVAS_HEIGHT;
      const xCenter = this._elements[i].position.x / MAX_CANVAS_WIDTH * this._canvas.width;
      const yCenter = this._elements[i].position.y / MAX_CANVAS_HEIGHT * this._canvas.height;
      this._context.globalAlpha = this._elements[i].alpha;
      // Matrix transformation
      this._context.translate(xCenter, yCenter);
      this._context.rotate(this._elements[i].rotation * Math.PI / 180);

      if (isPerson) {
        const outline = new Path2D();
        const fill = new Path2D();
        const radius = (width + height) / 4;
        const text = icon.text;
        const maxTextWidth = radius * 1;
        let fontSize = Math.floor(maxTextWidth);
        const oriLineWidth = this._context.lineWidth;
        const oriStrokeStyle = this._context.strokeStyle;
        const oriFillStyle = this._context.fillStyle;
        const oriFont = this._context.font;
        const oriTextAlign = this._context.textAlign;
        const oriTextBaseline = this._context.textBaseline;

        // draw person icon
        this._context.lineWidth = radius * 0.1;
        this._context.strokeStyle = icon.outlineColor;
        this._context.fillStyle = icon.fillColor;

        fill.arc(0, 0, radius, 0, 2 * Math.PI);
        outline.arc(0, 0, radius, 0, 2 * Math.PI);
        
        this._context.fill(fill);
        this._context.stroke(outline);

        // draw text
        // text width check
        this._context.font = 'bold ' + fontSize + 'px ' + PRIMARY_FONT;
        const oriTextWidth = this._context.measureText(text).width;
        if (oriTextWidth > maxTextWidth) {
          fontSize = Math.floor(fontSize * maxTextWidth / oriTextWidth);
          this._context.font = 'bold ' + fontSize + 'px ' + PRIMARY_FONT;
        }
        this._context.globalAlpha = 1;
        this._context.fillStyle = PERSON_ICON_TEXT_COLOR;
        this._context.textAlign = 'center';
        this._context.textBaseline = 'middle';
        this._context.fillText(text, 0, 0);

        this._context.lineWidth = oriLineWidth;
        this._context.strokeStyle = oriStrokeStyle;
        this._context.fillStyle = oriFillStyle;

        this._context.font = oriFont;
        this._context.textAlign = oriTextAlign;
        this._context.textBaseline = oriTextBaseline;
      } else {
        this._context.drawImage(
          icon, -width / 2, -height / 2,  width, height
        );
      }
      
      // rotate back
      this._context.rotate(-this._elements[i].rotation * Math.PI / 180);
      this._context.translate(-xCenter, -yCenter);
    }
  }
};

CanvasControl.prototype.getCursorPosition = function(event) {
  let cursorX;
  let cursorY;
  let rect = this._canvas.getBoundingClientRect();
  if (event.touches !== undefined) {
    cursorX = event.touches[0].clientX;
    cursorY = event.touches[0].clientY;
  } else {
    cursorX = event.clientX;
    cursorY = event.clientY;
  }
  return {
    x: cursorX - rect.left,
    y: cursorY - rect.top,
  };
};

CanvasControl.prototype.getNearestElement = function(cursorPosition) {
  let minDistance = 1e8;
  let element;
  let x = 0;
  let y = 0;
  
  for (let i = 0; i < this._elements.length; i++) {
    if (this._elements[i].clickable == true) {
      let dx = this._elements[i].position.x / MAX_CANVAS_WIDTH * this._canvas.width - cursorPosition.x;
      let dy = this._elements[i].position.y / MAX_CANVAS_HEIGHT * this._canvas.height - cursorPosition.y;
      let distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance.
      if ( // todo: problem arise when rotation performed. consider determining whether pointer is in rotated bounding rectangle
        distance < minDistance
        && Math.abs(dx) < this._elements[i].width / 2
        && Math.abs(dy) < this._elements[i].height / 2
      ) {
        minDistance = distance;
        element = this._elements[i];
      }
    }
  }
  return element;
};


CanvasControl.prototype.addElement = function(element) {
  this._elements.push(element);
  this._elements.sort((a, b) => {
    return a.layer - b.layer;
  });
  this.invokeCallback();
  this.draw();
}

CanvasControl.prototype.addElements = function(elements) {
  elements.forEach(element => {
    this._elements.push(element);
  });
  this._elements.sort((a, b) => {
    return a.layer - b.layer;
  });
  this.invokeCallback();
  this.draw();
}

CanvasControl.prototype._cursorMoveFunc = function(event) {
  let cursorPosition = this.getCursorPosition(event);
  let nearestElement = this.getNearestElement(cursorPosition);
  
  if (nearestElement) {
    this._canvas.style.cursor = 'pointer';
    return true;
  } else {
    this._canvas.style.cursor = 'default';
    return false;
  }
};

CanvasControl.prototype._cursorUpFunc = function(event) {
  let cursorPosition = this.getCursorPosition(event);
  let nearestElement = this.getNearestElement(cursorPosition);
  
  const moveStepSize = 1;

  

  if (nearestElement) {
    const startMoving = () => {
      this.listener.playIntermittentSound('foot-step');
      let moveInterval = setInterval(() => {
        _isMoving = true;
        if (Math.abs(nearestElement.position.x - this.listener.position.x) > moveStepSize) {
          if (nearestElement.position.x > this.listener.position.x) {
            this.listener.position.x += moveStepSize;
          } else {
            this.listener.position.x -= moveStepSize;
          }
        } else if (Math.abs(nearestElement.position.y - this.listener.position.y) > moveStepSize) {
          if (nearestElement.position.y > this.listener.position.y) {
            this.listener.position.y += moveStepSize;
          } else {
            this.listener.position.y -= moveStepSize;
          }
        } else {
          this.listener.position.x = nearestElement.position.x;
          this.listener.position.y = nearestElement.position.y;
          _isMoving = false;
          this.listener.stopIntermittentSound('foot-step');
          this.listener.occupiedChair = nearestElement;
          nearestElement.playSound('chair-slide');
          clearInterval(moveInterval);
        }
        this.invokeCallback();
        this.draw();
        
      }, 20);
    }

    if (this.listener.occupiedChair) {
      this.listener.occupiedChair.playSound('chair-slide');
      setTimeout(() => {
        startMoving();
      }, 1500);
    } else {
      startMoving();
    }
  }
};

CanvasControl.prototype._moveElement = function(element, position) {
  
};

// old methods for reference
// CanvasControl.prototype._cursorUpdateFunc = function(cursorPosition) {
//   if (this._selected.index > -1) {
//     this._elements[this._selected.index].x = Math.max(0, Math.min(1,
//       (cursorPosition.x + this._selected.xOffset) / this._canvas.width));
//     this._elements[this._selected.index].y = Math.max(0, Math.min(1,
//       (cursorPosition.y + this._selected.yOffset) / this._canvas.height));
//     this.invokeCallback();
//   }
//   this.draw();
// };

// CanvasControl.prototype._cursorDownFunc = function(event) {
//   this._cursorDown = true;
//   let cursorPosition = this.getCursorPosition(event);
//   this._selected = this.getNearestElement(cursorPosition);
//   this._cursorUpdateFunc(cursorPosition);
//   document.body.style = 'overflow: hidden;';
// };

// CanvasControl.prototype._cursorUpFunc = function(event) {
//   this._cursorDown = false;
//   this._selected.index = -1;
//   document.body.style = '';
// };

// CanvasControl.prototype._cursorMoveFunc = function(event) {
//   let cursorPosition = this.getCursorPosition(event);
//   let selection = this.getNearestElement(cursorPosition);
//   if (this._cursorDown == true) {
//     this._cursorUpdateFunc(cursorPosition);
//   }
//   if (selection.index > -1) {
//     this._canvas.style.cursor = 'pointer';
//     return true;
//   } else {
//     this._canvas.style.cursor = 'default';
//     return false;
//   }
// };