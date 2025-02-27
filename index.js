/**
 * Class representing a badge generator.
 */
class BadgeGenerator {
     /**
     * Creates a badge generator.
     * @param {string} canvasId - The ID of the canvas element.
     * @param {{ downloadBtnId?: string, exportHeight: number [2048], exportWidth: number [2048]}} options - Configuration options.
     */
    constructor(canvasId, options) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.exportHeight = options.exportHeight?? 2048;
        this.exportWidth = options.exportWidth?? 2048;
        if (!this.canvas) {
            throw new Error("Canvas element not found");
        }
        if (options.downloadBtnId) {
            this.downloadBtn = document.getElementById(options.downloadBtnId);
            if (!this.downloadBtn) {
                throw new Error("Download button element not found");
            }
        }

        window.addEventListener('resize', () => {
            this.refreshSize();
        });
        this.layers = [];
        this.refreshSize();
        this.btnEventId = null;
    }

    /**
     * Refreshes the size of the canvas.
     */
    refreshSize(){
        console.log("refreshSize");
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.draw();
    }

    /**
     * Clears all layers from the badge.
     */
    clear(){
        this.layers = [];
        this.draw();
    }

    /**
     * Adds a new layer to the badge.
     * @param {BadgeLayer} layer - The layer to add.
     */
    addLayer(layer) {
        this.layers.push(layer);
        this.draw();
        setTimeout(() => {
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
        }, 0)
    }

    /**
     * Generates a download URL for the badge.
     * @returns {Promise<string>} The generated data URL.
     */
    async getDownloadURL() {
        const hiddenCanvas = document.createElement('canvas');
        hiddenCanvas.id = `${this.canvasId}-hidden`;
        hiddenCanvas.width = this.exportWidth;
        hiddenCanvas.height = this.exportHeight;
        hiddenCanvas.style.width = this.exportWidth;
        hiddenCanvas.style.height = this.exportHeight;
        document.body.appendChild(hiddenCanvas);
        const hiddenGen = new BadgeGenerator(hiddenCanvas.id);
        hiddenGen.layers = this.layers;
        await hiddenGen.draw();
        const dataURL = hiddenCanvas.toDataURL("image/png");
        document.body.removeChild(hiddenCanvas);
        return dataURL;
    }

    /**
     * Draws the badge on the canvas.
     * @returns {Promise<void>}
     */
    async draw() {
        this.canvas.getContext("2d").clearRect(0, 0, this.canvas.width, this.canvas.height);
    
        for (const layer of this.layers) {
            await layer.draw(this.canvas);
        }
    
        if (this.downloadBtn) {
            // Vérifie et supprime l'ancien écouteur si déjà ajouté
            if (this.btnEventId) {
                this.downloadBtn.removeEventListener('click', this.btnEventId);
            }
    
            // Définit une fonction de téléchargement et l'assigne
            this.btnEventId = async () => {
                const hiddenCanvas = document.createElement('canvas');
                hiddenCanvas.id = `${this.canvasId}-hidden`;
                hiddenCanvas.width = this.exportWidth;
                hiddenCanvas.height = this.exportHeight;
                hiddenCanvas.style.width = this.exportWidth;
                hiddenCanvas.style.height = this.exportHeight;
                hiddenCanvas.style.display = "none";
                document.body.appendChild(hiddenCanvas);
                const hiddenGen = new BadgeGenerator(hiddenCanvas.id);
                hiddenGen.layers = this.layers;
                await hiddenGen.draw();
                setTimeout(() => {
                    const dataURL = hiddenCanvas.toDataURL("image/png");
                    const a = document.createElement('a');
                    a.href = dataURL;
                    a.download = 'badge.png';
                    a.click();
                    document.body.removeChild(hiddenCanvas);
                }, 1000);
            };
    
            // Ajoute un seul écouteur
            this.downloadBtn.addEventListener('click', this.btnEventId);
        }
        return Promise.resolve();
    }    
}

/**
 * Base class for badge layers.
 */
class BadgeLayer {
    /**
     * Creates a badge layer.
     * @param {Object} options - Configuration options for the layer.
     */
    constructor(options = {}) {
        this.options = options;
        this.type = "";
    }

