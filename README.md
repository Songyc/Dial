# Dial
一个转盘插件

##选项
块元素指类名为".block"的元素
块角度指每次旋转一个块元素的角度

*	[initAngle]() Interger - 设置转盘开始的角度。默认值为0。
*	radius Interger - 块元素中心到转盘中心的距离。默认值为0。
*	target String/Object - 转盘元素的选择器表达式或者转盘元素。默认值为''。
*	block String/Object - 块元素的选择器表达式或者块元素。默认值为''。
*	position String - 设置转盘的位置。默认值为"center bottom"，即是水平居中，垂直居下。
*	step Interger - 设置转盘每次旋转的块角度数目。默认值为1。
*	oneStep Interger/Boolean - 是否每次最多旋转一个块角度。默认值为false。
*	lock Boolean - 是否锁住转盘。默认值为false。
*	autoPlay Boolean - 是否自动旋转。默认值为false。
*	link Boolean - 是否关联其它转盘。旋转其中一个关联的转盘，其它关联的转盘会也跟着联动。默认值为false。
*	usePosition Boolean - 转盘是否自动定位。如果该选项为false，选项position会无效。默认值为true。
*	useBlockPosition Boolean - 块元素是否自动定位。默认值为true。
*	useTransition Boolean - 转盘是否使用过渡动画。默认值为true。
*	useBlockAlwaysUp Boolean - 块元素是否一直保持向上。默认值为true。
*	useBlockToAngle Boolean - 块元素是否一直保持与外。默认值为true。
*	useClick Boolean - 点击块元素，转盘是否能旋转。默认值为true。
*	onSlideStart Function - 转盘滑动前触发。
*	onSlideMove Function - 转盘滑动时触发。
*	onSlideEnd Function - 转盘滑动结束后触发。

.slideTo Function - 调用.slideTo(index)方法会旋转到参数对应的块元素位置。其中参数index是块元素的下标。
.start Function - 调用.start()方法会自动旋转，等效于设置选项autoPlay为true。
.stop Function - 调用.stop()方法会停止自动旋转。
.lock Function - 调用.lock()方法会锁住转盘。
.unLock Function - 调用.unLock()方法转盘解锁。
.destroy Function - 调用.destroy()方法会销毁转盘对象。
.prev Function - 调用.prev()方法会旋转到上一个块元素的位置。
.next Function - 调用.next()方法会旋转到下一个块元素的位置。

