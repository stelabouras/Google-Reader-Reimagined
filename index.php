<?
include("inc/vars.inc");
include("inc/functions.inc");
?>
<!doctype html>
<html lang="en">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
        <title>Google Reader Reimagined</title>
        <meta name="description" content="Your Google Reader items, reimagined">
        <meta name="author" content="stelabouras">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=0">
        <link rel="stylesheet" href="css/style.css?v=2">
        <script src="js/libs/modernizr-1.7.min.js"></script>
    </head>
    <body>
        <div id="container">
            <header>
                <h1><em>Google Reader Reimagined</em><span style="display:none;" id="loader"></span><span style="display:none;" id="setterms">Set Terms</span><span style="display:none;" id="logout">Logout</span></h1>
            </header>
            
            <div class="screen" id="screen-0">
                <form class="inside" id="loginform" method="post" action="">
                    <p>
                        <label for="username">Username</label>
                        <input autofocus required type="text" name="username" id="username" value=""/>
                    </p>
                    <p>
                        <label for="password">Password</label>
                        <input required type="password" name="password" id="password" value=""/>
                    </p>
                    <p>
                        <input type="submit" class="button" name="submitform" id="submitForm" value="Login"/>
                    </p>
                </form>
            </div>

            <div class="screen" id="screen-1">
                
                <div class="inside">
                    
                    <p>Enter some terms for prioritization (type and hit return to enter multiple)</h4>
                
                    <p><input type="text" placeholder="Type a term (e.g. blizzard)" value="" id="term-text"/></p>
                
                    <p id="terms-cloud"></p>
                    
                    <p class="right"><input type="button" class="button" id="submit-terms" value="Save &amp; proceed &raquo;"/></p>
                    
                </div>
            </div>
            
            <div class="screen" id="screen-2">
                <ul id="important-terms">
                    <li id="important-placeholder"><h2>Loading important terms...</h2></li>
                </ul>
            
                <ul id="rest-terms">
                    <li id="rest-placeholder"><h3>Loading rest terms...</h3></li>
                </ul>
            </div>
            
            <footer class="right">copyright &copy; <?=date('Y')?> <a target="stelabouras" href="http://stelabouras.com">stelabouras</a> // WTF: Enter the terms you love and watch the system group and prioritize the stories 4 U</footer>
        </div>
        
        <script src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.js"></script>
        <script>window.jQuery || document.write('<script src="js/libs/jquery-1.5.1.min.js">\x3C/script>')</script>

        <!-- scripts concatenated and minified via ant build script-->
        <script src="js/plugins.js"></script>
        <script src="js/script.js"></script>
        <!-- end scripts-->

        <!--[if lt IE 7 ]>
          <script src="js/libs/dd_belatedpng.js"></script>
          <script>DD_belatedPNG.fix('img, .png_bg'); // Fix any <img> or .png_bg bg-images. Also, please read goo.gl/mZiyb </script>
        <![endif]-->

    </body>
</html>