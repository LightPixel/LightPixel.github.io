DVSJS.WorldLoader=function(){
	
	this.baseUrl  ='';
	this.WorldXml =null;
    this.scene = null;
    //this.matlist= new Array();
    this.mtlLoader = new DVSJS.MaterialLoader();	

	this.loadFile=function(filecontent, filename,dvs3d){
		this.scene = dvs3d.scene;

		var xmlParser = new DOMParser();
		this.WorldXml = xmlParser.parseFromString(filecontent, "application/xml" );
		
		//get relative path
		if ( filename !== undefined ) {
		var parts = filename.split( '/' );
		parts.pop();
		this.baseUrl = ( parts.length < 1 ? '.' : parts.join( '/' ) ) ;
		//console.log('relative path:'+this.baseUrl);
		}

		//parse content
		this.parseMaterial(dvs3d);//console.log(dvs3d);
		this.parseCamera(dvs3d);
		this.parseEditor(dvs3d);

		return this.baseUrl;
	};

	this.parseMaterial=function(dvs3d){
		var materials = this.WorldXml.querySelectorAll('materials library');
		for ( var i = 0; i < materials.length; i++ ) {
		var element = materials[i];
        var mtlUrl = this.baseUrl+element.textContent;
		console.log('mtl file:'+mtlUrl);
		//var mtlLoader = new DVSJS.MaterialLoader();	
		this.mtlLoader.loadFile(this.baseUrl,mtlUrl);
		
		}

		//test
		//var material = new THREE.MeshBasicMaterial( {color:0xddddddd,side:2,shininess:16} );
		//var Cube = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), material);				 
					
		//dvs3d.scene.add(Cube);
		//console.log(dvs3d);


	};

	this.parseCamera=function(dvs3d){
		var camera = this.WorldXml.querySelectorAll('camera');	
		for ( var i = 0; i < camera.length; i ++ ) {
			var child = camera[ i ];
			if(child.nodeName == 'camera'){	
				var position = child.getAttribute( 'transform' );
				if ( position ) {
					var pos = new  Float32Array(16);				
					pos = position.split(' ');
					//console.log('camera pos:'+pos[0].toString()+pos[1].toString()+pos[2].toString());	

					dvs3d.camera.position.set(pos[12],pos[13],pos[14]); 
				}

				var direction = child.getAttribute( 'direction' );
				if ( direction ) {
					var pos = new  Float32Array(3);				
					pos = direction.split(' ');
					//console.log('camera dir:'+pos[0].toString()+pos[1].toString()+pos[2].toString());				
					dvs3d.camera.lookAt(new THREE.Vector3(-0.896369, 0.135612, -0.422057));			
				}
			}
		}	
	};

	this.parseEditor = function(dvs3d) {
		var editors = this.WorldXml.getElementsByTagName('editor');
	
		for ( var i = 0; i < editors.length; i ++ ) {
			var editor = editors[ i ];			
			for (var j = 0; j < editor.childNodes.length; j++) {
				var nodeXml = editor.childNodes[j];
				if(nodeXml.nodeName == 'node'){
					//this.parseNode(dvs3d,nodeXml);
					var node = this.parseNode(dvs3d,nodeXml);
					dvs3d.scene.add(node);
					//console.log(node);
				}					
			}
		}
	};

	this.parseNode = function(dvs3d,nodeXml,parent) {
		
		var node;
		var meshList = new Array();
        var mtlList  = new Array();
		//console.log(node.childNodes.length);
		//console.log(nodeXml.nodeName);
		var name = nodeXml.getAttribute( 'name' );
		var type = nodeXml.getAttribute( 'type' );
		switch(type){
			case 'NodeDummy':
				console.log(type);
				node = new THREE.Object3D();				
				node.name = name;
				if(parent != undefined)
					parent.add(node);				
				break;

			case 'ObjectMesh':
				console.log(type);
				node = new THREE.Object3D();				
				node.name = name;
				if(parent != undefined)
					parent.add(node);	
				break;
		}
		//先把材质读取一遍
		for (var i = 0; i < nodeXml.childNodes.length; i++) {
			if(nodeXml.childNodes[i].nodeName == 'surface')
			{				
				var surfaceXml = nodeXml.childNodes[i];
				var name = surfaceXml.getAttribute( 'name' );
				var mtlName = surfaceXml.getAttribute( 'material' );				
			    var mtl = this.getMtl(mtlName);
			    
			    //console.log('nodeName:'+node.name);
			    //console.log(mtlList.length);
			    
			    //console.log(mtl.color);
			    //console.log('nodeName:'+node.name);
			   // console.log('sarName:'+name);
			    //console.log('sarMtlName:'+mtlName);
			    //console.log('MtlColr:'+mtl.color.r.toString()+mtl.color.g.toString()+mtl.color.b.toString());
				for (var j = 0; j < surfaceXml.childNodes.length; j++){
					if(surfaceXml.childNodes[j].nodeName == 'material')
					{	
						var mtlXml = surfaceXml.childNodes[j];
						this.parseSurfaceMtl(mtl,mtlXml);
					}
				}

				mtlList.push(mtl);
			}		
		};

		for (var i = 0; i < nodeXml.childNodes.length; i++) {

			if(nodeXml.childNodes[i].nodeName == 'node')
			{	
				//console.log(node.childNodes[i].nodeName);
				this.parseNode(dvs3d,nodeXml.childNodes[i],node);
			}
			else if(nodeXml.childNodes[i].nodeName == 'transform')
			{
				//console.log(nodeXml.childNodes[i].textContent);
				var pos = new  Float32Array(16);				
				pos = nodeXml.childNodes[i].textContent.split(' ');
				var mat4 = new THREE.Matrix4();		
				mat4.set(pos[0],  pos[4],  pos[8],  pos[12], 
						 pos[1],  pos[5],  pos[9],  pos[13], 
						 pos[2],  pos[6],  pos[10], pos[14], 
						 pos[3],  pos[7],  pos[11], pos[15]);
				if(node != undefined)
					node.applyMatrix(mat4);
			}	
			else if(nodeXml.childNodes[i].nodeName == 'mesh')
			{
				//mesh file
				var meshFile = this.baseUrl+'/'+nodeXml.childNodes[i].textContent;
                
				//mesh
				var dvsMesh = new DVSJS.MeshLoader();
				//var mtl= me.mtlList;
				console.log(meshFile);
				//console.log(mtlList[0].name); 
				dvsMesh.addEventListener( 'load', function ( event) {
					var geometry = event.content;				                
					for (var j = 0; j < geometry.length; j++) {										
						var material = new THREE.MeshPhongMaterial( {side:2,shininess:31 } ); 
						material.color =  new THREE.Color(0.3,0.3,0.3);							
						material.specular =  new THREE.Color(0.5,0.5,0.5); 						
						        		
                    	var mesh = new THREE.Mesh(geometry[j], mtlList[j] );						
						
						node.add(mesh);
						meshList[j]= mesh;					
					};					
				} );

				dvsMesh.load(meshFile);									
			}					
		};
	     
	    return node;
	};

	this.parseSurfaceMtl= function(material,surMtlXml){		
		for (var i = 0; i < surMtlXml.childNodes.length; i++) {
			var parameter = surMtlXml.childNodes[i];
			if(parameter.nodeName == 'parameter'){
				switch(parameter.getAttribute('name')){
					case 'diffuse_color':
						var color =  new Float32Array(4);
						color = parameter.textContent.split(' ');
						material.color = new THREE.Color( color[0], color[1], color[2] );
						material.opacity =color[3];
					    // console.log('asa:'+parameter.textContent);
					break;					
				}
			}
			else if(parameter.nodeName == 'texture'){
				switch(parameter.getAttribute('name')){
					case 'diffuse':							
						var image = this.baseUrl +'/'+parameter.textContent;						
						var texture = THREE.ImageUtils.loadTexture(image);						
						material.map = texture;					   
					break;	
					case 'reflection':
						var image = this.baseUrl +'/'+parameter.textContent;
						var loader = new THREE.DDSLoader();				
				  		var textureCube = loader.load( image);
				  		material.envMap = textureCube;
					break;				
				}
			}
			else if(parameter.nodeName == 'blend'){
				if(parameter.getAttribute('src') == 'src_alpha' &&
					parameter.getAttribute('dest') == 'one_minus_src_alpha'){
						material.transparent = true;				   			
				}
			}
		}
	};

	this.getMtl = function(name){
		var mtlList = this.mtlLoader.getMtl();		
		for (var i = 0; i < mtlList.length; i++) {
				if(mtlList[i].name == name)
					return mtlList[i].clone();
			};

		var mtl = new THREE.MeshPhongMaterial( {side:2,shininess:31 } ); 
		return mtl;
	}

	this.updata = function(){			

	};
};