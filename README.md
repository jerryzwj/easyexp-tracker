# EasyExp - 简易支出追踪应用

<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20clean%20modern%20finance%20tracking%20app%20dashboard%20with%20statistics%20cards%20and%20expense%20list&image_size=landscape_16_9" alt="EasyExp Dashboard" width="800" />
</div>

## 📋 项目简介

EasyExp 是一款基于 Next.js 和 Cloudflare D1 数据库开发的简易支出追踪应用，帮助用户轻松管理个人支出、追踪报销状态并生成统计报表。项目部署在 Cloudflare Pages 上，利用 Edge Runtime 实现全球边缘节点加速。

## ✨ 功能特性

### 核心功能
- **用户认证**：注册、登录、密码修改
- **支出管理**：添加、编辑、删除支出记录
- **报销追踪**：支持多种报销状态，记录报销金额
- **统计分析**：支出总额、待报销金额、已报销金额、收支差额
- **数据筛选**：按日期范围、报销类型、支付类型筛选
- **Excel 导出**：导出支出记录为 Excel 文件
- **自定义类型**：支持自定义报销类型和支付类型

### 用户体验
- **响应式设计**：适配桌面和移动设备
- **实时数据**：自动更新统计数据
- **分页加载**：优化性能，支持大量数据
- **直观界面**：清晰的卡片式布局和状态标签

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Next.js 16.1.5 | App Router + Edge Runtime |
| 样式方案 | Tailwind CSS 3.4 | 原子化 CSS |
| 数据库 | Cloudflare D1 | 边缘 SQLite 数据库 |
| 部署平台 | Cloudflare Pages | 全球边缘网络 |
| 构建适配器 | @opennextjs/cloudflare | Next.js → Workers 转换 |
| 认证方案 | JWT (HMAC-SHA256) | 基于 Web Crypto API |
| 密码加密 | PBKDF2 | 基于 Web Crypto API |
| Excel 处理 | xlsx | SheetJS |
| 运行时 | Edge Runtime | 全球低延迟 |

## 🚀 部署指南（全控制台操作，无需本地终端）

只需 4 步即可完成部署，全程在 Cloudflare 控制台操作。

### 第 1 步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1** → **Create database**
3. 数据库名称填写 `easyexp-db`，点击创建
4. 创建完成后，进入数据库详情页，点击 **Query** 标签
5. 复制 [migrations/0001_initial_schema.sql](migrations/0001_initial_schema.sql) 的全部内容，粘贴到查询框中执行，完成建表

### 第 2 步：连接 GitHub 创建 Pages 项目

1. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
2. 授权并选择你的 GitHub 仓库（`easyexp-tracker`）
3. 配置构建设置：
   - **Framework preset**：None
   - **Build command**：`npm install --legacy-peer-deps && npm run build:cloudflare`
   - **Build output directory**：`.cloudflare/dist`
4. 展开 **Environment variables (advanced)**，添加：
   - `JWT_SECRET` = 你的 JWT 签名密钥（建议 32 位以上随机字符串）
5. 点击 **Save and Deploy**（首次部署可能因未绑定数据库而报错，这是正常的，继续下一步）

### 第 3 步：绑定 D1 数据库

1. 进入刚创建的 Pages 项目 → **Settings** → **Functions**
2. 找到 **D1 database bindings**，点击 **Add binding**
3. 配置绑定：
   - **Variable name**：`DB`
   - **D1 database**：选择第 1 步创建的 `easyexp-db`
4. 同时确保 **Compatibility date** 设为 `2024-01-01` 或更晚，并添加兼容性标志 `nodejs_compat`
5. 保存配置

### 第 4 步：重新部署

1. 进入 Pages 项目 → **Deployments**
2. 找到最新的部署记录，点击 **Retry deployment**（或推送一次代码到 GitHub 触发自动部署）
3. 等待部署完成，访问分配的 `*.pages.dev` 域名即可使用

完成！🎉 之后每次推送到 GitHub 主分支，Cloudflare 将自动构建部署。

---

## 💻 本地开发（可选）

如需本地开发调试：

```bash
# 1. 安装依赖
npm install --legacy-peer-deps

# 2. 创建本地 D1 数据库并获取 database_id
npx wrangler d1 create easyexp-db
# 将返回的 database_id 加入 wrangler.toml 的 d1_databases 配置

# 3. 执行本地迁移
npm run d1:migrate:local

# 4. 启动开发服务器
npm run dev
```

本地开发时需在 [wrangler.toml](wrangler.toml) 中临时添加 D1 配置：
```toml
[[d1_databases]]
binding = "DB"
database_name = "easyexp-db"
database_id = "你的本地-database-id"
```

## 📁 项目结构

