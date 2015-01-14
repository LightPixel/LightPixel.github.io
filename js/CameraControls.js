

DVSJS.TrackballControls = function ( object, domElement ) {

	var _this = this;
	var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2, TOUCH_ROTATE: 3, TOUCH_ZOOM_PAN: 4 };

	this.object = object;
	this.domElement = ( domElement !== undefined ) ? domElement : document;	
	// API

	this.enabled = true;
	this.screen = { left: 0, top: 0, width: 0, height: 0 };

	this.rotateSpeed = 1.0;
	this.zoomSpeed = 1.2;
	this.panSpeed = 0.3;

	this.noRotate = false;
	this.noZoom = false;
	this.noPan = false;
	this.noRoll = false;

	this.staticMoving = false;
	this.dynamicDampingFactor = 0.2;

	this.minDistance = 0;
	this.maxDistance = Infinity;

	this.keys = [ 65 /*A*/, 83 /*S*/, 68 /*D*/ ];

	// internals
	this.target = new THREE.Vector3();

	var EPS = 0.000001;

	var lastPosition = new THREE.Vector3();

	var _state = STATE.NONE,
	_prevState = STATE.NONE,

	_eye = new THREE.Vector3(),

	_rotateStart = new THREE.Vector3(),
	_rotateEnd = new THREE.Vector3(),

	_zoomStart = new THREE.Vector2(),
	_zoomEnd = new THREE.Vector2(),

	_touchZoomDistanceStart = 0,
	_touchZoomDistanceEnd = 0,

	_panStart = new THREE.Vector2(),
	_panEnd = new THREE.Vector2();

	// for reset

	this.target0 = this.target.clone();
	this.position0 = this.object.position.clone();
	this.up0 = this.object.up.clone();

	// events

	var changeEvent = { type: 'change' };
	var startEvent = { type: 'start'};
	var endEvent = { type: 'end'};

	// methods

	this.handleResize = function () {

		if ( this.domElement === document ) {
			this.screen.left = 0;
			this.screen.top = 0;
			this.screen.width = window.innerWidth;
			this.screen.height = window.innerHeight;

		} else {
			var box = this.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = this.domElement.ownerDocument.documentElement;
			this.screen.left = box.left + window.pageXOffset - d.clientLeft;
			this.screen.top = box.top + window.pageYOffset - d.clientTop;
			this.screen.width = box.width;
			this.screen.height = box.height;
		}
	};

	this.handleEvent = function ( event ) {
		if ( typeof this[ event.type ] == 'function' ) {
			this[ event.type ]( event );
		}
	};

	var getMouseOnScreen = ( function () {
		var vector = new THREE.Vector2();
		return function ( pageX, pageY ) {
			vector.set(
				( pageX - _this.screen.left ) / _this.screen.width,
				( pageY - _this.screen.top ) / _this.screen.height
			);
			return vector;
		};
	}() );

	var getMouseProjectionOnBall = ( function () {
		var vector = new THREE.Vector3();
		var objectUp = new THREE.Vector3();
		var mouseOnBall = new THREE.Vector3();
		return function ( pageX, pageY ) {
			mouseOnBall.set(
				( pageX - _this.screen.width * 0.5 - _this.screen.left ) / (_this.screen.width*.5),
				( _this.screen.height * 0.5 + _this.screen.top - pageY ) / (_this.screen.height*.5),
				0.0
			);

			var length = mouseOnBall.length();
			if ( _this.noRoll ) {
				if ( length < Math.SQRT1_2 ) {
					mouseOnBall.z = Math.sqrt( 1.0 - length*length );
				} else {
					mouseOnBall.z = .5 / length;					
				}

			} else if ( length > 1.0 ) {
				mouseOnBall.normalize();
			} else {
				mouseOnBall.z = Math.sqrt( 1.0 - length * length );
			}

			_eye.copy( _this.object.position ).sub( _this.target );
			vector.copy( _this.object.up ).setLength( mouseOnBall.y )
			vector.add( objectUp.copy( _this.object.up ).cross( _eye ).setLength( mouseOnBall.x ) );
			vector.add( _eye.setLength( mouseOnBall.z ) );
			return vector;
		};

	}() );

	this.rotateCamera = (function(){
		var axis = new THREE.Vector3(),
			quaternion = new THREE.Quaternion();

		return function () {
			var angle = Math.acos( _rotateStart.dot( _rotateEnd ) / _rotateStart.length() / _rotateEnd.length() );
			if ( angle ) {
				axis.crossVectors( _rotateStart, _rotateEnd ).normalize();
				angle *= _this.rotateSpeed;
				quaternion.setFromAxisAngle( axis, -angle );
				_eye.applyQuaternion( quaternion );
				_this.object.up.applyQuaternion( quaternion );
				_rotateEnd.applyQuaternion( quaternion );
				if ( _this.staticMoving ) {
					_rotateStart.copy( _rotateEnd );
				} else {
					quaternion.setFromAxisAngle( axis, angle * ( _this.dynamicDampingFactor - 1.0 ) );
					_rotateStart.applyQuaternion( quaternion );
				}
			}
		}

	}());

	this.zoomCamera = function () {
		if ( _state === STATE.TOUCH_ZOOM_PAN ) {
			var factor = _touchZoomDistanceStart / _touchZoomDistanceEnd;
			_touchZoomDistanceStart = _touchZoomDistanceEnd;
			_eye.multiplyScalar( factor );
		} else {
			var factor = 1.0 + ( _zoomEnd.y - _zoomStart.y ) * _this.zoomSpeed;
			if ( factor !== 1.0 && factor > 0.0 ) {
				_eye.multiplyScalar( factor );
				if ( _this.staticMoving ) {
					_zoomStart.copy( _zoomEnd );
				} else {
					_zoomStart.y += ( _zoomEnd.y - _zoomStart.y ) * this.dynamicDampingFactor;
				}
			}
		}
	};

	this.panCamera = (function(){
		var mouseChange = new THREE.Vector2(),
			objectUp = new THREE.Vector3(),
			pan = new THREE.Vector3();

		return function () {
			mouseChange.copy( _panEnd ).sub( _panStart );
			if ( mouseChange.lengthSq() ) {
				mouseChange.multiplyScalar( _eye.length() * _this.panSpeed );
				pan.copy( _eye ).cross( _this.object.up ).setLength( mouseChange.x );
				pan.add( objectUp.copy( _this.object.up ).setLength( mouseChange.y ) );

				_this.object.position.add( pan );
				_this.target.add( pan );

				if ( _this.staticMoving ) {
					_panStart.copy( _panEnd );
				} else {
					_panStart.add( mouseChange.subVectors( _panEnd, _panStart ).multiplyScalar( _this.dynamicDampingFactor ) );
				}
			}
		}

	}());

	this.checkDistances = function () {

		if ( !_this.noZoom || !_this.noPan ) {
			if ( _eye.lengthSq() > _this.maxDistance * _this.maxDistance ) {
				_this.object.position.addVectors( _this.target, _eye.setLength( _this.maxDistance ) );
			}

			if ( _eye.lengthSq() < _this.minDistance * _this.minDistance ) {
				_this.object.position.addVectors( _this.target, _eye.setLength( _this.minDistance ) );
			}
		}

	};

	this.update = function () {
		_eye.subVectors( _this.object.position, _this.target );

		if ( !_this.noRotate ) {
			_this.rotateCamera();
		}

		if ( !_this.noZoom ) {
			_this.zoomCamera();
		}

		if ( !_this.noPan ) {
			_this.panCamera();
		}

		_this.object.position.addVectors( _this.target, _eye );
		_this.checkDistances();
		_this.object.lookAt( _this.target );

		if ( lastPosition.distanceToSquared( _this.object.position ) > EPS ) {
			_this.dispatchEvent( changeEvent );
			lastPosition.copy( _this.object.position );
		}	
	};

	this.reset = function () {

		_state = STATE.NONE;
		_prevState = STATE.NONE;

		_this.target.copy( _this.target0 );
		_this.object.position.copy( _this.position0 );
		_this.object.up.copy( _this.up0 );

		_eye.subVectors( _this.object.position, _this.target );

		_this.object.lookAt( _this.target );

		_this.dispatchEvent( changeEvent );

		lastPosition.copy( _this.object.position );

	};

	// listeners

	function keydown( event ) {
		if ( _this.enabled === false ) return;
		_prevState = _state;
		if ( _state !== STATE.NONE ) {
			return;
		} else if ( event.keyCode === _this.keys[ STATE.ROTATE ] && !_this.noRotate ) {
			_state = STATE.ROTATE;
		} else if ( event.keyCode === _this.keys[ STATE.ZOOM ] && !_this.noZoom ) {
			_state = STATE.ZOOM;
		} else if ( event.keyCode === _this.keys[ STATE.PAN ] && !_this.noPan ) {
			_state = STATE.PAN;	
		}
	}

	function keyup( event ) {
		if ( _this.enabled === false ) return;
		_state = _prevState;
	}

	function mousedown( event ) {
		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();
		if ( _state === STATE.NONE ) {
			_state = event.button;
		}

		if ( _state === STATE.ROTATE && !_this.noRotate ) {
			_rotateStart.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );
			_rotateEnd.copy( _rotateStart );
		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {
			_zoomStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_zoomEnd.copy(_zoomStart);
		} else if ( _state === STATE.PAN && !_this.noPan ) {
			_panStart.copy( getMouseOnScreen( event.pageX, event.pageY ) );
			_panEnd.copy(_panStart)
		}

		document.addEventListener( 'mousemove', mousemove, false );
		document.addEventListener( 'mouseup', mouseup, false );

		_this.dispatchEvent( startEvent );

	}

	function mousemove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		if ( _state === STATE.ROTATE && !_this.noRotate ) {

			_rotateEnd.copy( getMouseProjectionOnBall( event.pageX, event.pageY ) );

		} else if ( _state === STATE.ZOOM && !_this.noZoom ) {

			_zoomEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		} else if ( _state === STATE.PAN && !_this.noPan ) {

			_panEnd.copy( getMouseOnScreen( event.pageX, event.pageY ) );

		}

	}

	function mouseup( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		_state = STATE.NONE;

		document.removeEventListener( 'mousemove', mousemove );
		document.removeEventListener( 'mouseup', mouseup );
		_this.dispatchEvent( endEvent );

	}

	function mousewheel( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		var delta = 0;

		if ( event.wheelDelta ) { // WebKit / Opera / Explorer 9

			delta = event.wheelDelta / 40;

		} else if ( event.detail ) { // Firefox

			delta = - event.detail / 3;

		}

		_zoomStart.y += delta * 0.01;
		_this.dispatchEvent( startEvent );
		_this.dispatchEvent( endEvent );

	}

	function touchstart( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_state = STATE.TOUCH_ROTATE;
				_rotateStart.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_rotateEnd.copy( _rotateStart );
				break;

			case 2:
				_state = STATE.TOUCH_ZOOM_PAN;
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = _touchZoomDistanceStart = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panStart.copy( getMouseOnScreen( x, y ) );
				_panEnd.copy( _panStart );
				break;

			default:
				_state = STATE.NONE;

		}
		_this.dispatchEvent( startEvent );


	}

	function touchmove( event ) {

		if ( _this.enabled === false ) return;

		event.preventDefault();
		event.stopPropagation();

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				break;

			case 2:
				var dx = event.touches[ 0 ].pageX - event.touches[ 1 ].pageX;
				var dy = event.touches[ 0 ].pageY - event.touches[ 1 ].pageY;
				_touchZoomDistanceEnd = Math.sqrt( dx * dx + dy * dy );

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				break;

			default:
				_state = STATE.NONE;

		}

	}

	function touchend( event ) {

		if ( _this.enabled === false ) return;

		switch ( event.touches.length ) {

			case 1:
				_rotateEnd.copy( getMouseProjectionOnBall( event.touches[ 0 ].pageX, event.touches[ 0 ].pageY ) );
				_rotateStart.copy( _rotateEnd );
				break;

			case 2:
				_touchZoomDistanceStart = _touchZoomDistanceEnd = 0;

				var x = ( event.touches[ 0 ].pageX + event.touches[ 1 ].pageX ) / 2;
				var y = ( event.touches[ 0 ].pageY + event.touches[ 1 ].pageY ) / 2;
				_panEnd.copy( getMouseOnScreen( x, y ) );
				_panStart.copy( _panEnd );
				break;

		}

		_state = STATE.NONE;
		_this.dispatchEvent( endEvent );

	}

	this.addHandlerListener = function (){
		_this.domElement.addEventListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

		_this.domElement.addEventListener( 'mousedown', mousedown, false );

		_this.domElement.addEventListener( 'mousewheel', mousewheel, false );
		_this.domElement.addEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

		_this.domElement.addEventListener( 'touchstart', touchstart, false );
		_this.domElement.addEventListener( 'touchend', touchend, false );
		_this.domElement.addEventListener( 'touchmove', touchmove, false );

		window.addEventListener( 'keydown', keydown, false );
		window.addEventListener( 'keyup', keyup, false );
	}

	this.delHandlerListener = function (){
		//_this.domElement.removevEentListener( 'contextmenu', function ( event ) { event.preventDefault(); }, false );

		_this.domElement.removeEventListener( 'mousedown', mousedown, false );

		_this.domElement.removeEventListener( 'mousewheel', mousewheel, false );
		_this.domElement.removeEventListener( 'DOMMouseScroll', mousewheel, false ); // firefox

		_this.domElement.removeEventListener( 'touchstart', touchstart, false );
		_this.domElement.removeEventListener( 'touchend', touchend, false );
		_this.domElement.removeEventListener( 'touchmove', touchmove, false );

		window.removeEventListener( 'keydown', keydown, false );
		window.removeEventListener( 'keyup', keyup, false );
	}

	

	this.handleResize();
	this.addHandlerListener();

	// force an update at start
	this.update();

};

