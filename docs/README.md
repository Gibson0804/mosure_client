# Mosure Client 文档总览

## 项目定位

**Mosure Client** 是 Mosure 主项目的移动管理端，面向管理员、运营与项目成员，提供“移动端可完成核心管理动作”的能力。

## 技术栈

- `uni-app` + `Vue 3`
- `Pinia`
- `uni.request`（统一请求封装）
- 后端接口基于 `/{server}/client/*`

## 功能范围

- 登录与服务器管理
- 项目列表与前端入口
- AI 会话与消息流
- 内容模型与内容查看
- 云函数与定时任务查询
- 知识库分类与文章管理

## 文档清单

| 文档 | 说明 |
|---|---|
| [PRD](./PRD.md) | 产品目标、范围、版本计划 |
| [modules.md](./modules.md) | 各模块职责、状态与核心流程 |
| [pages.md](./pages.md) | 页面清单、路由与关键交互 |
| [api.md](./api.md) | API 分组与字段约定 |
| [data.md](./data.md) | 本地存储、状态结构、实体模型 |

## 维护约定

- 主项目命名统一使用 `Mosure`。
- 示例配置、展示文案、存储 key 约定统一使用 `mosure_*`。
