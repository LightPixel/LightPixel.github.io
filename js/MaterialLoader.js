DVSJS.MaterialLoader=function(){
	this.baseUrl  ='';
	this.MaterialXml=null;
    this.mtlList = new Array();
    
    this.getMtl = function()
    {
    	return this.mtlList;
    };

	this.loadFile=function(baseUrl, filename){		 
		var me = this;
		this.baseUrl = baseUrl;
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open("Get",filename,false);
		xmlhttp.send(null);
		
		if (xmlhttp.readyState == 4) {
 			//console.log(xmlhttp.responseText);
 			me.parseFile(xmlhttp.responseText, filename);
		}		
	};

	this.parseFile=function(filecontent, filename)
	{
		var xmlParser = new DOMParser();
		this.MaterialXml = xmlParser.parseFromString(filecontent, "application/xml" );
		
		var materials = this.MaterialXml.childNodes[0];

		for (var i = 0; i < materials.childNodes.length; i++) {
			var mtlXml = materials.childNodes[i];
		 
			if(mtlXml.nodeName == 'material')
			{
				/*var mtl = new THREE.MeshPhongMaterial();
				
				mtl.name = mtlXml.getAttribute('name');
				if(mtl.name =='dvs_transparent'){
					mtl.transparent = true;
				   	mtl.opacity = 0.5;
				}
				else if(mtlXml.getAttribute('parent') == 'dvs_transparent')
				{
					mtl.transparent = true;
				   	mtl.opacity = 0.5;
				}*/

				var parentName = mtlXml.getAttribute('parent')
				var mtl = this.getDefaultMtl(this.baseUrl,dvsMat[parentName]);
				mtl.name = mtlXml.getAttribute('name');

				for (var j = 0; j < mtlXml.childNodes.length; j++) {
					var parameter = mtlXml.childNodes[j];
					if(parameter.nodeName == 'parameter'){
						switch(parameter.getAttribute('name'))
						{
						case 'diffuse_color':
							var color =  new Float32Array(4);
							color = parameter.textContent.split(' ');
							mtl.color = new THREE.Color( color[0], color[1], color[2] );
							mtl.opacity =color[3];
					     	//console.log(parameter.textContent);
						break;					
						}
					}
					else if(parameter.nodeName == 'texture'){
						switch(parameter.getAttribute('name'))
						{
						case 'diffuse':							
							var image = this.baseUrl +'/'+parameter.textContent;							
							mtl.map = THREE.ImageUtils.loadTexture(image);
					     	console.log(image);					     	
						break;	
						case 'reflection':
							var image = this.baseUrl +'/'+parameter.textContent;
							var loader = new THREE.DDSLoader();				
				  			var textureCube = loader.load( image);
				  			mtl.envMap = textureCube;
						break;				
						}

					}
					else if(parameter.nodeName == 'blend'){
						if(parameter.getAttribute('src') == 'src_alpha' &&
						   parameter.getAttribute('dest') == 'one_minus_src_alpha'){
						   	mtl.transparent = true;				   			
						}
					}
				}
			
				this.mtlList.push(mtl);
			}
		}
		
		return this.mtlList;
	};

	this.getDefaultMtl=function(baseUrl,matObj){
		var mtl = new THREE.MeshPhongMaterial({side:2,shininess:16 });	
		var loader = new THREE.DDSLoader();
		var texPath = baseUrl +'/textures/';
		for (var key in matObj)
		{
			switch(key){
				case 'transparent':
					mtl.transparent = matObj[key];
				break; 
				case 'opacity':
					mtl.opacity = matObj[key];
				break;
				case 'color':
					mtl.color = matObj[key];
				break;
				case 'map':                						  		
					mtl.map = loader.load(texPath+ matObj[key]);
				break;
				case 'envMap':
					mtl.envMap = loader.load(texPath+ matObj[key]);
				break;
			}
    	}
       return mtl;	
	}
};