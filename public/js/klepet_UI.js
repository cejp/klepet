function divElementEnostavniTekst(sporocilo) {
  sporocilo = sporocilo.replace(/\</g, '&lt;').replace(/\>/g, '&gt;').replace('&lt;img', '<img').replace('png\' /&gt;', 'png\' />');
  sporocilo = addSlike(sporocilo);
  sporocilo = addVideo(sporocilo);

  return $('<div style="font-weight: bold"></div>').html(sporocilo);
}

function divElementHtmlTekst(sporocilo) {
  return $('<div></div>').html('<i>' + sporocilo + '</i>');
}

function procesirajVnosUporabnika(klepetApp, socket) {
  var sporocilo = $('#poslji-sporocilo').val();
  sporocilo = dodajSmeske(sporocilo);
  var sistemskoSporocilo;

  if (sporocilo.charAt(0) == '/') {
    sistemskoSporocilo = klepetApp.procesirajUkaz(sporocilo);
    if (sistemskoSporocilo) {
      $('#sporocila').append(divElementHtmlTekst(sistemskoSporocilo));
    }
  } else {
    sporocilo = filtirirajVulgarneBesede(sporocilo);
    klepetApp.posljiSporocilo(trenutniKanal, sporocilo);
    $('#sporocila').append(divElementEnostavniTekst(sporocilo));
    $('#sporocila').scrollTop($('#sporocila').prop('scrollHeight'));
  }

  $('#poslji-sporocilo').val('');
}

var socket = io.connect();
var trenutniVzdevek = "", trenutniKanal = "";

var vulgarneBesede = [];
$.get('/swearWords.txt', function(podatki) {
  vulgarneBesede = podatki.split('\r\n');
});

function filtirirajVulgarneBesede(vhod) {
  for (var i in vulgarneBesede) {
    vhod = vhod.replace(new RegExp('\\b' + vulgarneBesede[i] + '\\b', 'gi'), function() {
      var zamenjava = "";
      for (var j=0; j < vulgarneBesede[i].length; j++)
        zamenjava = zamenjava + "*";
      return zamenjava;
    });
  }
  return vhod;
}

$(document).ready(function() {
  var klepetApp = new Klepet(socket);

  socket.on('vzdevekSpremembaOdgovor', function(rezultat) {
    var sporocilo;
    if (rezultat.uspesno) {
      trenutniVzdevek = rezultat.vzdevek;
      $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
      sporocilo = 'Prijavljen si kot ' + rezultat.vzdevek + '.';
    } else {
      sporocilo = rezultat.sporocilo;
    }
    $('#sporocila').append(divElementHtmlTekst(sporocilo));
  });

  socket.on('pridruzitevOdgovor', function(rezultat) {
    trenutniKanal = rezultat.kanal;
    $('#kanal').text(trenutniVzdevek + " @ " + trenutniKanal);
    $('#sporocila').append(divElementHtmlTekst('Sprememba kanala.'));
  });

  socket.on('sporocilo', function (sporocilo) {
    var novElement = divElementEnostavniTekst(sporocilo.besedilo);
    $('#sporocila').append(novElement);
  });
  
  socket.on('kanali', function(kanali) {
    $('#seznam-kanalov').empty();

    for(var kanal in kanali) {
      kanal = kanal.substring(1, kanal.length);
      if (kanal != '') {
        $('#seznam-kanalov').append(divElementEnostavniTekst(kanal));
      }
    }

    $('#seznam-kanalov div').click(function() {
      klepetApp.procesirajUkaz('/pridruzitev ' + $(this).text());
      $('#poslji-sporocilo').focus();
    });
  });

   socket.on('uporabniki', function(user) {
    $('#seznam-uporabnikov').empty(); 
    for (var i=0; i < user.length; i++) {
      $('#seznam-uporabnikov').append(divElementEnostavniTekst(user[i])); //Ponovno vnesi uporabnike
    }
    
     $('#seznam-uporabnikov div').click(function() {
       var vzdevek = $(this).text(); //Pridobi vzdevek
       $('#poslji-sporocilo').val('/zasebno "' + vzdevek + '"'); //pošlji
      $('#poslji-sporocilo').focus();
    });
  });
  


  setInterval(function() {
    socket.emit('kanali');
    socket.emit('uporabniki', {kanal: trenutniKanal});
  }, 1000);

  $('#poslji-sporocilo').focus();

  $('#poslji-obrazec').submit(function() {
    procesirajVnosUporabnika(klepetApp, socket);
    return false;
  });
  
  
});

function dodajSmeske(vhodnoBesedilo) {
  var preslikovalnaTabela = {
    ";)": "wink.png",
    ":)": "smiley.png",
    "(y)": "like.png",
    ":*": "kiss.png",
    ":(": "sad.png"
  }
  for (var smesko in preslikovalnaTabela) {
    vhodnoBesedilo = vhodnoBesedilo.replace(smesko,
      "<img src='http://sandbox.lavbic.net/teaching/OIS/gradivo/" +
      preslikovalnaTabela[smesko] + "' />");
  }
  return vhodnoBesedilo;
}

//Slike
function addSlike(sporocilo) {
  var regex =/(https?:\/\/[\S]+\.(?:png|jpg|gif))(?!\s*(?:"|')?\s*?\/?>)/gi;
  var found = sporocilo.match(regex);
  try{
    for (var i=0; i<found.length; i++)
    {
      sporocilo = sporocilo + '<img src="' + found[i] + '" width="200" style="padding-left: 20px;" />';
    }
  }catch(err){
    
  }
  return sporocilo;
}
//Youtube

var jeVideo = 0;
function addVideo(input) {
  jeVideo = 0;
  var el="";
  var tmp ="";
  var input2 = input.split(" "); //Split in link and other texts
  var youUrl = "https://www.youtube.com/watch?v="
  for (var i in input2) { 
    try{
      tmp = input2[i].substring(0,youUrl.length); // search substring
    }catch(err){} 
      if (tmp == youUrl) //is youtube link
      {
        var tmp2 = input2[i].substring(youUrl.length,input[i].length); //get whole string back
        el += '<br /><iframe class="video" src="https://www.youtube.com/embed/'+tmp2+'" allowfullscreen></iframe>'; //insert link
        jeVideo = 1;
      }
  }
  return input+el;
}
//dregljaj
  socket.on('dregljaj', function(vzdevek) {
      $('#vsebina').jrumble();
      $('#vsebina').trigger('startRumble');
      var cas = setTimeout(function(){$('#vsebina').trigger('stopRumble');}, 1500);
  });
