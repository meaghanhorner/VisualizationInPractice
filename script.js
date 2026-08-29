gsap.registerPlugin(ScrollTrigger)


ScrollTrigger.normalizeScroll(true);

let resizeTimeout;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => ScrollTrigger.refresh(), 200);
});

const fadeDuration = 0.01;
const displayTime = 0.12; 

document.querySelectorAll(".drawing").forEach((drawingEl) => {
  const slides = drawingEl.querySelectorAll(".slide");
  if (!slides.length) return;

  
  gsap.set(slides, { opacity: 0 });
  gsap.set(slides[0], { opacity: 1 });

  const tl = gsap.timeline({ repeat: -1 });

  slides.forEach((slide, i) => {
    const nextSlide = slides[(i + 1) % slides.length];

    tl.to(
      nextSlide,
      { opacity: 1, duration: fadeDuration, ease: "none" },
      `+=${displayTime}`
    ).to(
      slide,
      { opacity: 0, duration: fadeDuration, ease: "none" },
      "<" 
    );
  });
});


const drawings = document.querySelectorAll(".drawing");

document.querySelectorAll(".step").forEach((stepEl) => {
  const index = +stepEl.dataset.index;

  ScrollTrigger.create({
    trigger: stepEl,
    start: "top center",
    end: "bottom center",
    onEnter: () => setActiveDrawing(index),
    onEnterBack: () => setActiveDrawing(index)
  });
});

function setActiveDrawing(index) {
  drawings.forEach((el, i) => {
    if (i === index) {
      el.classList.add("active");
    } else {
      el.classList.remove("active");
    }
  });
}



// ScrollTrigger.getAll().forEach(t => t.kill());

// gsap.utils.toArray(".step p, .step-left p, .custom-quote, .step-d p, .step-d h2").forEach((stepCard, i) => {
//   gsap.fromTo(stepCard, 
//     { opacity: 0 },
//     {
//       opacity: 1,
//       y: 0,
//       duration: 0.6,
//       ease: "power1.out",
//       scrollTrigger: {
//         trigger: stepCard,
//         start: "top 90%",
//         end: "bottom 40%", 
//         toggleActions: "play reverse play reverse",
//         refreshPriority: -i,
//         markers: false
//       }
//     }
//   );
//});


ScrollTrigger.getAll().forEach(t => t.kill());

ScrollTrigger.matchMedia({

  "(min-width: 768px)": function() {
    gsap.utils.toArray(".step p, .step-left p, .custom-quote, .step-d p, .step-d h2").forEach((stepCard, i) => {
      gsap.fromTo(stepCard, 
        { opacity: 0 },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: "power1.out",
          scrollTrigger: {
            trigger: stepCard,
            start: "top 90%",
            end: "bottom 40%", 
            toggleActions: "play reverse play reverse",
            refreshPriority: -i,
            markers: false,
          }
        }
      );
    });
  },

"(max-width: 767px)": function() {
  function syncStickyGraphicHeight() {
    const steps = document.querySelector('.sectionD-inner .scrolly-steps');
    const sticky = document.querySelector('.sectionD-inner .sticky-graphic-d');
    if (steps && sticky) {
      sticky.style.height = steps.scrollHeight + 'px';
      ScrollTrigger.refresh();
    }
  }
  syncStickyGraphicHeight();
  window.addEventListener('resize', syncStickyGraphicHeight);

  return () => {
    const sticky = document.querySelector('.sectionD-inner .sticky-graphic-d');
    if (sticky) {
      sticky.style.height = ''; // remove inline height
    }
    window.removeEventListener('resize', syncStickyGraphicHeight);
  };
}

});

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

if (document.fonts) {
  document.fonts.ready.then(() => {
    ScrollTrigger.refresh();
  });
}


