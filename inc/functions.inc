<?
/*
Descr   : Determines whether a sentence (term) has part of a favorite keyword (word or sentence)
Args    : (string) the senterce to be checked
Returns : (boolean) true if senternce is part of a favorite keyword, false otherwise
*/
function IsFavTerm($sentence) {
    
    global $favTerms, $favTermsReg;
 
    if(count($favTerms) > 0 && preg_match_all($favTermsReg, $sentence, $matches) != false)
        return true;
        
    return false;
}

/*
Descr   : Sort Term clusters based on the amount of titles they contain
Args    : Two term clusters
Returns : 1 if cluster A has less items (DESC order), 0 if it has the same with cluster B, -1 otherwise
*/
function SortTerms($a, $b) {

    if (count($a['items']) == count($b['items']))
        return 0;
                
    return (count($a['items']) < count($b['items'])) ? 1 : -1;            
}

/*
Descr   : Normalizes and breaks a rss item title to terms
Args    : The title in its pure form
Returns : Array of the terms it contains
*/
function BreakToTerms($origTitle) {
    
    global $excludedTerms, $favTerms, $favTermsReg;
    
    // Some initial normalization
    $origTitle      = trim(strtolower($origTitle));

    // If a part of the title contains one of the favorite terms,
    // return this term in a single item array
    if(count($favTerms) > 0 && preg_match_all($favTermsReg, $origTitle, $matches) != FALSE)
        return array($matches[0][0]);
    
    // Some post processing normalization
    $title          = str_replace("-", " ", $origTitle);
    
    // Break sentence to words
    $titleChunks    = explode(" ", $title);
    
    $terms          = array();
    
    foreach($titleChunks as $titleChunk) {
        
        // Trim any weird chars
        $chunk = trim($titleChunk, " .?!,:'()&;#\n\t[]\"“”|’");
        
        // Ignore any terms with length less (or equal) than 3 letters 
        if(strlen($chunk) <= 3)
            continue;
            
        // If term is part of the excluded terms array, ignore it
        if(in_array($chunk, $excludedTerms))
            continue;
        
        $terms[] = $chunk;
    }
    
    return $terms;
}

/*
Descr   : Main function responsible for communicating with Google Reader API via cURL
Args    : 
    url         : (string)  url of the endpoint
    strRequest  : (array)   associative array of arguments to be posted
    auth        : (string)  authentication token (returned by the login API method)
    secure      : (boolean) true if we want to use SSL for the call
Returns : (string) the response
*/
function HTTPpost($Url, $strRequest, $auth, $secure) {

    $ch = curl_init();
    
    curl_setopt($ch, CURLOPT_URL, $Url);
    
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);

    if(count($strRequest) > 0) {
        
        curl_setopt($ch, CURLOPT_POST, 1) ;
        curl_setopt($ch, CURLOPT_POSTFIELDS, $strRequest);
    }
    
    if($auth != "")
        curl_setopt($ch,CURLOPT_HTTPHEADER,array('Authorization:GoogleLogin auth=' . $auth));
    
    if($secure) {
        
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, 0);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
    }

    // If logging is enabled we can debug the calls to Google Reader API
    if(LOGGING)
        curl_setopt($ch, CURLINFO_HEADER_OUT, true);

    $result = curl_exec($ch);

    if(LOGGING) {
        
        $headers = curl_getinfo($ch, CURLINFO_HEADER_OUT);
        print_r($headers);
    }
    
    curl_close($ch);

    return $result;
}

/*
Descr   : Marks one item as read to the Google Reader Account
Args    :
    id          : Id of the item
    streamId    : Id of the feed
    auth        : Authentication token
Returns : (boolean) true if it is marked as read, false otherwise
*/
function MarkAsRead($id, $streamId, $auth) {

    // Get the token in order to make an "edit" call to the api
    $response = httpPost("http://www.google.com/reader/api/0/token", array(), $auth, false);
    
    // Token usually has a // as a prefix, lose that
    // (TODO) use a more elegant way ;)
    $token = explode("//", $response);
    $token = trim($token[1]);
    
    $request = array( 
        "a"     => "user/-/state/com.google/read",
        "async" => true,
        "s"     => $streamId,
        "i"     => $id,
        "T"     => $token 
    );

    $response = httpPost("http://www.google.com/reader/api/0/edit-tag?client=-", $request, $auth, true);
    
    return (trim($response) == "OK");
}

