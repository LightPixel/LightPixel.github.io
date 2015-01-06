DVSJS.MeshLoader = function () {};

DVSJS.MeshLoader.prototype = {

	constructor: DVSJS.MeshLoader

};

DVSJS.MeshLoader.prototype.load = function ( url, callback ) {
   
	var scope = this;

	var xhr = new XMLHttpRequest();

	function onloaded( event ) {

		if ( event.target.status === 200 || event.target.status === 0 ) {
			var geometry = scope.parse( event.target.response || event.target.responseText );
			scope.dispatchEvent( { type: 'load', content: geometry } );

			if ( callback ) callback( geometry );
		} 
		else {
			scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']', response: event.target.statusText } );
		}
	}

	xhr.addEventListener( 'load', onloaded, true );
	xhr.addEventListener( 'progress', function ( event ) {
		scope.dispatchEvent( { type: 'progress', loaded: event.loaded, total: event.total } );
	}, false );
	xhr.addEventListener( 'error', function () {
		scope.dispatchEvent( { type: 'error', message: 'Couldn\'t load URL [' + url + ']' } );
	}, false );

	if ( xhr.overrideMimeType ) xhr.overrideMimeType( 'text/plain; charset=x-user-defined' );
	xhr.open( 'GET', url, true );
	xhr.responseType = 'arraybuffer';
	xhr.send( null );
	

		/*var me = this;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("Get",url,false);
		xmlhttp.send(null);
		
		if (xmlhttp.readyState == 4) {
 			//console.log(xmlhttp.responseText);
 			this.parseFile(xmlhttp.response || xmlhttp.responseText, url);
		}*/

};

