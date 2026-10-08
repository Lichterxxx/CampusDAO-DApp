# CampusDAO 后续执行计划书

## 一、目标

完成一个可以在课堂上稳定演示并满足作业要求的 CampusDAO DApp，最终提交：

```text
1. GitHub Repository: https://github.com/你的用户名/campusdao-dapp
2. Smart Contract Address: 0x你的Sepolia合约地址
```

验收标准：

- Solidity 合约部署在 Ethereum Sepolia。
- 网站能够连接 MetaMask 并显示钱包地址。
- 网站能创建提案、投票并读取链上结果。
- 至少两笔状态修改交易能通过网页完成。
- Etherscan 能查询合约和演示交易。
- GitHub 仓库包含合约、前端和 README。
- 能在约 7 分钟内完成现场演示，并回答限制与设计问题。

## 二、当前完成状态

| 工作项 | 状态 | 负责人 |
|---|---|---|
| 项目选题与范围 | 已完成 | Codex + 你 |
| Solidity 合约 | 已完成 | Codex |
| MetaMask 前端 | 已完成 | Codex |
| Sepolia 网络检查 | 已完成 | Codex |
| 创建、投票、结束提案功能 | 已完成 | Codex |
| README、演示脚本、提交模板 | 已完成 | Codex |
| Solidity 编译检查 | 已完成 | Codex |
| 本地模拟链测试 | 已完成，14/14 通过 | Codex |
| 前端资源和运行检查 | 已完成 | Codex |
| 桌面与手机视觉检查 | 桌面已完成，真实钱包部署后再复查 | Codex |
| Sepolia 真实部署 | 已完成 | 你 + Codex |
| 填入真实合约地址 | 已完成 | Codex |
| GitHub 仓库创建和推送 | 待完成 | 你授权/登录后完成 |
| 真实 Sepolia 两笔交易彩排 | 待完成 | 你确认 MetaMask |
| 最终提交 Canvas | 待完成 | 你本人提交 |

## 三、执行阶段

### 阶段 1：本地质量检查

目标：在使用真实测试 ETH 之前发现代码和页面问题。

由 Codex 自动执行：

1. 使用 Solidity 0.8.30 重新编译合约。
2. 启动本地区块链模拟器。
3. 部署 CampusDAO 合约。
4. 创建一个 1 分钟提案。
5. 钱包 A 投 Support。
6. 验证钱包 A 无法重复投票。
7. 钱包 B 投 Oppose。
8. 验证截止前不能结束提案。
9. 模拟时间前进到截止之后。
10. 验证截止后不能继续投票。
11. 结束提案并验证 Tie 结果。
12. 验证提案不能重复结束。
13. 启动网站，检查脚本运行和资源加载。
14. 检查桌面和手机布局截图。

通过条件：所有规则按预期执行，网页没有阻塞性运行错误，主要控件在桌面和手机视口可见。

预计时间：15–30 分钟。

### 阶段 2：准备 MetaMask 和 Sepolia

目标：保证真实部署时不会误用主网或泄露钱包信息。

由你完成：

1. 确认 MetaMask 已安装并可正常打开。
2. 选择 Ethereum Sepolia，Chain ID 为 `11155111`。
3. 准备少量 Sepolia 测试 ETH。
4. 确认该账户只用于课程测试更安全。
5. 不向任何人提供助记词或私钥。

通过条件：MetaMask 显示 Sepolia，账户具有足够支付部署和三至五笔测试交易的测试 ETH。

预计时间：10–30 分钟，主要取决于测试 ETH 获取速度。

### 阶段 3：部署 Solidity 合约

目标：获得真实的 Sepolia 合约地址。

操作步骤：

1. 打开 `https://remix.ethereum.org/`。
2. 新建 `CampusDAO.sol`。
3. 复制 `contracts/CampusDAO.sol` 的全部内容。
4. 使用 Solidity `0.8.30` 编译，EVM 版本选择 `shanghai`，关闭优化器。
5. 打开 Deploy & Run Transactions。
6. Environment 选择 `Injected Provider - MetaMask`。
7. 再次确认网络为 Sepolia。
8. 点击 Deploy。
9. 你在 MetaMask 中检查网络和 Gas 后确认。
10. 等待交易确认并复制 `0x...` 合约地址。
11. 在 Sepolia Etherscan 打开地址，确认存在合约代码。

你负责：MetaMask 最终确认。

Codex 可负责：检查 Remix 设置、识别错误、记录地址并更新网站配置。

通过条件：`https://sepolia.etherscan.io/address/合约地址` 能查询到合约。

预计时间：10–20 分钟。

### 阶段 4：把网站连接到真实合约

目标：让网页从 Sepolia 读取数据并提交交易。

由 Codex执行：

1. 将合约地址写入 `frontend/config.js`。
2. 将相同地址写入 `dist/config.js`。
3. 检查地址格式和网络配置。
4. 启动网站。
5. 验证未连接钱包时仍可读取公开提案。
6. 验证连接钱包和切换 Sepolia。
7. 检查 Etherscan 链接指向正确地址。

