# Mosure Client

Mosure Client 是 Mosure 主项目的移动管理端（uni-app + Vue 3），用于在移动设备上完成登录、项目管理、AI 会话、内容浏览、系统监控和知识库管理。

## 当前能力

- 多服务器登录与切换（含历史记录）
- 项目列表与项目上下文切换
- 项目 AI 会话（会话列表、消息轮询、发送消息）
- 内容模型/列表/详情/单页内容查看
- 云函数与定时任务查看
- 知识库分类与文章管理（创建、编辑、发布状态切换）

## 项目结构

```text
api/           # 接口封装
pages/         # 页面
stores/        # Pinia 状态管理
utils/         # 请求、存储、日期等工具
docs/          # 产品/模块/页面/API/数据文档
```

## 文档入口

- [文档总览](./docs/README.md)
- [产品需求](./docs/PRD.md)
- [功能模块](./docs/modules.md)
- [页面设计](./docs/pages.md)
- [接口文档](./docs/api.md)
- [数据结构](./docs/data.md)

## 开发说明

```bash
npm install
```

当前 `package.json` 未配置完整 `dev/build` 脚本，建议通过 HBuilderX 或你们现有构建流程运行。

## 命名说明

- 品牌命名已统一为 `Mosure`。
- 文档命名统一使用 `Mosure`/`mosure`。
