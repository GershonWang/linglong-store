<template>
  <div class="container">
    <div>
      <div ref="canvasContainer" style="width: 100%; height: 100vh;"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import * as THREE from 'three';

const canvasContainer = ref();
let renderer: { setSize: (arg0: number, arg1: number) => void; domElement: any; render: (arg0: any, arg1: any) => void; };
let camera: { position: { z: number; }; };
let scene: { add: (arg0: any) => void; };

onMounted(() => {
  init();
  animate();
});

function init() {
  // 创建渲染器
  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  canvasContainer.value.appendChild(renderer.domElement);
  // 创建相机
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.z = 5;
  // 创建场景
  scene = new THREE.Scene();
  // 创建一个简单的立方体
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);
  // 添加光源
  const light = new THREE.PointLight(0xffffff, 1, 100);
  light.position.set(0, 0, 10);
  scene.add(light);
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
</script>
<style scoped>
.container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  width: 100%;
  background-color: cadetblue;
}
</style>