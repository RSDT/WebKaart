function dtToUnixTS(dateString) {
    var reggie = /(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})/;
    var dateArray = reggie.exec(dateString);
    var jaar =dateArray[1];
    var maand = dateArray[2] ;
    var dag = dateArray[3] ;
    var uur = dateArray[4] ;
    var minuut = dateArray[5] ;
    var seconde =  dateArray[6] ;
    var formated = jaar + " " + maand + " "+ dag + " " + uur + ":" + minuut + ":" + seconde ;
    return Date.parse(formated) ;
}
class ApiCaller{
	constructor(){
		if (this.queue == null){
				this.queue = [] ;
			}
		this.sleutel  =  "geen_sleutel_ingevoerd" ;
		this.loggedin = false ;
		this.gebruiker = "" ;
		
	}
	setGebruiker(gebruiker){
		this.gebruiker = gebruiker ;
	}
	getGebruiker(){
		return this.gebruiker ;
	}

	login(){
		controls.showLogin() ;
		//na het klikken op inloggen wordt setSleutel aangeroepen.
	}

	logout(){
		this.loggedin = false ;
		this.sleutel  =  "geen_sleutel_ingevoerd" ;
		controls.showLogin() ;
		//na het klikken op inloggen wordt setSleutel aangeroepen.
	}

	setSleutel (sleutel){
		this.sleutel = sleutel  ;
		document.cookie = "sleutel=" +  sleutel ;
		this.loggedin = true ;
		for (var el = this.queue.shift(); el != undefined; el = this.queue.shift()){
			el.method(el.url,el.onSuccses) ;
		}
		hunterLocSender.change_api_key(sleutel) ;
	}
	
	add_get_request(url, onSuccses){
		if (this.loggedin){
			this.get_request(url,onSuccses) ;
		}else{
			if (this.queue == null){
				this.queue = [] ;
			}
			if 	(this.queue.find(function(r){return r.url == url}) == undefined){		
				this.queue.push({
					method: this.get_request,
					url: url,
					onSuccses: onSuccses
				}) ;
			}
		}
	}

	get_request(url, onSucces){
		url = url.replace("{sleutel}", api.sleutel) ;
		$.ajax({
			     url: "proxy.php",
			     data: {url : url},
			     type: "GET" ,
			     success:function(json){
			     	try{
			        json=JSON.parse(json) ;
			        onSucces(json) ;
			    	}catch(err){
			    		if (json.search("ERROR 110 : GEEN GELDIGE SLEUTEL IN GEVOERD") != -1){
			    			if (api.loggedin){
			    				alert("key error:\n Er is ingelogd op een ander apparaat met dit account.\n je wordt nu uitgelogd.") ;
			    			}
			    			api.logout() ;
			    		}
			    		console.log(json);
			    		console.log(this.url);
			    		console.log(err);
			    	}
			     },
			     error:function(jqXHR, textStatus, errorThrown){
			         throw ("Error: fout bij het ophalen data.\n" + textStatus + '\n' + errorThrown);
			   }
			});
	}

	getGroepen(onSucces){
		var url = "http://jotihunt-API-V2.area348.nl/sc/{sleutel}/" + 'all' ;
		this.add_get_request(url, onSucces) ;
	}

	getLastVos(team, onSucces){
		var url = "http://jotihunt-API-V2.area348.nl/vos/{sleutel}/" + team + '/last' ;
	  	this.add_get_request(url, onSucces) ;
	}

	getVossen(team, onSucces){
		var url = "http://jotihunt-API-V2.area348.nl/vos/{sleutel}/" + team + '/all' ;
	  	this.add_get_request(url, onSucces) ;
	}
	
	getHunter(hunter, onSucces){
		var onSucces2 = function(data){
			var tail = data[hunter]  ;
			tail = sortById(tail) ;
			if (tail == undefined){
				throw hunter + ';\n ' + tail + '\n' + data ;
			}else{
				onSucces(tail) ;
			}
		};

		var url = "http://jotihunt-API-V2.area348.nl/hunter/{sleutel}/naam/tail/" + hunter ;
		this.add_get_request(url, onSucces2) ;
	}

