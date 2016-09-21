/*!
 * @license Open source under BSD 2-clause (http://choosealicense.com/licenses/bsd-2-clause/)
 * Copyright (c) 2015, Curtis Bratton
 * All rights reserved.
 *
 * Liquid Fill Gauge v1.1
 */
function liquidFillGaugeDefaultSettings() {
    return {
        minValue: 0,
        maxValue: 100,
        circleThickness: 0.05,
        circleFillGap: 0.05,
        circleColor: "#178BCA",
        waveHeight: 0.05,
        waveCount: 1,
        waveRiseTime: 1000,
        waveAnimateTime: 18000,
        waveRise: true,
        waveHeightScaling: true,
        waveAnimate: true,
        waveColor: "#178BCA",
        waveOffset: 0,
        textVertPosition: .5,
        textSize: 1,
        valueCountUp: true,
        displayPercent: true,
        textColor: "#045681",
        waveTextColor: "#A4DBf8" // The color of the value text when the wave overlaps it.
    };
}
function loadLiquidFillGauge(elementId, value, config) {
    if (config == null)
        config = liquidFillGaugeDefaultSettings();
    var gauge = d3.select("#" + elementId);
    var radius = Math.min(parseInt(gauge.style("width")), parseInt(gauge.style("height"))) / 2;
    var locationX = parseInt(gauge.style("width")) / 2 - radius;
    var locationY = parseInt(gauge.style("height")) / 2 - radius;
    var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
    var waveHeightScale;
    if (config.waveHeightScaling) {
        waveHeightScale = d3.scale.linear()
            .range([0, config.waveHeight, 0])
            .domain([0, 50, 100]);
    }
    else {
        waveHeightScale = d3.scale.linear()
            .range([config.waveHeight, config.waveHeight])
            .domain([0, 100]);
    }
    var textPixels = (config.textSize * radius / 2);
    var textFinalValue = parseFloat(value).toFixed(2);
    var textStartValue = config.valueCountUp ? config.minValue : textFinalValue;
    var percentText = config.displayPercent ? "%" : "";
    var circleThickness = config.circleThickness * radius;
    var circleFillGap = config.circleFillGap * radius;
    var fillCircleMargin = circleThickness + circleFillGap;
    var fillCircleRadius = radius - fillCircleMargin;
    var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
    var waveLength = fillCircleRadius * 2 / config.waveCount;
    var waveClipCount = 1 + config.waveCount;
    var waveClipWidth = waveLength * waveClipCount;
    // Rounding functions so that the correct number of decimal places is always displayed as the value counts up.
    var textRounder = function (value) { return Math.round(value); };
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(1); };
    }
    if (parseFloat(textFinalValue) != parseFloat(textRounder(textFinalValue))) {
        textRounder = function (value) { return parseFloat(value).toFixed(2); };
    }
    // Data for building the clip wave area.
    var data = [];
    for (var i = 0; i <= 40 * waveClipCount; i++) {
        data.push({ x: i / (40 * waveClipCount), y: (i / (40)) });
    }
    // Scales for drawing the outer circle.
    var gaugeCircleX = d3.scale.linear().range([0, 2 * Math.PI]).domain([0, 1]);
    var gaugeCircleY = d3.scale.linear().range([0, radius]).domain([0, radius]);
    // Scales for controlling the size of the clipping path.
    var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
    var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);
    // Scales for controlling the position of the clipping path.
    var waveRiseScale = d3.scale.linear()
        .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
        .domain([0, 1]);
    var waveAnimateScale = d3.scale.linear()
        .range([0, waveClipWidth - fillCircleRadius * 2]) // Push the clip area one full wave then snap back.
        .domain([0, 1]);
    // Scale for controlling the position of the text within the gauge.
    var textRiseScaleY = d3.scale.linear()
        .range([fillCircleMargin + fillCircleRadius * 2, (fillCircleMargin + textPixels * 0.7)])
        .domain([0, 1]);
    // Center the gauge within the parent SVG.
    var gaugeGroup = gauge.append("g")
        .attr('transform', 'translate(' + locationX + ',' + locationY + ')');
    // Draw the outer circle.
    var gaugeCircleArc = d3.svg.arc()
        .startAngle(gaugeCircleX(0))
        .endAngle(gaugeCircleX(1))
        .outerRadius(gaugeCircleY(radius))
        .innerRadius(gaugeCircleY(radius - circleThickness));
    gaugeGroup.append("path")
        .attr("d", gaugeCircleArc)
        .style("fill", config.circleColor)
        .attr('transform', 'translate(' + radius + ',' + radius + ')');
    // Text where the wave does not overlap.
    var text1 = gaugeGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.textColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
    // The clipping wave area.
    var clipArea = d3.svg.area()
        .x(function (d) { return waveScaleX(d.x); })
        .y0(function (d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI)); })
        .y1(function (d) { return (fillCircleRadius * 2 + waveHeight); });
    var waveGroup = gaugeGroup.append("defs")
        .append("clipPath")
        .attr("id", "clipWave" + elementId);
    var wave = waveGroup.append("path")
        .datum(data)
        .attr("d", clipArea)
        .attr("T", 0);
    // The inner circle with the clipping wave attached.
    var fillCircleGroup = gaugeGroup.append("g")
        .attr("clip-path", "url(" + location.href + "#clipWave" + elementId + ")");
    fillCircleGroup.append("circle")
        .attr("cx", radius)
        .attr("cy", radius)
        .attr("r", fillCircleRadius)
        .style("fill", config.waveColor);
    // Text where the wave does overlap.
    var text2 = fillCircleGroup.append("text")
        .text(textRounder(textStartValue) + percentText)
        .attr("class", "liquidFillGaugeText")
        .attr("text-anchor", "middle")
        .attr("font-size", textPixels + "px")
        .style("fill", config.waveTextColor)
        .attr('transform', 'translate(' + radius + ',' + textRiseScaleY(config.textVertPosition) + ')');
    // Make the value count up.
    if (config.valueCountUp) {
        var textTween = function () {
            var i = d3.interpolate(this.textContent, textFinalValue);
            return function (t) { this.textContent = textRounder(i(t)) + percentText; };
        };
        text1.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
        text2.transition()
            .duration(config.waveRiseTime)
            .tween("text", textTween);
    }
    // Make the wave rise. wave and waveGroup are separate so that horizontal and vertical movement can be controlled independently.
    var waveGroupXPosition = fillCircleMargin + fillCircleRadius * 2 - waveClipWidth;
    if (config.waveRise) {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(0) + ')')
            .transition()
            .duration(config.waveRiseTime)
            .attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')')
            .each("start", function () { wave.attr('transform', 'translate(1,0)'); }); // This transform is necessary to get the clip wave positioned correctly when waveRise=true and waveAnimate=false. The wave will not position correctly without this, but it's not clear why this is actually necessary.
    }
    else {
        waveGroup.attr('transform', 'translate(' + waveGroupXPosition + ',' + waveRiseScale(fillPercent) + ')');
    }
    if (config.waveAnimate)
        animateWave();
    function animateWave() {
        wave.attr('transform', 'translate(' + waveAnimateScale(wave.attr('T')) + ',0)');
        wave.transition()
            .duration(config.waveAnimateTime * (1 - wave.attr('T')))
            .ease('linear')
            .attr('transform', 'translate(' + waveAnimateScale(1) + ',0)')
            .attr('T', 1)
            .each('end', function () {
            wave.attr('T', 0);
            animateWave(config.waveAnimateTime);
        });
    }
    function GaugeUpdater() {
        this.update = function (value) {
            var newFinalValue = parseFloat(value).toFixed(2);
            var textRounderUpdater = function (value) { return Math.round(value); };
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(1); };
            }
            if (parseFloat(newFinalValue) != parseFloat(textRounderUpdater(newFinalValue))) {
                textRounderUpdater = function (value) { return parseFloat(value).toFixed(2); };
            }
            var textTween = function () {
                var i = d3.interpolate(this.textContent, parseFloat(value).toFixed(2));
                return function (t) { this.textContent = textRounderUpdater(i(t)) + percentText; };
            };
            text1.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);
            text2.transition()
                .duration(config.waveRiseTime)
                .tween("text", textTween);
            var fillPercent = Math.max(config.minValue, Math.min(config.maxValue, value)) / config.maxValue;
            var waveHeight = fillCircleRadius * waveHeightScale(fillPercent * 100);
            var waveRiseScale = d3.scale.linear()
                .range([(fillCircleMargin + fillCircleRadius * 2 + waveHeight), (fillCircleMargin - waveHeight)])
                .domain([0, 1]);
            var newHeight = waveRiseScale(fillPercent);
            var waveScaleX = d3.scale.linear().range([0, waveClipWidth]).domain([0, 1]);
            var waveScaleY = d3.scale.linear().range([0, waveHeight]).domain([0, 1]);
            var newClipArea;
            if (config.waveHeightScaling) {
                newClipArea = d3.svg.area()
                    .x(function (d) { return waveScaleX(d.x); })
                    .y0(function (d) { return waveScaleY(Math.sin(Math.PI * 2 * config.waveOffset * -1 + Math.PI * 2 * (1 - config.waveCount) + d.y * 2 * Math.PI)); })
                    .y1(function (d) { return (fillCircleRadius * 2 + waveHeight); });
            }
            else {
                newClipArea = clipArea;
            }
            var newWavePosition = config.waveAnimate ? waveAnimateScale(1) : 0;
            wave.transition()
                .duration(0)
                .transition()
                .duration(config.waveAnimate ? (config.waveAnimateTime * (1 - wave.attr('T'))) : (config.waveRiseTime))
                .ease('linear')
                .attr('d', newClipArea)
                .attr('transform', 'translate(' + newWavePosition + ',0)')
                .attr('T', '1')
                .each("end", function () {
                if (config.waveAnimate) {
                    wave.attr('transform', 'translate(' + waveAnimateScale(0) + ',0)');
                    animateWave(config.waveAnimateTime);
                }
            });
            waveGroup.transition()
                .duration(config.waveRiseTime)
                .attr('transform', 'translate(' + waveGroupXPosition + ',' + newHeight + ')');
        };
    }
    return new GaugeUpdater();
}
/// <amd-dependency path="liquidFillGauge">
var powerbi;
(function (powerbi) {
    var extensibility;
    (function (extensibility) {
        var visual;
        (function (visual) {
            var PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028;
            (function (PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028) {
                var Visual = (function () {
                    function Visual(options) {
                        console.log('Visual constructor', options);
                        this.target = options.element;
                        var xmlns = "http://www.w3.org/2000/svg";
                        this.svg = document.createElementNS(xmlns, "svg");
                        this.svg.setAttributeNS(null, 'id', this.target.className + "_gauge");
                        var boxWidth = parseInt(this.target.style.width);
                        var boxHeight = parseInt(this.target.style.height);
                        this.svg.setAttributeNS(null, "viewBox", "0 0 " + boxWidth + " " + boxHeight);
                        this.svg.setAttributeNS(null, "width", this.target.style.width);
                        this.svg.setAttributeNS(null, "height", this.target.style.height);
                        this.target.appendChild(this.svg);
                    }
                    Visual.prototype.update = function (options) {
                        console.log('Visual update', options);
                        var dataView = options.dataViews[0];
                        if (dataView) {
                            var value = dataView.single.value;
                            if (value >= 0) {
                                if (!this.gauge) {
                                    this.gauge = loadLiquidFillGauge(this.svg.id, value, liquidFillGaugeDefaultSettings());
                                }
                                else {
                                    this.gauge.update(value);
                                }
                            }
                        }
                    };
                    Visual.prototype.destroy = function () {
                        //TODO: Perform any cleanup tasks here
                    };
                    return Visual;
                }());
                PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028.Visual = Visual;
            })(PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028 = visual.PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028 || (visual.PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028 = {}));
        })(visual = extensibility.visual || (extensibility.visual = {}));
    })(extensibility = powerbi.extensibility || (powerbi.extensibility = {}));
})(powerbi || (powerbi = {}));
var powerbi;
(function (powerbi) {
    var visuals;
    (function (visuals) {
        var plugins;
        (function (plugins) {
            plugins.PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028 = {
                name: 'PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028',
                displayName: 'liquidFillGauge',
                class: 'Visual',
                version: '1.0.0',
                apiVersion: '1.1.0',
                create: function (options) { return new powerbi.extensibility.visual.PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028.Visual(options); },
                custom: true
            };
        })(plugins = visuals.plugins || (visuals.plugins = {}));
    })(visuals = powerbi.visuals || (powerbi.visuals = {}));
})(powerbi || (powerbi = {}));
//# sourceMappingURL=visual.js.map