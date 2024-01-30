# linglong_store
 
这里是一个使用electron+vite构建出的简单玲珑客户端程序，里面包含着大量BUG,欢迎提issues


- 构建运行
    
    ```shell
    # 使用 npm 安装依赖
    ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" npm i

    # 运行
    npm run dev
    ```

- 涉及部分指令与 api 请求

    ```
    # 判断程序是否存在
    ll-cli --help

    # 版本检查
    ll-cli --version

    # 已安装软件
    ll-cli list | sed 's/\x1b\[[0-9;]*m//g'


    # API 前缀： https://mirror-repo-linglong.deepin.com

    # 获取仓库列表
    # /api/v0/web-store/apps??page=1&size=100000
    ```


### api 数据参考

- 仓库软件列表 - 本记录为止为 1334 项，取其两项

    <details>
    
    ```json
    {
        "code": 200,
        "data": {
            "list": [
                {
                    "id": 291,
                    "appId": "app.web.baidu.map",
                    "name": "baidumap",
                    "version": "0.9.1",
                    "arch": "arm64",
                    "icon": "https://mirror-repo-linglong.deepin.com/icon/app.web.baidu.map.svg",
                    "description": "百度地图网页版。"
                },
                {
                    "id": 1459,
                    "appId": "blue-demo",
                    "name": "blue-demo",
                    "version": "1.0.0",
                    "arch": "x86_64",
                    "icon": "https://mirror-repo-linglong.deepin.com/icon/application-x-executable.svg",
                    "description": "simple qt demo.blue test.\n"
                }
            ],
            "total": 1334,
            "page": 1,
            "page_size": 100000
        },
        "traceId": "17aec335-cda9-a116-2901-8e89abce19a5"
    }
    ```
