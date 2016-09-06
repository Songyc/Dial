(function (window, undefined) {
	'use strict';

	var document = window.document,
		touchstart = 'touchstart',
	    touchmove = 'touchmove',
	    touchend = 'touchend',

		_slice = Array.prototype.slice,
		_hasOwn = Object.prototype.hasOwnProperty,
		_toString = Object.prototype.toString;

	// 构造函数Dial
	var Dial = function (options) {
	 	this.config = this._extend({}, Dial.config, options);
	 	this._init();
	};

	Dial.config = {
		initAngle: 0, 					// 设置转盘开始的角度
		radius: 0, 						// 块元素中心到转盘中心的距离
		block: '',						// 指示块元素的选择器或元素
		target: '', 					// 指示转盘的选择器或元素
		position: 'center bottom', 		// 设置转盘的位置

		usePosition: true,				// 是否用position选项。如果该选项为false，选项position会无效。默认为true。
		useBlockPosition: true,			// 块元素是否用定位
		useTransition: true,			// 是否用过渡动画
		useBlockAlwaysUp: true, 		// 块元素是否一直保持向上
		useBlockToAngle: false,			// 块元素是否一直保持向外
		useClick: true, 				// 点击块元素，转盘是否能旋转
 
		step: 1, 						// 转盘旋转的块单位
		oneStep: false,					// 是否以每次转动只是单位块角度
		lock: false,					// 是否锁转盘
		autoPlay: false,				// 是否自动旋转
		link: false, 					// 是否支持联动。如果有多个转盘时，转动一致

		onSlideStart: null,		 		// 触摸事件开始时执行
		onSlideMove: null,				// 触摸滑动过程中执行
		onSlideEnd: null				// 触摸事件结束后执行
	};

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
		// 合并源对象到目标对象上，支持合并多个源对象。如果最后一个参数为true，则复制最深层的键值对。
		_extend: function (target, src) {
			var args = _slice.call(arguments),
				len = args.length,
				deep, applyParam = [target];

			if(len === 1) {
				return target;
			}
			// 如果最后的参数是布尔值，则从参数数组args中删除。设置为数组applyParam的第三个元素
			if(typeof (deep = args[len - 1]) === 'boolean') {
				args.pop();
				applyParam[2] = deep;			
			}	
			// 参数数组args删除目标对象，此时args中剩下只有源对象(被合并的对象)，获取源对象的个数
			args.shift();
			len = args.length;

			if(len > 1) {		// 如果源对象个数大于1, 遍历args，将源对象设置为数组applyParam的第二个元素，再次调用this._extend(target, src, deep);
				for(var i = 0; i < len; i++) {		 	
					applyParam[1] = args[i];
					this._extend.apply(null, applyParam);
				}
			}else {
				for(var key in src) { 			// 遍历源对象src, 检测它的自定义属性key。如果deep为true，表示支持拷贝对象最底层的属性值，并且key值为对象，调用this._extend(target, src, deep)方法。否则将源对象属性/值深度拷贝到目标对象上。
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
		// 与选项useBlockAlwaysUp对应的方法。设置所有块元素旋转角度与转盘旋转角度相反，并记录当前块元素的旋转角度。
		_alwaysUp: function (useTransition) {
			if(!this.config.useBlockAlwaysUp) {
				return;	
			}

			var b = this.config.block;
			if(!b || !b.length) {
				return;
			}
			// 遍历块元素，调用this._transform(prop, el)设置每个块元素。translate为true，表示要加上之前设置的translate属性
			for(var i = 0, l = b.length; i < l; i++) {
				this._transform(b[i], {translate: true, rotate: -this.angle}, useTransition);
				this._data(b[i], {rotate: -this.angle});
			}
		},
		// 初始化方法。修正选项，保存属性，设置转盘、所有块元素位置。
		_init: function () {
			var config = this.config,
				el = config.target,
				block = config.block,
				eachAngle;
			// 如果没初始化，则初始化
			if(!this.hasInited) {
				// 支持参数target为字符串或者元素
				if(typeof el === 'string') {
					el = document.querySelector(el);
				}
 				// 如果el是元素
				if(el.nodeType === 1) {

					config.initAngle %= 360; 				// 防止用户设置初始角度过大，取余值
					this.target = el; 						// 设置this.target属性值为el
					this.dialInitAngle = (config.initAngle - 90) % 360; 		// 修正转盘初始角度。为0时与x轴正方向同向，转盘初始角度应与x轴正方向垂直。
					this.angle = config.initAngle || 0;		// 设置滑动角度，默认值为0
					this._rotate(config.initAngle);			// 按照初始角度旋转转盘
					this.activeIndex = 0;					// 设置中心轴上的块元素的下标，初始值为0。

					if(config.useBlockToAngle) { 			// 如果选项useBlockToAngle为true, 说明支持块元素与角度方向一致, 则不支持块元素总是向上，修正选项useBlockAlwaysUp为false。
						config.useBlockAlwaysUp = false;	
					}

					if(config.usePosition) {				// 如果选项usePosition为true，表示支持转盘自动定位。
						this._position(el); 				// 调用this._position(el)方法自动定位
					}

					this.center = this._center(el);			// 记录转盘中心位置

					if(typeof block === 'string') { 		// 如果选项block为字符串
						try{ 								// 尝试获取表达式为block的所有元素。如果block为空字符串，则会抛出异常。所以要用try,catch"吸收"异常。
							block = document.querySelectorAll(block);
						}catch(e) {}

						if(!block.length) {					// 如果获取不到块元素，说明没有块元素。与块元素有关的选项会无效。包括每次旋转的块单位，定位块元素，块元素总是向上，块元素与转盘滑动角度一致。
							config.step = config.useBlockPosition = config.useBlockAlwaysUp = config.useBlockToAngle = false;
						}

						if(block.nodeType === 1) { 			// 修正为数组
							block = [block];
						}

						if(block.length) {		
							var width, height,
								radius = config.radius,
								ele, x, y, left, top, marginLeft, marginTop, 
								rotate;

							config.block = block; 						
							// 块角度
							eachAngle = parseFloat(360 / block.length); 	

							for(var i = 0, l = block.length; i < l; i++) {
								ele = block[i];

								width = parseFloat(window.getComputedStyle(ele, null).width || 0);
								height = parseFloat(window.getComputedStyle(ele, null).height || 0);

								if(config.useBlockToAngle) {
									rotate = eachAngle * i;
								}else if(config.useBlockAlwaysUp) {
									rotate = -this.angle;
								}

								// 如果支持块元素定位，则遍历所有块元素，设置top, left, margin和transform属性。设置transform属性前，先将角度转成弧度。再用半径乘以三角函数。
								if(config.useBlockPosition) {
									ele.style.position = 'absolute';
									ele.style.left = '50%';
									ele.style.top = '50%';
									ele.style.marginLeft = '-' + (width / 2) + 'px';
									ele.style.marginTop = '-' + (height / 2) + 'px';
								
									x = radius * ( Math.sin( eachAngle * i * Math.PI / 180 ));		
									y =  -radius * (Math.cos( eachAngle * i * Math.PI / 180 ));

									// 调用._transform(ele, prop, useTransition)方法旋转块元素，第三个参数为false表示不使用过渡动画。
									this._transform(ele, {translate: {x: x, y: y}, rotate: rotate}, false);

									// 存储初始块元素位置属性
									this._data(ele, {translate: {x: x, y: y}, rotate: rotate, target: ele});
								}else {
									// 自定义块元素位置
									this._transform(ele, {translate: {x: 0, y: 0}, rotate: rotate}, false);
									this._data(ele, {translate: {x: 0, y: 0}, rotate: rotate, target: ele});
								}						
							}

							config.eachAngle = eachAngle;
						}
					}
				}
				this.hasInited = true;

				if(!Dial.list) {
					Dial.list = [];
				}

				Dial.list.push(this);
			}
			// 如果选项lock为false，表示不锁屏，则绑定触屏事件
			if(!config.lock) {
				this._bind(touchstart);
			}
			// 如果支持自动旋转，调用this.start()自动旋转。
			if(config.autoPlay) {
				this.start();
			}
		},
		// ._position(el)方法设置转盘的位置
		_position: function (el) {
			var p = this.config.position,
				pos, t;

			pos = {
				left: '0%',
				right: '100%',
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
		// ._center(el)获取元素el的中心坐标
		_center: function(el) {
			var gbcr = el.getBoundingClientRect(el);

			return {
				x: gbcr.right - gbcr.width / 2,
				y: gbcr.bottom - gbcr.height / 2
			};
		},
		//  ._data(el, name, data)方法用于缓存数据。支持._data(el, name, data)或者._data(el, obj)。如果第二个参数是对象，则将它合并到数据缓存对象中。
		_data: function (el, name, data) {
			var cache = this.cache,
				id, ec;

			if(!cache) {
				this.cache = cache = {};
			}

			id = el.uuid;

			if(id === undefined) {
				el.uuid = id = this.uuid++;
			}

			ec = cache[id];

			if(!ec) {
				ec = cache[id] = {};
			}

			if(name === undefined) {
				delete cache[id];
			}

			if(name !== undefined) {

				if(typeof name === 'string') {

					if(data !== undefined) {
						ec[name] = data;	
					}

					return ec[name];
				}
				
				if( _toString.call(name) === '[object Object]' ) {
					return this._extend(ec, name);
				}
			}
		},
		// ._slide(fn)方法。先执行当前转盘的函数，再执行其它联动转盘的函数。
		_slide: function (fn) {
			fn.call(this);
			this._link(fn);
		},
		// ._line(fn)方法用于执行其它联动转盘的函数
		_link: function (fn) {
			// 联动其它转盘。获取转盘列表。
			var list = Dial.list; 		
			if(list.length) {
				for(var i = 0, l = list.length; i < l; i++) {
					var dial = list[i];
					if(dial.config.link && this !== dial) {
						fn.call(dial);
					}
				}
			}
		},
		// ._transform(el, prop, useTransition)方法设置元素el的transform属性，prop为动画对象集。会先将prop对象的动画键值对转成字串符，拼接后再设置transform属性。
		_transform: (function () {
	        var s, rst, key,
	        	rfixe = /e-/g, cf;

        	function fixE(t) { 			
			    if(typeof t === 'object') { 		// 如果参数t为对象，遍历t, 再次调用fixE(t), 每个属性值为参数。
			        for(var key in t) {
			        	if(t.hasOwnProperty(key)) {
			            	t[key] = fixE(t[key]);
			        	}
			        }

			        return t;
			    }

			    if(typeof t === 'number') { 		// 如果参数t为数字，转成字符串
			        t += '';
			    }

			    if(rfixe.test(t)) {					// 如果参数t有'e-'，转成'0'
			        t = '0';
			    }
			    return t;
			}

        	// 自定义方法集cf, 有四个方法translate, rotate, scale, skew, 分别将传入的参数转成字符串，最后返回。转换前先调用fixE(t)函数检测字符是否有"e-", 表示小数点后十几位。如果有，直接设置为0。
            cf = {
                translate: function (t) {
                    if(typeof t === 'number') {
                        t = { x: t, y: t };
                    }

                    t = fixE(t);

                    return ('translate(' + t.x + 'px, ' + t.y + 'px)');
                },
                scale: function (t) {

                    if(typeof t === 'number') {
                        t = 'scale(' + t + ')';
                    }else if(typeof t === 'object'){

                        t += 'scale(' + t.x + ', ' + t.y + ')';
                    }

                    return fixE(t);

                }
            };

            'skew rotate'.split(' ').forEach(function (item) {
            	cf[item] = function (t) {
            		return ( item + '(' + fixE(t) + 'deg)' );
            	};
            });

	        return function (el, prop, useTransition) {
	        	rst = []; 							// 先清空结果集

	            for(key in prop) { 					// 遍历参数prop属性对象
	            	if(prop.hasOwnProperty(key)) {
		            	if(prop[key] === true) { 		// 如果属性值为true, 说明要加上之前设置的属性。调用this._data(el, key)方法获取key对应的缓存，默认为0。因为transform属性是个混合属性，可能之前已经设置了。如果要加上后续属性，先将之前设置的属性提取出来。
		            		prop[key] = this._data(el, key) || 0;
		            	}
		            		
		                s = cf[key].call(this, prop[key], el); 	// 将属性值转成字符串，并且放入结果集。
		                rst.push(s);
	            	}
	            }

	            this._data(el, prop);				// 缓存属性对象

	            s = rst.join(' ');					// 将结果集转成字符串
	           
	            el.style.transform = s; 			// 设置transform属性
	            el.style.webkitTransform = s;
	            
	            if(this.config.useTransition && useTransition !== false) { 		// 如果支持用过渡动画, 设置transition属性
		        	el.style.transition = 'transform .3s ease-in'; 
		        	el.style.webkitTransition = '-webkit-transform .3s ease-in';
	            }
	        };
	    })(),
	    // ._start(e)方法记录开始点击坐标，获取开始夹角，绑定事件和触发开始滑动回调函数。
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
		// ._move(e)方法获取并修正滑动点夹角，调用._slide(fn)方法旋转当前转盘和联动的转盘，最后记录属性和触发滑动过程回调函数。
		_move: function (e) {
			var point = e.touches[0],
				curAngle, lAngle,
				startAngle = this.startAngle,
				angle;

			e.preventDefault();
			
			// 滑动点与转盘中心连线与x轴正方向的夹角
			curAngle = this._angle({x: point.clientX, y: point.clientY}, this.center);
			// 修正变量lAngle。如果是第一次滑动, 上次滑动角度为开始角度
			lAngle = this.lAngle || startAngle;

			// 从第三象限滑动到第二象限。即从180度转到-180度，会出现逆时针旋转一周的bug。修正变量curAngle
			if(curAngle > 0 && (curAngle - lAngle >= 180)) {				
				curAngle -= 360;
			}

			// 从第二象限滑动到第三象限。即从-180度转到180度，会出现顺时针旋转一周的bug。修正变量curAngle
			if(curAngle < 0 && (curAngle - lAngle <= -180)) {			
				curAngle += 360;
			}

			this._slide(function () {
				angle = this.angle;

				this._rotate(angle += curAngle - lAngle); 	// 调用dial._rotate(angle)旋转转盘
				if(!this.config.oneStep) {					// 存储angle
					this.angle = angle;
				}
				this._alwaysUp();							// 调用dial._alwaysUp()设置块元素旋转角度
			});
			
			// 记录本次滑动角度
			this.slideAngle = curAngle - startAngle;

			// 记录移动滑动角度
			this.slideMoveAngle = curAngle - lAngle;

			// 记录当前角度为上一次角度
			this.lAngle = curAngle;

			// 标记滑动状态
			this.move = true;
			// 如果有滑动过种中回调函数，则执行。第一个参数为this，表示this为onSlideMove函数的上下文对象。
			if(this.config.onSlideMove) {
				this.config.onSlideMove.call(this);
			}
		},
		// ._end(e)方法处理模拟点击块元素或者触摸滑动转盘的情况，最后记录属性和触发滑动结束回调函数。
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

						this.slideAngle = slideAngle;

						this._slide(function () {
							this._rotate(this.angle += slideAngle);
							this._alwaysUp();
							this._activeIndex();
						});
						break;
					}
				}
			}else if(config.step) { 						// 如果 c.step为true。表示转盘要以块角度为单位滑动。		
				var self = this;
				this._slide(function () {
					this._step(self.slideAngle); 			// 调用._step(dial, slideAngle)计算滑动角度，旋转转盘和块元素
					this._activeIndex();
				});
			}

			if(this.config.onSlideEnd) {
				this.config.onSlideEnd.call(this);
			}
				
			this.lAngle = null;			// 清空上一次滑动角度
			this.move = false;			// 标记this.move为false，指示转盘不是在滑动状态
			this.slideAngle = 0;
			this.slideMoveAngle = 0;
		},

		_step: function (slideAngle) {
			var angle = this.angle,
				config = this.config,
				eachAngle = config.eachAngle;

			// 修正变量块角度eachAngle。c.step表示旋转的块数量
			eachAngle *= this.config.step;

			// 如果每次转动是单位块角度
			if(config.oneStep) {
				// 先用本次滑动的角度计算滑动的块次数
				var	steps = Math.round( slideAngle / eachAngle );

				// 如果滑动块次数为1或者大于1，滑动的角度可能超出块角度，要将滑动角度修正为块角度，表示每次最多只能滑动1单位块角度。如果滑动块次数小于0，滑动的角度可能超出块角度，要将滑动角度修正为块角度，表示每次最多只能滑动-1单位块角度。如果steps为0，表示不需要滑动。设置滑动角度为0。
				if(steps > 0) {
					slideAngle = eachAngle; 
				}else if(steps < 0) {
					slideAngle = -eachAngle;
				}else {
					slideAngle = 0;
				}

				// 之前的滑动角度加上本次的滑动角度
				angle += slideAngle;

			}else {
				// 计算滑动块角度。先将滑动角度除以块角度，再四舍五入，最后乘以块角度。
				angle = this.dialInitAngle + Math.round( (angle - this.dialInitAngle) / eachAngle ) * eachAngle;
			}
			// 旋转转盘
			this._rotate(this.angle = angle);
			// 旋转块元素
			this._alwaysUp();
		},

		_angle: function (point, center) {
			var dX = point.x - center.x,
				dY = point.y - center.y;
				
			return Math.round(Math.atan2(dY, dX) * 180 / Math.PI);
		},

		_activeIndex: function () {
			var eachAngle = this.config.eachAngle,
				totalSlideAngle = this.angle - this.config.initAngle;

			// 如果块角度存在，表示支持点击块元素旋转。计算中心轴块元素的下标。当滑动角度大于0，说明是顺时针方向旋转。计算公式为(360 - 滑动角度取余) / 单位块角度。否则用滑动角度取余再除以单位块角度，逆时针方向为负数，加上负号转成正数。
			if(eachAngle) {
				this.activeIndex = totalSlideAngle > 0 ? (360 - totalSlideAngle % 360) / eachAngle : -(totalSlideAngle % 360) / eachAngle;
			}
		},

		slideTo: function (index) {
			var config = this.config,
				eachAngle = config.eachAngle,
				step = config.step,
				activeIndex = this.activeIndex,
				slideAngle = step * eachAngle;

			if(index === activeIndex) {
				return;
			}

			if(index < activeIndex) {
				slideAngle = (index - (activeIndex - config.block.length)) * slideAngle;
			}else {
				slideAngle = (index - activeIndex) * slideAngle;
			}

			if(slideAngle <= 180) {
				slideAngle = -slideAngle;
			}else{
				slideAngle = 360 - slideAngle;
			}
			this._slide(function () {
				this._rotate(this.angle += slideAngle);
				this._alwaysUp();
				this._activeIndex();
			});
		},

		_unBindEvents: function () {
			this._unbind(touchstart);
			this._unbind(touchmove);
			this._unbind(touchend);
		},

		lock: function () {
			this._unBindEvents();
			this.config.lock = true;
			this._init();
		},

		unLock: function () {
			this._unBindEvents();
			this.config.lock = false;
			this._init();
		},

		destroy: function () {
			this._unBindEvents();
			Dial.list.splice(this, 1);
		},

		start: function (time, reverse) {
			var config = this.config,
				eachAngle = config.eachAngle,
				step = config.step,
				slideAngle = step * eachAngle;

			if(typeof time === 'boolean') {
				reverse = time;
				time = undefined;
			}

			function start(dial) {
				dial.timer = window.setInterval(function () {
					dial._rotate( (dial.angle += reverse ? slideAngle : -slideAngle) );
					dial._alwaysUp();
				}, time || 1000);
			}
			
			this.stop();

			start(this);

			this._link(function () {
				start(this);
			});
		},

		stop: function () {
			this._slide(function () {
				if(this.timer) {
					clearInterval(this.timer);
					this.timer = null;
				}
			});
		},

		slideMove: function (slideAngle) {
			var config = this.config,
				angle = this.angle;

			this._slide(function () {
				if(config.oneStep) {
					this._step(slideAngle);
					this._activeIndex();
				}else {
					this._rotate( angle += slideAngle );
					this.angle = angle;
					this._alwaysUp();
				}
			});
		},

		getIndex: function () {
			return this.activeIndex;
		}
	};

	// 公共方法Dial.prototype._translate, Dial.prototype._rotate, Dial.prototype._scale, Dial.prototype._skew。底层调用Dial.prototype.matrix统一处理。
	'translate rotate scale skew'.split(' ').forEach(function (item) {
		Dial.prototype['_' + item] = function (prop, el, useTransition) {
			var obj = {};
			
			if(prop === undefined) { 									// 如果未传入参数prop，直接返回。
				return;
			}
			
			el = el || this.target; 									// 修正参数el, 默认为this.target转盘元素
			
			if(typeof prop === 'number') {								// 如果参数prop为数字，存储在obj中，设置为obj属性item。
				obj[item] = prop; 					
			}else if(_toString.call(prop) === '[object Object]'){ 		// 如果参数prop是对象
				this._extend(obj, prop); 								// 调用this._extend(target, src)方法将参数prop合并到obj对象中
			}

			this._transform(el, obj, useTransition); 					// 调用this._transform(el, prop)统一处理。
		};
	});

	// 公共方法Dial.prototype.next, Dial.prototype.prev
	'next prev'.split(' ').forEach(function (item) {
		Dial.prototype[item] = function () {
			var config = this.config,
				eachAngle = config.eachAngle,
				step = config.step,
				slideAngle = step * eachAngle;

			if(item === 'prev') {
				this.angle += slideAngle;
			}else {
				this.angle -= slideAngle;
			}

			this._rotate(this.angle);

			if(config.useBlockAlwaysUp) {
				this._alwaysUp();
			}

			this._activeIndex();
		};
	});

	if (typeof module === 'object' && module && typeof module.exports === 'object') {
        module.exports = Dial;
    } else {

        window.Dial = Dial;

        if (typeof define === 'function' && define.amd) {
            define('dial', [], function() {
                return Dial;
            });
        }
    }
    
})(this);