/*
Descr   : Reads the unread list response from the API and returns a JS-ready structure for the webapp
Args    : (string) the unread list response from the API
Returns : (array) an assoc array with the items ready to be rendered with JS
*/
function ProcessItems($response) {
    
    $globalTerms    = array();
    $count          = 0;
    
    // We can use JSON or XML method to get the list, so process the list accordingly
    $object     = (USE_JSON ? json_decode($response) : simplexml_load_string($response));
    $objItems   = (USE_JSON ? $object->items : $object->entry);    
    
    // For each unread item
    foreach($objItems as $oItem) {

        // Save only the data we care for (item title, item url, item id and feed id)
        $item = array(
            "title" => (string)$oItem->title,
            "link"  => (string)(USE_JSON ? $oItem->alternate[0]->href : $oItem->link['href']),
            "id"    => (string)$oItem->id
        );
        
        if(USE_JSON)
            $item['streamId'] = (string)$oItem->origin->streamId;
        else {
            
            $streamId = explode("tag:google.com,2005:reader/", (string)$oItem->source->id);            
            $item['streamId'] = $streamId[1];
        }
        
        // Break the title to terms
        $terms = BreakToTerms($item['title']);

        // Place the item to the global term array
        foreach($terms as $term) {
         
            $globalTerms[$term]['term']     = $term;
            
            // To be used later in term groupping
            // Namely terms with the same children (items), will have the same uid
            $globalTerms[$term]['uid']      = md5($item['link'] . $globalTerms[$term]['uid']);
            
            $globalTerms[$term]['items'][md5($item['link'])]  = $item;
        }
    }
    
    // Count the total unread items
    $count = count($objItems);
    
    unset($objItems);
    
    // Group the term clusters which have the same children
    $groupedTerms = array();
    
    foreach($globalTerms as $gTerm) {

        $groupedTerms[$gTerm['uid']]['term']    .= " " . $gTerm['term'];
        $groupedTerms[$gTerm['uid']]['uid']     = $gTerm['uid'];
            
        $gIndex = 0;
        
        foreach($gTerm['items'] as $gItem) {
            
            $groupedTerms[$gTerm['uid']]['items'][md5($gItem['link'])] = $gItem;
            $gIndex++;
        }
        
        $groupedTerms[$gTerm['uid']]['count']   = $gIndex;
    }

    unset($globalTerms);
    
    // Separate the term clusters into two categories: 
    // Important (those which include favorite terms) and Rest (those which do not)
    $importantTerms = array();
    $restTerms      = array();
    
    foreach($groupedTerms as $gTerm) {
    
        $gTerm['md5term'] = md5(trim($gTerm['term']));
        
        if(IsFavTerm($gTerm['term']))
            $importantTerms[]   = $gTerm;
        else if(count($gTerm['items']) > 2)
            $restTerms[]        = $gTerm;
    }
    
    unset($groupedTerms);
    
    // Sort the two categories based on the number of items per term cluster
    usort($importantTerms,  "SortTerms");
    usort($restTerms,       "SortTerms");
    
    // Structure and return the array
    $rTerms = array();
    $rTerms['important'] = $importantTerms;
    $rTerms['rest']      = $restTerms;
    $rTerms['count']     = $count;
    
    return $rTerms;
}

/*
Descr   : Login user to Google Reader API
Args    : (string) username, (string) password
Returns : (array) (string) auth token
*/
function Login($username, $password) {
    
    $loginURL       = "https://www.google.com/accounts/ClientLogin";

    $loginStruct    = array(
        "service"   => "reader",
        "Email"     => $username,
        "Passwd"    => $password
    );

    $response = HTTPpost($loginURL, $loginStruct, "", true);

    if(strpos($response, "SID=") === FALSE)
        return array("errorCode" => 403);
    
    // Process the response
    $keys       = explode("\n", $response);    
    $hashKeys   = array();

    foreach($keys as $key) {

        $key    = trim($key);

        if($key == "")
            continue;

        $chunks = explode("=", $key);

        $hashKeys[trim($chunks[0])] = trim($chunks[1]);
    }

    // Legacy code, we might need it someday (nah)
    $sid = $hashKeys['SID'];
    $lsid= $hashKeys['LSID'];
    $auth= $hashKeys['Auth'];
    
    return array("auth" => $auth);
}
?>