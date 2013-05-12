
/*
 * 
 * IJAX
 * 
 * Created By Marco Chiodo marcochio94@gmail.com
 * 
 * Version 0.5 Prototype at 11 May 2013
 * 
 * 
 * */

ijax = {
	
	/* Configuration */
	
	timeFirstTransition : 500,
	timeSecondTransition : 500,
	minOpacity : 0.1,
	maxOpacity : 1,
	transitionImageSrc : 'loading.gif',
	transitionImageWidth : 308,
	transitionImageHeight : 181,
	transitionImageTop : 100,
	transitionImageLeft : 100,
	
	ajaxConfig : {
		timeCache : 120000, // Millisecond
		type : 'get',
		timeout : 60000, // Millisecond
		force : false
	},
	
	success_function : '',
	error_function : '',
	first_transition_function : '',
	second_transition_function : '',
	
	/* Array of class */
	
	requests : [],
	
	requestDefault : {
		state : 0,
		response : '',
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
	

	load : function( url , parameters ){
	//	var thisClassName = this.thisClassName;
		
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
			$.ajax({
				url: url,
				cache: false,
				type : configuration.type,
				tiemout : configuration.timeout,
				success:function( data ){
					_this.requests[url].state = 2;
					_this.requests[url].response = data;
					_this.requests[url].expire = _this.time() + configuration.timeCache;
					_this.events.success();
					_this.updateContainer();
				},
				error: function (){
					_this.requests[url].state = 0;
					_this.events.error();
				},
			});
		}

		
	},
	
	set : function ( div , page , data  ){
		
		this.resetWC();
		this.waitContainer.div = div;
		this.waitContainer.page = page;
		
		var image = data.image;
		var title = data.title;
		var url = data.url;
		
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
				if( this.containerRequestState().state != 2 ){
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