	getHunterNamen(onSucces){
		var onSucces2 = function(data){
			var data2 = [] ;
			for (var i = 0; i < data.length; i++){
				data2.push(data[i].hunter) ;
			}
			onSucces(data2) ;
			} ;
			var url = "http://jotihunt-API-V2.area348.nl/hunter/{sleutel}/hunter_namen" ;
			this.add_get_request(url, onSucces2) ;
	}

	getHunterLast(hunter, onSucces){
		var onSucces2 = function(data){
			if (data.hunter == undefined){
				data.hunter = data.naam;
			}
			return onSucces(data);
		};
		var url = "http://jotihunt-API-V2.area348.nl/hunter/{sleutel}//naam/"+hunter+"/last" ;
		this.add_get_request(url, onSucces2) ;
	}
	getFoto(onSucces){
		
		var url = "http://jotihunt-API-V2.area348.nl/foto/{sleutel}/all" ;
		this.add_get_request(url, onSucces) ;
	}

	getFotoById(id, onSucces){
		var onSucces2 = function(data){
			for (var i = 0; i < data.length; i ++){
				var foto = data[i] ;
				if (foto.id == id){
					onSucces(foto) ;
					break ;
				}
			}
		};
		this.getFoto(onSucces2) ;
	}
}

class Vos {
	constructor(map,team, color, hunt_icon, spot_icon, hint_icon, last_hint_icon, groep_icon){
		this.map = map ;
		this.color = color ;
		this.hunt_icon = hunt_icon ;
		this.spot_icon = spot_icon ;
		this.hint_icon = hint_icon ;
		this.groep_icon  = groep_icon ;
		this.last_hint_icon = last_hint_icon ;
		this.markers =  [] ;
		this.team = team ;
		this.circle  = new google.maps.Circle({
						  map: this.map,
						  radius: 0,    // afstand in metres
						  strokeColor: '#FF6600',
						  strokeOpacity: 0.2,
						  strokeWeight: 0.2,
						  fillColor: '#FF6600'
					});
		var polylineInfo = {
			path: [],
			strokeColor: this.color,
			strokeOpacity: .6,
			strokeWeight: 2
		}
		this.speed = 6.0; // in km/u
		this.last_hint = {team:'q', id: '42'} ; //fake data
		this.polyline = new google.maps.Polyline(polylineInfo) ;
		this.polyline.setMap(map) ;
		this.visible = true ;
		this.groepen = [] ;
	}

	getVisible(){
		return this.visible ;
	}
	setVisible(visible){
		if (visible != this.visible){
			this.visible = visible ;
			this.circle.setVisible(visible) ;
			this.polyline.setVisible(visible) ;
			for (let i = 0; i < this.markers.length; i++){
				var marker = this.markers[i] ;
				marker.setVisible(visible);
			}
			for (let i = 0; i < this.groepen.length; i++){
				var groep = this.groepen[i] ;
				groep.marker.setVisible(visible);
				groep.circle.setVisible(visible);
			}
		}
	}

