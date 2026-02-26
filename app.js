(function () {
  const cfg = window.DS_CONFIG || {};
  const state = {
    provider: null,
    signer: null,
    contract: null,
    wallet: null,
    demoMode: false
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function init() {
    if (typeof window !== "undefined" && typeof window.ethereum !== "undefined") {
      console.log("MetaMask is installed!");
    } else {
      console.log("MetaMask not detected");
    }
    attachCommonHandlers();
    hydrateLinks();
    initWalletFromSession();
    initPageSpecific();
  }

  function attachCommonHandlers() {
    const demoToggle = byId("presentationToggle");
    if (demoToggle) {
      demoToggle.addEventListener("click", () => {
        state.demoMode = !state.demoMode;
        document.body.classList.toggle("demo-mode", state.demoMode);
        const flow = document.querySelector(".architecture-flow");
        if (flow) flow.classList.toggle("demo-on", state.demoMode);
        demoToggle.textContent = state.demoMode ? "Demo Mode: ON" : "Demo Mode";
      });
    }

    const connectBtn = byId("connectWalletBtn");
    if (connectBtn) {
      connectBtn.addEventListener("click", async () => {
        if (!window.ethereum) {
          alert("MetaMask not detected. Please install it to continue.");
          return;
        }
        if (state.wallet) {
          toggleWalletDropdown();
        } else {
          await connectWallet();
        }
      });
    }

    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts) => {
        if (!accounts.length) {
          state.wallet = null;
          sessionStorage.removeItem("dsl_wallet");
          updateWalletUI(null);
          renderWalletDropdown();
        } else {
          state.wallet = accounts[0];
          sessionStorage.setItem("dsl_wallet", state.wallet);
          updateWalletUI(state.wallet);
        }
      });
      window.ethereum.on("chainChanged", () => {
        window.location.reload();
      });
    }

    if (byId("activityTicker")) {
      seedTicker();
    }
  }

  function hydrateLinks() {
    if (!cfg) return;
    const github = byId("githubLink");
    const docs = byId("docsLink");
    const contractLabel = byId("contractAddressDisplay");
    if (github && cfg.GITHUB_URL) github.href = cfg.GITHUB_URL;
    if (docs && cfg.DOCS_URL) docs.href = cfg.DOCS_URL;
    if (contractLabel && cfg.CONTRACT_ADDRESS) {
      contractLabel.textContent = cfg.CONTRACT_ADDRESS;
    }
  }

  async function connectWallet() {
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts"
      });
      const wallet = accounts[0];
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const network = await provider.getNetwork();
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        cfg.CONTRACT_ADDRESS,
        cfg.CONTRACT_ABI,
        signer
      );
      state.provider = provider;
      state.signer = signer;
      state.contract = contract;
      state.wallet = wallet;
      sessionStorage.setItem("dsl_wallet", wallet);
      updateWalletUI(wallet);
      renderWalletDropdown(network);
    } catch (e) {
      console.error(e);
    }
  }

  function updateWalletUI(wallet) {
    const connectBtn = byId("connectWalletBtn");
    if (connectBtn) {
      if (wallet) {
        const short =
          wallet.slice(0, 6) +
          "…" +
          wallet.slice(wallet.length - 4, wallet.length);
        connectBtn.textContent = short;
        connectBtn.classList.add("connected");
      } else {
        connectBtn.textContent = "Connect Wallet";
        connectBtn.classList.remove("connected");
      }
    }
    const statWallet = byId("statWallet");
    if (statWallet && wallet) {
      statWallet.textContent = wallet;
    }
  }

  function initWalletFromSession() {
    const stored = sessionStorage.getItem("dsl_wallet");
    if (stored) {
      state.wallet = stored;
      updateWalletUI(stored);
      renderWalletDropdown();
    }
  }

  function renderWalletDropdown(networkInfo) {
    const panel = byId("walletDropdown");
    if (!panel) return;
    if (!state.wallet) {
      panel.hidden = true;
      panel.innerHTML = "";
      return;
    }
    const net = networkInfo;
    let networkName = "Unknown";
    let isSepolia = false;
    if (net) {
      networkName = net.name || `Chain ${net.chainId}`;
      isSepolia = String(net.chainId) === "11155111";
    }
    panel.innerHTML = `
      <div class="wallet-row">
        <span class="label">Wallet</span>
        <code>${state.wallet}</code>
      </div>
      <div class="wallet-row">
        <span class="label">Network</span>
        <span class="wallet-status ${isSepolia ? "" : "bad"}">
          <span class="wallet-dot"></span>
          ${isSepolia ? "Sepolia" : networkName}
        </span>
      </div>
      <div class="wallet-actions">
        <button type="button" class="btn-secondary small" id="copyWalletBtn">
          Copy
        </button>
        <button type="button" class="btn-ghost small" id="disconnectWalletBtn">
          Disconnect
        </button>
      </div>
    `;
    panel.hidden = false;
    const copyBtn = byId("copyWalletBtn");
    const discBtn = byId("disconnectWalletBtn");
    if (copyBtn) {
      copyBtn.onclick = async () => {
        try {
          await navigator.clipboard.writeText(state.wallet);
          copyBtn.textContent = "Copied";
          setTimeout(() => (copyBtn.textContent = "Copy"), 1200);
        } catch {
          // ignore
        }
      };
    }
    if (discBtn) {
      discBtn.onclick = () => {
        state.wallet = null;
        sessionStorage.removeItem("dsl_wallet");
        updateWalletUI(null);
        renderWalletDropdown();
      };
    }
  }

  function toggleWalletDropdown() {
    const panel = byId("walletDropdown");
    if (!panel) return;
    panel.hidden = !panel.hidden;
  }

  function seedTicker() {
    const ticker = byId("activityTicker");
    if (!ticker) return;
    const inner = document.createElement("div");
    inner.className = "ticker-inner";
    const sample = [
      "eDNA hash 0x91ab… anchored by Node‑A07",
      "Telemetry stream 0x73ff… pinned to IPFS",
      "Climate dataset 0xd201… verified on‑chain",
      "Orbital node 0x44c9… submitted batch anchors"
    ];
    for (let i = 0; i < 2; i++) {
      sample.forEach((msg) => {
        const el = document.createElement("span");
        el.className = "ticker-item";
        el.innerHTML = `<strong>${msg.split(" ")[0]}</strong> ${msg
          .split(" ")
          .slice(1)
          .join(" ")}`;
        inner.appendChild(el);
      });
    }
    ticker.appendChild(inner);
  }

  function initPageSpecific() {
    const path = window.location.pathname;
    if (path.endsWith("login.html")) initAuthPage();
    else if (path.endsWith("dashboard.html")) initDashboard();
    else if (path.endsWith("upload.html")) initUploadPage();
    else if (path.endsWith("verify.html")) initVerifyPage();
  }

  function initAuthPage() {
    const form = byId("loginForm");
    let mode = "login";

    const modeLoginBtn = byId("modeLogin");
    const modeRegisterBtn = byId("modeRegister");
    const loginMeta = byId("loginMeta");
    const authError = byId("authError");

    function setMode(next) {
      mode = next;
      if (authError) authError.textContent = "";
      if (next === "login") {
        modeLoginBtn.classList.add("active-mode");
        modeRegisterBtn.classList.remove("active-mode");
        if (loginMeta) {
          loginMeta.textContent =
            "Login with an existing node operator account. Passwords are stored locally only.";
        }
      } else {
        modeRegisterBtn.classList.add("active-mode");
        modeLoginBtn.classList.remove("active-mode");
        if (loginMeta) {
          loginMeta.textContent =
            "Create a local demo account. Credentials never leave this browser.";
        }
      }
    }

    if (modeLoginBtn && modeRegisterBtn) {
      modeLoginBtn.addEventListener("click", () => setMode("login"));
      modeRegisterBtn.addEventListener("click", () => setMode("register"));
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const emailField = byId("email");
        const passField = byId("password");
        const emailError = byId("emailError");
        const passError = byId("passwordError");
        const email = emailField.value.trim();
        const password = passField.value;
        let ok = true;

        emailField.parentElement.classList.remove("invalid");
        passField.parentElement.classList.remove("invalid");
        if (emailError) emailError.textContent = "";
        if (passError) passError.textContent = "";
         if (authError) authError.textContent = "";

        if (!email || !email.includes("@")) {
          ok = false;
          if (emailError) emailError.textContent = "Enter a valid email.";
          emailField.parentElement.classList.add("invalid");
        }
        if (!password || password.length < 6) {
          ok = false;
          if (passError)
            passError.textContent = "Password must be at least 6 characters.";
          passField.parentElement.classList.add("invalid");
        }
        if (!ok) return;

        // Simple local "user database" (browser only)
        const rawUsers = localStorage.getItem("dsl_users") || "{}";
        let users;
        try {
          users = JSON.parse(rawUsers);
        } catch {
          users = {};
        }

        if (mode === "register") {
          if (users[email]) {
            if (authError)
              authError.textContent =
                "Account already exists. Switch to Login to continue.";
            return;
          }
          users[email] = {
            password,
            createdAt: Date.now()
          };
          localStorage.setItem("dsl_users", JSON.stringify(users));
        } else {
          const user = users[email];
          if (!user) {
            if (authError)
              authError.textContent =
                "No account found for this email. Switch to Create Account.";
            return;
          }
          if (user.password !== password) {
            if (authError) authError.textContent = "Incorrect password.";
            passField.parentElement.classList.add("invalid");
            return;
          }
        }

        const remember = byId("rememberMe").checked;
        const session = {
          email,
          wallet: state.wallet || null,
          createdAt: Date.now()
        };
        const store = remember ? localStorage : sessionStorage;
        store.setItem("dsl_session", JSON.stringify(session));
        window.location.href = "dashboard.html";
      });
    }
    const web3Btn = byId("web3LoginBtn");
    if (web3Btn) {
      web3Btn.addEventListener("click", async () => {
        await connectWallet();
        window.location.href = "dashboard.html";
      });
    }
  }

  function initDashboard() {
    const storedSession =
      localStorage.getItem("dsl_session") ||
      sessionStorage.getItem("dsl_session");
    if (!storedSession) {
      window.location.href = "login.html";
      return;
    }
    try {
      const session = JSON.parse(storedSession);
      const pill = byId("sessionInfo");
      if (pill && session.email) {
        pill.textContent = session.email;
      }
    } catch {
      // ignore parse errors
    }

    const logoutBtn = byId("logoutBtn");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        localStorage.removeItem("dsl_session");
        sessionStorage.removeItem("dsl_session");
        window.location.href = "login.html";
      });
    }

    const body = byId("nodesTableBody");
    if (body) {
      const demoNodes = [
        {
          id: "Node‑A07",
          wallet: "0x12F3...91Ab",
          submissions: 42,
          last: "2 min ago",
          status: "Verified",
          rep: 88.2
        },
        {
          id: "Node‑E12",
          wallet: "0x9a7B...22Cd",
          submissions: 19,
          last: "14 min ago",
          status: "Pending",
          rep: 74.5
        },
        {
          id: "Node‑O33",
          wallet: "0x44c9...F09a",
          submissions: 61,
          last: "48 min ago",
          status: "Verified",
          rep: 93.1
        }
      ];
      demoNodes.forEach((n) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `<td>${n.id}</td>
          <td>${n.wallet}</td>
          <td>${n.submissions}</td>
          <td>${n.last}</td>
          <td>${n.status}</td>
          <td>${n.rep}</td>`;
        body.appendChild(tr);
      });
    }

    const mockBtn = byId("mockSensorBtn");
    if (mockBtn) {
      mockBtn.addEventListener("click", () => {
        pushActivityEvent(
          "Mock sensor stream injected: 12 orbital packets + 3 eDNA snapshots."
        );
      });
    }

    loadActivityFeed();
    loadBlockStats();
  }

  async function loadBlockStats() {
    try {
      const provider = new ethers.providers.JsonRpcProvider(cfg.RPC_URL);
      const block = await provider.getBlock("latest");
      const now = Date.now() / 1000;
      const statBlock = byId("statBlock");
      const statBlockTime = byId("statBlockTime");
      if (statBlock) statBlock.textContent = block.number;
      if (statBlockTime && block.timestamp) {
        const diff = now - block.timestamp;
        statBlockTime.textContent = diff.toFixed(1);
      }
    } catch (e) {
      console.warn("Failed to fetch block stats", e);
    }
  }

  function pushActivityEvent(message, txHash) {
    const feed = byId("activityFeed");
    if (!feed) return;
    const li = document.createElement("div");
    li.className = "timeline-item";
    const ts = new Date().toLocaleTimeString();
    li.innerHTML = `${message} <small>${ts}${
      txHash ? ` • <a href="${cfg.EXPLORER_TX_BASE}${txHash}" target="_blank">view tx</a>` : ""
    }</small>`;
    feed.prepend(li);
  }

  function loadActivityFeed() {
    const feed = byId("activityFeed");
    if (!feed) return;
    const demo = [
      "Node‑A07 anchored eDNA batch hash 0x91ab…",
      "Node‑O33 pinned orbital pass dataset 0x73ff…",
      "Node‑E12 submitted environmental log 0xd201…"
    ];
    demo.forEach((m) => pushActivityEvent(m));
  }

  function initUploadPage() {
    const form = byId("uploadForm");
    const fileInput = byId("dataFile");
    const drop = byId("fileDrop");
    const hashPreview = byId("hashPreview");
    const cidPreview = byId("cidPreview");
    const gasEstimate = byId("gasEstimate");
    const txPreview = byId("txHashPreview");
    const timeline = byId("uploadTimeline");
    const successPanel = byId("uploadSuccess");
    const explorerBtn = byId("viewOnExplorerBtn");

    if (drop && fileInput) {
      drop.addEventListener("click", () => fileInput.click());
      drop.addEventListener("dragover", (e) => {
        e.preventDefault();
        drop.classList.add("dragging");
      });
      drop.addEventListener("dragleave", (e) => {
        e.preventDefault();
        drop.classList.remove("dragging");
      });
      drop.addEventListener("drop", (e) => {
        e.preventDefault();
        drop.classList.remove("dragging");
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          handleFileSelected(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
          handleFileSelected(fileInput.files[0]);
        }
      });
    }

    async function handleFileSelected(file) {
      if (!file) return;
      if (!/(\.csv|\.json|\.txt|\.tsv|\.log|\.xml)$/i.test(file.name)) {
        alert("Invalid file type. Use CSV, JSON, TXT, TSV, LOG, or XML.");
        return;
      }
      if (timeline) {
        timeline.innerHTML = "";
        addTimeline("File loaded – computing SHA‑256 locally…");
      }
      const arrayBuffer = await file.arrayBuffer();
      const wordArray = CryptoJS.lib.WordArray.create(arrayBuffer);
      const hash = CryptoJS.SHA256(wordArray).toString();
      if (hashPreview) hashPreview.textContent = "0x" + hash;
      addTimeline("Hash computed. Uploading to IPFS…");
    }

    function addTimeline(msg) {
      if (!timeline) return;
      const li = document.createElement("li");
      li.className = "timeline-item active";
      li.textContent = msg;
      timeline.appendChild(li);
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.signer || !state.contract) {
          alert("Connect your wallet first.");
          return;
        }
        const nodeName = byId("nodeName").value.trim();
        const dataType = byId("dataType").value;
        const file = byId("dataFile").files[0];
        const desc = byId("description").value.trim();
        if (!file) {
          alert("Select a file first.");
          return;
        }

        const nodeId = nodeName || "Unnamed Node";
        addTimeline(`Uploading ${dataType} data for ${nodeId} to IPFS…`);
        let cid = "demo-cid";
        try {
          cid = await uploadToIPFS(file, { nodeId, dataType, desc });
        } catch (err) {
          console.warn("IPFS upload failed, using demo CID", err);
        }
        if (cidPreview) cidPreview.textContent = cid;
        addTimeline("IPFS pinned. Estimating gas…");

        let hashHex = (hashPreview && hashPreview.textContent) || "";
        if (!hashHex.startsWith("0x") || hashHex.length !== 66) {
          const buf = await file.arrayBuffer();
          const wa = CryptoJS.lib.WordArray.create(buf);
          hashHex = "0x" + CryptoJS.SHA256(wa).toString();
          if (hashPreview) hashPreview.textContent = hashHex;
        }

        try {
          const est = await state.contract.estimateGas.submitData(
            hashHex,
            cid,
            nodeId
          );
          if (gasEstimate) gasEstimate.textContent = est.toString();
        } catch (err) {
          console.warn("Gas estimation failed", err);
        }

        addTimeline("Sending transaction to smart contract…");
        try {
          const tx = await state.contract.submitData(hashHex, cid, nodeId);
          if (txPreview) txPreview.textContent = tx.hash;
          if (explorerBtn && cfg.EXPLORER_TX_BASE) {
            explorerBtn.disabled = false;
            explorerBtn.onclick = () => {
              window.open(cfg.EXPLORER_TX_BASE + tx.hash, "_blank");
            };
          }
          addTimeline("Waiting for confirmations…");
          const receipt = await tx.wait(1);
          addTimeline(`Anchored in block ${receipt.blockNumber}.`);
          if (successPanel) successPanel.hidden = false;
          pushActivityEvent(
            `Node ${nodeId} anchored ${dataType} dataset.`,
            tx.hash
          );
        } catch (err) {
          console.error(err);
          addTimeline("Transaction failed or was rejected.");
        }
      });
    }
  }

  async function uploadToIPFS(file, meta) {
    if (!cfg.IPFS_ENDPOINT || !cfg.IPFS_JWT) {
      console.warn("IPFS config missing, returning demo CID");
      return "bafy-demo-placeholder";
    }
    const form = new FormData();
    form.append("file", file);
    form.append(
      "pinataMetadata",
      JSON.stringify({
        name: meta.nodeId || "DeScienceDataset",
        keyvalues: {
          dataType: meta.dataType || "",
          description: meta.desc || ""
        }
      })
    );
    const res = await fetch(cfg.IPFS_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.IPFS_JWT}`
      },
      body: form
    });
    if (!res.ok) {
      throw new Error("IPFS upload failed");
    }
    const json = await res.json();
    return json.IpfsHash || json.Hash || "bafy-demo-placeholder";
  }

  function initVerifyPage() {
    const form = byId("verifyForm");
    const fileInput = byId("verifyFile");
    const drop = byId("verifyDrop");
    const hashPreview = byId("verifyHashPreview");
    const resBox = byId("verifyResult");
    const resTitle = byId("verifyTitle");
    const resMsg = byId("verifyMessage");
    const onchainHash = byId("onchainHash");
    const onchainCid = byId("onchainCid");
    const onchainTs = byId("onchainTimestamp");
    const onchainNode = byId("onchainNode");

    if (drop && fileInput) {
      drop.addEventListener("click", () => fileInput.click());
      drop.addEventListener("dragover", (e) => {
        e.preventDefault();
        drop.classList.add("dragging");
      });
      drop.addEventListener("dragleave", (e) => {
        e.preventDefault();
        drop.classList.remove("dragging");
      });
      drop.addEventListener("drop", (e) => {
        e.preventDefault();
        drop.classList.remove("dragging");
        if (e.dataTransfer.files.length) {
          fileInput.files = e.dataTransfer.files;
          handleFile(e.dataTransfer.files[0]);
        }
      });
      fileInput.addEventListener("change", () => {
        if (fileInput.files.length) {
          handleFile(fileInput.files[0]);
        }
      });
    }

    async function handleFile(file) {
      if (!file) return;
      const buf = await file.arrayBuffer();
      const wa = CryptoJS.lib.WordArray.create(buf);
      const hash = "0x" + CryptoJS.SHA256(wa).toString();
      if (hashPreview) hashPreview.textContent = hash;
      if (resBox) {
        resBox.dataset.status = "idle";
        resTitle.textContent = "Ready to verify";
        resMsg.textContent = "Click verify to compare with the on‑chain record.";
      }
    }

    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!state.provider) {
          state.provider = new ethers.providers.JsonRpcProvider(cfg.RPC_URL);
        }
        if (!state.contract) {
          state.contract = new ethers.Contract(
            cfg.CONTRACT_ADDRESS,
            cfg.CONTRACT_ABI,
            state.provider
          );
        }
        if (!hashPreview || !hashPreview.textContent.startsWith("0x")) {
          alert("Select a file first so we can hash it.");
          return;
        }
        const hash = hashPreview.textContent.trim();
        try {
          const res = await state.contract.verifyHash(hash);
          const exists = res[0];
          if (!exists) {
            resBox.dataset.status = "tampered";
            resTitle.textContent = "No On‑Chain Record";
            resMsg.textContent =
              "This hash was not found on the contract. It may never have been anchored.";
            return;
          }
          const researcher = res[1];
          const ts = Number(res[2]);
          const cid = res[3];
          const nodeId = res[4];
          if (onchainHash) onchainHash.textContent = hash;
          if (onchainCid) onchainCid.textContent = cid;
          if (onchainTs)
            onchainTs.textContent = ts
              ? new Date(ts * 1000).toLocaleString()
              : "—";
          if (onchainNode) onchainNode.textContent = nodeId;

          resBox.dataset.status = "verified";
          resTitle.textContent = "Data Verified";
          resMsg.textContent =
            "The locally computed hash matches the on‑chain record. Integrity holds.";
        } catch (err) {
          console.error(err);
          resBox.dataset.status = "tampered";
          resTitle.textContent = "Verification Error";
          resMsg.textContent =
            "Unable to read from the contract. Check network, address, or ABI.";
        }
      });
    }
  }

  document.addEventListener("DOMContentLoaded", init);
})();

