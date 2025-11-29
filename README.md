# ShaneShark · Full Stack Portal

欢迎来到 ShaneShark。仓库里现在有 **前端 (`frontend/`) React 站点** 和 **后端 (`backend/`) Spring Boot API**。这个 README 是整份“说明书”——只要跟着它，你就能在本地启动、修改、并把新版应用部署到服务器或 GitHub Pages。

---

## 目录速览

```
ShaneShark/
├─ frontend/        # React 18 + Vite + Tailwind + Zustand + GSAP
├─ backend/         # Spring Boot 3 + Maven + Dockerfile
└─ .github/workflows/
   ├─ ci.yml                # 前后端统一 CI
   ├─ deploy.yml            # 前端部署到 GitHub Pages
   └─ backend-deploy.yml    # 后端 Docker 化并发布到服务器
```

---

## 前端：React 18 + Vite

| 项 | 说明 |
| --- | --- |
| 技术 | React 18、TypeScript、Vite 5、Tailwind CSS、Zustand、GSAP |
| 启动 | `cd frontend && npm install && npm run dev`（默认 http://localhost:5173） |
| 构建 | `npm run build`（会自动跑 `tsc -b` + `vite build`） |
| 代码结构 | 详见 `frontend/README.md`（组件、store、动画、主题均整理完毕） |
| 产物 | `frontend/dist` 被上传到 GitHub Pages，URL 见 workflow 输出 |

> 小贴士：所有个人信息都集中在 `frontend/src/store/profile-data.ts`，替换里面的文案就能改整站内容。

---

## 后端：Spring Boot

| 项 | 说明 |
| --- | --- |
| 技术 | Spring Boot 3、Maven、MySQL（见 `backend/sql/`） |
| 启动 | `cd backend && ./mvnw spring-boot:run`（或 `mvn spring-boot:run`） |
| 构建 | `mvn -B -ntp clean package` 会输出 `backend/target/*.jar` |
| 部署 | CI 会自动构建 JAR 并通过 SCP 传输到服务器，使用 systemd 服务管理 |
| 端口 | 默认 `8121`，可在 workflow `env.APP_PORT` 调整 |

> 数据库脚本位于 `backend/sql/`，先执行 `create_table.sql` 再导入其他基础数据。

### 后端环境变量

1. 复制示例：`cp backend/.env-example backend/.env`。
2. 打开 `backend/.env`，把数据库、邮件、AI Key 等信息填入（该文件已在 `.gitignore` 中，不会被提交）。
3. `Spring Boot` 会通过 `spring.config.import` 自动加载同目录下的 `.env`，因此只要在本地或服务器启动前确保 `.env` 与项目根目录/运行目录同级即可。生产服务器当前固定存放在 `/root/envFiles/.env`，供 systemd 服务以 `EnvironmentFile` 方式读取。
4. 服务器部署（自动完成）：
   - CI 会自动将 JAR 文件传输到 `/opt/shaneshark/app.jar`
   - 自动创建 systemd 服务文件 `/etc/systemd/system/shaneshark-backend.service`
   - 服务会自动读取 `/root/envFiles/.env` 环境变量文件
   - 服务会自动启动并设置为开机自启

这样无论本地还是服务器都只需要维护 `.env`，就能在运行时读取敏感配置。

### 验证码邮件模板

- 位置：`backend/src/main/resources/templates/verification-email.html`
- 风格：深色玻璃拟态 + Shane 个人品牌（ShaneShark 标识、个人签名）
- 用法：模板内部包含 `{{VERIFICATION_CODE}}` 占位符，后端在渲染模板时会自动注入实际验证码
- 自定义：如需调整色彩或文案，只需修改 CSS 变量或 `.header` / `.footer` 文本即可，无需改动后端逻辑

> 该模板已经针对移动端做自适应处理，同时强化了安全提醒文案，方便你在个人博客场景下直接使用。

---

## CI/CD 总览

| Workflow | 触发场景 | 作用 |
| --- | --- | --- |
| `ci.yml` | push / PR 到 `main` 或 `master` | 前端：`npm ci` → `eslint` → `tsc --noEmit` → `vite build`；后端：`mvn clean verify`；都会上传构建产物（`frontend-dist`、`backend-jar`） |
| `deploy.yml` | push `frontend/**` 或手动触发 | 在 Linux Runner 里构建前端并部署到 GitHub Pages |
| `backend-deploy.yml` | push `backend/**` 或手动触发 | 构建 Spring Boot JAR → SCP 传输到服务器 → 使用 systemd 服务管理并重启应用 |

### 必备 Secrets

| Secret | 用途 |
| --- | --- |
| `SSH_PRIVATE_KEY` | 部署服务器的私钥（建议只给出部署用账号权限） |
| `SERVER_HOST` | 服务器公网 IP 或域名 |
| `SERVER_USER` | SSH 登录用户（例如 `root` 或 `deploy`） |

> **注意**：服务器需要安装 Java 17 和 systemd。部署脚本会自动创建 systemd 服务文件，应用会以服务形式运行，支持自动重启。

---

## 快速部署步骤

1. **准备 Secrets**（上面列表）并在仓库 Settings → Secrets & variables → Actions 中填写。
2. **首发前端**：Push 到 `main`（或在 Actions 里手动 Dispatch `Deploy Frontend to GitHub Pages`）。稍等片刻即可在仓库 Pages 面板看到访问地址。
3. **首发后端**：Push `backend/**`，`Deploy Backend to Server` workflow 会自动：
   - 用 Maven 打包 JAR
   - 通过 SCP 将 JAR 文件传输到服务器的 `/opt/shaneshark/app.jar`
   - SSH 到服务器，停止旧进程，创建/更新 systemd 服务，并启动应用
4. **日常更新**：正常提交并推送即可。CI 会先验证代码，通过后相应部署流程才会执行。

---

## 常见问题

- **我想换服务器端口**：改 `backend-deploy.yml` 里的 `env.APP_PORT`，同时记得在服务器安全组里开放对应端口，并更新 `application.yml` 中的 `server.port`。
- **查看应用日志**：在服务器上执行 `journalctl -u shaneshark-backend -f` 查看实时日志，或 `journalctl -u shaneshark-backend -n 100` 查看最近 100 条日志。
- **手动管理服务**：`sudo systemctl start/stop/restart/status shaneshark-backend` 来管理服务。
- **前端要自定义域名**：部署完毕后，在仓库 `Settings → Pages` 中绑定 CNAME，或直接在 `frontend/public` 新增 `CNAME` 文件以便 workflow 打包。

---

## 下一步（建议）

- [ ] `frontend/src` 增加 Vitest + Testing Library，直接接入 `ci.yml`
- [ ] 把 `backend` 部署脚本拆成服务器上的 `deploy.sh`，workflow 只需调用一个脚本，方便权限控制
- [ ] 接入日志与性能监控（前端可用 Vercel Analytics / backend 可用 Spring Boot Actuator + Prometheus）

祝你开发顺利！如果遇到不确定的地方，直接告诉我“哪里卡住了”，我会帮你一起补完。***

