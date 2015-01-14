var DVSJS = {REVISION : '1.0'};


var DVS3D = function(filetoload)
{    
	this.world = new DVSJS.WorldLoader();
	this.scene = new THREE.Scene();
	this.camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 6000 );
	this.camera.up.set(0,0,1);
	this.controls = new DVSJS.CameraControls(this.camera );
	
	//default light
	this.directionalLight = new THREE.DirectionalLight( 0x505050, 3);	
	this.directionalLight.position.set(14.01, -2.227, 9.183);
	this.directionalLight.lookAt(new THREE.Vector3(-0.896, 0.136, -0.422));			
	this.scene.add( directionalLight );


				

	var renderer = new THREE.WebGLRenderer( { antialias: true } );
		renderer.setSize( window.innerWidth, window.innerHeight );
		renderer.setClearColor( new THREE.Color("rgb(69,69,69)"), 1.0);	

    container = document.createElement( 'div' );
	document.body.appendChild( container );
	container.appendChild( renderer.domElement );

	window.addEventListener( 'resize', resizeWindow, false );
    
    load(filetoload,this);
    animate();

	function update(){
		this.controls.update();	
		this.scene.updateMatrixWorld(); 
	    this.directionalLight.lookAt(this.camera.lookAt); 
	    this.directionalLight.position.set(this.camera.position.x,this.camera.position.y,this.camera.position.z);
	}

	function render (){
		update();
    	
    	renderer.autoClear = false;
   	 	renderer.clear();
    	renderer.render(this.scene, this.camera);
	}

	function animate (){
		requestAnimationFrame(animate);	    
	    render(); 
	}

	function resizeWindow() {
		this.camera.aspect = window.innerWidth / window.innerHeight;
	    this.camera.updateProjectionMatrix();
	    this.controls.handleResize();

	    // resize viewport width and height
	    renderer.setSize(window.innerWidth, window.innerHeight);   
	    render();
	}

	function parseFile(filecontent, filename,dvs3d){
		console.log('wrold file:'+filename);
		
		
		var tex = this.world.loadFile(filecontent,filename,dvs3d);		
	};



	function load(filetoload,dvs3d){
		
		//this.LoadingAFile = true;
		var l = new DVSJS.FileLoader(filetoload);
		l.load(function(p){parseFile(p, filetoload,dvs3d);});		
		
		return true;
	};
	
};









