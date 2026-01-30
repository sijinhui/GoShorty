# GoShorty - Go语言短链接服务

GoShorty是一个使用Go语言开发的高性能短链接服务，类似于YOURLS，提供完整的链接管理和统计功能。

## 特性

- ✅ **短链接生成** - 支持自动生成和自定义短码
- ✅ **链接管理** - 完整的CRUD操作和批量管理
- ✅ **访问统计** - 详细的点击统计、访问日志、地理位置分析
- ✅ **用户认证** - 基于Session的管理后台认证
- ✅ **管理后台** - 使用HTMX的现代化管理界面
- ✅ **插件系统** - 可扩展的插件架构
- ✅ **自动过期** - 默认7天过期策略（可配置）
- ✅ **安全字符集** - 移除易混淆字符，提高可读性

## 技术栈

- **语言**: Go 1.25+
- **Web框架**: Gin v1.9+
- **数据库**: PostgreSQL 14+
- **数据库驱动**: pgx v5.5+
- **前端**: HTMX + Tailwind CSS
- **日志**: Zap
- **配置**: Viper

## 快速开始

### 前置要求

- Go 1.25或更高版本
- PostgreSQL 14或更高版本
- Make（可选）

### 安装

1. 克隆仓库
```bash
git clone https://github.com/yourusername/goshorty.git
cd goshorty
```

2. 安装依赖
```bash
go mod download
```

3. 配置环境变量
```bash
cp .env.example .env
# 编辑.env文件，配置数据库连接等信息
```

4. 运行数据库迁移
```bash
go run scripts/migrate/main.go
```

5. 创建管理员账号
```bash
go run scripts/create_admin/main.go -username admin -password yourpassword
```

6. 启动服务
```bash
go run cmd/server/main.go
```

服务将在 `http://localhost:8800` 启动。

## 配置

主要配置项（.env文件）：

```env
# 服务器配置
SERVER_HOST=0.0.0.0
SERVER_PORT=8800

# 数据库配置
DB_HOST=localhost
DB_PORT=5432
DB_USER=goshorty
DB_PASSWORD=your_password
DB_NAME=goshorty

# 会话配置
SESSION_SECRET=your_secret_key
SESSION_MAX_AGE=86400

# 日志配置
LOG_LEVEL=info
```

## 使用说明

### 管理后台

访问 `http://localhost:8800/admin/login` 登录管理后台。

**功能：**
- 📊 仪表盘 - 查看统计数据和快速创建链接
- 🔗 链接管理 - 管理所有短链接
- 📈 统计分析 - 查看详细的访问统计

### 创建短链接

1. 登录管理后台
2. 在仪表盘输入原始链接
3. 可选：自定义短码、标题、过期时间
4. 点击"创建短链接"

### 访问短链接

直接访问 `http://localhost:8800/{短码}` 即可跳转到原始链接。

## 定时任务

### 清理过期链接

```bash
go run scripts/cleanup_expired/main.go
```

### 清理过期会话

```bash
go run scripts/cleanup_sessions/main.go
```

建议使用cron定时执行：
```cron
# 每天凌晨2点清理过期链接
0 2 * * * cd /path/to/goshorty && go run scripts/cleanup_expired/main.go

# 每天凌晨3点清理过期会话
0 3 * * * cd /path/to/goshorty && go run scripts/cleanup_sessions/main.go
```

## 项目结构

```
GoShorty/
├── cmd/server/          # 应用入口
├── internal/            # 内部包
│   ├── config/         # 配置管理
│   ├── database/       # 数据库连接
│   ├── domain/         # 领域模型
│   ├── handler/        # HTTP处理器
│   ├── plugin/         # 插件系统
│   ├── repository/     # 数据访问层
│   └── service/        # 业务逻辑层
├── pkg/                # 公共包
│   ├── geolocation/    # 地理位置解析
│   └── validator/      # 验证器
├── plugins/            # 插件实现
│   └── expiration/     # 过期策略插件
├── scripts/            # 工具脚本
├── web/                # Web资源
│   ├── templates/      # HTML模板
│   └── static/         # 静态文件
└── README.md
```

## 开发

### 编译

```bash
go build -o bin/goshorty ./cmd/server
```

### 运行测试

```bash
go test ./...
```

## 部署

详见 Docker 部署说明（见下文）。

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！
