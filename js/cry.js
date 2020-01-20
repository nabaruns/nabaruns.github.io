$(document).ready(function () {
  /*Checks the hash ref of url and loads the corresponding section 
  Input: the location hash (with the #)
  */
  function loadSection(locationHash){
    //Remove nav button highlight
    $('ul.nav > li').removeClass('active');
    $('div.contents').hide('fast');
    if(locationHash) {
      var sectionID = locationHash.substring(1);
      $("#"+sectionID+"Div").show('fast');
      $('ul.nav > li').removeClass('active');
      $("#"+sectionID).addClass('active');
    }else{
      $("#homeDiv").show('fast');
      $("#home").addClass('active');
    }
  }

  //Check if the URL loaded initially has a location ref and display the corresponding one
  loadSection(window.location.hash);

  //Onclick event for email id. Should be triggered only once
  $('span.encrypted').one('click', function (e){
    e.preventDefault();
    var cipher = this.textContent;
    var plain = "";
    //Decrypt
    for (var i = 0; i < cipher.length; i ++) {
      var c = cipher[i];
      // If it's a letter...
      if (c.match(/[a-z]/i)) {
        // Get its code
        var code = cipher.charCodeAt(i);
        // Uppercase letters
        if ((code >= 65) && (code <= 90))
          c = String.fromCharCode(((code - 65 + 13) % 26) + 65);
        // Lowercase letters
        else if ((code >= 97) && (code <= 122))
          c = String.fromCharCode(((code - 97 + 13) % 26) + 97);
      }
      plain += c;
    }
    //Replace the contents
    this.textContent=plain;
    //Remove the class to get rid of the "click to decrypt message"
    this.className="";
  });

	//Onclick event for the nav bar	
  $('ul.nav > li').click(function (e) {
    e.preventDefault();
    //If the user clicks the active section, nothing to do, return
    if($(this).hasClass('active')){
    	return;
    }
    $('ul.nav > li').removeClass('active');
    $(this).addClass('active');

    $('div.contents').hide('fast');
	  var divId = this.id;
    $("#"+divId+"Div").show('fast');

    if(history.pushState) {
      history.pushState(null, null, '#'+divId);
    } else {
      location.hash = '#'+divId;
    }
  }); //End onClick event for nav bar

  //Listens to forward and back button clicks and loads the corresponding section
  window.addEventListener('popstate', function(e) {
    loadSection(document.location.hash);
  });

  //Hide menu on click for smaller screens
  $('.navbar-collapse ul li a').click(function(){ 
    $('.navbar-toggle:visible').click();
  });

});
