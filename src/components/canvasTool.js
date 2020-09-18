import {
    buildImg,
    getFourPoints,
} from '@/components/util';

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
        deg: 0
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
     * 实现剪裁图片 弃用
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
     * @param deg 旋转角度
     * @param done Boolean
     */
    startRotate(deg, done) {
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
        // 设置旋转完成得图像到imageProp
        if (done) {
            // 斜边
            // const r = (getC(this.imageProp.width , this.imageProp.height));
            // 求出夹角（弧度）
            // const newDeg = getDeg(this.imageProp.width, this.imageProp.height) + (Math.PI * deg) / 180;
            // const width = Math.abs(Math.sin((Math.PI * deg) / 180) * r);
            // const height = Math.abs(Math.cos((Math.PI * deg) / 180) * r);
            // console.log(width.toFixed(2));
            // console.log(height.toFixed(2));
            // let {x, y} = getTransform(this.imageProp.x, this.imageProp.y, (Math.PI / 180 * deg));
            // let {x, y} = getTransformNew(this.imageProp.x, this.imageProp.y, this.imageProp.width, this.imageProp.height, (Math.PI / 180 * deg));
            // const imgData = this.canvasCTX.getImageData(x, y, width, height);
            // this.buildImg(imgData,width, height);
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
            console.log(start);
        }
    }

    /**
     * 缩放
     * @param zoomVal
     * @param done
     */
    async startScale(zoomVal, done) {
        const translateX = this.imageProp.x + this.imageProp.width / 2,
            translateY = this.imageProp.y + this.imageProp.height / 2;
        this.canvasCTX.clearRect(0, 0, this.canvasProp.width, this.canvasProp.height)
        this.canvasCTX.save()
        // 设置旋转中心 以图片为中心
        this.canvasCTX.translate(translateX, translateY);
        this.canvasCTX.scale(zoomVal, zoomVal);
        this.canvasCTX.translate(-translateX, -translateY);
        this.canvasCTX.drawImage(this.imageProp.img, this.imageProp.x, this.imageProp.y);
        // 置回
        this.canvasCTX.restore();
        this.imageProp.scale = zoomVal;
        // 设置缩放完成得图像到imageProp
        if (done) {
            const width = this.imageProp.width * zoomVal;
            const height = this.imageProp.height * zoomVal;
            this.imageProp.x = this.canvasDOM.width / 2 - width / 2;
            this.imageProp.y = this.canvasDOM.height / 2 - height / 2;
        }
    }
}
