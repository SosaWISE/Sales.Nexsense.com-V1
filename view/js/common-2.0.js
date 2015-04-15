/*
    Version: 1.4
    Change Log:
		-removed deprecated stuff
*/

var isNum = /([0-9]*\.)?[0-9]+/;
var nonDigits = /[^0-9\.]/;
var nonInts = /[^0-9]/;
var ints = /[0-9]/;
var email_regx = /^[a-z0-9_\-\.]+@[a-z0-9_\-\.]+\.[a-z]+$/i;


function makeNumber(inputString, allowBlank, precision) {
    if (allowBlank == null)
        allowBlank = false;
        
    var precisionSelected = true;
    if (precision == null){
        precision = 1;
        precisionSelected = false;
    }
    
    inputString = inputString.replace(nonDigits, "");
    if (!isNum.test(inputString)) {
        var i = inputString.indexOf('.');
        var i2 = inputString.indexOf('.', i + 1);
        inputString = inputString.substring(0, i2);
    }
    if (!allowBlank && inputString == ""){
        if (precision == 0){
            inputString = "0";
        } else {
            inputString = "0.";
            for (i = 0; i < precision; i++){
                inputString += "0";    
            }
        }
    }
    
    if (precisionSelected){
        inputString = (inputString * 1).toFixed(precision);
    }
    
    return inputString;
}

function makeInteger(inputString, allowBlank) {
    if (allowBlank == null)
        allowBlank = false;

    inputString = String(inputString).replace(nonInts, "");
    if (!allowBlank && inputString == "")
        inputString = "0";
    
    return Number(inputString);
}

function padNumber(num) {
    var newName = new String(num);
    var index = newName.indexOf(".");
    if (index == -1)
        newName += ".00";
    else if (index == newName.length - 2)
        newName += "0";
    return newName;
}

function isNumber(str) {
    if (isNum.test(str))
        return true;
    return false;
}

function isInteger(str) {
    if (ints.test(str))
        return true;
    return false;
}

function trim(str) {
    if (str == null || str == undefined || str == "") return "";
    str = str.replace(/^\s*/, '');
    if (str == "") return "";
    return str.replace(/\s*$/, '');
}


Date.prototype.formatTimestamp = function() {
    var yr = this.getFullYear();
    var mo = this.getMonth() + 1;
    if (mo < 10)
        mo = '0' + String(mo);
    var dy = this.getDate();
    if (dy < 10)
        dy = '0' + String(dy);
    var hr = this.getHours();
    if (hr < 10)
        hr = '0' + String(hr);
    var mn = this.getMinutes();
    if (mn < 10)
        mn = '0' + String(mn);
    var sc = this.getSeconds();
    if (sc < 10)
        sc = '0' + String(sc);

    return yr + '-' + mo + '-' + dy + ' ' + hr + ':' + mn + ':' + sc;
}

function formatNumber(num, precision) {
    if (num == 0)
        return '0';
    
    num = makeNumber(String(num), false, precision);
    var str = String(num);

    var pos = str.substring('.');
    var prefix = str;
    var suffix = '';
    if (pos >= 0) {
        prefix = str.substring(0, pos);
        suffix = str.substring(pos+1);
    }

    for (var i=prefix.length-3; i>0; i-=3) {
        prefix = prefix.substring(0, i) + ',' + prefix.substring(i);
        i--;
    }

    return prefix + suffix;
}



var MONTHS = [
    {name:'January', abbr:'Jan'},
    {name:'February', abbr:'Feb'},
    {name:'March', abbr:'Mar'},
    {name:'April', abbr:'Apr'},
    {name:'May', abbr:'May'},
    {name:'June', abbr:'Jun'},
    {name:'July', abbr:'Jul'},
    {name:'August', abbr:'Aug'},
    {name:'September', abbr:'Sep'},
    {name:'October', abbr:'Oct'},
    {name:'November', abbr:'Nov'},
    {name:'December', abbr:'Dec'},
];



function getXY(el) {
    var xy = {x:0,y:0};
    while (el) {
        xy.x += el.offsetLeft;
        xy.y += el.offsetTop;
        el = el.offsetParent;
    }
    return xy;
}


function catchEnter(e, callbackFunc) {
	var evtobj=window.event? event : e //distinguish between IE's explicit event object (window.event) and Firefox's implicit.
	var unicode=evtobj.charCode? evtobj.charCode : evtobj.keyCode

	if (unicode == 13) {
		if (callbackFunc != null)
			callbackFunc();
		return true;
	}

	return false;
}

function debugMessage(str) {
	var outputDiv = document.getElementById('__outputConsole');
	
	if (outputDiv == null) {
		outputDiv = document.createElement("DIV");
		outputDiv.id = "__outputConsole";
		outputDiv.style.backgroundColor = "#ffffff";
		outputDiv.style.borderTop = "2px solid #f08080";
		outputDiv.style.padding = "5px";
		outputDiv.style.position = "fixed";
		outputDiv.style.bottom = "0px";
		outputDiv.style.left = "0px";
		outputDiv.style.right = "0px";
		outputDiv.style.height = "120px";
		outputDiv.style.overflowY = "scroll";
		document.body.appendChild(outputDiv);
	}
	
	outputDiv.appendChild(document.createTextNode(str));
	outputDiv.appendChild(document.createElement("BR"));
}


/***
 * Converts an ArrayBuffer object (gained from a file input) into a base64 string for JSON upload
 * @param {ArrayBuffer} buffer
 * @returns {Base64 String}
 */
