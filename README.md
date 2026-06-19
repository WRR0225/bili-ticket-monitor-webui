# B站会员购余票监控

开源免费，作用于 Web 界面的 Bilibili 会员购票务状态实时监控工具。

通过浏览器访问，实时追踪漫展、演出等活动的票务销售状态变化（无抢票功能）。

## ✨ 功能特性

- **实时监控** — 自定义刷新间隔（默认 2 秒），轮询 B站会员购 API
- **状态可视化** — 彩色状态标签 + 圆点指示灯，一眼区分多种票务状态
- **动态进度条** — 记录过去的状态变化历史，颜色变化直观反映状态切换趋势
- **状态变化提醒** — 票种状态变化时蓝色高亮闪烁提示
- **按场次展开/收起** — 每个场次独立折叠，灵活查看关注的日期
- **一键启动** — Windows 用户双击 `.bat` 文件即可运行

## 🎫 票务状态

| 状态 | 颜色 | 含义 |
|------|------|------|
| 售卖中 | 🟢 绿色 | 正在售卖，有票 |
| 暂时售罄 | 🟠 橙色 | 暂时卖完，可能因超时未付款释放回流票 |
| 已售罄 | 🔴 红色 | 全部售罄 |
| 已停售 | 🔴 红色 | 官方已停止销售 |
| 未开售 | ⚪ 灰色 | 尚未开始销售 |
| 不可售 | ⚪ 灰色 | 因特殊原因不可售 |

> 💡 **"暂时售罄"** 是最需要关注的状态 — 意味着可能有回流票释放。


## 🚀 快速开始

### 环境要求

- [Node.js](https://nodejs.org/) >= 18

### 方式一：下载预打包版本（推荐）

前往 [Releases](https://github.com/WRR0225/bili-ticket-monitor-webui/releases) 页面下载最新的 `.zip` 文件，解压到任意目录。

**Windows 用户：**

双击 `启动余票监控_Windows.bat`，自动打开浏览器访问监控页面。

**Mac 用户：**

打开终端，进入解压目录，执行：

```bash
chmod +x 启动余票监控_Mac.sh
./启动余票监控_Mac.sh
```

> 已包含所有运行依赖，无需执行 `npm install`。

### 方式二：克隆仓库 + 启动

```bash
git clone https://github.com/WRR0225/bili-ticket-monitor-webui.git
cd bili-ticket-monitor-webui
npm install
```

**Windows 用户：** 双击 `启动余票监控_Windows.bat` 即可。

**Mac用户：**

```bash
npm run server
# 另开一个终端
npm run dev
# 浏览器访问 http://localhost:5173
```

## 📖 使用说明

1. 打开 B站会员购网页版，找到你想监控的活动
2. 从浏览器地址栏链接中提取票务 ID，例如：
   ```
   https://show.bilibili.com/platform/detail.html?id=1001701
                                                     ^^^^^^
                                                   这就是票务 ID
   ```
3. 在页面中输入票务 ID，设置刷新间隔，点击「开始监控」
4. 页面会实时显示各票种的销售状态及变化

## 🏗️ 项目结构

```
bili-ticket-monitor-webui/
├── index.html              # 入口 HTML
├── package.json            # 项目配置与依赖
├── vite.config.js          # Vite 构建配置（含 API 代理）
├── 启动余票监控_Windows.bat  # Windows 一键启动脚本
├── 启动余票监控_Mac.sh       # Mac启动脚本
├── server/
│   └── server.js           # Express 后端（API 代理 + 模拟接口 + 静态文件托管）
└── src/
    ├── main.jsx            # React 入口
    ├── App.jsx             # 主组件（轮询、状态管理、UI 逻辑）
    ├── App.css             # 暗色/亮色主题样式
    └── index.css           # 全局基础样式
```

## 🔧 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | React 19 + Vite 6 |
| 后端代理 | Express 4 |
| 样式方案 | 原生 CSS（深色/浅色主题切换） |
| 数据来源 | B站会员购公开 API（无需登录） |

## ⚠️ 注意事项

- 请求间隔建议 ≥ 2 秒，过于频繁可能触发 B站风控（HTTP 412）
- 本工具仅用于监控余票状态，**无抢票功能**
- 使用本程序进行违法操作产生的法律责任由操作者自行承担

## 🙏 致谢

- 灵感来源：
  虽然这个项目没有什么可借鉴的，核心功能主要就是靠请求B站票务的api来获取数据信息，但还是太懒得从头开始做，fork了现有的 也是自己用过的项目[TaiMiao/Bili_Ticket_Monitor](https://github.com/TaiMiao/Bili_Ticket_Monitor)（Python CLI 版本）
- 本项目在其原理基础上进行了 Web 化重构，增加了现代化 UI、主题切换等特性，界面也是参考了之前在抢票时自己用过的网页版余票监控。现在那个网页已经不见了，我也忘了是谁做的，于是自己借助ai又开发了一个 
