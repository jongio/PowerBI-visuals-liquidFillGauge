/// <amd-dependency path='liquidFillGauge'>

module powerbi.extensibility.visual {
    export class Visual implements IVisual {
        private target: HTMLElement;
        private gauge: any;
        private svg: d3.Selection<SVGElement>;

        constructor(options: VisualConstructorOptions) {
            //console.log('Visual constructor', options);
            this.target = options.element;
            let svg = this.svg = d3.select(options.element).append('svg').classed('liquidFillGauge', true);
        }

        @logExceptions()
        public update(options: VisualUpdateOptions) {
            //console.log('Visual update', options);
            var dataView = options.dataViews[0];
            if (dataView) {
                var value = dataView.single.value;
                if (value >= 0) {
                    if (!this.gauge) {
                        this.gauge = loadLiquidFillGauge(this.svg, value, liquidFillGaugeDefaultSettings());
                    } else {
                        this.gauge.update(value)
                    }
                }
            }
        }

        public destroy(): void {
            //TODO: Perform any cleanup tasks here
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