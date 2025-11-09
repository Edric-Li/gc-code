# 代码质量保证工具配置文档

本项目配置了完整的代码质量保证工具链，确保代码规范、一致性和质量。

## 📦 已配置的工具

### 1. ESLint - JavaScript/TypeScript 代码检查

**配置文件**: `eslint.config.js`

**功能**:

- TypeScript 语法检查
- React Hooks 规则检查
- React Fast Refresh 优化
- 自动修复部分问题

**运行命令**:

```bash
# 检查所有文件
npm run lint:eslint

# 自动修复问题
npm run lint:eslint -- --fix
```

**配置亮点**:

- 零警告策略 (`--max-warnings 0`)
- 禁止使用 `any` 类型
- 未使用变量警告（可使用 `_` 前缀忽略）

---

### 2. Stylelint - CSS 样式检查

**配置文件**: `.stylelintrc.json`

**功能**:

- CSS 语法检查
- Tailwind CSS 兼容
- 属性排序建议
- 自动修复格式问题

**运行命令**:

```bash
# 检查 CSS 文件
npm run lint:style

# 自动修复
npm run lint:style -- --fix
```

**配置亮点**:

- 支持 Tailwind CSS 指令 (`@tailwind`, `@apply` 等)
- 允许灵活的命名模式
- 兼容现代和传统 CSS 语法

---

### 3. Prettier - 代码格式化

**配置文件**: `.prettierrc`

**功能**:

- 统一代码格式
- 支持多种文件类型 (TS, TSX, JS, JSX, JSON, CSS, MD)
- 与 ESLint/Stylelint 兼容

**运行命令**:

```bash
# 格式化所有文件
npm run format

# 仅检查格式（不修改）
npm run format:check
```

**配置**:

- 使用单引号
- 2 空格缩进
- 每行最多 100 字符
- 总是使用分号
- ES5 尾逗号

---

### 4. Husky - Git Hooks

**配置目录**: `.husky/`

**功能**:

- 提交前自动检查代码质量
- 推送前运行类型检查

**已配置的 Hooks**:

#### pre-commit

提交前自动运行 `lint-staged`，检查暂存的文件

#### pre-push

推送前运行 `npm run type-check`，确保没有类型错误

---

### 5. lint-staged - 暂存文件检查

**配置文件**: `.lintstagedrc.json`

**功能**:

- 只检查 Git 暂存的文件
- 自动修复并重新暂存
- 提高检查速度

**检查规则**:

- `*.{js,jsx,ts,tsx}` → ESLint + Prettier
- `*.{css,scss}` → Stylelint + Prettier
- `*.{json,md}` → Prettier

---

## 🚀 使用指南

### 日常开发

1. **编写代码时**
   - 编辑器会自动显示 ESLint/Stylelint 警告
   - 保存时可配置自动格式化

2. **提交代码前**

   ```bash
   # 手动检查所有问题
   npm run validate

   # 或者让 Git hooks 自动处理
   git add .
   git commit -m "feat: xxx"  # 自动运行检查
   ```

3. **修复问题**
   ```bash
   # 自动修复所有可修复的问题
   npm run lint:fix
   npm run format
   ```

### 可用的 npm 脚本

| 命令                   | 说明                           |
| ---------------------- | ------------------------------ |
| `npm run lint`         | 运行所有 lint 检查             |
| `npm run lint:eslint`  | 只运行 ESLint                  |
| `npm run lint:style`   | 只运行 Stylelint               |
| `npm run lint:fix`     | 自动修复 lint 问题             |
| `npm run format`       | 格式化所有代码                 |
| `npm run format:check` | 检查格式（不修改）             |
| `npm run type-check`   | TypeScript 类型检查            |
| `npm run validate`     | 完整验证（类型 + lint + 格式） |

---

## 🔧 配置详解

### ESLint 规则

```javascript
{
  // React Hooks 规则
  'react-hooks/rules-of-hooks': 'error',
  'react-hooks/exhaustive-deps': 'warn',

  // React Refresh（HMR）优化
  'react-refresh/only-export-components': 'warn',

  // TypeScript 规则
  '@typescript-eslint/no-unused-vars': 'warn',
  '@typescript-eslint/no-explicit-any': 'error',
}
```

### Stylelint 特殊配置

```json
{
  "at-rule-no-unknown": {
    "ignoreAtRules": ["tailwind", "apply", "layer"]
  },
  "function-no-unknown": {
    "ignoreFunctions": ["theme"]
  }
}
```

### Prettier 配置

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

---

## 📝 编辑器集成

### VS Code

推荐安装插件：

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

配置 `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.fixAll.stylelint": true
  },
  "eslint.validate": ["javascript", "javascriptreact", "typescript", "typescriptreact"]
}
```

### WebStorm / IntelliJ IDEA

1. 启用 ESLint: `Settings → Languages & Frameworks → JavaScript → Code Quality Tools → ESLint`
2. 启用 Stylelint: `Settings → Languages & Frameworks → Style Sheets → Stylelint`
3. 启用 Prettier: `Settings → Languages & Frameworks → JavaScript → Prettier`

---

## 🐛 常见问题

### 1. 提交时 lint-staged 失败

**原因**: 暂存的文件有代码质量问题

**解决**:

```bash
# 查看具体错误
npm run lint

# 尝试自动修复
npm run lint:fix
npm run format

# 重新提交
git add .
git commit -m "your message"
```

### 2. ESLint 报告"Cannot find module"

**原因**: 缺少类型定义

**解决**:

```bash
npm install --save-dev @types/node
```

### 3. Husky hooks 不生效

**原因**: `.husky/` 目录权限问题

**解决**:

```bash
chmod +x .husky/pre-commit
chmod +x .husky/pre-push
```

### 4. 想临时跳过检查

```bash
# 跳过 pre-commit hook
git commit --no-verify -m "message"

# 跳过 pre-push hook
git push --no-verify
```

⚠️ **警告**: 不建议经常跳过检查！

---

## 📊 检查标准

### 通过标准

✅ **所有检查必须通过**:

- ESLint: 0 错误，0 警告
- Stylelint: 0 错误
- Prettier: 所有文件格式正确
- TypeScript: 无类型错误

### 失败处理

1. 查看错误信息
2. 尝试自动修复: `npm run lint:fix && npm run format`
3. 手动修复无法自动处理的问题
4. 重新运行验证: `npm run validate`

---

## 🎯 最佳实践

1. **频繁提交**
   - 小步提交，每次提交都能通过检查
   - 避免积累大量未检查的代码

2. **编辑器集成**
   - 配置编辑器实时显示 lint 错误
   - 保存时自动格式化

3. **代码审查**
   - 确保所有 PR 都通过 `npm run validate`
   - 设置 CI/CD 自动运行检查

4. **团队规范**
   - 定期更新 lint 规则
   - 讨论并统一代码风格
   - 记录特殊规则的原因

---

## 🔄 持续改进

### 更新工具

```bash
# 更新所有 dev 依赖
npm update --save-dev

# 检查过时的包
npm outdated
```

### 自定义规则

根据团队需求，可以在以下文件中调整规则：

- `eslint.config.js` - ESLint 规则
- `.stylelintrc.json` - Stylelint 规则
- `.prettierrc` - Prettier 配置

---

**维护者**: GC Code 团队
**最后更新**: 2025-11-09