function arrayBufferToBase64(buffer) {
    var binary = '';
    var bytes = new Uint8Array(buffer);
    var len = bytes.byteLength;
    for (var i=0; i<len; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary);
}




var WaitIndicators = {
    CircleFlower: 0,
    Flower: 1,
    Bars: 2,
    Circles: 3,
    RoundPetalFlower: 4
};
function WaitIndicatorSpinner(parentHTMLelement, width, height, options) {
    this.parentHTMLelement = parentHTMLelement;
    this.canvasElement = document.createElement("CANVAS");
    this.canvasElement.style.display = "inline-block";
    this.canvasElement.width = width;
    this.canvasElement.height = height;
    this.color = {r:0, g:0, b:0};
    if (options && options.color && options.color.substring(0, 1) == '#') {
        options.color = options.color.substring(1);
        var c = options.color;
        if (options.color.length == 3) {
            var ch1 = options.color.substring(0, 1);
            var ch2 = options.color.substring(1, 2);
            var ch3 = options.color.substring(2, 3);
            c = ch1.concat(ch1).concat(ch2).concat(ch2).concat(ch3).concat(ch3);
        }
        this.color.r = parseInt(c.substring(0, 2), 16);
        this.color.g = parseInt(c.substring(2, 4), 16);
        this.color.b = parseInt(c.substring(4, 6), 16);
    }
    
    var self = this;
    
    var indicatorType = WaitIndicators.CircleFlower;
    if (options && options.type != null)
        indicatorType = options.type;
    var petals = 8;
    if (options && options.petals)
        petals = options.petals;
    var rotationSpeed = Math.PI*2 / 1500; // radians per ms
    if (options && options.rotationSpeed)
        rotationSpeed = options.rotationSpeed;
    var pulseInterval = 100; // ms per pulse
    if (options && options.pulseInterval)
        pulseInterval = options.pulseInterval;
    var sizeDecay = 0.95;
    if (options && options.sizeDecay && options.sizeDecay >= 0 && options.sizeDecay <= 1)
        sizeDecay = options.sizeDecay;
    var alphaDecay = 0.65;
    if (options && options.alphaDecay && options.alphaDecay >= 0 && options.alphaDecay <= 1)
        alphaDecay = options.alphaDecay;
    
    var shortestSide = width < height ? width : height;
    
    var elapsedTime = 0;
    var currentPulse = 0;
    var currentAngle = 0;
    var prevTimestamp = (new Date()).getTime();
    
    function animateFrame() {
        var ms = (new Date()).getTime() - prevTimestamp;
        elapsedTime += ms;
        if (elapsedTime >= pulseInterval) {
            elapsedTime -= pulseInterval;
            currentPulse++;
            if (currentPulse >= petals)
                currentPulse -= petals;
        }
        
        var ctx = self.canvasElement.getContext("2d");
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, width, height);
        
        switch(indicatorType) {
            case WaitIndicators.Flower:
            case WaitIndicators.CircleFlower:
            case WaitIndicators.RoundPetalFlower:
                // rotating indicators
                currentAngle += rotationSpeed * ms;
                if (currentAngle >= Math.PI * 2)
                    currentAngle -= Math.PI * 2;
                ctx.translate(width/2, height/2);
                ctx.rotate(currentAngle);
                break;
            default:
                break;
        }
        
        for (var i=0; i<petals; i++) {
            var r = self.color.r;
            var g = self.color.g;
            var b = self.color.b;
            var a = 1.0 * Math.pow(alphaDecay, i);
            ctx.beginPath();
            ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + a + ")";
            
            switch(indicatorType) {
                case WaitIndicators.Bars:
                    var x = (currentPulse-i)*(width/petals);
                    if (x < 0)
                        x += width;
                    ctx.rect(x, 0, width/petals, height);
                    break;
                case WaitIndicators.Circles:
                    var radius = height/2 < width/petals/2 ? height/2 : width/petals/2;
                    var w = width - 2 * radius;
                    var x = (currentPulse-i)*(w/(petals-1));
                    if (x < 0)
                        x += w*(1+1/(petals-1));
                    ctx.arc(radius+x,height/2,radius*(Math.pow(sizeDecay, i)),0,2*Math.PI);
                    break;
                case WaitIndicators.Flower:
                    ctx.rotate(-Math.PI*2 / petals);
                    ctx.rect(-shortestSide*0.05, -shortestSide*0.24-shortestSide*0.18, shortestSide*0.1, shortestSide*0.32);
                    break;
                case WaitIndicators.RoundPetalFlower:
                    ctx.rotate(-Math.PI*2 / petals);
                    ctx.arc(0, -shortestSide*0.4,shortestSide*0.03, Math.PI, 2*Math.PI);
                    ctx.arc(0, -shortestSide*0.22,shortestSide*0.03, 0, Math.PI);
                    break;
                case WaitIndicators.CircleFlower:
                default:
                    ctx.rotate(-Math.PI*2 / petals);
                    ctx.arc(0,-shortestSide*0.35,shortestSide*0.1*(Math.pow(sizeDecay, i)),0,2*Math.PI);
                    break;
            }
            ctx.fill();
        }
        prevTimestamp = (new Date()).getTime();
    }
    this.animationInterval = setInterval(animateFrame, 40);
    
    this.show = function() {
        this.canvasElement.style.display = "inline-block";
    }
    this.hide = function() {
        this.canvasElement.style.display = "none";
    }
    
    if (this.parentHTMLelement) {
        this.parentHTMLelement.appendChild(this.canvasElement);
        if (options && options.display == false)
            this.hide();
    }
}