DVSJS.MeshLoader.prototype.parse = function ( data ) {

	var reader = new DataView( data );
	/*
	var point = 0;
	var magicNum = reader.getUint32( point, true );
	point+=4;

	//bunding 
	var min = new Float32Array(3);
	for (var i = 0; i < 3; i++) {
		min[i] = reader.getFloat32(point+i*4, true);
	};
	point+=12;

	var max = new Float32Array(3);
	for (var i = 0; i < 3; i++) {
		max[i] = reader.getFloat32(point+i*4, true);
	};
	point+=12;
   
   var center = new Float32Array(3);
	for (var i = 0; i < 3; i++) {
		center[i] = reader.getFloat32(point+i*4, true);
	};
	point+=12;
    var radius = reader.getFloat32(point, true);
    point+=4;
*/
	var point = 44;
   // var obj3d = new THREE.Object3D();
	
    //surface
 	var num_surfaces = reader.getInt32( point, true );
 	point+=4;
 	var geoList =  new Array(num_surfaces);
 	  
 	for (var i = 0; i < num_surfaces; i++) { 		
 		var geobuf = new THREE.BufferGeometry();
 		var StrLen = reader.getInt32( point, true );
 		point+=4;
 		if(StrLen>0){
 			point+=StrLen; 			
 		}

 		var min = new Float32Array(3);
		for (var j = 0; j < 3; j++) {
			min[j] = reader.getFloat32(point+j*4, true);
		};
		point+=12;

		var max = new Float32Array(3);
		for (var j = 0; j < 3; j++) {
			max[j] = reader.getFloat32(point+j*4, true);
		};
		point+=12;
	   
	    var center = new Float32Array(3);
		for (var j = 0; j < 3; j++) {
			center[j] = reader.getFloat32(point+j*4, true);
		};
		point+=12; 	

		var radius = reader.getFloat32(point, true);
    	point+=4;	

    	geobuf.boundingBox = new THREE.Box3(THREE.Vector3(min[0],min[1],min[2]), THREE.Vector3(max[0], max[1], max[2]));
    	geobuf.boundingSphere = new THREE.Sphere(THREE.Vector3(center[0],center[1],center[2]), radius);
    	geoList[i] = geobuf;    	
 	};
      //alert(num_surfaces);
 	for (var i = 0; i < num_surfaces; i++){
 	 	// vertices
		var num_vertex = reader.getUint32( point, true );
		point+=4;
	
		var vertices = new Float32Array( num_vertex * 3  );
		var normals   = new Float32Array( num_vertex * 3  );
		var texcoord = new Float32Array( num_vertex * 2  );
		for (var j = 0; j < num_vertex; j++) {
			vertices[j*3]   = reader.getFloat32(point, true);
			vertices[j*3+1] = reader.getFloat32(point + 4, true);
			vertices[j*3+2] = reader.getFloat32(point + 8, true);	
			//var str = j.toString()+":"+vertices[j].toString()+","+vertices[j+1].toString()+","+vertices[j+2].toString();
			//alert(str);

			var normal = new THREE.Vector3();
			normal[0] =  ( reader.getUint16(point + 12, true)/ 65535.0) * 2.0 - 1.0;
			normal[1]  = ( reader.getUint16(point + 14, true)/ 65535.0) * 2.0 - 1.0;
			normal[2]  = ( reader.getUint16(point + 16, true)/ 65535.0) * 2.0 - 1.0;						
			
			normal.normalize();
			normals[j*3] = normal[0];
			normals[j*3+1] = normal[1];
			normals[j*3+2] = normal[2];

			var str = "after:"+j.toString()+":"+normals[j*3].toString()+","+normals[j*3+1].toString()+","+normals[j*3+2].toString();		
			//console.log(str);

			point +=18;			
		};

		//alert(num_vertex);

		//tex1
		var num_texcoord_0 = reader.getUint32( point, true );
		point+=4;
		for (var j = 0; j < num_texcoord_0; j++) {
			texcoord[j*2]   = reader.getFloat32(point, true);
			texcoord[j*2+1] = reader.getFloat32(point + 4, true);
			point+=8;
			var str = j.toString()+":"+texcoord[j*2].toString()+","+texcoord[j*2+1].toString();
			//alert(str);
			//console.log(str);
		};
		//alert(num_texcoord_0);
		//uv for lightmap
		var num_texcoord_1 = reader.getUint32(point, true );	
		point+= (num_texcoord_1*2+1)*4;

		//index		
		var num_indices = reader.getUint32( point, true )* 3;	
		var indices = new Uint32Array( num_indices  );
		point+= 4;
		if(num_indices < 65536) {
			for(var j = 0; j < num_indices; j++) {				
				indices[j] = reader.getUint16(point + j*2, true);				
			}
			point+=num_indices*2;
		}
		else 
		{
			for(var j = 0; j < num_indices; j++) {				
				indices[j] = reader.getUint32(point + j*4, true);
			}
			point+=num_indices*4;
		}
        //alert(num_indices);
	  		  
		geoList[i].addAttribute( 'uv',       new THREE.BufferAttribute( texcoord, 2 ) );
		geoList[i].addAttribute( 'normal',   new THREE.BufferAttribute( normals, 3 ) );
		geoList[i].addAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );	
		geoList[i].addAttribute( 'index',    new THREE.BufferAttribute( indices, 1 ) );		
 	 }
	
	  return geoList;
};


THREE.EventDispatcher.prototype.apply( DVSJS.MeshLoader.prototype );


