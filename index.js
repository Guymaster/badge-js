function hello(name) {
    return `Hello, ${name}!`;
}

class BadgeGenerator {
    constructor(canvasId, options = {
        downloadBtnId: undefined,
        exportHeight: 2048,
        exportWidth: 2048
    }) {
        this.canvasId = canvasId;
        this.canvas = document.getElementById(canvasId);
        this.exportHeight = options.exportHeight;
        this.exportWidth = options.exportWidth;
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

    refreshSize(){
        console.log("refreshSize");
        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;
        this.draw();
    }

    clear(){
        this.layers = [];
        this.draw();
    }

    addLayer(layer) {
        this.layers.push(layer);
        this.draw();
        setTimeout(() => {
            const resizeEvent = new Event('resize');
            window.dispatchEvent(resizeEvent);
        }, 0)
    }

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

class BadgeLayer {
    constructor(options = {}) {
        this.options = options;
        this.type = "";
    }

    draw() {
        
    }
}

class BadgeTextLayer extends BadgeLayer {
    constructor(text, font, options = {
        bottom: undefined,
        left: 10,
        right: undefined,
        top: 80,
        color: "black",
        size: 20
    }) {
        if((options.right && options.top) || (options.right && options.bottom) || (options.left && options.bottom) || (options.left && options.top)){
            throw new Error("Only one of the following options should be set: right and top, right and bottom, left and bottom, left and top");
            
        }
        super(options);
        this.options = options;
        this.type = "text";
        this.text = text;
        this.font = font;
    }

    async draw(canvas) {
        const ctx = canvas.getContext("2d");
        ctx.font = `${this.options.size*canvas.height/100}px ${this.font}`;
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

class BadgeImageLayer extends BadgeLayer {
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

class BadgeRectLayer extends BadgeLayer {
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
    module.exports = { hello, BadgeGenerator, BadgeLayer, BadgeTextLayer, BadgeImageLayer, BadgeRectLayer };
}

// ✅ ES Modules
//export { hello, BadgeGenerator };