    /**
     * Draws the layer on a given canvas.
     * @param {HTMLCanvasElement} canvas - The canvas to draw on.
     */
    draw() {}
}

/**
 * Class representing a text layer in the badge.
 */
class BadgeTextLayer extends BadgeLayer {
    /**
     * Creates a text layer.
     * @param {string} text - The text content.
     * @param {string} font - The font of the text.
     * @param {Object} options - Configuration options for the text layer.
     */
    constructor(text, font, options = {
        bottom: undefined,
        left: (renderedHeight, redenredWidth) => 10,
        right: undefined,
        top: (renderedHeight, redenredWidth) => 80,
        color: "black",
        size: 20
    }) {
        if(!((options.right!=undefined && options.top!=undefined) || (options.right!=undefined && options.bottom!=undefined) || (options.left!=undefined && options.bottom!=undefined) || (options.left!=undefined && options.top!=undefined))){
            throw new Error("Only one of the following options should be set: right and top, right and bottom, left and bottom, left and top");
            
        }
        super({
            ...options,
            left: 0,
            top: 0,
            bottom: 0,
            right: 0
        });
        this.type = "text";
        this.text = text;
        this.font = font;
        this.options.leftF = options.left;
        this.options.topF = options.top;
        this.options.bottomF = options.bottom;
        this.options.rightF = options.right;
    }

    static getRenderedSize(text, font, size, canvas){
        const c = document.createElement("canvas");
        const ctx = c.getContext('2d');
        ctx.font = `${size}px ${font}`;
        const textMetrics = ctx.measureText(text);
        const renderedHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        const redenredWidth = textMetrics.width;
        console.log("a", renderedHeight, redenredWidth, canvas.height, canvas.width);
        return {height: renderedHeight, width: redenredWidth};
    }

    async draw(canvas) {
        await document.fonts.ready;
        const ctx = canvas.getContext("2d");
        ctx.font = `${this.options.size*canvas.height/100}px ${this.font}`;
        const {height, width} = BadgeTextLayer.getRenderedSize(this.text, this.font, this.options.size, canvas);
        const renderedHeight = height;
        const redenredWidth = width;
        console.log("b", renderedHeight, redenredWidth);
        this.options.left = (this.options.leftF instanceof Function) ? this.options.leftF(renderedHeight, redenredWidth) : undefined;
        this.options.top = (this.options.topF instanceof Function) ? this.options.topF(renderedHeight, redenredWidth) : undefined;
        this.options.bottom = (this.options.bottomF instanceof Function) ? this.options.bottomF(renderedHeight, redenredWidth) : undefined;
        this.options.right = (this.options.rightF instanceof Function) ? this.options.rightF(renderedHeight, redenredWidth) : undefined;
        ctx.fillStyle = this.options.color;
        const textMetrics = ctx.measureText(this.text);
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        if(this.options.right!=undefined && this.options.top!=undefined){
            ctx.fillText(this.text, canvas.width - this.options.right*canvas.width/100 - textMetrics.width, this.options.top*canvas.height/100+textHeight);
        }
        else if(this.options.right!=undefined && this.options.bottom!=undefined){
            console.log(canvas.width - this.options.right*canvas.width/100 - textMetrics.width, canvas.height - this.options.bottom*canvas.height/100)
            ctx.fillText(this.text, canvas.width - this.options.right*canvas.width/100 - textMetrics.width, canvas.height - this.options.bottom*canvas.height/100);
        }
        else if(this.options.left!=undefined && this.options.bottom!=undefined){
            ctx.fillText(this.text, this.options.left*canvas.width/100, canvas.height - this.options.bottom*canvas.height/100);
        }
        else{
            ctx.fillText(this.text, this.options.left*canvas.width/100, this.options.top*canvas.height/100+textHeight);
        }
    }
}

/**
 * Class representing an image layer in the badge.
 */
class BadgeImageLayer extends BadgeLayer {
    /**
     * Creates an image layer.
     * @param {string} imageSrc - The source URL of the image.
     * @param {Object} options - Configuration options for the image layer.
     */
    constructor(imageSrc, options = {
        bottom: undefined,
        left: 10,
        right: undefined,
        top: 80,
        width: 50,
        height: 50
    }) {
        super(options);
        this.options = options;
        this.type = "image";
        this.image = new Image();
        this.image.crossOrigin = "anonymous"; 
        this.image.src = imageSrc;
    }

