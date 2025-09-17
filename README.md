# YJJSQ - 基金跟投计算系统

[![Deploy to GitHub Pages](https://github.com/CoKoii/YJJSQ/actions/workflows/deploy.yml/badge.svg)](https://github.com/CoKoii/YJJSQ/actions/workflows/deploy.yml)

一个基于 Vue 3 + Ant Design Vue 开发的基金跟投比例计算工具，帮助用户根据大佬的投资配置计算自己的跟投金额和比例。

## 功能特性

- 📊 **仓位总览** - 实时显示大佬总仓位、个人总仓位和比例关系
- 📈 **持仓明细** - 详细管理每个基金的投资信息
- ⚡ **自动计算** - 根据大佬投资比例自动计算个人应投金额
- 💾 **数据持久化** - 自动保存数据到本地存储
- 📁 **配置导入导出** - 支持JSON格式的配置备份和迁移
- 🎨 **现代化UI** - 使用Ant Design Vue组件库，界面美观易用

## 使用说明

### 基本概念

- **大佬总仓位**：跟投目标的总投资金额
- **我的总仓位**：个人的总投资金额
- **仓位占比**：大佬每个基金投资占其总仓位的百分比
- **跟投比例**：个人总仓位与大佬总仓位的比例关系

### 操作流程

#### 1. 设置基础信息

在顶部表单中输入：

- **大佬总仓位**：输入跟投目标的总投资金额
- **我的总仓位**：输入您的总投资金额
- 系统会自动计算比例关系

#### 2. 添加基金持仓

点击"新增"按钮，填写基金信息：

- **基金名称**：基金的完整名称
- **基金代码**：6位基金代码
- **大佬持仓金额**：该基金在大佬投资组合中的金额
- **我目前投入**：您在该基金上的实际投入金额

#### 3. 查看计算结果

系统会自动计算：

- **占比**：该基金在大佬投资组合中的占比
- **我应投入**：根据您的总仓位和比例关系计算的应投金额
- **我的投入占比**：该基金在您投资组合中的实际占比

#### 4. 数据管理

- **编辑**：点击表格中的"编辑"按钮修改基金信息
- **删除**：点击"删除"按钮移除基金记录
- **导出配置**：将当前配置导出为JSON文件
- **导入配置**：上传JSON文件恢复之前的配置

### 使用技巧

1. **颜色提示**
   - 红色金额：表示您的投入低于建议金额
   - 普通颜色：表示投入正常

2. **数据备份**
   - 定期使用"导出配置"功能备份数据
   - 可在不同设备间通过导入导出功能同步数据

3. **精确计算**
   - 支持小数点后两位的精确计算
   - 自动格式化大额数字显示（千分位分隔符）

## 技术栈

- **前端框架**：Vue 3 (Composition API)
- **UI组件库**：Ant Design Vue 4.x
- **状态管理**：Pinia + 持久化插件
- **构建工具**：Vite
- **代码规范**：ESLint + Prettier

## 开发环境要求

- Node.js >= 20.19.0 或 >= 22.12.0
- pnpm (推荐) 或 npm

## 推荐IDE配置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (需禁用 Vetur 插件)

## 项目配置

更多配置选项请参考 [Vite Configuration Reference](https://vite.dev/config/)

## Project Setup

## 安装依赖

```sh
pnpm install
```

### 开发模式（热重载）

```sh
pnpm dev
```

访问 `http://localhost:5173` 查看应用

### 生产构建

```sh
pnpm build
```

### 预览生产构建

```sh
pnpm preview
```

### 代码检查和格式化

```sh
# ESLint 检查并自动修复
pnpm lint

# Prettier 格式化代码
pnpm format
```

### 生产环境构建

```sh
pnpm build:prod
```

### 构建并预览

```sh
pnpm deploy:preview
```

## 部署说明

### GitHub Pages 自动部署

本项目配置了 GitHub Actions 自动部署到 GitHub Pages。当推送代码到 `main` 分支时，会自动触发构建和部署流程。

#### 部署问题排查

如果遇到部署失败，常见原因和解决方案：

1. **Action 版本过时**

   ```yaml
   # 错误：使用已弃用的版本
   uses: actions/upload-pages-artifact@v2

   # 正确：使用最新版本
   uses: actions/upload-pages-artifact@v3
   ```

2. **权限配置**
   - 确保仓库设置中启用了 GitHub Pages
   - 检查 Actions 权限设置允许读写

3. **构建失败**
   - 检查 Node.js 版本兼容性
   - 确认依赖安装成功
   - 验证构建命令正确

#### 手动部署

如果自动部署失败，可以手动部署：

```sh
# 1. 构建项目
pnpm build

# 2. 将 dist 目录内容上传到 GitHub Pages
# 或使用 gh-pages 工具
npm install -g gh-pages
gh-pages -d dist
```

### 本地部署测试

```sh
# 构建并在本地预览生产版本
pnpm build && pnpm preview
```

## 许可证

本项目采用 MIT 许可证。
