/* 时间线(44s):主架 → 抛臂 → 石弹靶场 → 轻配重演射 → 标准 → 重配重 → 自由发射 */
(function (MECH) {
  var KS = MECH.KS, D = MECH.DIM;

  MECH.PHASES = [
    { id: "base", name: "FRAME · 主架与横轴", dur: 4, dot: "yellow", mode: "ASSEMBLING",
      cam: { theta: 0.55, phi: 1.20, r: 7.0, target: [0, 1.8, 0] }, drift: 0.03 },
    { id: "arm", name: "ARM · 抛臂与配重箱", dur: 5, dot: "teal", mode: "ASSEMBLING",
      cam: { theta: 0.30, phi: 1.24, r: 5.4, target: [0.4, 2.2, 0] }, drift: 0.012 },
    { id: "ball", name: "BALL · 石弹装填", dur: 4, dot: "orange", mode: "ASSEMBLING",
      cam: { theta: 0.20, phi: 1.22, r: 4.6, target: [1.2, 2.6, 0] }, drift: 0.01 },
    { id: "targets", name: "TARGETS · 靶场旗标", dur: 3, dot: "blue", mode: "READY",
      cam: { theta: -0.35, phi: 1.22, r: 9.0, target: [4, 1.2, 0] }, drift: 0.02 },
    { id: "shot200", name: "FIRE · 演射 200kg", dur: 7, dot: "green", mode: "FIRING",
      cam: { theta: 0.75, phi: 1.22, r: 10.5, target: [4, 1.5, 0] }, drift: 0.01 },
    { id: "shot300", name: "FIRE · 演射 300kg", dur: 7, dot: "pink", mode: "FIRING",
      cam: { theta: -0.4, phi: 1.20, r: 11.0, target: [4.5, 1.5, 0] }, drift: 0.02 },
    { id: "shot400", name: "FIRE · 演射 400kg", dur: 7, dot: "yellow", mode: "FIRING",
      cam: { theta: 0.20, phi: 1.24, r: 12.0, target: [5, 1.6, 0] }, drift: 0.01 },
    { id: "manual", name: "MANUAL · ←/→ 换配重并发射", dur: 10, dot: "red", mode: "MANUAL",
      cam: { theta: 0.30, phi: 1.22, r: 11.5, target: [4.5, 1.6, 0] }, drift: 0.02 }
  ];
  MECH.PHASE_IDS = ["base", "arm", "ball", "targets", "shot200", "shot300", "shot400", "manual"];

  var autoShots = { shot200: 0, shot300: 1, shot400: 2 };   // 阶段 → cwOpts 序号

  MECH.newState = KS.newState;

  MECH.tick = function (st, ph, pt, dt) {
    if (ph.id !== st.lastPhase) {
      st.lastPhase = ph.id;
      st.manual = ph.id === "manual";
      if (autoShots[ph.id] !== undefined) {
        st.cwIdx = autoShots[ph.id];
        st.mCW = D.cwOpts[st.cwIdx];
        /* 阶段进入 1.2s 后发射(等相机就位) */
        st._autoT = st.time;
        st.theta = D.theta0;
        st.phase = "loaded";
      }
    }
    if (st._autoT !== undefined && st.time - st._autoT > 1.2 && st.phase === "loaded") {
      KS.fire(st);
      st._autoT = undefined;
    }
    /* 自由模式:←/→ 换配重并立即发射 */
    if (st.manual && MECH.keys) {
      var L = MECH.keys.left, R = MECH.keys.right;
      if ((L || R) && !st._keyL && !st._keyR) {
        st.cwIdx = (st.cwIdx + (L ? 1 : 2)) % 3;
        st.mCW = D.cwOpts[st.cwIdx];
        if (st.phase === "loaded") KS.fire(st);
        else if (st.phase === "landed" && st.time - st.firedAt > 1.6) { st.phase = "loaded"; KS.fire(st); }
      }
      st._keyL = L; st._keyR = R;
    }
    var ph0 = st.phase;
    KS.step(st, dt);
    /* 落地 → 弹坑尘云 */
    if (ph0 === "flying" && st.phase === "landed") {
      for (var i = 0; i < 5; i++) {
        MECH.Scene3D.spawnPuff(st.ball.x, 0.2, 0, {
          max: 1.0, base: 0.5, vx: (Math.random() - 0.3) * 0.8, vy: 0.6 + Math.random() * 0.4,
          vz: (Math.random() - 0.5) * 0.6, opacity: 0.6, tint: 0xB9A98C, grow: 1.8
        });
      }
    }
  };

  MECH.status = function (st, ph, pt) {
    var pill = ph.name;
    if (st.phase === "firing") pill = ph.name + " · 臂转 " + (st.theta * 180 / Math.PI).toFixed(0) + "°";
    else if (st.phase === "flying") pill = ph.name + " · 弹飞 " + st.ball.x.toFixed(1) + " m";
    else if (st.phase === "landed") pill = ph.name + " · 射程 " + st.range.toFixed(1) + " m";
    return {
      mode: ph.mode,
      hot: st.phase === "firing" || st.phase === "flying",
      pill: pill,
      a: "配重 " + st.mCW + "kg",
      b: "臂速 " + st.omega.toFixed(2) + " rad/s",
      c: st.shots + " 发"
    };
  };

  MECH.pinnedFor = function (ph) {
    function E(id) { var e = MECH.Parts.entry(id); return e ? (e.anchor || e.group) : null; }
    if (ph.id === "arm") return [{ id: "p-a", obj: E("arm"), text: "抛臂 · 短臂0.9/长臂3.4 · 配重箱" }];
    if (ph.id === "ball") return [{ id: "p-b", obj: E("ball"), text: "石弹 12kg · 挂皮窝" }];
    if (ph.id === "shot200" || ph.id === "shot300" || ph.id === "shot400" || ph.id === "manual") return [
      { id: "p-a", obj: E("arm"), text: "能量法 ω=√(2mgh/I)", tone: "white" },
      { id: "p-tg", obj: E("targets"), text: "靶场 5/10/15/20 m" }
    ];
    return [];
  };
})(window.MECH = window.MECH || {});
