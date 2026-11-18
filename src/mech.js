/* 抛石机(襄阳炮) — 尺寸常量与配重能量法弹道
   文献依据:《元史·阿里海牙传》襄阳炮(1272,回回人亦思马因造,配重式);
   《武经总要》前集卷一百零三绘单梢/七梢砲(人力拽索式)。
   本站取配重式:能量法 ω(θ) = √(2·m配·g·Δh(θ)/I) 闭式解(忽略摩擦),
   石弹脱离后按抛体积分,射程与闭式理论(含落点高度)对照断言。 */
(function (MECH) {
  var CHI = 0.3;
  var D = {
    CHI: CHI,
    pivotY: 2.05,             // 横轴高
    Ls: 0.9,                  // 配重臂
    Ll: 3.4,                  // 抛臂
    mCW: 300,                 // 配重 kg(可调 200/300/400)
    mArm: 80, mBall: 12,
    theta0: -60 * Math.PI / 180,      // 装填角(长臂下倾)
    thetaRel: 50 * Math.PI / 180,     // 释放角(长臂上扬)
    alpha: 46 * Math.PI / 180,        // 释放仰角(臂端切向+皮索,示意)
    slingK: 1.0,                      // 皮索放大系数(简化)
    g: 9.8,
    ballR: 0.14,
    cwOpts: [200, 300, 400]
  };
  D.I = D.mCW * D.Ls * D.Ls + D.mArm * D.Ll * D.Ll / 3 + D.mBall * D.Ll * D.Ll;  // 惯量(绕枢轴)
  D.yCW = function (th) { return -D.Ls * Math.sin(th); };                        // 配重高度(相对枢轴)
  D.dh = function (th) { return D.yCW(D.theta0) - D.yCW(th); };                  // 配重下落量(≥0)
  D.omega0 = 0.25;                        // 释放机构给定的初角速度(触发推力)
  D.omegaOf = function (th, mCW) {
    return Math.sqrt(Math.max(0, D.omega0 * D.omega0 + 2 * mCW * D.g * D.dh(th) / D.I));
  };
  D.ballY0 = D.pivotY + D.Ll * Math.sin(D.thetaRel);
  D.xLaunch = D.Ll * Math.cos(D.thetaRel);       // 释放点前移量
  D.rangeTheory = function (v) {
    var vx = v * Math.cos(D.alpha), vy = v * Math.sin(D.alpha);
    var t = (vy + Math.sqrt(vy * vy + 2 * D.g * D.ballY0)) / D.g;
    return D.xLaunch + vx * t;                    // 含释放点前移
  };

  function newState() {
    return {
      time: 0, theta: D.theta0, omega: 0,
      mCW: 300, cwIdx: 1,
      phase: "loaded",                // loaded / firing / flying / landed / reloading
      firedAt: 0,
      ball: { x: 0, y: 0, z: 0, vx: 0, vy: 0 },
      range: 0, rangeTheory: 0, shots: 0,
      results: [],                    // {mCW, range, theory}
      lastPhase: "", manual: false, _keyL: false, _keyR: false
    };
  }

  /* 发射:能量法 ω(θrel) → 弹道积分 */
  function fire(st) {
    if (st.phase !== "loaded") return;
    st.phase = "firing";
    st.firedAt = st.time;
    st.omega = D.omega0;                    // 触发推力
  }

  function step(st, dt) {
    st.time += dt;
    if (st.phase === "firing") {
      /* 能量闭式:θ 按恒能推进(dθ = ω(θ)dt) */
      var w = D.omegaOf(st.theta, st.mCW);
      st.theta += w * dt;
      st.omega = D.omegaOf(st.theta, st.mCW);
      if (st.theta >= D.thetaRel) {
        st.theta = D.thetaRel;
        var v = st.omega * D.Ll * D.slingK;
        st.ball = {
          x: D.Ll * Math.cos(st.theta), y: D.ballY0, z: 0,
          vx: v * Math.cos(D.alpha), vy: v * Math.sin(D.alpha)
        };
        st.phase = "flying";
        st.rangeTheory = D.rangeTheory(v);
      }
    } else if (st.phase === "flying") {
      /* 子步进积分(≤8ms/步),保证射程与闭式理论 < 2% */
      var n = Math.max(1, Math.ceil(dt / 0.008));
      var h = dt / n;
      for (var sb = 0; sb < n; sb++) {
        st.ball.vy -= D.g * h;
        st.ball.x += st.ball.vx * h;
        st.ball.y += st.ball.vy * h;
        if (st.ball.y <= D.ballR) break;
      }
      if (st.ball.y <= D.ballR) {
        st.ball.y = D.ballR;
        st.range = st.ball.x;
        st.shots++;
        st.results.push({ mCW: st.mCW, range: st.range, theory: st.rangeTheory });
        if (st.results.length > 6) st.results.shift();
        st.phase = "landed";
        st.firedAt = st.time;
      }
    } else if (st.phase === "landed") {
      if (st.time - st.firedAt > 1.6) {           // 自动装填
        st.theta = D.theta0;
        st.omega = 0;
        st.phase = "loaded";
      }
    }
  }

  MECH.DIM = D;
  MECH.KS = { newState: newState, step: step, fire: fire };

  /* 载入期自检:能量守恒 + 射程理论/数值一致(三档配重) */
  (function selfCheck() {
    var errs = [];
    /* 能量守恒:发射过程 ½Iω² + m·g·(y0−y) 恒等 */
    var st = newState();
    st.phase = "firing";
    var E0 = 0.5 * D.I * D.omega0 * D.omega0;
    for (var i = 0; i < 200; i++) {
      step(st, 1 / 120);
      var E = 0.5 * D.I * st.omega * st.omega + D.mCW * D.g * (D.dh(D.theta0) - D.dh(st.theta));
      if (Math.abs(E - E0) / Math.max(E0, 1) > 0.005) { errs.push("能量不守恒 @" + i); break; }
      if (st.phase !== "firing") break;
    }
    /* 数值弹道 vs 闭式理论(三档配重) */
    [200, 300, 400].forEach(function (m) {
      var s2 = newState();
      s2.mCW = m;
      s2.phase = "firing";
      for (var j = 0; j < 600 && s2.phase !== "landed"; j++) step(s2, 1 / 120);
      var dev = Math.abs(s2.range - s2.rangeTheory) / s2.rangeTheory;
      if (dev > 0.02) errs.push("射程偏差 " + (dev * 100).toFixed(1) + "% @" + m + "kg");
    });
    if (errs.length) {
      if (window.MECH_SHOW_BOOT_ERROR) window.MECH_SHOW_BOOT_ERROR("抛石机自检失败: " + errs.join(";"));
      throw new Error(errs.join(";"));
    }
  })();
})(window.MECH = window.MECH || {});
