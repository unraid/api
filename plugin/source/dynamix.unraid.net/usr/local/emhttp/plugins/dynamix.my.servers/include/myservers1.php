<?php
/* Copyright 2005-2023, Lime Technology
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */
?>
<?php
require_once("$docroot/plugins/dynamix.my.servers/include/web-components-extractor.php");

$wcExtractor = new WebComponentsExtractor();
echo $wcExtractor->getScriptTagHtml();
