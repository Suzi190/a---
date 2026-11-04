let archiveCurrentTab = 'character';
let temporaryAvatarFile = null; // 存储原生 File / Blob [2]
let isArchiveInitialized = false;
let pendingArchiveLockface = []; // 待保存的档案馆锁脸 dataURL 数组（生图锁脸正脸照片）

// 二进制 Blob 转换为极速内存临时 URL 的渲染器（彻底解决 Base64 卡顿） [2]
function resolveAvatar(avatar) {
  if (!avatar) {
    // 关键修复：SVG 内部属性必须用单引号，否则双引号会提前闭合 <img src="..."> 的 src 属性，
    // 导致头像显示为破损图片，且剩余 SVG 标记（含 > 字符）泄漏到页面，造成名字带残破 > 字样
    return "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'><circle cx='50' cy='50' r='50' fill='%23cbd5e1'/><text x='50' y='62' font-size='50' text-anchor='middle' fill='%2394a3b8' font-family='sans-serif'>人</text></svg>";
  }
  if (avatar instanceof Blob) {
    return URL.createObjectURL(avatar); // 毫秒级内存地址转换
  }
  return avatar; // 网络 URL 直接返回
}

function initArchiveApp() {
  loadArchivesData();
  
  const tabs = document.querySelectorAll("#win-archive .archive-tabs .tab-item");
  tabs.forEach(tab => {
    tab.onclick = () => {
      tabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      archiveCurrentTab = tab.getAttribute("data-tab");
      document.getElementById("archive-title").innerText = `档案库 - ${getTabZhName(archiveCurrentTab)}`;
      loadArchivesData();
    };
  });

  if (isArchiveInitialized) {
    return;
  }
  isArchiveInitialized = true;

  document.getElementById("btn-add-archive").onclick = () => {
    if (archiveCurrentTab === 'relation') {
      openRelationNetworkEditor(null); // 关系网点击新建直接平滑切入可视化编辑器！
    } else {
      openArchiveForm();
    }
  };

  document.getElementById("btn-close-form").onclick = () => {
    document.getElementById("archive-form-overlay").classList.remove("active");
  };
  document.getElementById("btn-cancel-form").onclick = () => {
    document.getElementById("archive-form-overlay").classList.remove("active");
  };

  // 初始化导入
  initArchiveImport();
  // 初始化 SillyTavern 角色卡导入（角色卡 + 配套世界书一并入库）
  initSillyTavernImport();

  document.getElementById("btn-save-archive").onclick = async () => {
    const idVal = document.getElementById("archive-id").value;
    const id = idVal ? Number(idVal) : null;

    const name = document.getElementById("archive-name").value.trim();
      const remark = document.getElementById("archive-remark").value.trim();
      const nativeLanguage = document.getElementById("archive-language").value.trim();
      const group = document.getElementById("archive-group").value.trim();
      const persona = document.getElementById("archive-persona").value.trim();
      const appearance = (document.getElementById("archive-appearance") ? document.getElementById("archive-appearance").value.trim() : "");
      const lockfaceImages = pendingArchiveLockface.slice();
      const urlAvatar = document.getElementById("archive-avatar-url").value.trim();
    const parentId = archiveCurrentTab === 'npc' ? Number(document.getElementById("archive-parent-id").value) : null;

    if (!name) {
      showToast("姓名不能为空！");
      return;
    }

    if (archiveCurrentTab === 'npc' && !parentId) {
      showToast("NPC 必须选择并归属于一名主要的角色或用户！");
      return;
    }

    const avatar = urlAvatar || temporaryAvatarFile || null;

    const arcObj = {
        type: archiveCurrentTab,
        name,
        avatar,
        remark,
        nativeLanguage,
        group,
        persona,
        parentId,
        appearance,
        lockfaceImages
      };

    if (id) {
      await db.archives.update(id, arcObj);
    } else {
      await db.archives.add(arcObj);
    }

    document.getElementById("archive-form-overlay").classList.remove("active");
    loadArchivesData();
  };

  // 绑定锁脸正脸照片上传/清空事件
  bindArchiveLockfaceEvents();

  initPasteAndDropEvents();
}

// 渲染档案馆锁脸正脸照片预览
function renderArchiveLockfacePreview() {
  const c = document.getElementById("archive-lockface-preview");
  if (!c) return;
  c.innerHTML = '';
  pendingArchiveLockface.forEach((dataUrl, idx) => {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:relative;width:48px;height:48px;border-radius:8px;overflow:hidden;border:1.5px solid var(--border);';
    wrap.innerHTML =
      '<img src="' + dataUrl + '" style="width:100%;height:100%;object-fit:cover;">' +
      '<button data-idx="' + idx + '" style="position:absolute;top:1px;right:1px;width:16px;height:16px;border-radius:50%;background:rgba(0,0,0,0.6);color:#fff;border:none;font-size:10px;cursor:pointer;line-height:14px;">×</button>';
    c.appendChild(wrap);
  });
  c.querySelectorAll('button[data-idx]').forEach(btn => {
    btn.onclick = () => {
      const idx = Number(btn.getAttribute('data-idx'));
      pendingArchiveLockface.splice(idx, 1);
      renderArchiveLockfacePreview();
    };
  });
}

// 绑定档案馆锁脸上传/清空事件
function bindArchiveLockfaceEvents() {
  const uploadBtn = document.getElementById('btn-archive-upload-lockface');
  const fileInput = document.getElementById('file-archive-lockface');
  const clearBtn = document.getElementById('btn-archive-clear-lockface');

  if (uploadBtn) uploadBtn.onclick = () => { if (fileInput) fileInput.click(); };
  if (clearBtn) clearBtn.onclick = () => {
    pendingArchiveLockface = [];
    renderArchiveLockfacePreview();
  };
  if (fileInput) fileInput.onchange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    // 限制最多3张
    const remain = 3 - pendingArchiveLockface.length;
    if (remain <= 0) { showToast('最多上传3张正脸照片'); e.target.value = ''; return; }
    const toProcess = files.slice(0, remain);
    if (files.length > remain) showToast('仅取前 ' + remain + ' 张，最多3张');
    // 在轨压缩：调用生图系统的压缩函数
    const compressFn = (window.imageGenSystem && window.imageGenSystem.compressImage)
      ? window.imageGenSystem.compressImage : null;
    for (const f of toProcess) {
      try {
        let dataUrl;
        if (compressFn) {
          dataUrl = await compressFn(f, 768);
        } else {
          // 兜底：直接 FileReader
          dataUrl = await new Promise((resolve, reject) => {
            const r = new FileReader();
            r.onload = () => resolve(r.result);
            r.onerror = reject;
            r.readAsDataURL(f);
          });
        }
        pendingArchiveLockface.push(dataUrl);
      } catch (err) {
        console.warn('档案馆锁脸图片压缩失败:', err);
      }
    }
    renderArchiveLockfacePreview();
    e.target.value = '';
  };
}

function getTabZhName(t) {
  const map = { character: '角色', user: '用户', npc: 'NPC', relation: '关系网' };
  return map[t] || '';
}

