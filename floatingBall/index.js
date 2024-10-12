const pet = document.getElementById('pet-image');

let enable = false;
// 实现宠物简单的左右移动
let direction = 1;
let position = 0;

function movePet() {
    position += direction * 5;
    if (position > window.innerWidth - pet.clientWidth || position < 0) {
        direction *= -1; // 反转方向
    }
    pet.style.left = position + 'px';
    requestAnimationFrame(movePet);
}

movePet();

pet.addEventListener('click', () => {
    console.log('你点击了桌宠！');
    // 或者改变宠物的动画，进行互动等
    // window.electron.send("message-from-renderer", "ll-cli list --json");
    // window.electron.receive('message-from-main', res => {
    //     let array = res ? JSON.parse(res) : [];
    //     for ( let item of array) {
    //         console.log(item);
            
    //     }
    // })
    window.electron.send("open-list-dialog", !enable);
});

