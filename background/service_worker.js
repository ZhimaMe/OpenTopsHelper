const COOKIE_CONFIGS = [
  {
    url: "https://iai.sh.cn/",
    name: "token",
    fieldName: "yasc_token"
  },
  {
    url: "https://www.luogu.com.cn/",
    name: "__client_id",
    fieldName: "luogu___client_id"
  },
  {
    url: "https://www.luogu.com.cn/",
    name: "_uid",
    fieldName: "luogu__uid"
  },
  {
    url: "https://atcoder.jp/",
    name: "REVEL_SESSION",
    fieldName: "atcoder_REVEL_SESSION"
  },
  {
    url: "https://codeforces.com/",
    name: "JSESSIONID",
    fieldName: "codeforces_JSESSIONID"
  }
];

function getCookie(url, name) {
  return new Promise(resolve => {
    chrome.cookies.get({ url, name }, cookie => {
      if (chrome.runtime.lastError) {
        console.warn(`[OTH] 获取Cookie失败 ${url} ${name}:`, chrome.runtime.lastError);
        resolve(null);
      } else {
        resolve(cookie);
      }
    });
  });
}

async function getAllCookies() {
  const cookiePromises = COOKIE_CONFIGS.map(config => 
    getCookie(config.url, config.name)
  );
  
  const cookies = await Promise.all(cookiePromises);
  
  const dataToFill = {};
  let foundCount = 0;
  
  for (let i = 0; i < cookies.length; i++) {
    if (cookies[i]) {
      const config = COOKIE_CONFIGS[i];
      dataToFill[config.fieldName] = cookies[i].value;
      foundCount++;
    }
  }
  
  return { dataToFill, foundCount };
}

async function fillCookies(tab) {
  const { dataToFill, foundCount } = await getAllCookies();
  
  if (foundCount === 0) {
      chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        alert("未能获取到任何网站的Cookie。请确保您已登录相关网站，或检查插件配置。");
      }
    });
    return;
  }
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: fillFormData,
    args: [dataToFill]
  });
}
function fillFormData(data) {
  const filledFields = [];
  
  for (const fieldName in data) {
    if (Object.prototype.hasOwnProperty.call(data, fieldName)) {
      const value = data[fieldName];
      const inputField = document.querySelector(`input[name="${fieldName}"]`);
      
      if (inputField) {
        inputField.value = value;
        filledFields.push(fieldName);
        const labelField = inputField.closest('label');
        if (labelField && !labelField.textContent.trim().endsWith(' (✅已填)')) {
          const appendText = document.createTextNode(' (✅已填)');
          labelField.insertBefore(appendText, labelField.firstChild.nextSibling);
        }
      }
    }
  }
  
  console.log(`[OTH] 成功填充了 ${filledFields.length} 个字段:`, filledFields);
}
async function fetchRecordFromUrl(url) {
  const requestId = Math.random().toString(36).slice(2);
  const tab = await chrome.tabs.create({
    url: url + `?requestId=${requestId}`,
    active: false
  });
  return new Promise((resolve, reject) => {
    const messageListener = (message, sender) => {
      if (message.action === 'parsedRecord' && message.requestId === requestId) {
        chrome.runtime.onMessage.removeListener(messageListener);
        chrome.tabs.remove(tab.id);
        resolve(message.data);
      }
    };
    
    chrome.runtime.onMessage.addListener(messageListener);
    setTimeout(() => {
      chrome.runtime.onMessage.removeListener(messageListener);
      chrome.tabs.remove(tab.id);
      reject(new Error('获取记录超时'));
    }, 30000);
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'updateTopscodingCookies') {
    fillCookies(sender.tab)
      .catch(error => {
        console.error('[OTH] 自动填充Cookie时出错:', error);
      });
  }
  if (message.action === 'requestRecord') {
    const errorRecord = {
      success: 'failed',
      message: '获取记录失败，发生未知错误！'
    };
    fetchRecordFromUrl(message.recordUrl)
      .then(result => {
        sendResponse({
          action: 'recievedRecord',
          record: result
        });
      })
      .catch(error => {
        console.error('获取记录失败:', error);
        sendResponse({
          action: 'recievedRecord',
          record: errorRecord
        });
      });
    
    return true;
  }
  
  return false;
});
