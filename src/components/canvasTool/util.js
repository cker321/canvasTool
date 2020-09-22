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
            // 扩展参数 rotate
            if (fix) {
                const {deg = 0} = fix
                context.rotate(deg);
                context.translate(dw/2, dh/2);
                context.drawImage(img, 0, 0, dw, dh);
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
        x: x + +width / 2,
        y: y + +height / 2
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
            y: center.y + +Math.sin(newDegree - rotate - rotate) * halfC
        },
        rightTop: {
            x: center.x + +Math.cos(newDegree - rotate - rotate) * halfC,
            y: center.y - Math.sin(newDegree - rotate - rotate) * halfC
        },
        rightBottom: {
            x: center.x + +Math.cos(newDegree) * halfC,
            y: center.y + +Math.sin(newDegree) * halfC
        },
    };
}

/**
 * 图像rbg处理
 * @param imageData
 * @param R
 * @param G
 * @param B
 */
export const colorRGB = (imageData, R, G, B) => {
    return ColorTransformFilter(imageData, 1, 1, 1, 1, R, G, B, 1);
}

/**
 * 图像黑白
 */
export const colored2BW = (srcImageData) => {
    let srcPixels = srcImageData.data,
        srcWidth = srcImageData.width,
        srcHeight = srcImageData.height,
        srcLength = srcPixels.length;
    let _canvas = document.createElement('canvas'),
        _context = _canvas.getContext('2d'),
        dstImageData = _context.createImageData(srcWidth, srcHeight),
        dstPixels = dstImageData.data;
    // 遍历像素点
    for (let i = 0; i < srcLength; i += 4) {
        let r = srcPixels[i];
        let g = srcPixels[i + 1];
        let b = srcPixels[i + 2];
        // 获取灰色
        let gray = parseInt((r * 38 + g * 75 + b * 15) >> 7);
        dstPixels[i] = gray;
        dstPixels[i + 1] = gray;
        dstPixels[i + 2] = gray;
        dstPixels[i + 3] = srcPixels[i + 3];
    }
    return dstImageData;
}

/**
 * 饱和度 亮度 处理
 * @param srcImageData
 * @param brightness
 * @param contrast
 * @returns {ImageData}
 */
export const brightnessContrastPhotoshop = (srcImageData, brightness, contrast) => {
    const srcPixels = srcImageData.data,
        srcWidth = srcImageData.width,
        srcHeight = srcImageData.height;
    const _canvas = document.createElement('canvas'),
        _context = _canvas.getContext('2d'),
        dstImageData = _context.createImageData(srcWidth, srcHeight),
        dstPixels = dstImageData.data;

    // fix to 0 <= n <= 2;
    brightness = (brightness + 100) / 100;
    contrast = (contrast + 100) / 100;

    mapRGB(srcPixels, dstPixels, (value) => {
        value *= brightness;
        value = (value - 127.5) * contrast + 127.5;
        return (value + 0.5) | 0;
    });
    return dstImageData;
}
/**
 *  饱和度
 * @param srcImageData
 * @param satDelta
 * @returns {ImageData}
 */
export const HSLAdjustment = (srcImageData, satDelta) => {
    const hueDelta = 0;
    const lightness = 0;
    const srcPixels = srcImageData.data,
        srcWidth = srcImageData.width,
        srcHeight = srcImageData.height,
        srcLength = srcPixels.length;
    const _canvas = document.createElement('canvas'),
        _context = _canvas.getContext('2d'),
        dstImageData = _context.createImageData(srcWidth, srcHeight),
        dstPixels = dstImageData.data;
    // hueDelta /= 360;
    satDelta /= 100;
    // lightness /= 100;
    let h, s, l, hsl, rgb, i;
    for (i = 0; i < srcLength; i += 4) {
        // convert to HSL
        hsl = rgbToHsl(srcPixels[i], srcPixels[i + 1], srcPixels[i + 2]);
        // hue
        h = hsl[0] + hueDelta;
        while (h < 0) {
            h += 1;
        }
        while (h > 1) {
            h -= 1;
        }

        // saturation
        s = hsl[1] + hsl[1] * satDelta;
        if (s < 0) {
            s = 0;
        } else if (s > 1) {
            s = 1;
        }

        // lightness
        l = hsl[2];
        if (lightness > 0) {
            l += (1 - l) * lightness;
        } else if (lightness < 0) {
            l += l * lightness;
        }

        // convert back to rgb
        rgb = hslToRgb(h, s, l);

        dstPixels[i] = rgb[0];
        dstPixels[i + 1] = rgb[1];
        dstPixels[i + 2] = rgb[2];
        dstPixels[i + 3] = srcPixels[i + 3];
    }

    return dstImageData;
}

