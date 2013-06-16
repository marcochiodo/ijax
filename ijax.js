
/*
 * 
 * IJAX
 * 
 * Created By Marco Chiodo marcochio94@gmail.com
 * 
 * Version 0.7 Experimental at 16 June 2013
 * 
 * 
 * */

ijax = {
	
	/* Configuration */
	
	timeFirstTransition : 700,
	timeSecondTransition : 700,
	minOpacity : 0.1,
	maxOpacity : 1,
	transitionImageSrc : '',
	transitionImageWidth : 308,
	transitionImageHeight : 181,
	transitionImageTop : 100,
	transitionImageLeft : 100,
	
	ajaxConfig : {
		timeCache : 0, // Millisecond
		type : 'get',
		timeout : 60000, // Millisecond
		force : false
	},
	
	success_function : '',
	sourceLoaded_function : '',
	error_function : '',
	first_transition_function : '',
	second_transition_function : '',
	
	/* Array of class */
	
	requests : [],
	
	requestDefault : {
		state : 0,
		response : '',
		images : [],
		imagesLoaded : 0,
		expire : 0
	},
	
	currentRequest : '',
	
	waitContainer : {},
	
	waitContainerDefault : {
		div : '',
		page : '',
		state : 0,
		image : ''
	},
	
	tail : [],
        
	
	/* Utility funcition */
	
	time : function(){
		return new Date().getTime();
	},
	
	resetWC : function(){
		for( var i in this.waitContainerDefault )
			this.waitContainer[i] = this.waitContainerDefault[i];
	},
	
	resetR : function( url ){
		this.requests[url]={};
		for( var i in this.requestDefault )
			this.requests[url][i] = this.requestDefault[i];
	},
	
	isLoading : function(){
		var is = false;
		for( var i in this.requests )
			if( this.requests[i].state == 1 ){
				is = true;
				break;
			}
		return is;		
	},
	
	loadNext : function(){
		for( var i in this.tail )
			if( this.tail[i] != -1 ){
				this.load( this.tail[i][0] , this.tail[i][1] );
				this.tail[i] = -1;
				break;
			}
	},
	
	requestState : function ( request ){
		if( this.requests[ request ] )
			return this.requests[ request ];
		else
			return false;
	},
	
	containerRequestState : function(){
		if( this.waitContainer.page == '' )
			return false;
		else
			return this.requestState( this.waitContainer.page );
	},
	
	getOpacity : function( div ){
	
		return $( '#'+this.waitContainer.div ).css("opacity");
		
	},
	
	loadMedia : function( str , page ){


		var els = $('*','<div>'+str+'</div>');
		
		var rgx = /background(-image)?(.*)?:(.*)?url\((.*)?['"]?(.*)["']?(.*)?\)/g;
		var url;
		var img = [];
		

		while( (url=rgx.exec(str)) !== null ){
			url = url[4];
			while( url[0] && (url[0]==' ' || url[0]=='\'' || url[0]=='"') )
				url = url.substr( 1 );
			while( url[0] && (url[ url.length-1]==' ' || url[ url.length -1]=='\'' || url[ url.length -1]=='"') )
				url = url.substr( 0 , url.length-1 );
			img.push( url )
		}

		for(var i in els)
			if( els[i] && els[i].tagName )
				if( els[i].tagName.toLowerCase() == 'img' )
					img.push( url )

		/*for( var i in img )
			var imgLoad=document.createElement('img').src = img[i];*/
			
		this.requests[page].images = img;
		var numImg = img.length;
		var _this = this;
		
		if( numImg > 0 ){
			for( var i in img )
				$.ajax({
					url: img[i],
					cache: false,
					type : 'get',
					//tiemout : configuration.timeout,
					complete:function(){
						
						++(_this.requests[page].imagesLoaded);
						if( _this.requests[page].imagesLoaded == numImg ){
							
							_this.requests[page].state = 3;
							_this.loadNext();
							_this.events.success();
							_this.updateContainer();
							
						}
					},
					error: function (){
						++(_this.requests[page].imagesLoaded);
					},
				});
		}
		else{
			_this.requests[page].state = 3;
			_this.loadNext();
			_this.events.success();
			_this.updateContainer();
		}
	},

	load : function( url , parameters ){
		
		if( parameters == null ) parameters = {};
		
		var configuration = {};
		for( var i in this.ajaxConfig )
			if( parameters[i] )
				configuration[i] = parameters[i];
			else
				configuration[i] = this.ajaxConfig[i];
		
		if( !this.requests[url] )
			this.resetR( url );

		var _this = this;

		if( this.requests[ url ].expire <= this.time() || configuration.force == true ){
			this.resetR( url );
			if( ! this.isLoading() ){
				this.requests[url].state = 1;
				$.ajax({
					url: url,
					cache: false,
					type : configuration.type,
					tiemout : configuration.timeout,
					success:function( data ){
						_this.requests[url].state = 2;
						_this.requests[url].response = data;
						_this.events.sourceLoaded();
						_this.loadMedia( data , url );
						_this.requests[url].expire = _this.time() + configuration.timeCache;

					},
					error: function (){
						_this.requests[url].state = 0;
						_this.events.error();
					},
				});
			}
			else
				this.tail.push( [url,parameters] );
		}

		
	},
	
	set : function ( div , page , data  ){
		
		this.resetWC();
		this.waitContainer.div = div;
		this.waitContainer.page = page;
		
		if( data != null){
			var image = data.image;
			var title = data.title;
			var url = data.url;
		}
		
		if( image == null )
			this.waitContainer.image = this.transitionImageSrc;
		else
			this.waitContainer.image = image;
						
		this.updateContainer();
		
		if( url != null )
			window.history.replaceState( {} , '' , url );
			
		if( title != null ){
			if( $('head title').text() == '' ){
				$('title').remove();
				$('<title>'+title+'</title>').appendTo( 'head' );
			}
			else
				$('title').text( title );
		}
		
	},
	
	events : {
	  
	  _this : this,
	  
	sourceLoaded : function(f){
	    if( f != null )
	      this._this.sourceLoaded_function = f;
	    else if( this._this.sourceLoaded_function )
		  this._this.sourceLoaded_function();
	},
	  
	success : function (f){
	    if( f != null )
	      this._this.success_function = f;
	    else if( this._this.success_function )
		  this._this.success_function();
	  },
	  
	  error : function (f){ 
	    if( f != null )
	      this._this.error_function = f;
	    else if( this._this.error_function )
		  this._this.error_function();
	  },
	  
	  endFirstTransition : function (f){ 
	    if( f != null )
	      this._this.first_transition_function = f;
	    else if( this._this.first_transition_function )
		  this._this.first_transition_function();
	  },

	  endSecondTransition : function (f){ 
	    if( f != null )
	      this._this.second_transition_function = f;
	    else if( this._this.second_transition_function )
		  this._this.second_transition_function();
	  },
	  
	},
	
	setImage : function(){
	
		
		if( this.waitContainer.image != '' ){
			var w = $( '#'+this.waitContainer.div ).width();
			var h = $( '#'+this.waitContainer.div ).height();
		
			var top = (h - this.transitionImageHeight) / 2;
			var left = (w - this.transitionImageWidth) / 2;
		
			$( '#'+this.waitContainer.div ).empty();
			$( '<div style="position:relative; width:100%; height:100%; margin:0; padding:0;"><div style="position:absolute; width:'+this.transitionImageWidth+'px; height:'+this.transitionImageHeight+'px; top:'+top+'px; left:'+left+'px; background:url(\''+this.transitionImageSrc+'\') -'+this.transitionImageLeft+'px -'+this.transitionImageTop+'px" /></div>' ).appendTo( '#'+this.waitContainer.div );
		}
		
	},
	
	
	updateContainer : function(){
		
		var _this=this;
		
		switch( this.waitContainer.state ){
			case 0:
				if( this.getOpacity( this.waitContainer.div ) != this.minOpacity ){
					this.waitContainer.state = 1;
					setTimeout( function(){_this.waitContainer.state=2;_this.events.endFirstTransition();} , this.timeFirstTransition + 30 );
					setTimeout( function(){_this.updateContainer();} , this.timeFirstTransition + 50 );
					$( '#'+this.waitContainer.div ).fadeTo( this.timeFirstTransition , this.minOpacity );
				}
				else{
					this.waitContainer.state = 2;
					this.updateContainer();
				}
			break;
			case 2:
				if( this.containerRequestState().state != 3 ){
					$( '#'+this.waitContainer.div ).css("opacity",this.maxOpacity);
					if( this.transitionImageSrc != -1 )
						this.setImage();
				}
				else{
					$( '#'+this.waitContainer.div ).css("opacity",this.minOpacity);
					$( '#'+this.waitContainer.div ).empty();
				
					element = $( this.containerRequestState().response );
					element.appendTo( '#'+this.waitContainer.div );
					
					setTimeout( function(){_this.events.endSecondTransition();} , this.timeSecondTransition + 30 );
					$( '#'+this.waitContainer.div ).fadeTo( this.timeSecondTransition , this.maxOpacity );
					this.resetWC();
				}
			break;
			
		}
		
	}
	

	
}