if ( typeof DataView === 'undefined'){

	DataView = function(buffer, byteOffset, byteLength){

		this.buffer = buffer;
		this.byteOffset = byteOffset || 0;
		this.byteLength = byteLength || buffer.byteLength || buffer.length;
		this._isString = typeof buffer === "string";
	}

	DataView.prototype = {

		_getCharCodes:function(buffer,start,length){
			start = start || 0;
			length = length || buffer.length;
			var end = start + length;
			var codes = [];
			for (var i = start; i < end; i++) {
				codes.push(buffer.charCodeAt(i) & 0xff);
			}
			return codes;
		},

		_getBytes: function (length, byteOffset, littleEndian) {

			var result;

			// Handle the lack of endianness
			if (littleEndian === undefined) {

				littleEndian = this._littleEndian;

			}

			// Handle the lack of byteOffset
			if (byteOffset === undefined) {

				byteOffset = this.byteOffset;

			} else {

				byteOffset = this.byteOffset + byteOffset;

			}

			if (length === undefined) {

				length = this.byteLength - byteOffset;

			}

			// Error Checking
			if (typeof byteOffset !== 'number') {

				throw new TypeError('DataView byteOffset is not a number');

			}

			if (length < 0 || byteOffset + length > this.byteLength) {

				throw new Error('DataView length or (byteOffset+length) value is out of bounds');

			}

			if (this.isString){
				result = this._getCharCodes(this.buffer, byteOffset, byteOffset + length);
			} else {
				result = this.buffer.slice(byteOffset, byteOffset + length);
			}

			if (!littleEndian && length > 1) {
				if (!(result instanceof Array)) {
					result = Array.prototype.slice.call(result);
				}

				result.reverse();
			}

			return result;

		},

		// Compatibility functions on a String Buffer

		getFloat64: function (byteOffset, littleEndian) {

			var b = this._getBytes(8, byteOffset, littleEndian),

				sign = 1 - (2 * (b[7] >> 7)),
				exponent = ((((b[7] << 1) & 0xff) << 3) | (b[6] >> 4)) - ((1 << 10) - 1),

			// Binary operators such as | and << operate on 32 bit values, using + and Math.pow(2) instead
				mantissa = ((b[6] & 0x0f) * Math.pow(2, 48)) + (b[5] * Math.pow(2, 40)) + (b[4] * Math.pow(2, 32)) +
							(b[3] * Math.pow(2, 24)) + (b[2] * Math.pow(2, 16)) + (b[1] * Math.pow(2, 8)) + b[0];

			if (exponent === 1024) {
				if (mantissa !== 0) {
					return NaN;
				} else {
					return sign * Infinity;
				}
			}

			if (exponent === -1023) { // Denormalized
				return sign * mantissa * Math.pow(2, -1022 - 52);
			}

			return sign * (1 + mantissa * Math.pow(2, -52)) * Math.pow(2, exponent);

		},

		getFloat32: function (byteOffset, littleEndian) {

			var b = this._getBytes(4, byteOffset, littleEndian),

				sign = 1 - (2 * (b[3] >> 7)),
				exponent = (((b[3] << 1) & 0xff) | (b[2] >> 7)) - 127,
				mantissa = ((b[2] & 0x7f) << 16) | (b[1] << 8) | b[0];

			if (exponent === 128) {
				if (mantissa !== 0) {
					return NaN;
				} else {
					return sign * Infinity;
				}
			}

			if (exponent === -127) { // Denormalized
				return sign * mantissa * Math.pow(2, -126 - 23);
			}

			return sign * (1 + mantissa * Math.pow(2, -23)) * Math.pow(2, exponent);
		},

		getInt32: function (byteOffset, littleEndian) {
			var b = this._getBytes(4, byteOffset, littleEndian);
			return (b[3] << 24) | (b[2] << 16) | (b[1] << 8) | b[0];
		},

		getUint32: function (byteOffset, littleEndian) {
			return this.getInt32(byteOffset, littleEndian) >>> 0;
		},

		getInt16: function (byteOffset, littleEndian) {
			return (this.getUint16(byteOffset, littleEndian) << 16) >> 16;
		},

		getUint16: function (byteOffset, littleEndian) {
			var b = this._getBytes(2, byteOffset, littleEndian);
			return (b[1] << 8) | b[0];
		},

		getInt8: function (byteOffset) {
			return (this.getUint8(byteOffset) << 24) >> 24;
		},

		getUint8: function (byteOffset) {
			return this._getBytes(1, byteOffset)[0];
		}

	 };

}
