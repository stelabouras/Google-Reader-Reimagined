<?
include("../inc/vars.inc");
include("../inc/functions.inc");

$action = $_REQUEST['action'];

if($action == "")
    die(json_encode(array("errorCode" => 1)));
    
switch($action) {
    
    case "login" : 
        
        $username = $_POST['username'];
        $password = $_POST['password'];
        
        if($username == "" || $password == "") {
            
            $res = array("errorCode" => 4);
            break;
        }
        
        $res = Login($username, $password);
        
    break;
    
    case "markAsRead" :
    
        $id         = (string)$_POST['id'];
        $streamId   = (string)$_POST['streamId'];
        $auth       = (string)$_POST['auth'];
        
        if($auth == "") {
            
            $res = array("errorCode" => 5);
            break;
        }
        
        if($id == "" || $streamId == "") {
            
            $res = array("errorCode" => 10);
            break;
        }
    
        $res = MarkAsRead($id, $streamId, $auth);
        
    break;
    
    case "request" :

        $auth           = $_REQUEST['auth'];
        $termArray      = ($_REQUEST['termArray'] != "" ? json_decode(stripslashes($_REQUEST['termArray'])) : array());
        
        if(count($termArray) > 0) {
            
            $normTermArray = array();
            
            foreach($termArray as $term) {
                
                if(trim($term) != "")
                    $normTermArray[] = strtolower(trim($term));
            }
                
            $favTerms       = $normTermArray;
            $favTermsReg    = "(\b" . implode("\b|\b", $favTerms) . "\b)";
        }
        
        if($auth == "") {
            
            $res = array("errorCode" => 5);
            break;            
        }
        
        // Get the total unread items count, if more than 300, limit it to 300
        $response   = HTTPpost("http://www.google.com/reader/api/0/unread-count", array(), $auth, false); 
        $xml        = simplexml_load_string($response);
        $unread     = 0;

        foreach($xml->list->object as $obj) {

            if(strpos($obj->string, "reading-list") !== false) {

                $unread = (int)$obj->number[0];
                break;
            }
        }
        
        $unread = ($unread > 300 ? 300 : $unread);
        
        if(USE_JSON)
            $url = "http://www.google.com/reader/api/0/stream/contents/?xt=user/-/state/com.google/read&n=" . $unread;
        else
            $url = "http://www.google.com/reader/atom/user/-/state/com.google/reading-list?xt=user/-/state/com.google/read&n=" . $unread;
        
        $response = HTTPpost($url, array(), $auth, false); 

        $res = ProcessItems($response);
    
    break;
    
    default :
    
        $res = array("errorCode" => 1);
    
    break;
}

die(json_encode($res));
?>