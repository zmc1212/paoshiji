/* 图纸面板(B 键):抛石机侧视总图 + 能量法详图 + 公式 + 尺寸表 */
(function (MECH) {
  var red = "#8C2F1E";

  function arrow(ctx, x1, y1, x2, y2, text, below) {
    ctx.strokeStyle = "rgba(42,38,32,0.4)";
    ctx.fillStyle = "rgba(42,38,32,0.4)";
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var s = 4, dir = x2 >= x1 ? 1 : -1;
    ctx.beginPath(); ctx.moveTo(x2, y2); ctx.lineTo(x2 - s * dir, y2 - 3); ctx.lineTo(x2 - s * dir, y2 + 3); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x1 + s * dir, y1 - 3); ctx.lineTo(x1 + s * dir, y1 + 3); ctx.closePath(); ctx.fill();
    ctx.font = "600 10px Menlo, monospace";
    ctx.textAlign = "center";
    ctx.fillText(text, (x1 + x2) / 2, below ? (y1 + 13) : (y1 - 5));
  }

  MECH.BP = {
    no: "Fig. 14 · 复原总图",
    title: "抛石机(襄阳炮) · 配重式杠杆弹射",
    src: "《元史》襄阳炮(1272) · 《武经总要》单梢/七梢砲图 · 能量法弹道",
    draw: function (ctx, w, h) {
      var D = MECH.DIM;
      ctx.clearRect(0, 0, w, h);
      var chainH = 44, chainY = h - chainH - 12, topY = 34;
      var ink = "#2A2620";
      ctx.fillStyle = red;
      ctx.font = "700 11px Menlo, monospace";
      ctx.textAlign = "left";
      ctx.fillText("ω(θ)=√(2·m·g·Δh(θ)/I) · v=ω·L长 · R=v·cosα(v·sinα+√(v²sin²α+2g·y₀))/g", w * 0.045, topY - 10);

      /* ============ 左:侧视图 ============ */
      var S = Math.min(w * 0.44 / 7.0, (chainY - topY - 26) / 5.4);
      var ox = w * 0.05, oy = chainY - 16;
      var X = function (m) { return ox + (m + 1.6) * S; }, Y = function (m) { return oy - m * S; };
      ctx.strokeStyle = ink;
      ctx.fillStyle = ink;
      ctx.lineWidth = 1.4;
      ctx.font = "700 11px sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("侧视 SIDE(装填位)", ox, Y(5.2));
      /* 主架 */
      ctx.beginPath();
      ctx.moveTo(X(-0.55), Y(0.1)); ctx.lineTo(X(-0.18), Y(D.pivotY));
      ctx.lineTo(X(0.18), Y(D.pivotY)); ctx.lineTo(X(0.55), Y(0.1));
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(X(0.55), Y(0.1)); ctx.lineTo(X(-0.18), Y(D.pivotY));
      ctx.moveTo(X(-0.55), Y(0.1)); ctx.lineTo(X(0.18), Y(D.pivotY));
      ctx.stroke();
      ctx.strokeRect(X(-0.45), Y(0.1), 0.9 * S, 0.1 * S);
      /* 抛臂(装填位 θ=-60°) */
      ctx.save();
      ctx.translate(X(0), Y(D.pivotY));
      ctx.rotate(-D.theta0);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(-D.Ls * S, 0); ctx.lineTo(D.Ll * S, 0); ctx.stroke();
      /* 配重箱 */
      ctx.strokeRect(-D.Ls * S - 0.24 * S, 0, 0.5 * S, 0.5 * S);
      ctx.fillStyle = "rgba(42,38,32,0.55)";
      ctx.font = "600 8px sans-serif";
      ctx.fillText("配重箱 300kg", -D.Ls * S - 0.3 * S, -0.28 * S);
      ctx.fillStyle = ink;
      /* 皮窝+石弹 */
      ctx.beginPath(); ctx.arc(D.Ll * S, 0.24 * S, 0.14 * S, 0, Math.PI * 2); ctx.stroke();
      ctx.restore();
      ctx.beginPath(); ctx.arc(X(0), Y(D.pivotY), 3, 0, Math.PI * 2); ctx.fill();
      /* 尺寸 */
      arrow(ctx, X(-D.Ls), Y(D.pivotY + 0.5), X(0), Y(D.pivotY + 0.5), "短臂 0.9", false);
      arrow(ctx, X(0), Y(D.pivotY + 0.5), X(D.Ll * 0.6), Y(D.pivotY + 0.5), "长臂 3.4", false);
      arrow(ctx, X(D.Ll * 0.75), Y(D.pivotY + 0.9), X(D.Ll * 0.75), Y(D.pivotY), "枢轴高 2.05", true);

      /* ============ 右:能量法详图 ============ */
      var ox2 = w * 0.55;
      ctx.font = "700 11px sans-serif";
      ctx.fillStyle = ink;
      ctx.fillText("能量法 ω(θ)", ox2, topY + 18);
      var gx = ox2, gy = topY + 32, gw = w - ox2 - 24, gh = (chainY - gy) * 0.52;
      ctx.strokeStyle = "rgba(42,38,32,0.5)";
      ctx.strokeRect(gx, gy, gw, gh);
      /* ω(θ) 曲线:θ -60→50 */
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) {
        var th = D.theta0 + (D.thetaRel - D.theta0) * i / 60;
        var wth = D.omegaOf(th, 300);
        var px = gx + i / 60 * gw;
        var py = gy + gh - wth / 4.2 * gh;
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.font = "600 8.5px sans-serif";
      ctx.fillStyle = "rgba(42,38,32,0.6)";
      ctx.fillText("ω 0→3.55 rad/s(300kg)", gx + 8, gy + 14);
      ctx.fillText("θ -60°→50°", gx + gw - 66, gy + gh - 6);
      /* 弹道示意 */
      var by = gy + gh + 14;
      ctx.strokeStyle = ink;
      ctx.beginPath();
      ctx.moveTo(gx, by + gh * 0.5);
      var v0 = D.omegaOf(D.thetaRel, 300) * D.Ll;
      var vx = v0 * Math.cos(D.alpha), vy = v0 * Math.sin(D.alpha);
      for (var t = 0; t <= 2.3; t += 0.05) {
        var bx2 = gx + vx * t / 22 * (gw * 1.05);
        var byy = by + gh * 0.5 - (vy * t - 0.5 * 9.8 * t * t) / 10 * gh * 0.9;
        if (t === 0) ctx.moveTo(bx2, byy); else ctx.lineTo(bx2, byy);
      }
      ctx.stroke();
      ctx.fillStyle = "rgba(42,38,32,0.6)";
      ctx.fillText("弹道 v=12.1 m/s · α=46° · R≈19m", gx + 8, by + gh * 0.5 + 12);

      /* ============ 底部:参数链 ============ */
      var boxes = [
        ["配重下落", "m 200~400kg"], ["能量转化", "E=m·g·Δh 恒定"],
        ["臂加速", "ω=√(2E/I)"], ["臂端释放", "θ=50° · v=ωL"],
        ["抛体飞行", "α=46° · 重力"], ["落地记录", "射程对比理论"]
      ];
      var bwid = (w * 0.91) / boxes.length;
      for (var b = 0; b < boxes.length; b++) {
        var bx2 = w * 0.045 + b * bwid;
        ctx.strokeStyle = ink;
        ctx.fillStyle = ink;
        ctx.strokeRect(bx2, chainY, bwid - 10, chainH);
        ctx.font = "700 10px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(boxes[b][0], bx2 + (bwid - 10) / 2, chainY + 17);
        ctx.font = "600 8.5px Menlo, monospace";
        ctx.fillStyle = "rgba(42,38,32,0.55)";
        ctx.fillText(boxes[b][1], bx2 + (bwid - 10) / 2, chainY + 32);
        if (b < boxes.length - 1) {
          ctx.beginPath();
          ctx.moveTo(bx2 + bwid - 10, chainY + 20);
          ctx.lineTo(bx2 + bwid - 2, chainY + 20);
          ctx.stroke();
        }
      }
    },
    table:
      '<h4>机架</h4><table>' +
      '<tr><th>主架</th><td>A 形双柱 + 枕木基座</td><td>枢轴高 2.05</td></tr>' +
      '<tr><th>抛臂</th><td>短臂 0.9 / 长臂 3.4(演示)</td><td>全长 4.3 m</td></tr>' +
      '<tr><th>配重箱</th><td>可调 200/300/400 kg</td><td>←/→ 换挡</td></tr>' +
      '<tr><th>石弹</th><td>Ø0.28 · 12 kg</td><td>皮窝+垂索</td></tr>' +
      '</table><h4>能量法</h4><table>' +
      '<tr><th>惯量 I</th><td>m配·Ls² + m臂·Ll²/3 + m弹·Ll²</td><td>≈690 kg·m²</td></tr>' +
      '<tr><th>配重落差</th><td>Δh(50°) = 0.9×(sin50°+sin60°)</td><td>1.47 m</td></tr>' +
      '<tr><th>释放角速度</th><td>√(2×300×9.8×1.47/690)</td><td>3.55 rad/s</td></tr>' +
      '<tr><th>弹速</th><td>ω×L长 = 3.55×3.4</td><td>12.1 m/s</td></tr>' +
      '<tr><th>理论射程</th><td>含落点高 4.5m 的闭式解</td><td>≈19 m</td></tr>' +
      '</table><h4>运行期自检</h4>' +
      '<p>载入断言:①发射全程能量守恒(±0.5%);②三档配重数值弹道与闭式理论射程偏差 < 2%。</p>' +
      '<h4>文献</h4>' +
      '<p>《元史·亦思马因传》:至元十年“置巨砲于城东南……机发时声震天地,所击无不摧陷,入地七尺”——襄阳炮为配重式抛石机。</p>'
  };
})(window.MECH = window.MECH || {});
