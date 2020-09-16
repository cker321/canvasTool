<template>
  <div id="app">
      <MainEle/>
  </div>
</template>

<script>
import MainEle from './components/main';
export default {
  name: 'App',
  components: {
      MainEle
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
