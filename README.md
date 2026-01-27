# EasyExp - 简易支出追踪应用

<div align="center">
  <img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=A%20clean%20modern%20finance%20tracking%20app%20dashboard%20with%20statistics%20cards%20and%20expense%20list&image_size=landscape_16_9" alt="EasyExp Dashboard" width="800" />
</div>

## 📋 项目简介

EasyExp 是一款基于 Next.js 和 MongoDB 开发的简易支出追踪应用，帮助用户轻松管理个人支出、追踪报销状态并生成统计报表。

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

| 类别 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Next.js | 16.1.5 |
| 样式方案 | Tailwind CSS | - |
| 数据库 | MongoDB | - |
| 认证方案 | JWT | - |
| 密码加密 | bcrypt | - |
| Excel 处理 | xlsx | - |
| 部署平台 | Vercel / Netlify / Cloudflare Pages | - |

## 🚀 快速开始

### 开发环境

1. **克隆仓库**
   ```bash
   git clone <your-repository-url>
   cd MiniLedger
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   创建 `.env.local` 文件并添加以下内容：
   ```env
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret-key>
   ```

4. **启动开发服务器**
   ```bash
   npm run dev
   ```

5. **访问应用**
   打开浏览器访问 `http://localhost:3000`

### 生产构建

```bash
npm run build
npm start
```

## 📦 部署指南

### Vercel 部署

1. **创建 Vercel 账号**
   访问 [Vercel 官网](https://vercel.com/) 注册/登录

2. **导入项目**
   - 点击 "New Project"
   - 选择 "Import from Git Repository"
   - 连接 GitHub 账号并选择 EasyExp 仓库

3. **配置项目**
   - Framework Preset: Next.js
   - 构建命令: 默认 (`next build`)
   - 输出目录: 默认 (`.next`)

4. **设置环境变量**
   - `MONGODB_URI`: MongoDB Atlas 连接字符串
   - `JWT_SECRET`: 自定义 JWT 密钥

5. **部署项目**
   - 点击 "Deploy" 按钮
   - 等待部署完成

### Netlify 部署

1. **创建 Netlify 账号**
   访问 [Netlify 官网](https://www.netlify.com/) 注册/登录

2. **导入项目**
   - 点击 "Add new site" → "Import an existing project"
   - 连接 GitHub 账号并选择 EasyExp 仓库

3. **配置项目**
   - 构建命令: `npm run build`
   - 发布目录: `.next`

4. **设置环境变量**
   - `MONGODB_URI`: MongoDB Atlas 连接字符串
   - `JWT_SECRET`: 自定义 JWT 密钥

5. **部署项目**
   - 点击 "Deploy site" 按钮
   - 等待部署完成

### Cloudflare Pages 部署

1. **创建 Cloudflare 账号**
   访问 [Cloudflare 官网](https://www.cloudflare.com/) 注册/登录

2. **导入项目**
   - 点击 "Workers & Pages" → "Create application" → "Pages"
   - 连接 GitHub 账号并选择 EasyExp 仓库

3. **配置项目**
   - 构建命令: `npm run build`
   - 构建输出目录: `.next`

4. **设置环境变量**
   - `MONGODB_URI`: MongoDB Atlas 连接字符串
   - `JWT_SECRET`: 自定义 JWT 密钥

5. **部署项目**
   - 点击 "Save and Deploy" 按钮
   - 等待部署完成

## 📁 项目结构

```
MiniLedger/
├── app/
│   ├── api/
│   │   ├── auth/           # 认证相关 API
│   │   ├── config/         # 配置管理 API
│   │   └── expenses/       # 支出管理 API
│   ├── add-expense/        # 添加支出页面
│   ├── edit-expense/       # 编辑支出页面
│   ├── settings/           # 设置页面
│   ├── page.tsx            # 首页（统计和支出列表）
│   └── layout.tsx          # 全局布局
├── lib/
│   ├── auth.ts             # 认证中间件
│   ├── authContext.tsx     # 认证上下文
│   ├── jwt.ts              # JWT 工具
│   └── mongodb.ts          # MongoDB 连接
├── public/                 # 静态资源
├── package.json            # 项目配置
├── tsconfig.json           # TypeScript 配置
└── README.md               # 项目文档
```

## 🔧 环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `MONGODB_URI` | MongoDB Atlas 连接字符串 | `mongodb+srv://username:password@cluster0.mongodb.net/EasyExp?retryWrites=true&w=majority` |
| `JWT_SECRET` | JWT 签名密钥 | `your-secret-key-here` |

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

- **密码加密**：使用 bcrypt 对密码进行加密存储
- **JWT 认证**：使用 JSON Web Token 进行无状态认证
- **API 保护**：所有 API 端点都有认证中间件保护
- **输入验证**：对所有用户输入进行验证
- **CORS 配置**：正确配置跨域资源共享

## 🤝 贡献

欢迎提交 Issue 和 Pull Request 来改进这个项目！

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件

## 📞 联系

如果您有任何问题或建议，请随时联系我们。

---

<div align="center">
  <p>Made with ❤️ using Next.js and MongoDB</p>
</div>