document.addEventListener("DOMContentLoaded", () => {

const chartB = {
  svg: null,
  g: null,
  gStates: null,
  path: null,
  projection: null,
  width: 960,
  height: 400,
  data: new Map(),
  pjmStates: new Set (["DC", "DE", "IL", "IN", "KY", "MD", "MI", "NJ", "NC", "OH", "PA", "TN", "VA", "WV"]),
  colorUS: null,
  colorPJM: null,
  greyColor: "#979797",
  greyOpacity:0.25,
  currentview: "us",
  pjmZoomTarget: null,
};

chartB.init = async function (containerSelector, dataUrl){
  const container = d3.select(containerSelector);
  const bounds = container.node().getBoundingClientRect();
  chartB.width = bounds.width || chartB.width;
  chartB.height = bounds.height || chartB.height;

const containerNode = container.node();
chartB.width = containerNode.getBoundingClientRect().width || 960;
chartB.height = chartB.width * 0.58; 

let tooltip = container.select(".chartB-tooltip");
  if (tooltip.empty()) {
    tooltip = container
      .append("div")
      .attr("class", "chartB-tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("pointer-events", "none")
      .style("z-index", "100");
  }

  chartB.svg = container
    .append("svg")
    .attr("id", "chartB-svg")
    .attr("viewBox", `0 0 ${chartB.width} ${chartB.height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .style("font-family", "'Urbanist', sans-serif")
    .attr("width", "100%");

  chartB.g = chartB.svg.append("g").attr("id", "chartB-g");
  chartB.gStates = chartB.g.append("g").attr("class", "chartB-states");

  chartB.projection = d3.geoAlbersUsa();
  

const [us, rawData] = await Promise.all([
  d3.json("https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json"),
  d3.json(dataUrl),
]);

const topojson = window.topojson;

const usGeoJsonData = topojson.feature(us, us.objects.states);

const topPadding = 0;

rawData.forEach((d) => chartB.data.set(d.state, d));

let states = topojson.feature(us, us.objects.states).features;

  const EXCLUDE_FIPS = new Set(["02", "15", "72"]);
  states = states.filter((d) => !EXCLUDE_FIPS.has(d.id));

  const fipsToAbbr = {
    "01":"AL","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE",
    "11":"DC","12":"FL","13":"GA","16":"ID","17":"IL","18":"IN","19":"IA",
    "20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI",
    "27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH",
    "34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK",
    "41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX",
    "49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY",
  };

  const fipsToName = {
    "01":"Alabama","04":"Arizona","05":"Arkansas","06":"California","08":"Colorado",
    "09":"Connecticut","10":"Delaware","11":"District of Columbia","12":"Florida",
    "13":"Georgia","16":"Idaho","17":"Illinois","18":"Indiana","19":"Iowa",
    "20":"Kansas","21":"Kentucky","22":"Louisiana","23":"Maine","24":"Maryland",
    "25":"Massachusetts","26":"Michigan","27":"Minnesota","28":"Mississippi",
    "29":"Missouri","30":"Montana","31":"Nebraska","32":"Nevada","33":"New Hampshire",
    "34":"New Jersey","35":"New Mexico","36":"New York","37":"North Carolina",
    "38":"North Dakota","39":"Ohio","40":"Oklahoma","41":"Oregon","42":"Pennsylvania",
    "44":"Rhode Island","45":"South Carolina","46":"South Dakota","47":"Tennessee",
    "48":"Texas","49":"Utah","50":"Vermont","51":"Virginia","53":"Washington",
    "54":"West Virginia","55":"Wisconsin","56":"Wyoming"
  };

  const contiguousCollection = { type: "FeatureCollection", features: states };
chartB.projection.fitExtent(
  [[20, 20], [chartB.width - 20, chartB.height - 20]],
  contiguousCollection
);

chartB.path = d3.geoPath(chartB.projection); 

  states = states.filter((d) => {
    const fips = String(d.id).padStart(2, "0");
    return !EXCLUDE_FIPS.has(fips);
  });

  states.forEach((d) => {
    const fips = String(d.id).padStart(2, "0");
    d.abbr = fipsToAbbr[fips] || "";
    d.name = fipsToName[fips] || d.properties?.name || d.abbr;
  });


  
  chartB.colorUS = d3 
    .scaleSequential(d3.interpolateBlues)
    .domain([0, d3.max(rawData, (d) => d.total)]);

    chartB.gStates
    .selectAll("path.chartB-state")
    .data(states)
    .join("path")
    .attr("class", "chartB-state")
    .attr("d", chartB.path)
    .attr("stroke", "#1a1a1a")
    .attr("stroke-width", 0.5)
    .attr("fill", (d) => {
      const rec = chartB.data.get(d.abbr);
      return rec ? chartB.colorUS(rec.total) : "#eee";
    })
    .style("cursor", "pointer")
    .on("pointerover", function () {
      tooltip.style("visibility", "visible");
    })
    .on("pointermove", function (event, d) {
      const rec = chartB.data.get(d.abbr) || {};
      const total = rec.total !== undefined ? d3.format(",")(rec.total) : 0;
      const existing = rec.existing !== undefined ? d3.format(",")(rec.existing) : "N/A";
      const under_construction = rec.under_construction !== undefined ? d3.format(",")(rec.under_construction) : "N/A";
      const proposed = rec.proposed !== undefined ? d3.format(",")(rec.proposed) : "N/A";

      const stateTitle = d.name ? `Data Centers in ${d.name}` : "Data Centers";

      tooltip.html(`
        <div class="tooltip-title">${stateTitle}</div>
        <div class="tooltip-row"><span>Existing:</span> <strong>${existing}</strong></div>
        <div class="tooltip-row"><span>Under Construction:</span> <strong>${under_construction}</strong></div>
        <div class="tooltip-row"><span>Proposed:</span> <strong>${proposed}</strong></div>
        <div class="tooltip-row tooltip-total"><span>Total:</span> <strong>${total}</strong></div>
      `);

  
      const containerBounds = container.node().getBoundingClientRect();
      const tooltipNode = tooltip.node();
      const tooltipWidth = tooltipNode.offsetWidth;
      const tooltipHeight = tooltipNode.offsetHeight;

      const [mouseX, mouseY] = d3.pointer(event, container.node());

      const margin = 12;
      const spaceRight = containerBounds.width - mouseX;

      let left = spaceRight < tooltipWidth + margin
    ? mouseX - tooltipWidth - margin
    : mouseX + margin;

  left = Math.max(4, Math.min(left, containerBounds.width - tooltipWidth - 4));

  let top = mouseY - tooltipHeight - margin;
  top = Math.max(4, top); 

  tooltip
    .style("left", `${left}px`)
    .style("top", `${top}px`);
})
    .on("pointerout", function () {
      tooltip.style("visibility", "hidden");
    });

      const pjmFeatures = states.filter((d) => chartB.pjmStates.has(d.abbr));
const pjmCollection = { type: "FeatureCollection", features: pjmFeatures };

const [[x0, y0], [x1, y1]] = chartB.path.bounds(pjmCollection);
const dx = x1 - x0;
const dy = y1 - y0;
const cx = (x0 + x1) / 2;
const cy = (y0 + y1) / 2;

const scale = Math.max(
  1,
  Math.min(5, 0.75 / Math.max(dx / chartB.width, dy / chartB.height))
);

chartB.pjmZoomTarget = {
  scale: scale,
  x: chartB.width / 2 - scale * cx,
  y: chartB.height / 2 - scale * cy
};
      return chartB;


};

chartB.showUS = function(duration = 1.2) {
  chartB.currentView = "us";

  gsap.to("#chartB-g", {
    duration,
    x:0,
    y:0,
    scale:1,
    ease:"power2.inOut",
    transformOrigin: "0px 0px",
  });

  chartB.gStates
  .selectAll("path.chartB-state")
  .each(function (d) {
    const rec = chartB.data.get(d.abbr);
    const targetFill = rec ? chartB.colorUS(rec.total) : "#eee";
    gsap.to(this, {
      duration,
      attr: {fill: targetFill },
      opacity: 1,
      ease: "power2.inOut",
    });
  });
};

chartB.showPJM = function(duration = 1.2) {
  chartB.currentView = "pjm";
  const t = chartB.pjmZoomTarget;

  gsap.to("#chartB-g", {
    duration,
    x: t.x,
    y: t.y,
    scale: t.scale,
    ease: "power2.inOut",
    transformOrigin: "0px 0px",
  });

  chartB.gStates
  .selectAll("path.chartB-state")
  .each(function(d) {
    const isPJM = chartB.pjmStates.has(d.abbr);
    const rec = chartB.data.get(d.abbr);

    if (isPJM) {
      const targetFill = rec ? chartB.colorUS(rec.total) : "#eee";
      gsap.to(this, {
        duration,
        attr: {fill: targetFill },
        opacity: 1,
        ease: "power2.inOut",
      });


    }
  else {
    gsap.to(this, {
      duration,
      attr: {fill: chartB.greyColor },
      opacity: chartB.greyOpacity,
      ease: "power2.inOut",
    });
  }
  });
};

chartB.buildLegend = function() {
  const legendW = 200, legendH = 10;
  const margin = { top: 20, right: 15, bottom: 25, left: 15 };
  const totalW = legendW + margin.left + margin.right;
  const totalH = legendH + margin.top + margin.bottom;

  const target = document.getElementById("chart-b-legend");
  if (!target) {
    console.error("DOM element #chart-b-legend does not exist.");
    return;
  }

  target.innerHTML = "";
  const legendSvg = d3.select(target)
    .append("svg")
    .attr("width", totalW)
    .attr("height", totalH)
    .attr("viewBox", `0 0 ${totalW} ${totalH}`);

  const defs = legendSvg.append("defs");
  chartB.legendGradient = defs.append("linearGradient")
    .attr("id", "chartB-legend-gradient")
    .attr("x1", "0%").attr("x2", "100%")
    .attr("y1", "0%").attr("y2", "0%");

  const group = legendSvg.append("g")
    .attr("class", "chartB-legend")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

  chartB.legendGroup = group;


  group.append("rect")
    .attr("width", legendW)
    .attr("height", legendH)
    .style("fill", "url(#chartB-legend-gradient)");

  chartB.legendAxisG = group.append("g")
    .attr("transform", `translate(0, ${legendH})`);

  chartB.legendLabel = group.append("text")
    .attr("y", -6)
    .attr("font-size", 12)
    .style("font-family", "'Urbanist', sans-serif")
    .attr("font-weight", 600);

  chartB.updateLegend();
};

chartB.updateLegend = function() {
  const scale = chartB.colorUS;
  const interp = d3.interpolateBlues;
  const [min, max] = scale.domain();

  const stops = d3.range(0, 1.01, 0.1);
  chartB.legendGradient.selectAll("stop")
    .data(stops)
    .join("stop")
    .attr("offset", (d) => `${d * 100}%`)
    .attr("stop-color", (d) => interp(d));

  const legendScale = d3.scaleLinear().domain([min, max]).range([0, 200]);
  const axis = d3.axisBottom(legendScale).ticks(4).tickSize(4).tickFormat(d3.format(","));
  chartB.legendAxisG.call(axis);

  chartB.legendLabel.text("Total data centers");
};

/* chart c */

(function() {
  const margin = {top:30, right: 60, bottom: 60, left: 70};
  const width = 1160 - margin.left - margin.right;
  const height = 900 - margin.top - margin.bottom;

   const container = d3.select("#chartC"); 

  const svg = d3.select("#chartC")
    .append("svg")
      .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

      const tooltip = container
    .append("div")
    .attr("class", "chartC-tooltip");


      d3.json("large-loads.json").then(function (data) {
        data.sort((a, b) => a.year - b.year);

        const x = d3.scaleBand()
        .range([0,width])
        .domain(data.map(d =>d.year))
        .padding(0.2);

        svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x))
        .selectAll("text")
          .attr("transform", "translate(-10,0)rotate(-45)")
          .style("text-anchor", "end")
          .style("font-family", "Urbanist, serif")
          .style("font-size", 22);


        const y = d3.scaleLinear()
          .domain([0, d3.max(data, d => d.demand_mw)])
          .range([height, 0]);

        svg.append("g")
        .call(d3.axisLeft(y))
        .selectAll("text")
          .style("font-family", "Urbanist, serif")
          .style("font-size", 22);

        svg.selectAll("rect")
          .data(data)
          .join("rect")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.demand_mw))
            .attr("width", x.bandwidth())
            .attr("height", d => height - y(d.demand_mw))
            .attr("fill", "#1f77b4")
             .style("cursor", "pointer") 
            .on("pointerover", function () {
              tooltip.style("visibility", "visible");
            })
            .on("pointermove", function (event, d) {
              tooltip.html(`
  <div class="tooltip-row"><span>Year:</span> <strong>${d.year}</strong></div>
  <div class="tooltip-row"><span>Demand:</span> <strong>${d3.format(",")(d.demand_mw)} MW</strong></div>
`);

              const containerBounds = container.node().getBoundingClientRect();
              const tooltipNode = tooltip.node();
              const tooltipWidth = tooltipNode.offsetWidth;
              const tooltipHeight = tooltipNode.offsetHeight;

              const [mouseX, mouseY] = d3.pointer(event, container.node());
              const margin2 = 12;
              const spaceRight = containerBounds.width - mouseX;

              let left = spaceRight < tooltipWidth + margin2
                ? mouseX - tooltipWidth - margin2
                : mouseX + margin2;
              left = Math.max(4, Math.min(left, containerBounds.width - tooltipWidth - 4));

              let top = mouseY - tooltipHeight - margin2;
              top = Math.max(4, Math.min(top, containerBounds.height - tooltipHeight - 4));

              tooltip
                .style("left", `${left}px`)
                .style("top", `${top}px`);
            })
            .on("pointerout", function () {
              tooltip.style("visibility", "hidden");
            });



      }).catch(function(error) {
        console.error("Error loading or parsing data:", error);
      });

})();

/* chart d */

const chartD = {
  svg: null,
  xScale: null,
  yScale: null,
  colorScale: null,
  lineGenerator: null,
  xAxisGroup: null,
  data: null,
  stages: null,
  tooltip: null,
  width: null,
  height: null,

  init: function (containerSelector, dataUrl) {
    return d3.json(dataUrl).then((raw) => {
      // 1. Parse dates and numeric values upfront
      raw.forEach((d) => {
        d.date = new Date(d.plot_date_mw);
        d.value = +d.value;
      });
      this.data = raw;

      const totalWidth = 900;
      const totalHeight = 600;
      const margin = { top: 30, right: 140, bottom: 50, left: 60 };
      const width = totalWidth - margin.left - margin.right;
      const height = totalHeight - margin.top - margin.bottom;

      this.width = width;
      this.height = height;

      // 2. Setup SVG Root
      this.svg = d3
        .select(containerSelector)
        .html("")
        .append("svg")
        .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .style("width", "100%")
        .style("height", "auto")
        .style("overflow", "visible")
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

      // 3. Setup Scales & Colors
      this.colorScale = d3
        .scaleOrdinal()
        .domain(["Historical Actual", "PJM Official Forecast", "RCP 4.5", "RCP 8.5"])
        .range(["#2b2b2b", "#777777", "#cc6d00", "#a80600"]);

      this.yScale = d3
        .scaleLinear()
        .domain([0, d3.max(this.data, (d) => d.value)])
        .nice()
        .range([height, 0]);

      this.xScale = d3.scaleTime().range([0, width]);

      // 4. Setup Axes & Path Generators
      this.xAxisGroup = this.svg
        .append("g")
        .attr("transform", `translate(0,${height})`);

      this.svg
        .append("g")
        .call(d3.axisLeft(this.yScale).tickFormat((d) => `${d / 1000}k MW`));

      this.lineGenerator = d3
        .line()
        .x((d) => this.xScale(d.date))
        .y((d) => this.yScale(d.value));

      // 5. Configuration rules mapped to stages
      this.stages = {
        1: {
          xDomain: [new Date("2015-01-01"), new Date("2023-12-31")],
          filterFn: (d) =>
            d.series === "Historical Actual" && d.date <= new Date("2023-12-31")
        },
        2: {
          xDomain: [new Date("2015-01-01"), new Date("2026-12-31")],
          filterFn: (d) =>
            d.series === "Historical Actual" && d.date <= new Date("2026-12-31")
        },
        3: {
          xDomain: [new Date("2015-01-01"), new Date("2046-12-31")],
          filterFn: (d) =>
            (d.series === "Historical Actual" || d.series === "PJM Official Forecast") &&
            d.date <= new Date("2046-12-31")
        },
        4: {
          xDomain: [new Date("2015-01-01"), new Date("2046-12-31")],
          filterFn: () => true
        }
      };

      d3.select("body").selectAll(".tooltip-d").remove();
      this.tooltip = d3.select("body")
        .append("div")
        .attr("class", "tooltip-d")
        .style("opacity", 0)
        .style("position", "absolute")
        .style("pointer-events", "none");


      // Set initial stage
      this.setStage(1);
    });
  },

  setStage: function (stepNum) {
    let targetStage = 1;

    if (stepNum === 1 || stepNum === 2) {
      targetStage = 1;
    } else if (stepNum === 3) {
      targetStage = 2;
    } else if (stepNum === 4 || stepNum === 5) {
      targetStage = 3;
    } else if (stepNum >= 6) {
      targetStage = 4;
    }

    const config = this.stages[targetStage];
    if (!config) return;

    const stageData = this.data.filter(config.filterFn);

    const grouped = Array.from(
      d3.group(stageData, (d) => d.series),
      ([key, values]) => ({
        key,
        values: values.sort((a, b) => a.date - b.date)
      })
    );

    // Update X Domain & Axis with transition
    this.xScale.domain(config.xDomain);

    this.xAxisGroup
      .transition()
      .duration(750)
      .call(d3.axisBottom(this.xScale).ticks(8));

    const paths = this.svg.selectAll(".series-line").data(grouped, (d) => d.key);

    paths
      .exit()
      .transition()
      .duration(400)
      .style("opacity", 0)
      .remove();

    const pathsEnter = paths
      .enter()
      .append("path")
      .attr("class", (d) => `series-line line-${d.key.replace(/\s+/g, "-").toLowerCase()}`)
      .attr("fill", "none")
      .attr("stroke", (d) => this.colorScale(d.key))
      .attr("stroke-width", (d) => (d.key.includes("Historical") ? 2.5 : 2))
      .attr("stroke-dasharray", (d) => (d.key.includes("Historical") ? "none" : "4 4"))
      .style("opacity", 0);

    pathsEnter
      .merge(paths)
      .attr("d", (d) => this.lineGenerator(d.values)) 
      .transition()
      .duration(750)
      .style("opacity", 1); 

    const labels = this.svg.selectAll(".series-label").data(grouped, (d) => d.key);

    labels
      .exit()
      .transition()
      .duration(400)
      .style("opacity", 0)
      .remove();

    const labelsEnter = labels
      .enter()
      .append("text")
      .attr("class", "series-label")
      .attr("dy", "0.35em")
      .attr("fill", (d) => this.colorScale(d.key))
      .style("font-size", "12px")
      .style("font-weight", "600")
      .style("font-family", "sans-serif")
      .style("opacity", 0);

    labelsEnter
      .merge(labels)
      .attr("x", (d) => {
        const lastPoint = d.values[d.values.length - 1];
        return this.xScale(lastPoint.date) + 8;
      })
      .attr("y", (d) => {
        const lastPoint = d.values[d.values.length - 1];
        return this.yScale(lastPoint.value);
      })
      .text((d) => d.key)
      .transition()
      .duration(750)
      .style("opacity", 1); // Only transition opacity

      this.svg.selectAll(".hover-overlay").remove();
    this.svg.selectAll(".hover-guide").remove();
 
    const bisectDate = d3.bisector((d) => d.date).left;
    const historicalCutoff = new Date("2026-06-30");
 
    const overlay = this.svg.append("rect")
      .attr("class", "hover-overlay")
      .attr("width", this.width)
      .attr("height", this.height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .on("mouseover", () => {
        this.tooltip.style("opacity", 1);
      })
      .on("mouseout", () => {
        this.tooltip.style("opacity", 0);
      })
      .on("mousemove", (evt) => {
        const [mx] = d3.pointer(evt, overlay.node());
        const hoveredDate = this.xScale.invert(mx);
 
        // Find nearest point in each series to the hovered date
         const rows = grouped
          .filter((series) => {
            // After 2025, drop Historical Actual from the tooltip
            if (series.key === "Historical Actual" && hoveredDate > historicalCutoff) {
              return false;
            }
            // Before 2026, only show Historical Actual
            if (series.key !== "Historical Actual" && hoveredDate <= historicalCutoff) {
              return false;
            }
            return true;
          })
          .map((series) => {
            const i = bisectDate(series.values, hoveredDate, 1);
            const a = series.values[i - 1];
            const b = series.values[i];
            const closest =
              !a ? b : !b ? a :
              (hoveredDate - a.date > b.date - hoveredDate ? b : a);
            return closest ? { key: series.key, point: closest } : null;
          })
          .filter(Boolean);
 
        if (!rows.length) {
          this.tooltip.style("opacity", 0);
          return;
        }
        this.tooltip.style("opacity", 1);
 
        const snapDate = rows[0].point.date;
 
        const rowsHtml = rows
          .map(
            (r) =>
              `<div style="color:${this.colorScale(r.key)}">
                 <strong>${r.key}:</strong> ${r.point.value.toLocaleString()} MW
               </div>`
          )
          .join("");
 
        this.tooltip
          .html(
            `<div>${d3.timeFormat("%b %Y")(snapDate)}</div>${rowsHtml}`
          )
          .style("left", `${evt.pageX + 12}px`)
          .style("top", `${evt.pageY - 28}px`);
      });
  },

  initScrollySteps: function () {
    // Falls back gracefully if .sectionD class isn't on outer div
    const stepElements = document.querySelectorAll(".sectionD .step-pause").length
      ? document.querySelectorAll(".sectionD-outer .step-pause")
      : document.querySelectorAll(".scrolly-steps .step-pause");

    stepElements.forEach((wrapperEl) => {
    const stepEl = wrapperEl.querySelector(".step-d");
    const stepNum = +stepEl.dataset.step;

    ScrollTrigger.create({
      id: "d",
      trigger: wrapperEl,
      start: "top center",
      end: "bottom center",
      markers: false,
      onEnter: () => this.setStage(stepNum),
      onEnterBack: () => this.setStage(stepNum)
      });
    });

    this.setStage(1);
    ScrollTrigger.refresh();
  }
};





d3.json("chart-e-past-future-plants.json").then(function(exportObj) {
  const dataE = exportObj.data;
  const fillScale = exportObj.fill_scale;
  const alphaScale = exportObj.alpha_scale;

  drawChartE(dataE, fillScale, alphaScale);
});

function lightenColor(hex, amount) {
  const { r, g, b } = d3.rgb(hex);
  return d3.rgb(
    r + (255 - r) * amount,
    g + (255 - g) * amount,
    b + (255 - b) * amount
  ).formatHex();
}

function drawChartE(dataE, fillScale) {
  d3.select("#chart-e").html("");

  const isMobile = window.innerWidth < 768;

  const margin = isMobile 
    ? { top: 50, right: 20, bottom: 50, left: 65 }
    : { top: 60, right: 140, bottom: 60, left: 105 };
  const gap = isMobile ? 120 : 50;

  const totalWidth = isMobile ? window.innerWidth - 20 : 1300;
  const totalHeight = isMobile ? 1000 : 600; // taller total since facets stack

  // On mobile: facets stack vertically, so each facet gets full width, half height
  const facetWidth = isMobile
    ? totalWidth - margin.left - margin.right
    : (totalWidth - margin.left - margin.right - gap) / 2;

  const facetHeight = isMobile
    ? (totalHeight - margin.top - margin.bottom - gap) / 2
    : totalHeight - margin.top - margin.bottom;

  const height = facetHeight; // used below in y-scale/axis

  let tooltip = d3.select(".chartE-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select("body")
      .append("div")
      .attr("class", "chartE-tooltip")
      .style("opacity", 0);
  }

  const svg = d3.select("#chart-e")
    .append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const fuelCategories = Object.keys(fillScale);
  const facets = [
    { title: "Built / Operating", key: "Actual/Known" },
    { title: "Planned / Proposed", key: "Projected only" }
  ];

  const decades = [...new Set(dataE.map(d => d.decade))].sort();

  const maxCapacity = d3.max(facets, facet => {
    const facetData = dataE.filter(d => d.date_type === facet.key);
    const byDecade = d3.group(facetData, d => d.decade);
    return d3.max(decades, dec => d3.sum(byDecade.get(dec) || [], d => d.capacity_mw));
  });

  const x = d3.scaleBand()
    .domain(decades)
    .range([0, facetWidth])
    .padding(0.2);

  const y = d3.scaleLinear()
    .domain([0, (maxCapacity || 0) * 1.1]).nice()
    .range([height, 0]);

  // On mobile, draw one y-axis per facet (since they're stacked, not sharing one axis visually)
  // On desktop, keep the single shared y-axis on the left
  if (!isMobile) {
    const yAxisG = svg.append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`)
      .call(d3.axisLeft(y).tickFormat(d => `${d / 1000}k MW`));
    yAxisG.select(".domain").remove();
    yAxisG.selectAll("text")                   
      .style("font-size", "16px")                  
      .style("font-family", "'Urbanist', sans-serif"); 

    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 15)
      .attr("x", -(margin.top + height / 2))
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-family", "'Urbanist', sans-serif")
      .style("font-weight", "600")
      .text("Capacity (MW)");
  }

  facets.forEach((facet, index) => {
    const xOffset = isMobile ? margin.left : margin.left + index * (facetWidth + gap);
    const yOffset = isMobile ? margin.top + index * (facetHeight + gap) : margin.top;

    const chartG = svg.append("g")
      .attr("transform", `translate(${xOffset}, ${yOffset})`);

    chartG.append("text")
      .attr("x", facetWidth / 2)
      .attr("y", -20)
      .attr("text-anchor", "middle")
      .style("font-size", isMobile ? "13px" : "18px")
      .style("font-weight", "bold")
      .style("font-family", "'Urbanist', sans-serif")
      .text(facet.title);

    if (isMobile) {
      const facetYAxisG = chartG.append("g")
        .call(d3.axisLeft(y).tickFormat(d => `${d / 1000}k MW`));
      facetYAxisG.select(".domain").remove();
       facetYAxisG.selectAll("text")                     
        .style("font-size", "11px")                        
        .style("font-family", "'Urbanist', sans-serif");
        
         chartG.append("text")
    .attr("transform", "rotate(-90)")
    .attr("x", -facetHeight / 2)
    .attr("y", -margin.left + 12) // pull it in close to the left edge
    .attr("text-anchor", "middle")
    .style("font-size", "10px")
    .style("font-weight", "600")
    .style("font-family", "'Urbanist', sans-serif")
    .text("Capacity (MW)");
    }

    const facetData = dataE.filter(d => d.date_type === facet.key);
    const sortedData = [...facetData].sort((a, b) => {
      return fuelCategories.indexOf(a.fuel_category) - fuelCategories.indexOf(b.fuel_category);
    });

    const dataByDecade = d3.group(sortedData, d => d.decade);

    decades.forEach(dec => {
      const rows = dataByDecade.get(dec) || [];

 const grouped = d3.rollup(
    rows,
    v => ({
      total: d3.sum(v, d => d.capacity_mw),
      count: v.length
    }),
    d => d.fuel_category
  );

  const groupedArray = fuelCategories
    .filter(fuel => grouped.has(fuel))
    .map(fuel => ({ fuel_category: fuel, ...grouped.get(fuel) }));


      let cumulative = 0;

       groupedArray.forEach(seg => {
    const rect = chartG.append("rect")
      .attr("x", x(dec))
      .attr("y", y(cumulative + seg.total))
      .attr("width", x.bandwidth())
      .attr("height", Math.max(0, y(cumulative) - y(cumulative + seg.total)))
      .attr("fill", fillScale[seg.fuel_category])
      .attr("shape-rendering", "crispEdges");

    if (!isMobile) {
      rect
        .on("mouseover", function (event) {
          tooltip.transition().duration(150).style("opacity", 1);
          tooltip.html(
            `<strong>${seg.fuel_category}</strong><br>${dec}<br>${seg.total.toLocaleString()} MW total<br>${seg.count} plant${seg.count !== 1 ? "s" : ""}`
          );
        })
        .on("mousemove", function (event) {
          tooltip
            .style("left", (event.pageX + 12) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function () {
          tooltip.transition().duration(150).style("opacity", 0);
        });
    }

    cumulative += seg.total;
      });
    });

    chartG.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickFormat(d => d + "s"))
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text")                        
        .style("font-size",isMobile ? "10px" : "16px")                          
        .style("font-family", "'Urbanist', sans-serif"));    

    chartG.append("text")
      .attr("x", facetWidth / 2)
      .attr("y", height + 45)
      .attr("text-anchor", "middle")
      .style("font-size", "18px")
      .style("font-family", "'Urbanist', sans-serif")
      .text("Decade of Initial Plant Operations");
  });

  const legend = svg.append("g")
    .attr("transform", `translate(${totalWidth - margin.right + 20}, ${margin.top})`);

  fuelCategories.forEach((fuel, i) => {
    const row = legend.append("g")
      .attr("transform", `translate(0, ${i * 24})`);

    row.append("rect")
      .attr("width", 14)
      .attr("height", 14)
      .attr("fill", fillScale[fuel]);

    row.append("text")
      .attr("x", 20)
      .attr("y", 11)
      .style("font-size", "18px")
      .style("font-family", "'Urbanist', sans-serif")
      .text(fuel);
  });
}







  const statesToShow = ["Delaware", "Illinois", "Indiana", "Kentucky", "Maryland", "Michigan", "New Jersey", "North Carolina", "Ohio", "Pennsylvania", "Tennessee", "Virginia", "West Virginia", "District Of Columbia"]
  const statePositions = {
  "Delaware":     { row: 1, col: 3 },
  "Illinois":          { row: 0, col: 0 },
  "Indiana":       { row: 1, col: 0 },
  "Kentucky":       { row: 2, col: 0 },
  "Maryland":   { row: 1, col: 2 },
  "Michigan":     { row: 0, col: 1 },
  "New Jersey":    { row: 0, col: 3 },
  "North Carolina":   { row: 3, col: 2 },
  "Ohio":  { row: 1, col: 1 },
  "Pennsylvania":        { row: 0, col: 2 },
  "Tennessee":  { row: 3, col: 1 },
  "Virginia":          { row: 2, col: 2 },
  "West Virginia":        { row: 2, col: 1 },
  "District Of Columbia":        { row: 2, col: 3 }
};

const mobile_breakpoint = 768;

Promise.all([
  d3.json("june_prices.json"),
  d3.json("state_summary_prices.json")
]).then(function([seriesObj, summaryObj]) {
  const summaryByState = new Map(summaryObj.data.map(d => [d.state, d]));

  const dataG = seriesObj.data
    .filter(d => statesToShow.includes(d.state))
    .map(d => ({ ...d, summary: summaryByState.get(d.state), pos: statePositions[d.state] }));

  render(dataG);
});

let currentData = null;

function render(dataG) {
  currentData = dataG;
  if (window.innerWidth < mobile_breakpoint) {
    drawCarousel(dataG);
  } else {
    drawChartG(dataG);
  }
}

let resizeTimer;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (currentData) render(currentData);
  }, 200);
});

