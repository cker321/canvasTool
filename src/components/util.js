/**
 * 加载图片
 * @param path
 * @returns {Promise<unknown>}
 */
export const loadImg = (path = '') => {
    return new Promise(resolve => {
        const img = new Image();
        img.onload = () => {
            resolve(img);
        };
        img.onerror = () => {
            resolve(false);
        }
        img.src = path;
    })
}

/**
 * 生成图片
 * @param img 图片对象 或 imageData
 * @param dw
 * @param dh
 * @param fix
 * @returns {Promise<unknown>}
 */
export const buildImg = (img, dw, dh, fix = null) => {
    return new Promise(resolve => {
        const canvas = document.createElement('CANVAS');
        canvas.width = dw;
        canvas.height = dh;
        const context = canvas.getContext('2d');
        if (img.data) {
            context.putImageData(img, 0, 0);
        } else {
            // 扩展参数
            if (fix) {
                const {sx, sy, sw, sh} = fix
                context.drawImage(img, sx, sy, sw, sh, 0, 0, dw, dh);
            } else {
                context.drawImage(img, 0, 0, dw, dh);
            }
        }

        const newImg = document.createElement('IMG'),
            url = canvas.toDataURL('image/png', 1.0);
        newImg.style.border = '1px solid #000';
        newImg.onload = () => {
            resolve(newImg);
        };
        newImg.src = url;
        document.body.appendChild(newImg);
    });
}

/**
 * 勾股定理获取斜边
 * @param a
 * @param b
 */
export const getC = (a, b) => {
    return Math.sqrt(Math.pow(a, 2) + Math.pow(b, 2))
}

/**
 * 已知正切值求角度(弧度)
 * @returns {number}
 * @param a 对边
 * @param b 临边
 */
export const getDeg = (a, b) => {
    return Math.atan(a / b)
}

/**
 * 弧度转角度
 * @param radian
 * @returns {number}
 */
export const rad2Angle = radian => {
    return radian * 180 / Math.PI;
}


export const getTransform = (x, y, rotate) => {
    // 初始坐标与中点形成的直线长度不管怎么旋转都是不会变的，用勾股定理求出然后将其作为斜边
    const r = Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
    // 斜边乘sin值等于即可求出y坐标
    const a = Math.sin(rotate) * r
    // 斜边乘cos值等于即可求出x坐标
    const b = Math.cos(rotate) * r
    // 目前的xy坐标是相对于图片中点为原点的坐标轴，而我们的主坐标轴是canvas的坐标轴，所以要加上中点的坐标值才是标准的canvas坐标
    return {
        x: b,
        y: a
    }
}


export const getTransformNew = (x1, y1, width, height, rotate) => {
    const x0 = (x1 + width) / 2;
    const y0 = (y1 + height) / 2;
    return {
        x: x0 + (x1 - x0) * Math.cos(rotate) - (y1 - y0) * Math.sin(rotate),
        y: y0 + (x1 - x0) * Math.sin(rotate) + (y1 - y0) * Math.cos(rotate)
    }
}


/**
 * 传入左上角坐标与矩形宽高 求出矩形四个顶点坐标
 * @param x
 * @param y
 * @param width
 * @param height
 * @param rotate
 */
export const getFourPoints = (x, y, width, height, rotate) => {
    // 中心点1
    const center = {
        x: x + width / 2,
        y: y + height / 2
    };
    const halfC = getC(width, height) / 2;
    const newDegree = getDeg(height, width) + rotate;
    return {
        leftTop: {
            x: center.x - Math.cos(newDegree) * halfC,
            y: center.y - Math.sin(newDegree) * halfC
        },
        leftBottom: {
            x: center.x - Math.cos(newDegree - rotate - rotate) * halfC,
            y: center.y + Math.sin(newDegree - rotate - rotate) * halfC
        },
        rightTop: {
            x: center.x + Math.cos(newDegree - rotate - rotate) * halfC,
            y: center.y - Math.sin(newDegree - rotate - rotate) * halfC
        },
        rightBottom: {
            x: center.x + Math.cos(newDegree) * halfC,
            y: center.y + Math.sin(newDegree) * halfC
        },
    };
}
