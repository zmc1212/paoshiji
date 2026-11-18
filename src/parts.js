/* 抛石机部件建模与注册(12 件)。
   主架 A 形 + 横轴;抛臂绕轴转(配重臂/抛臂);石弹装填时挂臂端,
   释放后世界系抛体飞行,落地弹坑粒子;靶场旗标。 */
(function (MECH) {
  var P = MECH.P, M3 = null, D = MECH.DIM;

  function group() { return new THREE.Group(); }

  function buildBase() {
    var g = group();
    g.add(P.box(0.5, 0.16, 2.6, M3.woodD, 0, 0.08, 0));
    return g;
  }

  function buildFrame() {   // A 形主架 ×2 + 横轴
    var g = group();
    for (var s = -1; s <= 1; s += 2) {
      var leg1 = P.box(0.14, 2.3, 0.14, M3.woodD, -0.55, 1.15, s * 0.55);
      leg1.rotation.z = -0.24 * s;
      g.add(leg1);
      var leg2 = P.box(0.14, 2.3, 0.14, M3.woodD, 0.55, 1.15, s * 0.55);
      leg2.rotation.z = 0.24 * s;
      g.add(leg2);
      g.add(P.box(0.12, 0.12, 0.9, M3.wood, 0, 1.6, s * 0.55));
    }
    g.add(P.box(0.10, 1.4, 1.0, M3.woodD, 0, 2.6, 0));      // 顶支撑
    var axle = P.cyl(0.075, 0.075, 1.35, M3.steelD, 0, D.pivotY, 0, 14);
    axle.rotation.x = P.ROTX;
    g.add(axle);
    return g;
  }

  function buildArm() {   // 抛臂:短臂(配重)+ 长臂(皮窝)
    var g = group();
    var beam = P.box(D.Ll + D.Ls, 0.16, 0.20, M3.woodD, (D.Ll - D.Ls) / 2, 0, 0);
    g.add(beam);
    var cw = group();
    cw.add(P.box(0.5, 0.5, 0.56, M3.woodD, 0, -0.26, 0));
    cw.add(P.box(0.54, 0.06, 0.6, M3.iron, 0, 0.02, 0));
    cw.position.set(-D.Ls, -0.06, 0);
    g.add(cw);
    g.userData.cw = cw;
    /* 皮窝 + 垂索(石弹挂点) */
    var sling = group();
    sling.add(P.cyl(0.012, 0.012, 0.4, M3.rope, 0, -0.2, 0, 6));
    sling.add(P.box(0.24, 0.05, 0.2, M3.rope, 0, -0.42, 0));
    sling.position.set(D.Ll, 0, 0);
    g.add(sling);
    g.userData.sling = sling;
    return { group: g };
  }

  function buildBall() {   // 石弹(world 系飞行)
    var g = group();
    var b = P.sph(D.ballR, M3.stone, 0, 0, 0);
    g.add(b);
    g.userData.ball = b;
    return { group: g };
  }

  function buildTargets() {  // 靶场旗标(world 固定)
    var g = group();
    g.userData.flags = [];
    [5, 10, 15, 20].forEach(function (x) {
      var f = group();
      f.add(P.cyl(0.03, 0.03, 1.1, M3.woodD, 0, 0.55, 0, 8));
      f.add(P.box(0.30, 0.20, 0.02, M3.lacquer, 0.16, 0.98, 0));
      f.position.set(x, 0, -1.4);
      g.add(f);
      g.userData.flags.push(f);
    });
    return g;
  }

  /* —— 注册 —— */
  MECH.PART_DEFS = function () {
    M3 = MECH.Scene3D.M;
    function def(o) { return MECH._def(o); }

    def({ id: "targets", name: "TARGETS · 靶场旗标", sub: "5/10/15/20 m · world", phase: 0, kind: "none", world: true,
      build: buildTargets, target: [0, 0, 0] });
    def({ id: "base", name: "BASE · 底座", sub: "枕木基座", phase: 0, at: 0.15, dur: 1.0,
      build: buildBase, target: [0, 0, 0], start: [0, 3.4, 2.6], mid: [0, 2.0, 1.2], anchor: [0, 0.2, 0.6] });
    def({ id: "frame", name: "FRAME · A形主架+横轴", sub: "枢轴 y=2.05", phase: 0, at: 0.8, dur: 1.3,
      build: buildFrame, target: [0, 0, 0], start: [0, 5.2, 0], mid: [0, 3.2, 0.6], anchor: [0, 1.5, 0.6] });
    def({ id: "arm", name: "ARM · 抛臂+配重箱", sub: "短臂 0.9 / 长臂 3.4", phase: 1, at: 3.3, dur: 1.4, kind: "kine",
      build: buildArm, target: [0, D.pivotY, 0], off: [0, 1.6, 2.6] });
    def({ id: "ball", name: "BALL · 石弹 12kg", sub: "Ø 0.28 · 装填于皮窝", phase: 2, at: 5.6, dur: 1.0, kind: "kine",
      build: buildBall, target: [0, D.pivotY, 0], off: [0.6, 2.0, 1.4] });
  };

  /* —— 运动学分发 —— */
  var _ballWorld = new THREE.Vector3();
  MECH.KINE = function (st) {
    var root = MECH.Scene3D.root;
    /* 抛臂姿态(θ 自水平量,配重臂 = θ+180°) */
    var e = MECH.Parts.entry("arm");
    if (e && e.shown) e.group.rotation.z = st.theta;
    /* 石弹:装填 → 臂端皮窝;kine 部件 target 是世界系,故石弹挂 root;
       flying 时用世界坐标直接摆(石弹 part 在 root 内,需换算) */
    var be = MECH.Parts.entry("ball");
    if (be && be.shown) {
      if (st.phase === "loaded" || st.phase === "firing" || st.phase === "landed" && false) {
        /* 装填位:臂端(局部) */
        be.group.position.set(D.Ll * Math.cos(st.theta), D.pivotY + D.Ll * Math.sin(st.theta), 0);
        be.group.visible = true;
      } else if (st.phase === "flying") {
        /* 世界系抛体:root 未偏移(root.position=0,yaw=0)→ 局部=世界 */
        be.group.position.set(st.ball.x, st.ball.y, 0);
        be.group.visible = true;
      } else if (st.phase === "landed") {
        be.group.visible = false;
      }
    }
  };
})(window.MECH = window.MECH || {});
