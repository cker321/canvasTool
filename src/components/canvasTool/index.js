import {
    base64ToBlob,
    brightnessContrastPhotoshop,
    buildImg,
    colored2BW,
    colorRGB,
    getFourPoints,
    HSLAdjustment,
} from '@/components/canvasTool/util';

export default class {
    canvasDOM;
    canvasCTX;
    svg;
    canvasProp = {
        ratio: 1,
        width: 100,
        height: 100
    };
    suitableSize = {
        ratio: 1,
        width: 100,
        height: 100
    };
    runningStates = {
        state: 'INIT'
    };
    // 图片改动记录
    imageProp = {
        img: null,
        x: 0,
        y: 0,
        scale: 1,
        width: 0,
        height: 0,
        offsetX: 0,
        offsetY: 0,
        deg: 0,
        imageData: null,
        colorParams: {
            brightness: 0,
            contrast: 0,
            saturation: 0,
            RGB: {
                R: 0,
                G: 0,
                B: 0
            },
            BW: false
        }
    };
    STATE_MAP = {
        // 初始化
        'INIT': {
            value: 'INIT',
            style: 'auto'
        },
        // 剪裁
        'CROP': {
            value: 'CROP',
            style: 'crosshair'
        },
        // 缩放
        'SCALE': {
            value: 'SCALE',
            style: 'auto'
        },
        // 准备移动
        'AWAIT_MOVE': {
            value: 'AWAIT_MOVE',
            style: 'grab'
        },
        // 移动
        'MOVING': {
            value: 'MOVING',
            style: 'grabbing'
        }
    };

    constructor({container, image, width, height, suitableSize}) {
        this.container = container;
        // 原始图片对象
        this.image = image;
        this.canvasProp = {
            ...this.canvasProp,
            width,
            height,
            ratio: width / height
        };
        this.suitableSize = {...this.canvasProp, ...suitableSize};
        this.suitableSize.ratio = this.suitableSize.width / this.suitableSize.height;
        this.initDom();
        this.initDraw();
    }

    /**
     * 获取鼠标样式
     * @returns {string}
     */
    get cursorStyle() {
        return this.STATE_MAP[this.runningStates.state] ? this.STATE_MAP[this.runningStates.state].style : 'auto';
    }

    /**
     * 设置状态
     * @param STATE
     */
    set toggleRunningState(STATE) {
        if (this.runningStates.state !== STATE) {
            this.runningStates.state = (this.STATE_MAP[STATE] && this.STATE_MAP[STATE].value) || this.STATE_MAP.INIT.value
        } else {
            this.runningStates.state = this.STATE_MAP.INIT.value
        }
        this.canvasDOM.style.cursor = this.cursorStyle
    }

    /**
     * 初始化DOM
     */
    initDom() {
        this.canvasDOM = document.createElement('CANVAS');
        this.canvasDOM.width = this.canvasProp.width;
        this.canvasDOM.height = this.canvasProp.height;
        this.container.appendChild(this.canvasDOM);
        this.canvasCTX = this.canvasDOM.getContext('2d');
        this.container.style.position = 'relative';
        this.initSvg();
    }

