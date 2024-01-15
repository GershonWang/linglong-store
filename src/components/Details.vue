<template>
    <h1>{{ query.appId }}</h1>
    <h1>{{ query.name }}</h1>
    <h1>{{ query.arch }}</h1>
    <h1>{{ query.version }}</h1>
    <h1>{{ query.description }}</h1>
    <h1>{{ query.icon }}</h1>
</template>
<script setup lang="ts">
import { useRouter } from 'vue-router';
const router = useRouter();
const query = router.currentRoute.value.query;
</script>
<style>
</style>