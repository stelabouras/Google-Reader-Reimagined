var RequestData = {

	'count' : {
		'important'	: 0,
		'rest'		: 0
	},
	'intervalT'	: 60000,
	'loading'	: false,
	
	send : function() {
		
		this.interval = this.interval || setInterval (function() {
			
			if(RequestData.loading)
				return;
			
			if(App.screen.get() != 2)
				return;
				
			RequestData.send();
			
		}, this.intervalT);
		
		this.loading = true;
	
		$('#loader').show();
		$('#loader').html("Loading&hellip;");
		$('#loader').toggleClass('loading');
				
		$.ajax({
			type	: "POST",
			url		: App.ajaxUrl + "/tools/ajaxMethods.php",
			data	: "action=request&auth=" + App.auth.get() + "&termArray=" + localStorage.terms,
			dataType: "json",

		   	success	: function(result){

				$('#loader').toggleClass('loading');
				$('#loader').html("Refresh");
				
				RequestData.loading = false;
				
		   		if(result.errorCode)
		   			return;

				RequestData.build(result.important, 1);
				RequestData.build(result.rest, 0);
				
				RequestData.updateCounts();
		   	}
		});		
	},
	
	findPrevious : function(count, isImportant) {
		
		var element = false;
		
		$.each($('#' + (isImportant ? 'important' : 'rest' ) + '-terms li.cluster'), function() {
		
			if(element !== false)
				return;
				
			if($(this).data('order') <= count)
				element = this;
		});
		
		return element;
	},
	
	build : function(data, isImportant) {
		
		if(data.length == 0) {
			
			if(isImportant)
				$('#important-placeholder').html('<h2>No important terms found!</h2>').show();
			else
				$('#rest-placeholder').html('<h3>No rest terms found!</h3>').show();
			
			return;
		}
			
		if(isImportant)
			$('#important-placeholder').hide();
		else
			$('#rest-placeholder').hide();
			
		$.each(data, function() {

			var count 	= this.count;
			var uid		= this.md5term;
			
			if($('#' + uid).length == 0) {
			
				var html 	= [];

				html.push('<li data-order=\"' + count + '\" class=\"cluster\" id=\"' + uid + '\">');
				
				if(isImportant)
					html.push('<h2>');
				else
					html.push('<h3>');
					
				html.push('<span onclick="RequestData.toggleItems(\'' + uid + '\');">');
				html.push($.trim(this.term));
				html.push(' <em class="badge">' + count + '</em>');
				html.push('</span>');

				html.push('<span ' + (!isImportant ? 'style="display:none;"' : '') + ' class="read" onclick="RequestData.markAllAsRead($(this));" title="Mark all as read">✔✔✔</span>');
				
				if(isImportant)
					html.push('</h2>');
				else
					html.push('</h3>');

				html.push('<ul class="newsitems" ' + (!isImportant ? 'style="display:none;"' : '') + '></ul>');
				html.push('</li>');

				var previous = RequestData.findPrevious(count, isImportant);
				
				if(previous === false)
					$('#' + (isImportant ? 'important' : 'rest') + '-terms').append(html.join(''));
				else
					$(previous).before(html.join(''));
					
				if(isImportant)
					RequestData.count.important++;
				else
					RequestData.count.rest++;
			}
			
			var ul 	= $('#' + uid + ' ul')[0];
						
			$.each(this.items, function(key, element) { 

				if($('#term-' + uid + '-' + key).length == 0) {
					
					var html = [];
				
					html.push('<li data-id=\"' + this.id + '\" data-streamid=\"' + this.streamId + '\" id=\"term-' + uid + '-' + key + '\">');
					html.push('<a target=\"_blank\" href=\"' + this.link + '\">');
					html.push(this.title);
					html.push('</a>');
					html.push('<span class="read" onclick="RequestData.markAsRead($(this));" title="Mark as read">✔</span>');
					html.push('</li>');
				
					$(ul).append(html.join(''));
				}
			});
			
			var em = $('#' + this.uid + ' em.badge')[0];
			
			$(em).html(count);
		});		
	},
	
	markAllAsRead : function(element) {
	
		var cluster = $(element).parent().parent();
		
		var newsItems = $(cluster).find('.newsitems  li .read');
		
		$(element).html('&hellip;');
		
		$.each(newsItems, function() { RequestData.markAsRead($(this)); });
	},
	
	markAsRead : function(element) {
		
		var parent		= $(element).parent();
		
		$(element).html('&hellip;')
		
		var id 			= $(parent).data('id');
		var streamId 	= $(parent).data('streamId');
		
		this.loading = true;

		$.ajax({
			type	: "POST",
			url		: App.ajaxUrl + "/tools/ajaxMethods.php",
			data	: "action=markAsRead&auth=" + App.auth.get() + "&id=" + id + "&streamId=" + streamId,
			dataType: "json",

		   	success	: function(result){
					
				RequestData.loading = false;
				
				if(result == 1)
					RequestData.removeNewsItem(id);
		   	}
		});
	},
	
	removeNewsItem : function(id) {
		
		$.each($('#container li[data-id="' + id + '"]'), function() { 
			
			var cluster		= $(this).parent().parent();
			var isImportant	= ($(cluster).parent().attr('id').split(/-/)[0] == "important");

			var badge		= (isImportant ? $(cluster).find('h2 em') : $(cluster).find('h3 em'));
			var badgeNum	= parseInt($(badge).html());

			if(badgeNum == 1) {
				
				if(isImportant)
					RequestData.count.important--;
				else
					RequestData.count.rest--;
				
				RequestData.updateCounts();
				
				$(cluster).remove();
				
				if($('#' + (isImportant ? 'important' : 'rest') + '-terms .cluster').length == 0) {

					if(isImportant)
						$('#important-placeholder').html('<h2>No important terms found!</h2>').show();
					else
						$('#rest-placeholder').html('<h3>No rest terms found!</h3>').show();
				}
				
				return;
			}

			$(this).remove(); 
			$(badge).html(badgeNum -1);
		});
	},
	
	updateCounts : function() { $('#loader').html("Refresh (" + this.count.important + "/" + this.count.rest + ")"); },
	
	toggleItems : function(uid) {
		
		var ul 	= $('#' + uid + ' ul')[0];	
		
		if(!ul)
			return;
			
		if($(ul).is(":hidden")) {
			
			$($('#' + uid).find('h3 .read')[0]).show();
			
			$(ul).show();
			
		} else {
			
			$($('#' + uid).find('h3 .read')[0]).hide();
			
			$(ul).hide();
		}
	}
};