	addGroep(groep){
		if (groep.team != this.team){
			return;
		}
        var infowindowdata =
        '<div id="infowindow">'+
        groep.naam +
        '<br>'+
        groep.latitude + ', ' + groep.longitude +
        '<br>'+
        groep.adres+
        '</div>' ;
        var infowindow = new google.maps.InfoWindow({
            content: infowindowdata
        });

        var marker = new google.maps.Marker({
            position: new google.maps.LatLng(groep.latitude,groep.longitude),
            map: this.map,
            title: groep.naam + '#'+ groep.team+ groep.id,
            icon: new google.maps.MarkerImage(this.groep_icon, null, null, new google.maps.Point(25,18)),
            visible: this.visible
        });

        var circle  = new google.maps.Circle({
                      map: this.map,
                      radius: 500,    // afstand in metres
                      strokeColor: "#000000",
                      strokeOpacity: 0.2,
                      strokeWeight: 0.2,
                      fillColor: this.color
                });
        circle.bindTo('center', marker, 'position') ;
        google.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map,marker);

        });
        this.groepen.push({marker: marker, circle: circle}) ;

	}

	updateRadius(){
		var marker = null ;
		for (var i = 0; i < this.markers.length; i++){
			if (this.markers[i].getIcon().url == this.last_hint_icon){
				marker = this.markers[i];
				break;
			}
		}
		if (marker == null){
			return ;
		}
			var title = marker.getTitle().split(';') ;
			if (title.length == 0){
				alert('error 01. \n de cirkels zullen niet groeien \n' + marker.getTitle())
				return ;
			}
			var datetime_str = title[title.length-1] ;
			var datetime = dtToUnixTS(datetime_str) ;
			var _speed = (this.speed * 1000.0) / 3600.0; // snelheid in m/s
			var dt = (Date.now().valueOf() - datetime.valueOf()) /1000 ;
			if (dt>= 3 * 60 * 60 || dt < 0){ // 3 uur.
				dt = 0 ;
			}
			var radius = dt * _speed ;
			this.circle.setRadius(radius) ;
	}

	addLoc(response){
		if (response.team == this.last_hint.team && response.id == this.last_hint.id){
			return ;
		} else {
			this.last_hint = response ;
		}
		var infowindowdata = 
			'<div id="infowindow">' +
			response.team +
			'<br>'+
			response.datetime +
			'<br>' +
			response.latitude + ', ' + response.longitude +
			'<br>'+
			response.opmerking +
			'<br>'+
			response.extra +
			'</div>' ;
		var infowindow = new google.maps.InfoWindow({
			content: infowindowdata
		}) ;
		var pos =  new google.maps.LatLng(response.latitude, response.longitude) ;
		var icon ;
		if (response.icon == "3"){ // icon is een spot
			icon = this.spot_icon ;
		} else if (response.icon == "4"){ // icon is een hunt
			icon = this.hunt_icon ;
		} else { // icon is een hint
			icon = this.last_hint_icon ;
			for (var i = 0; i < this.markers.length; i++){ // er is maar een last hint.
				if (this.markers[i].getIcon().url == this.last_hint_icon){
					this.markers[i].setIcon(new google.maps.MarkerImage(this.hint_icon, null, null, new google.maps.Point(16, 16)))
				}
			}
		}
		var icon_image =  new google.maps.MarkerImage(icon, null, null, new google.maps.Point(16, 16)) ;
		var marker = new google.maps.Marker({
			position: pos,
			map: this.map,
			title: response.team + "#"  + response.id+ ';' + response.datetime,
			icon: icon_image,
			visible: this.visible
		}) ;
		if (icon == this.last_hint_icon){
			this.circle.bindTo('center', marker, 'position') ;	
		}
		google.maps.event.addListener(marker, 'click', function() {
						infowindow.open(map,marker);
					});	

		this.markers.push(marker) ;
		var path = this.polyline.getPath() ;
		path.push(pos) ;
		this.updateRadius() ;
	}
}
class Foto{
	constructor(map, iconPath, iconPathKlaar, response){
		this.map = map ;
		this.icon_te_doen = iconPath ;
		this.icon_klaar = iconPathKlaar ;
		this.id = response.id;
		var InfoWindowData = 
			'<div id="infowindow">'+
			response.foto_nr+
			'<br>'+
			 response.latitude + ', '+ response.longitude +
			'<br>'+
			response.info+
			'<br>'+
			response.extra+
			'</div>'
			;
		var infowindow = new google.maps.InfoWindow({
			content: InfoWindowData
		});
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(response.latitude, response.longitude),	
			map: this.map,				
			title: response.foto_nr,	
			icon: new google.maps.MarkerImage(this.icon_te_doen,null,null,new google.maps.Point(10,10))		
		});
		this.done = false;
		this.visible = true;
		google.maps.event.addListener(marker, 'click', function() {
						infowindow.open(map,marker);
					});	
		this.marker = marker;
	}
	getVisible(){
		return this.visible;
	}
	setVisible(visible){
		if (visible != this.visible){
			this.visible = visible;
			this.marker.setVisible(visible) ;
		}
	}
	setDone(){
		this.done = true ;
		this.marker.setIcon(new google.maps.MarkerImage(this.icon_klaar, null,null,new google.maps.Point(10,10))) ;
	}
}
class FotoSet{
	constructor(map, iconPath, iconPathKlaar){
		this.map = map ;
		this.icon_te_doen = iconPath ;
		this.icon_klaar = iconPathKlaar ;
		this.notDone = [] ;
		this.done = [] ;
		this.visible_done = true ;
		this.visible_notDone = true ;

	}
	getVisibleNK(){
		return this.visible_notDone;
	}
	getVisibleK(){
		return this.visible_done;
	}
	setVisibleNK(visible){
		if (visible != this.visible_notDone){
			this.visible_notDone = visible ;
			for (var i = 0;i < this.notDone.length; i++){
				this.notDone[i].setVisible(visible) ;
			}
		}
	}
	setVisibleK(visible){
		if (visible != this.visible_done){
			this.visible_done = visible ;
			for (var i = 0;i < this.done.length; i++){
				this.done[i].setVisible(visible) ;
			}
		}
	}
	addPhoto(response){
		var foto = new Foto(this.map, this.icon_te_doen, this.icon_klaar, response) ;
		this.notDone.push(foto) ;
	}

