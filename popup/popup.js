const USER_GRADE_RANGE = {
  '0': '其他',
  '1': "一年级", '2': '二年级', '3': "三年级", '4': "四年级",
  '5': '五年级', '6': "六年级", '7': "七年级", '8': '八年级',
  '9': "九年级", '10': '高一', '11': '高二', '12': '高三',
  '13': '大一', '14': '大二', '15': '大三', '16': '大四', '17': '毕业生'
};

async function getAllCookies() {
  let tokenCount = 0;
  let session = null;
  const $ = (id) => document.getElementById(id);
  const tokenNum = $('token-num');
  const iaiToken = $('iai-token');
  const atcoderCookie = $('atcoder-cookie');
  const luoguCookie = $('luogu-cookie');
  const cfCookie = $('cf-cookie');
  const uid = $('uid');
  const realname = $('realname');
  const grade = $('grade');
  const coin = $('coin');
  const rp = $('rp');
  const rk = $('rk');
  const rank = $('rank');
  const yacsAc = $('yacs-ac');
  const atcoderAc = $('atcoder-ac');
  const luoguAc = $('luogu-ac');
  const cfAc = $('cf-ac');
  const promises = [
    new Promise(resolve => {
      chrome.cookies.get({
        url: "https://iai.sh.cn/",
        name: "token"
      }, cookie => {
        if (cookie) {
          iaiToken.textContent = cookie.value.substr(0, 6) + "...";
          tokenCount++;
        } else {
          iaiToken.textContent = "Not found";
          document.getElementById('yacs-info').style.display = "none";
        }
        resolve();
      });
    }),
    new Promise(resolve => {
      chrome.cookies.get({
        url: "https://atcoder.jp/",
        name: "REVEL_SESSION"
      }, cookie => {
        if (cookie) {
          atcoderCookie.textContent = cookie.value.substr(0, 6) + "...";
          tokenCount++;
        } else {
          atcoderCookie.textContent = "Not found";
          document.getElementById("atcoder-info").style.display = "none";
        }
        resolve();
      });
    }),
    new Promise(resolve => {
      chrome.cookies.get({
        url: "https://www.luogu.com.cn/",
        name: "__client_id"
      }, cookie => {
        if (cookie) {
          luoguCookie.textContent = cookie.value.substr(0, 6) + "...";
          tokenCount++;
        } else {
          luoguCookie.textContent = "Not found";
          document.getElementById("luogu-info").style.display = "none";
        }
        resolve();
      });
    }),
    new Promise(resolve => {
      chrome.cookies.get({
        url: "https://codeforces.com/",
        name: "JSESSIONID"
      }, cookie => {
        if (cookie) {
          cfCookie.textContent = cookie.value.substr(0, 6) + '...';
          tokenCount++;
        } else {
          cfCookie.textContent = "Not found";
          document.getElementById("cf-info").style.display = 'none';
        }
        resolve();
      });
    }),
    new Promise(resolve => {
      chrome.cookies.get({
        url: "https://www.topscoding.com/",
        name: "sid"
      }, cookie => {
        if (cookie) session = cookie.value;
        resolve();
      });
    })
  ];
  
  await Promise.all(promises);
  tokenNum.textContent = tokenCount;
  try {
    const response = await fetch("https://www.topscoding.com/api/my_info");
    if (!response.ok) throw new Error("Network response was not ok");
    
    const data = await response.json();
    console.log(data);
    
    uid.textContent = data._id;
    realname.textContent = data.realname;
    grade.textContent = USER_GRADE_RANGE[data.grade];
    coin.textContent = Number(data.coin).toFixed(2);
    rank.textContent = data.system.rank;
    rp.textContent = Number(data.system.rp).toFixed(2);
    rk.textContent = Number(data.system.rk).toFixed(2);
    yacsAc.textContent = data.yacs.num_accept;
    atcoderAc.textContent = data.atcoder.num_accept;
    luoguAc.textContent = data.luogu.num_accept;
    cfAc.textContent = data.codeforces.num_accept;
    const classList = document.getElementById("class-list");
    if (data.my_classes && data.my_classes.length > 0) {
      classList.style.display = "block";
      data.my_classes.forEach(cls => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = `https://www.topscoding.com/d/${cls._id}/homework`;
        a.target = "_blank";
        a.textContent = cls.name;
        li.appendChild(a);
        classList.appendChild(li);
      });
    } else {
      classList.style.display = "none";
    }
  } catch (error) {
    console.error('Error fetching user info:', error);
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  await getAllCookies();
});