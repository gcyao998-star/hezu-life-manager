const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const members = [
  { name: "小满", short: "满", cls: "a", status: "在住 · 当前用户" },
  { name: "阿哲", short: "哲", cls: "b", status: "在住 · 本轮值日" },
  { name: "可可", short: "可", cls: "c", status: "暂时离家 · 周日回来" },
  { name: "木木", short: "木", cls: "d", status: "在住" },
];

const initialBills = [
  { id: 1, title: "9 月电费", subtitle: "晴寓同步", total: 268.4, share: 67.1, paid: 2, people: 4, official: true, status: "待支付", date: "09.12", artwork: "bill-electricity.png" },
  { id: 2, title: "厨房公共用品", subtitle: "洗洁精、垃圾袋", total: 86, share: 28.67, paid: 2, people: 3, official: false, status: "待支付", date: "09.10", artwork: "bill-supplies.png" },
  { id: 3, title: "9 月网费", subtitle: "小满上传", total: 120, share: 30, paid: 4, people: 4, official: false, status: "已结清", date: "09.06", artwork: "bill-internet.png" },
];

const initialResources = [
  { id: 1, name: "洗衣机", emoji: "🧺", type: "独占资源 · 不可重叠", exclusive: true },
  { id: 2, name: "厨房", emoji: "🍳", type: "共享空间 · 最多 2 人", exclusive: false },
  { id: 3, name: "主卫", emoji: "🚿", type: "独占资源 · 不可重叠", exclusive: true },
];

const initialSupplies = [
  { id: 1, name: "洗洁精", meta: "小满、阿哲、木木共用", status: "快用完", emoji: "🫧" },
  { id: 2, name: "垃圾袋", meta: "全体成员共用", status: "充足", emoji: "🗑️" },
  { id: 3, name: "厨房纸", meta: "小满、可可共用", status: "已用完", emoji: "🧻" },
];

const initialSpaces = [
  { id: "sunny", mark: "晴舍", name: "晴天小屋", meta: "主要住所", memberCount: 4, status: "active", tone: "terracotta" },
  { id: "wutong", mark: "梧舍", name: "梧桐小筑", meta: "周末住所", memberCount: 2, status: "active", tone: "moss" },
  { id: "qinghe", mark: "青舍", name: "青禾公寓 302", meta: "2026.06 搬离", memberCount: 3, status: "history", tone: "sky" },
];

const state = {
  route: "home",
  currentSpaceId: "sunny",
  spaces: structuredClone(initialSpaces),
  awayBySpace: {},
  thingTab: "chores",
  expandedAgreementId: null,
  choreIndex: 1,
  extraChores: [],
  bills: structuredClone(initialBills),
  resources: structuredClone(initialResources),
  bookings: [
    { resource: "洗衣机", time: "19:00–20:10", owner: "可可", mine: false },
    { resource: "洗衣机", time: "21:00–22:00", owner: "小满", mine: true },
    { resource: "厨房", time: "18:30–19:20", owner: "木木", mine: false },
  ],
  agreements: [
    { id: 1, title: "晚间安静时段", text: "工作日 23:00 后降低音量；临时聚会提前在小屋里说明。", type: "作息", scope: "晴天小屋全体成员", schedule: "工作日 23:00–次日 07:00", exception: "节假日或临时聚会可调整，但需要至少提前 2 小时说明。", execution: "受到影响的成员可先轻提醒；反复发生时再发起公约修改讨论。", proposer: "小满", version: "V1 · 08.26 生效", votes: 4, total: 4, status: "已生效" },
    { id: 2, title: "卫生间垃圾循环轮值", text: "发现需要处理时提醒当前轮值人，完成后自动轮到下一位。", type: "清洁", scope: "小满、阿哲、可可、木木", schedule: "按需处理，不设固定日期", exception: "当前轮值人离家超过 3 天时，可与下一位互换顺序。", execution: "当前成员标记完成后自动顺延；其他成员发现未完成时可以提出异议。", proposer: "可可", version: "V2 · 09.08 更新", votes: 4, total: 4, status: "已生效" },
    { id: 4, title: "公共区域使用后恢复整洁", text: "厨房等公共区域由使用者及时清理；个人产生的垃圾由本人处理。", type: "清洁", scope: "晴天小屋全体成员", schedule: "每次使用或产生垃圾后", exception: "卫生间等无法区分个人来源的公共垃圾，仍按照循环轮值处理。", execution: "发现未恢复整洁时可先提醒当事人；多次发生可以发起公约修改或补充。", proposer: "小满", version: "V1 · 09.06 生效", votes: 4, total: 4, status: "已生效" },
    { id: 3, title: "厨房晚餐高峰预约", text: "18:00–20:00 可提前登记预计使用时间，厨房允许两人同时使用。", type: "资源", scope: "使用公共厨房的成员", schedule: "每天 18:00–20:00", exception: "临时只加热食物且不占用灶台时，无需登记预约。", execution: "预约仅用于告知计划；发生冲突时由涉及的预约人协商调整。", proposer: "木木", version: "草案 V3 · 09.12", votes: 3, total: 4, status: "表决中" },
  ],
  supplies: structuredClone(initialSupplies),
};

const appShell = $("#app-shell");
const loginView = $("#login-view");
const main = $("#app-main");
const modalRoot = $("#modal-root");
const toast = $("#toast");
let toastTimer;
let previousFocus;

function money(value) {
  return `¥${Number(value).toFixed(Number(value) % 1 ? 2 : 0)}`;
}

function supplyStatusClass(status) {
  return status === "充足" ? "is-full" : status === "快用完" ? "is-low" : "is-empty";
}

function currentSpace() {
  return state.spaces.find(space => space.id === state.currentSpaceId) || state.spaces.find(space => space.status === "active");
}

function formatShortDate(value) {
  if (!value) return "";
  const [, month, day] = value.split("-").map(Number);
  return `${month}月${day}日`;
}

function choreActions(currentName, choreId = null) {
  const idAttribute = choreId === null ? "" : ` data-chore-id="${choreId}"`;
  if (currentName === "小满") {
    return `<div class="button-row chore-actions"><button class="button button-moss" data-action="complete-chore"${idAttribute}>标记已完成</button></div><p class="permission-note">轮到你了，完成后由你亲自确认</p>`;
  }
  return `<div class="button-row chore-actions"><button class="button button-soft" data-action="remind-chore"${idAttribute}>提醒一下</button></div><p class="permission-note">只有${currentName}可以确认完成，其他室友只能提醒</p>`;
}

function escapeHTML(value = "") {
  return String(value).replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function icon(name, cls = "") {
  return `<svg class="icon ${cls}" aria-hidden="true"><use href="#i-${name}"></use></svg>`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2400);
}