	getNotDonIds(){
		return this.notDone.map(function(e){return e.id}) ;
	}

	fotoDone(id){
		for (var i = 0; i < this.notDone.length ; i++){
			var foto = this.notDone[i] ;
			if (foto.id == id){
				foto.setDone() ;
				this.done.push(foto);
				foto.setVisible(this.visible_done) ;
				var newDone = [] ;
				for (var j = 0; j < this.notDone.length; j++){
					if (this.notDone[j].id != foto.id){
						newDone.push(this.notDone[j]) ;
					}
				}

				this.notDone = newDone;
			}
		}
	}
}

class Hunter{
	constructor(map, naam, iconPath){
		this.map = map ;
		this.iconPath = iconPath; 
		var polylineInfo = {
			path: [],
			strokeColor: this.color,
			strokeOpacity: .6,
			strokeWeight: 2
		}
		this.polyline = new google.maps.Polyline(polylineInfo) ;
		this.polyline.setMap(this.map) ;
		this.infoWindowData = '<div id="infowindow">'+
				naam +
				'<br>'+
				'{datetime}' +
				'</div>' ;
		this.infoWindow = new google.maps.InfoWindow({
				content: this.infoWindowData
			});

		this.marker = new google.maps.Marker({
			position: new google.maps.LatLng(0,0),
			map: this.map,
			title: naam
		}) ;
		this.marker.setVisible(false) ;
		google.maps.event.addListener(this.marker, 'click', function(e) {
				var hunter = hunters.getHunterFromLatLng(e.latLng) ;
				hunter.infoWindow.open(map, hunter.marker);
			});
		this.last = {hunter: "sjlkasjdlk", id: "420"} ; // fake data
		this.pointsExpires = [] ;
		this.visible = true ;

	}

	getVisible(){
		return this.visible ;
	}

	setVisible(visible){
		if (visible != this.visible){
			this.visible = visible;
			this.marker.setVisible(visible) ;
			this.polyline.setVisible(visible) ;
		}
	}
	setNaam(naam){
		this.naam = naam;
		this.infoWindowData = '<div id="infowindow">'+
				naam +
				'<br>'+
				'{datetime}' +
				'</div>' ;
	}
	removeFirstLoc(){
		this.polyline.getPath().removeAt(0) ;
		this.pointsExpires.splice(0,1);
		if (this.pointsExpires.length == 0){
			this.marker.setVisible(false) ;
			hunters.notUsedAnymore(this.naam) ;
		}
	}
	
	checkPath(){
		while (this.polyline.getPath().length > 60){
			this.removeFirstLoc() ;
		}
		while(true){
			if (this.polyline.getPath().length == 0){
				return ;
			}
			if (Date.now() < this.pointsExpires[0]){
				return;
			}
			this.removeFirstLoc() ;
		}
	}

