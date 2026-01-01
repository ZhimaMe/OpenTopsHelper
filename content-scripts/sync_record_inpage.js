(function() {
  try {
    const dataElement = document.getElementById("ext-sync-data");
    if (!dataElement) {
      console.error("[OTH] 未找到同步数据元素");
      return;
    }

    const syncData = JSON.parse(dataElement.textContent);
    console.log("[OTH] 已找到的数据:", syncData);

    const formData = new URLSearchParams();
    for (const key in syncData) {
      if (syncData.hasOwnProperty(key)) {
        formData.append(key, syncData[key]);
      }
    }

    const headers = {
      "Content-Type": "application/x-www-form-urlencoded"
    };

    fetch("https://www.topscoding.com/api/sync_record", {
      method: "POST",
      headers: headers,
      body: formData.toString()
    })
    .then(async response => {
      if (!response.ok) {
        let responseBody = '';
        try {
          responseBody = await response.text();
        } catch (error) {
          console.warn("[OTH] 无法解析错误响应:", error);
        }
        
        window.postMessage({
          type: "syncResult",
          data: {
            status: "failed",
            statusText: "Request " + response.status,
            body: responseBody
          }
        }, '*');
        return;
      }

      // 请求成功，解析响应
      let result;
      try {
        result = await response.json();
      } catch (error) {
        // JSON解析失败
        const errorResult = {
          error: true,
          status: response.status,
          statusText: "JSON parse error",
          body: ''
        };
        
        window.postMessage({
          type: "syncResult",
          data: errorResult
        }, '*');
        return;
      }

      // 发送成功结果
      window.postMessage({
        type: "syncResult",
        data: result
      }, '*');
    })
    .catch(error => {
      // 网络错误
      console.error("同步请求失败:", error);
      window.postMessage({
        type: "syncResult", 
        data: {
          status: "failed",
          statusText: "Network error: " + error.message
        }
      }, '*');
    });

  } catch (error) {
    console.error("同步脚本执行出错:", error);
    window.postMessage({
      type: "syncResult",
      data: {
        status: "failed", 
        statusText: "Script error: " + error.message
      }
    }, '*');
  }
})();