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
                <h3>${item.id}</h3>
                <p>${item.name}</p>
            `;
            cardContainer.appendChild(cardDiv);
        }
    })
};

start();