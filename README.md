#  iRingo: 🌤 WeatherKit Alert Override

替换和风天气 (qweather.com) 预警页面，以 Apple WeatherKit 原生样式呈现预警信息。

## 效果

拦截 `qweather.com` 的严重天气预警页面，将原始 HTML 重新渲染为 Apple WeatherKit 风格的预警详情页，包括：

- 预警标题与类型图标
- 严重程度分级（轻微 / 中度 / 较重 / 严重）
- 预警描述与触发条件说明
- 防御指南
- 签发机构与区域信息

## 安装

### 前置条件

- [Stash](https://stash.ws/) 或 [Surge](http://nssurge.com/)（支持 `.stoverride` 格式的代理工具）

### 安装步骤

1. 在 Stash / Surge 中添加模块，输入以下 URL：

```
https://github.com/stellarhalo/WeatherKitAlert/releases/latest/download/iRingo.WeatherKit.Alert.stoverride
```

2. 启用模块，确保 MITM 已开启并信任证书
3. 访问 `https://www.qweather.com/severe-weather/` 下的任意预警页面即可看到效果

### 自动更新

- **模块配置**：在工具中点击「更新模块」即可获取最新版本的 `.stoverride` 配置
- **脚本代码**：工具每 24 小时自动检查 `alert.bundle.js` 更新（`interval: 86400`）

## 工作原理

```
用户访问 qweather.com 预警页面
        ↓
Surge/Stash 拦截响应
        ↓
src/index.js 解析 $response.body
        ↓
src/parser.mjs 用正则提取预警数据
        ↓
src/renderer.mjs 生成 Apple WeatherKit HTML
        ↓
替换原始响应体，返回给用户
```

### 项目结构

```
WeatherKitAlert/
├── src/
│   ├── index.js          # 入口脚本，拦截响应、调用解析与渲染
│   ├── parser.mjs        # 正则 HTML 解析器，提取结构化预警数据
│   ├── renderer.mjs      # 生成 Apple WeatherKit 风格 HTML
│   └── types.d.ts        # TypeScript 类型定义 (AlertData)
├── template/
│   └── stash.alert.handlebars   # Stash 模块模板（Handlebars）
├── modules/
│   └── iRingo.WeatherKit.Alert.stoverride  # Stash/Surge 模块配置
├── dist/
│   └── alert.bundle.js   # 构建产物（CDN 分发）
├── rspack.config.mjs     # rspack 构建配置
└── package.json
```

## 开发

### 构建

```bash
npm install
npm run build              # 生产构建
npm run build:dev          # 开发模式（不压缩）
```

构建使用 **rspack**（非 webpack），输出到 `dist/alert.bundle.js`。

### 构建产物发布

1. `npm run build` 生成 `dist/alert.bundle.js`
2. 将 `alert.bundle.js` 与 `modules/iRingo.WeatherKit.Alert.stoverride` 一同上传至 GitHub Releases
3. 模块中的 `script-providers.url` 使用 `/releases/latest/download/` 路径，确保用户始终获取最新版本

## 技术要点

- **正则解析**：`parser.mjs` 使用 `match()` / `matchAll()` 从原始 HTML 提取数据，不依赖 DOM 解析器
- **字符串拼接**：`renderer.mjs` 使用字符串拼接（`+`）而非模板字面量（`` ` ``），避免在 rspack 打包输出中产生反引号冲突
- **Apple CSS**：页面引用 Apple CDN 上的 `weather_alert.d0054c35839929383291.css`，无需本地维护样式
- **无测试 / 无 lint 配置**：独立脚本模块，非标准库项目

## 兼容性

| 工具 | 支持 |
|---|---|
| Stash | ✅ `.stoverride` 格式 |
| Surge | ✅ `.stoverride` 格式（macOS / iOS） |
| Quantumult X | 需手动转换配置 |
| Loon | 需手动转换配置 |

## 致谢

感谢 [NSRingo/WeatherKit](https://github.com/NSRingo/WeatherKit) 项目及原作者（VirgilClyne、WordlessEcho、001）的开创性工作。

本仓库是 WeatherKit 项目预警模块（Alert Override）的独立维护版本。

## 许可证

Apache-2.0
