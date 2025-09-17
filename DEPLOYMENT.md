# GitHub 自动化部署配置

## 配置说明

本项目已配置为使用 GitHub Actions 自动部署到 GitHub Pages。每当推送代码到 `main` 分支时，都会自动触发构建和部署流程。

## GitHub Pages 设置步骤

1. **访问仓库设置**
   - 进入 GitHub 仓库页面
   - 点击 "Settings" 选项卡

2. **配置 Pages 设置**
   - 在左侧菜单中找到 "Pages"
   - 在 "Source" 部分选择 "GitHub Actions"
   - 保存设置

3. **推送代码**
   - 将本地代码推送到 GitHub 的 `main` 分支
   - GitHub Actions 会自动开始构建和部署流程

4. **查看部署状态**
   - 在仓库的 "Actions" 选项卡中可以查看部署进度
   - 部署成功后，网站将在 `https://CoKoii.github.io/YJJSQ/` 访问

## 本地开发命令

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产构建
pnpm preview

# 构建并预览（用于本地测试部署）
pnpm run deploy:preview
```

## 文件说明

- `.github/workflows/deploy.yml` - GitHub Actions 工作流配置
- `vite.config.js` - 已配置 GitHub Pages 的 base 路径
- `package.json` - 添加了部署相关的脚本命令

## 注意事项

1. 确保仓库是公开的（Public），或者有 GitHub Pro/Teams 账户
2. 第一次部署可能需要几分钟时间
3. 每次推送到 `main` 分支都会触发重新部署
4. 可以在 Actions 页面手动触发部署

## 故障排除

如果部署失败：

1. 检查 Actions 页面的错误日志
2. 确保所有依赖都在 `package.json` 中正确声明
3. 确认构建命令 `pnpm build` 在本地能正常运行
4. 检查 GitHub Pages 设置是否正确配置
