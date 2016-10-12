/// <amd-dependency path='liquidFillGauge'>

module powerbi.extensibility.visual {

    export class Visual implements IVisual {
        private target: HTMLElement;
        private gauge: any;
        private svg: d3.Selection<SVGElement>;
        private settings: any;
        private prevDataViewObjects: any = {}; // workaround temp variable because the PBI SDK doesn't correctly identify style changes. See getSettings method.

        constructor(options: VisualConstructorOptions) {
            this.target = options.element;
            let svg = this.svg = d3.select(options.element).append('svg').classed('liquidFillGauge', true);
        }

        @logExceptions()
        public update(options: VisualUpdateOptions) {
            // Set the svg element height/width based on viewport
            let width = options.viewport.width;
            let height = options.viewport.height;

            this.svg.attr({
                width: width,
                height: height
            });

            // Grab the dataview object
            var dataView = options.dataViews[0];

            if (dataView && dataView.single && dataView.single.value) {
                // If we don't have a gauge yet, settings have changed or we just resized, then we need to redraw
                var settingsChanged = this.getSettings(dataView.metadata.objects); // workaround because of sdk bug that doesn't notify when only style has changed

                if (!this.gauge || settingsChanged || ((options.type & VisualUpdateType.Resize) || options.type & VisualUpdateType.ResizeEnd)) {
                    this.svg.selectAll("*").remove();
                    this.gauge = loadLiquidFillGauge(this.svg, dataView.single.value, this.settings);
                } else {
                    // This means we have a gauge and the only thing that changed was the data.
                    this.gauge.update(dataView.single.value)
                }
            }
        }

        /**
         * Enumerates through the objects defined in the capabilities and adds the properties to the format pane
         *
         * @function
         * @param {EnumerateVisualObjectInstancesOptions} options - Map of defined objects
         */
        @logExceptions()
        public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstanceEnumeration {
            let objectName = options.objectName;
            let objectEnumeration: VisualObjectInstance[] = [];

            switch (objectName) {
                case 'text':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            textColor: { solid: { color: this.settings.textColor } },
                            waveTextColor: { solid: { color: this.settings.waveTextColor } },
                            minValue: this.settings.minValue,
                            maxValue: this.settings.maxValue,
                            size: this.settings.textSize,
                            textVertPosition: this.settings.textVertPosition,
                            valueCountUp: this.settings.valueCountUp,
                            displayPercent: this.settings.displayPercent
                        },
                        selector: null
                    });
                    break;
                case 'wave':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            waveColor: { solid: { color: this.settings.waveColor } },
                            waveHeight: this.settings.waveHeight,
                            waveHeightScaling: this.settings.waveHeightScaling,
                            waveCount: this.settings.waveCount,
                            waveRise: this.settings.waveRise,
                            waveRiseTime: this.settings.waveRiseTime,
                            waveAnimate: this.settings.waveAnimate,
                            waveAnimateTime: this.settings.waveAnimateTime,
                            waveOffset: this.settings.waveOffset
                        },
                        selector: null
                    });
                    break;
                case 'circle':
                    objectEnumeration.push({
                        objectName: objectName,
                        properties: {
                            circleColor: { solid: { color: this.settings.circleColor } },
                            circleThickness: this.settings.circleThickness,
                            circleFillGap: this.settings.circleFillGap
                        },
                        selector: null
                    });
                    break;
            };

            return objectEnumeration;
        }

        public destroy(): void {
            //TODO: Perform any cleanup tasks here
        }

        // Reads in settings values from the DataViewObjects and returns a settings object that the liquidFillGauge library understands
        @logExceptions()
        private getSettings(objects: DataViewObjects): boolean {
            var settingsChanged = false;

            if (typeof this.settings == 'undefined' || (JSON.stringify(objects) !== JSON.stringify(this.prevDataViewObjects))) {
                this.settings = {
                    minValue: getValue<number>(objects, 'text', 'minValue', 0), // The gauge minimum value.
                    maxValue: getValue<number>(objects, 'text', 'maxValue', 100), // The gauge maximum value.
                    circleThickness: getValue<number>(objects, 'circle', 'circleThickness', .05, .9), // The outer circle thickness as a percentage of it's radius.
                    circleFillGap: getValue<number>(objects, 'circle', 'circleFillGap', .05), // The size of the gap between the outer circle and wave circle as a percentage of the outer circles radius.
                    circleColor: getValue<Fill>(objects, 'circle', 'circleColor', { solid: { color: "#178BCA" } }).solid.color, // The color of the outer circle.
                    waveHeight: getValue<number>(objects, 'wave', 'waveHeight', .05), // The wave height as a percentage of the radius of the wave circle.
                    waveCount: getValue<number>(objects, 'wave', 'waveCount', 5), // The number of full waves per width of the wave circle.
                    waveRiseTime: getValue<number>(objects, 'wave', 'waveRiseTime', 1000), // The amount of time in milliseconds for the wave to rise from 0 to it's final height.
                    waveAnimateTime: getValue<number>(objects, 'wave', 'waveAnimateTime', 18000), // The amount of time in milliseconds for a full wave to enter the wave circle.
                    waveRise: getValue<boolean>(objects, 'wave', 'waveRise', true), // Control if the wave should rise from 0 to it's full height, or start at it's full height.
                    waveHeightScaling: getValue<boolean>(objects, 'wave', 'waveHeightScaling', true), // Controls wave size scaling at low and high fill percentages. When true, wave height reaches it's maximum at 50% fill, and minimum at 0% and 100% fill. This helps to prevent the wave from making the wave circle from appear totally full or empty when near it's minimum or maximum fill.
                    waveAnimate: getValue<boolean>(objects, 'wave', 'waveAnimate', true), // Controls if the wave scrolls or is static.
                    waveColor: getValue<Fill>(objects, 'wave', 'waveColor', { solid: { color: "#178BCA" } }).solid.color, // The color of the fill wave.
                    waveOffset: getValue<number>(objects, 'wave', 'waveOffset', 0), // The amount to initially offset the wave. 0 = no offset. 1 = offset of one full wave.
                    textVertPosition: getValue<number>(objects, 'text', 'textVertPosition', .5), // The height at which to display the percentage text withing the wave circle. 0 = bottom, 1 = top.
                    textSize: getValue<number>(objects, 'text', 'size', 1), // The relative height of the text to display in the wave circle. 1 = 50%
                    valueCountUp: getValue<boolean>(objects, 'text', 'valueCountUp', true), // If true, the displayed value counts up from 0 to it's final value upon loading. If false, the final value is displayed.
                    displayPercent: getValue<boolean>(objects, 'text', 'displayPercent', true), // If true, a % symbol is displayed after the value.
                    textColor: getValue<Fill>(objects, 'text', 'textColor', { solid: { color: "#045681" } }).solid.color, // The color of the value text when the wave does not overlap it.
                    waveTextColor: getValue<Fill>(objects, 'text', 'waveTextColor', { solid: { color: "#A4DBf8" } }).solid.color // The color of the value text when the wave overlaps it.
                };

                settingsChanged = true;
            }
            this.prevDataViewObjects = objects;
            return settingsChanged;
        }
    }

    export function logExceptions(): MethodDecorator {
        return function (target: Object, propertyKey: string, descriptor: TypedPropertyDescriptor<Function>)
            : TypedPropertyDescriptor<Function> {

            return {
                value: function () {
                    try {
                        return descriptor.value.apply(this, arguments);
                    } catch (e) {
                        console.error(e);
                        throw e;
                    }
                }
            }
        }
    }
}