async function loadArchivesData() {
  const container = document.getElementById("archive-list-container");
  container.innerHTML = "";

  if (archiveCurrentTab === 'relation') {
    const rels = await db.relations.toArray();
    if (rels.length === 0) {
      container.innerHTML = `<p style="text-align:center;color:var(--text-secondary);font-size:13px;padding:40px 0;">暂无关系网，请点击右上角新建关系网</p>`;
      return;
    }
    for (let r of rels) {
      const nodeCount = (r.nodes || []).length;
      const edgeCount = (r.edges || []).length;
      const card = document.createElement("div");
      card.className = "archive-card";
      card.innerHTML = `
        <div class="card-info" onclick="openRelationNetworkEditor(${r.id})" style="cursor:pointer;">
          <div class="card-name" style="font-size:14px; font-weight:700;">🌐 ${escapeHtml(r.name || '未命名关系网')}</div>
          <div class="card-desc">包含 ${nodeCount} 个角色节点 | ${edgeCount} 条双向羁绊连线</div>
        </div>
        <div class="card-actions">
          <button class="btn-icon" onclick="openRelationNetworkEditor(${r.id})" title="编辑关系网">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteArchiveItem(${r.id})" title="删除关系网">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      container.appendChild(card);
    }
    return;
  }

  const items = await db.archives.where('type').equals(archiveCurrentTab).toArray();
  if (items.length === 0) {
    container.innerHTML = `<p style="text-align:center;color:var(--text-secondary);font-size:13px;padding:40px 0;">暂无归档记录，请点击右上角添加</p>`;
    return;
  }

  const groups = {};
  items.forEach(item => {
    const grp = item.group || "默认未分组";
    if (!groups[grp]) groups[grp] = [];
    groups[grp].push(item);
  });

  for (let key in groups) {
    const wrapper = document.createElement("div");
    wrapper.className = "archive-group-wrapper";
    
    const isCollapsed = localStorage.getItem(`collapse_${archiveCurrentTab}_${key}`) === 'true';

    wrapper.innerHTML = `
      <div class="archive-group-header" data-group="${key}">
        <span>${key} (${groups[key].length})</span>
        <svg viewBox="0 0 24 24" width="16" height="16" style="transform: ${isCollapsed ? 'rotate(-90deg)' : 'none'};"><path fill="currentColor" d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
      </div>
      <div class="archive-group-content ${isCollapsed ? 'collapsed' : ''}"></div>
    `;

    const contentArea = wrapper.querySelector(".archive-group-content");
    groups[key].forEach(item => {
      const card = document.createElement("div");
      card.className = "archive-card";
      card.innerHTML = `
        <img class="card-avatar" src="${resolveAvatar(item.avatar)}" onerror="(typeof avatarFallback==='function'?avatarFallback:(window.avatarFallback||function(){}))(this)" />
        <div class="card-info">
          <div class="card-name">${escapeHtml(item.name)}</div>
          <div class="card-desc">${escapeHtml(item.remark || '暂无备注')}</div>
        </div>
        <div class="card-actions">
          <button class="btn-icon" onclick="editArchiveItem(${item.id})">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z"/></svg>
          </button>
          <button class="btn-icon btn-delete" onclick="deleteArchiveItem(${item.id})">
            <svg viewBox="0 0 24 24"><path fill="currentColor" d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
          </button>
        </div>
      `;
      contentArea.appendChild(card);
    });

    wrapper.querySelector(".archive-group-header").addEventListener("click", (e) => {
      const collapsed = contentArea.classList.toggle("collapsed");
      localStorage.setItem(`collapse_${archiveCurrentTab}_${key}`, collapsed);
      const icon = e.currentTarget.querySelector("svg");
      icon.style.transform = collapsed ? "rotate(-90deg)" : "none";
    });

    container.appendChild(wrapper);
  }
}

// 动态开启表单并重载特定的选项条件
async function openArchiveForm(editId = null) {
  document.getElementById("archive-id").value = "";
  document.getElementById("archive-name").value = "";
  document.getElementById("archive-remark").value = "";
  document.getElementById("archive-language").value = "";
  document.getElementById("archive-group").value = "";
  document.getElementById("archive-persona").value = "";
  if (document.getElementById("archive-appearance")) document.getElementById("archive-appearance").value = "";
  document.getElementById("archive-avatar-url").value = "";
  document.getElementById("archive-parent-id").value = "";
  temporaryAvatarFile = null;
  pendingArchiveLockface = [];
  renderArchiveLockfacePreview();
  
  document.getElementById("placeholder-avatar").style.display = "block";
  document.getElementById("avatar-preview-img").style.display = "none";
  document.getElementById("avatar-preview-img").src = "";

  const overlay = document.getElementById("archive-form-overlay");
  overlay.classList.add("active");

  const isNpc = archiveCurrentTab === 'npc';

  document.getElementById("form-general-fields").style.display = "block";
  document.querySelector(".avatar-uploader-container").style.display = "flex";
  document.getElementById("form-avatar-url-group").style.display = "block";
  document.getElementById("form-npc-parent-group").style.display = isNpc ? "block" : "none";

  if (isNpc) {
    document.getElementById("form-title").innerText = editId ? "编辑 NPC 设定" : "添加新 NPC";
    const options = await db.archives.where('type').anyOf(['character', 'user']).toArray();
    const container = document.getElementById("npc-parent-selector-cards");
    container.innerHTML = "";

    let targetParentId = null;
    if (editId) {
      const item = await db.archives.get(editId);
      if (item && item.parentId) targetParentId = item.parentId;
    }

    if (options.length === 0) {
      container.innerHTML = `<div style="font-size:11px; color:var(--text-secondary); text-align:center; padding:10px;">请先去创建角色或用户！</div>`;
    } else {
      options.forEach(item => {
        const card = document.createElement("div");
        card.className = "npc-parent-option-card";
        card.setAttribute("data-id", item.id);
        const isPreSelected = targetParentId && Number(targetParentId) === Number(item.id);
        
        card.style.cssText = `display:flex; align-items:center; gap:10px; padding:8px; border-radius:8px; background:${isPreSelected ? '#f0fdf4' : '#ffffff'}; border:1.5px solid ${isPreSelected ? '#07c160' : 'var(--border)'}; cursor:pointer; transition:all 0.15s;`;
        card.innerHTML = `
          <img src="${resolveAvatar(item.avatar)}" onerror="(typeof avatarFallback==='function'?avatarFallback:(window.avatarFallback||function(){}))(this)" style="width:32px; height:32px; border-radius:50%; object-fit:cover; flex-shrink:0;">
          <div style="flex:1; overflow:hidden; text-align:left;">
            <div style="font-size:12px; font-weight:700; color:var(--text-primary); display:flex; align-items:center; gap:4px;">
              <span>${escapeHtml(item.name)}</span>
              <span style="font-size:9px; color:var(--text-secondary); background:#f1f5f9; padding:1px 4px; border-radius:4px;">${getTabZhName(item.type)}</span>
            </div>
            <div style="font-size:10px; color:var(--text-secondary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(item.remark || '暂无备注')}</div>
          </div>
        `;
        if (isPreSelected) {
          document.getElementById("archive-parent-id").value = item.id;
        }

        card.onclick = () => {
          container.querySelectorAll(".npc-parent-option-card").forEach(c => {
            c.style.borderColor = "var(--border)";
            c.style.backgroundColor = "#ffffff";
          });
          card.style.borderColor = "#07c160";
          card.style.backgroundColor = "#f0fdf4";
          document.getElementById("archive-parent-id").value = item.id;
        };
        container.appendChild(card);
      });
    }
  } else {
    document.getElementById("form-title").innerText = editId ? `编辑${getTabZhName(archiveCurrentTab)}` : `添加新${getTabZhName(archiveCurrentTab)}`;
  }

  if (editId) {
    const item = await db.archives.get(editId);
    if (item) {
      document.getElementById("archive-id").value = item.id;
      document.getElementById("archive-name").value = item.name || "";
      document.getElementById("archive-remark").value = item.remark || "";
      document.getElementById("archive-language").value = item.nativeLanguage || "";
      document.getElementById("archive-group").value = item.group || "";
      document.getElementById("archive-persona").value = item.persona || "";
      if (document.getElementById("archive-appearance")) document.getElementById("archive-appearance").value = item.appearance || "";
      // 回填锁脸正脸照片
      pendingArchiveLockface = (item.lockfaceImages && Array.isArray(item.lockfaceImages)) ? item.lockfaceImages.slice() : [];
      renderArchiveLockfacePreview();
      
      if (item.parentId) {
        document.getElementById("archive-parent-id").value = item.parentId;
      }

      if (item.avatar) {
        if (item.avatar instanceof Blob) {
          temporaryAvatarFile = item.avatar;
          document.getElementById("placeholder-avatar").style.display = "none";
          const previewImg = document.getElementById("avatar-preview-img");
          previewImg.src = resolveAvatar(item.avatar);
          previewImg.style.display = "block";
        } else {
          document.getElementById("archive-avatar-url").value = item.avatar;
        }
      }
    }
  }
}

window.editArchiveItem = function(id) {
  openArchiveForm(id);
};

window.deleteArchiveItem = async function(id) {
  showCustomConfirm("删除项目", "确定要彻底删除该项目吗？此操作不可挽回。", async () => {
    if (archiveCurrentTab === 'relation') {
      await db.relations.delete(id);
    } else {
      // 删除前先取出记录，判断是否为 user 类型（需要清理引用）
      const arc = await db.archives.get(id);
      const deletedType = arc ? arc.type : archiveCurrentTab;
      await db.archives.delete(id);

      // user 面具被删除时，必须清理所有悬空引用，否则聊天页会死锁在"无法切换面具"状态
      if (deletedType === 'user') {
        // 1. 清理全局激活状态：如果删的正是当前激活的 user，清空 active_me_id
        const activeMeId = localStorage.getItem("active_me_id");
        if (activeMeId && Number(activeMeId) === Number(id)) {
          localStorage.removeItem("active_me_id");
          if (typeof activeUserPersonaId !== 'undefined') activeUserPersonaId = null;
        }
        // 2. 清理引用了该 user 的会话：userId 置 null，保留 customUserName 等快照让历史聊天仍可查看
        try {
          const affectedSessions = await db.sessions.where('userId').equals(Number(id)).toArray();
          for (const s of affectedSessions) {
            await db.sessions.update(s.id, { userId: null });
          }
        } catch(e) { console.warn("清理会话 userId 引用失败:", e); }
        // 3. 如果聊天页已初始化，刷新面具选择器以脱困死锁
        if (typeof loadMyPersonas === 'function') {
          try { await loadMyPersonas(); } catch(e) {}
        }
      }
    }
    loadArchivesData();
  });
};

// 初始化档案馆设定导入控制器（仅支持 .txt / .docx 纯文本设定文件导入）
function initArchiveImport() {
  const btnImport = document.getElementById("btn-archive-import");
  const fileImportDoc = document.getElementById("file-archive-import");

  if (btnImport && fileImportDoc) {
    btnImport.onclick = () => {
      fileImportDoc.click();
    };

    // 处理 docx / txt 传统文件导入
    fileImportDoc.onchange = async (e) => {
      if (e.target.files.length > 0) {
        const file = e.target.files[0];
        showToast("正在解析角色设定文件...");
        try {
          let text = "";
          if (file.name.endsWith(".docx")) {
            text = await parseDocxText(file);
          } else {
            text = await readTxtFileSafe(file);
          }

          await openArchiveForm();
          const defaultName = file.name.substring(0, file.name.lastIndexOf('.')) || "新角色";
          document.getElementById("archive-name").value = defaultName;
          document.getElementById("archive-persona").value = text;
          showToast(`成功导入设定「${file.name}」！`);
        } catch(err) {
          console.error(err);
          showToast("解析设定文件失败: " + err.message);
        }
        fileImportDoc.value = "";
      }
    };
  }
}

// 动态异步加载 JSZip 库，保障 Word 文本解压正常进行
function loadJSZip() {
  return new Promise((resolve, reject) => {
    if (typeof JSZip !== 'undefined') {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://unpkg.com/jszip@3.10.1/dist/jszip.min.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("加载 JSZip 压缩组件失败，请检查网络连接后重试"));
    document.head.appendChild(script);
  });
}

// 异步解析 docx 并提取文本，规避由于 binary 格式造成的乱码崩溃
async function parseDocxText(file) {
  await loadJSZip();
  const zip = await JSZip.loadAsync(file);
  const docXmlFile = zip.file("word/document.xml");
  if (!docXmlFile) throw new Error("无效的 docx Word 格式文件");
  const xmlText = await docXmlFile.async("string");
  
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, "text/xml");
  const texts = xmlDoc.getElementsByTagName("w:t");
  let out = "";
  for (let i = 0; i < texts.length; i++) {
    out += texts[i].textContent + "\n";
  }
  return out;
}

// 双向在轨自愈型文本读取解码器 (TextDecoder 强校验 UTF-8 与 GBK 降级机制，100% 根除中文乱码)
function readTxtFileSafe(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const arrayBuffer = e.target.result;
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      try {
        const text = utf8Decoder.decode(arrayBuffer);
        resolve(text);
      } catch (err) {
        // 捕获 UTF-8 错码序列异常，回退降级到 GBK 国标编码进行自愈重新翻译
        const gbkDecoder = new TextDecoder("gbk");
        try {
          const text = gbkDecoder.decode(arrayBuffer);
          resolve(text);
        } catch (gbkErr) {
          reject(gbkErr);
        }
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function initPasteAndDropEvents() {
  const dropzone = document.getElementById("avatar-dropzone");
  const fileInput = document.getElementById("archive-avatar-file");

  dropzone.onclick = () => fileInput.click();

  fileInput.onchange = (e) => {
    if (e.target.files.length > 0) handleAvatarFile(e.target.files[0]);
  };

  dropzone.ondragover = (e) => e.preventDefault();
  dropzone.ondrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length > 0) handleAvatarFile(e.dataTransfer.files[0]);
  };

  document.addEventListener("paste", (e) => {
    const activeOverlay = document.getElementById("archive-form-overlay");
    if (!activeOverlay.classList.contains("active")) return;
    
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.indexOf("image") !== -1) {
        handleAvatarFile(item.getAsFile());
      }
    }
  });
}

// ============================================================
//         可视化图形关系网互动引擎 (2D Stage & Dual-POV Edges)
// ============================================================

let currentRelGraphId = null;
let graphNodes = []; // [{ id, x, y }]
let graphEdges = []; // [{ fromId, toId, relAtoB, relBtoA }]
let activeSelectedNodeId = null;
let activeEditingEdgeIndex = null;

// 控制右侧候选抽屉折叠展开
function toggleRelDrawer(show) {
  const drawer = document.getElementById("rel-candidate-drawer");
  const openBtn = document.getElementById("btn-open-rel-drawer");
  if (drawer && openBtn) {
    if (show) {
      drawer.style.display = "flex";
      openBtn.style.display = "none";
    } else {
      drawer.style.display = "none";
      openBtn.style.display = "block";
    }
  }
}
window.toggleRelDrawer = toggleRelDrawer;

// 打开可视化关系网编辑器
async function openRelationNetworkEditor(graphId = null) {
  currentRelGraphId = graphId;
  graphNodes = [];
  graphEdges = [];
  activeSelectedNodeId = null;
  activeEditingEdgeIndex = null;

  document.getElementById("rel-network-title-input").value = "";
  toggleRelDrawer(true); // 打开时默认呈现抽屉
  
  if (graphId) {
    const graphData = await db.relations.get(graphId);
    if (graphData) {
      document.getElementById("rel-network-title-input").value = graphData.name || "";
      graphNodes = graphData.nodes || [];
      graphEdges = graphData.edges || [];
    }
  }

  await renderRelCandidateDrawer();
  renderRelStage();
  document.getElementById("relation-network-editor").classList.add("active");
}
window.openRelationNetworkEditor = openRelationNetworkEditor;

function closeRelationNetworkEditor() {
  document.getElementById("relation-network-editor").classList.remove("active");
  currentRelGraphId = null;
}
window.closeRelationNetworkEditor = closeRelationNetworkEditor;

// 渲染右侧候选角色列表 (轻触加入关系网)
async function renderRelCandidateDrawer() {
  const container = document.getElementById("rel-candidate-list");
  container.innerHTML = "";

  const archives = await db.archives.toArray();
  const addedIds = graphNodes.map(n => n.id);

  archives.forEach(arc => {
    const isAdded = addedIds.includes(arc.id);
    const item = document.createElement("div");
    item.style.cssText = `display:flex; flex-direction:column; align-items:center; padding:8px 4px; border-radius:10px; background:${isAdded ? '#f1f5f9' : '#fff'}; border:1px solid ${isAdded ? '#cbd5e1' : 'var(--border)'}; opacity:${isAdded ? '0.5' : '1'}; cursor:${isAdded ? 'not-allowed' : 'pointer'}; text-align:center; transition:all 0.15s;`;
    item.innerHTML = `
      <img src="${resolveAvatar(arc.avatar)}" onerror="(typeof avatarFallback==='function'?avatarFallback:(window.avatarFallback||function(){}))(this)" style="width:36px; height:32px; border-radius:50%; object-fit:cover; margin-bottom:4px;">
      <span style="font-size:10px; font-weight:700; color:var(--text-primary); max-width:80px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${escapeHtml(arc.name)}</span>
    `;

    if (!isAdded) {
      item.onclick = () => {
        const stage = document.getElementById("rel-canvas-stage");
        const centerX = (stage.clientWidth / 2) + (Math.random() * 60 - 30) - 30;
        const centerY = (stage.clientHeight / 2) + (Math.random() * 60 - 30) - 30;

        graphNodes.push({ id: arc.id, x: Math.max(10, centerX), y: Math.max(10, centerY) });
        renderRelCandidateDrawer();
        renderRelStage();
      };
    }
    container.appendChild(item);
  });
}

// 核心：重绘 Canvas 2D 阶段与 SVG 连接线（支持双行叠放 & 无限平滑拖拽）
async function renderRelStage() {
  const svgLayer = document.getElementById("rel-svg-layer");
  const nodesLayer = document.getElementById("rel-nodes-layer");
  svgLayer.innerHTML = "";
  nodesLayer.innerHTML = "";

  const archivesMap = new Map();
  const archives = await db.archives.toArray();
  archives.forEach(a => archivesMap.set(a.id, a));

  // 1. 绘制 SVG 连接线及双向羁绊预览 (改为上下双行叠放，完美收窄宽度)
  graphEdges.forEach((edge, idx) => {
    const nodeA = graphNodes.find(n => n.id === edge.fromId);
    const nodeB = graphNodes.find(n => n.id === edge.toId);
    if (!nodeA || !nodeB) return;

    const x1 = nodeA.x + 30; 
    const y1 = nodeA.y + 30;
    const x2 = nodeB.x + 30;
    const y2 = nodeB.y + 30;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", "#07c160");
    line.setAttribute("stroke-width", "2.5");
    line.setAttribute("stroke-dasharray", "4,4");
    svgLayer.appendChild(line);

    const midX = (x1 + x2) / 2;
    const midY = (y1 + y2) / 2;

    const group = document.createElementNS("http://www.w3.org/2000/svg", "g");
    group.style.cursor = "pointer";
    group.style.pointerEvents = "auto";
    group.onclick = () => openEdgeEditModal(idx);

    const arcA = archivesMap.get(edge.fromId);
    const arcB = archivesMap.get(edge.toId);

    // 智能双行/单行文本构建
    let textHtml = "";
    let rectHeight = 16;
    let rectWidth = 84;

    if (edge.relAtoB && edge.relBtoA) {
      rectHeight = 28;
      rectWidth = 90;
      textHtml = `
        <text x="${midX}" y="${midY - 3}" font-size="8.5" font-weight="bold" fill="#0284c7" text-anchor="middle">${escapeHtml(arcA?.name || 'A')}视[${escapeHtml(edge.relAtoB)}]</text>
        <text x="${midX}" y="${midY + 8}" font-size="8.5" font-weight="bold" fill="#db2777" text-anchor="middle">${escapeHtml(arcB?.name || 'B')}视[${escapeHtml(edge.relBtoA)}]</text>
      `;
    } else if (edge.relAtoB) {
      textHtml = `<text x="${midX}" y="${midY + 3.5}" font-size="9" font-weight="bold" fill="#0284c7" text-anchor="middle">${escapeHtml(arcA?.name || 'A')}视[${escapeHtml(edge.relAtoB)}]</text>`;
    } else if (edge.relBtoA) {
      textHtml = `<text x="${midX}" y="${midY + 3.5}" font-size="9" font-weight="bold" fill="#db2777" text-anchor="middle">${escapeHtml(arcB?.name || 'B')}视[${escapeHtml(edge.relBtoA)}]</text>`;
    } else {
      textHtml = `<text x="${midX}" y="${midY + 3.5}" font-size="9" font-weight="bold" fill="#64748b" text-anchor="middle">点击定义羁绊</text>`;
    }

    group.innerHTML = `
      <rect x="${midX - (rectWidth / 2)}" y="${midY - (rectHeight / 2)}" width="${rectWidth}" height="${rectHeight}" rx="8" fill="#ffffff" stroke="#07c160" stroke-width="1.5"/>
      ${textHtml}
    `;
    svgLayer.appendChild(group);
  });

  // 2. 绘制节点 (注入 touch-action: none 根治手势粘连卡顿)
  graphNodes.forEach(node => {
    const arc = archivesMap.get(node.id);
    if (!arc) return;

    const isSelected = activeSelectedNodeId === node.id;
    const el = document.createElement("div");
    // 关键修正：注入 touch-action: none 防止移动端触控被网页翻页手势截断！
    el.style.cssText = `position:absolute; left:${node.x}px; top:${node.y}px; width:60px; height:60px; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:grab; z-index:10; user-select:none; touch-action:none;`;

    el.innerHTML = `
      <div style="position:relative; width:44px; height:44px;">
        <img src="${resolveAvatar(arc.avatar)}" onerror="(typeof avatarFallback==='function'?avatarFallback:(window.avatarFallback||function(){}))(this)" style="width:44px; height:44px; border-radius:50%; object-fit:cover; border:2.5px solid ${isSelected ? '#ec4899' : '#ffffff'}; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
        <div onclick="event.stopPropagation(); removeNodeFromGraph(${node.id})" title="从关系网中移除" style="position:absolute; top:-4px; right:-4px; width:16px; height:16px; background:#ef4444; color:#fff; border-radius:50%; font-size:10px; font-weight:bold; display:flex; align-items:center; justify-content:center; cursor:pointer;">×</div>
      </div>
      <span style="font-size:10px; font-weight:800; color:#1e293b; background:rgba(255,255,255,0.9); padding:1px 6px; border-radius:8px; margin-top:2px; white-space:nowrap; box-shadow:0 1px 3px rgba(0,0,0,0.1);">${escapeHtml(arc.name)}</span>
    `;

    let isDragging = false;
    let startX = 0, startY = 0;
    let initNodeX = 0, initNodeY = 0;

    el.onpointerdown = (e) => {
      if (e.target.closest("div[onclick]")) return;
      isDragging = false;
      startX = e.clientX;
      startY = e.clientY;
      initNodeX = node.x;
      initNodeY = node.y;
      el.setPointerCapture(e.pointerId);

      el.onpointermove = (pe) => {
        const dx = pe.clientX - startX;
        const dy = pe.clientY - startY;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
          isDragging = true;
          node.x = Math.max(0, initNodeX + dx);
          node.y = Math.max(0, initNodeY + dy);
          el.style.left = `${node.x}px`;
          el.style.top = `${node.y}px`;
          renderRelStageLinesOnly(); // 拖拽时即时更新连线位置
        }
      };

      el.onpointerup = (pe) => {
        el.releasePointerCapture(pe.pointerId);
        el.onpointermove = null;
        el.onpointerup = null;

        if (!isDragging) {
          if (activeSelectedNodeId === null) {
            activeSelectedNodeId = node.id;
            renderRelStage();
          } else if (activeSelectedNodeId === node.id) {
            activeSelectedNodeId = null;
            renderRelStage();
          } else {
            const fromId = activeSelectedNodeId;
            const toId = node.id;
            activeSelectedNodeId = null;

            let existingIdx = graphEdges.findIndex(e => (e.fromId === fromId && e.toId === toId) || (e.fromId === toId && e.toId === fromId));
            if (existingIdx === -1) {
              graphEdges.push({ fromId, toId, relAtoB: "", relBtoA: "" });
              existingIdx = graphEdges.length - 1;
            }
            openEdgeEditModal(existingIdx);
            renderRelStage();
          }
        }
      };
    };

    nodesLayer.appendChild(el);
  });
}

// 极写轻量重绘 SVG 连线 (拖拽时多行文本双向实时随动)
function renderRelStageLinesOnly() {
  const svgLayer = document.getElementById("rel-svg-layer");
  if (!svgLayer) return;
  
  const lines = svgLayer.querySelectorAll("line");
  const groups = svgLayer.querySelectorAll("g");

  graphEdges.forEach((edge, idx) => {
    const nodeA = graphNodes.find(n => n.id === edge.fromId);
    const nodeB = graphNodes.find(n => n.id === edge.toId);
    if (!nodeA || !nodeB) return;

    const x1 = nodeA.x + 30;
    const y1 = nodeA.y + 30;
    const x2 = nodeB.x + 30;
    const y2 = nodeB.y + 30;

    if (lines[idx]) {
      lines[idx].setAttribute("x1", x1);
      lines[idx].setAttribute("y1", y1);
      lines[idx].setAttribute("x2", x2);
      lines[idx].setAttribute("y2", y2);
    }
    if (groups[idx]) {
      const midX = (x1 + x2) / 2;
      const midY = (y1 + y2) / 2;
      const rect = groups[idx].querySelector("rect");
      const texts = groups[idx].querySelectorAll("text");

      // 强校验单行/双行文本全量实时中心随动，彻底根治粉字滞后 Bug
      if (texts.length === 2) {
        if (rect) {
          rect.setAttribute("x", midX - 45);
          rect.setAttribute("y", midY - 14);
        }
        texts[0].setAttribute("x", midX);
        texts[0].setAttribute("y", midY - 3);
        texts[1].setAttribute("x", midX);
        texts[1].setAttribute("y", midY + 8);
      } else if (texts.length === 1) {
        if (rect) {
          rect.setAttribute("x", midX - 42);
          rect.setAttribute("y", midY - 8);
        }
        texts[0].setAttribute("x", midX);
        texts[0].setAttribute("y", midY + 3.5);
      }
    }
  });
}

function removeNodeFromGraph(nodeId) {
  graphNodes = graphNodes.filter(n => n.id !== nodeId);
  graphEdges = graphEdges.filter(e => e.fromId !== nodeId && e.toId !== nodeId);
  renderRelCandidateDrawer();
  renderRelStage();
}

// 打开双向羁绊卡片编辑 Modal
async function openEdgeEditModal(edgeIndex) {
  activeEditingEdgeIndex = edgeIndex;
  const edge = graphEdges[edgeIndex];
  if (!edge) return;

  const arcA = await db.archives.get(edge.fromId);
  const arcB = await db.archives.get(edge.toId);

  document.getElementById("edge-label-a-to-b").innerText = `在 [${arcA?.name || 'A'}] 视角，[${arcB?.name || 'B'}] 是：`;
  document.getElementById("edge-input-a-to-b").value = edge.relAtoB || "";

  document.getElementById("edge-label-b-to-a").innerText = `在 [${arcB?.name || 'B'}] 视角，[${arcA?.name || 'A'}] 是：`;
  document.getElementById("edge-input-b-to-a").value = edge.relBtoA || "";

  document.getElementById("btn-save-edge").onclick = () => {
    edge.relAtoB = document.getElementById("edge-input-a-to-b").value.trim();
    edge.relBtoA = document.getElementById("edge-input-b-to-a").value.trim();
    document.getElementById("relation-edge-modal").classList.remove("active");
    renderRelStage();
  };

  document.getElementById("btn-delete-edge").onclick = () => {
    graphEdges.splice(edgeIndex, 1);
    document.getElementById("relation-edge-modal").classList.remove("active");
    renderRelStage();
  };

  document.getElementById("relation-edge-modal").classList.add("active");
}

// 核心落盘保存关系网
async function saveRelationNetworkGraph() {
  const name = document.getElementById("rel-network-title-input").value.trim();
  if (!name) {
    showToast("请输入这张关系网的名称！");
    return;
  }

  const graphObj = {
    name,
    nodes: graphNodes,
    edges: graphEdges,
    updatedAt: Date.now()
  };

  if (currentRelGraphId) {
    await db.relations.update(currentRelGraphId, graphObj);
  } else {
    await db.relations.add(graphObj);
  }

  showToast("关系网成功落盘保存！");
  closeRelationNetworkEditor();
  if (typeof loadArchivesData === 'function') loadArchivesData();
}

// 在轨二进制图片异步等轴方块裁剪压缩器 (150px 黄金尺寸，0.8 无感画质压缩) [1]
function compressImageBlob(file, maxDim = 150, quality = 0.8) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      
      // 自动执行居中等比方形裁剪，规避非等比图像变形，锁定完美人脸居中 [1]
      const size = Math.min(width, height);
      const startX = (width - size) / 2;
      const startY = (height - size) / 2;
      
      const canvas = document.createElement("canvas");
      canvas.width = maxDim;
      canvas.height = maxDim;
      const ctx = canvas.getContext("2d");
      
      // 执行裁剪与重置绘制
      ctx.drawImage(img, startX, startY, size, size, 0, 0, maxDim, maxDim);
      
      canvas.toBlob((blob) => {
        resolve(blob || file);
      }, "image/jpeg", quality);
    };
    img.onerror = () => {
      resolve(file); // 容灾回退，确保即使图片格式损坏也能正常引入不崩溃
    };
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    // ★ 必须给 onerror：老 WebView 读 content:// 失败时若只有 onload，这个 Promise 永远不结束，
    //   调用方（角色卡导入 / 头像上传）就会一直卡住，表现为「点了没反应」。
    reader.onerror = () => {
      resolve(file);
    };
    reader.readAsDataURL(file);
  });
}

// 升级为异步处理，获取并进行在轨 Canvas 压缩裁剪，体积直接骤降 99.5% [1]
async function handleAvatarFile(file) {
  document.getElementById("placeholder-avatar").style.display = "none";
  const previewImg = document.getElementById("avatar-preview-img");
  
  // 提示用户正在处理，打消等待焦虑感
  showToast("正在执行在轨无感高清压缩与等比方形裁剪...");
  
  const compressedBlob = await compressImageBlob(file, 150, 0.8);
  temporaryAvatarFile = compressedBlob; 
  
  previewImg.src = resolveAvatar(compressedBlob); // 瞬时内存预览
  previewImg.style.display = "block";
}

// ============================================================
//        SillyTavern 角色卡导入（角色卡 + 配套世界书一并入库）
// ------------------------------------------------------------
// 支持：SillyTavern 导出的 PNG 角色卡（tEXt / iTXt / zTXt 块里的
//       chara / ccv3 base64 载荷）、JSON 角色卡（V1 / V2 / V3 spec），
//       以及可选的独立世界书 JSON（{entries:[...]} 或 {entries:{"0":{...}}}）。
// 世界书映射规则：
//   · keys + secondary_keys      → 触发关键词（逗号分隔，OR 匹配）
//   · enabled / constant         → 禁用 / 常驻 / 关键词 三种模式
//   · extensions.probability     → 触发概率（含 useProbability 开关）
//   · extensions.depth           → 注入深度（ST 越小越贴近最新对话，
//                                  本系统越小越靠前，故需翻转后写入）
//   原始 ST 字段统一以 st* 前缀留档，方便日后对照，不污染现有 UI。
// ============================================================

let stImportDraft = null;

// 字节 → latin1 字符串（PNG 的 tEXt 块按 latin1 存放，不能用 UTF-8 解）
function stBytesToLatin1(bytes) {
  let out = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    out += String.fromCharCode.apply(null, bytes.subarray(i, i + CHUNK));
  }
  return out;
}

// base64 → UTF-8 字符串（角色卡 JSON 是 UTF-8 编码后再 base64 的）
function stDecodeBase64Utf8(b64) {
  const bin = atob(String(b64).replace(/\s+/g, ''));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return stDecodeUtf8Text(bytes);
}

// deflate 解压（zTXt / 压缩型 iTXt 块）
// ★ 兼容性：DecompressionStream 是 Chromium 80+ 才有的 API，安卓老机型自带的
//   WebView（Chromium 55~79）没有它，直接调用会让「压缩文本块」的角色卡整张解析失败。
//   这里先用原生解压，失败或不存在时回退到下面的内置纯 JS 解压器。
async function stInflateDeflate(bytes) {
  const input = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  if (typeof DecompressionStream === 'function') {
    try {
      const stream = new Blob([input]).stream().pipeThrough(new DecompressionStream('deflate'));
      return new Uint8Array(await new Response(stream).arrayBuffer());
    } catch (e) {
      console.warn('DecompressionStream 解压失败，改用内置解压器:', e);
    }
  }
  return stInflateZlib(input);
}

// ---------- 内置 DEFLATE 解压（RFC 1950 / 1951，老 WebView 兜底用） ----------
const ST_INFLATE_LEN_BASE = [3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131, 163, 195, 227, 258];
const ST_INFLATE_LEN_EXTRA = [0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0];
const ST_INFLATE_DIST_BASE = [1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049, 3073, 4097, 6145, 8193, 12289, 16385, 24577];
const ST_INFLATE_DIST_EXTRA = [0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13];
const ST_INFLATE_CODE_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

// 由码长表构建 canonical Huffman 解码表
function stHuffmanFromLengths(lengths) {
  const MAX_BITS = 15;
  const counts = new Array(MAX_BITS + 1);
  for (let i = 0; i <= MAX_BITS; i++) counts[i] = 0;
  for (let i = 0; i < lengths.length; i++) counts[lengths[i]]++;
  counts[0] = 0; // 0 表示「该符号没有编码」，不参与构表
  let left = 1;
  for (let len = 1; len <= MAX_BITS; len++) {
    left = (left << 1) - counts[len];
    if (left < 0) throw new Error('角色卡压缩数据损坏（Huffman 表非法）');
  }
  const offs = new Array(MAX_BITS + 1);
  offs[1] = 0;
  for (let len = 1; len < MAX_BITS; len++) offs[len + 1] = offs[len] + counts[len];
  const symbols = new Array(lengths.length);
  for (let sym = 0; sym < lengths.length; sym++) {
    const len = lengths[sym];
    if (len) symbols[offs[len]++] = sym;
  }
  return { counts: counts, symbols: symbols };
}

// zlib 包裹（PNG 文本块用的格式）→ raw deflate
function stInflateZlib(input) {
  const data = input instanceof Uint8Array ? input : new Uint8Array(input || []);
  let start = 0;
  const hasZlibHeader = data.length >= 2 &&
    (data[0] & 0x0f) === 8 &&
    (((data[0] << 8) | data[1]) % 31) === 0;
  if (hasZlibHeader) {
    start = 2;
    if (data[1] & 0x20) start += 4; // 预置字典（PNG 文本块不会出现，防御性跳过）
  }
  return stInflateRaw(data.subarray(start));
}

// raw deflate 解压（stored / fixed / dynamic 三种块全部支持）
function stInflateRaw(data) {
  let pos = 0;
  let bitBuf = 0;
  let bitCnt = 0;
  let out = new Uint8Array(1 << 16);
  let outLen = 0;

  const ensureCapacity = (need) => {
    if (outLen + need <= out.length) return;
    let cap = out.length;
    while (cap < outLen + need) cap <<= 1;
    const next = new Uint8Array(cap);
    next.set(out.subarray(0, outLen));
    out = next;
  };

  const readBit = () => {
    if (bitCnt === 0) {
      if (pos >= data.length) throw new Error('角色卡压缩数据不完整');
      bitBuf = data[pos++];
      bitCnt = 8;
    }
    const b = bitBuf & 1;
    bitBuf >>= 1;
    bitCnt--;
    return b;
  };

  const readBits = (n) => {
    let v = 0;
    for (let i = 0; i < n; i++) v |= readBit() << i;
    return v;
  };

  const decodeSymbol = (huff) => {
    let code = 0;
    let first = 0;
    let index = 0;
    for (let len = 1; len <= 15; len++) {
      code |= readBit();
      const count = huff.counts[len];
      if (code - count < first) return huff.symbols[index + (code - first)];
      index += count;
      first = (first + count) << 1;
      code <<= 1;
    }
    throw new Error('角色卡压缩数据损坏（Huffman 解码失败）');
  };

  const decodeBlock = (litHuff, distHuff) => {
    for (;;) {
      const sym = decodeSymbol(litHuff);
      if (sym < 256) {
        ensureCapacity(1);
        out[outLen++] = sym;
        continue;
      }
      if (sym === 256) return; // 块结束
      const li = sym - 257;
      if (li < 0 || li >= ST_INFLATE_LEN_BASE.length) throw new Error('角色卡压缩数据损坏（长度码非法）');
      const len = ST_INFLATE_LEN_BASE[li] + readBits(ST_INFLATE_LEN_EXTRA[li]);
      const dsym = decodeSymbol(distHuff);
      if (dsym < 0 || dsym >= ST_INFLATE_DIST_BASE.length) throw new Error('角色卡压缩数据损坏（距离码非法）');
      const dist = ST_INFLATE_DIST_BASE[dsym] + readBits(ST_INFLATE_DIST_EXTRA[dsym]);
      if (dist > outLen) throw new Error('角色卡压缩数据损坏（回溯距离越界）');
      ensureCapacity(len);
      for (let i = 0; i < len; i++) {
        out[outLen] = out[outLen - dist];
        outLen++;
      }
    }
  };

  let last = 0;
  while (!last) {
    last = readBit();
    const type = readBits(2);

    if (type === 0) {
      // 不压缩存储块：先对齐到字节边界
      bitCnt = 0;
      if (pos + 4 > data.length) throw new Error('角色卡压缩数据不完整');
      const len = data[pos] | (data[pos + 1] << 8);
      pos += 4; // 跳过 LEN / NLEN
      if (pos + len > data.length) throw new Error('角色卡压缩数据不完整');
      ensureCapacity(len);
      out.set(data.subarray(pos, pos + len), outLen);
      outLen += len;
      pos += len;
    } else if (type === 1) {
      // 固定 Huffman 表
      const litLens = new Array(288);
      for (let i = 0; i < 144; i++) litLens[i] = 8;
      for (let i = 144; i < 256; i++) litLens[i] = 9;
      for (let i = 256; i < 280; i++) litLens[i] = 7;
      for (let i = 280; i < 288; i++) litLens[i] = 8;
      const distLens = new Array(30);
      for (let i = 0; i < 30; i++) distLens[i] = 5;
      decodeBlock(stHuffmanFromLengths(litLens), stHuffmanFromLengths(distLens));
    } else if (type === 2) {
      // 动态 Huffman 表
      const hlit = readBits(5) + 257;
      const hdist = readBits(5) + 1;
      const hclen = readBits(4) + 4;
      const codeLens = new Array(19);
      for (let i = 0; i < 19; i++) codeLens[i] = 0;
      for (let i = 0; i < hclen; i++) codeLens[ST_INFLATE_CODE_ORDER[i]] = readBits(3);
      const codeHuff = stHuffmanFromLengths(codeLens);

      const lens = [];
      while (lens.length < hlit + hdist) {
        const sym = decodeSymbol(codeHuff);
        if (sym < 16) {
          lens.push(sym);
        } else if (sym === 16) {
          if (!lens.length) throw new Error('角色卡压缩数据损坏（长度表非法）');
          const prev = lens[lens.length - 1];
          const rep = 3 + readBits(2);
          for (let i = 0; i < rep; i++) lens.push(prev);
        } else if (sym === 17) {
          const rep = 3 + readBits(3);
          for (let i = 0; i < rep; i++) lens.push(0);
        } else if (sym === 18) {
          const rep = 11 + readBits(7);
          for (let i = 0; i < rep; i++) lens.push(0);
        } else {
          throw new Error('角色卡压缩数据损坏（长度表非法）');
        }
      }
      decodeBlock(
        stHuffmanFromLengths(lens.slice(0, hlit)),
        stHuffmanFromLengths(lens.slice(hlit, hlit + hdist))
      );
    } else {
      throw new Error('角色卡压缩数据损坏（未知压缩块类型）');
    }
  }

  return out.subarray(0, outLen);
}

// ============================================================================
// 真机诊断 + 超时保护 + 安卓壳层兜底读文件
// ----------------------------------------------------------------------------
// 老 Android WebView 读「文件选择器回传的 content:// URI」时，最坏的形态不是报错，
// 而是 FileReader 既不 onload 也不 onerror —— 永久挂起。页面上看到的就是
// 「选完文件，一点反应都没有」，连错误提示都等不到。
// 所以这里四件事一起做：
//   ① 每一步都写诊断日志（页面 console + logcat，tag=WebViewDiag）
//   ② 每个异步步骤都有超时，挂住就报错，绝不死等
//   ③ 读不到就调安卓壳层（AndroidMCP）直接读文件，绕过 WebView 的 content:// 限制
//   ④ 任何结果都显示在屏幕上（不依赖 Toast 是否可见）
// ============================================================================
let ST_READ_TIMEOUT_MS = 15000;   // 读单个文件
let ST_PARSE_TIMEOUT_MS = 20000;  // 解析 PNG / 解压内嵌 JSON
let ST_AVATAR_TIMEOUT_MS = 6000;  // 头像压缩（失败可放弃，不影响导入）

const stDiagLog = [];
function stDiag(step, extra) {
  const line = `${step}${extra ? ' · ' + extra : ''}`;
  stDiagLog.push(line);
  if (stDiagLog.length > 40) stDiagLog.shift();
  try { console.log('[ST导入] ' + line); } catch (e) { /* 忽略 */ }
  try {
    if (window.AndroidMCP && typeof window.AndroidMCP.logDebug === 'function') {
      window.AndroidMCP.logDebug('ST导入 ' + line);
    }
  } catch (e) { /* 忽略 */ }
}

// 给任意 Promise 加超时：老 WebView 会「不成功也不失败」，必须设上限
function stWithTimeout(promise, ms, label) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      reject(new Error(`${label}超时（${Math.round(ms / 1000)} 秒无响应）`));
    }, ms);
    Promise.resolve(promise).then((value) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve(value);
    }, (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(err);
    });
  });
}

// 安卓壳层读文件桥（MainActivity 里 addJavascriptInterface 注入的 AndroidMCP）
function stNativeBridge() {
  let api = null;
  try { api = (typeof window !== 'undefined' && window.AndroidMCP) ? window.AndroidMCP : null; } catch (e) { api = null; }
  if (!api) return null;
  if (typeof api.openPickedFile !== 'function' || typeof api.readPickedFileChunk !== 'function') return null;
  return api;
}

// 运行环境摘要（用户反馈问题时直接显示，省得反复猜 WebView 版本）
function stEnvInfo() {
  let ua = '';
  try { ua = navigator.userAgent || ''; } catch (e) { ua = ''; }
  const m = ua.match(/Chrome\/(\d+)/);
  const hasArrayBuffer = typeof File !== 'undefined' && typeof File.prototype.arrayBuffer === 'function';
  const hasDS = typeof DecompressionStream === 'function';
  const hasTD = typeof TextDecoder === 'function';
  return [
    `引擎：${m ? 'Chromium ' + m[1] : (ua ? ua.slice(0, 60) : '未知')}`,
    `File.arrayBuffer：${hasArrayBuffer ? '有' : '无（走 FileReader）'}`,
    `DecompressionStream：${hasDS ? '有' : '无（走内置解压）'}`,
    `TextDecoder：${hasTD ? '有' : '无（走 escape 兜底）'}`,
    `安卓壳层读文件兜底：${stNativeBridge() ? '可用' : '不可用'}`
  ].join('\n');
}

function stBase64ToBytes(b64) {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// 安卓壳层直接读刚选中的文件：ContentResolver 不受 WebView content:// 读取限制
function stReadPickedFileViaNative(index) {
  const api = stNativeBridge();
  if (!api) throw new Error('安卓壳层兜底读取不可用');
  let size = 0;
  try { size = Number(api.openPickedFile(index)) || 0; } catch (e) {
    throw new Error('安卓壳层读取失败：' + ((e && e.message) || e));
  }
  if (!size) throw new Error('安卓壳层读到的文件是空的');
  const CHUNK = 192 * 1024;
  const parts = [];
  let total = 0;
  try {
    for (let offset = 0; offset < size; offset += CHUNK) {
      const len = Math.min(CHUNK, size - offset);
      const b64 = api.readPickedFileChunk(offset, len);
      if (!b64) throw new Error('安卓壳层读取中断');
      const part = stBase64ToBytes(b64);
      parts.push(part);
      total += part.length;
    }
  } finally {
    try { if (typeof api.closePickedFile === 'function') api.closePickedFile(); } catch (e) { /* 忽略 */ }
  }
  const out = new Uint8Array(total);
  let pos = 0;
  for (let i = 0; i < parts.length; i++) {
    out.set(parts[i], pos);
    pos += parts[i].length;
  }
  return out;
}

// 诊断浮层：内联样式自建，不依赖主题/CSS，保证一定看得见
let stDiagEl = null;
function stEnsureDiagEl() {
  if (stDiagEl) return stDiagEl;
  try {
    const el = document.createElement('div');
    el.id = 'st-diag-overlay';
    el.style.cssText = 'position:fixed;left:0;top:0;right:0;bottom:0;z-index:2147483647;display:none;' +
      'align-items:center;justify-content:center;background:rgba(15,23,42,.45);padding:18px;' +
      '-webkit-box-sizing:border-box;box-sizing:border-box;';
    el.innerHTML =
      '<div style="width:100%;max-width:420px;max-height:82%;display:flex;flex-direction:column;background:#fff;' +
      'border-radius:16px;padding:16px 16px 12px;box-sizing:border-box;box-shadow:0 18px 40px rgba(15,23,42,.25);">' +
        '<div id="st-diag-title" style="font-size:15px;font-weight:600;margin-bottom:8px;color:#1f2937;">正在解析角色卡…</div>' +
        '<div id="st-diag-body" style="font-size:12px;line-height:1.7;color:#4b5563;white-space:pre-wrap;' +
        'overflow-y:auto;-webkit-overflow-scrolling:touch;max-height:50vh;word-break:break-all;"></div>' +
        '<div style="display:flex;gap:8px;margin-top:12px;">' +
          '<button type="button" id="st-diag-retry" style="display:none;flex:1;padding:9px 0;border-radius:10px;' +
          'border:none;background:#07c160;color:#fff;font-size:13px;">重试</button>' +
          '<button type="button" id="st-diag-close" style="display:none;flex:1;padding:9px 0;border-radius:10px;' +
          'border:1px solid #d1d5db;background:#fff;color:#374151;font-size:13px;">关闭</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(el);
    stDiagEl = el;
    return el;
  } catch (e) {
    return null;
  }
}

function stShowDiag(opts) {
  const el = stEnsureDiagEl();
  if (!el) return false;
  try {
    const title = el.querySelector('#st-diag-title');
    const body = el.querySelector('#st-diag-body');
    const retryBtn = el.querySelector('#st-diag-retry');
    const closeBtn = el.querySelector('#st-diag-close');
    if (title) title.textContent = opts.title || '';
    if (body) body.textContent = opts.detail || '';
    if (retryBtn) {
      retryBtn.style.display = opts.onRetry ? 'block' : 'none';
      retryBtn.onclick = opts.onRetry ? () => { stHideDiag(); opts.onRetry(); } : null;
    }
    if (closeBtn) {
      closeBtn.style.display = opts.closable === false ? 'none' : 'block';
      closeBtn.onclick = () => stHideDiag();
    }
    el.style.display = 'flex';
  } catch (e) {
    return false;
  }
  return true;
}

function stHideDiag() {
  try { if (stDiagEl) stDiagEl.style.display = 'none'; } catch (e) { /* 忽略 */ }
}

// ★ 兼容性：Blob.arrayBuffer() / Blob.text() 同样是 Chromium 76+ 才有。
//   老 WebView 上直接调用会抛 "file.arrayBuffer is not a function"，
//   真机表现就是「文件能选中，但导入没有任何反应」。这里统一走 FileReader（全版本都有），
//   这里统一走 FileReader（全版本都有），与项目里其它导入（头像 / 备份 / 阅读器）保持一致。
//   fileIndex 用于「WebView 读不到 → 交给安卓壳层读」的兜底。
function stReadFileViaReader(file) {
  return new Promise((resolve, reject) => {
    try {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => {
        const e = reader.error;
        reject(new Error((e && e.message) ? e.message : '文件读取失败'));
      };
      reader.onabort = () => reject(new Error('文件读取被中断'));
      reader.readAsArrayBuffer(file);
    } catch (e) {
      reject(e);
    }
  });
}

async function stReadFileAsArrayBuffer(file, fileIndex) {
  try {
    // 关键：包一层超时。老 WebView 读 content:// 时可能永远不回调，不能死等
    const bytes = await stWithTimeout(stReadFileViaReader(file), ST_READ_TIMEOUT_MS, '读取文件');
    const len = (bytes && (bytes.byteLength || bytes.length)) || 0;
    if (!len) throw new Error('文件是空的（0 字节）');
    stDiag('FileReader 读取完成', len + ' 字节');
    return bytes;
  } catch (err) {
    const reason = (err && err.message) || String(err);
    stDiag('FileReader 读取失败', reason);
    // 兜底：让安卓壳层用 ContentResolver 直接读（绕过 WebView 对 content:// 的限制）
    if (typeof fileIndex === 'number' && stNativeBridge()) {
      const bytes = stReadPickedFileViaNative(fileIndex);
      stDiag('安卓壳层兜底读取成功', bytes.byteLength + ' 字节');
      return bytes;
    }
    throw err;
  }
}

// 字节 → UTF-8 文本（兼容没有 TextDecoder 的极老 WebView）
function stDecodeUtf8Text(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (typeof TextDecoder === 'function') {
    try { return new TextDecoder('utf-8').decode(u8); } catch (e) { /* 走下面的兜底 */ }
  }
  let bin = '';
  const CHUNK = 0x8000;
  for (let i = 0; i < u8.length; i += CHUNK) {
    bin += String.fromCharCode.apply(null, u8.subarray(i, i + CHUNK));
  }
  try { return decodeURIComponent(escape(bin)); } catch (e) { return bin; }
}

// 文件头判断是否为 PNG（部分安卓文件管理器不给 File.type，也可能丢掉后缀）
function stLooksLikePng(bytes) {
  const u8 = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes || []);
  if (u8.length < 8) return false;
  const sig = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (u8[i] !== sig[i]) return false;
  }
  return true;
}

// 从 PNG 数据块中提取 SillyTavern 角色卡 JSON
async function stExtractFromPng(arrayBuffer) {
  // 兼容 FileReader 回传的 ArrayBuffer 与直接传入的 Uint8Array
  const bytes = arrayBuffer instanceof Uint8Array ? arrayBuffer : new Uint8Array(arrayBuffer);
  const SIGN = [137, 80, 78, 71, 13, 10, 26, 10];
  if (bytes.length < 8) throw new Error('文件内容不完整，不是有效的 PNG');
  for (let i = 0; i < SIGN.length; i++) {
    if (bytes[i] !== SIGN[i]) throw new Error('这不是有效的 PNG 文件（SillyTavern 角色卡请导出为 PNG）');
  }
  let chara = '';
  let ccv3 = '';
  let offset = 8;
  while (offset + 12 <= bytes.length) {
    const len = ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
    const type = stBytesToLatin1(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    if (dataStart + len > bytes.length) break;
    const chunk = bytes.subarray(dataStart, dataStart + len);
    if (type === 'IEND') break;

    if (type === 'tEXt') {
      const z = chunk.indexOf(0);
      if (z > 0) {
        const key = stBytesToLatin1(chunk.subarray(0, z));
        const val = stBytesToLatin1(chunk.subarray(z + 1));
        if (key === 'chara') chara = val;
        else if (key === 'ccv3') ccv3 = val;
      }
    } else if (type === 'iTXt') {
      const z = chunk.indexOf(0);
      if (z > 0) {
        const key = stBytesToLatin1(chunk.subarray(0, z));
        const compressFlag = chunk[z + 1];
        let p = z + 3;                              // 跳过 keyword\0 + flag + method
        const z2 = chunk.indexOf(0, p);             // languageTag
        p = (z2 >= 0 ? z2 : chunk.length - 1) + 1;
        const z3 = chunk.indexOf(0, p);             // translatedKeyword
        p = (z3 >= 0 ? z3 : chunk.length - 1) + 1;
        let textBytes = chunk.subarray(p);
        if (compressFlag === 1) textBytes = await stInflateDeflate(textBytes);
        const val = stDecodeUtf8Text(textBytes);
        if (key === 'chara') chara = val;
        else if (key === 'ccv3') ccv3 = val;
      }
    } else if (type === 'zTXt') {
      const z = chunk.indexOf(0);
      if (z > 0) {
        const key = stBytesToLatin1(chunk.subarray(0, z));
        const inflated = await stInflateDeflate(chunk.subarray(z + 2));
        const val = stBytesToLatin1(inflated);
        if (key === 'chara') chara = val;
        else if (key === 'ccv3') ccv3 = val;
      }
    }
    offset = dataStart + len + 4; // 跳过 CRC
  }
  const payload = chara || ccv3;
  if (!payload) return null;
  return JSON.parse(stDecodeBase64Utf8(payload));
}

// JSON 文本宽松解析（容忍 BOM / 前后多余字符）
function stParseJsonLoose(text) {
  const raw = String(text || '').replace(/^\uFEFF/, '').trim();
  try {
    return JSON.parse(raw);
  } catch (e) {
    const i = raw.indexOf('{');
    const j = raw.lastIndexOf('}');
    if (i >= 0 && j > i) return JSON.parse(raw.slice(i, j + 1));
    throw new Error('JSON 结构无法解析');
  }
}

// 判断载荷类型：角色卡 / 世界书 / 未知
function stDetectPayloadKind(raw) {
  if (!raw || typeof raw !== 'object') return 'unknown';
  const data = (raw.data && typeof raw.data === 'object') ? raw.data : raw;
  const hasBook = data.character_book && data.character_book.entries;
  const hasOwnEntries = raw.entries && (Array.isArray(raw.entries) || typeof raw.entries === 'object');
  if (hasBook && (data.name || raw.name)) return 'card';
  if (hasOwnEntries && !(data.name && data.first_mes !== undefined)) return 'lorebook';
  if (data.name && (data.description !== undefined || data.first_mes !== undefined || data.personality !== undefined || data.scenario !== undefined)) return 'card';
  if (raw.name && (raw.description !== undefined || raw.first_mes !== undefined)) return 'card';
  if (hasOwnEntries) return 'lorebook';
  if (data.spec || raw.spec) return 'card';
  return 'unknown';
}

// 归一化角色卡字段（V1 / V2 / V3 兼容）
function stNormalizeCard(raw) {
  const data = (raw && raw.data && typeof raw.data === 'object') ? raw.data : raw;
  const name = String(data.name || raw.name || '').trim() || '未命名角色';
  const pick = v => (typeof v === 'string' ? v.trim() : '');

  const blocks = [];
  const pushBlock = (label, val) => {
    const v = pick(val);
    if (v) blocks.push(`【${label}】\n${v}`);
  };
  pushBlock('角色描述', data.description);
  pushBlock('性格', data.personality);
  pushBlock('场景', data.scenario);
  pushBlock('开场白', data.first_mes || data.first_message);
  pushBlock('对话示例', data.mes_example || data.example_dialogue);
  pushBlock('创作者备注', data.creator_notes || data.creatorcomment);

  const tags = Array.isArray(data.tags) ? data.tags : (Array.isArray(raw.tags) ? raw.tags : []);
  const remarkBits = [];
  if (data.creator) remarkBits.push(`作者: ${data.creator}`);
  if (tags.length) remarkBits.push(`标签: ${tags.join(' / ')}`);
  remarkBits.push('来源: SillyTavern 角色卡');

  return {
    name,
    persona: blocks.join('\n\n'),
    remark: remarkBits.join(' | '),
    group: pick(tags[0]),
    creator: pick(data.creator),
    tags: tags.map(t => String(t)).filter(Boolean),
    appearance: pick(data.appearance),
    characterBook: data.character_book || raw.character_book || null
  };
}

// 展平世界书条目（数组或 {"0": {...}} 形式都兼容）
function stFlattenLorebook(book) {
  if (!book) return [];
  const list = book.entries;
  if (!list) return [];
  if (Array.isArray(list)) return list.filter(Boolean);
  if (typeof list === 'object') return Object.keys(list).map(k => list[k]).filter(Boolean);
  return [];
}

// 单条 ST 世界书条目 → 本系统世界书条目
function stMapWorldEntry(entry, index) {
  const ext = (entry.extensions && typeof entry.extensions === 'object') ? entry.extensions : {};

  const rawKeys = Array.isArray(entry.keys)
    ? entry.keys
    : (typeof entry.keys === 'string' ? entry.keys.split(/[,，|;；]/) : []);
  const rawSecondary = Array.isArray(entry.secondary_keys)
    ? entry.secondary_keys
    : (typeof entry.secondary_keys === 'string' ? entry.secondary_keys.split(/[,，|;；]/) : []);

  const keywords = [];
  rawKeys.concat(rawSecondary).forEach(k => {
    const s = String(k == null ? '' : k).trim();
    if (s && keywords.indexOf(s) === -1) keywords.push(s);
  });

  // 模式：禁用 > 常驻 > 关键词
  const enabled = entry.enabled !== false && entry.disable !== true;
  const isConstant = entry.constant === true;
  const mode = !enabled ? 'disabled' : (isConstant ? 'constant' : 'selective');

  // 触发概率（ST 用 extensions.probability + useProbability 控制）
  const rawProb = ext.probability !== undefined
    ? Number(ext.probability)
    : (entry.probability !== undefined ? Number(entry.probability) : NaN);
  const useProbability = ext.useProbability !== false && ext.use_probability !== false;
  let probability = 100;
  if (useProbability && isFinite(rawProb)) {
    // 绝大多数卡是 0-100，个别写成 0-1 的比例值
    probability = (rawProb > 0 && rawProb <= 1) ? Math.round(rawProb * 100) : Math.round(rawProb);
  }
  probability = Math.min(100, Math.max(0, probability));

  // 注入深度：ST 的 depth 是「从最新消息往上数第 N 条」，本系统是「越小越靠前」，需翻转
  const stDepthRaw = ext.depth !== undefined
    ? Number(ext.depth)
    : (entry.depth !== undefined ? Number(entry.depth) : NaN);
  const hasDepth = isFinite(stDepthRaw);
  let depth;
  if (hasDepth) {
    const d = Math.min(20, Math.max(0, stDepthRaw));
    depth = Math.min(100, Math.max(1, Math.round(100 - d * 4.5)));
  } else {
    // 没有 depth 时退化用 position：before_char 更靠前，after_char 稍后
    const pos = entry.position;
    depth = (pos === 'before_char' || pos === 0 || pos === '0') ? 6 : 14;
  }

  const comment = String(entry.comment || entry.name || '').trim();
  const content = String(entry.content || '').trim();

  return {
    title: (comment || keywords[0] || `条目 ${index + 1}`).slice(0, 80),
    mode,
    keywords: keywords.join(', '),
    probability,
    depth,
    content,
    isActive: mode !== 'disabled',
    // —— 原始 SillyTavern 元数据留档 ——
    stSource: 'sillytavern',
    stKeys: rawKeys.map(String),
    stSecondaryKeys: rawSecondary.map(String),
    stConstant: isConstant,
    stSelective: entry.selective !== false,
    stCaseSensitive: !!entry.case_sensitive,
    stPosition: entry.position === undefined ? null : entry.position,
    stDepth: hasDepth ? stDepthRaw : null,
    stOrder: isFinite(Number(entry.insertion_order)) ? Number(entry.insertion_order) : null,
    stUseProbability: useProbability,
    stRawProbability: isFinite(rawProb) ? rawProb : null,
    importedAt: Date.now()
  };
}

// 把选中的文件整理成待确认草稿
async function stBuildImportDraft(files) {
  const cards = [];
  const orphanBooks = []; // 单独附带的世界书文件，归到第一张卡

  for (let fileIndex = 0; fileIndex < files.length; fileIndex++) {
    const file = files[fileIndex];
    const name = String((file && file.name) || '未命名文件');
    const lower = name.toLowerCase();
    const type = String((file && file.type) || '');
    stDiag('准备读取文件', `${name} · ${(file && file.size) || 0} 字节 · type=${type || '空'}`);

    // 先按字节读入（统一走 FileReader，兼容老 WebView），后面按文件头判断真实类型
    let bytes;
    try {
      bytes = await stReadFileAsArrayBuffer(file, fileIndex);
    } catch (e) {
      throw new Error(`「${name}」读取失败：${(e && e.message) || '文件无法读取'}`);
    }
    if (!bytes || !bytes.byteLength) throw new Error(`「${name}」是空文件`);

    const isPng = stLooksLikePng(bytes) || lower.endsWith('.png') || type === 'image/png';
    const isWebp = !isPng && (lower.endsWith('.webp') || type === 'image/webp');
    let raw = null;

    if (isPng) {
      // 解压/解析也加超时：动态 Huffman 数据异常时不能把页面卡死
      raw = await stWithTimeout(stExtractFromPng(bytes), ST_PARSE_TIMEOUT_MS, '解析 PNG');
      if (!raw) throw new Error(`「${name}」里没有角色卡数据，可能不是 SillyTavern 导出的 PNG`);
    } else if (isWebp) {
      throw new Error(`暂不支持 WebP 角色卡，「${name}」请在 SillyTavern 里导出为 PNG`);
    } else {
      raw = stParseJsonLoose(stDecodeUtf8Text(bytes));
    }

    const kind = stDetectPayloadKind(raw);
    if (kind === 'card') {
      const card = stNormalizeCard(raw);
      const mapped = stFlattenLorebook(card.characterBook)
        .map((e, i) => stMapWorldEntry(e, i))
        .filter(e => e.content);

      // 头像压缩：直接用已读到的字节构造 Blob，避免再让 WebView 读一次文件（老机型最容易挂）
      let avatarBlob = null;
      if (isPng && typeof Blob === 'function') {
        try {
          const src = new Blob([bytes], { type: 'image/png' });
          avatarBlob = await stWithTimeout(compressImageBlob(src, 160, 0.85), ST_AVATAR_TIMEOUT_MS, '头像压缩');
        } catch (e) {
          stDiag('头像压缩跳过', (e && e.message) || String(e));
          avatarBlob = null;
        }
      }
      stDiag('识别到角色卡', `${card.name} · 世界书 ${mapped.length} 条`);
      cards.push({ file, card, entries: mapped, avatarBlob });
    } else if (kind === 'lorebook') {
      const mapped = stFlattenLorebook(raw)
        .map((e, i) => stMapWorldEntry(e, i))
        .filter(e => e.content);
      orphanBooks.push(...mapped);
      stDiag('识别到独立世界书', `${mapped.length} 条`);
    } else {
      throw new Error(`「${name}」不是可识别的 SillyTavern 角色卡或世界书`);
    }
  }

  if (!cards.length) throw new Error('请至少选择一张角色卡（.png 或 .json）');

  // 外挂的世界书条目并入第一张卡，避免出现无主条目
  if (orphanBooks.length) cards[0].entries = cards[0].entries.concat(orphanBooks);

  const allEntries = cards.reduce((n, c) => n + c.entries.length, 0);
  const defaultGroup = `世界书·${cards[0].card.name}`;

  return { cards, allEntries, defaultGroup };
}

// 渲染导入预览
function stRenderImportPreview() {
  const d = stImportDraft;
  if (!d) return;

  const first = d.cards[0];
  const summary = document.getElementById('st-import-card-summary');
  if (summary) {
    summary.innerHTML = '';
    const avatar = document.createElement('div');
    avatar.style.cssText = 'width:52px; height:52px; border-radius:12px; overflow:hidden; flex-shrink:0; background:#eef1f4; display:flex; align-items:center; justify-content:center; font-weight:800; color:#8a94a6; font-size:18px;';
    if (first.avatarBlob) {
      const img = document.createElement('img');
      img.style.cssText = 'width:100%; height:100%; object-fit:cover;';
      const url = URL.createObjectURL(first.avatarBlob);
      img.src = url;
      img.onload = () => URL.revokeObjectURL(url);
      avatar.appendChild(img);
    } else {
      avatar.textContent = first.card.name.slice(0, 1);
    }
    const info = document.createElement('div');
    info.style.cssText = 'min-width:0; flex:1;';
    const nameLine = document.createElement('div');
    nameLine.style.cssText = 'font-size:13.5px; font-weight:800; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
    nameLine.textContent = first.card.name + (d.cards.length > 1 ? ` 等 ${d.cards.length} 个角色` : '');
    const subLine = document.createElement('div');
    subLine.style.cssText = 'font-size:11px; color:var(--text-secondary); margin-top:3px; line-height:1.5;';
    subLine.textContent = (first.card.tags.length ? first.card.tags.slice(0, 4).join(' / ') : '无标签')
      + ` · ${first.card.persona.length} 字人设`;
    info.appendChild(nameLine);
    info.appendChild(subLine);
    summary.appendChild(avatar);
    summary.appendChild(info);
  }

  const groupInput = document.getElementById('st-import-group');
  if (groupInput && !groupInput.value.trim()) groupInput.value = d.defaultGroup;

  // 统计
  const stats = document.getElementById('st-import-stats');
  if (stats) {
    let constantN = 0, selectiveN = 0, disabledN = 0, depthFlipN = 0, probN = 0;
    d.cards.forEach(c => c.entries.forEach(e => {
      if (e.mode === 'constant') constantN++;
      else if (e.mode === 'disabled') disabledN++;
      else selectiveN++;
      if (e.stDepth !== null) depthFlipN++;
      if (e.probability < 100) probN++;
    }));
    stats.innerHTML = `<b style="color:var(--text-primary);">共 ${d.allEntries} 条世界书设定</b>　`
      + `<span style="color:#3b82f6;">常驻 ${constantN}</span> · `
      + `<span style="color:#07c160;">关键词 ${selectiveN}</span> · `
      + `<span style="color:#ef4444;">禁用 ${disabledN}</span><br>`
      + `其中 ${depthFlipN} 条带注入深度（已翻转），${probN} 条触发概率低于 100%。`;
  }

  stRenderImportEntryList();
}

// 渲染条目预览列表（去重，避免多张卡重复条目）
function stRenderImportEntryList() {
  const d = stImportDraft;
  const list = document.getElementById('st-import-entry-list');
  if (!d || !list) return;
  list.innerHTML = '';
  if (!d.allEntries) {
    list.innerHTML = '<div style="font-size:11.5px; color:var(--text-secondary); padding:10px; text-align:center;">这张卡没有内嵌世界书，只会导入角色本体。</div>';
    return;
  }
  const seen = {};
  d.cards.forEach(c => c.entries.forEach(e => {
    const key = e.title + '|' + e.content.slice(0, 24);
    if (seen[key]) return;
    seen[key] = true;

    const color = e.mode === 'constant' ? '#3b82f6' : (e.mode === 'disabled' ? '#ef4444' : '#07c160');
    const row = document.createElement('div');
    row.style.cssText = 'display:flex; gap:8px; align-items:flex-start; font-size:11px; line-height:1.5; padding:6px 8px; border-radius:9px; background:#f7f9fb;';

    const badge = document.createElement('span');
    badge.textContent = e.mode === 'constant' ? '常驻' : (e.mode === 'disabled' ? '禁用' : '关键词');
    badge.style.cssText = `flex-shrink:0; font-size:10px; font-weight:700; padding:1px 6px; border-radius:6px; color:#fff; background:${color};`;

    const body = document.createElement('div');
    body.style.cssText = 'min-width:0; flex:1;';

    const titleLine = document.createElement('div');
    titleLine.style.cssText = 'font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;';
    titleLine.textContent = e.title;

    const metaLine = document.createElement('div');
    metaLine.style.cssText = 'color:var(--text-secondary); font-size:10.5px; margin-top:1px;';
    const bits = [];
    bits.push(`深度 ${e.depth}${e.stDepth !== null ? `（ST ${e.stDepth}）` : ''}`);
    bits.push(`概率 ${e.probability}%`);
    bits.push(e.keywords ? `触发词 ${e.keywords.split(',').length} 个` : '无触发词');
    metaLine.textContent = bits.join(' · ');

    body.appendChild(titleLine);
    body.appendChild(metaLine);
    row.appendChild(badge);
    row.appendChild(body);
    list.appendChild(row);
  }));
}