function drawChartG(dataG) {
  d3.select("#chart-g").html("");

  const margin = { top: 20, right: 20, bottom: 20, left: 20 };
  const width = 690 - margin.left - margin.right;
  const height = 690 - margin.top - margin.bottom;

  const totalWidth = width + margin.left + margin.right;
  const totalHeight = height + margin.top + margin.bottom;

  const svg = d3.select("#chart-g")
    .append("svg")
    .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
    .attr("preserveAspectRatio", "xMinYMin meet")
    .style("width", "100%")
    .style("height", "auto")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const columns = 4;
  const rows = 4;
  const facetWidth = width / columns;
  const facetHeight = height / rows;
  const allValues = dataG.flatMap(d =>d.series);

    
  const facetMargin = { top: 25, right: 20, bottom: 25, left: 20 };

 const x = d3.scaleLinear()
    .domain(d3.extent(dataG.flatMap(d => d.series), d => d.year))
    .range([facetMargin.left, facetWidth - facetMargin.right]);

  const y = d3.scaleLinear()
  .domain([0, d3.max(allValues, d => d.price)])
  .range([facetHeight - facetMargin.bottom, facetMargin.top]);

  const line = d3.line()
  .x(d => x(d.year))
  .y(d => y(d.price));

  const yearExtent = d3.extent(
    dataG.flatMap( d => d.series),
    d => d.year
  );

  const facet = svg.selectAll(".facet")
  .data(dataG)
  .join("g")
  .attr("class", "facet")
  .attr("transform", d => `translate(${d.pos.col * facetWidth}, ${d.pos.row * facetHeight})`);

const colorScale = d3.scaleLinear()
  .domain([0, d3.max(dataG, d =>d.summary.pct_increase)])
  .range(["#ffffff", "#ff9e9e"])
  .clamp(true);

  facet.append("rect")
    .attr("width", facetWidth - 4)
    .attr("height", facetHeight - 4)
    .attr("rx", 8)
    .attr("ry", 8)
    .attr("fill", d => colorScale(d.summary.pct_increase));
  
  facet.append("path")
    .datum(d =>d.series)
    .attr("fill", "none")
    .attr("stroke", "#880000")
    .attr("stroke-width", 2)
    .attr("d", line);
  
  facet.append("text")
    .attr("x", 20)
    .attr("y", 20)
    .style("font-size", "12px")
    .style("font-family", "'Urbanist', sans-serif")
    .text(d => d.state);
  
  facet.append("g")
  .attr("class", "x-axis")
  .attr("transform", `translate(0, ${facetHeight - facetMargin.bottom})`)
  .each(function(d) {
    const facetYearExtent = d3.extent(d.series, s => s.year);
    const axisG = d3.select(this)
      .call(
        d3.axisBottom(x)
          .tickValues(facetYearExtent)
          .tickFormat(d3.format("d"))
          .tickSize(0)
      )
      .call(g => g.select(".domain").remove());
    axisG.selectAll(".tick text")
      .style("text-anchor", (d, i, nodes) => i === 0 ? "start" : "end")
      .style("font-family", "'Urbanist', sans-serif");
  });

  facet.append("text")
    .attr("x", d => x(d.series[0].year))
  .attr("y", facetMargin.top + 40) 
  .attr("text-anchor", "start")
    .style("font-size", "11px")
    .style("font-family", "'Urbanist', sans-serif")
    .style("fill", "#540505")
    .text(d =>  `${d.summary.start_value}¢`); 

  facet.append("text")
     .attr("x", d => x(d.series[d.series.length - 1].year)-5)
  .attr("y", facetMargin.top + 20)
  .attr("text-anchor", "end")
    .style("font-size", "11px")
    .style("font-family", "'Urbanist', sans-serif")
    .style ("fill", "#540505")
    .text( d => `${d.summary.end_value}¢`);

  facet.append("text")
    .attr("x", facetWidth - facetMargin.right)
    .attr("y", facetHeight - 30)
    .attr("text-anchor", "end")
    .style("font-size", "14px")
    .style("font-family", "'Urbanist', sans-serif")
    .style("font-weight", "bold")
    .style("fill", d => d.summary.pct_increase >0 ? "#810000" : "steelblue")
    .text(d => `+${d.summary.pct_increase}%`);
  
  


}

