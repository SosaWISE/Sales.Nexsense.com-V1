function BarGraph(canvasElement, data, options) {
	this.canvasElement = canvasElement;
	this.options = options;
	if (this.options.bgColor == undefined)
		this.options.bgColor = "#000000";
	if (this.options.barFillColor == undefined)
		this.options.barFillColor = "#888888";
	if (this.options.barBorderColor == undefined)
		this.options.barBorderColor = "transparent";
	if (this.options.goalFillColor == undefined)
		this.options.goalFillColor = "#cccccc";
	if (this.options.gridColor == undefined)
		this.options.gridColor = "#ffffff";
	if (this.options.color == undefined)
		this.options.color = "#888888";
	if (this.options.recordColor == undefined)
		this.options.recordColor = "#444444";
	if (this.options.labelFontSize == undefined)
		this.options.labelFontSize = 12;
	if (this.options.labelFontFamily == undefined)
		this.options.labelFontFamily = "Arial";
	if (this.options.barFontFamily == undefined)
		this.options.barFontFamily = "Arial";
	if (this.options.barSpacing == undefined)
		this.options.barSpacing = 1; // as a percent of the width of each bar
	if (this.options.graphPadding == undefined)
		this.options.graphPadding = {top:10,right:10,bottom:10,left:10};
	if (this.options.notchWidth == undefined)
		this.options.notchWidth = 10;
	if (this.options.barLabelPosition != 'bottom')
		this.options.barLabelPosition = 'above';
	if (this.options.barLabelPosition == 'bottom' && this.options.graphPadding.bottom < this.options.labelFontSize)
		this.options.graphPadding.bottom = Number(this.options.labelFontSize) * 1.5;

	this.maxvalue = 1;

	this.animation = {
		timer: null,
		startTime: null,
		duration: 2500,
	};
	if (this.options.animationDuration)
		this.animation.duration = this.options.animationDuration;

	var self = this;

	this.render = function() {
		if (!this.data)
			return false;

		var w = self.canvasElement.offsetWidth;
		var h = self.canvasElement.offsetHeight;
		var ctx = self.canvasElement.getContext("2d");

		// upscale this thang if the device pixel ratio is higher than 1
		var pxRatio = window.devicePixelRatio || 1;
		if (pxRatio > 1) {
			ctx.setTransform(1,0,0,1,0,0);
			ctx.scale(pxRatio, pxRatio);
		}

		// fill background
		ctx.clearRect(0, 0, w, h);
		ctx.fillStyle = self.options.bgColor;
		ctx.fillRect(0, 0, w, h);

		// calculate important measurements
		for (var i=0; i<self.data.length; i++) {
			if (self.data[i].value && self.data[i].value > self.maxvalue)
				self.maxvalue = self.data[i].value;
			if (self.data[i].goal && self.data[i].goal > self.maxvalue)
				self.maxvalue = self.data[i].goal;
		}
		if (self.options.record && self.options.record > self.maxvalue)
			self.maxvalue = self.options.record;

		// calculate gridlines if they aren't provided
		ctx.fillStyle = self.options.color;
		ctx.font = self.options.labelFontSize + "px " + self.options.labelFontFamily;
		ctx.textAlign = 'right';
		var gridlines = [];
		var steps = 7;//gridheight / 40;
		var avgstep = Math.ceil(self.maxvalue / steps);
		var roundvalues = [0.001,0.01,0.02,0.05,0.1,0.25,0.5,1,2,5,10,20,50,100,200,250,500,1000,2000,5000,10000,20000,30000,40000,50000,100000,200000,250000,500000,1000000];
		var step = 1;
		var stepdiff = -1;
		for (var i=0; i<roundvalues.length; i++) {
			var diff = Math.abs(avgstep - roundvalues[i]);
			if (stepdiff == -1 || stepdiff > diff) {
				stepdiff = diff;
				step = roundvalues[i];
			}
		}
		var widestLabel = 0;
		for (var i=0; i<=self.maxvalue; i+=step) {
			gridlines.push(i);
			var lw = ctx.measureText(formatNumber(i)).width;
			if (lw > widestLabel)
				widestLabel = lw;
		}
		var barspacing = self.options.barSpacing;
		var notchwidth = self.options.notchWidth;
		var notchspace = 3;
		var recordheight = 3 + 18;
		var gridarea = {left:self.options.graphPadding.left+Math.ceil(widestLabel)+notchwidth+notchspace, top:self.options.graphPadding.top+recordheight, right:self.options.graphPadding.right, bottom:self.options.graphPadding.bottom};
		var gridwidth = w - gridarea.left - gridarea.right;
		var gridheight = h - gridarea.top - gridarea.bottom;
		var barwidth = gridwidth / (self.data.length + barspacing * (self.data.length-1));

		// draw grid
		ctx.strokeStyle = self.options.gridColor;
		ctx.textBaseline = "middle";
		for (var i=0; i<gridlines.length; i++) {
			var y = h - gridarea.bottom - gridlines[i]/self.maxvalue * gridheight;
			ctx.beginPath();
			ctx.moveTo(gridarea.left - notchwidth, y);
			ctx.lineTo(w - gridarea.right, y);
			ctx.stroke();
			ctx.fillText(formatNumber(gridlines[i]), gridarea.left - notchwidth - notchspace, y);
		}

		// draw record (if any)
		if (self.options.record) {
			ctx.strokeStyle = self.options.recordColor;
			ctx.fillStyle = self.options.recordColor;
			var y = h - gridarea.bottom - self.options.record/self.maxvalue * gridheight;
			ctx.beginPath();
			ctx.moveTo(gridarea.left - notchwidth, y);
			ctx.lineTo(w - gridarea.right, y);
			ctx.stroke();
			ctx.textAlign = 'left';
			ctx.textBaseline = 'alphabetic';
			ctx.font = "18px " + self.options.labelFontFamily;
			var fmrecord = formatNumber(self.options.record);
			ctx.fillText(fmrecord, gridarea.left, y - 3);
			var rw = ctx.measureText(fmrecord).width;
			ctx.font = "10px " + self.options.labelFontFamily;
			ctx.fillText(" RECORD", gridarea.left + rw, y - 3);
		}

		// draw bars
		for (var i=0; i<self.data.length; i++) {
			var barheight;
			var x = gridarea.left + i*(barwidth + barspacing*barwidth);

			// goal
			if (self.data[i].goal != undefined) {
				ctx.fillStyle = self.options.goalFillColor;
				barheight = self.data[i].goal / self.maxvalue * gridheight;
				ctx.fillRect(x, (h - gridarea.bottom) - barheight, barwidth, barheight);
			}

			// bar
			if (self.data[i].displayValue != undefined) {
				ctx.fillStyle = self.options.barFillColor;
				barheight = self.data[i].displayValue / self.maxvalue * gridheight;
				ctx.fillRect(x, (h - gridarea.bottom) - barheight, barwidth, barheight);
				if (self.options.barBorderColor && self.options.barBorderColor != "transparent") {
					ctx.beginPath();
					ctx.strokeStyle = self.options.barBorderColor;
					ctx.rect(x, (h - gridarea.bottom) - barheight, barwidth, barheight);
					ctx.stroke();
				}
			}

			// bar label
			if (self.data[i].name != undefined) {
				ctx.fillStyle = self.options.color;
				if (self.options.barLabelPosition == 'bottom') {
					ctx.font = self.options.labelFontSize + "px " + self.options.barFontFamily;
					ctx.textBaseline = "top";
					ctx.textAlign = 'center';

					ctx.fillText(self.data[i].name, x + barwidth/2, h - gridarea.bottom);
				}
				else {
					var fsize = 12;
					if (barwidth < 20)
						fsize = Math.ceil((barwidth+barspacing*barwidth)/2);
					else
						fsize = Math.ceil(barwidth/2);
					if (fsize > 14)
						fsize = 14;
					ctx.font = fsize + "px " + self.options.barFontFamily;
					ctx.textBaseline = "middle";
					ctx.textAlign = 'left';

					ctx.save();
					ctx.translate(x + barwidth/2, (h - gridarea.bottom - barwidth/4));
					ctx.rotate(-Math.PI/2);
					ctx.fillText(self.data[i].name, 0, 0);
					ctx.restore();
				}
			}
		}
	}

	this.fillParent = function() {
		var parent = self.canvasElement.parentNode;

		console.log('fillParent');

		var style = window.getComputedStyle(parent);
		var width = parseInt(style.getPropertyValue("width"));
		var height = parseInt(style.getPropertyValue("height"));

		// upscale this thang if the device pixel ratio is higher than 1
		var pxRatio = window.devicePixelRatio || 1;
		self.canvasElement.width = width * pxRatio;
		self.canvasElement.height = height * pxRatio;
		self.canvasElement.style.width = width + 'px';
		self.canvasElement.style.height = height + 'px';

		//self.render();
		beginRender();
	}

	this.setData = function(data) {
		console.log('setData');
		this.data = data;
		// let's create a variable for each bar so we can track animation
		if (this.data && this.data.length) {
			for (var i=0; i<this.data.length; i++) {
				if (this.options.animation || !this.data[i].value)
					this.data[i].displayValue = 0;
				else
					this.data[i].displayValue = this.data[i].value;
			}
			console.log(this.data);
		}
		this.fillParent();
		//beginRender();
	}

	function beginRender() {
		// reset all bars to start their animation over
		if (self.options.animation) {
			for (var i=0; i<self.data.length; i++) {
				self.data[i].animationFinished = false;
			}
			self.animation.startTime = (new Date()).getTime();
			self.animation.timer = setInterval(animateFrame, 30);
		}
		else
			self.render();
	}

	function animateFrame() {
		var elapsedTime = (new Date()).getTime() - self.animation.startTime;

		for (var i=0; i<self.data.length; i++) {
			var tmp = (elapsedTime / self.animation.duration) * self.maxvalue;
			if (tmp > self.data[i].value) {
				tmp = self.data[i].value;
				self.data[i].animationFinished = true;
			}
			self.data[i].displayValue = tmp;
		}

		// check to see if all bars are done animating
		var all_done = true;
		for (var i=0; i<self.data.length; i++) {
			if (!self.data[i].animationFinished)
				all_done = false;
		}
		if (all_done)
			clearTimeout(self.animation.timer);

		self.render();
	}



	// Set the data as part of the constructor
	if (data)
		this.setData(data);

}
