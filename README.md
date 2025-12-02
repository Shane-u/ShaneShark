<div align="center">

  <h1>ShaneShark · 全栈个人门户</h1>

  <img src="https://img.shields.io/badge/Frontend-React%2018-blue.svg" alt="React 18" />
  <img src="https://img.shields.io/badge/Build-Vite%205-brightgreen.svg" alt="Vite" />
  <img src="https://img.shields.io/badge/Style-TailwindCSS-38bdf8.svg" alt="TailwindCSS" />
  <img src="https://img.shields.io/badge/State-Zustand-8b5cf6.svg" alt="Zustand" />
  <img src="https://img.shields.io/badge/Backend-Spring%20Boot%203-orange.svg" alt="Spring Boot 3" />
  <img src="https://img.shields.io/badge/DB-SQLite-blue.svg" alt="SQLite" />

</div>

<div align="center">

  <p>🦈 个人主页 + 博客内容 + QA 知识库的全栈门户项目</p>
  <p>💡 前端动画丰富、后端接口完善，适合作为个人展示站或学习项目模板</p>

</div>

---

## 🚀 项目简介

**ShaneShark** 是一个前后端分离的个人门户 / 博客项目，提供：

- 主页与个人品牌展示
- 卡片式内容展示（项目 / 博客 / 推荐）
- QA 知识库模块（问题管理、富文本答案、标签筛选）
- 基于 Spring Boot 的统一 `/api` 后端接口

本 README 只包含**项目功能介绍与基础使用方式**，不会记录任何服务器地址、账号口令等隐私信息，也不会当作开发日志使用。

---

## 🎯 核心亮点

- **前后端分离**：React 18 + Vite 前端，Spring Boot 3 后端，结构清晰
- **现代前端体验**：Tailwind CSS + 动效库（如 GSAP），支持响应式布局和动画
- **可配置内容**：个人信息与大部分文案集中在前端数据文件中，方便快速定制
- **QA 知识库**：支持标签筛选、富文本答案、推荐区块与后台管理
- **标准化接口**：后端提供规范化 REST API，可进一步对接移动端 / 其他前端

---

## 🧱 技术选型（简要）

| 模块     | 技术栈                                   | 说明                     |
|----------|------------------------------------------|--------------------------|
| 前端     | React 18、TypeScript、Vite、TailwindCSS、Zustand | 单页应用 + 状态管理        |
| 动效     | 动画库（如 GSAP、Magic UI 等）            | 页面转场与组件动画        |
| 后端     | Spring Boot 3、Maven                     | REST API 服务            |
| 数据库   | SQLite                                   | 主业务与 QA 模块数据存储（文件数据库）  |
| CI / 构建 | GitHub Actions                          | 自动构建与基础检查        |

---

## 📁 目录结构

```text
ShaneShark/
├─ frontend/              # 前端单页应用（SPA）
├─ backend/               # 后端 REST API 服务
└─ .github/workflows/     # CI / 构建配置
```

---

## ⚙️ 快速开始

### 前端启动（`frontend/`）

**环境要求：**

- Node.js（推荐 18+）
- npm / pnpm / yarn（本说明示例使用 npm）

**本地运行：**

```bash
cd frontend
npm install
npm run dev
```

浏览器访问终端输出的开发地址（通常为 `http://localhost:5173`）。

**构建生产包：**

```bash
cd frontend
npm run build
```

构建产物默认输出到 `frontend/dist`，可部署到任意静态托管平台（如 GitHub Pages 等）。

> 提示：站点的大部分文案和个人信息集中在 `frontend/src/store/profile-data.ts`，修改该文件即可快速定制你的主页内容。

---

### 后端启动（`backend/`）

**环境要求：**

- JDK 17+
- Maven
- SQLite（无需单独安装，Java 应用已包含 SQLite JDBC 驱动）

**准备数据库：**

- SQLite 数据库文件位于 `backend/data/qa.db`
- 应用启动时会自动检查并创建表结构（如果表不存在）
- 也可以手动执行 `backend/sql/create_qa_table.sql` 创建表结构

**配置应用：**

- 在 `backend` 中配置基础配置（例如 `application.yml` 或 `.env`）
- SQLite 数据库路径可通过环境变量 `SQLITE_DB_PATH` 配置，默认为 `./data/qa.db`
- 注意：项目已禁用 MySQL，所有数据存储在 SQLite 文件中