    /**
     * 创建SVG 用于剪裁图片画框
     */
    initSvg() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('width', `${this.canvasProp.width}`);
        this.svg.setAttribute('height', `${this.canvasProp.height}`);
        this.svg.style.position = 'absolute';
        this.svg.style.width = `${this.canvasProp.width}px`;
        this.svg.style.height = `${this.canvasProp.height}px`;
        this.svg.style.top = '0px';
        this.svg.style.left = '0px';
        this.svg.style.pointerEvents = 'none';
        this.container.appendChild(this.svg);
    }

    /**
     * 初始化绘制
     * @returns {Promise<void>}
     */
    async initDraw() {
        this.drawImg(true, this.image)
        this.imageProp.img = await this.buildImg(this.image, this.imageProp.width, this.imageProp.height);
    }

    /**
     * 绘制图片
     * @param suitable 是否合理化绘制，按合理的宽高进行缩放
     * @param img
     */
    drawImg(suitable = true, img) {
        const {
                canvasProp: {width: canvasWidth, height: canvasHeight}
            } = this,
            {naturalWidth, naturalHeight} = img;
        // 绘制相关参数
        let param = {
            width: naturalWidth,
            height: naturalHeight,
            ratio: naturalWidth / naturalHeight,
            dx: 0,
            dy: 0,
            scale: 1
        };
        // 合理化绘制
        if (suitable) {
            param = this.getSuitAbleSize(param)
        }
        // 居中绘制起点
        param.dx = canvasWidth / 2 - param.width / 2;
        param.dy = canvasHeight / 2 - param.height / 2;
        // 保存到记录
        this.imageProp.x = param.dx;
        this.imageProp.y = param.dy;
        this.imageProp.scale = param.scale;
        this.imageProp.scale = 1;
        this.imageProp.width = param.width;
        this.imageProp.height = param.height;
        // 绘制
        this.canvasCTX.drawImage(img, param.dx, param.dy, param.width, param.height);
    }

    /**
     * 合理绘制计算实现
     * @param originalParam 原始参数
     * @returns {{width: number, height: number, ratio: number}}
     */
    getSuitAbleSize(originalParam) {
        const returnValue = {
            width: originalParam.width,
            height: originalParam.height,
            ratio: originalParam.ratio,
            scale: 1
        };
        const {width: oWidth, height: oHeight} = originalParam
        const {suitableSize: {width: suitableWidth, height: suitableHeight, ratio}} = this;
        if ((oHeight > suitableHeight || oWidth > suitableWidth)) {
            // 宽度大于高度 优先适配宽度
            if (originalParam.ratio > ratio) {
                returnValue.width = suitableWidth;
                returnValue.height = oHeight * (returnValue.width / oWidth);
                returnValue.scale = returnValue.width / oWidth;
            } else {
                returnValue.height = suitableHeight;
                returnValue.width = oWidth * (returnValue.height / oHeight);
                returnValue.scale = returnValue.height / oHeight;
            }
        }
        return returnValue;
    }

    /**
     * 鼠标是否在图片上
     * @param x
     * @param y
     */
    isIn(x, y) {
        return x >= this.imageProp.x && x <= this.imageProp.x + +this.imageProp.width
            && y >= this.imageProp.y && y <= this.imageProp.y + +this.imageProp.height;
    }

    /**
     * 生成图片
     * @param img 图片对象 或 imageData
     * @param dw
     * @param dh
     * @param fix
     * @returns {Promise<unknown>}
     */
    buildImg(img, dw, dh, fix = null) {
        return buildImg(img, dw, dh, fix)
    }

    /**
     * 生成历史记录
     */
    buildHistoryLog() {
        console.log(this.imageProp);
        // localStorage.setItem('canvasTool', JSON.stringify(this.imageProp));
    }

    /**
     * 外部调用剪裁
     */
    startCrop() {
        // 按下标记
        let mouseDown = false;
        this.toggleRunningState = 'CROP';
        const start = {
                x: 0,
                y: 0
            },
            end = {
                x: 0,
                y: 0
            },
            {
                canvasDOM
            } = this;
        canvasDOM.onmousedown = e => {
            if (this.runningStates.state !== 'CROP') return;
            start.x = e.offsetX;
            start.y = e.offsetY;
            mouseDown = true;
        }
        canvasDOM.onmousemove = e => {
            if (!mouseDown) return;
            end.x = e.offsetX;
            end.y = e.offsetY;
            const nodes = this.svg.childNodes;
            nodes.forEach(item => {
                this.svg.removeChild(item);
            })
            const PATH = document.createElementNS("http://www.w3.org/2000/svg", 'path');
            PATH.setAttribute('d', `M${start.x},${start.y} L${start.x},${end.y} L${end.x},${end.y} L${end.x},${start.y}Z`);
            PATH.setAttribute('stroke', '#409EFF');
            PATH.setAttribute('stroke-width', '1');
            PATH.setAttribute('fill', 'transparent');
            this.svg.appendChild(PATH);
        }
        canvasDOM.onmouseup = () => {
            if (this.runningStates.state !== 'CROP') return;
            // this.handleCrop({startX: start.x, startY: start.y, endX: end.x, endY: end.y});
            this.cropByImageData({startX: start.x, startY: start.y, endX: end.x, endY: end.y})
            const nodes = this.svg.childNodes;
            nodes.forEach(item => {
                this.svg.removeChild(item);
            })
            this.toggleRunningState = 'INIT';
            mouseDown = false;
        }
    }

    /**
     * 实现剪裁图片
     * @param startX
     * @param startY
     * @param endX
     * @param endY
     * @returns {Promise<void>}
     */
    async cropByImageData({startX, startY, endX, endY}) {
        const cropWidth = endX - startX;
        const cropHeight = endY - startY;
        const imgData = this.canvasCTX.getImageData(startX, startY, cropWidth, cropHeight);
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height);
        this.imageProp.img = await this.buildImg(imgData, cropWidth, cropHeight);
        this.imageProp.width = cropWidth;
        this.imageProp.height = cropHeight;
        this.drawImg(true, this.imageProp.img);
    }

    /**
     * 图片移动
     */
    startMove() {
        // 按下标记
        let mouseDown = false;
        const start = {
                x: 0,
                y: 0
            },
            end = {
                x: 0,
                y: 0
            },
            {
                canvasDOM
            } = this;
        canvasDOM.onmousedown = e => {
            if (this.runningStates.state !== 'AWAIT_MOVE') return;
            // 判断鼠标是否在图片上
            if (!this.isIn(e.offsetX, e.offsetY)) return;
            mouseDown = true;
            this.toggleRunningState = 'MOVING';
            start.x = e.offsetX - this.imageProp.x;
            start.y = e.offsetY - this.imageProp.y;
        }
        canvasDOM.onmousemove = e => {
            this.toggleRunningState = 'INIT';
            if (!this.isIn(e.offsetX, e.offsetY)) return;
            this.toggleRunningState = 'AWAIT_MOVE';
            // 鼠标在canvas内部 改变鼠标样式
            if (!mouseDown) return;
            this.toggleRunningState = 'MOVING';
            end.x = e.offsetX;
            end.y = e.offsetY;
            this.handleMove(end.x - start.x, end.y - start.y);
        }
        canvasDOM.onmouseup = e => {
            end.x = e.offsetX;
            end.y = e.offsetY;
            mouseDown = false;
            this.toggleRunningState = 'INIT';
            this.handleMove(end.x - start.x, end.y - start.y);
        }
        canvasDOM.onmouseout = () => {
            mouseDown = false;
            this.toggleRunningState = 'INIT';
        }
    }

    /**
     * 实现移动
     * @param x
     * @param y
     */
    handleMove(x, y) {
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height);
        this.canvasCTX.save()
        this.imageProp.x = x;
        this.imageProp.y = y;
        this.canvasCTX.drawImage(
            this.imageProp.img,
            x,
            y,
            this.imageProp.width,
            this.imageProp.height
        );
        // 生成记录
        // this.buildHistoryLog();
        this.canvasCTX.restore();
    }

    /**
     * 旋转
     * @param rotate 旋转弧度
     * @param done Boolean
     */
    async startRotate(rotate, done) {
        const deg = rotate - this.imageProp.deg;
        const translateX = this.imageProp.x + this.imageProp.width / 2,
            translateY = this.imageProp.y + this.imageProp.height / 2;
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height)
        this.canvasCTX.save()
        // 设置旋转中心 以图片为中心
        this.canvasCTX.translate(translateX, translateY);
        this.canvasCTX.rotate((Math.PI * deg) / 180);
        this.canvasCTX.translate(-translateX, -translateY);
        this.canvasCTX.drawImage(this.imageProp.img, this.imageProp.x, this.imageProp.y);
        // 置回
        this.canvasCTX.restore()
        // 设置旋转完成得图像到imageProp
        if (done) {
            const points = getFourPoints(this.imageProp.x, this.imageProp.y, this.imageProp.width, this.imageProp.height, (Math.PI * deg) / 180);
            let minx = 0, minY = 0, maxX = 0, maxY = 0;
            let init = true;
            for (let key in points) {
                let point = points[key];
                if (point.x < minx || init) {
                    minx = point.x;
                }
                if (point.y < minY || init) {
                    minY = point.y;
                }
                if (point.x > maxX || init) {
                    maxX = point.x;
                }
                if (point.y > maxY || init) {
                    maxY = point.y;
                }
                init = false;
            }
            let start = {
                x: minx,
                y: minY
            }
            this.imageProp.width = maxX - minx;
            this.imageProp.height = maxY - minY;
            const imageData = this.canvasCTX.getImageData(start.x, start.y, this.imageProp.width, this.imageProp.height);
            this.imageProp.img = await this.buildImg(imageData, this.imageProp.width, this.imageProp.height);
            this.imageProp.x = start.x;
            this.imageProp.y = start.y;
            this.imageProp.deg = rotate;
        }
    }


    /**
     * 缩放
     * @param zoomVal
     * @param done
     */
    async startScale(zoomVal, done) {
        this.canvasCTX.save();
        const newZoom = zoomVal/ this.imageProp.scale;
        const translateX = +this.imageProp.x + +this.imageProp.width / 2,
            translateY = +this.imageProp.y + +this.imageProp.height / 2;
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height)
        // 设置缩放中心 以图片为中心
        this.canvasCTX.translate(translateX, translateY);
        this.canvasCTX.scale(newZoom, newZoom);
        this.canvasCTX.translate(-translateX, -translateY);
        this.canvasCTX.drawImage(this.imageProp.img, this.imageProp.x, this.imageProp.y);
        // 置回
        this.canvasCTX.restore();
        // 设置缩放后的图片到全局
        if (done) {
            this.imageProp.scale = zoomVal;
            this.imageProp.width = (this.imageProp.width * newZoom).toFixed(0);
            this.imageProp.height = (this.imageProp.height * newZoom).toFixed(0);
            // this.imageProp.x = this.imageProp.x * zoomVal / 2;
            // this.imageProp.y = this.imageProp.y * zoomVal / 2;
            // const imageData = this.canvasCTX.getImageData(this.imageProp.x, this.imageProp.y, width, height);
            this.imageProp.img = await this.buildImg(this.imageProp.img, this.imageProp.width, this.imageProp.height);
        }
    }

    /**
     * 改变图像色彩平衡
     * @param R
     * @param G
     * @param B
     * @param done
     */
    changeBalance(R, G, B, done = false) {
        this.imageProp.colorParams.RGB = {R, G, B};
        this.imageColorChangeCenter(done);
    }

    /**
     * 亮度
     * @param brightness
     * @param done
     */
    changeBrightness(brightness, done) {
        this.imageProp.colorParams.brightness = brightness;
        this.imageColorChangeCenter(done);
    }

    /**
     * 对比
     * @param contrast
     * @param done
     */
    changeContrast(contrast, done = false) {
        this.imageProp.colorParams.contrast = contrast;
        this.imageColorChangeCenter(done);
    }

    /**
     * 饱和
     * @param saturation
     * @param done
     */
    changeSaturation(saturation, done = false) {
        this.imageProp.colorParams.saturation = saturation;
        this.imageColorChangeCenter(done);
    }

    /**
     * 黑白
     * @param val
     */
    colored2BW(val) {
        this.imageProp.colorParams.BW = val;
        this.imageColorChangeCenter(true);
    }

    /**
     * 图像色彩处理中心
     * @param done
     * @returns {Promise<void>}
     */
    async imageColorChangeCenter(done = false) {
        const {brightness, contrast, saturation, RGB, BW} = this.imageProp.colorParams;
        let currentImageData = this.canvasCTX.getImageData(this.imageProp.x, this.imageProp.y, this.imageProp.width, this.imageProp.height);
        if (!this.imageProp.imageData) {
            this.imageProp.imageData = currentImageData;
        }
        let imageData = this.imageProp.imageData;
        // 色彩平衡处理
        if (RGB.R !== 0 || RGB.G !== 0 || RGB.B !== 0)  {
            imageData = colorRGB(imageData, RGB.R, RGB.G, RGB.B);
        }
        // 亮度处理
        if (brightness !== 0) {
            imageData = brightnessContrastPhotoshop(imageData, brightness, 0);
        }
        // 对比度处理
        if (contrast !== 0) {
            imageData = brightnessContrastPhotoshop(imageData, 0, contrast);
        }
        // 饱和度处理
        if (saturation !== 0) {
            imageData = HSLAdjustment(imageData, saturation);
        }
        // 黑白处理
        BW && (imageData = colored2BW(imageData));
        this.canvasCTX.putImageData(imageData, this.imageProp.x, this.imageProp.y);
        if (done) this.imageProp.img = await this.buildImg(imageData, this.imageProp.width, this.imageProp.height);
    }

    /**
     * 保存
     */
    saveFile() {
        const fileName = new Date().getTime() * Math.random();
        let content = this.canvasDOM.toDataURL('image/png', 1.0);
        let blob = base64ToBlob(content);
        if (navigator.msSaveBlob) {
            navigator.msSaveBlob(blob, fileName + '.jpg');
        } else {
            let aLink = document.createElement('a');
            let evt = document.createEvent('HTMLEvents');
            evt.initEvent('click', true, true);
            aLink.download = fileName + '.jpg';
            aLink.href = URL.createObjectURL(blob);
            aLink.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        }
    }
}
