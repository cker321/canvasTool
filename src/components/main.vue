<template>
    <div class="main-container">
        <div>剪裁：</div><Button @click="crop">剪裁</Button>
        <div>移动：</div><Button @click="move">移动</Button>
        <div>角度：{{deg}}°</div><input style="width:500px" type="range" v-model="deg" min="0" step="1" max="360" @change="rotate(deg, true)"/>
        <div>缩放：{{zoom}}倍</div><input style="width:200px" type="range" v-model="zoom" min="0.05" step="0.1" max="2"/>
        <div>重载：</div><Button @click="move">重载</Button>
        <div id="container"></div>
    </div>
</template>
<script>
import canvasTool from './canvasTool';
import { loadImg } from "@/components/util";

export default {
    name: 'mainEle',
    data() {
        return {
            deg: 0,
            zoom: 1,
            instance: null
        }
    },
    watch: {
        deg(val) {
            this.rotate(val);
        },
        zoom(val) {
            this.scale(val)
        }
    },
    async mounted() {
        const img = await loadImg('/demo2.jpg');
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
        // 剪裁
        crop() {
            this.instance.startCrop();
        },
        // 移动
        move() {
            this.instance.startMove();
        },
        rotate(deg, done = false) {
            this.instance.startRotate(deg, done);
        },
        scale(zoom) {
            this.instance.startScale(zoom);
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