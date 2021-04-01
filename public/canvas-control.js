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

  resizeFunc = function(event) {
    that.resize();
    that.draw();
  }
  window.addEventListener('resize', resizeFunc, false);

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

  this._context.fillStyle = "#848EA7";
  this._context.fillRect(0, 0, this._canvas.width, this._canvas.height);

  this._context.lineWidth = 5;
  this._context.strokeStyle = '#bbb';
  this._context.strokeRect(0, 0, this._canvas.width, this._canvas.height);

  for (let i = 0; i < this._elements.length; i++) {
    const icon = this._elements[i].icon;
    const isPerson = this._elements[i].constructor.name === 'Person';

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
        const isListener = this._elements[i].isListener;
        const outline = new Path2D();
        const fill = new Path2D();
        const radius = (width + height) / 4;
        const text = icon.text;
        const maxTextWidth = radius * 0.8;
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

        // draw direction arrow
        if (isListener) {
          this._context.rotate(this._elements[i].orientation * Math.PI / 180);
          this._context.beginPath();
          this._context.moveTo(0, -radius * 2);
          this._context.lineTo(radius * 0.4, -radius * 1.2);
          this._context.lineTo(-radius * 0.4, -radius * 1.2);
          this._context.fill();
          this._context.rotate(-this._elements[i].orientation * Math.PI / 180);
        }

        // draw text
        // text width check
        this._context.font = 'bold ' + fontSize + 'px ' + PRIMARY_FONT;
        // text width checking
        // const oriTextWidth = this._context.measureText(text).width;
        // if (oriTextWidth > maxTextWidth) {
        //   fontSize = Math.floor(fontSize * maxTextWidth / oriTextWidth);
        //   this._context.font = 'bold ' + fontSize + 'px ' + PRIMARY_FONT;
        // }
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
  if (event.touches && event.touches.length) {
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

CanvasControl.prototype.toRealUnit = function(pos, numerator, denominator) {
  return pos * numerator / denominator;
}
CanvasControl.prototype.toRealWidth = function(pos) {
  return this.toRealUnit(pos, this._canvas.width, MAX_CANVAS_WIDTH);
}
CanvasControl.prototype.toRealHeight = function(pos) {
  return this.toRealUnit(pos, this._canvas.height, MAX_CANVAS_HEIGHT);
}

CanvasControl.prototype.toSystemUnit = function(pos, numerator, denominator) {
  return pos * numerator / denominator;
}
CanvasControl.prototype.toSystemWidth = function(pos) {
  return this.toSystemUnit(pos, MAX_CANVAS_WIDTH, this._canvas.width);
}
CanvasControl.prototype.toSystemHeight = function(pos) {
  return this.toSystemUnit(pos, MAX_CANVAS_HEIGHT, this._canvas.height);
}

CanvasControl.prototype.getNearestElement = function(cursorPosition) {
  let minDistance = 1e8;
  let element;
  let x = 0;
  let y = 0;

  for (let i = 0; i < this._elements.length; i++) {
    if (this._elements[i].clickable == true) {
      let dx = this.toRealWidth(this._elements[i].position.x) - cursorPosition.x;
      let dy = this.toRealHeight(this._elements[i].position.y) - cursorPosition.y;
      let distance = Math.abs(dx) + Math.abs(dy); // Manhattan distance.
      if ( // todo: problem arise when rotation performed. consider determining whether pointer is in rotated bounding rectangle
        distance < minDistance
        && Math.abs(dx) < this.toRealWidth(this._elements[i].width / 2)
        && Math.abs(dy) < this.toRealHeight(this._elements[i].height / 2)
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

CanvasControl.prototype.removeElement = function(id) {
  for (let i = 0; i < this._elements.length; i++) {
    const element = this._elements[i];
    if (element.id === id) {
      element.pauseAllSounds();
      this._elements.splice(i, 1);
      if (element.isListener) {
        this.listener = null;
      }
      break;
    }
  }
  this.invokeCallback();
  this.draw();
}

CanvasControl.prototype._cursorMoveFunc = function(event) {
  let cursorPosition = this.getCursorPosition(event);
  let nearestElement = this.getNearestElement(cursorPosition);
  
  if (
    nearestElement
    && (
      (
        nearestElement.state === ELEMENT_STATE.AVAILABLE
        && this.listener.state !== ELEMENT_STATE.PREPARING_TO_GO
        && this.listener.state !== ELEMENT_STATE.PREPARING_WORK
      )
      || nearestElement.constructor.name === 'Door'
    )
  ) {
    this._canvas.style.cursor = 'pointer';
    return true;
  } else {
    this._canvas.style.cursor = 'default';
    return false;
  }
};

CanvasControl.prototype.useElement = function(actor, selectedElement) {
  if (selectedElement.constructor.name === 'Chair') {
    actor.setState(ELEMENT_STATE.PREPARING_WORK);
    if (actor.habbits.moveOnChair) {
      selectedElement.enableMovingCreak();
    }
    if (actor.habbits.chairSlideSound) {
      selectedElement.selectedSlideSound = actor.habbits.chairSlideSound;
    }
    
    selectedElement.setState(ELEMENT_STATE.IN_USE);
  } else if (selectedElement.constructor.name === 'Door') {
    actor.setState(ELEMENT_STATE.IDLE);
    selectedElement.selectedDoorSound = actor.habbits.doorOpenCloseSound;
    selectedElement.setState(ELEMENT_STATE.IN_USE);
    
    delete personMap[actor.id];
    this.removeElement(actor.id);
    if (actor === this.listener) { // user exits room
      listenerInRoom = !listenerInRoom;
      if (!listenerInRoom) {
        setTimeout(() => { // wait for door close
          changePage(pages.setup);
        }, 3000) 
      }
    }
  }
}

CanvasControl.prototype.enterDoor = function(actor, door) {
  if (door.constructor.name === 'Door') {
    if (actor === this.listener) { // user exits room
      listenerInRoom = !listenerInRoom;
    }
    door.selectedDoorSound = actor.habbits.doorOpenCloseSound;
    door.setState(ELEMENT_STATE.IN_USE);
  }
}

// this function directly adds to the array: wayPoints
CanvasControl.prototype.getWayPoints = function(startPos, endPos, wayPoints) {
  // go from end position to start position and try to avoid obstacles
  const delX = startPos.x - endPos.x;
  const delY = startPos.y - endPos.y;
  const delSq = delX * delX + delY * delY;
  const reduceFactor = Math.sqrt(delSq);
  const stepDelX = delX / reduceFactor * PERSON_SIZE;
  const stepDelY = delY / reduceFactor * PERSON_SIZE;
  let curPos = {...endPos};

  while ((startPos.x - curPos.x) * delX > 0 || (startPos.y - curPos.y) * delY > 0) { // move towards target until hitting a barrier
    const radiusVector = getRadiusVector(curPos);
    if (radiusVector) {
      const tanVector = {x: radiusVector.y, y: -radiusVector.x};
      const direction = stepDelX * tanVector.x + stepDelY * tanVector.y < 0 ? -1 : 1;
      while (getRadiusVector(curPos)) { // move until out of circle 
        curPos.x += tanVector.x * direction;
        curPos.y += tanVector.y * direction;
      }
      // add to way point
      wayPoints.push(curPos);
      this.getWayPoints(startPos, curPos, wayPoints);
      return;
    }
    curPos.x = curPos.x + stepDelX;
    curPos.y = curPos.y + stepDelY;
  }

  // no barrier hit until reaching destination
  // do nothing
}
function getRadiusVector(position) {
  for (const key in clusters) {
    let radius = clusters[key].tableType === 'round' ? ROUND_TABLE_SIZE / 2 : Math.max(TABLE_WIDTH, TABLE_LENGTH) / 2;
    radius += 1.5 * CHAIR_LENGTH + 0.5 * PERSON_SIZE;
    if (isWithinDist(clusters[key].position, position, radius)) {
      const delX = position.x - clusters[key].position.x;
      const delY = position.y - clusters[key].position.y;
      const delSq = delX * delX + delY * delY;
      const reduceFactor = Math.sqrt(delSq);

      return {x: delX / reduceFactor, y: delY / reduceFactor};
    }
  }
  return null;
}
function isWithinDist(pos1, pos2, dist) {
  const delX = pos1.x - pos2.x;
  const delY = pos1.y - pos2.y;
  return delX * delX + delY * delY < dist * dist;
}
function setPersonInCluster (actor, selectedElement) {
  clusters[selectedElement.clusterInfo.id].personSettingsForClusterMap[actor.id] = {
    locationIndex: selectedElement.clusterInfo.index,
    id: actor.id,
    icon: actor.icon,
    personSettings: {
      workSound: actor.audioProfileParams.workSound,
      otherSound: actor.audioProfileParams.otherSound,
      habbits: actor.habbits
    },
    isListener: actor.isListener
  };
}

CanvasControl.prototype.moveToTarget = function(actor, target, callback) {
  const startPos = actor.position;
  const endPos = target.position;
  const wayPoints = [];
  let firstWayPoint;

  // step 1: get out of the circle if seat is in a circle
  const delX = endPos.x - startPos.x;
  const delY = endPos.y - startPos.y;
  let curPos = {...startPos};

  const radiusVector = getRadiusVector(startPos);
  if (radiusVector) {
    const tanVector = {x: radiusVector.y, y: -radiusVector.x};
    const direction = delX * tanVector.x + delY * tanVector.y < 0 ? -1 : 1;
    while (getRadiusVector(curPos)) { // move until out of circle 
      curPos.x += tanVector.x * direction;
      curPos.y += tanVector.y * direction;
    }
    firstWayPoint = curPos;
  }

  // step 2: get all other way points
  this.getWayPoints(curPos, endPos, wayPoints);

  // step 3: push the first way point
  if (firstWayPoint) {
    wayPoints.push(firstWayPoint);
  }

  // step 4: start travelling to way points
  const moveToTarget = () => {
    let targetPos;
    let delX;
    let delY;
    let delSq;
    let reduceFactor;
    const stepSize = 2;
    let stepDelX;
    let stepDelY;
  
    const setParams = () => {
      targetPos = wayPoints[wayPoints.length - 1] || endPos;
      delX = targetPos.x - actor.position.x;
      delY = targetPos.y - actor.position.y;
      delSq = delX * delX + delY * delY;
      reduceFactor = Math.sqrt(delSq);
      stepDelX = delX / reduceFactor * stepSize;
      stepDelY = delY / reduceFactor * stepSize;
      // set actor orientation to direction of travel
      actor.orientation = Math.atan2(delY, delX) / Math.PI * 180 + 90;
    }

    setParams();
  
    let moveInterval = setInterval(() => {
      if (target !== actor.itemInUse) { // user choses anther target while walking
        clearInterval(moveInterval);
        return;
      }
      actor.position.x += stepDelX;
      actor.position.y += stepDelY;
  
      if ((targetPos.x - actor.position.x) * delX > 0 || (targetPos.y - actor.position.y) * delY > 0) {
        // continue moving
      } else {
        actor.position.x = targetPos.x;
        actor.position.y = targetPos.y;
        if (targetPos === endPos) {
          callback();
          clearInterval(moveInterval);
        } else {
          wayPoints.pop();
          setParams();
        }
      }
      this.invokeCallback();
      this.draw();
    }, 20);
  }
  moveToTarget();
}

CanvasControl.prototype.moveToAndUseElement = function(actor, selectedElement) {
  const moveStepSize = 2;
  
  const startMoving = () => {
    const reachedDest = () => {
      this.useElement(actor, selectedElement);
      actor.orientation = selectedElement.orientation;

      if (actor === this.listener && selectedElement.constructor.name === 'Chair') { // listener can be in the middle of walking
        setPersonInCluster(actor, selectedElement);
      }
    };
    actor.setState(ELEMENT_STATE.WALKING);
    this.moveToTarget(actor, selectedElement, reachedDest);
    
    // let moveInterval = setInterval(() => {
    //   if (!this._canvas) { // object deleted
    //     return;
    //   }
    //   if (selectedElement !== actor.itemInUse) { // user choses anther target while walking
    //     clearInterval(moveInterval);
    //     return;
    //   }

    //   if (Math.abs(selectedElement.position.x - actor.position.x) > moveStepSize) {
    //     if (selectedElement.position.x > actor.position.x) {
    //       actor.position.x += moveStepSize;
    //       actor.orientation = 90;
    //     } else {
    //       actor.position.x -= moveStepSize;
    //       actor.orientation = -90;
    //     }
    //   } else if (Math.abs(selectedElement.position.y - actor.position.y) > moveStepSize) {
    //     if (selectedElement.position.y > actor.position.y) {
    //       actor.position.y += moveStepSize;
    //       actor.orientation = 180;
    //     } else {
    //       actor.position.y -= moveStepSize;
    //       actor.orientation = 0;
    //     }
    //   } else { // reaches destination
    //     actor.position.x = selectedElement.position.x;
    //     actor.position.y = selectedElement.position.y;
    //     this.useElement(actor, selectedElement);
    //     actor.orientation = selectedElement.orientation;

    //     if (actor === this.listener && selectedElement.constructor.name === 'Chair') { // listener can be in the middle of walking
    //       setPersonInCluster(selectedElement);
    //     }
        
    //     clearInterval(moveInterval);
    //   }
    //   this.invokeCallback();
    //   this.draw();
      
    // }, 20);
  }

  const selectElement = (actor, selectedElement) => {
    let actionDelay = 0;

    if (selectedElement.constructor.name === 'Chair') {
      if (selectedElement.state !== ELEMENT_STATE.AVAILABLE) {
        return;
      }
      selectedElement.setState(ELEMENT_STATE.RESERVED);
      this.draw();
    } else if (selectedElement.constructor.name === 'Door') {
      // don't need to do anything
    }

    if(actor.itemInUse) {
      if (actor.itemInUse.constructor.name === 'Chair') {
        const itemInUse = actor.itemInUse;
        const delay = itemInUse.stateChangeDelay;
        actionDelay += delay;
        actionDelay += actor.stateChangeDelay;

        if (itemInUse.state === ELEMENT_STATE.RESERVED) {
          itemInUse.setState(ELEMENT_STATE.AVAILABLE);
        } else if (itemInUse.state === ELEMENT_STATE.IN_USE) {
          setTimeout(() => {
            itemInUse.setState(ELEMENT_STATE.AVAILABLE);
          }, delay);
        }
        // update cluster map for generating new room after user exits
        delete clusters[itemInUse.clusterInfo.id].personSettingsForClusterMap[actor.id];
      }
    }
    if (actor !== this.listener && selectedElement.constructor.name === 'Chair') { // listener can be in the middle of walking
      setPersonInCluster(actor, selectedElement);
    }
    if (actor.state === ELEMENT_STATE.WORKING) {
      actor.setState(ELEMENT_STATE.PREPARING_TO_GO);
    }
    

    actor.itemInUse = selectedElement;
    
    
    setTimeout(() => {
      startMoving();
    }, actionDelay);
  }

  selectElement(actor, selectedElement);
}

CanvasControl.prototype._cursorUpFunc = function(event) {
  let cursorPosition = this.getCursorPosition(event);
  let selectedElement = this.getNearestElement(cursorPosition);

  if (selectedElement) {
    if (this.listener.state === ELEMENT_STATE.PREPARING_TO_GO || this.listener.state === ELEMENT_STATE.PREPARING_WORK) {
      return;
    }
    if (selectedElement.constructor.name === 'Chair' || selectedElement.constructor.name === 'Door') {
      this.moveToAndUseElement(this.listener, selectedElement);
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