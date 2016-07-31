(function (window, u) {
	'use strict';

	var	doc = window.document,
		docEle = doc.documentElement,
		isTouchStart = 'ontouchstart' in window,
	    touchStart = isTouchStart ? 'touchstart' : 'mousedown',
	    touchMove = isTouchStart ? 'touchmove' : 'mousemove',
	    touchEnd = isTouchStart ? 'touchend' : 'mouseup',
	    emptyFn = function () {},
	    fn = {}, extendFn = true;

	var oToString = Object.prototype.toString,
		oHasOwn = Object.prototype.hasOwnProperty;

	// 默认设置参数
	var defaultOptions = {
		origin: "50% 50%", 							// 旋转中心
		transition: "",								// 旋转的过渡动画
		onSlideEnd: emptyFn, 						// 回调函数，默认值为空
		onSlideMove: emptyFn,						// 滑动时回调函数，默认值为空
		isLock: false, 								// 是否锁屏
		autoPlay: false, 							// 是否自动播放
		click: false,								// 是否滑动整块角度
		clickClass: null,							// 点击块元素的类名
		oneStep: false, 							// 每次滑动一块
		curBlockChange: false, 						// 转盘滑动后的块元素的角度是否朝上
		radius: 100,								// 设置块元素中心到转盘中心的距离
		consistentAngle: false,						// 设置块元素是否与初始化的角度同向, 此参数为true时，curBlockChange为false
		position: null,								// 设置转盘位置
		isInterface: false 							// 是否对外提供所有的方法
	};

	//private function 
	fn.extend = function (defaults, opt, extra) { 	// 方法extend将参数defaults和参数opt合并，并且支持多个参数合并。如果最后一个参数为布尔true，支持深度拷贝。参数defaults为默认对象, 参数opt是被合并对象。
		var args = Array.prototype.slice.call(arguments), k,
			argsL = args.length,
			deep = args[argsL - 1], 						// 获取最后一个参数, 赋值给deep
			isObject = oToString.call(deep) === '[object Object]',  		// 判断deep是不是对象
			opts, optsL;
		if(!opt)  return defaults;							// 如果参数opt不存在, 返回参数defaults 				
		optsL = isObject ? argsL - 1 : argsL - 2;			// 如果deep为布尔, 则参数opts的个数为argsL - 2; 否则为argsL - 1。
		if(optsL > 1) { 									// 2个或者2个以上
			for(var i = 1; i <= optsL; i++) { 				// 不算参数defaults，从第二个参数开始计算起。
				fn.extend(defaults, args[i], isObject ? undefined : deep);		// 调用extend(defaults, opt, deep)方法;
			}
		}else {
			for(k in opt) { 									// 遍历参数opt
				if(oHasOwn.call(opt, k)) {			
					if(deep === true && oToString.call(opt[k]) === '[object Object]') { 				// 如果是支持深度拷贝，并且参数opt的键值指向的是对象
						fn.extend(defaults, opt[k], true); 		// 再次调用extend(defaults, opt, deep)方法;
					}else {
						defaults[k] = opt[k];					// 深拷贝属性
					}	
				}
			}
		}
		return defaults; 				
	}

	fn.extend(fn, {
		isTouchStart: isTouchStart, 							// 是否手机的触屏
		each: function (obj, fn, context) {						// fn.each(obj, fn, context)方法遍历数组和对象。参数obj是数组或者对象, 参数fn是每个元素的回调, 参数context是指定的上下文对象，默认为obj。
			if(oToString.call(obj) === '[object Array]') { 		
				var i = 0, l = obj.length;
				for( ;i < l; i++) {
					if(fn.call(context || obj, obj[i], i, obj) === false){
						break;
					}
				}
			}else if(oToString.call(obj) === '[object Object]'){
				var i;
				for(i in obj) {
					if(obj.hasOwnProperty && obj.hasOwnProperty(i)) {
						if(fn.call(context || obj, obj[i], i, obj) === false) {
							break;
						}
					}
				}
			}
		},
		makeArray: function (obj) {								// fn.makeArray(obj)方法将对象包装成数组，再返回数组。
			var ret = [];
			if(Type.isArray(obj)) { 	 						// 数组就直接返回数组	
				return obj;
			}else if(!Type.isArray(obj) && obj.length || obj.item || Type.isObject(obj)){ 		// 不是数组并且有长度，或者NodeList和HTMLCollection实例，也是类数组对象。
				for(var i = 0, l = obj.length; i < l; i++) {
					ret.push(obj[i]);
				}
			}else { 											// 只有一个非数组对象
				ret[0] = obj;
			}
			return ret;
		},
		hasOwn: function (obj, key) { 							// fn.hasOwn(obj, key)方法判断参数key是不是对象obj的自定义属性。
			return obj && oHasOwn.call(obj, key);
		},
		stringToNumber: function (str) { 						// fn.stringToNumber(str)方法将字符串数字转成正整数
			var rstrtonum = /(\d+)/g;
			return +rstrtonum.exec(str)[1];
		},
		isEmptyObject: function (obj) { 						// fn.isEmptyObject(obj)方法判断参数obj是否空对象
			if(!Type.isObject(obj)) {
				return false;
			}
			var i;
			for(i in obj) {
				return false;
			}
			return true;
		},
		contains: function (parent, child) { 					// fn.contains(parent, child)方法判断参数child是否参数parent的子元素
			return parent.contains && parent.contains(child);
		},
		repeat: function (str, repeat) {						// fn.repeat(str, repeat)方法将字符串str复制repeat次，拼接返回str。
			var originalStr = str;
			for(var i = 1; i < repeat; i++) {
				str += originalStr;
			}
			return str;
		},
		parent: function (el) {									// fn.parent(el)方法返回参数el的父元素
			if(el.parentNode.nodeType === 1 && el.parentNode.nodeType !== 11) {
				return el.parentNode;
			}
		}
	});

	// 类型判断
	var Type = {},
		aTypeString = 'Boolean Number String Function Array Date RegExp Object'.split(' ');

	fn.each(aTypeString, function (name, i){
		Type["is" + name] = function (obj) {
			if(oToString.call(obj) === '[object ' + name + ']') {
				return true;
			}
			return false;
		}
	});

	fn.extend(fn, {Type: Type});			

	// 前缀对象
	var Prefix = {},
		aPrefixString = 'webkit o moz ms'.split(" "),		
		ablePrefixPro = "transform transform-origin".split(" ");
	fn.each(aPrefixString, function (name, i) {
		Prefix[name] = "-" + name + "-";
	});

	var setCss = {},
		mapPosition = {
			"left top": {"left": "0%", "top": "0%"},
			"top left": {"left": "0%", "top": "0%"},
			"left center": {"left": "0%", "top": "50%"},
			"center left": {"left": "0%", "top": "50%"},
			"left bottom": {"left": "0%", "top": "100%"},
			"bottom left": {"left": "0%", "top": "100%"},
			"center top": {"left": "50%", "top": "0%"},
			"top center": {"left": "50%", "top": "0%"},
			"center center": {"left": "50%", "top": "50%"},
			"center bottom": {"left": "50%", "top": "100%"},
			"bottom center": {"left": "50%", "top": "100%"},
			"right top": {"left": "100%", "top": "0%"},
			"top right": {"left": "100%", "top": "0%"},
			"right center": {"left": "100%", "top": "50%"},
			"center right": {"left": "100%", "top": "50%"},
			"right bottom": {"left": "100%", "top": "100%"},
			"bottom right": {"left": "100%", "top": "100%"}
		};
	fn.extend(setCss, {
		setPrefix: function (objStyle, prefix) { 				// setCss.setPrefix(objStyle, prefix)方法用来为参数objStyle来添加prefix数组里的前缀，并返回新的objStyle对象。例如{ "transform": "translate(10px, 10px)" } 会返回 {"transform": "translate(10px, 10px)", "-webkit-transform": "translate(10px, 10px"}
			if(fn.isArray(prefix) && prefix.length) {
				fn.each(prefix, function (item, i, prefix) {
					setCss.setPrefix(objStyle, item);
				});
			}
			if(!prefix || fn.isString(prefix) && !fn[prefix]) { // 如果参数prefix不存在，或者数组的长度为0，或者查找到fn.prefix这个值，直接返回参数objStyle
				return;
			}
			fn.each(objStyle, function (value, key, objStyle) {
				if(~ablePrefixPro.indexOf(key)) { 				// 如果含有可以增加前缀的属性，则增加。
					objStyle[fn[prefix] + key] = value;
				}
			});
			return objStyle;
		},
		setStyle: function (elems, objStyle, prefix) {			// setCss.setStyle(elems, objStyle, prefix)方法为参数elems的每个元素设置参数objStyle里的每个属性，如果参数prefix有值，则会添加前缀属性。
			fn.each(fn.makeArray(elems), function (name, i, elems) {
				fn.each(prefix ? setCss.setPrefix(objStyle, prefix) : objStyle, function (value, key, objStyle) {
					if(fn.hasOwn(objStyle, key)) {
						name.style.cssText += key + ":" + objStyle[key] + ";";
					}
				});
			});
		},
		debugRadius: function (num) {								
			if(num) { 											// setCss.debugRadius(num)方法处理获取的transform属性的bug。可能是计算的误差问题，获取含有e-的值直接归0。
                if( (num + "").indexOf("e-") > 1) { 				
                    num = 0;
                }else{
                    num = +num; 								// 否则直接转成整数
                }
            }
            return num;
		},
		setClickBlockPos: function (prefix) {					// setCss.setClickBlockPos(prefix)方法用来定位所有块元素的位置
			var data = Cache.data(this, 'dataObj'),
				elems = data.clickBlock,
				radius = data.radius;
			
			fn.each(fn.makeArray(elems), function (el, index, elems) {
				// 设置所有块元素到转盘中心
				var width, height;
					width = fn.stringToNumber(getCss.getComputedStyle(el, 'width'));
					height = fn.stringToNumber(getCss.getComputedStyle(el, 'height'));
					
				if(index === 0) {
					el.className += " cur";
				}

				setCss.setStyle(el, {
					"position":"absolute",
					"left": "50%",
					"top": "50%",
					"margin-left": "-" + (width / 2) + "px",
					"margin-top": "-" + (height / 2) + "px"
				}, prefix);

				// 设置所有块元素到圆边上
				var x, y, totalAngle = 0;

				totalAngle = data.eachRotateAngle * index + 90 + data.initAngle; 		// 计算块元素旋转角度
				x = radius * ( Math.sin( Matrix.angleToRadian(totalAngle) ));		
				y =  -radius * (Math.cos( Matrix.angleToRadian(totalAngle) ));		
				
	            x = setCss.debugRadius(x);
	            y = setCss.debugRadius(y);
	            
	            setCss.setStyle(el, { 								
	            	"transform": 'translate(' + x + 'px, ' + y + 'px)' 		
	            }, aPrefixString);

	            if(data.consistentAngle) { 												// 如果data.consistentAngle属性为true, 则设置块元素的角度与旋转角度一致
	 				setCss.setStyle(el, 
						Matrix.getMatrix(el, totalAngle), 
					aPrefixString);
	            }
			});
		},
		setPosition: function (el, pos) { 												// setCss.setPosition(el, pos)方法设置转盘的位置
			var parentNode = fn.parent(el),
				parPos = getCss.getComputedStyle(parentNode, "position");
			if(parPos === "static") {													// 设置父元素为position属性为relative
				setCss.setStyle(parentNode, {"position": "relative"});
			}

			var width, height,
				posObj = {};
			width = fn.stringToNumber(getCss.getComputedStyle(el, 'width'));
			height = fn.stringToNumber(getCss.getComputedStyle(el, 'height'));
			posObj = mapPosition[pos];

			if(posObj) {
				setCss.setStyle(el, fn.extend(posObj, {
					"margin-left": "-" + width / 2 + "px",
					"margin-top": "-" + height / 2 + "px"
				}));
			}
		}
	});
	
	var getCss = {};

	fn.extend(getCss, {
		getClientPos: isTouchStart ? function (e) {					// getCss.getClientPos(e)方法返回当前鼠标/手指的坐标。
			return {
				x: e.touches[0].clientX,
				y: e.touches[0].clientY
			}
		} : function (e) {
			return {
				x: e.clientX,
				y: e.clientY
			}
		},
		getCenterPos: function (el) { 								// getCss.getCenterPos(el)方法返回参数el的中心坐标
			var elPropObj = getCss.getBoundingClientRect(el);
			return {
				x: elPropObj.right - elPropObj.width / 2,
				y: elPropObj.bottom - elPropObj.height / 2
			}
		},
		getBoundingClientRect: function (el) { 						// getCss.getBoundingClientRect(el)方法返回一个对象，该对象包含参数el左边距,上边距,右边到左视窗, 下边到上视窗, 宽度, 高度。
			var left = docEle.clientLeft,
				top = docEle.clientTop,
				rect = el.getBoundingClientRect();
			return {
				left: rect.left - left,
				top: rect.top - top,
				right: rect.right - left,
				bottom: rect.bottom - top,
				width: rect.right - rect.left,
				height: rect.bottom - rect.top
			}
		},
		getAngleAndLen: function (obj, center) { 					// getCss.getAngleAndLen(obj, center)方法返回参数obj与参数center两个坐标点之间的角度和长度
			var disX = obj.x - center.x,
				disY = obj.y - center.y;

			return {
				angle: Math.round(Math.atan2(disY, disX) * 180 / Math.PI),
				length: Math.ceil(Math.sqrt(disX * disX + disY * disY))
			}
		},	
		getComputedStyle: function (obj, prop) {					// getCss.getComputedStyle(obj, prop)方法返回参数obj的prop属性值，获取不了返回0。
			return window.getComputedStyle(obj, null)[prop] || 0;
		},
		getRelativeAngle: function (curAngle, startAngle) {			// getCss.getRelativeAngle(curAngle, startAngle)方法返回参数当前角度curAngle与开始角度startAngle的相对整块角度。
			var data = Cache.data(this, 'dataObj'),
				relativeAngle = curAngle - startAngle,
				eachRotateAngle = data.eachRotateAngle,
				relativeNumber = Math.round(relativeAngle / eachRotateAngle); 			// 四舍五入计算转动的块数
			return relativeNumber * eachRotateAngle; 									// 返回转动的相对角度
		},	
		getBlockIndex: function (angle) {							// getCss.getBlockIndex(angle)方法返回当前块元素的下标 
			var copy = angle, 
				data = Cache.data(this, 'dataObj'),
				blockNumber = data.blockNumber,					
				wAngle, eachRotateAngle = data.eachRotateAngle;				 		
			wAngle = copy % 360;  														// 求余角
			if(wAngle == 0) {															// 余角为0, 说明转动了整圈数
				return 0;
			}
			if(wAngle < 0) {
				wAngle += 360; 															// 余角必须为正数 	
			}
			return blockNumber - Math.ceil(wAngle / eachRotateAngle);					
		}
	})

	fn.extend(fn, {Prefix: Prefix, setCss: setCss, getCss: getCss}); 	

	// 缓存系统
	var Cache = {};

	fn.extend(Cache, {
		uuid: 0,
		cache: {},
		data: function (elem, name, data) {
			if(!elem) {
				return;
			}
			if(!name) {
				return elem;
			}
			var id, propCache, cache,
				isNode = elem.nodeType, 
				thisCache;
			if(isNode) { 										// 如果是元素，用Cache.cache作为缓存体。

				cache = Cache.cache;		
				id = elem.uuid; 								// 获取元素的唯一id标识
				if(!id) {										
					elem.uuid = id = ++Cache.uuid; 		
				}
				thisCache = cache[id];
				if(!thisCache) { 								// 如果元素缓存对象不存在, 说明没初始化或者被删掉过
					cache[id] = thisCache = {};
				}							
				propCache = thisCache[name]; 					// 获取元素缓存对象的属性缓存对象
				if(!propCache) {								// 如果属性缓存对象不存在, 说明没初始化或者被删掉
					thisCache[name] = propCache = {};			// 初始化
				}
				if(data !== undefined) {
					propCache = data;
				}

			}else { 											// 如果是普通对象，直接用普通对象当成缓存体。
				propCache = elem[name];
			}		
			return propCache;
		},		
		removeData: function (elem, name) {
			if(!elem) {
				return;
			}
			if(!name) {
				return elem;
			}
			var id, cache,
				isNode = elem.nodeType,
				thisCache;
			if(isNode) { 									

				cache = Cache.cache;
				id = elem.uuid; 							// 查找不到唯一标识id，说明没有缓存或者已被删除
				if(!id) {									
					return;
				}
				thisCache = cache[id]; 						// thisCache保存元素缓存对象，降低对象的调用层级
				
				if(name in thisCache) { 					// 删除参数name指定的属性
					delete thisCache[name];
				}
			}else {
				if(name in elem) {
					delete elem[name];
				}
			}
		}
	});

	fn.extend(fn, {Cache: Cache});

	// 事件系统
	var Event = {};

	fn.extend(Event, {
		now: function () {
			return Date.now();
		},
		dispatch: function (event) {
			var target = event.target,
				type = event.type,
				self = this,
				eventCache = Cache.data(this, 'events'),
				handlerList = eventCache[type],
				selector, handlerObj, i = 0;
			if(!handlerList) { 									// 如果事件全部被解绑后, 会被删除该类型的事件列表, 此时handlerList为undefined。
				return;
			}
			while(handlerObj = handlerList[i++]) { 				// 遍历事件队列
				selector = handlerObj.selector;
				if(selector) {
					var eventTargets = self.querySelectorAll(selector);
					fn.each( fn.makeArray(eventTargets), function (eventTarget, index, eventTargets) {
						if(fn.contains(eventTarget, target) || eventTarget === target) { 	// 如果是其中一个选择器元素包含目标元素，或者等于目标元素
							handlerObj.handler.call(eventTarget, event); 		 			// 执行代理事件				
						}
					});
				}else {
					handlerObj.handler.call(self, event); 									// 执行普通事件
				}
			}
		},
		on: function (elems, type, selector, func, one) { 								// 参数selector支持事件代理, 参数useCapture是否支持捕获, 参数one是否绑定一次事件
			if(!elems) {																// 如果没有元素，则返回
				return;
			}

			if(!Type.isString(selector)) { 												// 如果是fn.on(elems, type, fn)的情况
				one = func;
				func = selector;
				selector = null;
			}

			fn.each(fn.makeArray(elems), function (el, index, elems) { 					// 遍历elems集合, 由于each只能遍历数组和对象,无法遍历非数组非纯对象的集合。所以要先转化成数组，再遍历。
				var eventCache, mainHandler,
					handlerList, thisCache,
					handlerObj = {};

				eventCache = Cache.data(el, 'events'); 									// 获取元素的事件缓存对象
				thisCache = Cache.cache[el.uuid];

				mainHandler = thisCache.mainHandler;									// 主回调函数
				if(!mainHandler) {
					thisCache.mainHandler = mainHandler = function (event) {
						Event.dispatch.apply(this, arguments);
					}

					mainHandler.el = el;
				}

				handlerList = eventCache[type]; 										// 尝试从缓存中获取事件列表对象，如果不存在则初始化列表数组
				if(!handlerList) { 													
					handlerList = eventCache[type] = [];
					handlerList.delegateCount = 0;										// 初始化代理事件个数
				}

				fn.extend(handlerObj, { 												// 事件描述对象
					selector: selector,
					type: type,
					handler: func
				});

				if(selector) {
					handlerList.splice(handlerList.delegateCount++, 0, handlerObj); 	// 如果有代理事件,放在普通事件前，代理事件后，标记代理个数加1
				}else{
					handlerList.push(handlerObj); 										// 如果只有普通事件，则加入结尾
				}

				el.addEventListener(type, mainHandler, false); 							// 绑定主回调函数
			});
		},
		off: function (elems, type, selector, func) {
			if(!elems) {
				return;
			}
			fn.each(fn.makeArray(elems), function (el, index, elems) {
				var eventCache, mainHandler,
					context = this, thisCache,
					handlerList;

				eventCache = Cache.data(el, 'events'); 									// 获取元素的事件缓存对象
				
				if(!eventCache) {
					return;
				}
				thisCache = Cache.cache[el.uuid];

				handlerList = eventCache[type];
				mainHandler = thisCache.mainHandler;
				if(!handlerList) { 														// 如果没有找到唯一标记id，说明事件缓存对象不存在;事件缓存对象中对应类型的事件队列不存在，说明还没绑定过事件。直接返回。
					return;
				}

				if(Type.isFunction(selector)) { 										// 如果是fn.off(elems, type, func)的情况
					func = selector;
					selector = null;
				}

				fn.each(handlerList, function (handlerObj, i, handlerList) {
					if(!selector && !handlerObj.selector) { 							// 如果参数selector不存在并且事件描述对象的selector属性为undefined，说明是普通事件
						handlerList[i] = false; 										// 把事件描述对象设置为false
					}
					if(handlerObj.selector && handlerObj.selector === selector) {		// 如果参数selector是字符串并且等于事件描述对象的selector属性
						handlerList[i] = false;											// 把事件描述对象设置为false
						handlerList.delegateCount--;									// 标记事件代理个数自减1	
					}
				});

				eventCache[type] = handlerList.filter(function (handlerObj) { 			// 过滤所有为false的事件描述对象
					return handlerObj !== false;
				});

				if(!eventCache[type].length) { 											// 如果事件队列对象为空，说明已经删除所有事件描述对象。
					delete eventCache[type];
				}

				if(fn.isEmptyObject(eventCache)) {

					delete thisCache['events'];											// 删除该元素的事件缓存对象
					// delete thisCache['mainHandler'];

					if(fn.isEmptyObject(thisCache)) {
						delete Cache.cache[el.uuid];
					}
				}
			});
		}
	});
	
	fn.extend(fn, {Event: Event});
 	
 	// 象限模块
	var Guadrant = {},
		posGuadrant = { 								// 构建原始象限
			"-90 0": "1",
			"-180 -90": "2",
			"90 180": "3",
			"0 90": "4"
		},
		isReverseLoad = fn.repeat(" 1 2 3 4 ", 10),		// 逆向象限路径，复制十次
		reverseLoad = fn.repeat(" 1 4 3 2 ", 10);		// 正向象限路径，复制十次
	fn.extend(Guadrant, {
		makeGuadrant: function () {					 	// Guadrant.makeGuadrant()方法根据data.origalInitAngle的值返回一个新的象限。
			var data = Cache.data(this, 'dataObj'),		
				origalInitAngle = data.origalInitAngle, 
				area, minArea, maxArea, minArea2, maxArea2,
				debugPosGuadrant = {};
			for(var i in posGuadrant) {
				area = i.split(" ");
				minArea = +area[0];
				maxArea = +area[1];
				minArea += origalInitAngle;				// 用原始象限的最小值加上原始初始化角度，得出新的最小值
				maxArea += origalInitAngle;				// 用原始象限的最大值加上原始初始化角度，得出新的最大值
				minArea2 = "";
				maxArea2 = "";
				
				if(minArea < -180 && minArea >= -270) { 	// 如果新的最小值小于并且小于-270，说明新的第二象限会越出原始的第二象限，越出的部分会在原始的第三象限，所以新的第二象限会由两部分构成。	
					minArea2 = minArea + 360;				// 在原始第三象限的部分最小值加上360
					maxArea2 = 180;							// 在原始第三象限的部分最大值为180
					minArea = -180;							// 在原始第二象限的部分最小值为-180
				}

				if(maxArea >= 180 && maxArea < 270) { 		// 同理
					maxArea2 = maxArea - 360;
					minArea2 = -180;
					maxArea = 180;
				}
				
				minArea = Guadrant.debugInitAngle(minArea);		// 如果data.origalInitAngle的值比较小或者比较大时，可能会计算得到的值小于-180或者大于180度，此时要转成-180~180的区间
				maxArea = Guadrant.debugInitAngle(maxArea);

				if(minArea === maxArea) { 						// 当minArea等于maxArea，说明整个原始象限会移位，此时新的象限只有一个。例如当data.origalInitAngle为-90时，minArea与maxArea为-180。
					minArea = minArea2;
					maxArea = maxArea2;
					minArea2 = null;
					maxArea2 = null;
				}

				debugPosGuadrant[minArea + " " + maxArea + (minArea2 ? "," + minArea2 + " ": "") + (maxArea2 ? maxArea2 : "") ] = posGuadrant[i]; 		// 如果新的象限中有一个象限为原始二三象限构成，则用逗号分割开。
			}
			data.debugPosGuadrant = debugPosGuadrant;					// 记录新的象限
			return debugPosGuadrant;
		},
		getPosGuadrant: function (angle, origin) { 						// Guadrant.getPosGuadrant(angle, origin)方法返回参数angle所在的象限，参数origin为true返回的原始象限所在的象限
			var data = Cache.data(this, 'dataObj'),
				guadrant = origin || data.initAngle === -90 ? posGuadrant : data.debugPosGuadrant,
				area, areaNum, minArea, maxArea;
			
			angle = Guadrant.debugInitAngle(angle);

			for(var i in guadrant) {
				area = i.split(",");
				for(var j = 0,l = area.length; j < l; j++) {
					areaNum = area[j].split(" ");
					minArea = +areaNum[0];
					maxArea = +areaNum[1];
					if(angle >= minArea && angle < maxArea) {
						return guadrant[i];
					}
				}
			}
		},
		isReverse: function (list, startAngle, endAngle) {			// Guadrant.isReverse(list, startAngle, endAngle)方法根据象限路径list, 开始角度startAngle, 结束角度endAngle返回旋转方向
			var data = Cache.data(this, 'dataObj'),
				reverse, guadrant;

			list = list.trim();
			if(!list) { 	 										// 如果路径不存在，不再向下操作				
				return;
			}
			if(list.length === 1) {  								// 如果list长度为1, 说明在用户在同一象限内滑动
				guadrant = Guadrant.getPosGuadrant.call(this, endAngle);
				if(~"1 4".indexOf(guadrant)) { 						// 一四象限是逆时
					reverse = true;
				}else if(~"2 3".indexOf(guadrant)){					// 二三象限是顺时
					reverse = false;	
				}
			}
			else {													// 否则是跨象限操作
				if(~isReverseLoad.indexOf(list)) { 					// 如果逆时针路径匹配到参数list，则认为是逆时针转动
					reverse = true;
				}else if(~reverseLoad.indexOf(list)){				// 如果顺时针路径匹配到参数list，则认为是顺时针转动
					reverse = false;								
				}
			}

			data.isReverse = reverse;
			return reverse;
		},
		filter: function (guadrantList) {							// Guadrant.filter(guadrantList)方法返回一个去重后的guadrantList路径的字符串
			var filterGuadrantListString = "";
			fn.each(guadrantList, function (item, i, guadrantList) { 		// 将guadrantList数组去重
				if(filterGuadrantListString.indexOf(item) === -1 && item !== undefined) {
					filterGuadrantListString += " " + item;					// filterGuadrantListString字符串记录
				}
			});
			return filterGuadrantListString;
		},
		makerGuadrantList: function (curAngle, origin, one) { 			// Guadrant.makeGuadrantList(curAngle, origin, on)方法根据传入的参数curAngle来返回象限路径字符串, 如果参数origin为true，则构造的是原始象限路径。参数one为true时，重新构造一条新的象限路径。
			var guadrant, data = Cache.data(this, 'dataObj'),
				guadrantList = origin ? data.originalGuadrantList : data.guadrantList, 		// 根据参数origin判断是否用原始象限
				filterGuadrantListString = "";

			if(one) {													// 如果one为true, 则清空路径
				guadrantList = [];
			}
			
			guadrant = Guadrant.getPosGuadrant.call(this, curAngle, origin); 				// 获取当前鼠标坐标的象限
			guadrantList.push(guadrant);													// 加入到路径中
			filterGuadrantListString = Guadrant.filter(guadrantList);
			origin ? (data.originalGuadrantList = guadrantList) : (data.guadrantList = guadrantList);			// 记录象限路径
		
			return filterGuadrantListString;
		},
		debugInitAngle: function (angle) {								// Guadrant.debugInitAngle(angle)方法来处理参数angle大于180或者小于-180的问题
			if(angle <= -180) {
				angle += 360;
			} 

			if(angle >= 180) {
				angle -= 360;
			}

			return angle;
		},
		trigger: function (startAngle, endAngle) {						// Guadrant.trigger(startAngle, endAngle)方法根据参数开始角度startAngle和参数结束角度endAngle来模拟一条象限路径。以{ endAngle: endAngle, originalFilterGuadrantListString: originalFilterGuadrantListString, isReverse: isReverse}形式返回一个对象。
			var	filterGuadrantListString = "", isReverse, 				
				originalFilterGuadrantListString = "",
				originalFilterGuadrantListString1 = "",
				originalFilterGuadrantListString2 = "",
				index1, index2;

			filterGuadrantListString = Guadrant.makerGuadrantList.call(this, startAngle);			// 返回构造新象限的路径
				
			if(~" 1 4".indexOf(filterGuadrantListString)) {						// 如果是经过1, 4象限，则说明是逆时针
				isReverse = true;
			}else if(~" 2 3".indexOf(filterGuadrantListString)) {				// 如果是经过2, 3象限，则说明是顺时针
				isReverse = false;
			}

			originalFilterGuadrantListString1 = Guadrant.makerGuadrantList.call(this, startAngle, true, true);			// 获取开始角度的原始象限
			originalFilterGuadrantListString2 = Guadrant.makerGuadrantList.call(this, endAngle, true, true);			// 获取结束角度的原始象限

			var load = "";

			if(isReverse) { 													// 如果是逆时针，则用逆时针路径；如果是顺时针，则用顺时针路径
				load = isReverseLoad;
			}else {
				load = reverseLoad;
			}

			index1 = load.indexOf(originalFilterGuadrantListString1); 			// 获取开始角度原始象限在象限路径上的下标位置
			index2 = load.indexOf(originalFilterGuadrantListString2);			// 获取结束角度原始象限在象限路径上的下标位置

			if(index1 > index2) { 												// 如果index1大于index2，说明结束角度所在的象限比较小
				index2 = load.substr(index1).indexOf(originalFilterGuadrantListString2) + index1; 		// 重新计算index2
			}

			originalFilterGuadrantListString = load.substring(index1, index2 + 2); 		// 有空格就+2

			return { 
				endAngle: endAngle, 
				originalFilterGuadrantListString: originalFilterGuadrantListString, 
				isReverse: isReverse
			};
		},
		debugAngle: function (startAngle, endAngle, trigger) { 							// Guardrant.debugAngle(startAngle, endAngle, trigger)方法来解决鼠标从第二象限滑动到第三象限或者从第三象限滑动到第二象限的角度问题。参数startAngle是开始角度，参数endAngle是结束角度。参数trigger为true，就会模拟路径。
			var	isReverse, originalFilterGuadrantListString = "", reverseInfo;

			startAngle = Guadrant.debugInitAngle(startAngle);
			endAngle = Guadrant.debugInitAngle(endAngle);

			if(!trigger) {									// 如果trigger为false，说明用真实路径
				originalFilterGuadrantListString = Guadrant.makerGuadrantList.call(this, endAngle, true); 			// 获取原始象限路径
				isReverse = Guadrant.isReverse.call(this, originalFilterGuadrantListString, startAngle, endAngle); 	// 获取旋转方向
				
			}else {
				reverseInfo = Guadrant.trigger.call(this, startAngle, endAngle);				// 模拟象限路径
				isReverse = reverseInfo.isReverse;
				originalFilterGuadrantListString = reverseInfo.originalFilterGuadrantListString;
				endAngle = reverseInfo.endAngle;
			}

			if(isReverse) {  																// 如果是逆时针
				if(~originalFilterGuadrantListString.indexOf("2 3")) { 						// 如果原始象限路径匹配到二三象限，说明路径有第二象限滑向第三象限的部分
					endAngle -= 360; 														// 结束的角度减小360
				}						
			}else if(!isReverse) {															// 如果是顺时针
				if(~originalFilterGuadrantListString.indexOf("3 2")) {						// 如果原始象限路径匹配到三二象限，说明路径有第三象限滑向第二象限的部分
					endAngle += 360;														// 结束的角度增加360
				}
			}
			return {endAngle: endAngle, startAngle: startAngle};							// 返回处理后的开始角度和结束角度对象				
		}
	})
	
	// 事件处理模块
	var Handler = {};

	fn.extend(Handler, {
		startHandler: function (e) {
			var data = Cache.data(this, 'dataObj'),
				clickClass = data.clickClass,
				centerPos, startClientPos, startAngle,
				centerPos = data.centerPos;											// 获取转盘中心坐标

			e.preventDefault();
			startClientPos = getCss.getClientPos(e);								// 鼠标按下时的坐标 
			startAngle = getCss.getAngleAndLen(startClientPos, centerPos).angle;	// 开始鼠标与中心的角度
			
			Event.on(this, touchMove, Handler.moveHandler); 						// 滑动的情况

			if(clickClass) {
				Event.on(this, touchEnd, Handler.endHandler); 						// 点击的情况
				fn.extend(data, {
					relativeAngle: 0, 												// 重置relativeAngle
					guadrantList: [],												// 清空路径象限队列
					originalGuadrantList: [],										// 清空原始路径象限队列
					endClientPos: startClientPos, 									// 将开始滑动坐标设置成结束滑动坐标					
					endAngle: startAngle,											// 开始角度设置成结束角度
				});
			}

			fn.extend(data, {
				centerPos: centerPos,
				startClientPos: startClientPos,
				startAngle: startAngle,
				slideAngle: 0,												
				isClick: false
			});

			Dial.mainDial = this;
		},
		moveHandler: function (e) {
			var data, startAngle, moveClientPos,
				moveAngle, slideAngle;
				
			e.preventDefault();
			data = Cache.data(this, 'dataObj');
			startAngle = data.startAngle;
			moveClientPos = getCss.getClientPos(e);												// 获取当前鼠标位置
			moveAngle = getCss.getAngleAndLen(moveClientPos, data.centerPos).angle; 			// 获取当前鼠标与中心的角度。以x的正方向为基准, 顺时针为正数, 逆时针为负数				
			slideAngle = Handler.countSlideAngle.call(this, startAngle, moveAngle, false);		// 获取本次滑动的角度
			Handler.rotato.call(this, slideAngle + data.angle, data.transition, null, false);	// 执行动画
			
			if(data.onSlideMove) {																// 执行onSlideMove方法
				data.onSlideMove.call(data);
			}

			fn.extend(data, { 																	// 保存数据						
				endClientPos: getCss.getClientPos(e),	
				endAngle: moveAngle,
				slideAngle: slideAngle
			});

			Event.on(doc, touchEnd, function (e) {												// 监听touchEnd，并传入this
				Handler.endHandler.call(this, e);
			});

			fn.extend(data.self, data);
		},
		endHandler: function (e) {
			var data = Cache.data(this, 'dataObj'),
				self = data.dial, 
				isClick, angle;

			e.preventDefault();

			isClick = Handler.isClick.call(this, e);											// 判断是否点击
			data.isClick = isClick;

			if(isClick) {																		// 如果是点击，调用Handler.countAngle，传入开始坐标和结束坐标，并且模拟旋转路径。
				Handler.countAngle.call(this, data.endAngle, data.initAngle, 0, true, 'end');
			}else{																				// 否则直接计算
				Handler.countAngle.call(this, null, null, 0, false, 'end');
			}

			// 解除绑定
			Event.off(doc, touchEnd);
			Event.off(self, touchEnd);
			Event.off(self, touchMove);

			fn.extend(data.self, data);															// 保存数据
		},
		countSlideAngle: function (startAngle, endAngle, trigger, status) {
			var data, angle, realAngle, angleObj,
				slideAngle, moveClientPos;
			data = Cache.data(this, "dataObj");
			angle = data.angle;
			angleObj = Guadrant.debugAngle.call(this, startAngle, endAngle, trigger); 						// 解决从第二象限到第三象限或者从第三象限到第二象限的角度问题						
			
			if(data.clickClass && data.click) {	
				slideAngle = getCss.getRelativeAngle.call(this, angleObj.endAngle, angleObj.startAngle); 	// 计算该次的相对滑动角度
			}else {
				slideAngle = angleObj.endAngle - angleObj.startAngle; 										// 鼠标滑动的角度加上此前转盘旋转的角度
			}
			data.slideAngle = slideAngle;
			return slideAngle;
		},
		countAngle: function (startAngle, endAngle, extraAngle, trigger, status) { 												// 方法countAngle(isClick)计算转盘旋转的角度
			var data = Cache.data(this, 'dataObj'),
				oneStep = data.oneStep,
				angle = data.angle,
				slideAngle = data.slideAngle || 0,
				transition = data.transition; 

			// 加上相对滑动角度
			if(data.isClick || (startAngle !== null && endAngle !== null)) {
				slideAngle = Handler.countSlideAngle.call(this, startAngle, endAngle, trigger, status);
			}

			if(oneStep && !data.isClick) {
				slideAngle = Handler.oneStep.call(this, slideAngle);
			}
			angle += (status === 'extra' ? 0 : slideAngle) + (extraAngle || 0); 	

			Handler.rotato.call(this, angle, data.transition, {
				curIndex: getCss.getBlockIndex.call(this, angle)								// 清空路径象限队列
			}, false);

			if(status !== 'slideMove') {
				data.angle = angle;
			}

			if(data.curBlockChange) { 												// 执行私有的回调
				Handler.curBlockChange.call(this);
			}

			if(data.click && data.clickClass) {
				Handler.changeCur.call(this);
			}

			if(data.onSlideEnd && Dial.mainDial === this) {														// 执行回调函数
				data.onSlideEnd.call(data);
				Dial.mainDial = null;
			}

		},
		isClick: function (e) {
			var data = Cache.data(this, 'dataObj'),
				target = e.target,
				clickClass = data.clickClass,
				eventTargets = this.querySelectorAll(clickClass),
				guadrantList = data.guadrantList,
				isClick = false,
				startClientPos = data.startClientPos, endClientPos = data.endClientPos;
			
			fn.each(fn.makeArray(eventTargets), function (item, i, eventTargets) {
				if(fn.contains(item, target) || item === target) {									// 如果点中了块元素其中的一个
					if(startClientPos.x === endClientPos.x && startClientPos.y === endClientPos.y && !guadrantList.length) { 			// 开始,结束的坐标点相等并且鼠标滑动的路径为空数组，说明鼠标是没有滑动的
						isClick = true;
						return false;
					}
				}
			});
			return isClick;
		},
		rotato: function (angle, transition, extra, oneStep) {
			var data = Cache.data(this, 'dataObj'),
				self = data.dial;
			if(!oneStep) {
				setCss.setStyle(self, 
					{
						"transform": "rotate(" + angle + "deg)", 
						"transition": transition 
					}, aPrefixString); 
			}
			if(extra) {
				fn.extend(data, extra);	 										// 保存数据
			}
		},
		oneStep: function (slideAngle) {
			var data = Cache.data(this, 'dataObj'),
				eachRotateAngle = data.eachRotateAngle;

			if(data.oneStep) {
				if(slideAngle > eachRotateAngle) {
					slideAngle = eachRotateAngle;
				}
				if(slideAngle < -eachRotateAngle) {
					slideAngle = -eachRotateAngle;
				}
			}
			return slideAngle;
		},
		curBlockChange: function () {
			var data = Cache.data(this, 'dataObj'),
				index = data.curIndex, 
				length = data.blockNumber,
				clickBlock = data.clickBlock, 
				i = 0, angle = data.angle;
			for(; i < length; i++) {
				if(clickBlock[i]) {
					setCss.setStyle(clickBlock[i], Matrix.getMatrix(clickBlock[i], -angle), aPrefixString);
				}
			}
		},
		changeCur: function () {
			var data = Cache.data(this, 'dataObj'),
				index = data.curIndex, 
				length = data.blockNumber,
				clickBlock = data.clickBlock, 
				i = 0;
			for(; i < length; i++) {
				clickBlock[i].classList.remove("cur");
			}
			clickBlock[index].classList.add("cur");
		},
		destroy: function () {
			var eventsCache = Cache.data(this, 'events'),
				data = Cache.data(this, 'dataObj');
			if(!eventsCache || fn.isEmptyObject(eventsCache)) {
				return;
			}
			fn.each(eventsCache, function (handlerList, type, eventsCache) {
				if(handlerList.length) {
					Event.off(this, type);											// 清除所有的监听事件
				}
			}, this);
		},
		slide: function (startAngle, endAngle, extraAngle, trigger, status) {
			var data = Cache.data(this, 'dataObj');
			if(!Dial.mainDial) {
				Dial.mainDial = this;	
			}
			data.guadrantList = [];
			data.originalGuadrantList = [];
			if(!data.destroy) {
				Handler.countAngle.call(this, startAngle, data.initAngle, extraAngle, true, status);
			}
		},
		playTo: function (index) {
			var data, curIndex, initAngle, clickBlock, angle,
				clickBlock, startClientPos, startAngle, slideAngle;

			data = Cache.data(this, 'dataObj');
			curIndex = data.curIndex;
			initAngle = data.initAngle;
			clickBlock = data.clickBlock;
			angle = data.angle;

			index = index % clickBlock.length;

			if(index < 0) {
				index += clickBlock.length;
			}
			console.log(index);
			startClientPos = getCss.getCenterPos(clickBlock[index]);
			startAngle = getCss.getAngleAndLen(startClientPos, data.centerPos).angle;

			Handler.slide.call(this, startAngle, data.initAngle, 0, true);
		},
		start: function (time) {
			var data = Cache.data(this, 'dataObj'),
				self = this, timer;
			Handler.stop.call(this);
			timer = setInterval(function () {
				Handler.playTo.call(self, data.curIndex + 1);
			}, time || 1500);
			data.timer = timer;
		},
		stop: function () {
			var data = Cache.data(this, 'dataObj');
			if(data.timer) {
				clearInterval(data.timer);
			}
		},
		lock: function () {
			var data = Cache.data(this, 'dataObj');
			if(!data.destroy) {
				Handler.destroy.call(this);
			}
		}
	});
	
	fn.extend(fn, {Handler: Handler});

	// 矩阵模块
	var Matrix = {},
		rmatrix = /(-?\d\d*(?:\.\d\d*(?:e-)?\d*)?)/g;

	fn.extend(Matrix, {
		matrix: function (translate, rotate, scale, skew) { 						
			var matrixProp;
			rotate ? " " + rotate : "";
			return {
				'transform': translate + rotate
			}
		},
		angleToRadian: function (angle) {
			return angle * Math.PI / 180;
		},
		getTranslateString: function (matrix) {
			if(!matrix){
				return;
			}
			var translate = matrix.match(rmatrix);
			return "translate(" + translate[4]+ "px, " + translate[5] + "px)";
		},
		getMatrixString: function (el, transform) {
			return getCss.getComputedStyle(el, transform);
		},
		getRotateString: function (angle) {
			return "rotate(" + angle + "deg)";
		},
		getMatrix: function (el, angle) {
			var matrix, 
				getTranslateString, getRotateString;
			matrix = Matrix.getMatrixString(el, 'transform');
			getTranslateString = Matrix.getTranslateString(matrix);
			getRotateString = Matrix.getRotateString(angle);
			return Matrix.matrix(getTranslateString, getRotateString);
		}
	});

	function __3d() {

	}
	
	// _3D模块
	var _3D = {};
	fn.extend(_3D, {
		
	});

	// Dial 构造函数，接受两个参数。其中selector是选择器，opt是初始化参数对象。
	var Dial = function (selector, opt) {

		var dial = document.querySelector(selector),
			options = fn.extend(defaultOptions, opt),
			clickBlock = null, clickClass = options.clickClass, blockNumber,
			origin = options.origin, centerPos,
			position = options.position,
			origalInitAngle = options.initAngle || 0,					
			initAngle = origalInitAngle - 90,				
			width = fn.stringToNumber(getCss.getComputedStyle(dial, 'width')),
			height = fn.stringToNumber(getCss.getComputedStyle(dial, 'height'));		

		// 通过clickClass获取点击的块元素
		if(clickClass) {
			clickBlock = document.querySelectorAll(clickClass);
			blockNumber = clickBlock.length;
		}

		var data = Cache.data(dial, 'dataObj'); 			// 初始化缓存对象，用于保存该转盘的信息

		this.data = data;

		// 设置转盘旋转中心和角度
		setCss.setStyle(dial, {
			"transform-origin": origin
		}, aPrefixString);

		// 设置转盘的位置 
		setCss.setPosition(dial, position);
		// 获取圆心位置
		centerPos = getCss.getCenterPos(dial);

		fn.extend(data, options, {
			self: this, 					// 实例化的dial
			options: options, 				// 扩展属性
			clickBlock: clickBlock,
			realAngle: 0,
			angle: 0,
			dial: dial,
			blockNumber: blockNumber || 0,
			eachRotateAngle: blockNumber ? 360 / blockNumber : 0,
			centerPos: centerPos,
			initAngle: initAngle,
			origalInitAngle: origalInitAngle,
			width: width,
			height: height,
			originalGuadrantList: [],
			guadrantList: [],
			curIndex: 0,
			debugInitAngle: Guadrant.debugInitAngle(initAngle),
			curBlockChange: options.consistentAngle ? false : options.curBlockChange 		// 如果参数consistentAngle为true，则设置curBlockChange为false
		});

		if(initAngle !== -90) {
			Guadrant.makeGuadrant.call(dial);
		}

		// 设置块元素位置
		if(clickClass) {
			setCss.setClickBlockPos.call(dial, aPrefixString);
		}

		if(data.autoPlay) {
			Handler.start.call(dial);
		}

		// 监听touchStart
		Event.on(dial, touchStart, Handler.startHandler);	

		fn.extend(this, data);

		if(data.isLock) {
			Handler.lock.call(dial);
		}

		if(data.isInterface) {
			this.fn = fn;
		}
	};
	
	// 公共方法
	Dial.prototype = {
		constructor: Dial,
		getCurIndex: function () {
			return Cache.data(this.dial, 'dataObj').curIndex;
		},
		next: function () {
			Handler.playTo.call(this.dial, this.getCurIndex() + 1);
		},	
		prev: function () {
			Handler.playTo.call(this.dial, this.getCurIndex() - 1);
		},
		playTo: function (index) {
			Handler.playTo.call(this,dial, index - 1);
		},
		destroy: function () {
			var data = Cache.data(this.dial, 'dataObj');
			Handler.destroy.call(this.dial);
			data.destroy = true;
		},
		lock: function () {
			Handler.lock.call(this.dial);
		},
		slide: function (slideAngle) {
			Handler.slide.call(this.dial, null, null, slideAngle, false, 'extra');
		},
		slideMove: function (slideAngle) {
			Handler.slide.call(this.dial, null, null, slideAngle, false, 'slideMove');
		},
		unLock: function () {
			var data = Cache.data(this.dial, 'dataObj');
			if(!data.destroy) {
				Event.on(this.dial, touchStart, Handler.startHandler);
			}
		},
		start: function (time) {
			Handler.start.call(this.dial, time);
		},
		stop: function() {
			Handler.stop.call(this.dial);
		}
	};

	if(extendFn) {
		fn.extend(fn, {
			Type: Type,
			Prefix: Prefix,
			setCss: setCss,
			getCss: getCss,
			Cache: Cache,
			Event: Event,
			Guadrant: Guadrant,
			Handler: Handler
		}, true);
	}

	Dial.fn = fn;

	window.Dial = Dial;

})(window);