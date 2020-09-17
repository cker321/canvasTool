<template>
    <div class="main-container">
        剪裁：<Button @click="crop">剪裁</Button>
        移动：<Button @click="move">移动</Button>
        角度：<input type="range" v-model="deg" min="0" max="360"/>
        重载：<Button @click="move">重载</Button>
        <div id="container"></div>
    </div>
</template>
<script>
import canvasTool from './canvasTool';
export default {
    name: 'mainEle',
    data() {
        return {
            deg: 0,
            instance: null
        }
    },
    watch: {
        deg(val) {
            this.rotate(val);
        }
    },
    async mounted() {
        const img = await this.loadImg();
        if (!img) {
            alert('图片加载错误！');
            return;
        }
        this.instance = new canvasTool({
            container: document.getElementById('container'),
            image: img,
            width: 600,
            height: 600,
            svg: document.getElementById('svg'),
            // 默认绘制大小
            suitableSize: {
                width: 500,
                height: 500,
            }
        });
    },
    methods: {
        // 加载图片
        loadImg(path = '/demo2.jpg') {
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
        },
        // 剪裁
        crop() {
            this.instance.startCrop();
        },
        // 移动
        move() {
            this.instance.startMove();
        },
        rotate(deg) {
            this.instance.startRotate(deg);
        }
    }
}
</script>
<style lang="less">
#container{
    //padding-top: 20px;
    width: 600px;
    height: 600px;
    margin: 10px auto;
    img{
        width: 300px;
    }
    canvas {
        border: 1px solid #ccc;
    }
}
</style>