
/*
 * 
 * IJAX
 * 
 * Created By Marco Chiodo marcochio94@gmail.com
 * 
 * Version 0.7.3 Experimental at 26 July 2013
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
	transitionImageTop : 0,
	transitionImageLeft : 0,
	
	ajaxConfig : {
		timeCache : 0, // Millisecond
		type : 'get',
		timeout : 60000, // Millisecond
		force : false
	},
	
	eventsLoadFunctions : null,
	eventsSetFunctions :null,
	
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
	
	waitContainers : [],
	
	waitContainerDefault : {
		page : '',
		state : 0,
		image : ''
	},
	
	tail : [],
        
	
	/* Utility funcition */
	
	time : function(){
		return new Date().getTime();
	},
	
	resetWC : function( div ){
                this.waitContainers[div] = {};
		for( var i in this.waitContainerDefault )
			this.waitContainers[div][i] = this.waitContainerDefault[i];
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
	
	containerRequestState : function( div ){
		if( this.waitContainers[div].page == '' )
			return false;
		else
			return this.requestState( this.waitContainers[div].page );
	},
        
        requestContainerName : function( page ){
            var ret = [];
            for( var i in this.waitContainers )
               if( this.waitContainers[i].page == page )
                 ret.push( i );
            return ret;
        },
	
        updateAll : function( divToUpdate ){
          for( var i in divToUpdate )
            this.updateContainer( divToUpdate[i] );
        },
        
	getOpacity : function( div ){
	
		return $( '#'+div ).css("opacity");
		
	},
	
	loadMedia : function( str , page ){


		var els = $('*','<div>'+str+'</div>');
		
		var rgx = /background(-image)?(.*)?:(.*)?url\((.*)?['"]?(.*)["']?(.*)?\)/g;
		var url;
		var img = [];
                var divToUpdate = this.requestContainerName( page );
                var i;
                
		

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
							_this.events.success(null,page);
							_this.updateAll( divToUpdate );
							
						}
					},
					error: function (){
						++(_this.requests[page].imagesLoaded);
					}
				});
		}
		else{
			_this.requests[page].state = 3;
			_this.loadNext();
			_this.events.success();
			_this.updateAll( divToUpdate );
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
						_this.events.sourceLoaded(null,url);
						_this.loadMedia( data , url );
						_this.requests[url].expire = _this.time() + configuration.timeCache;

					},
					error: function (){
						_this.requests[url].state = 0;
						_this.events.error(null,url);
					}
				});
			}
			else
				this.tail.push( [url,parameters] );
		}

		
	},
	
	set : function ( div , page , data  ){
		
		this.resetWC( div );
		this.waitContainers[div].page = page;
		
		if( data != null){
			var image = data.image;
			var title = data.title;
			var url = data.url;
		}
		
		if( image == null )
			this.waitContainers[div].image = this.transitionImageSrc;
		else
			this.waitContainers[div].image = image;
						
		this.updateContainer( div );
		
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
	  
	sourceLoaded : function(f , element){
		if( f != null ){
			if( this._this.eventsLoadFunctions && this._this.eventsLoadFunctions[ element ])
	      		this._this.eventsLoadFunctions[ element ].sourceLoaded_function = f;
	      	else{
	      		this._this.eventsLoadFunctions = [];
	      		this._this.eventsLoadFunctions[ element ] = {};
	      		this._this.eventsLoadFunctions[ element ].sourceLoaded_function = f;
	      	}
	    }
	    else if( this._this.eventsLoadFunctions &&
	     		this._this.eventsLoadFunctions[ element ] &&
	      		this._this.eventsLoadFunctions[ element ].sourceLoaded_function )
		  			this._this.eventsLoadFunctions[ element ].sourceLoaded_function();
	},
	  
	success : function(f , element){
		if( f != null ){
			if( this._this.eventsLoadFunctions && this._this.eventsLoadFunctions[ element ] )
	      		this._this.eventsLoadFunctions[ element ].success_function = f;
	      	else{
	      		this._this.eventsLoadFunctions = [];
	      		this._this.eventsLoadFunctions[ element ] = {};
	      		this._this.eventsLoadFunctions[ element ].success_function = f;
	      	}
	    }
	    else if( this._this.eventsLoadFunctions &&
	     		this._this.eventsLoadFunctions[ element ] &&
	      		this._this.eventsLoadFunctions[ element ].success_function )
		  			this._this.eventsLoadFunctions[ element ].success_function();
	  },
	  
	  error : function(f , element){ 
		if( f != null ){
			if( this._this.eventsLoadFunctions && this._this.eventsLoadFunctions[ element ] )
	      		this._this.eventsLoadFunctions[ element ].error_function = f;
	      	else{
	      		this._this.eventsLoadFunctions = [];
	      		this._this.eventsLoadFunctions[ element ] = {};
	      		this._this.eventsLoadFunctions[ element ].error_function = f;
	      	}
	    }
	    else if( this._this.eventsLoadFunctions &&
	     		this._this.eventsLoadFunctions[ element ] &&
	      		this._this.eventsLoadFunctions[ element ].error_function )
		  			this._this.eventsLoadFunctions[ element ].error_function();
	  },
	  
	  endFirstTransition : function(f , element){ 
		if( f != null ){
			if( this._this.eventsSetFunctions && this._this.eventsLoadFunctions[ element ] )
	      		this._this.eventsSetFunctions[ element ].endFirstTransition_function = f;
	      	else{
	      		this._this.eventsSetFunctions = [];
	      		this._this.eventsSetFunctions[ element ] = {};
	      		this._this.eventsSetFunctions[ element ].endFirstTransition_function = f;
	      	}
	    }
	    else if( this._this.eventsSetFunctions &&
	     		this._this.eventsSetFunctions[ element ] &&
	      		this._this.eventsSetFunctions[ element ].endFirstTransition_function )
		  			this._this.eventsSetFunctions[ element ].endFirstTransition_function();
	  },

	  endSecondTransition : function(f , element){ 
		if( f != null ){
			if( this._this.eventsSetFunctions && this._this.eventsLoadFunctions[ element ] )
	      		this._this.eventsSetFunctions[ element ].endSecondTransition_function = f;
	      	else{
	      		this._this.eventsSetFunctions = [];
	      		this._this.eventsSetFunctions[ element ] = {};
	      		this._this.eventsSetFunctions[ element ].endSecondTransition_function = f;
	      	}
	    }
	    else if( this._this.eventsSetFunctions &&
	     		this._this.eventsSetFunctions[ element ] &&
	      		this._this.eventsSetFunctions[ element ].endSecondTransition_function )
		  			this._this.eventsSetFunctions[ element ].endSecondTransition_function();
	  }
	  
	},
	
	setImage : function( div ){
	
		
		if( this.waitContainers[div].image != '' ){
			var w = $( '#'+div ).width();
			var h = $( '#'+div ).height();
		
			var top = (h - this.transitionImageHeight) / 2;
			var left = (w - this.transitionImageWidth) / 2;
		
			$( '#'+div ).empty();
			$( '<div style="position:relative; width:100%; height:100%; margin:0; padding:0;"><div style="position:absolute; width:'+this.transitionImageWidth+'px; height:'+this.transitionImageHeight+'px; top:'+top+'px; left:'+left+'px; background:url(\''+this.transitionImageSrc+'\') -'+this.transitionImageLeft+'px -'+this.transitionImageTop+'px" /></div>' ).appendTo( '#'+div );
		}
		
	},
	
	
	updateContainer : function( div ){
		
		var _this=this;
                
		switch( this.waitContainers[div].state ){
			case 0:
				if( this.getOpacity( div ) != this.minOpacity ){
					this.waitContainers[div].state = 1;
					setTimeout( function(){_this.waitContainers[div].state=2;_this.events.endFirstTransition(null,div);} , this.timeFirstTransition + 30 );
					setTimeout( function(){_this.updateContainer(div);} , this.timeFirstTransition + 50 );
					$( '#'+div ).fadeTo( this.timeFirstTransition , this.minOpacity );
				}
				else{
					this.waitContainers[div].state = 2;
					this.updateContainer( div );
				}
			break;
			case 2:
				if( this.containerRequestState(div).state != 3 ){
					$( '#'+div ).css("opacity",this.maxOpacity);
					if( this.transitionImageSrc != -1 )
						this.setImage(div);
				}
				else{
					$( '#'+div ).css("opacity",this.minOpacity);
					$( '#'+div ).empty();
				
					element = $( this.containerRequestState(div).response );
					element.appendTo( '#'+div );
					
					setTimeout( function(){_this.events.endSecondTransition(null,div);} , this.timeSecondTransition + 30 );
					$( '#'+div ).fadeTo( this.timeSecondTransition , this.maxOpacity );
					this.resetWC(div);
				}
			break;
			
		}
		
	}
	

	
}
