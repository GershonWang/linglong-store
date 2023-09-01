<template>
    <div class="card-list">
        <div class="card" v-for="(card, index) in cardData" :key="index">
            <h2>{{ card.title }}</h2>
            <p>{{ card.description }}</p>
            <!-- 可以在这里添加其他卡片内容 -->
        </div>
    </div>
</template>
  
<script>
export default {
    props: {
        cardData: Array, // 传入的卡片数据
    },
};
</script>
  
<style scoped>
.card-list {
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
}

.card {
    width: 300px;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 5px;
    background-color: #fff;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>