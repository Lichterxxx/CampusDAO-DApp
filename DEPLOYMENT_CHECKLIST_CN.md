# CampusDAO 部署清单

## 当前已经完成

- [x] Solidity 智能合约
- [x] 防止同一钱包重复投票
- [x] 投票截止时间和最终结果逻辑
- [x] MetaMask 连接界面
- [x] Sepolia 网络检查和切换
- [x] 创建提案、支持、反对和结束提案界面
- [x] 交易等待、成功和失败提示
- [x] Etherscan 合约与交易链接
- [x] README、项目大纲和提交模板
- [x] Solidity 0.8.30 编译检查
- [x] 前端语法和启动检查
- [x] 本地模拟链 14 项合约测试
- [x] 双钱包投票与重复投票拒绝测试
- [x] 截止时间、迟到投票和结算测试
- [x] ABI 编译产物与测试报告
- [x] 部署到 Ethereum Sepolia
- [x] 链上字节码与本地编译产物长度一致（6,532 bytes）
- [x] 合约地址写入 `frontend/config.js` 与 `dist/config.js`

已部署地址：

```text
0xa9b0d7787ac3a76af2c4533bc33c237677004f19
```

## 已完成的部署步骤

### 1. 部署智能合约（已完成）

1. 打开 https://remix.ethereum.org/
2. 新建 `CampusDAO.sol`。
3. 复制 `contracts/CampusDAO.sol` 的全部内容。
4. 使用 Solidity `0.8.30` 编译；Advanced Configurations 中选择 EVM `shanghai`，关闭优化器。
5. 在 MetaMask 中选择 Ethereum Sepolia。
6. Remix 的 Environment 选择 `Injected Provider - MetaMask`。
7. 点击 Deploy，并在 MetaMask 中确认交易。
8. 等待完成后复制 `0x...` 合约地址。

### 2. 将地址写入网站（已完成）

编辑 `frontend/config.js`：

```js
contractAddress: "0x部署得到的合约地址"
```

同时编辑 `dist/config.js`，填入相同地址。

### 3. 本地演示

在仓库目录运行：

```text
node scripts/serve.mjs
```

然后用安装了 MetaMask 的浏览器打开：

```text
http://localhost:8080
```

### 4. 创建 GitHub 仓库

建议仓库名称：

```text
campusdao-dapp
```

上传整个项目，但不要上传私钥、助记词或 `.env`。

仓库已包含 GitHub Pages 工作流。推送到 `main` 后，在 GitHub 仓库的
`Settings → Pages` 中确认 Source 为 `GitHub Actions`。

### 5. 测试两笔交易

1. 创建一个 1 分钟提案。
2. 对提案投 Support 或 Oppose。
3. 确认页面票数变化。
4. 确认同一钱包不能重复投票。
5. 在 Etherscan 打开两笔交易。

### 6. 最终提交

```text
1. GitHub Repository: https://github.com/你的用户名/campusdao-dapp
2. Smart Contract Address: 0x你的Sepolia合约地址
```

## 安全提醒

- 私钥和助记词永远不要粘贴到网站、代码、聊天或 GitHub。
- 只使用 Sepolia 测试 ETH。
- 部署前再次确认 MetaMask 网络不是 Ethereum Mainnet。
