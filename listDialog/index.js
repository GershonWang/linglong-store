function start(){
    const cardContainer = document.getElementById('cardContainer');

    window.electron.send("message-from-renderer", "ll-cli list --json");
    window.electron.receive('message-from-main', async res => {
        let array = res ? JSON.parse(res) : [];
        let repo = await postData(array);
        for ( let item of repo) {
            console.log(item);
            const cardDiv = document.createElement('div');
            cardDiv.className = 'card';
            cardDiv.innerHTML = `
                <h3>${item.zhName ? item.zhName : item.name}</h3>
                <img src='${item.icon}' width='90px'/>
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

async function postData(data) {
    await fetch('http://120.26.202.221:8687/visit/getAppDetails', {
        method: 'POST', // 指定请求方法
        headers: {
            'Content-Type': 'application/json' // 设置请求的Content-Type
        },
        body: JSON.stringify(data) // 将数据转换为JSON字符串
    }).then(response => {
        if (response.ok) {
            return response.json(); // 如果响应成功，解析JSON
        }
        throw new Error('Network response was not ok.'); // 如果响应不成功，抛出错误
    }).then(jsonResponse => {
        console.log('JSON response:', jsonResponse); // 处理JSON响应数据
        if (jsonResponse.code == 200) {
            data = jsonResponse.data;
        }
    }).catch(error => {
        console.error('Request failed:', error); // 处理错误
    });
    return data;
}