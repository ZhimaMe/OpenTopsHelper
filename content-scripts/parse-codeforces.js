function parseCodeforcesSubmission() {
  const record = {
    recordUrl: window.location.href,
    success: "failed",
    submissionId: null,
    author: null,
    problemId: null,
    language: null,
    score: 0,
    time: null,
    memory: null,
    submittedAt: null,
    judgeAt: null,
    code: "not found",
    status: null,
    compilerTexts: null,
    message: null
  };
  const userLink = document.querySelector("div[id=\"header\"] > div > div > a[href^=\"/profile/\"]");
  const userName = userLink ? userLink.innerText.trim() : null;
  
  if (!userName) {
    record.message = "用户信息获取失败，请检查登录状态！";
    return record;
  }
  const cells = document.querySelectorAll("tr.highlighted-row > td");
  if (cells.length < 9) {
    record.message = "页面结构异常，无法获取提交信息！";
    return record;
  }

  try {
    record.submissionId = cells[0].innerText.trim();
    record.author = cells[1].querySelector("a[href^=\"/profile/\"]")?.innerText.trim() || null;
    record.problemId = cells[2].querySelector("a[href^=\"/\"]")?.innerText.trim() || null;
    record.language = cells[3].innerText.trim();
    record.status = cells[4].innerText.trim();
    record.compilerTexts = cells[4].innerText.trim();
    record.score = record.status === 'Accepted' ? 100 : 0;
    record.time = cells[5].innerText.trim().replace(/\s+s$/, '');
    record.memory = cells[6].innerText.trim().replace(/\s+KB$/, '');
    record.submittedAt = cells[7].innerText.trim();
    record.judgeAt = cells[8].innerText.trim();
    const codeElement = document.querySelector("pre[id=\"program-source-text\"] > ol[class=\"linenums\"]");
    record.code = codeElement ? codeElement.innerText.trim() : "failed to find";
    if (record.author && record.author !== userName) {
      record.message = "用户名和记录不匹配，可能是其他用户的记录！";
    }
    record.success = 'OK';
  } catch (error) {
    console.error("解析提交页面时出错:", error);
    record.message = "解析页面时出错: " + error.message;
  }

  return record;
}
function checkAndHandlePage() {
  const url = location.href;
  if (url.includes("codeforces.com/contest") && url.includes("/submission/")) {
    const params = new URL(url).searchParams;
    const requestId = params.get("requestId");
    
    if (requestId) {
      setTimeout(() => {
        const data = parseCodeforcesSubmission();
        console.log("[OTH] 解析Codeforces记录页面", url);
        
        const message = {
          action: "parsedRecord",
          domainId: 'codeforces',
          data: data,
          requestId: requestId
        };
        
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            console.warn("[OTH]发送消息失败:", chrome.runtime.lastError);
          }
        });
      }, 1000);
    } else {
      console.log("[OTH] URL中未找到requestId参数", url);
    }
  }
}

// 页面加载完成后检查
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', checkAndHandlePage);
} else {
  checkAndHandlePage();
}