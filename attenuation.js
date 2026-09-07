(function () {
  "use strict";

  const MATERIALS = {
    aluminum: { label: "Al", formula: "Al", density: 2.70, data: "1 1185;1.5 402.2;1.5596 362.1;2 2263;3 788;4 360.5;5 193.4;6 115.3;8 50.33;10 26.23;15 7.955;20 3.441;30 1.128;40 .5685;50 .3681;60 .2778;80 .2018;100 .1704;150 .1378;200 .1223;300 .1042;400 .09276;500 .08445;600 .07802;800 .06841;1000 .06146;1500 .0551;2000 .0513;3000 .0469;4000 .0441;5000 .0421;6000 .0408;8000 .0389;10000 .0376;15000 .0349;20000 .0334",
    },
    iron: { label: "Fe", formula: "Fe", density: 7.86, data: "1 9085;1.5 3400;2 1627;3 557.6;4 256.7;5 139.9;6 84.84;7.112 407.7;8 305.6;10 170.7;15 57.09;20 25.68;30 8.176;40 3.629;50 1.957;60 1.205;80 .5952;100 .3717;150 .1964;200 .146;300 .1099;400 .094;500 .08415;600 .07704;800 .06699;1000 .05995;1500 .0514;2000 .0473;3000 .0429;4000 .0406;5000 .0392;6000 .0382;8000 .0366;10000 .0356;15000 .0335;20000 .0321",
    },
    cobalt: { label: "Co", formula: "Co", density: 8.90, data: "1 9795;1.5 3696;2 1779;3 612.9;4 283;5 154.3;6 93.72;7.709 355.5;8 324.8;10 184.2;15 62.01;20 28.03;30 8.962;40 3.98;50 2.144;60 1.314;80 .6414;100 .395;150 .2023;200 .1476;300 .1094;400 .09312;500 .08315;600 .07604;800 .06604;1000 .05906;1500 .0505;2000 .0465;3000 .0422;4000 .0399;5000 .0385;6000 .0375;8000 .036;10000 .035;15000 .0329;20000 .0315",
    },
    tungsten: { label: "W", formula: "W", density: 19.25, data: "100 4.437;105.2 3.902;110.6 3.43;116.4 3.014;122.4 2.649;128.8 2.328;135.4 2.047;142.5 1.8;149.8 1.585;157.6 1.397;165.8 1.233;174.2 1.092;183 0.968;192.3 .862;202 .772;212 .695;223 .627;234 .567;246 .516;258 .471;271 .431;285 .396;300 .366;315 .34;332 .318;349 .299;367 .282;386 .267;406 .254;427 .242;449 .231;472 .221;496 .212;521 .204;548 .197;576 .191;606 .185;637 .180;669 .176;703 .172;739 .168;776 .165;816 .162;857 .159;901 .157;946 .155;995 .153;1045 .151;1098 .149;1153 .147;1211 .145;1271 .143;1335 .141;1402 .139;1472 .137;1546 .135;1623 .133;1705 .131;1790 .129;1879 .127;1973 .125;2072 .123;2175 .121;2284 .119;2398 .117;2518 .115;2644 .113;2776 .111;2915 .109;3061 .107;3214 .105;3375 .103;3544 .101;3721 .099;3907 .097;4102 .095;4307 .093;4522 .091;4748 .089;4985 .087;5234 .085;5495 .083;5770 .081;6059 .079;6362 .077;6680 .075;7014 .073;7365 .071;7729 .069;8116 .067;8521 .065;8947 .063;9394 .061;9863 .059;10356 .057;10873 .055;11417 .053;11988 .051;12587 .049;13216 .047;13877 .045;14570 .043;15300 .041;16000 .039;17000 .037;18000 .035;19000 .033;20000 .031",
    },
  };

  Object.values(MATERIALS).forEach((material) => {
    material.points = material.data.split(";").map((row) => row.split(" ").map(Number));
  });

  const WATER_POINTS = "1 4078;1.5 1376;2 617.3;3 192.9;4 82.78;5 42.58;6 24.64;8 10.37;10 5.329;15 1.673;20 .8096;30 .3756;40 .2683;50 .2269;60 .2059;80 .1837;100 .1707;150 .1505;200 .137;300 .1186;400 .1061;500 .09687;600 .08956;800 .07865;1000 .07072;1250 .06323;1500 .05754;2000 .04942;3000 .03969;4000 .03403;5000 .03031;6000 .0277;8000 .02429;10000 .02219;15000 .01941;20000 .01813"
    .split(";").map((row) => row.split(" ").map(Number));

  const EQUIVALENT_REFERENCES = {
    steel: { density: 7.85, points: MATERIALS.iron.points },
    water: { density: 1.0, points: WATER_POINTS },
  };

  const $ = (id) => document.getElementById(id);
  const form = $("attenuationForm");
  const chart = $("transmissionChart");
  const ctx = chart.getContext("2d");
  let latest = null;

  function interpLogLog(points, energy) {
    if (energy <= points[0][0]) return points[0][1];
    if (energy >= points[points.length - 1][0]) return points[points.length - 1][1];
    for (let i = 1; i < points.length; i += 1) {
      if (energy <= points[i][0]) {
        const [x0, y0] = points[i - 1];
        const [x1, y1] = points[i];
        const t = (Math.log(energy) - Math.log(x0)) / (Math.log(x1) - Math.log(x0));
        return Math.exp(Math.log(Math.max(y0, 1e-300)) + t * (Math.log(Math.max(y1, 1e-300)) - Math.log(Math.max(y0, 1e-300))));
      }
    }
    return points[points.length - 1][1];
  }

  function rangeValues(min, max, step) {
    const values = [];
    for (let value = min; value <= max + step * 0.01; value += step) values.push(Number(value.toFixed(6)));
    return values;
  }

  function nice(value) {
    if (!Number.isFinite(value)) return "—";
    if (Math.abs(value) >= 1000 || (Math.abs(value) > 0 && Math.abs(value) < .01)) return value.toExponential(3);
    return value.toFixed(4);
  }

  function formatThicknessMm(value) {
    if (!Number.isFinite(value)) return "—";
    if (value >= 1000) return `${(value / 1000).toFixed(4)} m`;
    if (value >= 100) return `${(value / 10).toFixed(4)} cm`;
    if (value >= 10) return `${value.toFixed(3)} mm`;
    return `${value.toFixed(4)} mm`;
  }

  function calculate() {
    const material = MATERIALS[$("knownMaterial").value];
    const min = Number($("energyMin").value);
    const max = Number($("energyMax").value);
    const step = Number($("energyStep").value);
    const density = Number($("materialDensity").value);
    const thickness = Number($("materialThickness").value);
    const incident = Number($("incidentIntensity").value);
    const mode = $("plotMode").value;
    if (!material || ![min, max, step, density, thickness, incident].every(Number.isFinite) || min <= 0 || max <= min || step <= 0 || density <= 0 || thickness < 0 || incident <= 0) {
      $("calculatorStatus").textContent = "请检查输入：能量范围、密度、厚度和入射强度必须为有效正值。";
      return;
    }
    const supportedMin = material.points[0][0];
    const supportedMax = material.points[material.points.length - 1][0];
    if (min < supportedMin || max > supportedMax) {
      $("calculatorStatus").textContent = `${material.label} 的内置数据范围为 ${supportedMin}–${supportedMax} keV，请调整能量范围。`;
      return;
    }
    const energies = rangeValues(min, max, step);
    const rows = energies.map((energy) => {
      const massMu = interpLogLog(material.points, energy);
      const linearMu = massMu * density;
      const transmission = Math.exp(-linearMu * thickness / 10);
      return { energy, massMu, linearMu, transmission, intensity: incident * transmission };
    });
    latest = { material, density, thickness, incident, rows, mode };
    $("materialFormula").value = material.formula;
    $("materialDensity").value = density;
    $("resultMaterial").textContent = `${material.label} · ${density.toFixed(3)} g/cm³ · ${thickness.toFixed(3)} mm`;
    $("resultRange").textContent = `${min}–${max} keV`;
    const sampleInput = $("sampleEnergy");
    sampleInput.min = min;
    sampleInput.max = max;
    if (Number(sampleInput.value) < min || Number(sampleInput.value) > max) sampleInput.value = Math.min(max, Math.max(min, (min + max) / 2));
    updateSample();
    updatePenetration();
    drawChart();
    $("downloadAttenuation").disabled = false;
    $("calculatorStatus").textContent = `已计算 ${rows.length} 个能量点，数据源：NIST XCOM 总衰减系数。`;
  }

  function updateSample() {
    if (!latest) return;
    const energy = Number($("sampleEnergy").value);
    const massMu = interpLogLog(latest.material.points, energy);
    const linearMu = massMu * latest.density;
    const transmission = Math.exp(-linearMu * latest.thickness / 10);
    const row = { energy, massMu, linearMu, transmission, intensity: latest.incident * transmission };
    $("resultMassMu").textContent = nice(row.massMu);
    $("resultLinearMu").textContent = nice(row.linearMu);
    $("resultTransmission").textContent = `${(row.transmission * 100).toFixed(4)}%`;
    $("resultIntensity").textContent = nice(row.intensity);
    $("resultEnergyLabel").textContent = `at ${row.energy} keV`;
    $("resultIncidentLabel").textContent = `I₀ = ${latest.incident.toExponential(3)}`;
    const opticalDepth = row.linearMu * latest.thickness / 10;
    const steelMu = interpLogLog(EQUIVALENT_REFERENCES.steel.points, energy) * EQUIVALENT_REFERENCES.steel.density;
    const waterMu = interpLogLog(EQUIVALENT_REFERENCES.water.points, energy) * EQUIVALENT_REFERENCES.water.density;
    $("resultSteelEquivalent").textContent = formatThicknessMm(opticalDepth / steelMu * 10);
    $("resultWaterEquivalent").textContent = formatThicknessMm(opticalDepth / waterMu * 10);
    $("equivalentDescription").textContent = `与 ${latest.thickness.toFixed(3)} mm ${latest.material.label} 在 ${energy} keV 下产生相同透射率。`;
  }

  function updatePenetration() {
    const material = MATERIALS[$("knownMaterial").value];
    const density = Number($("materialDensity").value);
    const energy = Number($("penetrationEnergy").value);
    const targetPercent = Number($("penetrationTarget").value);
    const output = $("penetrationThickness");
    const details = $("penetrationDetails");
    $("penetrationAnswerLabel").textContent = Number.isFinite(targetPercent)
      ? `透射率降至 ${targetPercent}% 时`
      : "指定透射率下";
    if (!material || ![density, energy, targetPercent].every(Number.isFinite) || density <= 0 || energy <= 0 || targetPercent <= 0 || targetPercent >= 100) {
      output.textContent = "—";
      details.textContent = "能量、密度须为正值，透射率须在 0–100% 之间";
      return;
    }
    const minEnergy = material.points[0][0];
    const maxEnergy = material.points[material.points.length - 1][0];
    if (energy < minEnergy || energy > maxEnergy) {
      output.textContent = "超出数据范围";
      details.textContent = `${material.label} 支持 ${minEnergy}–${maxEnergy} keV`;
      return;
    }
    const massMu = interpLogLog(material.points, energy);
    const linearMu = massMu * density;
    const thicknessCm = -Math.log(targetPercent / 100) / linearMu;
    const thicknessMm = thicknessCm * 10;
    const arealDensity = density * thicknessCm;
    output.textContent = thicknessMm >= 1000
      ? `${(thicknessMm / 1000).toFixed(4)} m`
      : thicknessMm >= 10
        ? `${thicknessMm.toFixed(3)} mm`
        : `${thicknessMm.toFixed(4)} mm`;
    details.textContent = `${thicknessCm.toFixed(4)} cm · 面密度 ${arealDensity.toFixed(4)} g/cm² · μ = ${linearMu.toFixed(4)} cm⁻¹`;
  }

  function drawChart() {
    if (!latest) return;
    const cssWidth = Math.max(300, Math.round(chart.getBoundingClientRect().width));
    const compact = cssWidth < 600;
    const cssHeight = Math.round(cssWidth / (compact ? 1.45 : 2.28));
    const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
    chart.width = Math.round(cssWidth * pixelRatio);
    chart.height = Math.round(cssHeight * pixelRatio);
    chart.style.height = `${cssHeight}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    const width = cssWidth;
    const height = cssHeight;
    const pad = compact
      ? { left: 52, right: 12, top: 20, bottom: 43 }
      : { left: 70, right: 24, top: 27, bottom: 56 };
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#08090b";
    ctx.fillRect(0, 0, width, height);
    const rows = latest.rows;
    const values = rows.map((row) => latest.mode === "transmission" ? row.transmission * 100 : latest.mode === "intensity" ? row.intensity : row.linearMu);
    let yMin = Math.min(...values);
    let yMax = Math.max(...values);
    if (yMin === yMax) { yMin = 0; yMax = yMax || 1; }
    if (latest.mode === "transmission") yMin = Math.max(0, yMin - (yMax - yMin) * .08);
    else { const margin = (yMax - yMin) * .1 || 1; yMin = Math.max(0, yMin - margin); yMax += margin; }
    const x = (energy) => pad.left + (energy - rows[0].energy) / (rows[rows.length - 1].energy - rows[0].energy || 1) * (width - pad.left - pad.right);
    const y = (value) => height - pad.bottom - (value - yMin) / (yMax - yMin || 1) * (height - pad.top - pad.bottom);
    ctx.strokeStyle = "rgba(255,255,255,.1)";
    ctx.fillStyle = "#7c818b";
    ctx.font = `${compact ? 10 : 12}px -apple-system, BlinkMacSystemFont, sans-serif`;
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i += 1) {
      const value = yMin + (yMax - yMin) * i / 4;
      const yy = y(value);
      ctx.beginPath(); ctx.moveTo(pad.left, yy); ctx.lineTo(width - pad.right, yy); ctx.stroke();
      ctx.fillText(nice(value), pad.left - 10, yy + 4);
    }
    ctx.textAlign = "center";
    [rows[0].energy, rows[Math.floor(rows.length / 2)].energy, rows[rows.length - 1].energy].forEach((energy) => ctx.fillText(`${energy} keV`, x(energy), height - 21));
    ctx.save(); ctx.translate(compact ? 10 : 18, height / 2); ctx.rotate(-Math.PI / 2); ctx.fillStyle = "#a1a1a6"; ctx.fillText($("plotMode").selectedOptions[0].text, 0, 0); ctx.restore();
    ctx.strokeStyle = "#58a6c6"; ctx.lineWidth = 2.4; ctx.beginPath();
    rows.forEach((row, index) => { const value = latest.mode === "transmission" ? row.transmission * 100 : latest.mode === "intensity" ? row.intensity : row.linearMu; if (index === 0) ctx.moveTo(x(row.energy), y(value)); else ctx.lineTo(x(row.energy), y(value)); });
    ctx.stroke();
  }

  function downloadCsv() {
    if (!latest) return;
    const head = "energy_keV,mass_attenuation_cm2_g,linear_attenuation_cm1,transmission_percent,transmitted_intensity";
    const body = latest.rows.map((row) => [row.energy, row.massMu, row.linearMu, row.transmission * 100, row.intensity].join(","));
    const blob = new Blob([[head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "xray-transmission.csv"; link.click(); URL.revokeObjectURL(link.href);
  }

  $("knownMaterial").addEventListener("change", () => {
    const material = MATERIALS[$("knownMaterial").value];
    const minEnergy = material.points[0][0];
    const maxEnergy = material.points[material.points.length - 1][0];
    $("materialFormula").value = material.formula;
    $("materialDensity").value = material.density;
    if (Number($("energyMin").value) < minEnergy) $("energyMin").value = minEnergy;
    if (Number($("energyMax").value) > maxEnergy) $("energyMax").value = maxEnergy;
    if (Number($("energyMax").value) <= Number($("energyMin").value)) $("energyMax").value = Math.min(maxEnergy, minEnergy + 100);
    if (Number($("penetrationEnergy").value) < minEnergy || Number($("penetrationEnergy").value) > maxEnergy) $("penetrationEnergy").value = minEnergy;
    calculate();
  });
  $("plotMode").addEventListener("change", calculate);
  $("sampleEnergy").addEventListener("input", updateSample);
  $("penetrationEnergy").addEventListener("input", updatePenetration);
  $("penetrationTarget").addEventListener("input", updatePenetration);
  $("materialDensity").addEventListener("input", updatePenetration);
  $("downloadAttenuation").addEventListener("click", downloadCsv);
  form.addEventListener("submit", (event) => { event.preventDefault(); calculate(); });
  window.addEventListener("resize", drawChart);
  calculate();
  updatePenetration();
}());

