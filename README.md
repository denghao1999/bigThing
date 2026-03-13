# bigThing

## 运行贪吃蛇

这个仓库里新增了一个可在浏览器运行的贪吃蛇页面：`home/snake.html`。

### 本地启动（推荐）

在仓库根目录执行：

```bash
python3 -m http.server 8000
```

然后浏览器打开：

- `http://localhost:8000/index.html`（左侧菜单：**小游戏 → 贪吃蛇**）
- 或直接打开 `http://localhost:8000/home/snake.html`
- `http://localhost:8000/home/lifecycle-model-demo.html`（左侧菜单：**低碳 Demo → 生命周期建模**）

### 操作

- **方向键 / WASD**：移动
- **空格**：暂停/继续
- **R**：重新开始
- 手机可用页面底部方向键，或在画布上滑动改变方向（轻点画布可暂停/继续）

## 生命周期建模 Demo

仓库里新增了一个基于 Vue 3 的生命周期建模 Demo 页面：`home/lifecycle-model-demo.html`。

### 当前已支持

- 生命周期环节分栏展示
- 输入清单 / 工序 / 输出清单编辑
- 右侧统一属性编辑面板
- 本地示例数据恢复
- 模型 JSON 一键复制
- 浏览器本地自动保存