**本地运行：**

```bash
cd backend
./mvnw spring-boot:run    # 或 mvn spring-boot:run
```

**打包构建：**

```bash
cd backend
mvn -B -ntp clean package
```

打包后会在 `backend/target` 目录生成 JAR 文件，可根据自己的习惯采用 systemd、Docker 或云平台进行部署。

---

## 📚 QA 知识库模块

项目内集成了一个 **QA 知识库模块**，用于管理与展示问答内容，适合记录学习笔记、面试题、日常问题等。

- **主要能力：**
  - QA 卡片展示（支持 PC / 移动端响应式）
  - 标签筛选与分类浏览
  - 每日推荐 / 精选展示区块
  - 后台管理（新增 / 编辑 / 删除 QA）
  - 基于语雀 Lake 文档格式 `text/lake` 的富文本编辑与阅读，前端通过 `public/vendor` 中的 `lakex`/`antd`/`react` 静态资源懒加载阅读器，请在部署静态资源时保留 `vendor/` 目录以确保 `/qa/detail` 独立预览页可正常渲染

- **典型访问路径（示例）：**
  - QA 列表页：`/#/qa`
  - QA 详情页：`/#/qa/{id}`
  - QA 编辑页：`/#/qa/edit/{id}` 或 `/#/qa/edit/new`

QA 数据存储在 SQLite 数据库文件 `backend/data/qa.db` 的 `qa_info` 表中，建表 SQL 位于 `backend/sql` 目录，字段与索引结构可直接参考对应 SQL 文件。应用启动时会自动检查并创建表结构。

---

## 🤖 CI / 自动化概览

仓库内包含 GitHub Actions 配置，用于：

- **前端自动部署**：推送到 `main/master` 分支时自动构建并部署到 GitHub Pages
- **前端服务器部署**：推送到 `main/master` 分支时自动构建并将静态资源发布到 `154.201.70.202`（`frontend-deploy-server.yml`）
- **后端自动部署**：推送到 `main/master` 分支时自动构建并部署到服务器
- 详细的部署说明请参考：[部署文档](./docs/DEPLOYMENT.md)

> 与服务器、密钥、口令相关的配置，**建议使用 GitHub Secrets 或其他安全方式管理**，不要写入 README 或提交到代码库中。

### 前端服务器部署（154.201.70.202）

- Workflow：`.github/workflows/frontend-deploy-server.yml`
- 触发方式：推送 `frontend/**` 或手动 `workflow_dispatch`
- 默认部署目录：`/var/www/shaneshark_frontend`（`html/` 子目录作为 Nginx 根目录）
- 需要配置的 Secrets：
  - `FRONTEND_SERVER_USER`：SSH 登录用户名（建议为具备部署权限的非 root 用户）
  - `FRONTEND_SSH_PRIVATE_KEY`：对应用户的私钥（OpenSSH PEM 格式）
  - `FRONTEND_API_BASE_URL`：生产环境 API 地址（会作为 `VITE_API_BASE_URL` 注入构建）
- 运行流程：
  1. 构建 `frontend` 并生成 `dist`
  2. 将构建产物打包为 `shaneshark-frontend-dist.tar.gz`
  3. 通过 SSH 将压缩包上传到 `154.201.70.202:/tmp`
  4. 在服务器 `/var/www/shaneshark_frontend` 下解压至 `releases/<timestamp>` 并更新 `current`、`html` 目录
  5. 尝试自动 `reload` Nginx（若服务器存在 `systemctl nginx`）
- 如果服务器未安装 `rsync`，脚本会自动 fallback 为 `cp -R`，无需额外手动操作。

---

## 🔐 安全与隐私建议

- 不在公开文档中记录：
  - 服务器 IP / 域名
  - 登录账号 / 私钥 / 明文密码
  - 管理员口令、Token、API Key 等
- 推荐做法：
  - 使用环境变量、`.env` 文件或 CI/CD 平台的 Secrets 存储敏感信息
  - 将详细运维步骤放在自己的私密文档中维护

---

## 👨‍💻 维护者

| 姓名  | 角色       |
|-------|------------|
| Shane | 项目开发者 |

欢迎通过 Issue / PR 等方式参与改进本项目。

---

## 📄 License

本项目保持开源精神，允许在遵守原有协议的前提下自由使用与二次开发。你可以将它作为自己的个人主页模板、学习项目或简历作品展示工程。 