	addLoc(response){
		if (response.hunter != this.naam && response.id != this.last.id){
			this.last = response ;
			var pos =  new google.maps.LatLng(response.latitude, response.longitude) ;
			var expires = dtToUnixTS(response.datetime) + 1*60*60*1000 ;
			this.polyline.getPath().push(pos) ;
			this.marker.setVisible(true) ;
			this.marker.setPosition(pos) ;
			this.infoWindow.setContent(this.infoWindowData.replace("{datetime}",response.datetime)) ;
			if (response.icon == "999"){
				response.icon = "0" ;
			}
			this.marker.setIcon(new google.maps.MarkerImage(this.iconPath.replace("{id}", response.icon), null, null, new google.maps.Point(16, 16)));
			this.pointsExpires.push(expires) ;
		}
	}
}

class myWorker{
	constructor(location){
		this.worker = null ;
		this.running = false;
		this.intervalid = undefined;
		this.huntnaam = undefined;
		this.api_key = undefined;
		this.icon = undefined;
	}

	post_request(url, data, onSucces){
		data.url = url ;
		$.ajax({
			     url: "proxy.php",
			     type : 'POST', 
			     data : data, 
			     success: function(d){
			     	alert(d) ;
			     	onSucces(d) ;
			     },
			     error:function(jqXHR, textStatus, errorThrown){
			         throw ("Error: fout bij verzenden locatie data.\n" + textStatus + '\n' + errorThrown);
			   }
			});
	}
	sendPos(){
		navigator.geolocation.getCurrentPosition(function(pos){
			var url = "http://jotihunt-API-V2.area348.nl/hunter" ;
			var latitude = pos.coords.latitude.toString() ;
			var longitude = pos.coords.longitude.toString() ; 
			var data = {hunter: hunterLocSender.huntnaam, SLEUTEL: hunterLocSender.api_key, icon: hunterLocSender.icon, latitude: latitude, longitude: longitude} ;
			
			this.post_request(url, data, function(json){
				if(json.search("401") != -1){
					alert ('401 error tijdens versturen hunter') ;
				}
				if(json.search("402") != -1){
					alert ('402 error tijdens versturen hunter') ;
				}
				if(json.search("403") != -1){
					alert ('403 error tijdens versturen hunter') ;
				}
				if(json.search("403") != -1){
					alert ('403 error tijdens versturen hunter') ;
				}
				if(json.search("404") != -1){
					alert ('404 error tijdens versturen hunter') ;
				}
			})
		});
	}
	sendFirstPos(pos){
		var url = "http://jotihunt-API-V2.area348.nl/hunter" ;
			var latitude = pos.coords.latitude.toString() ;
			var longitude = pos.coords.longitude.toString() ; 
			var data = {hunter: hunterLocSender.huntnaam, SLEUTEL: hunterLocSender.api_key, icon: hunterLocSender.icon, latitude: latitude, longitude: longitude} ;
			this.post_request(url, data, function(json){
				if(json.search("401") != -1){
					alert ('401 error tijdens versturen hunter') ;
				}
				if(json.search("402") != -1){
					alert ('402 error tijdens versturen hunter') ;
				}
				if(json.search("403") != -1){
					alert ('403 error tijdens versturen hunter') ;
				}
				if(json.search("403") != -1){
					alert ('403 error tijdens versturen hunter') ;
				}
			})
	}
	getRunning(){
		return this.running;
	}
	start(api_key, huntnaam, icon, firstPos){
		if(!this.running){
			this.api_key = api_key ;
			this.huntnaam = huntnaam ; 
			this.icon = icon ;
			this.sendFirstPos(firstPos) ;
			this.worker = setInterval(this.sendpos, 60*1000);
			this.running = true;
		}
	}

	change_api_key(api_key){
		var data = {cmd: 'change_api_key', api_key: api_key} ;
		this.api_key = api_key ;
	}
	stop(){
		var data = {cmd: 'stop'} ;
		if (this.worker != null){
			clearInterval(this.worker) ;
			this.running = false ;
		}
	}
}

