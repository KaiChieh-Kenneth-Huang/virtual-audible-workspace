/* This is a testing code */
// helper functions
function chooseOneRandomlyFromList(list) {
    return list[Math.floor(Math.random() * list.length)];
}

function rotateCoordinates({x, y}, rotation) {
    const sin = Math.sin(rotation / 180 * Math.PI);
    const cos = Math.cos(rotation / 180 * Math.PI);
    return {x: x * cos - y * sin, y: x * sin + y * cos}
  }
