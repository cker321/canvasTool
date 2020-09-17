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
