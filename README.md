# BadgeGenerator

BadgeGenerator is a JavaScript library that allows you to dynamically generate badges using an HTML5 canvas.

## Installation

### Via a script file
Simply add the file to your project and import it into your HTML page:

```html
<script src="badge-generator.js"></script>
```

### Via CommonJS (Node.js)

```javascript
const { BadgeGenerator, BadgeLayer, BadgeTextLayer, BadgeImageLayer, BadgeRectLayer } = require('./badge-generator');
```

### Via ES Modules

```javascript
import { BadgeGenerator, BadgeLayer, BadgeTextLayer, BadgeImageLayer, BadgeRectLayer } from './badge-generator.js';
```

## Usage

### Creating a BadgeGenerator

```javascript
const badge = new BadgeGenerator("canvasId", {
    downloadBtnId: "downloadButton",
    exportHeight: 2048,
    exportWidth: 2048
});
```

### Adding text to the badge

```javascript
const textLayer = new BadgeTextLayer("My Text", "Arial", {
    left: (h, w) => 10,
    top: (h, w) => 20,
    color: "black",
    size: 20
});
badge.addLayer(textLayer);
```

### Adding an image to the badge

```javascript
const imageLayer = new BadgeImageLayer("image.png", {
    left: 10,
    top: 10,
    width: 50,
    height: 50
});
badge.addLayer(imageLayer);
```

### Adding a rectangle to the badge

```javascript
const rectLayer = new BadgeRectLayer({
    left: 10,
    top: 50,
    width: 50,
    height: 20,
    color: "red"
});
badge.addLayer(rectLayer);
```

### Exporting the badge as an image

```javascript
badge.getDownloadURL().then(url => {
    console.log("Image URL:", url);
});
```

### Refreshing and redrawing the badge

```javascript
badge.refreshSize();
badge.draw();
```

## License

This project is licensed under the MIT License. Feel free to use and modify it as you wish! 🎨

