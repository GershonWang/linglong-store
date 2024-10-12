function start(){
    const cardContainer = document.getElementById('cardContainer');

    window.electron.send("message-from-renderer", "ll-cli list --json");
    window.electron.receive('message-from-main', res => {
        let array = res ? JSON.parse(res) : [];
        for ( let item of array) {
            console.log(item);
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.innerHTML = `
                <h3>${item.name}</h3>
                <p>${item.id}</p>
                <button class="run-button">启动</button>
            `;
            // 添加按钮点击事件
            const button = cardDiv.querySelector('.run-button');
            button.addEventListener('click', () => {
                window.electron.send("run-app", "ll-cli run " + item.id);
                window.electron.send("open-list-dialog", false);
            });
            cardContainer.appendChild(cardDiv);
        }
    })
};

start();