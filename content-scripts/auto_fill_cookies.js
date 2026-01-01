console.log('%c[OTH] 自动填充模块加载完成', 'color: green;');

function initializeAutoFill() {
  const section = document.querySelector("form > div.section__body");
  
  if (section) {
    const existingButton = section.querySelector('.auto-fill-button');
    if (existingButton) {
      console.log('%c[OTH] 按钮配置成功', 'color: green;');
      return;
    }
    
    console.log("[OTH] 准备创建按钮");
    const button = document.createElement("span");
    button.className = "rounded button auto-fill-button";
    button.textContent = '自动填充';
    button.addEventListener("click", async () => {
      console.log("[OTH] 检测到按钮已被用户点击");
      
      try {
        const message = {
          action: "updateTopscodingCookies",
          message: "Trigger auto fill tokens!"
        };
        
        chrome.runtime.sendMessage(message);
        const originalText = button.textContent;
        button.textContent = '正在填充...';
        setTimeout(() => {
          button.textContent = originalText;
        }, 2000);
        
        console.log("[OTH] 消息已发送");
      } catch (error) {
        console.error("[OTH] 消息发送错误:", error);
      }
    });
    section.appendChild(button);
    console.log('%c[OTH] 按钮已加载到页面', 'color: green;');
  }
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeAutoFill);
} else {
  initializeAutoFill();
}
setTimeout(initializeAutoFill, 1000);