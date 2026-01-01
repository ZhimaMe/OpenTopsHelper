
console.log("%c[OTH] 成功加载同步记录模块", 'color: green;');

function loadContextScript() {
  try {
    if (window.Context) {
      handleContext(window.Context);
    } else {
      const script = document.createElement('script');
      script.src = chrome.runtime.getURL("content-scripts/inject-context.js");
      
      script.onerror = function() {
        console.error("[OTH] 无法加载inject-context.js");
      };
      
      script.onload = function() {
        console.log('%c[OTH] 成功加载inject-context.js', 'color: green;');
        script.remove();
      };
      setTimeout(() => {
        if (script.parentNode) {
          script.remove();
          console.warn("[OTH] inject-context.js加载超时");
        }
      }, 3000);
      
      document.head.appendChild(script);
    }
  } catch (error) {
    console.error("[OTH] 创建脚本时出错", error);
  }
}

if (!window.topscodingContextLoaded) {
  loadContextScript();
  window.topscodingContextLoaded = true;
}
let context = null;
function handleContext(contextData) {
  context = contextData;
  console.log("[OTH] 获取到了如下数据：", context);
  createSyncButton();
}
function createSyncButton() {
  const syncLink = document.querySelector("a[name=\"problem-sidebar__sync_records\"]");
  console.log("[OTH] 检测到题目来自", context?.domainId);
  
  if (syncLink && context?.domainId === 'codeforces') {
    const existingButton = document.querySelector("#help-get-record");
    if (existingButton) {
      console.log("%c[OTH] 成功创建按钮", 'color: green;');
      return;
    }
    const syncButton = document.createElement("div");
    const icon = document.createElement("span");
    icon.className = "icon icon-refresh--outline";
    
    syncButton.className = "menu__link";
    syncButton.style.color = "#007aff";
    syncButton.id = "help-get-record";
    syncButton.textContent = "[OTH] 同步提交记录";
    syncButton.insertBefore(icon, syncButton.firstChild);
    syncLink.parentNode.insertBefore(syncButton, syncLink.nextSibling);
    syncButton.addEventListener("click", showSyncPrompt);
  }
}

function showSyncPrompt() {
  const recordUrl = prompt("请输入提交记录链接：");
  if (!recordUrl) return;
  
  try {
    const message = {
      action: "requestRecord",
      domainId: context.domainId,
      csrfToken: context.csrfToken,
      problemId: context.problemId,
      tid: context.tid,
      ttype: context.ttype,
      getSubmissionsUrl: context.getSubmissionsUrl,
      recordUrl: recordUrl
    };
    
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("通信失败：", chrome.runtime.lastError.message);
        alert("通信失败，请检查记录链接是否正确：" + recordUrl);
        return;
      }
      
      if (response.action === "recievedRecord") {
        handleRecordResponse(response.record, recordUrl);
      }
    });
  } catch (error) {
    console.error("Error in sync process:", error);
  }
}
function handleRecordResponse(record, recordUrl) {
  console.log("获取到提交记录：", record);
  
  if (record.success !== 'OK') {
    console.log("获取记录失败，请检查记录链接是否正确！", recordUrl);
    alert("获取记录失败，请检查记录链接是否正确：" + recordUrl);
  } else if (context.problemId !== record.problemId) {
    console.log("题目不匹配，请检查记录链接是否正确！", record.problemId, context.problemId);
    alert("题目不匹配，请检查记录链接是否正确：" + recordUrl);
  } else {
    const syncData = {
      domain_id: context.domainId,
      pid: record.problemId,
      code: record.code,
      lang: record.language,
      time: record.time,
      status: record.status,
      score: record.score,
      memory: record.memory,
      remote_rid: record.submissionId,
      remote_uid: record.author,
      language: record.language,
      judge_at: record.judgeAt,
      compiler_texts: record.compilerTexts,
      record_link: recordUrl
    };
    
    if (context.ttype) syncData.ttype = context.ttype;
    if (context.tid) syncData.tid = context.tid;
    syncData.csrf_token = context.csrfToken;
    
    console.log('准备同步数据：', syncData);
    const dataScript = document.createElement("script");
    dataScript.id = "ext-sync-data";
    dataScript.type = "application/json";
    dataScript.textContent = JSON.stringify(syncData);
    (document.head || document.documentElement).appendChild(dataScript);
    const syncScript = document.createElement("script");
    syncScript.src = chrome.runtime.getURL("/content-scripts/sync_record_inpage.js");
    (document.head || document.documentElement).appendChild(syncScript);
    syncScript.onload = () => syncScript.remove();
    window.addEventListener("message", handleSyncResult);
  }
}

function handleSyncResult(event) {
  if (event.data?.type === "syncResult") {
    console.log("收到同步结果：", event.data.data);
    const result = event.data.data;
    if (result.status !== "success") {
      alert("同步失败：" + result.status + ',' + result.statusText);
    } else if (result.url) {
      console.log("跳转到记录页面");
      window.location.href = result.url;
    }
    window.removeEventListener("message", handleSyncResult);
  }
}

document.addEventListener("getWebContext", (event) => {
  handleContext(event.detail);
});