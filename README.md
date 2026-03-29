# 地图软件 App 框架（Expo + React Native + TypeScript）

这是一个面向地图类应用的基础框架，包含以下能力：

- 页面路由骨架（首页 + 地图页）
- 地图服务抽象层（Provider 模式）
- 位置权限与当前定位示例
- 可扩展的服务目录结构

## 快速开始

```bash
npm install
npm run start
```

配置环境变量（复制 `.env.example` 为 `.env`）：

```bash
EXPO_PUBLIC_AMAP_WEB_KEY=你的高德Web端Key
EXPO_PUBLIC_AMAP_SECURITY_JS_CODE=你的高德安全密钥（Web端）
EXPO_PUBLIC_AMAP_WEB_STYLE=你的高德地图样式URL（可选）
EXPO_PUBLIC_YOLO_ENDPOINT=你的YOLO识别接口地址
EXPO_PUBLIC_YOLO_API_KEY=你的YOLO接口Key（可选）
```

启动后按终端提示选择平台：

- 手机（推荐）：用 Expo Go 扫二维码
- Android：按 `a`（需已安装 Android Studio SDK）
- Web：执行 `npm run web`

## Web 兼容说明

- 原生端（iOS/Android）使用 `react-native-maps` 渲染地图。
- Web 端已接入高德地图 JS SDK，需配置 `EXPO_PUBLIC_AMAP_WEB_KEY` 和 `EXPO_PUBLIC_AMAP_SECURITY_JS_CODE`。
- 如需应用高德自定义样式，可配置 `EXPO_PUBLIC_AMAP_WEB_STYLE`（例如 `amap://styles/xxxx`）。
- 若 Key 未配置或网络异常，地图页会显示错误提示层。

## 目录结构

```text
src/
  components/
  navigation/
  screens/
  services/
    location/
    map/
      providers/
  theme/
```

## 后续扩展建议

1. 增加 POI 检索与逆地理编码服务。
2. 增加轨迹记录和导航引导模块。
3. 使用 Zustand/Redux 管理地图状态。
4. 接入你的后端服务（收藏点、路线规划、用户数据）。

## 智能建筑识别功能

- 首页新增“智能识别建筑”入口。
- 支持相册上传和拍照识别。
- 识别流程：图片 -> YOLO 接口 -> 标签解析 -> 建筑类型匹配。

接口约定：

- 默认以 `POST` + `application/json` 调用 `EXPO_PUBLIC_YOLO_ENDPOINT`。
- 请求体字段：`image`(base64)、`confidence`、`overlap`、`api_key`。
- 响应需要包含 `predictions` 或 `detections` 数组，元素需含 `class/class_name/name` 与 `confidence`。
