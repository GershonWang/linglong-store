<template>
    <h1>{{ msg }}</h1>
    <Index></Index>
</template>
<script setup lang="ts">
import Index from './Index.vue'
defineProps<{ msg: string }>()
</script>
<style>

</style>