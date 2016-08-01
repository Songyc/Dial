(function (window, undefined) {
	'use strict';

	var doc = document,
		touchstart = 'touchstart',
	    touchmove = 'touchmove',
	    touchend = 'touchend',
		emtpy = function (){},

		_slice = Array.prototype.slice,
		_hasOwn = Object.prototype.hasOwnProperty,
		_toString = Object.prototype.toString;

	// 创建构造函数Dial
	var Dial = function (options) {
	 	this.config = this._extend({}, Dial.config, options);
	 	this._init();
	}

	Dial.config = {
		initAngle: 0, 					// 转盘开始的角度
		radius: 0, 						// 块元素中心到转盘中心的距离
		block: '',						// 指示块元素的选择器或元素
		target: '', 					// 指示转盘的选择器或元素
		position: 'center bottom', 		// 设置转盘的位置

		usePosition: true,				// 转盘是否用定位
		useBlockPosition: true,			// 块元素是否用定位
		useTransition: true,			// 是否用过渡动画
		useBlockAlwaysUp: true, 		// 块元素是否一直保持向上
		useBlockToAngle: false,			// 块元素是否一直保持与角度相同的方向
		useClick: true, 				// 块元素是否能点击转动
 
		step: 1, 						// 转盘每次转动的单位块角度
		oneStep: false,					// 是否以每次转盘是为单位块角度
		lock: false,					// 是否锁转盘
		autoPlay: false,				// 是否自动旋转

		onSlideStart: null,				
		onSlideMove: null,
		onSlideEnd: null
	}

	Dial.prototype = {
		constructor: Dial,
		uuid: 0,
		handleEvent: function (e) {
			switch(e.type) {
				case touchstart: 
					this._start(e); break;
				case touchmove:
					this._move(e); break;
				case touchend: 
					this._end(e); break;
			}
		},

		_extend: function (target, src) {
			var args = _slice.call(arguments),
				len = args.length,
				deep, applyParam = [target];

			if(len === 1) {
				return target;
			}

			if(typeof (deep = args[len - 1]) === 'boolean') {
				args.pop();
				applyParam[2] = deep;			
			}	

			args.shift();
			len = args.length;

			if(len > 1) {
				for(var i = 0; i < len; i++) {
					applyParam[1] = args[i];
					this._extend.apply(null, applyParam);
				}
			}else {
				for(var key in src) {
					if(_hasOwn.call(src, key)) {
						if(deep === true && _toString.call(src[key]) === '[object Object]') {
							this._extend(target, src[key], true);
						}else {
							target[key] = src[key];
						}
					}
				}
			}
			return target;
		},

		_alwaysUp: function () {
			var b = this.config.block;
			if(!b || !b.length) {
				return;
			}

			for(var i = 0, l = b.length; i < l; i++) {
				this._rotate({translate: true, rotate: -this.angle}, b[i]);
			}
		},

		_init: function (options) {
			var self = this,
				config = this.config,
				el = config.target,
				block = config.block,
				eachAngle;

			if(!this.hasInited) {
				
				if(typeof el === 'string') {
					el = document.querySelector(el);
				}

				if(el.nodeType === 1) {

					config.initAngle %= 360;
					this.target = el; 							
					this.dialInitAngle = (config.initAngle - 90) % 360; 			
					this.angle = config.initAngle || 0;
					this._rotate(config.initAngle);

					if(config.useBlockToAngle) {
						config.useBlockAlwaysUp = false;
					}

					if(config.usePosition) {	
						this._position(el);
					}

					this.center = this._center(el);

					if(typeof block === 'string') {
						try{
							block = document.querySelectorAll(block);
						}catch(e) {}

						if(!block.length) {
							config.step = config.useBlockPosition = config.useBlockAlwaysUp = config.useBlockPosition = false;
						}

						if(block.nodeType === 1) {
							block = [block];
						}

						if(config.useBlockPosition) {
							var width, height, 
								radius = config.radius, 
								ele, x, y, rs = '';

							config.block = block; 						
							// 块角度
							eachAngle = parseFloat(360 / block.length); 	

							for(var i = 0, l = block.length; i < l; i++) {
								ele = block[i];

								width = parseFloat(getComputedStyle(ele, null).width || 0);
								height = parseFloat(getComputedStyle(ele, null).height || 0);

								ele.style.position = 'absolute';
								ele.style.left = '50%';
								ele.style.top = '50%';
								ele.style.marginLeft = '-' + (width / 2) + 'px';
								ele.style.marginTop = '-' + (height / 2) + 'px';

								x = radius * ( Math.sin( eachAngle * i * Math.PI / 180 ));		
								y =  -radius * (Math.cos( eachAngle * i * Math.PI / 180 ));	

								if(config.useBlockToAngle) {
									rs = ' rotate(' + (eachAngle * i) + 'deg)';
								}

								ele.style.transform = 'translate(' + x + 'px, ' + y + 'px)' + rs;
								ele.style.webkitTransform = 'translate(' + x + 'px, ' + y + 'px)' + rs;

								this._data(ele, {"translate": {x: x, y: y}, target: ele});
								
							}

							config.eachAngle = eachAngle;
						}
					}

				}
				this.hasInited = true;
			}

			if(!config.lock) {
				this._bind(touchstart);
			}

			if(config.autoPlay) {
				this.start();
			}
		},

		_position: function (el) {
			var p = this.config.position,
				pi, pos, t;

			pos = {
				left: "0%",
				right: "100%",
				top: '0%',
				bottom: '100%',
				center: '50%'
			};
			// 将位置字符串转成数组
			p = p.trim().split(' ');
			// 如果数组第一个位置为top或者bottom; 或者第一个是center, 第二个是left或者right，要将两个位置调换。比如['top', 'left']，换成['left', 'top']。
			if(/^(t|b)/.test(p[0]) || /^c/.test(p[0]) && /^(l|r)/.test(p[1])) {
				t = p[0];
				p[0] = p[1];
				p[1] = t;
			}

			el.style.left = pos[p[0]];
			el.style.top = pos[p[1]];
			el.style.marginLeft = -(el.clientWidth / 2) + 'px';
			el.style.marginTop = -(el.clientHeight / 2) + 'px';
		},

		_bind: function (type, el, bubble){
			(el || this.target).addEventListener(type, this, !!bubble);
		},

		_unbind: function (type, el, bubble) {
			(el || this.target).removeEventListener(type, this, !!bubble);
		},

		_center: function(el) {
			var gbcr = el.getBoundingClientRect(el);

			return {
				x: gbcr.right - gbcr.width / 2,
				y: gbcr.bottom - gbcr.height / 2
			}
		},

		_data: function (el, name, data) {
			var cache = this.cache,
				id, ec, key;

			if(!cache) {
				this.cache = cache = {};
			}

			id = el.uuid;

			if(id == null) {
				el.uuid = id = this.uuid++;
			}

			ec = cache[id];

			if(!ec) {
				ec = cache[id] = {};
			}

			if(name == null) {
				delete cache[id];
			}

			if(name != null) {

				if(typeof name === 'string') {

					if(data != null) {
						ec[name] = data;	
					}

					return ec[name];
				}
				
				if( _toString.call(name) === '[object Object]' ) {
					return this._extend(ec, name);
				}
			}
		},

		_matrix: (function () {
	        var s, scs, rst = [], key,
	        	rfixe = /e-/g,
	            cf = {
	                translate: function (t) {
	                    if(typeof t === 'number') {
	                        t = { x: t, y: t }
	                    }

	                    t = fixE(t);

	                    return ("translate(" + t.x + "px, " + t.y + "px)");
	                },
	                rotate: function (t) {

	                    return ("rotate(" + fixE(t) + "deg)");
	                },
	                scale: function (t) {

	                    if(typeof t === 'number') {
	                        t = "scale(" + t + ")";
	                    }else if(typeof t === 'object'){

	                        t += "scale(" + t.x + ", " + t.y + ")";
	                    }

	                    return fixE(t);
	                },
	                skew: function (t) {
	                    return ("skew(" + fixE(t) + "deg)");
	                }
	            };

	        function fixE(t) {

			    if(typeof t === 'object') {
			        for(var key in t) {
			            t[key] = fixE(t[key]);
			        }

			        return t;
			    }

			    if(typeof t === 'number') {
			        t += "";
			    }

			    if(rfixe.test(t)) {
			        t = "0";
			    }
			    return t;
			}

	        return function (el, prop) {
	        	rst = [];

	            for(key in prop) {

	            	if(prop[key] === true) {
	            		prop[key] = this._data(el, key) || 0;
	            	}
	            		
	                s = cf[key].call(this, prop[key], el);
	                rst.push(s);
	            }

	            this._data(el, prop);

	            s = rst.join(" ");
	           
	            el.style.transform = s;
	            el.style.webkitTransform = s;
	            
	            if(this.config.useTransition) {
		        	el.style.transition = 'transform .3s ease-in';
		        	el.style.webkitTransition = '-webkit-transform .3s ease-in';
	            }
	        }
	    })(),

		_start: function (e) {
			var point = e.touches[0];

 			e.preventDefault();

 			// 记录开始点击的坐标
			this.startX = point.clientX;
			this.startY = point.clientY;

			// 开始点与转盘中心连线与x轴正方向的夹角
			this.startAngle = this._angle({x: this.startX, y: this.startY}, this.center);

			// 绑定事件
			this._bind(touchmove);
			this._bind(touchend);

			if(this.config.onSlideStart) {
				this.config.onSlideStart.call(this);
			}
		},

		_move: function (e) {
			var point = e.touches[0],
				curAngle, lAngle,
				startAngle = this.startAngle,
				angle = this.angle;

			e.preventDefault();
			
			// 滑动点与转盘中心连线与x轴正方向的夹角
			curAngle = this._angle({x: point.clientX, y: point.clientY}, this.center);
			// 修正变量lAngle。如果是第一次滑动, 上次滑动角度为开始角度
			lAngle = this.lAngel || startAngle;

			// 从第三象限滑动到第二象限。即从180度转到-180度，会出现逆时针旋转一周的bug。修正变量curAngle
			if(curAngle > 0 && (curAngle - lAngle >= 180)) {				
				curAngle -= 360;
			}

			// 从第二象限滑动到第三象限。即从-180度转到180度，会出现顺时针旋转一周的bug。修正变量curAngle
			if(curAngle < 0 && (curAngle - lAngle <= -180)) {			
				curAngle += 360;
			}

			// 计算滑动的角度，滑动角度 = 当前角度 - 开始角度。之前的滑动角度再加上本次的滑动角度。旋转转盘
			this._rotate( (angle += curAngle - lAngle) );

			// 如果c.alwaysUp为true。表示设置了块元素永远向上，调用Dial.prototype._alwaysUp()方法设置角度。
			if(this.config.useBlockAlwaysUp) {
				this._alwaysUp();
			}

			if(this.config.oneStep) {
				this.slideAngle = curAngle - startAngle;
			}else {
				// 记录总滑动角度
				this.angle = angle;
			}

			// 记录当前角度为上一次角度
			this.lAngel = curAngle;

			// 标记滑动状态
			this.move = true;

			if(this.config.onSlideMove) {
				this.config.onSlideMove.call(this);
			}
		},

		_end: function (e) {
			var point = e.touches[0] ? e.touches[0] : e.changedTouches[0],
				config = this.config, cb, l,
				eachAngle = config.eachAngle;

			e.preventDefault();

			this.endX = point.clientX;
			this.endY = point.clientY;

			// 如果支持点击块元素旋转，并且用户没有滑动(模拟点击事件)。
			if(config.useClick && (cb = config.block) && (l = cb.length) && !this.move) {

				for(var i = 0; i < l; i++) {

					// 如果点击某个块元素或者块元素的子孙元素
					if((cb[i] === e.target || cb[i].contains(e.target))) {
						// 点击角度为结束角度，也是开始角度
						var slideAngle = 0,
							endAngle = this.startAngle,
							dialInitAngle = this.dialInitAngle;

						// 如果结束角度小于中心轴角度。要修正结束角度。
						if(endAngle < dialInitAngle) {
							endAngle += 360;
						}

						// 结束角度减去中心轴角度小于180，说明结束点离中心轴较近。要逆时针方向旋转。
						if((endAngle - dialInitAngle ) <= 180) {
							slideAngle -= Math.round((endAngle - dialInitAngle) / eachAngle) * eachAngle;
						}

						// 结束角度减去中心轴角度大于180，说明结束点离中心轴较远。要顺时针方向旋转。
						if((endAngle - dialInitAngle) > 180) {
							slideAngle +=  Math.round((360 - (endAngle - dialInitAngle)) / eachAngle) * eachAngle;
						}

						// 之前滑动角度加上本次滑动角度。调用this._rotate(angle)方法旋转
						this._rotate( (this.angle += slideAngle) );

						if(config.useBlockAlwaysUp) {
							this._alwaysUp();
						}
						// 跳出本次循环
						break;
					}
				}
			}else if(config.step) { 	// 如果 c.step为true。表示转盘要以块角度为单位滑动。		
				var angle = this.angle;

				// 修正变量块角度eachAngle。c.step表示旋转的块数量
				eachAngle *= config.step;

				if(config.oneStep) {
					var slideAngle = this.slideAngle,
						steps;

					steps = Math.round( slideAngle / eachAngle )

					if(steps > 0) {
						slideAngle = eachAngle;
					}else if(steps < 0) {
						slideAngle = -eachAngle;
					}else {
						slideAngle = 0;
					}

					angle += slideAngle;

				}else {
					// 计算滑动块角度。先将滑动角度除以块角度，再四舍五入，最后乘以块角度。
					angle = Math.round( angle / eachAngle ) * eachAngle;
				}

				this._rotate( (this.angle = angle) );

				if(config.useBlockAlwaysUp) {
					this._alwaysUp();
				}
			}

			// 清空上一次滑动角度
			this.lAngel = null;

			// 标记this.move为false，指示转盘不是在滑动状态 						
			this.move = false;

			if(this.config.onSlideEnd) {
				this.config.onSlideEnd.call(this);
			}
		},

		_angle: function (point, center) {
			var dX = point.x - center.x,
				dY = point.y - center.y;
				
			return Math.round(Math.atan2(dY, dX) * 180 / Math.PI);
		},

		lock: function () {
			this.config.lock = true;
			this.destroy();
			this._init();
		}, 

		unLock: function () {
			this.config.lock = false;
			this.destroy();
			this._init();
		},

		destroy: function () {
			this._unbind(touchstart);
			this._unbind(touchmove);
			this._unbind(touchend);
		},

		start: (function () {
			var timer = null;

			return function (stop) {
				var self = this;

				if(stop) {
					clearInterval(timer);
					return;
				}

				function autoPlay() {
					var config = this.config,
						eachAngle = config.eachAngle,
						step = config.step,
						slideAngle = step * eachAngle;

					this._rotate( (this.angle += slideAngle) );

					if(config.useBlockAlwaysUp) {
						this._alwaysUp();
					}
				}

				if(!timer) {
					timer = setInterval(function () {
						autoPlay.call(self);
					}, 1000);
				}
			}
		})(),

		stop: function () {
			this.start(true);
		}
	}	

	"translate rotate scale skew".split(" ").forEach(function (item, i) {
		Dial.prototype["_" + item] = function (prop, el) {
			var obj = {};

			if(prop == null) {
				return;
			}

			el = el || this.target;

			if(typeof prop === 'number') {
				obj[item] = prop;
			}else if(_toString.call(prop) === '[object Object]'){
				this._extend(obj, prop);
			}

			this._matrix.call(this, el, obj);
		}
	});

	window.Dial = Dial;

})(this);