// RGBA转换辅助基础方法
const rgbToHsl = (r, g, b) => {
    r /= 255;
    g /= 255;
    b /= 255;

    var max = r > g ? (r > b ? r : b) : g > b ? g : b,
        min = r < g ? (r < b ? r : b) : g < b ? g : b,
        chroma = max - min,
        h = 0,
        s = 0,
        // Lightness
        l = (min + max) / 2;

    if (chroma !== 0) {
        // Hue
        if (r === max) {
            h = (g - b) / chroma + (g < b ? 6 : 0);
        } else if (g === max) {
            h = (b - r) / chroma + 2;
        } else {
            h = (r - g) / chroma + 4;
        }
        h /= 6;

        // Saturation
        s = l > 0.5 ? chroma / (2 - max - min) : chroma / (max + min);
    }

    return [h, s, l];
}
const hslToRgb = (h, s, l) => {
    let m1,
        m2,
        hue,
        r,
        g,
        b,
        rgb = [];

    if (s === 0) {
        r = g = b = (l * 255 + 0.5) | 0;
        rgb = [r, g, b];
    } else {
        if (l <= 0.5) {
            m2 = l * (s + 1);
        } else {
            m2 = l + s - l * s;
        }

        m1 = l * 2 - m2;
        hue = h + 1 / 3;

        let tmp;
        for (let i = 0; i < 3; i += 1) {
            if (hue < 0) {
                hue += 1;
            } else if (hue > 1) {
                hue -= 1;
            }

            if (6 * hue < 1) {
                tmp = m1 + (m2 - m1) * hue * 6;
            } else if (2 * hue < 1) {
                tmp = m2;
            } else if (3 * hue < 2) {
                tmp = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
            } else {
                tmp = m1;
            }

            rgb[i] = (tmp * 255 + 0.5) | 0;

            hue -= 1 / 3;
        }
    }

    return rgb;
}
const mapRGB = (src, dst, func) => {
    applyMap(src, dst, buildMap(func));
}
const applyMap = (src, dst, map) => {
    for (let i = 0, l = src.length; i < l; i += 4) {
        dst[i] = map[src[i]];
        dst[i + 1] = map[src[i + 1]];
        dst[i + 2] = map[src[i + 2]];
        dst[i + 3] = src[i + 3];
    }
}
const buildMap = (f) => {
    let m = [], k = 0, v;
    for (m = []; k < 256; k += 1) {
        m[k] = (v = f(k)) > 255 ? 255 : v < 0 ? 0 : v | 0;
    }
    return m;
}
// 色彩平衡相关
const ColorTransformFilter = (
    srcImageData,
    redMultiplier,
    greenMultiplier,
    blueMultiplier,
    alphaMultiplier,
    redOffset,
    greenOffset,
    blueOffset,
    alphaOffset
) => {
    let srcPixels = srcImageData.data,
        srcWidth = srcImageData.width,
        srcHeight = srcImageData.height,
        srcLength = srcPixels.length;
    let _canvas = document.createElement('canvas'),
        _context = _canvas.getContext('2d'),
        dstImageData = _context.createImageData(srcWidth, srcHeight),
        dstPixels = dstImageData.data;

    let i, v;
    for (i = 0; i < srcLength; i += 4) {
        dstPixels[i] = (v = srcPixels[i] * redMultiplier + redOffset) > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i + 1] = (v = srcPixels[i + 1] * greenMultiplier + greenOffset) > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i + 2] = (v = srcPixels[i + 2] * blueMultiplier + blueOffset) > 255 ? 255 : v < 0 ? 0 : v;
        dstPixels[i + 3] = (v = srcPixels[i + 3] * alphaMultiplier + alphaOffset) > 255 ? 255 : v < 0 ? 0 : v;
    }

    return dstImageData;
}

/**
 * base64转blob
 * @param code
 * @returns {Blob}
 */
export const base64ToBlob = (code) => {
    const parts = code.split(';base64,');
    const contentType = parts[0].split(':')[1];
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
        uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
}