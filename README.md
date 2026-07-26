# EasyExp - 简易支出追踪 API

<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20clean%20modern%20finance%20tracking%20app%20dashboard%20with%20statistics%20cards%20and%20expense%20list&image_size=landscape_16_9" alt="EasyExp Dashboard" width="800" />
</div>

## 📋 项目简介

EasyExp 是一款基于 Cloudflare Workers + D1 数据库开发的简易支出追踪 API 服务，帮助用户轻松管理个人支出、追踪报销状态并生成统计报表。项目部署在 Cloudflare 全球边缘网络，低延迟、高可用。

## ✨ 功能特性

### 核心功能
- **用户认证**：注册、登录、密码修改（JWT）
- **支出管理**：添加、编辑、删除支出记录
- **报销追踪**：支持多种报销状态，记录报销金额
- **统计分析**：支出总额、待报销金额、已报销金额、收支差额
- **数据筛选**：按日期范围、报销类型、支付类型筛选
- **Excel 导出**：导出支出记录为 Excel 文件
- **自定义类型**：支持自定义报销类型和支付类型

## 🛠️ 技术栈

| 类别 | 技术 | 说明 |
|------|------|------|
| 后端框架 | Hono 4.x | 轻量级 Edge 框架 |
| 数据库 | Cloudflare D1 | 边缘 SQLite 数据库 |
| 部署平台 | Cloudflare Workers | 全球边缘网络 |
| 认证方案 | JWT (HMAC-SHA256) | hono/jwt |
| 密码加密 | PBKDF2 | 基于 Web Crypto API |
| Excel 处理 | xlsx | SheetJS |
| 运行时 | Edge Runtime | 全球低延迟 |

## 🚀 部署指南（全控制台操作，无需本地终端）

只需 2 步即可完成部署，全程在 Cloudflare 控制台操作。

### 第 1 步：创建 D1 数据库

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **D1** → **Create database**
3. 数据库名称填写 `easyexp-db`，点击创建
4. 记录下显示的 **Database ID**
5. 进入数据库详情页，点击 **Query** 标签
6. 复制 [migrations/0001_initial_schema.sql](migrations/0001_initial_schema.sql) 的全部内容，粘贴到查询框中执行，完成建表

### 第 2 步：创建 Worker 并部署

1. 进入 **Workers & Pages** → **Create application** → **Workers** → **Create Worker**
2. 输入 Worker 名称（如 `easyexp-tracker`），点击 **Deploy**
3. 进入 Worker 详情页 → **Settings** → **Variables**
4. 在 **D1 Database Bindings** 中点击 **Add binding**：
   - **Variable name**：`DB`
   - **D1 database**：选择第 1 步创建的 `easyexp-db`
5. 在 **Environment Variables** 中点击 **Add variable**：
   - **Variable name**：`JWT_SECRET`
   - **Value**：你的 JWT 签名密钥（建议 32 位以上随机字符串）
   - 点击 **Encrypt** 加密存储
6. 保存配置
7. 回到 Worker 详情页 → **Edit Code**（或使用 CLI 推送代码）

#### 使用 CLI 部署（可选）

```bash
# 1. 克隆仓库
git clone <your-repository-url>
cd easyexp-tracker

# 2. 安装依赖
npm install

# 3. 编辑 wrangler.toml，填入 database_id
# 把 database_id = "your-database-id" 替换为实际 ID

# 4. 登录并部署
npx wrangler login
npm run deploy
```

完成！🎉 部署完成后访问 Worker 的 `*.workers.dev` 域名即可使用 API。

---

## 💻 本地开发

```bash
# 1. 安装依赖
npm install

# 2. 创建本地 D1 数据库
npm run d1:create

# 3. 执行本地迁移
npm run d1:migrate:local

# 4. 启动开发服务器
npm run dev
```

本地开发时需在 [wrangler.toml](wrangler.toml) 中将 `database_id` 替换为实际 ID。

## 🔌 API 文档

### 认证相关

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| POST | `/api/auth/register` | 注册 | 否 |
| POST | `/api/auth/login` | 登录 | 否 |
| POST | `/api/auth/logout` | 登出 | 否 |
| POST | `/api/auth/change-password` | 修改密码 | 是 |

### 支出管理

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/expenses` | 获取支出列表（分页+筛选） | 是 |
| POST | `/api/expenses` | 创建支出记录 | 是 |
| GET | `/api/expenses/:id` | 获取单条支出详情 | 是 |
| PUT | `/api/expenses/:id` | 更新支出记录 | 是 |
| DELETE | `/api/expenses/:id` | 删除支出记录 | 是 |
| GET | `/api/expenses/stats` | 获取统计数据 | 是 |
| GET | `/api/expenses/export` | 导出 Excel | 是 |

### 配置管理

| 方法 | 路径 | 说明 | 鉴权 |
|------|------|------|------|
| GET | `/api/config` | 获取用户配置 | 是 |
| PUT | `/api/config` | 更新用户配置 | 是 |

### 鉴权方式

在请求头中添加：
```
Authorization: Bearer <your-token>
```

## 📁 项目结构

```
easyexp-tracker/
├── src/
│   ├── index.ts              # 主入口，所有路由定义
│   └── utils/
│       └── password.ts       # 密码哈希工具（PBKDF2）
├── migrations/
│   └── 0001_initial_schema.sql  # D1 数据库初始迁移
├── wrangler.toml             # Cloudflare Workers 配置
├── package.json              # 项目配置
├── tsconfig.json             # TypeScript 配置
└── README.md                 # 项目文档
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
| `DB` | D1 Binding | D1 数据库绑定 | Worker → Settings → Variables → D1 Database Bindings |
| `JWT_SECRET` | 环境变量 | JWT 签名密钥 | Worker → Settings → Variables → Environment Variables |

## 🔒 安全性

- **密码加密**：使用 PBKDF2 算法（10 万次迭代 + SHA-256）对密码进行加密存储，基于 Web Crypto API 实现
- **JWT 认证**：使用 HMAC-SHA256 算法签发 JWT，hono/jwt 库验证
- **API 保护**：所有需要登录的 API 端点都通过 JWT 中间件保护
- **输入验证**：对所有用户输入进行类型和长度验证
- **SQL 参数化查询**：D1 数据库全部使用参数化查询，防止 SQL 注入
- **密钥加密存储**：JWT 密钥在 Cloudflare 控制台加密存储

## 📜 常用命令

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动 wrangler 开发服务器 |
| `npm run deploy` | 部署到 Cloudflare Workers |
| `npm run build` | 构建（dry-run） |
| `npm run d1:create` | 创建 D1 数据库 |
| `npm run d1:migrate:local` | 应用迁移到本地 D1 |
| `npm run d1:migrate:remote` | 应用迁移到远程 D1 |

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

---

<div align="center">
  <p>Made with ❤️ using Hono and Cloudflare D1</p>
</div>