function showApp() {
  loginView.hidden = true;
  appShell.hidden = false;
  localStorage.setItem("hezu-demo-session", "1");
  render();
}

function showLogin() {
  appShell.hidden = true;
  loginView.hidden = false;
  loginView.scrollTop = 0;
}

function routeTo(route, options = {}) {
  state.route = route;
  if (options.tab) state.thingTab = options.tab;
  $$(".nav-item").forEach(item => item.classList.toggle("is-active", item.dataset.route === route));
  render();
  appShell.scrollTo({ top: 0, behavior: "auto" });
  main.focus({ preventScroll: true });
}

function homeTemplate() {
  const current = members[state.choreIndex];
  const space = currentSpace();
  const pending = state.bills.find(bill => bill.status === "待支付") || state.bills[0];
  return `
    <section class="screen" aria-labelledby="home-heading">
      <div class="home-hero">
        <div class="hero-copy">
          <p class="eyebrow">我们的共同屋檐</p>
          <h1 id="home-heading" class="hero-title">早上好，小满</h1>
          <p class="hero-meta">今天有 3 件事值得留意</p>
        </div>
        <span class="weather-sticker">周六 · 晴 26°</span>
        <img class="hero-art" src="assets/illustrations/home-cutaway.png" alt="${space.name}的厨房、浴室、客厅和洗衣区插画" />
      </div>

      <div class="section-head"><div><h2>今天</h2><p>先处理真正需要回应的事</p></div><button class="section-link" data-action="notifications">全部动态</button></div>
      <div class="today-stack">
        <button class="today-card" data-action="open-bill" data-id="${pending.id}">
          <img class="today-art" src="assets/illustrations/expense-split.png" alt="" />
          <span><h3>${pending.title}</h3><p>${pending.subtitle} · 已有 ${pending.paid}/${pending.people} 人完成</p></span>
          <span class="home-bill-summary"><small>我的应付</small><strong class="today-amount">${money(pending.share)}</strong><em class="badge pending">${pending.status}</em></span>
        </button>
        <button class="today-card" data-action="go-things" data-tab="chores">
          <img class="today-art" src="assets/illustrations/chore-rotation.png" alt="" />
          <span><h3>卫生间垃圾 · 当前轮值</h3><p>${current.name}负责，发现需要处理时可以提醒</p></span>
          <span class="badge pending">待完成</span>
        </button>
        <button class="today-card" data-action="go-things" data-tab="booking">
          <img class="today-art" src="assets/illustrations/resource-booking.png" alt="" />
          <span><h3>洗衣机预约</h3><p>你预约了今晚 21:00–22:00</p></span>
          <span class="badge info">今晚</span>
        </button>
      </div>

      <div class="section-head"><div><h2>小屋事务</h2><p>规则清楚，生活就轻一点</p></div></div>
      <div class="quick-grid">
        <button class="quick-card" data-action="go-route" data-route="expenses"><h3>费用 AA</h3><p>2 笔待处理</p><img src="assets/illustrations/expense-split.png" alt="" /></button>
        <button class="quick-card" data-action="go-things" data-tab="chores"><h3>循环轮值</h3><p>${current.name}当值</p><img src="assets/illustrations/chore-rotation.png" alt="" /></button>
        <button class="quick-card" data-action="go-things" data-tab="booking"><h3>资源预约</h3><p>今晚 2 个计划</p><img src="assets/illustrations/resource-booking.png" alt="" /></button>
        <button class="quick-card" data-action="go-route" data-route="agreements"><h3>共同公约</h3><p>1 条待表决</p><img src="assets/illustrations/house-agreement-card.png" alt="" /></button>
      </div>
    </section>`;
}

function expenseTemplate() {
  const pendingCount = state.bills.filter(b => b.status === "待支付").length;
  const pendingAmount = state.bills.filter(b => b.status === "待支付").reduce((sum, b) => sum + b.share, 0);
  return `
    <section class="screen" aria-labelledby="expenses-heading">
      <div class="page-heading"><div><h1 id="expenses-heading" class="page-title">费用</h1><p class="page-subtitle">每一笔都说明白，再轻松结清</p></div><button class="round-add" data-action="new-expense" aria-label="发起一笔费用">${icon("plus")}</button></div>
      <div class="summary-strip">
        <div class="summary-chip"><strong>${money(pendingAmount)}</strong><span>我的待支付</span></div>
        <div class="summary-chip"><strong>${pendingCount}</strong><span>待处理账单</span></div>
        <div class="summary-chip"><strong>12</strong><span>本月已结清</span></div>
      </div>
      <div class="section-head"><div><h3>9 月账单</h3><p>公寓同步与成员上传分别标记</p></div><button class="section-link" data-action="expense-rules">分摊规则</button></div>
      <div class="bill-list">
        ${state.bills.map(bill => `
          <article class="bill-card" tabindex="0" role="button" data-action="open-bill" data-id="${bill.id}" aria-label="查看${bill.title}">
            <div class="bill-top">
              <span class="bill-icon ${bill.official ? "official" : ""}"><img src="assets/illustrations/${bill.artwork || "bill-supplies.png"}" alt="" /></span>
              <div class="bill-title"><div class="bill-title-line"><h3>${bill.title}</h3>${bill.official ? '<span class="badge official bill-source">公寓账单</span>' : ""}</div><p>${bill.subtitle} · ${bill.date}</p></div>
              <div class="bill-money"><strong>${money(bill.share)}</strong><small>我的部分</small></div>
            </div>
            <div class="bill-progress"><span style="width:${Math.round(bill.paid / bill.people * 100)}%"></span></div>
            <div class="bill-foot"><span>${bill.paid}/${bill.people} 人已支付 · 总额 ${money(bill.total)}</span><span class="badge ${bill.status === "已结清" ? "done" : "pending"}">${bill.status}</span></div>
          </article>`).join("")}
      </div>
    </section>`;
}

