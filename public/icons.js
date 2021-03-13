/*
    This script loads icons and images used in the canvas into memory
*/
const iconList = [
    ['chair', 'resources/img/chair.svg'],
    ['round-table', 'resources/img/round table.svg'],
    ['square-table', 'resources/img/square table.svg'],
];

const icons = {};

for (const [key, src] of iconList) {
    icons[key] = document.createElement('img');
    icons[key].src = src;
}