function drawCarousel(dataG) {
  const root = d3.select("#chart-g");
  root.html("");

  const scroller = root.append("div")
    .attr("class", "carousel-scroller")
    .style("display", "flex")
    .style("overflow-x", "auto")
    .style("scroll-snap-type", "x proximity")
    .style("gap", "12px")
    .style("padding", "4px 4px 12px 4px")
    .style("-webkit-overflow-scrolling", "touch");

  const cardWidth = 280;
  const cardHeight = 280;
  const margin = { top: 25, right: 20, bottom: 25, left: 20 };

  const colorScale = d3.scaleLinear()
    .domain([0, d3.max(dataG, d => d.summary.pct_increase)])
    .range(["#ffffff", "#ff9e9e"])
    .clamp(true);

  const cards = scroller.selectAll(".card")
    .data(dataG)
    .join("div")
    .attr("class", "card")
    .style("flex", "0 0 85%")
    .style("max-width", "340px")
    .style("scroll-snap-align", "center");

  cards.each(function(d) {
    const svg = d3.select(this)
      .append("svg")
      .attr("viewBox", `0 0 ${cardWidth} ${cardHeight}`)
      .attr("preserveAspectRatio", "xMidYMid meet")
      .style("width", "100%")
      .style("height", "auto")
      .style("display", "block");

    const g = svg.append("g");

    const x = d3.scaleLinear()
      .domain(d3.extent(d.series, s => s.year))
      .range([margin.left, cardWidth - margin.right]);

    const y = d3.scaleLinear()
      .domain([0, d3.max(d.series, s => s.price)])
      .nice()
      .range([cardHeight - margin.bottom, margin.top]);

    const line = d3.line()
      .x(s => x(s.year))
      .y(s => y(s.price));

    g.append("rect")
      .attr("width", cardWidth)
      .attr("height", cardHeight)
      .attr("rx", 12)
      .attr("ry", 12)
      .attr("fill", colorScale(d.summary.pct_increase));

    g.append("path")
      .datum(d.series)
      .attr("fill", "none")
      .attr("stroke", "#880000")
      .attr("stroke-width", 2.5)
      .attr("d", line);

    g.append("text")
      .attr("x", 20)
      .attr("y", 28)
      .style("font-size", "16px")
      .style("font-family", "'Urbanist', sans-serif")
      .style("font-weight", "600")
      .text(d.state);

    const yearExtent = d3.extent(d.series, s => s.year);
    const axisG = g.append("g")
      .attr("transform", `translate(0, ${cardHeight - margin.bottom})`)
      .call(
        d3.axisBottom(x)
          .tickValues(yearExtent)
          .tickFormat(d3.format("d"))
          .tickSize(0)
      )
      .call(ax => ax.select(".domain").remove());
    axisG.selectAll(".tick text")
      .style("text-anchor", (dd, i) => i === 0 ? "start" : "end")
      .style("font-family", "'Urbanist', sans-serif")
      .style("font-size", "12px");

    g.append("text")
      .attr("x", x(d.series[0].year))
      .attr("y", y(d.summary.start_value) - 14)
      .attr("text-anchor", "start")
      .style("font-size", "13px")
      .style("font-family", "'Urbanist', sans-serif")
      .style("fill", "#540505")
      .text(`${d.summary.start_value}¢`);

    g.append("text")
      .attr("x", x(d.series[d.series.length - 1].year))
      .attr("y", y(d.summary.end_value) - 14)
      .attr("text-anchor", "end")
      .style("font-size", "13px")
      .style("font-family", "'Urbanist', sans-serif")
      .style("fill", "#540505")
      .text(`${d.summary.end_value}¢`);

    g.append("text")
      .attr("x", cardWidth - margin.right)
      .attr("y", cardHeight - 34)
      .attr("text-anchor", "end")
      .style("font-size", "20px")
      .style("font-family", "'Urbanist', sans-serif")
      .style("font-weight", "bold")
      .style("fill", d.summary.pct_increase > 0 ? "#810000" : "steelblue")
      .text(`+${d.summary.pct_increase}%`);
  });
}