DVSJS.TrackballControls.prototype = Object.create( THREE.EventDispatcher.prototype );

DVSJS.MoveControls = function(object, domElement){
	var me = this;
	this.domElement = ( domElement !== undefined ) ? domElement : document;
	this.screen = { left: 0, top: 0, width: 0, height: 0 };
	
	this.mousedown = false;
	var moveForward = false;
	var moveBackward = false;
	var moveLeft = false;
	var moveRight = false;
	var moveUp = false;
	var moveDown = false;

	this.object = object;
	this.target = new THREE.Vector3();
	this.target.copy(this.object.position);
	this.target.normalize();
    
    this.dir = new THREE.Vector3();
    this.side = new THREE.Vector3();
    this.pageX;

	function onMouseMove( event ) {
       if(me.mousedown){
			me.dir.subVectors( me.object.position, me.target );
			var dis = me.pageX-event.pageX;
			if(dis>0)
				me.dir.applyAxisAngle( me.object.up, -0.005);
			else
				me.dir.applyAxisAngle( me.object.up, 0.005);

			me.target.subVectors( me.object.position, me.dir);			
			me.pageX=event.pageX
		}
	};

	function onMouseDown( event ) {
		me.pageX = event.pageX;
		 me.mousedown = true;
	}
	function onMouseUp( event ) {
		me.mousedown = false;	
	}

	function onKeyDown( event ) {
		switch ( event.keyCode ) {
			case 38: // up				
			case 87: // w
				moveForward = true;	
			break;

			case 37: // left
			case 65: // a
				moveLeft = true; 
			break;

			case 40: // down
			case 83: // s
				moveBackward = true;				
			break;

			case 39: // right
			case 68: // d
				moveRight = true;				
			break;

			case 81://Q
			    moveUp = true;
			break;

			case 69://E
			    moveDown = true;
			break;
		}
	};

	function onKeyUp( event ) {
		switch( event.keyCode ) {
			case 38: // up	
			case 87: // w
				moveForward = false;
				break;
			case 37: // left
			case 65: // a
				moveLeft = false;
				break;

			case 40: // down
			case 83: // s
				moveBackward = false;
				break;

			case 39: // right
			case 68: // d
				moveRight = false;
				break;
			case 81://Q
			    moveUp = false;
			break;
			case 69://E
			    moveDown = false;
			break;
		}
		
	};

	this.handleResize = function () {
		if ( me.domElement === document ) {
			me.screen.left = 0;
			me.screen.top = 0;
			me.screen.width = window.innerWidth;
			me.screen.height = window.innerHeight;

		} else {
			var box = me.domElement.getBoundingClientRect();
			// adjustments come from similar code in the jquery offset() function
			var d = me.domElement.ownerDocument.documentElement;
			me.screen.left = box.left + window.pageXOffset - d.clientLeft;
			me.screen.top = box.top + window.pageYOffset - d.clientTop;
			me.screen.width = box.width;
			me.screen.height = box.height;
		}

	};


	this.update = function () {	
		me.dir.subVectors( me.object.position, me.target );
		me.dir.normalize();

		if ( moveForward )
		{			
			me.object.position.sub(me.dir);
			me.target.sub(me.dir);			
		}
		if ( moveBackward )			
		{
			me.object.position.add(me.dir);
			me.target.add(me.dir);
		}
		if ( moveLeft )
		{
			me.side.copy(me.object.up).cross(me.dir);
			me.object.position.sub(me.side);
			me.target.sub(me.side);			
		}
		if ( moveRight )
		{
			me.side.copy(me.object.up).cross(me.dir);
			me.object.position.add(me.side);
			me.target.add(me.side);				
		}
		if(moveUp){
			me.object.position.add(me.object.up);
			me.target.add(me.object.up);
		}
		if(moveDown){
			me.object.position.sub(me.object.up);
			me.target.sub(me.object.up);
		}
		me.object.lookAt(me.target);
	};

	this.addHandlerListener = function (){
		me.domElement.addEventListener( 'mousedown', onMouseDown, false );
		me.domElement.addEventListener( 'mouseup', onMouseUp, false );
		me.domElement.addEventListener( 'mousemove', onMouseMove, false );
		me.domElement.addEventListener( 'keydown', onKeyDown, false );
		me.domElement.addEventListener( 'keyup', onKeyUp, false );
	}

	this.delHandlerListener = function (){
		me.domElement.removeEventListener( 'mousedown', onMouseDown, false );
		me.domElement.removeEventListener( 'mouseup', onMouseUp, false );
		me.domElement.removeEventListener( 'mousemove', onMouseMove, false );
		me.domElement.removeEventListener( 'keydown', onKeyDown, false );
		me.domElement.removeEventListener( 'keyup', onKeyUp, false );
	}

}
DVSJS.MoveControls.prototype = Object.create( THREE.EventDispatcher.prototype );


