<?php
	// Borrowed with love from https://b3z13r.wordpress.com/2011/05/16/passing-values-from-the-commandline-to-php-by-getpost-method/
	// e.g. `./wrapper.php GET /tmp/random_file.php?arg1=true&arg2=a-really-long-string` { "username": "root" }
	$method = $argv[1] ?? 'GET';
	$target = $argv[2] ?? '';
	$query_parts = explode('?', $target, 2);
	$file = $query_parts[0];
	$query_params = $query_parts[1] ?? '';
	$body = $argv[3] ?? '';

	if ($file === '') {
		fwrite(STDERR, "Missing PHP file path\n");
		exit(1);
	}

	// Load query_params or body into correct var
	if ($method === 'GET') {
		parse_str($query_params, $_GET);
	} else {
		parse_str($body, $_POST);
	}

	include($file);
?>