chartB.initScrollySteps = function () {
  document.querySelectorAll(".sectionB .step").forEach((stepEl) => {
    const stepNum = +stepEl.dataset.step;

    ScrollTrigger.create({
      id:"b",
      trigger: stepEl,
      start: "top center",
      end: "bottom center",
      onEnter: () => {
        if (stepNum >= 2) chartB.showPJM();
        else chartB.showUS();
      },
      onEnterBack: () => {
        if (stepNum >= 2) chartB.showPJM();
        else chartB.showUS();
      },
    });
  });

  ScrollTrigger.refresh();
};

chartB.init("#chart-b-container", "data_centers.json").then(() => {
  chartB.buildLegend();
  chartB.initScrollySteps();

})

chartD.init("#chartD", "pjm-projections.json").then(() => {
  chartD.initScrollySteps();
});;




gsap.registerPlugin(ScrollTrigger);

const drawings = gsap.utils.toArray('.drawing');
let current = 0;

function switchTo(index) {
  if (index === current || index < 0 || index >= drawings.length) return;

  const outgoing = drawings[current];
  const incoming = drawings[index];

  gsap.to(outgoing, {
    opacity: 0,
    scale: 1,
    duration: 0.3,
    ease: "power2.inOut",
    onComplete: () => outgoing.classList.remove('active')
  });

  incoming.classList.add('active');
  gsap.fromTo(incoming,
    { opacity: 0, scale: 1 },
    { opacity: 1, scale: 1, duration: 0.3, ease: "power2.inOut" }
  );

  current = index;
}