class HuntersSet{
	constructor(map, hunter_icon_path){
		this.hunterNamen = new Set([]);
		this.inUse = {} ;
		this.notInUse = [] ;
		this.hunter_icon_path = hunter_icon_path ;
		this.visible = true;
		this.map = map ;
	}
	getVisible(){
		return this.visible ;
	}
	setVisible(visible){
		if (this.visible != visible){
			this.visible = visible ;
			for (let naam of this.hunterNamen){
				this.inUse[naam].setVisible(visible) ;
			}
		}
	}
	notUsedAnymore(naam){
		if (this.inUse[naam] != undefined){
			this.notInUse.push(this.inUse[naam]) ;
			this.inUse[naam] = undefined ;
		}
	}

	addHunter(naam){
		if (!this.hunterNamen.has(naam)){
			var x = this.notInUse.pop() ;
			if (x == undefined){
				x = new Hunter(this.map, naam, this.hunter_icon_path) ;
			}else{
				x.setNaam(naam) ;
			}
			this.hunterNamen.add(naam) ;
			this.inUse[naam] = x ;
		}
	}

	getHunterFromLatLng(latlng){
		for (let naam of this.hunterNamen){
			var hunter = this.inUse[naam] ;
			var hposition = hunter.marker.getPosition() ;
			if (hposition.lat() ==latlng.lat() && hposition.lng() ==latlng.lng()){
				return hunter ;
			}
		}
	}

	contains(naam){
		return this.hunterNamen.has(naam) ;
	}

	addLoc(naam, response){
		if (!this.hunterNamen.has(naam)){
			this.addHunter(naam) ;
		}
		var hunter = this.inUse[naam] ;
		hunter.addLoc(response) ;
	}
	checkPaths(){
		for (let naam of this.hunterNamen){
			var hunter = this.inUse[naam] ;
			hunter.checkPath() ;
		}
	}
	getHunter(naam){
		if (this.hunterNamen.has(naam)){
			return this.inUse[naam] ;
		} else return undefined ;
	}

}
class ConctrolCenter{
	constructor(map){
		this.map  = map ;

		this.menu = document.createElement('div');
		this.menu.index = 1;
		this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.menu);
		this.menu.hidden=true;
		this.childeren = [] ;
		this.submenu_start = 0;
		this.submenu_end = 0;
		this.submenu = document.createElement('div');
		this.submenu.index = 1;
		this.menu.appendChild(this.createButton('Verberg controls', '#fff', function(div){
					
  					controls.menu.hidden = !controls.menu.hidden;
  					controls.showControls.hidden = !controls.showControls.hidden;
  					window.removeEventListener('resize',controls.showSubMenu) ;
  				}) );
		this.menu.appendChild(this.createButton('vorige', '#fff',function(div){
			if(controls.submenu_start == 0){
				controls.submenu_start = controls.childeren.length - 1 ;
			}
			controls.submenu_end = controls.submenu_start ;
			controls.clearMenu() ;

			var last_child_added = controls.childeren[controls.submenu_start] ;
			controls.submenu_end++ ;
			controls.submenu.appendChild(last_child_added) ;

			while (controls.menu.offsetHeight < window.innerHeight && controls.submenu_start > 0){
				var childToAdd = controls.childeren[controls.submenu_start - 1] ;
				controls.submenu.insertBefore(childToAdd, last_child_added) ;
				controls.submenu_start--;
				last_child_added = childToAdd ;
			}
			if (controls.menu.offsetHeight >= window.innerHeight){
				controls.submenu.removeChild(last_child_added) ;
				controls.submenu_start++;
			}
		}));
		this.menu.appendChild(this.submenu);
		this.menu.appendChild(this.createButton('volgende', '#fff',function(div){
			if(controls.submenu_end == controls.childeren.length){
				controls.submenu_end = 0 ;
			}
			controls.submenu_start = controls.submenu_end;
			controls.clearMenu() ;
			var last_child_added = controls.childeren[controls.submenu_end] ;
			controls.submenu_end++ ;
			controls.submenu.appendChild(last_child_added) ;
			while (controls.menu.offsetHeight < window.innerHeight && controls.submenu_end < controls.childeren.length){
				var childToAdd = controls.childeren[controls.submenu_end] ;
				controls.submenu.appendChild(childToAdd) ;
				controls.submenu_end++;
				last_child_added = childToAdd ;
			}
			if (controls.menu.offsetHeight >= window.innerHeight){
				controls.submenu.removeChild(last_child_added) ;
				controls.submenu_end--;
			}
		}));


