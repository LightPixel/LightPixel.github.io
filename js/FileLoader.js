
DVSJS.FileLoader = function(filetoload)
{
	this.FileToLoad = filetoload;
	this.xmlhttp = false;
	
	// init xmlhttp

	if (!this.xmlhttp && typeof XMLHttpRequest != 'undefined') 
	{
		try 
		{
			this.xmlhttp = new XMLHttpRequest();		
		} catch (e) 
		{
			this.xmlhttp = false;
		}
	}
	
	if (!this.xmlhttp && window.createRequest) 
	{
		try 
		{
			this.xmlhttp = window.createRequest();			
		}
		catch (e) 
		{
			this.xmlhttp = false;
		}
	}
	
	// functions
	
	this.load = function(functionCallBack)
	{
		if (this.xmlhttp == false)
		{
			console.log("Your browser doesn't support AJAX");
			return;
		}
		
		var me = this;
		
		try
		{   
			this.xmlhttp.open("GET", this.FileToLoad);
			this.xmlhttp.send(null);
		}
		catch(e)
		{
			console.log("Could not open file " + this.FileToLoad + ": " + e.message);
			
			// chrome doesn't allow loading local files anymore, check if this was the case
			var browserVersion = navigator.appVersion; 
			if (browserVersion != null && browserVersion.indexOf('Trident') != -1)
				console.log("<i>Use a web server to run files in IE. Or start them from CopperCube.</i>", true);
			return;
		}

		function onloaded( event ) {
			if ( event.target.status === 200 || event.target.status === 0 ) {				
				if(functionCallBack)
					functionCallBack(me.xmlhttp.response||me.xmlhttp.responseText); 
			}
		}

		this.xmlhttp.addEventListener( 'load', onloaded, false );
	};
	
	// abort function
	this.abort = function()
	{
		try
		{
			this.xmlhttp.abort();
		}
		catch(e)
		{
			console.log("Could not abort " + me.FileToLoad); 
		}
	}
	
};