    async draw(canvas) {
        const ctx = canvas.getContext("2d");
        const { width, height, left, right, top, bottom } = this.options;
        const imgWidth = width * canvas.width / 100;
        const imgHeight = height * canvas.height / 100;
        // this.image.src = this.imageSrc;
        if(this.image.src !== undefined && this.image.complete && this.image.src !== "") {
            console.log("draw image ante");
            setTimeout(() => {
                if (right !== undefined && top !== undefined) {
                    ctx.drawImage(this.image, canvas.width - right * canvas.width / 100 - imgWidth, top * canvas.height / 100, imgWidth, imgHeight);
                } else if (right !== undefined && bottom !== undefined) {
                    ctx.drawImage(this.image, canvas.width - right * canvas.width / 100 - imgWidth, canvas.height - bottom * canvas.height / 100 - imgHeight, imgWidth, imgHeight);
                } else if (left !== undefined && bottom !== undefined) {
                    ctx.drawImage(this.image, left * canvas.width / 100, canvas.height - bottom * canvas.height / 100 - imgHeight, imgWidth, imgHeight);
                } else {
                    ctx.drawImage(this.image, left * canvas.width / 100, top * canvas.height / 100, imgWidth, imgHeight);
                }
            }, 0);
            return;
        }
        this.image.onload = () => {console.log("draw image");
            setTimeout(() => {
                if (right !== undefined && top !== undefined) {
                    ctx.drawImage(this.image, canvas.width - right * canvas.width / 100 - imgWidth, top * canvas.height / 100, imgWidth, imgHeight);
                } else if (right !== undefined && bottom !== undefined) {
                    ctx.drawImage(this.image, canvas.width - right * canvas.width / 100 - imgWidth, canvas.height - bottom * canvas.height / 100 - imgHeight, imgWidth, imgHeight);
                } else if (left !== undefined && bottom !== undefined) {
                    ctx.drawImage(this.image, left * canvas.width / 100, canvas.height - bottom * canvas.height / 100 - imgHeight, imgWidth, imgHeight);
                } else {
                    ctx.drawImage(this.image, left * canvas.width / 100, top * canvas.height / 100, imgWidth, imgHeight);
                }
            }, 0);
        };
    }
}

/**
 * Class representing a rectangle layer in the badge.
 */
class BadgeRectLayer extends BadgeLayer {
    /**
     * Creates a rectangle layer.
     * @param {Object} options - Configuration options for the rectangle layer.
     */
    constructor(options = {
        bottom: undefined,
        left: 10,
        right: undefined,
        top: 80,
        width: 50,
        height: 50,
        color: "black"
    }) {
        super(options);
        this.options = options;
        this.type = "rect";
    }

    async draw(canvas) {
        const ctx = canvas.getContext("2d");
        const { width, height, left, right, top, bottom, color } = this.options;
        const rectWidth = width * canvas.width / 100;
        const rectHeight = height * canvas.height / 100;
        ctx.fillStyle = color;

        if (right !== undefined && top !== undefined) {
            ctx.fillRect(canvas.width - right * canvas.width / 100 - rectWidth, top * canvas.height / 100, rectWidth, rectHeight);
        } else if (right !== undefined && bottom !== undefined) {
            ctx.fillRect(canvas.width - right * canvas.width / 100 - rectWidth, canvas.height - bottom * canvas.height / 100 - rectHeight, rectWidth, rectHeight);
        } else if (left !== undefined && bottom !== undefined) {
            ctx.fillRect(left * canvas.width / 100, canvas.height - bottom * canvas.height / 100 - rectHeight, rectWidth, rectHeight);
        } else {
            ctx.fillRect(left * canvas.width / 100, top * canvas.height / 100, rectWidth, rectHeight);
        }
    }
}

// ✅ CommonJS
if (typeof module !== "undefined" && typeof module.exports !== "undefined") {
    module.exports = { BadgeGenerator, BadgeLayer, BadgeTextLayer, BadgeImageLayer, BadgeRectLayer };
}

// // ✅ ES Modules
// export { hello, BadgeGenerator, BadgeLayer, BadgeTextLayer, BadgeImageLayer, BadgeRectLayer };
