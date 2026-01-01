if (window.Context) {
  const contextEvent = new CustomEvent("getWebContext", {
    detail: window.Context
  });
  document.dispatchEvent(contextEvent);
  console.log("[OTH] 数据已分发:", window.Context);
} else {
  console.log("[OTH] 网页中未找到数据");
}