通过条件：页面不再显示“Contract deployment required”，并能显示链上提案总数。

预计时间：5–10 分钟。

### 阶段 5：真实交易彩排

目标：在正式演示前跑通完整流程。

建议使用以下演示内容：

```text
Title: Should the university library open 24 hours during exams?

Description: Vote on extending library opening hours during the final examination period.

Duration: 1 minute
```

彩排步骤：

1. 点击 Connect wallet。
2. 显示钱包地址与 Sepolia。
3. 创建提案——第一笔交易。
4. 在 MetaMask 中确认并等待结果。
5. 对提案投 Support——第二笔交易。
6. 验证票数更新。
7. 尝试重复投票并确认被拒绝。
8. 等待 1 分钟截止。
9. Finalize Proposal——可选第三笔交易。
10. 打开 Etherscan 展示交易。
11. 刷新网页，证明数据仍然存在。

你负责：每次 MetaMask 最终确认。

Codex 可负责：操作网页、检查错误和修复代码。

通过条件：两笔要求内交易均成功，刷新后数据一致，交易链接正确。

预计时间：10–20 分钟。

### 阶段 6：GitHub 与网站发布

目标：获得可提交的 GitHub URL 和可用于演示的网站。

建议仓库名称：

```text
campusdao-dapp
```

步骤：

1. 在 GitHub 创建公开仓库。
2. 上传完整项目，不能包含私钥、助记词或真实 `.env`。
3. 确认默认分支为 `main`。
4. 在 `Settings → Pages` 中使用 GitHub Actions。
5. 等待已包含的 Pages 工作流完成。
6. 打开网站并再次测试 MetaMask。
7. 把 GitHub URL 和网站 URL 记录到 README。

通过条件：仓库公开可访问，GitHub Pages 页面正常打开，网站加载本地打包的 ethers.js。

预计时间：10–20 分钟。

### 阶段 7：七分钟演示排练

| 时间 | 内容 |
|---|---|
| 0:00–0:45 | 项目目的与为什么使用区块链 |
| 0:45–1:30 | 连接 MetaMask并展示地址与 Sepolia |
| 1:30–3:00 | 创建提案，完成交易 1 |
| 3:00–4:30 | 投票，完成交易 2 |
| 4:30–5:20 | 展示防重复投票与刷新后的状态 |
| 5:20–6:10 | 在 Etherscan 展示合约与交易 |
| 6:10–7:00 | 解释链上数据、合约设计和限制 |

排练要求：

- 至少完整排练两遍。
- 准备一个已经存在的备用提案。
- 准备两笔已经确认的备用交易链接。
- 浏览器提前打开网站和 Etherscan。
- MetaMask提前解锁并确认是 Sepolia。
- 不在演示中展示助记词、私钥或账户设置页面。

预计时间：20–30 分钟。

### 阶段 8：最终提交

提交前检查：

- [ ] GitHub 仓库能够公开打开。
- [ ] `contracts/CampusDAO.sol` 存在。
- [ ] 前端源代码存在。
- [ ] README 包含运行和演示方法。
- [ ] 合约地址是 Sepolia 合约地址，不是钱包地址或交易哈希。
- [ ] Etherscan 可以查询合约。
- [ ] 网站能够完成至少两笔交易。
- [ ] GitHub 没有私钥、助记词和 `.env`。

提交格式：

```text
1. GitHub Repository: https://github.com/你的用户名/campusdao-dapp
2. Smart Contract Address: 0x你的Sepolia合约地址
```

## 四、风险与备用方案

### Sepolia 拥堵或交易确认过慢

- 提前创建备用提案和备用交易。
- 演示时先展示交易已经提交，再使用 Etherscan 说明状态。

### 测试 ETH 不足

- 至少提前一天准备测试 ETH。
- 不要在上课前临时依赖单一 faucet。

### MetaMask 连接失败

- 使用正常安装 MetaMask 的 Chrome/Edge。
- 刷新网页后重新连接。
- 检查网站是否被允许连接该账户。

### GitHub Pages 缓存旧配置

- 确认最新 workflow 已完成。
- 对照仓库中的 `frontend/config.js` 检查地址。
- 使用强制刷新重新加载页面。

### 现场网络不可用

- 保留本地网站运行方式。
- 准备项目源码和页面截图。
- 保留已经完成的 Etherscan 交易链接。

## 五、权限和安全边界

Codex 可以自主执行：

- 编辑项目代码和文档。
- 安装本地测试依赖。
- 启动本地网站和模拟链。
- 自动部署到本地模拟链。
- 执行本地测试交易。
- 检查页面、截图和修复问题。

必须由你本人确认：

- MetaMask真实交易签名。
- 使用真实或测试钱包进行外部交易。
- 输入密码、验证码或助记词。
- 创建或登录需要身份验证的账户。
- 最终向课程系统提交作业。

## 六、预计剩余总时间

如果 MetaMask 和 Sepolia 测试 ETH 已准备好，预计还需要约 60–100 分钟完成真实部署、彩排、GitHub 发布和最终检查。

如果测试 ETH 尚未准备，整体时间取决于 faucet 的可用性。
