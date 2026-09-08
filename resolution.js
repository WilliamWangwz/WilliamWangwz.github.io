(function () {
  "use strict";

  const $ = (id) => document.getElementById(id);
  const DEFAULTS = { sod: 500, sdd: 1000, pitch: 0.2, focal: 0.1, pixels: 2048 };

  function formatResolution(mm) {
    if (!Number.isFinite(mm)) return "—";
    if (mm < 1) return `${(mm * 1000).toFixed(mm < 0.01 ? 2 : 1)} μm`;
    return `${mm.toFixed(4)} mm`;
  }

  function formatDistance(mm) {
    if (!Number.isFinite(mm)) return "—";
    if (mm >= 1000) return `${(mm / 1000).toFixed(4)} m`;
    return `${mm.toFixed(mm >= 100 ? 2 : 4)} mm`;
  }

  function drawDiagram(values) {
    const svg = $("resolutionDiagram");
    const sourceX = 62;
    const detectorX = 838;
    const centerY = 150;
    const span = detectorX - sourceX;
    const objectX = sourceX + span * values.sod / values.sdd;
    const detectorHalf = 106;
    const objectHalf = detectorHalf / values.magnification;
    const spotVisual = Math.max(5, Math.min(22, values.focal * 30));
    const blurVisual = Math.max(4, Math.min(32, values.geometricBlur * 25));
    svg.innerHTML = `
      <defs>
        <linearGradient id="beamFill" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#58a6c6" stop-opacity=".05"/><stop offset="1" stop-color="#58a6c6" stop-opacity=".18"/></linearGradient>
        <marker id="resolutionArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8Z" fill="#717680"/></marker>
      </defs>
      <polygon points="${sourceX},${centerY} ${detectorX},${centerY - detectorHalf} ${detectorX},${centerY + detectorHalf}" fill="url(#beamFill)"/>
      <line x1="${sourceX}" y1="${centerY}" x2="${detectorX}" y2="${centerY - detectorHalf}" stroke="#58a6c6" stroke-width="2"/>
      <line x1="${sourceX}" y1="${centerY}" x2="${detectorX}" y2="${centerY + detectorHalf}" stroke="#58a6c6" stroke-width="2"/>
      <circle cx="${sourceX}" cy="${centerY}" r="${spotVisual}" fill="#f2b84b" opacity=".9"/>
      <rect x="${objectX - 10}" y="${centerY - objectHalf}" width="20" height="${objectHalf * 2}" rx="4" fill="#e8e8ed" opacity=".88"/>
      <rect x="${detectorX - 6}" y="${centerY - detectorHalf}" width="12" height="${detectorHalf * 2}" rx="3" fill="#58a6c6"/>
      <rect x="${detectorX - blurVisual / 2}" y="${centerY - 23}" width="${blurVisual}" height="46" fill="#f2b84b" opacity=".42"/>
      <text x="${sourceX}" y="28" text-anchor="middle">焦点尺寸 f = ${values.focal.toFixed(3)} mm</text><text x="${objectX}" y="28" text-anchor="middle">物体</text><text x="${detectorX}" y="28" text-anchor="middle">探测器</text>
      <line x1="${sourceX}" y1="286" x2="${objectX}" y2="286" stroke="#717680" marker-end="url(#resolutionArrow)"/>
      <line x1="${sourceX}" y1="312" x2="${detectorX}" y2="312" stroke="#717680" marker-end="url(#resolutionArrow)"/>
      <text x="${(sourceX + objectX) / 2}" y="278" text-anchor="middle">SOD ${values.sod.toFixed(1)} mm</text>
      <text x="${(sourceX + detectorX) / 2}" y="304" text-anchor="middle">SDD ${values.sdd.toFixed(1)} mm</text>
      <text x="${detectorX - 18}" y="142" text-anchor="end" class="diagram-accent">U₍g₎ ${values.geometricBlur.toFixed(3)} mm</text>`;
  }

  function calculate() {
    const sod = Number($("resolutionSod").value);
    const sdd = Number($("resolutionSdd").value);
    const pitch = Number($("detectorPitch").value);
    const focal = Number($("focalSpot").value);
    const pixels = Number($("detectorPixels").value);
    const valid = [sod, sdd, pitch, focal, pixels].every(Number.isFinite)
      && sod > 0 && sdd >= sod && pitch > 0 && focal >= 0 && pixels > 0;
    if (!valid) {
      $("resolutionStatus").textContent = "请输入有效参数，并确保 SDD ≥ SOD、分辨单元与像素数为正值。";
      $("resolutionStatus").classList.add("is-error");
      return;
    }
    const magnification = sdd / sod;
    const detectorResolution = pitch / magnification;
    const geometricBlur = focal * (magnification - 1);
    const spotBlur = geometricBlur / magnification;
    const systemResolution = Math.hypot(detectorResolution, spotBlur);
    const nyquist = 1 / (2 * systemResolution);
    const objectFov = pixels * pitch / magnification;
    $("resultMagnification").textContent = `${magnification.toFixed(4)}×`;
    $("resultDetectorResolution").textContent = formatResolution(detectorResolution);
    $("resultSpotBlur").textContent = formatResolution(spotBlur);
    $("resultSystemResolution").textContent = formatResolution(systemResolution);
    $("resultNyquist").textContent = `${nyquist.toFixed(3)} lp/mm`;
    $("resultObjectFov").textContent = formatDistance(objectFov);
    $("resolutionSummary").textContent = formatResolution(systemResolution);
    $("derivationInputs").textContent = `SOD ${sod.toFixed(3)} mm · SDD ${sdd.toFixed(3)} mm · p ${pitch.toFixed(3)} mm · f ${focal.toFixed(3)} mm`;
    $("derivationM").textContent = magnification.toFixed(4);
    $("derivationRdet").textContent = `${detectorResolution.toFixed(4)} mm`;
    $("derivationUg").textContent = `${geometricBlur.toFixed(4)} mm`;
    $("derivationRspot").textContent = `${spotBlur.toFixed(4)} mm`;
    $("derivationRsys").textContent = `${systemResolution.toFixed(4)} mm`;
    $("derivationFreq").textContent = `${nyquist.toFixed(3)} lp/mm`;
    $("derivationFov").textContent = formatDistance(objectFov);
    $("derivationMopt").textContent = focal > 0
      ? `${(1 + (pitch / focal) ** 2).toFixed(4)}×`
      : "∞（理想点焦点）";
    if (focal > 0) {
      const optimalM = 1 + (pitch / focal) ** 2;
      const direction = magnification < optimalM ? "提高" : magnification > optimalM ? "降低" : "保持";
      $("resolutionRecommendation").textContent = `仅按采样与焦点模糊平衡，理论最优放大倍数约为 ${optimalM.toFixed(3)}×；当前可考虑${direction}放大倍数。实际设置还需同时满足视场和机械空间。`;
    } else {
      $("resolutionRecommendation").textContent = "焦点尺寸设为 0 时只考虑探测器采样；提高放大倍数会继续改善物方采样，但会缩小视场。";
    }
    $("resolutionStatus").textContent = `计算完成：探测器采样 ${formatResolution(detectorResolution)}，物方焦点模糊 ${formatResolution(spotBlur)}。`;
    $("resolutionStatus").classList.remove("is-error");
    drawDiagram({ sod, sdd, pitch, focal, pixels, magnification, geometricBlur });
  }

  function reset() {
    $("resolutionSod").value = DEFAULTS.sod;
    $("resolutionSdd").value = DEFAULTS.sdd;
    $("detectorPitch").value = DEFAULTS.pitch;
    $("focalSpot").value = DEFAULTS.focal;
    $("detectorPixels").value = DEFAULTS.pixels;
    calculate();
  }

  $("resolutionForm").addEventListener("submit", (event) => { event.preventDefault(); calculate(); });
  ["resolutionSod", "resolutionSdd", "detectorPitch", "focalSpot", "detectorPixels"].forEach((id) => $(id).addEventListener("input", calculate));
  $("resetResolution").addEventListener("click", reset);
  calculate();
}());
