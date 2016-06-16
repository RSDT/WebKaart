<?php
	if ($_SERVER['REQUEST_METHOD'] == 'POST'){
		foreach ($_POST as $key => $value) {
			if ($key =="url"){
				$url = $value ;
			} else {
				$data[$key] = $value ;
			}
		}
	} else if ($_SERVER['REQUEST_METHOD'] == 'GET'){
		foreach ($_GET as $key => $value) {
			if ($key =="url"){
				$url = $value ;
			} else {
				$data[$key] = $value ;
			}
		}
	}
	echo '{ ' ;
	foreach ($data as $key => $value) {
		echo $key .': ' . $value;
	}
	echo '}' ;
?>