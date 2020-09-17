import { loadImg } from '@/components/util';

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
        deg: 0
    };
    STATE_MAP = {
        // 初始化
        'INIT': {
            value: 'INIT',
            style: 'auto'
        },
        // 剪裁
        'CROP':  {
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
     * @param suitable 是否合理化绘制，按合理的宽高进行缩放
     */
    async initDraw(suitable = true) {
        const {
            image: {naturalWidth, naturalHeight},
            canvasProp: {width: canvasWidth, height: canvasHeight}
        } = this;
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
        this.imageProp.width = param.width;
        this.imageProp.height = param.height;
        // 绘制
        this.canvasCTX.drawImage(this.image, param.dx, param.dy, param.width, param.height);
        this.imageProp.img = await this.buildImg(this.image, param.width, param.height);
    }

    /**
     * 合理绘制计算实现
     * @param originalParam 原始参数
     * @returns {{width: number, height: number, ratio: number}}
     */
    getSuitAbleSize(originalParam) {
        const returnValue = {
            width: 1,
            height: 1,
            ratio: 1,
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
     */
    buildImg(img, dw, dh, fix= null) {
        return new Promise(resolve => {
            const canvas = document.createElement('CANVAS');
            canvas.width = dw;
            canvas.height = dh;
            const context = canvas.getContext('2d');
            if (fix) {
                const {sx, sy, sw, sh} = fix
                context.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            } else {
                context.drawImage(img, 0, 0, dw, dh);
            }
            const newImg = document.createElement('IMG'),
                url = canvas.toDataURL('image/png', 1.0);
            newImg.onload = function() {
                resolve(newImg);
            };
            newImg.src = url;
            // document.body.appendChild(newImg);
        });
    }

    /**
     * 生成历史记录
     */
    buildHistoryLog() {
        localStorage.setItem('canvasTool', JSON.stringify(this.imageProp));
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
     * @param startX 开始截取位置X
     * @param startY 开始截取位置X
     * @param endX 结束截取位置X
     * @param endY 结束截取位置X
     */
    async handleCrop({startX, startY, endX, endY}) {
        const translateX = this.imageProp.x + this.imageProp.width / 2,
            translateY = this.imageProp.y + this.imageProp.height / 2;
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height);
        this.canvasCTX.save();
        // 设置旋转中心 以图片为中心
        this.canvasCTX.translate(translateX, translateY);
        this.canvasCTX.rotate((Math.PI * this.imageProp.deg) / 180);
        this.canvasCTX.translate(-translateX, -translateY);
        this.canvasCTX.drawImage(
            this.imageProp.img,
            (startX - this.imageProp.x),
            (startY - this.imageProp.y),
            (endX - startX),
            (endY - startY),
            this.canvasProp.width / 2 - (endX - startX) / 2,
            this.canvasProp.height / 2 - (endY - startY) / 2,
            endX - startX,
            endY - startY
        );
        // 设置图片尺寸
        this.imageProp.width = endX - startX;
        this.imageProp.height = endY - startY;
        // 生成图片
        this.imageProp.img = await this.buildImg(
            this.imageProp.img,
            this.imageProp.width,
            this.imageProp.height,
            {
                sx: (startX - this.imageProp.x),
                sy: (startY - this.imageProp.y),
                sw: (endX - startX),
                sh: (endY - startY)
            }
        );
        this.imageProp.x = this.canvasProp.width / 2 - (endX - startX) / 2;
        this.imageProp.y = this.canvasProp.height / 2 - (endY - startY) / 2;
        // 生成记录
        this.buildHistoryLog();
        this.canvasCTX.restore();
    }

    async cropByImageData({startX, startY, endX, endY}) {
        const imgData = this.canvasCTX.getImageData(startX, startY, endX - startX, endY - startY);
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height);
        this.canvasCTX.putImageData(imgData,0,0);
        const img = await loadImg(this.canvasDOM.toDataURL('image/png', 1.0))
        this.imageProp.img = await this.buildImg(img, img.width, img.height);
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
        canvasDOM.onmouseup = () => {
            mouseDown = false;
            this.toggleRunningState = 'INIT';
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
        const translateX = this.imageProp.x + this.imageProp.width / 2,
            translateY = this.imageProp.y + this.imageProp.height / 2;
        // 设置旋转中心 以图片为中心
        this.canvasCTX.translate(translateX, translateY);
        this.canvasCTX.rotate(Math.PI * this.imageProp.deg / 180);
        this.canvasCTX.translate(-translateX, -translateY);
        this.canvasCTX.drawImage(
            this.imageProp.img,
            x,
            y,
            this.imageProp.width,
            this.imageProp.height
        );
        // 生成记录
        this.buildHistoryLog();
        this.canvasCTX.restore();
    }

    /**
     * 旋转
     * @param deg
     */
    startRotate(deg) {
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
        this.imageProp.deg = deg;
        // this.buildImg();
    }

    /**
     * 缩放
     * @param ratio
     */
    startScale(ratio) {
        console.log(ratio);
    }
}