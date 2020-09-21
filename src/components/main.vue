<template>
    <div class="main-container">
        <div class="tool">
            <h5>图像调整：</h5>
            <div>剪裁：</div><Button @click="crop">剪裁</Button>
            <div>移动：</div><Button @click="move">移动</Button>
            <div>角度：{{deg}}°</div>  <input style="width:500px" type="range" v-model="deg" min="0" step="1" max="360" @change="() => rotate(deg, true)"/>
            <div>缩放：{{zoom}}倍</div><input style="width:500px" type="range" v-model="zoom" min="1" step="0.1" max="10" @change="() => scale(zoom, true)"/>
            <div>缩放：{{zoom}}倍</div><Button @click="() => {zoom = zoom +0.1;scale(zoom, true)}">放大</Button>&nbsp;<Button @click="() => {zoom = zoom - 0.1;scale(zoom, true)}">缩小</Button>
            <div>重载：</div><Button @click="move">重载</Button>
            <div>下载：</div><Button @click="saveFile">下载</Button>
            <h5>图像参数调整：</h5>
            黑白：<input type="checkbox" v-model="BW" @change="BWChange" />黑白
            <br>亮度：{{bright}}<input style="width:500px" type="range" v-model="bright" min="-100" step="1" max="100" @change="() => brightnessChange(bright, true)" >
            <br>对比：{{contrast}}<input style="width:500px" type="range" v-model="contrast" min="-100" step="1" max="100" @change="() => contrastChange(contrast, true)" >
            <br>饱和：{{saturation}}<input style="width:500px" type="range" v-model="saturation" min="-100" step="1" max="100" @change="() => saturationChange(saturation, true)" >
            <br>色彩平衡：<br>R:{{balance.r}}<input style="width:500px" type="range" v-model="balance.r" min="-100" step="1" max="100" @change="() => colorBalance(balance.r, balance.g, balance.b, true)"  >
            <br>G:{{balance.g}}<input style="width:500px" type="range" v-model="balance.g" min="-100" step="1" max="100" @change="() => colorBalance(balance.r, balance.g, balance.b, true)" >
            <br>B:{{balance.b}}<input style="width:500px" type="range" v-model="balance.b" min="-100" step="1" max="100" @change="() => colorBalance(balance.r, balance.g, balance.b, true)" >
        </div>
        <div class="wrap">
            <div id="container"></div>
        </div>
    </div>
</template>
<script>
import canvasTool from './canvasTool';
import { loadImg } from "@/components/util";

export default {
    name: 'mainEle',
    data() {
        return {
            BW: false,
            deg: 0,
            zoom: 1,
            bright: 0,
            contrast: 0,
            saturation: 0,
            balance: {
                r: 0,
                g: 0,
                b: 0
            },
            instance: null
        }
    },
    watch: {
        deg(val) {
            this.rotate(val);
        },
        zoom(val) {
            this.scale(val)
        },
        balance: {
            deep: true,
            handler(val) {
                this.colorBalance(val.r, val.g, val.b)
            }
        },
        bright(val) {
            // this.brightnessChange(val);
            console.log(val);
        },
        contrast(val) {
            this.contrastChange(val);
        },
        saturation(val) {
            this.saturationChange(val)
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
        saveFile() {
            this.instance.saveFile();
        },
        rotate(deg, done = false) {
            this.instance.startRotate(deg, done);
        },
        scale(zoom, done = false) {
            this.instance.startScale(zoom, done);
        },
        colorBalance(r, g, b, done = false) {
            this.instance.changeBalance(Number(r), Number(g), Number(b), done);
        },
        brightnessChange(val, done = false) {
            this.instance.changeBrightness(Number(val), done);
        },
        contrastChange(val, done = false) {
            this.instance.changeContrast(Number(val), done)
        },
        saturationChange(val, done = false) {
            this.instance.changeSaturation(Number(val), done)
        },
        BWChange() {
            this.instance.colored2BW(this.BW)
        }
    }
}
</script>
<style lang="less">
.main-container{
    display: flex;
    flex-direction: row;
    .tool{width: 600px;}
}
.wrap{
    display: flex;
    flex: 1;
    justify-content: center;
}
#container{
    //padding-top: 20px;
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