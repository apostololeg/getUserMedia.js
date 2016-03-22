/*globals  $: true, getUserMedia: true, alert:true, ccv:true */

/*! getUserMedia demo - v1.0
* for use with https://github.com/addyosmani/getUserMedia.js
* Copyright (c) 2012 addyosmani; Licensed MIT */

 (function () {
	'use strict';

	// Put variables in global scope to make them available to the browser console.
	var video = document.querySelector('video');
	var canvas = document.getElementById('output');
	canvas.width = 320;
	canvas.height = 240;
    var App =
    {
        pos: 0,
        img: new Image(),
        ctx: canvas.getContext('2d'),
        image: canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height)
    };

	var facialDetectionButton = document.getElementById('detectFaces');
	facialDetectionButton.onclick = function() {
		if (constraints.context === 'webrtc') {
			var ctx = canvas.getContext("2d");
			ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
		} else if(constraints.context === 'flash'){
            window.webcam.capture();
        }
        else{
            alert('No context was supplied to getSnapshot()');
        }

		var comp = ccv.detect_objects({
			"canvas": (canvas),
			"cascade": cascade,
			"interval": 5,
			"min_neighbors": 1
		});

		if(comp.length == 1) {
            canvas.style.borderColor = 'green';
        } else {
            canvas.style.borderColor = 'red';
            alert('No face was detected, please take another picture');
        }
	};

	var constraints = {
	  audio: false,
	  video: true,
	  width: 320,
	  height: 240,
	  mode: "callback",
	  // callback | save | stream
	  swffile: "../dist/fallback/jscam_canvas_only.swf?timestamp=" + new Date().getTime(), // add unique item to URL to prevent IE11/secure browser SWF caching issue
	  quality: 85,
	  context: "",
	  el: "webcam",
	  	debug: function () {},
		// replace previous line with next three if you want debug messages from the SWF to appear as JS alerts
		/*debug: function (type, string) {
		    alert(type + ": " + string);
		},*/
		onCapture: function () {
		    window.webcam.save();
		},
		onTick: function () {},
		onSave: function (data) {

		    var col = data.split(";"),
		        img = App.image,
		        tmp = null,
		        w = this.width,
		        h = this.height;

		    for (var i = 0; i < w; i++) {
		        tmp = parseInt(col[i], 10);
		        img.data[App.pos + 0] = (tmp >> 16) & 0xff;
		        img.data[App.pos + 1] = (tmp >> 8) & 0xff;
		        img.data[App.pos + 2] = tmp & 0xff;
		        img.data[App.pos + 3] = 0xff;
		        App.pos += 4;
		    }

		    if (App.pos >= 4 * w * h) {
		        App.ctx.putImageData(img, 0, 0);
		        App.pos = 0;
		    }

		},
		onLoad: function () {}
	};

	function successCallback(stream) {
	  	if (constraints.context === 'webrtc') {
			window.stream = stream; // make stream available to browser console
		  	video.srcObject = stream;
		}
	}

	function errorCallback(error) {
	  console.log('navigator.getUserMedia error: ', error);
	}

	function flashError(error) {
        //hide photo capture
        $$("#photoCapture").hide();
        //show error message
        $$("#flashError").removeClass('outOfTheWay');
        //set "flag" so that photo saving is skipped
        document.getElementById("candidatePhotoDataURL").value = "SKIPPED";
        document.getElementById("photoSkippedDueToLimitations").value = "true";
        console.error('Flash was not detected');
    }

	try {
		navigator.getUserMedia(constraints, successCallback, errorCallback, flashError);
		constraints.context = 'webrtc';
	} catch (e) {
		// must have Flash installed in order for the fallback to work
        var hasFlash = false;
        try {
            var fo = new ActiveXObject('ShockwaveFlash.ShockwaveFlash');
            if (fo) {
                hasFlash = true;
            }
        } catch (e) {
            if (navigator.mimeTypes
            && navigator.mimeTypes['application/x-shockwave-flash'] != undefined
            && navigator.mimeTypes['application/x-shockwave-flash'].enabledPlugin) {
                hasFlash = true;
            }
        }
        if (!hasFlash) {
            flashError();
        } else {
			// rename the video element and then the fallback div element
			video.id = 'webcamFailed';
			video.width = 0;
			video.height = 0;
			document.getElementById('webcamFallback').id = 'webcam';
			// Initialize webcam options for fallback
			window.webcam = constraints;
			// Fallback to flash
			var source, el, cam;

			source = '<!--[if IE]>'+
			'<object id="XwebcamXobjectX" classid="clsid:D27CDB6E-AE6D-11cf-96B8-444553540000" width="' + constraints.width + '" height="' + constraints.height + '">'+
			'<param name="movie" value="' + constraints.swffile + '" />'+
			'<![endif]-->'+
			'<!--[if !IE]>-->'+
			'<object id="XwebcamXobjectX" type="application/x-shockwave-flash" data="' + constraints.swffile + '" width="' + constraints.width + '" height="' + constraints.height + '">'+
			'<!--<![endif]-->'+
			'<param name="FlashVars" value="mode=' + constraints.mode + '&amp;quality=' + constraints.quality + '" />'+
			'<param name="allowScriptAccess" value="always" />'+
			'</object>';
			el = document.getElementById(constraints.el);
			el.innerHTML = source;


			(function register(run) {

			  cam = document.getElementById('XwebcamXobjectX');

			  if (cam.capture !== undefined) {

			      // Simple callback methods are not allowed 
			      constraints.capture = function (x) {
			          try {
			              return cam.capture(x);
			          } catch (e) {}
			      };
			      constraints.save = function (x) {
			          try {
			              return cam.save(x);
			          } catch (e) {

			          }
			      };
			      constraints.setCamera = function (x) {
			          try {
			              return cam.setCamera(x);
			          } catch (e) {}
			      };
			      constraints.getCameraList = function () {
			          try {
			              return cam.getCameraList();
			          } catch (e) {}
			      };

			      // options.onLoad();
			      constraints.context = 'flash';
			      constraints.onLoad = successCallback;

			  } else if (run === 0) {
			      // options.debug("error", "Flash movie not yet registered!");
			      errorCallback();
			  } else {
			      // Flash interface not ready yet 
			      window.setTimeout(register, 1000 * (4 - run), run - 1);
			  }
			}(3));
		}
	}
})();