```
easyexp-tracker/
├── app/
│   ├── api/
│   │   ├── auth/                  # 认证相关 API
│   │   │   ├── login/             # 登录
│   │   │   ├── register/          # 注册
│   │   │   ├── logout/            # 登出
│   │   │   └── change-password/   # 修改密码
│   │   ├── config/                # 配置管理 API
│   │   └── expenses/              # 支出管理 API
│   │       ├── [id]/              # 单条支出 CRUD
│   │       ├── stats/             # 统计数据
│   │       └── export/            # Excel 导出
│   ├── globals.css                # 全局样式
│   └── layout.tsx                 # 全局布局
├── lib/
│   ├── auth.ts                    # 认证中间件
│   ├── authContext.tsx            # 客户端认证上下文
│   ├── db.ts                      # D1 数据库适配层
│   ├── jwt.ts                     # 服务端 JWT 工具（Web Crypto API）
│   ├── jwt-client.ts              # 客户端 JWT 解码工具
│   └── password.ts                # 密码哈希工具（PBKDF2）
├── migrations/
│   └── 0001_initial_schema.sql    # D1 数据库初始迁移
├── next.config.ts                 # Next.js 配置（含 OpenNext 初始化）
├── wrangler.toml                  # Cloudflare 配置
├── package.json                   # 项目配置
├── tsconfig.json                  # TypeScript 配置
└── README.md                      # 项目文档
```

## 🗄️ 数据库结构

### users 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 用户 ID（UUID） |
| username | TEXT | 用户名（唯一） |
| password | TEXT | 密码哈希（PBKDF2） |
| create_time | TEXT | 创建时间 |

### expenses 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 支出记录 ID（UUID） |
| user_id | TEXT | 用户 ID（外键） |
| amount | REAL | 金额 |
| reimburse_type | TEXT | 报销类型 |
| reimburse_amount | REAL | 报销金额 |
| pay_type | TEXT | 支付类型 |
| date | TEXT | 支出日期 |
| other | TEXT | 备注 |
| create_time | TEXT | 创建时间 |
| update_time | TEXT | 更新时间 |

### configs 表
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 配置 ID（UUID） |
| user_id | TEXT | 用户 ID（外键） |
| type | TEXT | 配置类型（reimburseType / payType） |
| options | TEXT | 配置选项（JSON 数组） |
| update_time | TEXT | 更新时间 |

## 🔧 环境变量与绑定

| 名称 | 类型 | 描述 | 配置位置 |
|------|------|------|----------|
| `DB` | D1 Binding | D1 数据库绑定 | Pages 控制台 → Settings → Functions → D1 database bindings |
| `JWT_SECRET` | 环境变量 | JWT 签名密钥 | Pages 控制台 → Settings → Environment variables |

## 🎨 界面预览

### 首页统计
<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Finance%20dashboard%20with%20statistics%20cards%20showing%20total%20expense%2C%20pending%20reimburse%2C%20reimbursed%2C%20and%20balance&image_size=landscape_16_9" alt="Statistics Dashboard" width="600" />
</div>

### 支出记录
<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Expense%20list%20with%20cards%20showing%20amount%2C%20date%2C%20reimburse%20status%2C%20and%20payment%20type&image_size=landscape_16_9" alt="Expense List" width="600" />
</div>

### 添加支出
<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=Add%20expense%20form%20with%20amount%2C%20reimburse%20type%2C%20payment%20type%2C%20date%2C%20and%20notes%20fields&image_size=portrait_4_3" alt="Add Expense Form" width="400" />
</div>

## 🔒 安全性

- **密码加密**：使用 PBKDF2 算法（10 万次迭代 + SHA-256）对密码进行加密存储，基于 Web Crypto API 实现
- **JWT 认证**：使用 HMAC-SHA256 算法签发 JWT，基于 Web Crypto API 实现，兼容 Edge Runtime
- **API 保护**：所有 API 端点都通过 `withAuth` 中间件保护，验证 Bearer Token
- **输入验证**：对所有用户输入进行类型和长度验证
- **SQL 参数化查询**：D1 数据库全部使用参数化查询，防止 SQL 注入
- **密钥隔离**：JWT 密钥仅存在于服务端，客户端仅解码 payload 不验证签名

## 📜 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 Next.js 开发服务器 |
| `npm run build` | Next.js 标准构建 |
| `npm run lint` | 运行 ESLint 代码检查 |
| `npm run build:cloudflare` | 使用 OpenNext 构建 Cloudflare 产物 |
| `npm run preview:cloudflare` | 本地预览 Cloudflare Workers 运行时 |
| `npm run deploy` | 构建并部署到 Cloudflare Pages |
| `npm run d1:create` | 创建 D1 数据库 |
| `npm run d1:migrate:local` | 应用迁移到本地 D1 |
| `npm run d1:migrate:remote` | 应用迁移到远程 D1 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系

如果您有任何问题或建议，请随时联系我们。

---

<div align="center">
  <p>Made with ❤️ using Next.js and Cloudflare D1</p>
</div>
