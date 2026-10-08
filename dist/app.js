(() => {
  "use strict";

  const CONFIG = window.CAMPUS_DAO_CONFIG;
  const ABI = [
    "function totalProposals() view returns (uint256)",
    "function hasVoted(uint256, address) view returns (bool)",
    "function createProposal(string title, string description, uint256 durationMinutes) returns (uint256)",
    "function vote(uint256 proposalId, bool support)",
    "function finalizeProposal(uint256 proposalId)",
    "function getProposal(uint256 proposalId) view returns ((uint256 id, address creator, string title, string description, uint64 createdAt, uint64 endTime, uint32 supportVotes, uint32 opposeVotes, bool finalized, uint8 outcome))",
    "error AlreadyFinalized()",
    "error AlreadyVoted()",
    "error DescriptionTooLong()",
    "error EmptyDescription()",
    "error EmptyTitle()",
    "error InvalidDuration()",
    "error ProposalNotFound()",
    "error TitleTooLong()",
    "error VotingClosed()",
    "error VotingStillOpen()",
    "event ProposalCreated(uint256 indexed proposalId, address indexed creator, string title, uint256 endTime)",
    "event VoteCast(uint256 indexed proposalId, address indexed voter, bool support)",
    "event ProposalFinalized(uint256 indexed proposalId, uint8 outcome, uint256 supportVotes, uint256 opposeVotes)"
  ];

  const state = {
    account: null,
    chainId: null,
    browserProvider: null,
    readProvider: null,
    readContract: null,
    writeContract: null,
    busy: false,
    loadingProposals: false,
    proposals: []
  };

  const elements = {
    connectButton: document.querySelector("#connectButton"),
    networkButton: document.querySelector("#networkButton"),
    networkLabel: document.querySelector("#networkLabel"),
    walletAddress: document.querySelector("#walletAddress"),
    walletHint: document.querySelector("#walletHint"),
    setupBanner: document.querySelector("#setupBanner"),
    totalProposals: document.querySelector("#totalProposals"),
    totalVotes: document.querySelector("#totalVotes"),
    activeProposals: document.querySelector("#activeProposals"),
    proposalForm: document.querySelector("#proposalForm"),
    proposalTitle: document.querySelector("#proposalTitle"),
    proposalDescription: document.querySelector("#proposalDescription"),
    proposalDuration: document.querySelector("#proposalDuration"),
    titleCount: document.querySelector("#titleCount"),
    descriptionCount: document.querySelector("#descriptionCount"),
    createButton: document.querySelector("#createButton"),
    refreshButton: document.querySelector("#refreshButton"),
    transactionState: document.querySelector("#transactionState"),
    contractAddress: document.querySelector("#contractAddress"),
    contractLink: document.querySelector("#contractLink"),
    proposalList: document.querySelector("#proposalList"),
    toast: document.querySelector("#toast")
  };

  const encoder = new TextEncoder();
  const contractInterface = window.ethers ? new window.ethers.Interface(ABI) : null;
  const contractConfigured =
    typeof CONFIG.contractAddress === "string" &&
    window.ethers?.isAddress(CONFIG.contractAddress) &&
    CONFIG.contractAddress !== window.ethers.ZeroAddress;

  function shortenAddress(address, leading = 6, trailing = 4) {
    if (!address) return "";
    return `${address.slice(0, leading)}…${address.slice(-trailing)}`;
  }

  function formatDate(timestamp) {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short"
    }).format(new Date(Number(timestamp) * 1000));
  }

  function byteLength(value) {
    return encoder.encode(value).length;
  }

  function getFriendlyError(error) {
    const revertDataCandidates = [
      error?.data,
      error?.error?.data,
      error?.info?.error?.data,
      error?.info?.error?.data?.result
    ];
    let decodedErrorName = "";
    for (const candidate of revertDataCandidates) {
      const data = typeof candidate === "string" ? candidate : candidate?.result;
      if (!data?.startsWith("0x")) continue;
      try {
        decodedErrorName = contractInterface?.parseError(data)?.name ?? "";
        if (decodedErrorName) break;
      } catch {}
    }

    const text = [
      decodedErrorName,
      error?.shortMessage,
      error?.reason,
      error?.info?.error?.message,
      error?.message
    ]
      .filter(Boolean)
      .join(" ");

    if (/user rejected|user denied|ACTION_REJECTED/i.test(text)) {
      return "Transaction rejected in MetaMask.";
    }
    if (/AlreadyVoted/i.test(text)) return "This wallet has already voted.";
    if (/VotingClosed/i.test(text)) return "Voting is closed for this proposal.";
    if (/VotingStillOpen/i.test(text)) return "This proposal is still open.";
    if (/AlreadyFinalized/i.test(text)) return "This proposal is already finalized.";
    if (/insufficient funds/i.test(text)) {
      return "Not enough Sepolia ETH to pay the gas fee.";
    }
    if (/could not coalesce|missing revert data/i.test(text)) {
      return "The contract rejected this action. Refresh the page and check the proposal state.";
    }

    return error?.shortMessage || error?.reason || "The request could not be completed.";
  }

  let toastTimer;
  function showToast(message, type = "info") {
    window.clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = `toast show${type === "error" ? " error" : ""}`;
    toastTimer = window.setTimeout(() => {
      elements.toast.className = "toast";
    }, 4600);
  }

  function setTransactionState(kind, title, message, transactionHash = null) {
    elements.transactionState.className = `transaction-state ${kind}`.trim();
    elements.transactionState.replaceChildren();

    const icon = document.createElement("span");
    icon.className = "transaction-icon";
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = kind === "error" ? "!" : kind === "success" ? "✓" : "◇";

    const content = document.createElement("div");
    const heading = document.createElement("strong");
    const paragraph = document.createElement("p");
    heading.textContent = title;
    paragraph.textContent = message;
    content.append(heading, paragraph);

    if (transactionHash) {
      const link = document.createElement("a");
      link.href = `${CONFIG.explorerUrl}/tx/${transactionHash}`;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = "Open transaction on Etherscan";
      content.append(link);
    }

    elements.transactionState.append(icon, content);
  }

  function updateWalletUI() {
    const correctChain = state.chainId === CONFIG.chainId;
    elements.networkButton.classList.toggle("connected", Boolean(state.account && correctChain));
    elements.networkButton.classList.toggle("wrong-network", Boolean(state.account && !correctChain));

    if (!state.account) {
      elements.walletAddress.textContent = "No wallet connected";
      elements.walletHint.textContent = "Connect MetaMask to create or vote.";
      elements.connectButton.textContent = "Connect wallet";
      elements.networkLabel.textContent = "Sepolia required";
      return;
    }

    elements.walletAddress.textContent = shortenAddress(state.account, 10, 8);
    elements.walletAddress.title = state.account;
    elements.connectButton.textContent = shortenAddress(state.account);

    if (correctChain) {
      elements.walletHint.textContent = "Wallet ready to sign Sepolia transactions.";
      elements.networkLabel.textContent = "Sepolia";
    } else {
      elements.walletHint.textContent = "Switch networks before creating or voting.";
      elements.networkLabel.textContent = "Wrong network";
    }
  }

  async function connectWallet({ prompt = true } = {}) {
    if (!window.ethereum) {
      showToast("MetaMask was not detected. Install or enable it in this browser.", "error");
      return false;
    }

    try {
      const method = prompt ? "eth_requestAccounts" : "eth_accounts";
      const accounts = await window.ethereum.request({ method });
      if (!accounts.length) {
        state.account = null;
        state.chainId = null;
        state.browserProvider = null;
        state.writeContract = null;
        updateWalletUI();
        await loadProposals();
        return false;
      }

      state.account = window.ethers.getAddress(accounts[0]);
      state.browserProvider = new window.ethers.BrowserProvider(window.ethereum);
      const network = await state.browserProvider.getNetwork();
      state.chainId = Number(network.chainId);

      if (contractConfigured && state.chainId === CONFIG.chainId) {
        const signer = await state.browserProvider.getSigner();
        // Prefer MetaMask for reads once the wallet is connected. This avoids
        // depending on a public RPC endpoint that may be rate-limited or down.
        state.readProvider = state.browserProvider;
        state.readContract = new window.ethers.Contract(
          CONFIG.contractAddress,
          ABI,
          state.browserProvider
        );
        state.writeContract = new window.ethers.Contract(CONFIG.contractAddress, ABI, signer);
      } else {
        state.writeContract = null;
      }

      updateWalletUI();
      await loadProposals();
      return true;
    } catch (error) {
      showToast(getFriendlyError(error), "error");
      return false;
    }
  }

  async function switchToSepolia() {
    if (!window.ethereum) {
      showToast("MetaMask was not detected.", "error");
      return;
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: CONFIG.chainIdHex }]
      });
      await connectWallet({ prompt: false });
    } catch (error) {
      if (error?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: CONFIG.chainIdHex,
                chainName: CONFIG.chainName,
                nativeCurrency: { name: "Sepolia ETH", symbol: "ETH", decimals: 18 },
                rpcUrls: [CONFIG.rpcUrl],
                blockExplorerUrls: [CONFIG.explorerUrl]
              }
            ]
          });
          await connectWallet({ prompt: false });
        } catch (addError) {
          showToast(getFriendlyError(addError), "error");
        }
      } else {
        showToast(getFriendlyError(error), "error");
      }
    }
  }

  async function requireWriteReady() {
    if (!contractConfigured) {
      throw new Error("Deploy the contract and add its address to config.js first.");
    }
    if (!state.account) {
      throw new Error("Connect MetaMask before submitting a transaction.");
    }
    if (state.chainId !== CONFIG.chainId) {
      throw new Error("Switch MetaMask to Ethereum Sepolia first.");
    }
    if (!state.writeContract) {
      const signer = await state.browserProvider.getSigner();
      state.writeContract = new window.ethers.Contract(CONFIG.contractAddress, ABI, signer);
    }
  }

  function outcomeLabel(proposal) {
    if (!proposal.finalized) {
      return Date.now() / 1000 < Number(proposal.endTime) ? "Open" : "Awaiting finalization";
    }
    return ["Pending", "Passed", "Rejected", "Tie"][Number(proposal.outcome)] || "Finalized";
  }

  function createProposalCard(proposal) {
    const article = document.createElement("article");
    article.className = "proposal-card";

    const details = document.createElement("div");
    const meta = document.createElement("div");
    meta.className = "proposal-meta";

    const id = document.createElement("span");
    id.textContent = `#${proposal.id}`;
    const status = document.createElement("span");
    status.className = "proposal-status";
    status.textContent = outcomeLabel(proposal);
    const deadline = document.createElement("span");
    deadline.textContent = `Ends ${formatDate(proposal.endTime)}`;
    meta.append(id, status, deadline);

    const title = document.createElement("h3");
    title.textContent = proposal.title;
    const description = document.createElement("p");
    description.textContent = proposal.description;
    const creator = document.createElement("span");
    creator.className = "proposal-creator";
    creator.textContent = `Created by ${shortenAddress(proposal.creator, 8, 6)}`;
    creator.title = proposal.creator;
    details.append(meta, title, description, creator);

    const voting = document.createElement("div");
    voting.className = "proposal-voting";
    const tally = document.createElement("div");
    tally.className = "vote-tally";

    for (const [label, value] of [
      ["Support", proposal.supportVotes],
      ["Oppose", proposal.opposeVotes]
    ]) {
      const box = document.createElement("div");
      const name = document.createElement("span");
      const count = document.createElement("strong");
      name.textContent = label;
      count.textContent = value.toString();
      box.append(name, count);
      tally.append(box);
    }

    const actions = document.createElement("div");
    actions.className = "vote-actions";
    const open = Date.now() / 1000 < Number(proposal.endTime) && !proposal.finalized;

    if (open) {
      const supportButton = document.createElement("button");
      supportButton.className = "button button-support";
      supportButton.type = "button";
      supportButton.textContent = "Support";
      supportButton.disabled = state.busy || proposal.userHasVoted || !state.account;
      supportButton.addEventListener("click", () => castVote(proposal.id, true));

      const opposeButton = document.createElement("button");
      opposeButton.className = "button button-oppose";
      opposeButton.type = "button";
      opposeButton.textContent = "Oppose";
      opposeButton.disabled = state.busy || proposal.userHasVoted || !state.account;
      opposeButton.addEventListener("click", () => castVote(proposal.id, false));
      actions.append(supportButton, opposeButton);

      if (proposal.userHasVoted) {
        const voted = document.createElement("p");
        voted.className = "voted-note";
        voted.textContent = "This wallet has voted.";
        actions.append(voted);
      }
    } else if (!proposal.finalized) {
      const finalizeButton = document.createElement("button");
      finalizeButton.className = "button button-finalize";
      finalizeButton.type = "button";
      finalizeButton.textContent = "Finalize result";
      finalizeButton.disabled = state.busy || !state.account;
      finalizeButton.addEventListener("click", () => finalizeProposal(proposal.id));
      actions.append(finalizeButton);
    }

    voting.append(tally, actions);
    article.append(details, voting);
    return article;
  }

  function renderProposals() {
    elements.proposalList.replaceChildren();

    if (!contractConfigured) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML =
        "<span aria-hidden='true'>◎</span><h3>Contract deployment required</h3><p>Add the deployed Sepolia address to config.js to load proposals.</p>";
      elements.proposalList.append(empty);
      return;
    }

    if (!state.proposals.length) {
      const empty = document.createElement("div");
      empty.className = "empty-state";
      empty.innerHTML =
        "<span aria-hidden='true'>◎</span><h3>No proposals yet</h3><p>Connect MetaMask and create the first on-chain proposal.</p>";
      elements.proposalList.append(empty);
      return;
    }

    const fragment = document.createDocumentFragment();
    state.proposals.forEach((proposal) => fragment.append(createProposalCard(proposal)));
    elements.proposalList.append(fragment);
  }

  function updateStats() {
    if (!contractConfigured) {
      elements.totalProposals.textContent = "—";
      elements.totalVotes.textContent = "—";
      elements.activeProposals.textContent = "—";
      return;
    }

    const totalVotes = state.proposals.reduce(
      (sum, proposal) => sum + Number(proposal.supportVotes) + Number(proposal.opposeVotes),
      0
    );
    const active = state.proposals.filter(
      (proposal) => !proposal.finalized && Date.now() / 1000 < Number(proposal.endTime)
    ).length;

    elements.totalProposals.textContent = state.totalProposalCount?.toString() ?? "0";
    elements.totalVotes.textContent = totalVotes.toString();
    elements.activeProposals.textContent = active.toString();
  }

  async function loadProposals() {
    // Wallet connection and network events can request the same refresh nearly
    // simultaneously. Ignore overlapping reads so the UI stays stable.
    if (state.loadingProposals) return;

    if (!contractConfigured || !state.readContract) {
      state.proposals = [];
      updateStats();
      renderProposals();
      return;
    }

    state.loadingProposals = true;
    try {
      const total = Number(await state.readContract.totalProposals());
      state.totalProposalCount = total;
      const firstId = Math.max(1, total - CONFIG.maxDisplayedProposals + 1);
      const ids = [];
      for (let id = total; id >= firstId; id -= 1) ids.push(id);

      const proposals = await Promise.all(
        ids.map(async (id) => {
          const proposal = await state.readContract.getProposal(id);
          const userHasVoted = state.account
            ? await state.readContract.hasVoted(id, state.account)
            : false;
          return {
            id: Number(proposal.id),
            creator: proposal.creator,
            title: proposal.title,
            description: proposal.description,
            createdAt: Number(proposal.createdAt),
            endTime: Number(proposal.endTime),
            supportVotes: Number(proposal.supportVotes),
            opposeVotes: Number(proposal.opposeVotes),
            finalized: proposal.finalized,
            outcome: Number(proposal.outcome),
            userHasVoted
          };
        })
      );

      state.proposals = proposals;
      updateStats();
      renderProposals();
    } catch (error) {
      showToast(`Could not read Sepolia: ${getFriendlyError(error)}`, "error");
      setTransactionState("error", "Read failed", "Check the RPC connection and contract address.");
    } finally {
      state.loadingProposals = false;
    }
  }

  async function submitTransaction(action, pendingTitle, successTitle) {
    if (state.busy) return;
    state.busy = true;
    elements.createButton.disabled = true;
    renderProposals();

    try {
      await requireWriteReady();
      setTransactionState("pending", "Confirm in MetaMask", pendingTitle);
      const transaction = await action();
      setTransactionState(
        "pending",
        "Transaction submitted",
        "Waiting for Sepolia confirmation…",
        transaction.hash
      );
      await transaction.wait();
      setTransactionState(
        "success",
        successTitle,
        "The contract state has been updated on Sepolia.",
        transaction.hash
      );
      showToast(successTitle);
      await loadProposals();
      return true;
    } catch (error) {
      const message = getFriendlyError(error);
      setTransactionState("error", "Transaction not completed", message);
      showToast(message, "error");
      return false;
    } finally {
      state.busy = false;
      elements.createButton.disabled = !contractConfigured;
      renderProposals();
    }
  }

  async function createProposal(event) {
    event.preventDefault();
    const title = elements.proposalTitle.value.trim();
    const description = elements.proposalDescription.value.trim();
    const duration = Number(elements.proposalDuration.value);

    if (!title || !description) {
      showToast("Enter both a title and description.", "error");
      return;
    }
    if (byteLength(title) > 80 || byteLength(description) > 300) {
      showToast("The title or description exceeds the contract byte limit.", "error");
      return;
    }
    if (!Number.isInteger(duration) || duration < 1 || duration > 10_080) {
      showToast("Choose a voting duration between 1 minute and 7 days.", "error");
      return;
    }

    const success = await submitTransaction(
      () => state.writeContract.createProposal(title, description, duration),
      "Review the proposal creation transaction.",
      "Proposal created"
    );

    if (success) {
      elements.proposalForm.reset();
      updateCounters();
    }
  }

  async function castVote(proposalId, support) {
    await submitTransaction(
      () => state.writeContract.vote(proposalId, support),
      `Review your ${support ? "support" : "oppose"} vote for proposal #${proposalId}.`,
      "Vote recorded"
    );
  }

  async function finalizeProposal(proposalId) {
    await submitTransaction(
      () => state.writeContract.finalizeProposal(proposalId),
      `Review finalization of proposal #${proposalId}.`,
      "Proposal finalized"
    );
  }

  function updateCounters() {
    elements.titleCount.textContent = byteLength(elements.proposalTitle.value);
    elements.descriptionCount.textContent = byteLength(elements.proposalDescription.value);
  }

  function configureContractUI() {
    elements.setupBanner.classList.toggle("hidden", contractConfigured);
    elements.createButton.disabled = !contractConfigured;

    if (!contractConfigured) {
      elements.contractAddress.textContent = "Not deployed";
      elements.contractLink.classList.add("hidden");
      return;
    }

    elements.contractAddress.textContent = shortenAddress(CONFIG.contractAddress, 10, 8);
    elements.contractAddress.title = CONFIG.contractAddress;
    elements.contractLink.href = `${CONFIG.explorerUrl}/address/${CONFIG.contractAddress}`;
    elements.contractLink.classList.remove("hidden");
  }

  function registerWebMCPTools() {
    const context = document.modelContext;
    if (!context?.registerTool) return;

    const reportRegistrationError = (error) => {
      console.warn("WebMCP tool registration failed", error);
    };

    try {
      void Promise.resolve(
        context.registerTool({
          name: "read_visible_proposals",
          title: "Read visible proposals",
          description:
            "Return the proposals currently loaded from the CampusDAO Sepolia contract.",
          inputSchema: {
            type: "object",
            properties: {},
            additionalProperties: false
          },
          annotations: { readOnlyHint: true, untrustedContentHint: true },
          async execute() {
            await loadProposals();
            return {
              contractConfigured,
              proposalCount: state.totalProposalCount ?? 0,
              proposals: state.proposals.map((proposal) => ({
                id: proposal.id,
                title: proposal.title,
                description: proposal.description,
                supportVotes: proposal.supportVotes,
                opposeVotes: proposal.opposeVotes,
                status: outcomeLabel(proposal)
              }))
            };
          }
        })
      ).catch(reportRegistrationError);

      void Promise.resolve(
        context.registerTool({
          name: "prepare_proposal_form",
          title: "Prepare proposal form",
          description:
            "Validate proposal details and place them into the visible form without sending a blockchain transaction.",
          inputSchema: {
            type: "object",
            properties: {
              title: { type: "string", minLength: 1, maxLength: 80 },
              description: { type: "string", minLength: 1, maxLength: 300 },
              durationMinutes: {
                type: "integer",
                enum: [1, 10, 60, 1440, 10080]
              }
            },
            required: ["title", "description", "durationMinutes"],
            additionalProperties: false
          },
          annotations: { readOnlyHint: false, untrustedContentHint: false },
          execute(input) {
            const title = typeof input?.title === "string" ? input.title.trim() : "";
            const description =
              typeof input?.description === "string" ? input.description.trim() : "";
            const duration = Number(input?.durationMinutes);
            const allowedDurations = [1, 10, 60, 1440, 10080];

            if (!title || byteLength(title) > 80) throw new Error("Invalid title.");
            if (!description || byteLength(description) > 300) {
              throw new Error("Invalid description.");
            }
            if (!allowedDurations.includes(duration)) throw new Error("Invalid duration.");

            elements.proposalTitle.value = title;
            elements.proposalDescription.value = description;
            elements.proposalDuration.value = String(duration);
            updateCounters();
            elements.proposalTitle.focus();

            return {
              prepared: true,
              transactionSent: false,
              nextStep: "Review the visible form and select Create proposal to confirm in MetaMask."
            };
          }
        })
      ).catch(reportRegistrationError);
    } catch (error) {
      reportRegistrationError(error);
    }
  }

  async function initialize() {
    if (!window.ethers) {
      setTransactionState(
        "error",
        "Library unavailable",
        "The Ethereum library could not load. Check the internet connection and refresh."
      );
      return;
    }

    configureContractUI();
    updateWalletUI();
    updateCounters();
    registerWebMCPTools();

    if (contractConfigured) {
      state.readProvider = new window.ethers.JsonRpcProvider(
        CONFIG.rpcUrl,
        CONFIG.chainId,
        { staticNetwork: true }
      );
      state.readContract = new window.ethers.Contract(CONFIG.contractAddress, ABI, state.readProvider);
      await loadProposals();
    } else {
      renderProposals();
      updateStats();
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", () => connectWallet({ prompt: false }));
      window.ethereum.on("chainChanged", () => connectWallet({ prompt: false }));
      await connectWallet({ prompt: false });
    }
  }

  elements.connectButton.addEventListener("click", () => connectWallet({ prompt: true }));
  elements.networkButton.addEventListener("click", switchToSepolia);
  elements.proposalForm.addEventListener("submit", createProposal);
  elements.refreshButton.addEventListener("click", loadProposals);
  elements.proposalTitle.addEventListener("input", updateCounters);
  elements.proposalDescription.addEventListener("input", updateCounters);

  initialize();
})();