ScrollTrigger.create({
  id: "a",
  trigger: ".scroll-container",  /* Trigger from the outer wrapper */
  pin: ".pin-wrap",              /* Pin the wrapper, not just the inner stage */
  start: "top top",              /* Locks in place right as it hits top of viewport */
  end: "+=400%",                /* Gives 3 full viewports of scroll runway */
  pinSpacing: true,              /* CRITICAL: GSAP pushes down the next section automatically */
  scrub: false,
  onUpdate: (self) => {
    // Clamp values so each image gets an equal duration AND Image 2 stays visible before unpinning
    if (self.progress < 0.33) {
      switchTo(0);
    } else if (self.progress < 0.66) {
      switchTo(1);
    } else {
      switchTo(2); /* Image 2 stays active from 66% to 100% progress */
    }
  }
});

window.addEventListener("load", () => {
  ScrollTrigger.refresh();
});

const animation = lottie.loadAnimation({
  container: document.getElementById('lottie-container'), 
  renderer: 'svg',                                     
  loop: true,                                      
  autoplay: true,                                      
  path: 'images/cycle-3.json'                        
});

const images = gsap.utils.toArray('.cycle-img');
let index = 0;

// set initial state: only first image visible
gsap.set(images, { opacity: 0 });
gsap.set(images[0], { opacity: 1 });

function showNext() {
  gsap.set(images[index], { opacity: 0 });
  index = (index + 1) % images.length;
  gsap.set(images[index], { opacity: 1 });
}

gsap.timeline({ repeat: -1 })
  .call(showNext, [], "+=0.17");

});