		var controlText = document.createElement('div');
		controlText.style.color = 'rgb(25,25,25)';
		controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
		controlText.style.fontSize = '16px';
		controlText.style.lineHeight = '28px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
		controlText.innerHTML = 'controls';

		this.showControls = document.createElement('div');
		this.showControls.index = 1;
		this.showControls.style.backgroundColor = '#fff';
		this.showControls.style.border = '2px solid #fff';
		this.showControls.style.borderRadius = '3px';
		this.showControls.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		this.showControls.style.cursor = 'pointer';
		this.showControls.style.marginBottom = '22px';
		this.showControls.style.textAlign = 'center';
		this.showControls.appendChild(controlText);
		this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(this.showControls);
		this.showControls.addEventListener('click',function(){
			controls.menu.hidden = !controls.menu.hidden;
			controls.showControls.hidden = !controls.showControls.hidden;
			controls.showSubMenu() ;
			window.addEventListener('resize',controls.showSubMenu) ;
		});
			

		this.loginDiv =document.getElementById("respond") ;
                map.controls[google.maps.ControlPosition.CENTER].push(this.loginDiv);
                this.loginDiv.style.backgroundColor =  "white" ;
                this.loginDiv.hidden = true ;

		
	}
	detachLogin(){
            document.body.appendChild(this.loginDiv) ;
            
        }
	showLogin(){
		this.loginDiv.hidden = false ;
	}

	hideLogin(){
		this.loginDiv.hidden = true ;
	}
	createButton(label, start_kleur, onclick){
		// Set CSS for the control border.
		var controlUI = document.createElement('div');
		controlUI.style.backgroundColor = start_kleur;

		controlUI.style.border = '2px solid #fff';
		controlUI.style.borderRadius = '3px';
		controlUI.style.boxShadow = '0 2px 6px rgba(0,0,0,.3)';
		controlUI.style.cursor = 'pointer';
		controlUI.style.marginBottom = '11px';
		controlUI.style.textAlign = 'center';

		// Set CSS for the control interior.
		var controlText = document.createElement('div');
		controlText.style.color = 'rgb(25,25,25)';
		controlText.style.fontFamily = 'Roboto,Arial,sans-serif';
		controlText.style.fontSize = '16px';
		controlText.style.lineHeight = '38px';
		controlText.style.paddingLeft = '5px';
		controlText.style.paddingRight = '5px';
		controlText.innerHTML = label;
		controlUI.appendChild(controlText);
		controlUI.addEventListener('click', function(){
			var result = onclick(controlUI) ;
			if (result != undefined){
				if (result){
					controlUI.style.backgroundColor = 'rgb(0,255,0)';
				}else{
					controlUI.style.backgroundColor = 'rgb(255,0,0)';
				}
			}
		}) ;
		return controlUI ;
	}
	addButton(label, start_kleur, onclick){
		var controlUI = this.createButton(label, start_kleur, onclick) ;
		this.childeren.push(controlUI) ;
	}
	clearMenu(){
		while(this.submenu.children.length != 0){
			this.submenu.removeChild(this.submenu.children[0])
		}
	}
	showSubMenu(){
		controls.clearMenu() ;
		
		controls.submenu_end = controls.submenu_start ;
		var last_child_added = controls.childeren[controls.submenu_end] ;
		controls.submenu_end++ ;
		controls.submenu.appendChild(last_child_added) ;
		while (controls.menu.offsetHeight < window.innerHeight && controls.submenu_end < controls.childeren.length){
			var childToAdd = controls.childeren[controls.submenu_end] ;
			controls.submenu.appendChild(childToAdd) ;
			controls.submenu_end++;
			last_child_added = childToAdd ;
		}
		if (controls.menu.offsetHeight >= window.innerHeight){
			controls.submenu.removeChild(last_child_added) ;
			controls.submenu_end--;
		}
}
}