// 关闭预览弹层
function stCloseImportPreview() {
  const overlay = document.getElementById('st-import-overlay');
  if (overlay) overlay.classList.remove('active');
  // 复位按钮状态：否则导入成功后再导入一次时按钮仍是 disabled，点不动
  const confirmBtn = document.getElementById('btn-confirm-st-import');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = '确认导入';
  }
  const cancelBtn = document.getElementById('btn-cancel-st-import');
  if (cancelBtn) cancelBtn.disabled = false;
  stImportDraft = null;
}

// 确认导入：角色本体 + 配套世界书一次性落库（同一事务，失败整张卡回滚）
async function stConfirmImport() {
  const d = stImportDraft;
  if (!d) return;

  const btn = document.getElementById('btn-confirm-st-import');
  const cancelBtn = document.getElementById('btn-cancel-st-import');
  const groupInput = document.getElementById('st-import-group');
  const constantCb = document.getElementById('st-import-constant-group');

  const groupName = (constantCb && constantCb.checked)
    ? '常驻'
    : ((groupInput && groupInput.value.trim()) || d.defaultGroup);

  const oldLabel = btn ? btn.textContent : '';
  if (btn) { btn.disabled = true; btn.textContent = '正在写入...'; }
  if (cancelBtn) cancelBtn.disabled = true;

  let charCount = 0;
  let entryCount = 0;

  try {
    for (const item of d.cards) {
      const card = item.card;
      const rows = item.entries.map(e => Object.assign({}, e, { group: groupName }));

      await db.transaction('rw', db.archives, db.world_book_entries, async () => {
        await db.archives.add({
          type: 'character',
          name: card.name,
          avatar: item.avatarBlob || '',
          remark: card.remark,
          group: card.group || '',
          persona: card.persona,
          parentId: null,
          nativeLanguage: '',
          appearance: card.appearance || '',
          lockfaceImages: [],
          // 来源标记：便于日后区分「导入」与「手写」的角色
          stSource: 'sillytavern',
          stCreator: card.creator || '',
          stTags: card.tags,
          stImportedAt: Date.now()
        });
        if (rows.length) await db.world_book_entries.bulkAdd(rows);
      });

      charCount++;
      entryCount += rows.length;
    }
  } catch (err) {
    console.error('SillyTavern 角色卡导入失败:', err);
    if (btn) { btn.disabled = false; btn.textContent = oldLabel; }
    if (cancelBtn) cancelBtn.disabled = false;
    if (typeof showToast === 'function') {
      showToast('导入失败：' + ((err && err.message) ? err.message : '未知错误'));
    }
    return;
  }

  stCloseImportPreview();

  try {
    if (typeof loadArchivesData === 'function') await loadArchivesData();
  } catch (e) { console.warn('刷新档案库失败:', e); }
  try {
    // 世界书页面若已渲染过，顺手刷新，避免要重启才看到新条目
    if (typeof loadWorldBookData === 'function' && document.getElementById('world_book-list-container')) {
      await loadWorldBookData();
    }
  } catch (e) { console.warn('刷新世界书失败:', e); }

  if (typeof showToast === 'function') {
    showToast(`已导入 ${charCount} 个角色` + (entryCount ? ` · ${entryCount} 条世界书设定（分组：${groupName}）` : ''));
  }
}