function choresTemplate() {
  const current = members[state.choreIndex];
  const order = [0,1,2,3].map(i => members[(state.choreIndex + i) % members.length]);
  return `
    <div class="module-toolbar"><div><strong>轮值事项</strong><small>完成后自动轮到下一位</small></div></div>
    <div class="rotation-card">
      <span class="badge">循环轮值公约</span><h2>卫生间垃圾</h2><p>没有固定日期，发现需要处理时提醒当前轮值人。</p>
      <div class="current-person"><span class="avatar ${current.cls}">${current.short}</span><span><small>当前轮到</small><strong>${current.name}</strong></span></div>
      ${choreActions(current.name)}
      <div class="turn-line" aria-label="轮值顺序">${order.map((m,i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="avatar ${m.cls}" title="${m.name}">${m.short}</span>`).join("")}</div>
    </div>
    ${state.extraChores.map(item => {
      const choreMembers = item.participants.map(index => members[index]);
      const currentMember = choreMembers[item.currentIndex];
      return `<article class="added-chore-card"><div><span class="badge info">新轮值</span><h3>${item.name}</h3><p>${item.rule}</p></div><div class="added-chore-person"><span class="avatar ${currentMember.cls}">${currentMember.short}</span><span><small>当前轮到</small><strong>${currentMember.name}</strong></span></div>${choreActions(currentMember.name, item.id)}</article>`;
    }).join("")}
    <div class="section-head"><div><h3>最近完成</h3></div></div>
    <div class="history-row"><span>可可 · 卫生间垃圾</span><span>9 月 9 日</span></div>`;
}

function bookingTemplate() {
  const renderResource = resource => {
    const rows = state.bookings.filter(item => item.resource === resource.name);
    return `
    <article class="resource-card">
      <div class="resource-head"><div class="resource-name"><span class="resource-emoji">${resource.emoji}</span><span><strong>${resource.name}</strong><small>${resource.type}</small></span></div><button class="section-link" data-action="new-booking" data-resource="${resource.name}">预约</button></div>
      <div class="timeline">${rows.length ? rows.map(row => `<div class="time-slot ${row.mine ? "mine" : ""}" data-time="${row.time.split("–")[0]}"><strong>${row.time}</strong>${row.owner}${row.mine ? " · 我的预约" : ""}</div>`).join("") : '<div class="empty-state"><p>今天还没有安排</p></div>'}</div>
    </article>`;
  };
  return `<div class="module-toolbar"><div><strong>可预约资源</strong><small>房间和设备都可以自定义</small></div></div><div class="schedule">${state.resources.map(renderResource).join("")}</div>`;
}

function suppliesTemplate() {
  return `
    <div class="module-toolbar"><div><strong>共用清单</strong><small>按实际共用情况自由添加</small></div></div>
    <div class="supply-list">
      ${state.supplies.map(item => `<article class="supply-card"><span class="supply-emoji">${item.emoji}</span><div class="supply-info"><strong>${item.name}</strong><small>${item.meta}</small></div><select class="status-select ${supplyStatusClass(item.status)}" data-supply-id="${item.id}" aria-label="更新${item.name}状态"><option ${item.status === "充足" ? "selected" : ""}>充足</option><option ${item.status === "快用完" ? "selected" : ""}>快用完</option><option ${item.status === "已用完" ? "selected" : ""}>已用完</option></select></article>`).join("")}
    </div>
    <button class="button button-primary button-large" style="margin-top:12px" data-action="buy-supply">上传采购小票并 AA</button>
    <aside class="ad-card" aria-label="广告"><span class="ad-label">广告 · 合租好物</span><strong>把日常补给一次买齐</strong><p>纸品清洁专场，周末配送到家</p><img src="assets/illustrations/shared-supplies.png" alt="公共生活用品插画" /></aside>`;
}

function thingsTemplate() {
  const addLabel = state.thingTab === "booking" ? "添加资源" : state.thingTab === "supplies" ? "添加公共物品" : "添加轮值";
  return `
    <section class="screen" aria-labelledby="things-heading">
      <div class="page-heading"><div><h1 id="things-heading" class="page-title">小屋事务</h1><p class="page-subtitle">轮值、预约和物品，各自保持轻量</p></div><button class="round-add" data-action="thing-add" aria-label="${addLabel}" title="${addLabel}">${icon("plus")}</button></div>
      <div class="tabs" role="tablist" aria-label="事务类型">
        <button class="tab ${state.thingTab === "chores" ? "is-active" : ""}" role="tab" aria-selected="${state.thingTab === "chores"}" data-action="thing-tab" data-tab="chores">循环轮值</button>
        <button class="tab ${state.thingTab === "booking" ? "is-active" : ""}" role="tab" aria-selected="${state.thingTab === "booking"}" data-action="thing-tab" data-tab="booking">资源预约</button>
        <button class="tab ${state.thingTab === "supplies" ? "is-active" : ""}" role="tab" aria-selected="${state.thingTab === "supplies"}" data-action="thing-tab" data-tab="supplies">公共物品</button>
      </div>
      <div role="tabpanel">${state.thingTab === "chores" ? choresTemplate() : state.thingTab === "booking" ? bookingTemplate() : suppliesTemplate()}</div>
    </section>`;
}

function agreementsTemplate() {
  const featured = state.agreements.find(item => item.status !== "已生效");
  const featureContent = featured
    ? `<p class="eyebrow">正在形成共识</p><h2>${featured.title.replace("高峰", "<br />高峰")}</h2><p>${featured.votes}/${featured.total} 位成员已同意，达到过半即可生效。</p><button class="button button-moss" data-action="focus-agreement" data-id="${featured.id}">查看完整条款</button>`
    : "";
  return `
    <section class="screen" aria-labelledby="agreements-heading">
      <div class="page-heading"><div><h1 id="agreements-heading" class="page-title">共同公约</h1><p class="page-subtitle">不是谁管理谁，而是大家先说清楚</p></div><button class="round-add" data-action="new-agreement" aria-label="发起一条公约">${icon("plus")}</button></div>
      ${featured ? `<div class="agreement-feature">${featureContent}<img src="assets/illustrations/house-agreement-card.png" alt="室友共同确认公约的插画" /></div>` : ""}
      <div class="section-head agreement-list-head"><div><h3>规则清单</h3><p>${featured ? "包含已生效和正在协商的内容" : `${state.agreements.length} 条公约均已生效`}</p></div><button class="section-link" data-action="agreement-history">变更记录</button></div>
      <div class="agreement-list">
        ${state.agreements.map(item => {
          const expanded = state.expandedAgreementId === item.id;
          return `<article class="agreement-card ${expanded ? "is-expanded" : ""}" data-agreement-card="${item.id}">
            <div class="agreement-card-top"><div><span class="badge">${item.type}</span><h3>${item.title}</h3></div><span class="badge ${item.status === "已生效" ? "done" : "pending"}">${item.status}</span></div>
            <p class="agreement-summary">${item.text}</p>
            <div class="agreement-meta"><span>${icon("users","icon-sm")} ${item.scope}</span><span>${icon("clock","icon-sm")} ${item.schedule}</span></div>
            <div class="vote-line"><div class="vote-track"><span style="width:${item.votes / item.total * 100}%"></span></div><small>${item.votes}/${item.total} 已确认</small></div>
            <button class="agreement-expand" data-action="toggle-agreement" data-id="${item.id}" aria-expanded="${expanded}">${expanded ? "收起完整条款" : "查看完整条款"}${icon("chevron","icon-sm")}</button>
            ${expanded ? `<div class="agreement-details"><div><small>例外情况</small><p>${item.exception}</p></div><div><small>执行与异议</small><p>${item.execution}</p></div><div class="agreement-version"><span>由 ${item.proposer} 发起</span><span>${item.version}</span></div>${item.status !== "已生效" ? `<div class="button-row"><button class="button button-soft" data-action="suggest-agreement" data-id="${item.id}">提出修改建议</button><button class="button button-moss" data-action="vote-agreement" data-id="${item.id}">查看并表决</button></div>` : ""}</div>` : ""}
          </article>`;
        }).join("")}
      </div>
    </section>`;
}

function profileTemplate() {
  const space = currentSpace();
  const away = state.awayBySpace[space.id];
  const activeCount = state.spaces.filter(item => item.status === "active").length;
  const historyCount = state.spaces.filter(item => item.status === "history").length;
  return `
    <section class="screen" aria-labelledby="profile-heading">
      <div class="page-heading"><div><h1 id="profile-heading" class="page-title">我的</h1><p class="page-subtitle">管理自己的资料与合租空间</p></div></div>
      <div class="profile-hero"><span class="profile-avatar">满</span><div><h2>小满</h2><p>微信已绑定 · 手机号 138****2026</p><span class="badge ${away ? "info" : "done"}" style="margin-top:8px">${space.name} · ${away ? "暂时离家" : "在住"}</span></div></div>
      <div class="section-head"><div><h3>当前空间</h3><p>${space.name} · ${space.meta}</p></div></div>
      <div class="menu-list">
        <button class="menu-item" data-action="view-members">${icon("users")}<span>室友与成员状态</span><small>${space.memberCount} 人</small>${icon("chevron","icon-sm")}</button>
        <button class="menu-item" data-action="away-setting">${icon("calendar")}<span>居住状态</span><small>${away ? `暂时离家至 ${formatShortDate(away.end)}` : "当前在住"}</small>${icon("chevron","icon-sm")}</button>
        <button class="menu-item" data-action="space-switch">${icon("home")}<span>切换合租空间</span><small>${activeCount} 个在住 · ${historyCount} 个历史</small>${icon("chevron","icon-sm")}</button>
        <button class="menu-item menu-item-danger" data-action="leave-space">${icon("log-out")}<span>退出当前合租空间</span>${icon("chevron","icon-sm")}</button>
      </div>
      <div class="section-head"><div><h3>账号设置</h3></div></div>
      <div class="menu-list">
        <button class="menu-item" data-action="profile-edit">${icon("edit")}<span>个人资料</span>${icon("chevron","icon-sm")}</button>
        <button class="menu-item" data-action="notifications">${icon("bell")}<span>消息提醒</span><small>已开启</small>${icon("chevron","icon-sm")}</button>
        <button class="menu-item" data-action="reset-demo">${icon("clock")}<span>重置演示数据</span>${icon("chevron","icon-sm")}</button>
        <button class="menu-item" data-action="logout">${icon("log-out")}<span>退出登录</span>${icon("chevron","icon-sm")}</button>
      </div>
    </section>`;
}

function render() {
  const templates = { home: homeTemplate, expenses: expenseTemplate, things: thingsTemplate, agreements: agreementsTemplate, profile: profileTemplate };
  const space = currentSpace();
  const switcher = $(".space-switch");
  if (space && switcher) {
    $(".space-mark", switcher).className = `space-mark ${space.tone}`;
    $(".space-mark", switcher).textContent = space.mark;
    $("strong", switcher).textContent = space.name;
    $("small", switcher).textContent = space.meta;
    switcher.setAttribute("aria-label", `切换合租空间，当前为${space.name}`);
  }
  main.innerHTML = templates[state.route]();
  $$(".nav-item").forEach(item => item.classList.toggle("is-active", item.dataset.route === state.route));
}

function openModal(title, content, options = {}) {
  previousFocus = document.activeElement;
  modalRoot.innerHTML = `<div class="modal-backdrop" data-action="close-modal"><section class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-modal-sheet><div class="sheet-handle"></div><div class="sheet-head"><h2 id="modal-title">${title}</h2><button class="sheet-close" data-action="close-modal" aria-label="关闭弹窗">${icon("close")}</button></div>${content}</section></div>`;
  const sheet = $("[data-modal-sheet]", modalRoot);
  const first = $("input, button, select, textarea", sheet);
  setTimeout(() => first?.focus(), 30);
  if (options.className) sheet.classList.add(options.className);
}

function closeModal() {
  modalRoot.innerHTML = "";
  previousFocus?.focus?.();
}

function newExpenseModal(prefill = {}) {
  openModal("发起一笔费用", `
    <img class="modal-art" src="assets/illustrations/expense-split.png" alt="" />
    <form id="expense-form" class="form-grid">
      <label class="field"><span>费用名称</span><input name="title" required value="${escapeHTML(prefill.title || "")}" placeholder="例如：公共纸品" /></label>
      <label class="field"><span>总金额</span><input name="amount" type="number" required min="0.01" step="0.01" value="${prefill.amount || ""}" placeholder="0.00" /></label>
      <div class="field"><span>凭证</span><button type="button" class="button button-soft" data-action="mock-upload">${icon("camera","icon-sm")} 上传账单或小票</button></div>
      <fieldset><legend>参与分摊的室友</legend><div class="check-grid">${members.map((m,i) => `<label class="check-person"><input type="checkbox" name="member" value="${m.name}" ${prefill.people ? (prefill.people.includes(m.name) ? "checked" : "") : (i !== 2 ? "checked" : "")} /><span class="avatar ${m.cls}" style="width:26px;height:26px;font-size:9px">${m.short}</span>${m.name}</label>`).join("")}</div></fieldset>
      <label class="field"><span>分摊说明（选填）</span><textarea name="note" placeholder="默认均摊；特殊调整请说明原因"></textarea></label>
      <div class="total-preview"><span>默认按已选成员均摊</span><strong id="share-preview">¥0.00 / 人</strong></div>
      <button class="button button-primary button-large" type="submit">发起收款</button>
    </form>`);
  const form = $("#expense-form");
  const update = () => {
    const amount = Number(form.amount.value || 0);
    const count = $$('input[name="member"]:checked', form).length || 1;
    $("#share-preview").textContent = `${money(amount / count)} / 人`;
  };
  form.addEventListener("input", update);
  form.addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(form);
    const selected = data.getAll("member");
    if (!selected.length) return showToast("请至少选择一位参与成员");
    const total = Number(data.get("amount"));
    state.bills.unshift({ id: Date.now(), title: escapeHTML(data.get("title")), subtitle: "小满上传", total, share: total / selected.length, paid: 0, people: selected.length, official: false, status: "待支付", date: "今天", artwork: "bill-supplies.png" });
    closeModal(); routeTo("expenses"); showToast("收款已发起，相关室友会收到提醒");
  });
  update();
}

function billDetailModal(id) {
  const bill = state.bills.find(item => item.id === Number(id));
  if (!bill) return;
  const isDone = bill.status === "已结清";
  openModal(bill.title, `
    <img class="modal-art" src="assets/illustrations/${bill.official ? "apartment-utility-bill" : "expense-split"}.png" alt="" />
    <div class="notice-card">${bill.official ? "这笔账单由合作公寓同步。公寓只能看到整套房是否缴清，看不到室友内部如何分摊。" : "账单由成员上传，所有参与人都可以查看凭证与分摊说明。"}</div>
    <div class="detail-list"><div class="detail-row"><span>账单总额</span><strong>${money(bill.total)}</strong></div><div class="detail-row"><span>我的部分</span><strong>${money(bill.share)}</strong></div><div class="detail-row"><span>分摊方式</span><strong>${bill.people} 人平均分摊</strong></div><div class="detail-row"><span>支付进度</span><strong>${bill.paid}/${bill.people} 人已支付</strong></div><div class="detail-row"><span>状态</span><strong>${bill.status}</strong></div></div>
    ${isDone ? `<button class="button button-soft button-large" data-action="close-modal">已结清 · 查看记录</button>` : `<div class="button-row"><button class="button button-soft" data-action="dispute-bill" data-id="${bill.id}">提出异议</button><button class="button button-primary" data-action="pay-bill" data-id="${bill.id}">立即支付 ${money(bill.share)}</button></div>`}`);
}

function paymentModal(id) {
  const bill = state.bills.find(item => item.id === Number(id));
  openModal("选择支付方式", `<div class="total-preview"><span>本次支付</span><strong>${money(bill.share)}</strong></div><div class="payment-options"><label class="payment-option"><span style="font-size:24px">●</span><strong>微信支付</strong><input type="radio" name="pay" checked /></label><label class="payment-option"><span style="font-size:22px;color:#1677ff">支</span><strong>支付宝</strong><input type="radio" name="pay" /></label></div><p class="notice-card">Demo 将示意第三方支付成功，不会发起真实扣款。</p><button class="button button-primary button-large" style="margin-top:15px" data-action="confirm-payment" data-id="${bill.id}">确认支付</button>`);
}

function disputeModal(id) {
  openModal("提出费用异议", `<form id="dispute-form" class="form-grid"><label class="field"><span>异议原因</span><select name="reason"><option>我没有参与这项消费</option><option>分摊金额需要调整</option><option>账单凭证不清楚</option><option>其他原因</option></select></label><label class="field"><span>建议怎样处理</span><textarea name="detail" required placeholder="例如：我本月长期离家，建议将我的部分调整为 20 元"></textarea></label><p class="notice-card">你的部分会暂缓支付，其他成员仍可正常完成付款。</p><button class="button button-primary button-large" type="submit">提交异议</button></form>`);
  $("#dispute-form").addEventListener("submit", event => { event.preventDefault(); const bill = state.bills.find(item => item.id === Number(id)); bill.status = "存在异议"; closeModal(); render(); showToast("异议已提交，相关成员会收到提醒"); });
}

function bookingModal(resource = "洗衣机") {
  openModal("预约公共资源", `<img class="modal-art" src="assets/illustrations/resource-booking.png" alt="" /><form id="booking-form" class="form-grid"><label class="field"><span>资源</span><select name="resource">${state.resources.map(item => `<option ${resource === item.name ? "selected" : ""}>${item.name}</option>`).join("")}</select></label><div class="button-row"><label class="field" style="flex:1"><span>开始时间</span><input name="start" type="time" value="20:00" required /></label><label class="field" style="flex:1"><span>预计结束</span><input name="end" type="time" value="21:00" required /></label></div><label class="field"><span>使用说明（选填）</span><input name="note" placeholder="例如：洗床单，可能提前结束" /></label><div class="notice-card">预约用于让室友了解你的使用计划。超出预计时间不会处罚，但会提醒可能受影响的人。</div><button class="button button-primary button-large" type="submit">确认预约</button></form>`);
  $("#booking-form").addEventListener("submit", event => {
    event.preventDefault(); const data = new FormData(event.currentTarget); const start = data.get("start"); const end = data.get("end"); const selected = data.get("resource");
    const selectedResource = state.resources.find(item => item.name === selected);
    const conflict = state.bookings.some(item => item.resource === selected && selectedResource?.exclusive && item.time.startsWith(start));
    if (conflict) return showToast("这个时段已有预约，请换一个时间");
    state.bookings.push({ resource: selected, time: `${start}–${end}`, owner: "小满", mine: true }); closeModal(); state.thingTab = "booking"; routeTo("things"); showToast("预约已登记，室友现在能看到你的计划");
  });
}

function newResourceModal() {
  openModal("添加可预约资源", `<form id="resource-form" class="form-grid"><label class="field"><span>资源名称</span><input name="name" required maxlength="12" placeholder="例如：次卫、烘干机" /></label><label class="field"><span>资源类型</span><select name="category"><option value="device">家用设备</option><option value="space">公共空间</option><option value="bathroom">卫浴空间</option><option value="other">其他资源</option></select></label><label class="field"><span>同时使用规则</span><select name="mode"><option value="exclusive">仅限一人，不可重叠</option><option value="shared">允许多人共同使用</option></select></label><div class="notice-card">添加后所有室友都可以看到并预约。它只是帮助大家安排时间，不会强制锁定资源。</div><button class="button button-primary button-large" type="submit">添加到预约列表</button></form>`);
  $("#resource-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const name = escapeHTML(data.get("name").trim());
    if (state.resources.some(item => item.name === name)) return showToast("这个资源已经存在");
    const emoji = { device: "⚙️", space: "🏠", bathroom: "🚿", other: "✨" }[data.get("category")];
    const exclusive = data.get("mode") === "exclusive";
    state.resources.push({ id: Date.now(), name, emoji, exclusive, type: exclusive ? "独占资源 · 不可重叠" : "共享资源 · 可同时使用" });
    closeModal(); state.thingTab = "booking"; render(); showToast(`${name}已添加，现在可以预约`);
  });
}

function newChoreModal() {
  openModal("添加循环轮值", `<form id="chore-form" class="form-grid"><label class="field"><span>轮值事项</span><input name="name" required maxlength="16" placeholder="例如：清理冰箱、拖客厅地面" /></label><label class="field"><span>完成说明</span><textarea name="rule" required placeholder="例如：发现冰箱需要清理时提醒当前轮值人，完成后轮到下一位"></textarea></label><fieldset><legend>参与轮值的室友</legend><div class="check-grid">${members.map((member,index) => `<label class="check-person"><input type="checkbox" name="member" value="${index}" checked /><span class="avatar ${member.cls}" style="width:26px;height:26px;font-size:9px">${member.short}</span>${member.name}</label>`).join("")}</div></fieldset><div class="notice-card">新轮值会从勾选列表中的第一位开始；完成一次后自动顺延。</div><button class="button button-primary button-large" type="submit">创建轮值</button></form>`);
  $("#chore-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const participants = data.getAll("member").map(Number);
    if (participants.length < 2) return showToast("循环轮值至少需要两位成员");
    const name = escapeHTML(data.get("name").trim());
    state.extraChores.push({ id: Date.now(), name, rule: escapeHTML(data.get("rule").trim()), participants, currentIndex: 0 });
    closeModal(); state.thingTab = "chores"; render(); showToast(`${name}轮值已创建`);
  });
}

function newSupplyModal() {
  openModal("添加公共物品", `<form id="supply-form" class="form-grid"><label class="field"><span>物品名称</span><input name="name" required maxlength="12" placeholder="例如：洗衣液、饮用水" /></label><label class="field"><span>物品类别</span><select name="category"><option value="clean">清洁用品</option><option value="paper">纸品耗材</option><option value="food">厨房食品</option><option value="other">其他物品</option></select></label><label class="field"><span>当前状态</span><select name="status"><option>充足</option><option>快用完</option><option>已用完</option></select></label><fieldset><legend>哪些室友共同使用</legend><div class="check-grid">${members.map((member,index) => `<label class="check-person"><input type="checkbox" name="member" value="${index}" checked /><span class="avatar ${member.cls}" style="width:26px;height:26px;font-size:9px">${member.short}</span>${member.name}</label>`).join("")}</div></fieldset><button class="button button-primary button-large" type="submit">添加到共用清单</button></form>`);
  $("#supply-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const selected = data.getAll("member").map(Number);
    if (!selected.length) return showToast("请至少选择一位使用成员");
    const category = data.get("category");
    const emoji = { clean: "🫧", paper: "🧻", food: "🫙", other: "📦" }[category];
    const meta = selected.length === members.length ? "全体成员共用" : `${selected.map(index => members[index].name).join("、")}共用`;
    const name = escapeHTML(data.get("name").trim());
    state.supplies.push({ id: Date.now(), name, meta, status: data.get("status"), emoji });
    closeModal(); state.thingTab = "supplies"; render(); showToast(`${name}已加入公共物品`);
  });
}

function agreementModal() {
  openModal("发起一条公约", `<form id="agreement-form" class="form-grid"><label class="field"><span>公约类型</span><select name="type"><option>作息</option><option>费用</option><option>清洁</option><option>资源</option><option>其他</option></select></label><label class="field"><span>公约标题</span><input name="title" required placeholder="例如：访客留宿提前说明" /></label><label class="field"><span>核心规则</span><textarea name="text" required placeholder="用一句话说明大家需要遵守什么"></textarea></label><label class="field"><span>适用范围</span><input name="scope" required value="晴天小屋全体成员" /></label><label class="field"><span>适用时间</span><input name="schedule" required placeholder="例如：每天 22:00–次日 07:00" /></label><label class="field"><span>例外情况</span><textarea name="exception" required placeholder="什么情况下可以例外，以及需要怎样提前说明"></textarea></label><div class="notice-card">发布后先进入协商阶段。成员可以针对条款提出修改建议，形成最终版本后再正式表决。</div><button class="button button-primary button-large" type="submit">发布草案</button></form>`);
  $("#agreement-form").addEventListener("submit", event => { event.preventDefault(); const data = new FormData(event.currentTarget); const id = Date.now(); state.agreements.unshift({ id, title: escapeHTML(data.get("title")), text: escapeHTML(data.get("text")), type: data.get("type"), scope: escapeHTML(data.get("scope")), schedule: escapeHTML(data.get("schedule")), exception: escapeHTML(data.get("exception")), execution: "相关成员可以先提醒或提出修改建议，确认最终版本后再执行。", proposer: "小满", version: "草案 V1 · 今天", votes: 1, total: 4, status: "协商中" }); state.expandedAgreementId = id; closeModal(); render(); showToast("公约草案已发布，等待室友提出建议"); });
}

function membersModal() {
  const space = currentSpace();
  const visibleMembers = members.slice(0, space.memberCount);
  const away = state.awayBySpace[space.id];
  openModal(`${space.name}的室友`, `<div class="member-visual"><img src="assets/illustrations/roommates.png" alt="室友们的合照插画" /></div><div class="member-list" style="margin-top:13px">${visibleMembers.map(m => { const status = m.name === "小满" && away ? `暂时离家 · ${formatShortDate(away.end)}回来` : m.status; return `<div class="member-card"><span class="avatar ${m.cls}">${m.short}</span><div class="member-copy"><strong>${m.name}</strong><small>${status}</small></div><button class="icon-button" aria-label="查看${m.name}相关记录">${icon("chevron","icon-sm")}</button></div>`; }).join("")}</div><button class="button button-primary button-large" style="margin-top:13px" data-action="invite-member">邀请新室友</button>`);
}

function awaySettingModal() {
  const space = currentSpace();
  const away = state.awayBySpace[space.id];
  openModal("设置居住状态", `<div class="status-intro"><span class="status-intro-icon">${icon("calendar")}</span><div><strong>${away ? "你正在暂时离家" : "准备暂时离开一段时间？"}</strong><p>室友会在成员状态中看到你的预计离家时间。</p></div></div><form id="away-form" class="form-grid"><div class="button-row"><label class="field" style="flex:1"><span>开始日期</span><input name="start" type="date" value="${away?.start || "2026-09-15"}" required /></label><label class="field" style="flex:1"><span>预计返回</span><input name="end" type="date" value="${away?.end || "2026-09-24"}" required /></label></div><p class="notice-card">暂时离家只用于同步状态，不会自动免除水电、网费等 AA。遇到明显不公平的账单，可以单独提出金额调整。</p>${away ? '<button class="button button-soft button-large" type="button" data-action="end-away">我已经回来了</button>' : ""}<button class="button button-primary button-large" type="submit">${away ? "更新离家时间" : "设为暂时离家"}</button></form>`);
  $("#away-form").addEventListener("submit", event => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const start = data.get("start");
    const end = data.get("end");
    if (end < start) return showToast("预计返回日期不能早于开始日期");
    state.awayBySpace[space.id] = { start, end };
    closeModal();
    render();
    showToast(`已设为暂时离家，预计${formatShortDate(end)}回来`);
  });
}

function notificationsModal() {
  openModal("小屋消息", `<div class="notification-list"><article class="notification-item"><span class="dot"></span><div><h3>9 月电费等待支付</h3><p>晴寓同步了本期官方账单，你的部分为 ¥67.10。</p></div><time>刚刚</time></article><article class="notification-item"><span class="dot"></span><div><h3>厨房预约公约等待表决</h3><p>已有 3 位室友同意，查看最终版本后表达你的意见。</p></div><time>1 小时</time></article><article class="notification-item"><span class="dot"></span><div><h3>阿哲正在轮值</h3><p>卫生间垃圾如需处理，可以轻轻提醒他。</p></div><time>今天</time></article></div>`);
}

function spacesModal() {
  const activeSpaces = state.spaces.filter(space => space.status === "active");
  const historySpaces = state.spaces.filter(space => space.status === "history");
  const renderSpace = space => {
    const isCurrent = space.id === state.currentSpaceId;
    const status = isCurrent ? '<span class="badge done">当前</span>' : space.status === "history" ? '<span class="badge">只读</span>' : icon("chevron", "icon-sm");
    return `<button class="space-option ${isCurrent ? "is-current" : ""}" ${space.status === "active" ? `data-action="select-space" data-space-id="${space.id}"` : `data-action="view-space-history" data-space-id="${space.id}"`}><span class="space-mark ${space.tone}">${space.mark}</span><span class="space-option-copy"><strong>${space.name}</strong><small>${space.meta} · ${space.memberCount} 人${space.status === "active" ? "在住" : "历史成员"}</small></span>${status}</button>`;
  };
  openModal("切换合租空间", `<p class="sheet-intro">每个空间拥有独立的账单、公约、轮值和预约记录。</p><div class="space-group"><span class="space-group-label">正在使用</span><div class="space-option-list">${activeSpaces.map(renderSpace).join("")}</div></div>${historySpaces.length ? `<div class="space-group"><span class="space-group-label">历史空间</span><div class="space-option-list">${historySpaces.map(renderSpace).join("")}</div></div>` : ""}<button class="button button-soft button-large" data-action="join-space">${icon("plus","icon-sm")} 加入或创建合租空间</button>`);
}

function leaveSpaceModal() {
  const space = currentSpace();
  const pendingBills = space.id === "sunny" ? "2 笔 · ¥95.77" : "无待结费用";
  const futureBookings = space.id === "sunny" ? "1 个，退出后自动取消" : "无未来预约";
  openModal(`退出${space.name}`, `<div class="leave-space-lead"><span class="space-mark ${space.tone}">${space.mark}</span><div><strong>退出的是合租空间，不是账号</strong><p>退出后你仍可登录，也能在历史空间查看已有记录。</p></div></div><div class="detail-list leave-summary"><div class="detail-row"><span>未结费用</span><strong>${pendingBills}</strong></div><div class="detail-row"><span>未来预约</span><strong>${futureBookings}</strong></div><div class="detail-row"><span>轮值安排</span><strong>自动从后续轮次移除</strong></div><div class="detail-row"><span>历史记录</span><strong>保留为只读</strong></div></div><p class="notice-card">建议先结清费用并告诉室友搬离日期。Demo 中可直接继续体验退出结果。</p><div class="button-row" style="margin-top:15px"><button class="button button-soft" data-action="close-modal">暂不退出</button><button class="button button-danger" data-action="review-leave-space">继续退出</button></div>`);
}

function confirmLeaveSpaceModal() {
  const space = currentSpace();
  openModal("最后确认", `<div class="confirm-symbol" aria-hidden="true">${icon("log-out")}</div><h3 class="confirm-title">确定退出“${space.name}”吗？</h3><p class="confirm-copy">退出后不能再新增账单、预约或修改公约；已有内容会进入历史空间。</p><label class="confirm-check"><input id="leave-confirm-check" type="checkbox" /> <span>我已了解，并确认退出这个合租空间</span></label><button class="button button-danger button-large" data-action="confirm-leave-space" disabled>确认退出空间</button>`);
}

document.addEventListener("click", event => {
  const target = event.target.closest("[data-action], [data-route]");
  if (!target) return;
  const action = target.dataset.action;
  if (action === "close-modal" && target.classList.contains("modal-backdrop") && event.target !== target) return;
  if (target.dataset.route) return routeTo(target.dataset.route);
  if (action === "login-wechat" || action === "login-phone") { showToast(action === "login-wechat" ? "微信授权成功（Demo）" : "验证码验证成功（Demo）"); setTimeout(showApp, 280); }
  else if (action === "go-route") routeTo(target.dataset.route);
  else if (action === "go-things") routeTo("things", { tab: target.dataset.tab });
  else if (action === "thing-tab") { state.thingTab = target.dataset.tab; render(); }
  else if (action === "notifications") notificationsModal();
  else if (action === "space-switch") spacesModal();
  else if (action === "select-space") {
    const next = state.spaces.find(space => space.id === target.dataset.spaceId && space.status === "active");
    if (!next || next.id === state.currentSpaceId) return closeModal();
    state.currentSpaceId = next.id;
    state.route = "home";
    closeModal();
    render();
    appShell.scrollTo({ top: 0, behavior: "auto" });
    showToast(`已切换到${next.name}`);
  }
  else if (action === "view-space-history") showToast("历史空间为只读，可查看过去的账单与公约");
  else if (action === "join-space") showToast("可通过邀请码加入，或创建一个新的合租空间");
  else if (action === "new-expense") newExpenseModal();
  else if (action === "open-bill") billDetailModal(target.dataset.id);
  else if (action === "pay-bill") paymentModal(target.dataset.id);
  else if (action === "confirm-payment") {
    const bill = state.bills.find(item => item.id === Number(target.dataset.id)); bill.paid = Math.min(bill.people, bill.paid + 1); if (bill.paid === bill.people) bill.status = "已结清"; state.route = "expenses"; closeModal(); render(); showToast("支付成功，这笔账已更新");
  }
  else if (action === "dispute-bill") disputeModal(target.dataset.id);
  else if (action === "mock-upload") showToast("小票已上传（Demo）");
  else if (action === "expense-rules") openModal("默认分摊规则", `<p class="notice-card">普通公共费用默认由已选成员平均分摊。短期离家仍默认参与；明显不公平的特殊情况可以提出金额调整，由账单相关成员共同确认。</p>`);
  else if (action === "remind-chore") {
    const extra = state.extraChores.find(item => item.id === Number(target.dataset.choreId));
    const currentName = extra ? members[extra.participants[extra.currentIndex]].name : members[state.choreIndex].name;
    if (currentName === "小满") return showToast("当前轮到你，完成后请直接确认");
    showToast(`已轻轻提醒${currentName}，今天不会重复打扰`);
  }
  else if (action === "complete-chore") {
    const extra = state.extraChores.find(item => item.id === Number(target.dataset.choreId));
    if (extra) {
      const old = members[extra.participants[extra.currentIndex]].name;
      if (old !== "小满") return showToast(`只有${old}本人可以确认完成`);
      extra.currentIndex = (extra.currentIndex + 1) % extra.participants.length;
      render(); showToast(`${old}已完成，现在轮到${members[extra.participants[extra.currentIndex]].name}`);
    } else {
      const old = members[state.choreIndex].name;
      if (old !== "小满") return showToast(`只有${old}本人可以确认完成`);
      state.choreIndex = (state.choreIndex + 1) % members.length;
      render(); showToast(`${old}已完成，现在轮到${members[state.choreIndex].name}`);
    }
  }
  else if (action === "new-booking") bookingModal(target.dataset.resource);
  else if (action === "new-resource") newResourceModal();
  else if (action === "new-chore") newChoreModal();
  else if (action === "new-supply") newSupplyModal();
  else if (action === "thing-add") { if (state.thingTab === "booking") newResourceModal(); else if (state.thingTab === "supplies") newSupplyModal(); else newChoreModal(); }
  else if (action === "buy-supply") newExpenseModal({ title: "公共用品采购", amount: 68, people: ["小满", "阿哲", "木木"] });
  else if (action === "new-agreement") agreementModal();
  else if (action === "focus-agreement" || action === "toggle-agreement") {
    const id = Number(target.dataset.id);
    state.expandedAgreementId = action === "toggle-agreement" && state.expandedAgreementId === id ? null : id;
    render();
    if (state.expandedAgreementId) setTimeout(() => $(`[data-agreement-card="${id}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" }), 20);
  }
  else if (action === "vote-agreement") {
    const item = state.agreements.find(a => a.id === Number(target.dataset.id));
    openModal(item.title, `<img class="modal-art" src="assets/illustrations/house-agreement-card.png" alt="" /><p class="notice-card">最终版本：${item.text}</p><div class="detail-list"><div class="detail-row"><span>当前结果</span><strong>${item.votes}/${item.total} 人同意</strong></div><div class="detail-row"><span>生效条件</span><strong>超过半数</strong></div></div><div class="button-row"><button class="button button-soft" data-action="suggest-agreement" data-id="${item.id}">提出修改建议</button><button class="button button-moss" data-action="confirm-vote" data-id="${item.id}">同意并确认</button></div>`);
  }
  else if (action === "confirm-vote") { const item = state.agreements.find(a => a.id === Number(target.dataset.id)); item.votes = item.total; item.status = "已生效"; state.route = "agreements"; closeModal(); render(); showToast("你已确认最终版本，公约正式生效"); }
  else if (action === "suggest-agreement") openModal("提出修改建议", `<form id="suggest-form" class="form-grid"><label class="field"><span>针对哪一部分</span><select><option>时间范围</option><option>适用成员</option><option>例外情况</option><option>其他内容</option></select></label><label class="field"><span>建议改为</span><textarea required placeholder="请给出一条可以直接讨论的具体方案"></textarea></label><button class="button button-primary button-large" type="submit">提交建议</button></form>`);
  else if (action === "agreement-history") openModal("公约变更记录", `<div class="notification-list"><article class="notification-item"><span class="dot" style="background:var(--moss)"></span><div><h3>卫生间垃圾循环轮值 V2</h3><p>新增“短时间内不重复提醒”，4/4 人同意。</p></div><time>09.08</time></article><article class="notification-item"><span class="dot" style="background:var(--moss)"></span><div><h3>晚间安静时段 V1</h3><p>由小满发起，4/4 人同意。</p></div><time>08.26</time></article></div>`);
  else if (action === "view-members") membersModal();
  else if (action === "away-setting") awaySettingModal();
  else if (action === "end-away") {
    const space = currentSpace();
    delete state.awayBySpace[space.id];
    closeModal();
    render();
    showToast("欢迎回来，居住状态已恢复为在住");
  }
  else if (action === "invite-member") openModal("邀请新室友", `<div class="notice-card">新成员加入前需要阅读并确认当前核心公约，也可以针对某一条提出修改建议。</div><div class="total-preview" style="margin:16px 0"><span>小屋邀请码</span><strong style="font-size:17px;letter-spacing:.12em">SUNNY4</strong></div><button class="button button-primary button-large" data-action="copy-invite">复制邀请信息</button>`);
  else if (action === "copy-invite") { const space = currentSpace(); navigator.clipboard?.writeText(`加入${space.name}：邀请码 SUNNY4`); showToast("邀请信息已复制"); }
  else if (action === "leave-space") leaveSpaceModal();
  else if (action === "review-leave-space") confirmLeaveSpaceModal();
  else if (action === "confirm-leave-space") {
    const leaving = currentSpace();
    leaving.status = "history";
    leaving.meta = "今天退出";
    const next = state.spaces.find(space => space.status === "active");
    if (next) state.currentSpaceId = next.id;
    closeModal();
    state.route = "profile";
    render();
    appShell.scrollTo({ top: 0, behavior: "auto" });
    showToast(`已退出${leaving.name}，记录已转为只读`);
  }
  else if (action === "profile-edit") showToast("个人资料编辑将在完整版本中开放");
  else if (action === "reset-demo") { state.bills = structuredClone(initialBills); state.resources = structuredClone(initialResources); state.supplies = structuredClone(initialSupplies); state.spaces = structuredClone(initialSpaces); state.currentSpaceId = "sunny"; state.awayBySpace = {}; state.extraChores = []; state.choreIndex = 1; state.thingTab = "chores"; state.route = "home"; render(); showToast("演示数据已重置"); }
  else if (action === "logout") { localStorage.removeItem("hezu-demo-session"); closeModal(); showLogin(); showToast("已退出演示账号"); }
  else if (action === "close-modal") closeModal();
});

document.addEventListener("submit", event => {
  if (event.target.id === "suggest-form") { event.preventDefault(); closeModal(); showToast("修改建议已提交，草案暂不进入正式表决"); }
});

document.addEventListener("change", event => {
  if (event.target.id === "leave-confirm-check") {
    const button = $("[data-action='confirm-leave-space']", modalRoot);
    if (button) button.disabled = !event.target.checked;
    return;
  }
  const select = event.target.closest("[data-supply-id]");
  if (!select) return;
  const item = state.supplies.find(s => s.id === Number(select.dataset.supplyId));
  item.status = select.value;
  select.classList.remove("is-full", "is-low", "is-empty");
  select.classList.add(supplyStatusClass(item.status));
  showToast(`${item.name}已更新为“${item.status}”`);
});

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && modalRoot.innerHTML) closeModal();
  if (event.key !== "Tab" || !modalRoot.innerHTML) return;
  const focusable = $$("button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex='-1'])", modalRoot);
  if (!focusable.length) return;
  const first = focusable[0], last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

document.addEventListener("keydown", event => {
  const card = event.target.closest('[role="button"][data-action]');
  if (card && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); card.click(); }
});

if (localStorage.getItem("hezu-demo-session") === "1") showApp(); else showLogin();