DVSJS.CameraControls = function (camera, domElement ) {
	var me = this;
	this.camera = camera;
	
	this.pos = new THREE.Vector3();
	this.tar = new THREE.Vector3();


	var TYPE = {OBJ:0,PAN:1};
    this.type = TYPE.OBJ;
	
	var panCamera = new DVSJS.MoveControls(camera, domElement);//漫游相机
	var objCamera = new DVSJS.TrackballControls(camera, domElement);//对象查看相机	

    function OnKeydown( event ) {
		window.removeEventListener( 'keydown', OnKeydown );
	}

	function OnKeyup( event ) {
		switch(event.keyCode){
			case 49:
			case 97:			
			me.type = TYPE.OBJ;		
			objCamera.handleResize();
			objCamera.addHandlerListener();
			panCamera.delHandlerListener();
			break;
			case 50:
			case 98:			
			me.type = TYPE.PAN;			
			panCamera.object.position.set(objCamera.object.position.x,objCamera.object.position.y,objCamera.object.position.z);
			panCamera.target.set(0.0,0.0,0.0);

			panCamera.handleResize();
			panCamera.addHandlerListener();
			objCamera.delHandlerListener();
			break;
			case 32:
			reSet();
			
			break;
		}		

		window.addEventListener( 'keydown', OnKeydown, false );
	}

	function reSet(){
		switch(me.type){
			case TYPE.OBJ:
			objCamera.position0.set(me.pos.x,me.pos.y,me.pos.z);			
			objCamera.reset();	
			
			break;
			case TYPE.PAN:
			panCamera.target.set(0,0,0); 
			panCamera.object.up.copy(objCamera.up0);
			panCamera.object.position.set(me.pos.x,me.pos.y,me.pos.z);				
			break;
		}
	}

	this.update = function () {		
		switch(me.type){
			case TYPE.OBJ:
			objCamera.update();
			break;
			case TYPE.PAN:
			panCamera.update();	 
			break;
		}
	}

	this.handleResize = function () {
		switch(me.type){
			case TYPE.OBJ:
			objCamera.handleResize();

			break;
			case TYPE.PAN:
			panCamera.handleResize();

			break;
		}
	}

	this.setCamera = function(pos,tar){
		me.pos.set(Number(pos.x),Number(pos.y),Number(pos.z));
		me.tar.set(Number(tar.x),Number(tar.y),Number(tar.z));
	}

	window.addEventListener( 'keydown', OnKeydown, false );
	window.addEventListener( 'keyup', OnKeyup, false );

	this.update();
}
DVSJS.CameraControls.prototype = Object.create( THREE.EventDispatcher.prototype );
