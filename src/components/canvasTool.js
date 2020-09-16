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
    STATE_MAP = {
        // 初始化
        'INIT': 'INIT',
        // 剪裁
        'CROP': 'CROP',
        // 缩放
        'SCALE': 'SCALE'
    }
    constructor({ container, image, width, height, suitableSize }) {
        this.container = container;
        this.image = image;
        this.canvasProp = {
            ...this.canvasProp,
            width,
            height,
            ratio: width/ height
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
        return this.runningStates.state === this.STATE_MAP.CROP ? 'crosshair' : 'auto';
    }
    /**
     * 设置状态
     * @param STATE
     */
    set toggleRunningState(STATE) {
        if (this.runningStates.state !== STATE) {
            this.runningStates.state = this.STATE_MAP[STATE] || this.STATE_MAP.INIT
        } else {
            this.runningStates.state = this.STATE_MAP.INIT
        }
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
     * 创建SVG 用于剪裁图片
     */
    initSvg() {
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        // this.svg.setAttribute('viewBox', `${this.canvasProp.width} ${this.canvasProp.height}`);
        this.svg.setAttribute('width', `${this.canvasProp.width}`);
        this.svg.setAttribute('height', `${this.canvasProp.height}`);
        this.svg.style.position = 'absolute';
        this.svg.style.width = `${this.canvasProp.width}px`;
        this.svg.style.height = `${this.canvasProp.height}px`;
        this.svg.style.top = '0px';
        this.svg.style.left = '0px';
        // this.svg.style.width = this.canvasProp.width;
        // this.svg.style.height = this.canvasProp.height;
        this.svg.style.pointerEvents = 'none';
        this.container.appendChild(this.svg);
    }

    /**
     * 初始化绘制
     * @param suitable 是否合理化绘制，按合理的宽高进行缩放
     */
    initDraw(suitable = true) {
        const {
            image: { naturalWidth, naturalHeight},
            canvasProp: { width: canvasWidth, height: canvasHeight}
        } = this;
        // 绘制相关参数
        let param = {
            width: naturalWidth,
            height: naturalHeight,
            ratio: naturalWidth / naturalHeight,
            sx: 0,
            sy: 0
        };
        // 合理化绘制
        if (suitable) {
            // 宽度大于高度 优先适配宽度
            param = this.getSuitAbleSize(param)
        }
        // 居中绘制起点
        param.sx = canvasWidth / 2 - param.width / 2;
        param.sy = canvasHeight / 2 - param.height / 2;
        // 绘制
        this.canvasCTX.drawImage(this.image, param.sx, param.sy, param.width, param.height);
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
            ratio: 1
        };
        const { width: oWidth, height: oHeight} = originalParam
        const { suitableSize: { width: suitableWidth, height: suitableHeight, ratio}} = this;
        if ((oHeight > suitableHeight || oWidth > suitableWidth)) {
            // 宽度大于高度 优先适配宽度
            if (originalParam.ratio > ratio) {
                returnValue.width = suitableWidth;
                returnValue.height = oHeight * ( returnValue.width / oWidth );
            } else {
                returnValue.height = suitableHeight;
                returnValue.width = oWidth * ( returnValue.height / oHeight );
            }
        }
        return returnValue;
    }

    /**
     * 外部调用剪裁
     */
    startCrop() {
        this.toggleRunningState = 'CROP';
        this.canvasDOM.style.cursor = this.cursorStyle;
        const start = {
            x: 0,
            y: 0
        }, end = {
            x: 0,
            y: 0
        }, {
            canvasDOM,
            // canvasProp: {
            //     width,
            //     height
            // }
        } = this;
        let mouseDown = false;
        canvasDOM.onmousedown = e => {
            if (this.runningStates.state !== 'CROP') return;
            start.x = e.offsetX;
            start.y = e.offsetY;
            mouseDown = true;
        }
        canvasDOM.onmousemove = e => {
            if (!mouseDown) return ;
            end.x = e.offsetX;
            end.y = e.offsetY;
            this.svg.innerHTML = '';
            const PATH =  document.createElementNS("http://www.w3.org/2000/svg", 'path');
            PATH.setAttribute('d', `M${start.x},${start.y} L${start.x},${end.y} L${end.x},${end.y} L${end.x},${start.y}Z`);
            PATH.setAttribute('stroke', '#409EFF');
            PATH.setAttribute('stroke-width', '1');
            PATH.setAttribute('fill', 'transparent');
            this.svg.appendChild(PATH);
        }
        canvasDOM.onmouseup = () => {
            mouseDown = false;
            this.toggleRunningState = 'INIT';
            this.canvasDOM.style.cursor = this.cursorStyle;
            this.handleCrop({startX: start.x, startY: start.y, endX: end.x, endY: end.y})
        }
    }

    /**
     * 剪裁图片
     */
    handleCrop({startX, startY, endX, endY}) {
        console.log(startX, startY, endX, endY)
    }

}