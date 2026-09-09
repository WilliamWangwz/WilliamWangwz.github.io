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
  let customMaterial = null;
  let liveCalculateTimer = null;

  function currentMaterial() {
    return $("materialSource").value === "custom" ? customMaterial : MATERIALS[$("knownMaterial").value];
  }

  function parseCustomTable(text) {
    const unitScale = { eV: .001, keV: 1, MeV: 1000 }[$("customEnergyUnit").value];
    const selectedColumn = $("customMuColumn").value;
    const rows = [];
    text.split(/\r?\n/).forEach((rawLine) => {
      const line = rawLine.trim();
      if (!line || /^[#!%]/.test(line)) return;
      const values = line.split(/[\s,;]+/).map(Number);
      if (values.length < 2 || values.some((value) => !Number.isFinite(value))) return;
      const muColumn = selectedColumn === "auto" ? (values.length >= 8 ? 6 : 1) : Number(selectedColumn);
      if (muColumn >= values.length) return;
      const energy = values[0] * unitScale;
      const mu = values[muColumn];
      if (energy > 0 && mu >= 0) rows.push([energy, mu]);
    });
    const byEnergy = new Map();
    rows.forEach((row) => byEnergy.set(row[0], row));
    const unique = Array.from(byEnergy.values()).sort((a, b) => a[0] - b[0]);
    if (unique.length < 2) throw new Error("至少需要两行有效的能量和 μ/ρ 数据。请检查单位与数据列。 ");
    return unique;
  }

  function loadCustomMaterial() {
    try {
      const points = parseCustomTable($("customMaterialTable").value);
      const label = $("materialFormula").value.trim() || "Custom material";
      const density = Number($("materialDensity").value);
      if (!Number.isFinite(density) || density <= 0) throw new Error("请输入有效的材料密度。 ");
      customMaterial = { label, formula: label, density, points, custom: true };
      const minEnergy = points[0][0];
      const maxEnergy = points[points.length - 1][0];
      $("energyMin").value = minEnergy;
      $("energyMax").value = maxEnergy;
      if (Number($("penetrationEnergy").value) < minEnergy || Number($("penetrationEnergy").value) > maxEnergy) {
        $("penetrationEnergy").value = points[Math.floor(points.length / 2)][0];
      }
      $("customMaterialStatus").textContent = `已载入 ${points.length} 个数据点，范围 ${minEnergy}–${maxEnergy} keV。`;
      calculate();
    } catch (error) {
      customMaterial = null;
      $("customMaterialStatus").textContent = error.message;
      $("downloadAttenuation").disabled = true;
      $("calculatorStatus").textContent = "请先载入有效的自定义材料数据。";
    }
  }

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

  function plotValue(row, mode) {
    if (mode === "transmission") return row.transmission * 100;
    if (mode === "attenuationRate") return (1 - row.transmission) * 100;
    if (mode === "intensity") return row.intensity;
    return row.linearMu;
  }

  function calculate() {
    const material = currentMaterial();
    const min = Number($("energyMin").value);
    const max = Number($("energyMax").value);
    const step = Number($("energyStep").value);
    const density = Number($("materialDensity").value);
    const thickness = Number($("materialThickness").value);
    const incident = Number($("incidentIntensity").value);
    const mode = $("plotMode").value;
    if (!material || ![min, max, step, density, thickness, incident].every(Number.isFinite) || min <= 0 || max <= min || step <= 0 || density <= 0 || thickness < 0 || incident <= 0) {
      $("calculatorStatus").textContent = "请检查输入：能量范围、密度、厚度和入射强度必须为有效正值。";
      $("downloadAttenuation").disabled = true;
      return false;
    }
    const supportedMin = material.points[0][0];
    const supportedMax = material.points[material.points.length - 1][0];
    if (min < supportedMin || max > supportedMax) {
      $("calculatorStatus").textContent = `${material.label} 的内置数据范围为 ${supportedMin}–${supportedMax} keV，请调整能量范围。`;
      $("downloadAttenuation").disabled = true;
      return false;
    }
    const energies = rangeValues(min, max, step);
    const rows = energies.map((energy) => {
      const massMu = interpLogLog(material.points, energy);
      const linearMu = massMu * density;
      const transmission = Math.exp(-linearMu * thickness / 10);
      return { energy, massMu, linearMu, transmission, intensity: incident * transmission };
    });
    latest = { material, density, thickness, incident, min, max, step, rows, mode };
    if (!material.custom) $("materialFormula").value = material.formula;
    $("materialDensity").value = density;
    $("resultMaterial").textContent = `${material.label} · ${density.toFixed(3)} g/cm³ · ${thickness.toFixed(3)} mm`;
    $("resultRange").textContent = `${min}–${max} keV`;
    updateSample();
    updatePenetration();
    drawChart();
    $("downloadAttenuation").disabled = false;
    const sourceLabel = material.custom ? "自定义 μ/ρ 表格" : "NIST XCOM 总衰减系数";
    $("calculatorStatus").textContent = `已计算 ${rows.length} 个能量点，数据源：${sourceLabel}。`;
    return true;
  }

  function scheduleCalculate() {
    window.clearTimeout(liveCalculateTimer);
    liveCalculateTimer = window.setTimeout(() => {
      liveCalculateTimer = null;
      calculate();
    }, 120);
  }

  function scheduleCustomLoad() {
    window.clearTimeout(liveCalculateTimer);
    liveCalculateTimer = window.setTimeout(() => {
      liveCalculateTimer = null;
      loadCustomMaterial();
    }, 180);
  }

  function updateSample() {
    if (!latest) return;
    const energy = Number($("penetrationEnergy").value);
    if (!Number.isFinite(energy) || energy <= 0) return;
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
    $("equivalentReference").textContent = `${latest.thickness.toFixed(3)} mm ${latest.material.label}`;
    $("equivalentDescription").textContent = `在 ${energy} keV 下产生相同透射率 T = ${(row.transmission * 100).toFixed(4)}%`;
  }

  function updatePenetration() {
    const material = currentMaterial();
    const density = Number($("materialDensity").value);
    const energy = Number($("penetrationEnergy").value);
    const targetPercent = Number($("penetrationTarget").value);
    const output = $("penetrationThickness");
    const details = $("penetrationDetails");
    const steelOutput = $("penetrationSteelThickness");
    const waterOutput = $("penetrationWaterThickness");
    $("penetrationAnswerLabel").textContent = Number.isFinite(targetPercent)
      ? `${material?.label || "当前材料"} 厚度（透射率降至 ${targetPercent}%）`
      : "指定透射率下";
    if (!material || ![density, energy, targetPercent].every(Number.isFinite) || density <= 0 || energy <= 0 || targetPercent <= 0 || targetPercent >= 100) {
      output.textContent = "—";
      steelOutput.textContent = "—";
      waterOutput.textContent = "—";
      details.textContent = "能量、密度须为正值，透射率须在 0–100% 之间";
      return;
    }
    const minEnergy = material.points[0][0];
    const maxEnergy = material.points[material.points.length - 1][0];
    if (energy < minEnergy || energy > maxEnergy) {
      output.textContent = "超出数据范围";
      steelOutput.textContent = "—";
      waterOutput.textContent = "—";
      details.textContent = `${material.label} 支持 ${minEnergy}–${maxEnergy} keV`;
      return;
    }
    const massMu = interpLogLog(material.points, energy);
    const linearMu = massMu * density;
    const thicknessCm = -Math.log(targetPercent / 100) / linearMu;
    const thicknessMm = thicknessCm * 10;
    const arealDensity = density * thicknessCm;
    const opticalDepth = -Math.log(targetPercent / 100);
    const steelMu = interpLogLog(EQUIVALENT_REFERENCES.steel.points, energy) * EQUIVALENT_REFERENCES.steel.density;
    const waterMu = interpLogLog(EQUIVALENT_REFERENCES.water.points, energy) * EQUIVALENT_REFERENCES.water.density;
    output.textContent = formatThicknessMm(thicknessMm);
    steelOutput.textContent = formatThicknessMm(opticalDepth / steelMu * 10);
    waterOutput.textContent = formatThicknessMm(opticalDepth / waterMu * 10);
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
    const values = rows.map((row) => plotValue(row, latest.mode));
    let yMin = Math.min(...values);
    let yMax = Math.max(...values);
    const span = yMax - yMin;
    const margin = span * .1 || Math.max(yMax * .05, 1);
    if (["transmission", "attenuationRate"].includes(latest.mode)) {
      yMin = Math.max(0, yMin - margin);
      yMax = Math.min(100, yMax + margin);
    } else if (latest.mode === "intensity") {
      yMin = Math.max(0, yMin - margin);
      yMax = Math.min(latest.incident, yMax + margin);
    } else {
      yMin = Math.max(0, yMin - margin);
      yMax += margin;
    }
    if (yMax <= yMin) {
      yMin = 0;
      yMax = latest.mode === "intensity" ? latest.incident : latest.mode === "attenuation" ? Math.max(values[0], 1) : 100;
    }
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
    rows.forEach((row, index) => { const value = plotValue(row, latest.mode); if (index === 0) ctx.moveTo(x(row.energy), y(value)); else ctx.lineTo(x(row.energy), y(value)); });
    ctx.stroke();
  }

  function downloadCsv() {
    window.clearTimeout(liveCalculateTimer);
    liveCalculateTimer = null;
    if (!calculate() || !latest) return;
    const head = "energy_keV,mass_attenuation_cm2_g,linear_attenuation_cm1,transmission_percent,attenuation_percent,transmitted_intensity";
    const body = latest.rows.map((row) => [row.energy, row.massMu, row.linearMu, row.transmission * 100, (1 - row.transmission) * 100, row.intensity].join(","));
    const metadata = [
      `# material,${latest.material.label}`,
      `# chemical_formula,${latest.material.formula}`,
      `# density_g_cm3,${latest.density}`,
      `# thickness_mm,${latest.thickness}`,
      `# incident_intensity,${latest.incident}`,
      `# energy_min_keV,${latest.min}`,
      `# energy_max_keV,${latest.max}`,
      `# energy_step_keV,${latest.step}`,
      `# calculation_energy_keV,${Number($("penetrationEnergy").value)}`,
      `# penetration_target_percent,${Number($("penetrationTarget").value)}`,
      `# plot_mode,${latest.mode}`,
    ];
    const blob = new Blob([[...metadata, head, ...body].join("\n")], { type: "text/csv;charset=utf-8" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "xray-transmission.csv"; link.click(); URL.revokeObjectURL(link.href);
  }

  function setMaterialSource() {
    const custom = $("materialSource").value === "custom";
    $("knownMaterialField").hidden = custom;
    $("customMaterialPanel").hidden = !custom;
    $("materialFormula").readOnly = !custom;
    customMaterial = null;
    if (custom) {
      $("materialFormula").value = "Custom material";
      $("customMaterialStatus").textContent = "粘贴数据或选择文件后，将自动载入并计算。";
      $("calculatorStatus").textContent = "等待自定义材料数据。";
      $("downloadAttenuation").disabled = true;
    } else {
      const material = MATERIALS[$("knownMaterial").value];
      $("materialFormula").value = material.formula;
      $("materialDensity").value = material.density;
      calculate();
    }
  }

  async function readCustomFile(event) {
    const [file] = event.target.files;
    if (!file) return;
    try {
      $("customMaterialTable").value = await file.text();
      if ($("materialFormula").value === "Custom material") {
        $("materialFormula").value = file.name.replace(/\.[^.]+$/, "");
      }
      loadCustomMaterial();
    } catch {
      $("customMaterialStatus").textContent = "无法读取该文件，请确认它是文本格式的 TXT/CSV。";
    }
  }

  $("materialSource").addEventListener("change", setMaterialSource);
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
  $("energyStep").addEventListener("change", calculate);
  ["materialDensity", "materialThickness", "incidentIntensity", "energyMin", "energyMax"].forEach((id) => {
    $(id).addEventListener("input", scheduleCalculate);
  });
  $("penetrationEnergy").addEventListener("input", () => {
    updatePenetration();
    updateSample();
  });
  $("penetrationTarget").addEventListener("input", updatePenetration);
  $("customMaterialFile").addEventListener("change", readCustomFile);
  $("customMaterialTable").addEventListener("input", scheduleCustomLoad);
  $("customMaterialTable").addEventListener("change", loadCustomMaterial);
  $("customEnergyUnit").addEventListener("change", loadCustomMaterial);
  $("customMuColumn").addEventListener("change", loadCustomMaterial);
  $("materialFormula").addEventListener("input", () => {
    if ($("materialSource").value === "custom" && customMaterial) {
      customMaterial.label = $("materialFormula").value.trim() || "Custom material";
      customMaterial.formula = customMaterial.label;
      scheduleCalculate();
    }
  });
  $("downloadAttenuation").addEventListener("click", downloadCsv);
  form.addEventListener("submit", (event) => { event.preventDefault(); calculate(); });
  window.addEventListener("resize", drawChart);
  calculate();
  updatePenetration();
}());

