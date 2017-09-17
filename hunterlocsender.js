var running = false ;
var intervalid ;
var huntnaam ;
var api_key ;
var icon ;
function post_request(url, data, onSucces){
					data.url = url ;
					$.ajax({
						     url: "proxy.php",
						     data: data,
						     type: "POST" ,
						     success:function(data){
						     	onSucces(data) ;
						     },
						     error:function(jqXHR, textStatus, errorThrown){
						         throw ("Error: fout bij verzenden locatie data.\n" + textStatus + '\n' + errorThrown);
						   }
						});
				}
function sendPos(){
	navigator.geolocation.getCurrentPosition(function(pos){
		var url = "http://jotihunt-API-V2.area348.nl/vos" ;
		var latitude = pos.coords.latitude ;
		var longitude = pos.coords.longitude ;
		var data = {hunter: huntnaam, SLEUTEL: api_key, icon: icon, latitude: latitude, longitude: longitude} ;
		post_request(url, data, function(json){
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
	});
}
self.addEventListener('message', function(e) {
  	var data = e.data ;
  	var cmd = data.cmd ;
  	switch (data.cmd) {
    case 'start':
      	if (!running){
      		icon = data.icon ;
      		huntnaam = data.huntnaam ;
      		api_key = data.api_key ;
      		intervalid = setInterval(sendPos(), 60 * 1000) ;
      	}
      	break;
    case 'change_huntnaam':
    	huntnaam = data.huntnaam ;
    	break;
    case 'change_api_key':
    	api_key = data.api_key ;
    	break;	
    case change_icon:
    	icon - data.icon ;
    case 'stop':
      if (running){
      	clearInterval(intervalid) ;
      }
      break;
    default:
      self.postMessage('Unknown command: ' + data.msg);
  };
}, false);
