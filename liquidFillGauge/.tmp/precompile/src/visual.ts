/// <amd-dependency path="liquidFillGauge">

module powerbi.extensibility.visual.PBI_CV_94E55AB3_5D45_4B62_A49D_19E2109AA028  {
    export class Visual implements IVisual {
        private target: HTMLElement;
        private updateCount: number;
        private gauge: any;
        private svg: Element;

        constructor(options: VisualConstructorOptions) {
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

        public update(options: VisualUpdateOptions) {
            console.log('Visual update', options);
            var dataView = options.dataViews[0];
            if (dataView) {
                var value = dataView.single.value;
                if (value >= 0) {
                    if (!this.gauge) {
                        this.gauge = loadLiquidFillGauge(this.svg.id, value, liquidFillGaugeDefaultSettings());
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
}