// 初始化导入入口
function initSillyTavernImport() {
  const btn = document.getElementById('btn-archive-st-import');
  const input = document.getElementById('file-archive-st-import');
  if (!btn || !input) return;
  if (btn.dataset.stBound === '1') return;
  btn.dataset.stBound = '1';

  // 统一的失败反馈：Toast 不一定存在（不同壳层），兜底用 alert，绝不静默失败
  const stNotify = (msg) => {
    try { if (typeof showToast === 'function') { showToast(msg); return; } } catch (e) { /* 继续兜底 */ }
    try { if (typeof alert === 'function') { alert(msg); return; } } catch (e) { /* 继续兜底 */ }
    stShowDiag({ title: msg, detail: '', closable: true });
  };

  // —— 选文件看门狗 ——
  // 安卓壳层若没把选中的文件交回网页，change 事件永远不会触发，旧版表现就是「完全没有反应」。
  // 这里在「页面重新可见 / 获得焦点」后开始计时，超时仍未收到文件就明说。
  let pickHandled = true;
  let pickTimer = 0;

  const openPicker = () => {
    pickHandled = false;
    stDiag('点击导入按钮 → 打开文件选择器');
    try { input.value = ''; } catch (e) { /* 忽略 */ }
    armPickWatchdog(90000); // 极端情况：用户在选择器里挑很久
    try {
      input.click();
    } catch (e) {
      pickHandled = true;
      clearTimeout(pickTimer);
      stNotify('无法打开文件选择器：' + ((e && e.message) || e));
    }
  };

  function armPickWatchdog(ms) {
    clearTimeout(pickTimer);
    pickTimer = setTimeout(() => {
      if (pickHandled) return;
      stDiag('看门狗触发：文件没有回传到网页');
      stShowDiag({
        title: '没有收到文件',
        detail: '系统文件选择器已经关闭，但安卓壳层没有把文件交回网页。\n\n' +
                '点「重试」可以再选一次；如果反复如此，建议更新系统的「Android System WebView」。\n\n' +
                '—— 环境 ——\n' + stEnvInfo(),
        closable: true,
        onRetry: openPicker
      });
    }, ms);
  }

  btn.addEventListener('click', openPicker);

  const probeAfterReturn = () => {
    if (pickHandled) return;
    armPickWatchdog(6000);
  };
  try { window.addEventListener('focus', probeAfterReturn); } catch (e) { /* 忽略 */ }
  try {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) probeAfterReturn();
    });
  } catch (e) { /* 忽略 */ }

  input.addEventListener('change', async () => {
    pickHandled = true;
    clearTimeout(pickTimer);
    const files = Array.from(input.files || []);
    stDiag('change 事件触发', '文件数=' + files.length);
    if (!files.length) {
      // 安卓壳偶发「选完文件却没回传」的情况，给一次明确提示，而不是毫无反应
      stDiag('文件列表为空');
      stNotify('没有读取到所选文件，请再选一次');
      try { input.value = ''; } catch (e) { /* 忽略 */ }
      return;
    }
    const fileLines = files.map((f) => `${f.name || '未命名'}（${f.size || 0} 字节，type=${f.type || '空'}）`).join('\n');
    stShowDiag({
      title: '正在解析角色卡…',
      detail: fileLines + '\n\n解析完成后会自动进入预览。',
      closable: false
    });
    try {
      stImportDraft = await stWithTimeout(stBuildImportDraft(files), 60000, '解析角色卡');
      if (!stImportDraft.allEntries) {
        // 没有世界书也要能导入角色本体，此处仅提示
        stDiag('该角色卡未内嵌世界书');
      }
      const overlay = document.getElementById('st-import-overlay');
      if (!overlay) throw new Error('预览弹层缺失，请更新到最新版本');
      stHideDiag();
      overlay.classList.add('active');
      const groupInput = document.getElementById('st-import-group');
      if (groupInput) groupInput.value = stImportDraft.defaultGroup;
      const constantCb = document.getElementById('st-import-constant-group');
      if (constantCb) constantCb.checked = false;
      stRenderImportPreview();
      stDiag('预览已打开');
    } catch (err) {
      stImportDraft = null;
      try { console.error('解析角色卡失败:', err); } catch (e) { /* 忽略 */ }
      const detail = (err && err.message) ? err.message : String(err || '未知错误');
      stDiag('解析失败', detail);
      stShowDiag({
        title: '角色卡导入失败',
        detail: detail + '\n\n—— 诊断记录 ——\n' + stDiagLog.join('\n') + '\n\n—— 环境 ——\n' + stEnvInfo(),
        closable: true,
        onRetry: openPicker
      });
    } finally {
      try { input.value = ''; } catch (e) { /* 忽略 */ }
    }
  });

  const closeBtn = document.getElementById('btn-close-st-import');
  if (closeBtn) closeBtn.addEventListener('click', stCloseImportPreview);
  const cancelEl = document.getElementById('btn-cancel-st-import');
  if (cancelEl) cancelEl.addEventListener('click', stCloseImportPreview);
  const confirmEl = document.getElementById('btn-confirm-st-import');
  if (confirmEl) confirmEl.addEventListener('click', stConfirmImport);

  const overlay = document.getElementById('st-import-overlay');
  if (overlay) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) stCloseImportPreview();
    });
  }
}