var App = {
	
	'ajaxUrl' : '/greader', //Change this to the folder name of the project, leave it black if it's in the root dir
	
	initialize : function() { 
		
		if (typeof(localStorage) == 'undefined') {

			alert('Local storage is required for this app, please upgrade your browser!');
			
			return false;	
		}
		
		this.setupEvents(); 

		Terms.build();
			
		if(!this.auth.get())
			this.screen.set(0);
		else
			this.screen.set(2);
	},
	
	setupEvents : function() {
		
		$('#setterms').bind('click', function() { App.screen.set(1); });	
		$('#logout').bind('click', function() 	{ App.disconnect(); });
		
		$('#term-text').bind('keydown', function(event) {
		
			if(event.keyCode == 13) {
				
				Terms.toggle($(this).val());
				$(this).val('');
			}
		});
		
		$('#submit-terms').bind('click', function() {
			
			Terms.set();
			App.screen.set(2);
		});
		
		$('#loader').bind('click', function() {
		
			if(RequestData.loading)
				return;
				
			clearInterval(RequestData.interval);
			RequestData.interval = false;
			
			RequestData.send();
		});
		
		$('#loginform').bind('submit', function() {

			var username = $('#username').val();
			var password = $('#password').val();
		
			if(username == '' || password == '') {
				
				alert('Please enter your username and password');
				return;
			}
			
			$('#loader').show();
			$('#loader').html("Loading...");
			$('#loader').toggleClass('loading');				
			
			$.ajax({
				type	: "POST",
				url		: App.ajaxUrl + "/tools/ajaxMethods.php",
				data	: "action=login&username=" + username + '&password=' + password,
				dataType: "json",

			   	success	: function(result){

					$('#loader').toggleClass('loading');
					$('#loader').hide();

			   		if(result.errorCode) {
				
						alert('Error, try again!');
			   			return;
					}
					
					App.auth.set(result.auth);
					App.screen.set(1);
			   	}
			});			
		
			return false;
		});
	},
	
	disconnect : function() {
			
		this.auth.set('');
		this.screen.set(0);		
	},
	
	screen : {
	
		set : function(screenNumber) {

			this.activeScreen = screenNumber;
			
			$.each($('.screen'), function() { $(this).hide(); });

			$('#screen-' + screenNumber).show();

			$('#loader').hide();

			if(screenNumber > 0)
				$('#logout').show();
			else
				$('#logout').hide();

			if(screenNumber == 2) {
		
				$('#setterms').show();		
				RequestData.send();
				
			} else
				$('#setterms').hide();
		},
		
		get : function() { return this.activeScreen; }
	},
	
	auth : {
		
		set : function(auth) { localStorage.setItem("auth", auth); },
		
		get : function() {

			var auth = (localStorage.auth !== undefined && localStorage.auth !== null ? localStorage.auth : '');

			if(auth == '')
				return false;

			return auth;
		}
	}
};

var Terms = {

	termArray : [],
	
	build : function() {
			
		this.terms = (localStorage.terms !== undefined && localStorage.terms !== null && localStorage.terms != '' ? JSON.parse(localStorage.terms) : new Array());
		
		$('#terms-cloud').html('');
		
		if(this.terms.length > 0)
			$.each(this.terms, function() { Terms.toggle(this.toString()); });
	},
	
	set : function() { localStorage.setItem("terms", JSON.stringify(this.termArray)); },
	
	toggle : function(term) {
		
		term = term.toLowerCase();
		
		var index = this.termArray.indexOf(term);
		
		console.log(index);
		
		if(index == -1) {
			
			this.termArray.push(term);
		
			var html = [];
			
			html.push(' ');
			html.push('<a href="javascript:void(0);" ');
			html.push('id="term-' + term.replace(/ /gi, "-") + '" onclick="Terms.toggle(\'' + term + '\')">');
			html.push(term);
			html.push('</a>');
			
			$('#terms-cloud').append(html.join(''));
			
		} else {
			
			this.termArray.splice(index, 1);
			
			$('#term-' + term.replace(/ /gi, "-")) && $('#term-' + term.replace(/ /gi, "-")).remove();
		}		
	}
};

$(document).ready(function() { App.initialize(); });