<?php
	if ($_SERVER['REQUEST_METHOD'] == 'POST' ){
		$data = array();
		$data2= "";
		foreach ($_POST as $key => $value) {
			if ($key === "url"){
				$url = $value ;
			} else if($key == "data"){
                            $data2 = $value ;
			}else {
				$data[$key] = $value ;
			}
		}
		if ($data2 == ""){
                    $result = httpPost($url, $data) ;
		}else{
                    $result = httpPost2($url, $data2) ;
		}
		echo $result ;
	} else if ($_SERVER['REQUEST_METHOD'] == 'GET' ){
		$data = array();
		foreach ($_GET as $key => $value) {
			if ($key === "url"){
				$url = $value ;
			} else {
				$data[$key] = $value ;
			}
		}
		$result = httpGet($url, $data) ;
		echo $result ;
	}
	function httpGet($url, $data)
	{
		$ch = curl_init();
		$full_url = $url.'?' ;
		foreach ($data as $key => $value) {
			$full_url.= $key .'='.$value.'&';
		}
		//echo "Get" ;
		//echo $url ;
		//echo $data ;
		//echo $full_url ;
		curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
		curl_setopt($ch, CURLOPT_URL, $full_url);
		$content = curl_exec($ch);
		$error = curl_error($ch) ;
		if ($error != ""){
			echo $error ;
			http_response_code(418) ;
		}
		echo $content;
	}
	function httpPost($url, $data)
	{
		if (isset($data['hunter'])){
			var_dump(json_encode($data)) ;
		}
		$options = array(
				'http' => array(
				'header'  => "Content-type: application/x-www-form-urlencoded\r\n",
				'method'  => 'POST',
				'content' => json_encode($data)
			)
		);
		$context  = stream_context_create($options);
		$result = file_get_contents($url, false, $context);
	    return $result;
	}
	function httpPost2($url, $data)
	{
		var_dump($data) ;
	    $curl = curl_init($url);
	    curl_setopt($curl, CURLOPT_POST, true);
	    curl_setopt($curl, CURLOPT_POSTFIELDS, $data);
	    curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
	    $response = curl_exec($curl);
		$error = curl_error($curl) ;
		if ($error != ""){
			echo $error ;
			http_response_code(418) ;
		}
	    curl_close($curl);
	    return $response;
	}
?>