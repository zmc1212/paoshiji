/* 仪表盘:①臂角+角速度 ②能量转化条 ③射程记录(理论vs实测) ④弹道落点 */
(function (MECH) {
  var el = {}, D = MECH.DIM;
  var soft = "rgba(233,238,242,0.5)";

  MECH.DASH = { panels: [
    { title: "ARM · 臂角与角速度", meta: "能量法闭式", dot: "teal",
      html: '<div class="big" id="d-theta">-60°</div><div class="k">臂角(长臂)</div>' +
            '<div class="rowline"><span>角速度</span><b id="d-omega">0.00 rad/s</b></div>' +
            '<div class="chip" id="d-chip">装填</div>',
      init: initArm, draw: drawArm },
    { title: "ENERGY · 能量转化", meta: "势能→动能", dot: "yellow",
      html: '<div class="bar"><i id="d-ebar"></i></div>' +
            '<div class="rowline"><span>动能占比</span><b id="d-ek">0%</b></div>' +
            '<div class="mini">E = ½Iω² + m·g·Δh 恒定</div>',
      init: initEnergy, draw: drawEnergy },
    { title: "RANGE · 射程记录", meta: "理论 vs 实测", dot: "blue", canvasH: 96, draw: drawRange },
    { title: "TRAJECT · 弹道落点", meta: "俯视", dot: "green", canvasH: 96, draw: drawTraj }
  ] };

  function initArm(sec) {
    el.theta = sec.querySelector("#d-theta");
    el.omega = sec.querySelector("#d-omega");
    el.chip = sec.querySelector("#d-chip");
  }
  function initEnergy(sec) {
    el.ebar = sec.querySelector("#d-ebar");
    el.ek = sec.querySelector("#d-ek");
  }

  function drawArm(st, ph, pt, ctx, w, h) {
    if (el.theta) {
      el.theta.textContent = Math.round(st.theta * 180 / Math.PI) + "°";
      el.theta.style.color = st.phase === "firing" ? "#E9C93C" : "";
    }
    if (el.omega) el.omega.textContent = st.omega.toFixed(2) + " rad/s";
    if (el.chip) {
      el.chip.textContent = { loaded: "装填", firing: "加速中", flying: "弹飞中", landed: "已中靶" }[st.phase] || "—";
      el.chip.className = "chip" + (st.phase === "firing" || st.phase === "flying" ? " on" : "");
    }
  }

  function drawEnergy(st, ph, pt, ctx, w, h) {
    var Ek = 0.5 * D.I * st.omega * st.omega;
    var Etotal = D.mCW * D.g * D.dh(D.theta0);
    var f = Etotal > 0 ? Math.min(1, Ek / Etotal) : 0;
    if (el.ebar) el.ebar.style.width = Math.round(f * 100) + "%";
    if (el.ek) el.ek.textContent = Math.round(f * 100) + "%";
  }

  /* ③ 射程记录:横条对比理论/实测 */
  function drawRange(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("配重   实测    理论", 4, 10);
    st.results.forEach(function (r, i) {
      var y = 24 + i * 12;
      ctx.fillStyle = "#7FD8D8";
      ctx.fillRect(44, y - 4, Math.min(1, r.range / 22) * (w - 120), 5);
      ctx.fillStyle = "rgba(233,201,60,0.7)";
      ctx.fillRect(44 + Math.min(1, r.theory / 22) * (w - 120) - 1, y - 6, 2, 9);
      ctx.fillStyle = soft;
      ctx.fillText(r.mCW + "kg  " + r.range.toFixed(1) + "m  " + r.theory.toFixed(1) + "m", 44, y - 8);
    });
    if (!st.results.length) ctx.fillText("静候发射……", 44, 24);
  }

  /* ④ 弹道落点:俯视,旗标+落点 */
  function drawTraj(st, ph, pt, ctx, w, h) {
    ctx.clearRect(0, 0, w, h);
    var ox = w * 0.18, S = (w - 30) / 22;
    /* 地面线 */
    ctx.strokeStyle = "rgba(233,238,242,0.35)";
    ctx.beginPath(); ctx.moveTo(ox - 10, h - 16); ctx.lineTo(w - 8, h - 16); ctx.stroke();
    [5, 10, 15, 20].forEach(function (x) {
      var px = ox + x * S;
      ctx.strokeStyle = "rgba(233,238,242,0.25)";
      ctx.beginPath(); ctx.moveTo(px, h - 20); ctx.lineTo(px, h - 12); ctx.stroke();
      ctx.fillStyle = soft;
      ctx.font = "600 7px Menlo, monospace";
      ctx.textAlign = "center";
      ctx.fillText(x + "m", px, h - 4);
    });
    /* 抛射机位置 */
    ctx.fillStyle = "#B08D57";
    ctx.fillRect(ox - 5, h - 24, 8, 10);
    /* 飞行中弹 */
    if (st.phase === "flying") {
      ctx.fillStyle = "#E9EEF2";
      ctx.beginPath(); ctx.arc(ox + st.ball.x * S, h - 22 - st.ball.y * S * 0.35, 3, 0, Math.PI * 2); ctx.fill();
    }
    /* 落点 */
    st.results.forEach(function (r) {
      ctx.fillStyle = "#E9C93C";
      ctx.beginPath(); ctx.arc(ox + r.range * S, h - 22, 3, 0, Math.PI * 2); ctx.fill();
    });
    ctx.fillStyle = soft;
    ctx.font = "600 7.5px Menlo, monospace";
    ctx.textAlign = "left";
    ctx.fillText("黄点=落点 · 白=空中弹", 4, 10);
  }
})(window.MECH = window.MECH || {});
