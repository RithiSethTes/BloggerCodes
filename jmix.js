/*--------------------------------------------------------------------------------
Youmax Classic v1.0 by Jake H. from CodeHandling
---------------------------------------------------------------------------------*/


/*------------------------------------------------------------------
[Table of contents]

1. Youmax Settings
2. DOM Initialization 
3. Options Initialization
4. Source Validation
5. Getters
    5.1 Channel Details
    5.2 Channel Playlists
    5.3 Playlist Videos
    5.4 Video Statistics
6. Setters
    6.1 Video Objects
    6.2 Playlist Objects
    6.3 Statistic Setters
7. Display List
8. Video Display Mechanisms
8. Sorting Handlers
9. Tab Handlers
9. Animation Handler
10.Load More Handler
12.Youmax Display Handler
11.Resize Handler
12.Utility Functions 
13.Youmax Main Function
-------------------------------------------------------------------*/

(function($) {

	"use strict";

	var settings = {

		apiKey					:"AIzaSyAlhAqP5RS7Gxwg_0r_rh9jOv_5WfaJgXw",	
		channelLinkForHeader	:"",	
		tabs:[],
		maxResults				:"10",
		videoDisplayMode		:"popup",										
		minimumViewsPerDayForTrendingVideos:"5",							
		displayFirstVideoOnLoad	:true,
		defaultSortOrder 		:"recent-first",
		youmaxDisplayMode		:"grid", 
		loadingMechanism        :"load-more",

        responsiveBreakpoints	:[600,900,2000,2500],
        gridThumbnailType		:"neat",
        dateFormat				:"relative",
        loadMoreText            :"<i class=\"fa fa-plus\"></i>&nbsp;&nbsp;Show me more videos..",
        ctaText                 :"<i class=\"fa fa-envelope\"></i>&nbsp;&nbsp;Get me a consultation..",
		ctaLink                 :null,
        previousButtonText      :"<i class=\"fa fa-angle-left\"></i>&nbsp;&nbsp;Previous",
        nextButtonText          :"Next&nbsp;&nbsp;<i class=\"fa fa-angle-right\"></i>",
        loadingText             :"loading...",
        allDoneText             :"<i class=\"fa fa-times\"></i>&nbsp;&nbsp;All done..",

        showHoverAnimation		:false,
        hideCtaButton			:true,
		
		/*
		offerTitle              :"Christmas Offer",
        offerDescription        :"50% Off on all Courses till December 31!",
        offerButtonText         :"Learn More",
        offerLink               :"http://codehandling.com",

        callouts 				:[{}],
        calloutType				:"list",
        */
                
		videoCache				:[],
		aspectRatio				:360/640,
		pageToken				:null,
		nextPageToken			:null,
		currentPageToken		:null,
		previousPageToken		:null,
		clearListOnDisplay		:true,
		channelIdForSearch		:null,
		searchFlag				:false,
		allDoneFlag				:false,

	},

	init = function($youmaxPro) {
	
		var youmaxWrapperStart = "<div class='yl-font-controller'>"
		var youmaxWrapperEnd = "</div>"
		var listWrapperStart = "<div class='yl-wrapper'>";
		var listWrapperEnd = "</div>";
		var channelHeader = "<div class='yl-header'></div>"
		
		
		var listHeader = "<div class='yl-list-title'><div class='yl-tab-container'><i class='fa fa-bars'></i></div></div>";
		
		var inlineContainer = "<div class='yl-inline-container'></div>";
		var listContainer = "<div class='yl-item-container'></div>";
		var loadMoreButton = "<div class='yl-load-more-button' data-text='"+settings.loadMoreText+"'>"+settings.loadMoreText+"</div>";
		var previousButton = "<div class='yl-previous-button' data-text='"+settings.previousButtonText+"'>"+settings.previousButtonText+"</div>";
		var nextButton = "<div class='yl-next-button' data-text='"+settings.nextButtonText+"'>"+settings.nextButtonText+"</div>";
		var ctaButton = "";
		var loadingMechanism = "";

		if(settings.loadingMechanism=="load-more") {
			loadingMechanism = loadMoreButton;
		} else {
			loadingMechanism = previousButton + nextButton;
		}
		
		$youmaxPro.empty().append(youmaxWrapperStart+channelHeader+listWrapperStart+listHeader+inlineContainer+listContainer+loadingMechanism+ctaButton+listWrapperEnd+youmaxWrapperEnd);
		showLoader($youmaxPro);
	},


    doOptions = function($youmaxPro){

    	var customCSS = "";
    	var headerColor,lightHeaderColor;

    	clearSettings();
    	settings.minimumViewsPerDayForTrendingVideos = parseInt(settings.minimumViewsPerDayForTrendingVideos,10);

    	//set date format
    	if(settings.dateFormat=="relative") {
    		convertDate = convertToRelativeDate;
    	} else if(settings.dateFormat=="specific") {
    		convertDate = convertToSpecificDate;
    	}

    	//set view - grid|list|double-list
    	handleYoumaxDisplay($youmaxPro);


    	//hiding options
    	if(settings.hideHeader) {
    		customCSS += ".yl-header {display:none;}";
    	}
    	if(settings.hideTabs) {
    		customCSS += ".yl-tab-container {display:none;}";
    	}
    	if(settings.hideLoadingMechanism) {
    		customCSS += ".yl-load-more-button,.yl-previous-button,.yl-next-button{display:none;}";
    		customCSS += ".yl-cta-button{width:100%;}";
    	}
    	if(settings.hideCtaButton) {
    		customCSS += ".yl-cta-button{display:none;}";
    		customCSS += ".yl-load-more-button {width: 100%;} .yl-previous-button, .yl-next-button {width: 48.5%;}";
    	}

    	//remove styles if already existing
    	$(".youmax-added-styles").remove();

    	//add new styles
		$("body").append("<style class='youmax-added-styles'>"+customCSS+"</style>");

    },

    clearSettings = function(){

    	settings.videoCache = [];
    	settings.nextPageToken = null;
    	settings.clearListOnDisplay = true;
    	settings.searchFlag = false;
    	settings.allDoneFlag = false;

    },


    initHeader = function($youmaxPro){

    	var identifierJSON;
    	identifierJSON = sanitizeLink("youtube-channel-uploads",settings.channelLink);

    	if(identifierJSON.identifier=="error") {
			return;
		}

		getChannelDetails(identifierJSON.identifierType,identifierJSON.identifier,null,$youmaxPro);
    
    },

    displayHeader = function(channelDetails,$youmaxPro){

    	var channelId = channelDetails.items[0].id;
    	var channelName = channelDetails.items[0].snippet.localized.title;
    	var channelLink = "http://www.youtube.com/channel/"+channelId;
    	var channelThumbnail = channelDetails.items[0].snippet.thumbnails.default.url;

    	var $youmaxHeader = $youmaxPro.find(".yl-header");

    	var channelThumbnailHTML = "<div class='yl-channel-thumbnail'><a href='"+channelLink+"' target='_blank'><img src='"+channelThumbnail+"' /></a></div>";
    	var channelDetailsHTML = "<div class='yl-channel-details'><div class='yl-channel-name'><a href='"+channelLink+"' target='_blank'>"+channelName+"</a></div><div class='yl-subscribe'><div class='g-ytsubscribe' data-channelid='"+channelId+"' data-layout='default' data-count='default'></div></div></div>";

    	$youmaxHeader.append(channelThumbnailHTML+channelDetailsHTML);

    	settings.channelIdForSearch = channelId;

		renderSubscribeButton();

    },

	
	//display youtube subscribe button
	renderSubscribeButton = function() {
	
		$.ajaxSetup({
		  cache: true
		});
		
		$.getScript("https://apis.google.com/js/platform.js")
		.done(function( script, textStatus ) {

		})
		.fail(function( jqxhr, settings, exception ) {

		});
		
	},
	


	createTabs = function($youmaxPro) {

		var identifierJSON,source,name,link,selected,channelId,channelUser,playlistId,tabId;
		var $youmaxTabContainer = $youmaxPro.find(".yl-tab-container");

		settings.tabs.push(new Object());
		settings.tabs[0].name = "Uploads";
		settings.tabs[0].type = "youtube-channel-uploads";
		settings.tabs[0].link = settings.channelLink;

		settings.tabs.push(new Object());
		settings.tabs[1].name = "Playlists";
		settings.tabs[1].type = "youtube-channel-playlists";
		settings.tabs[1].link = settings.channelLink;

		settings.tabs.push(new Object());
		settings.tabs[2].name = "Featured";
		settings.tabs[2].type = "youtube-playlist-videos";
		settings.tabs[2].link = settings.playlistLink;

		for(var i=0; i<settings.tabs.length; i++) {

			source = settings.tabs[i].type;
			name = settings.tabs[i].name;
			link = settings.tabs[i].link;

			identifierJSON = sanitizeLink(source,link);

			//skip Tab in case of error
			if(identifierJSON.identifier=="error") {
				continue;
			}

			tabId = source + "-" + identifierJSON.identifier;
			$youmaxTabContainer.append("<div class='yl-tab' id='"+tabId+"'>"+name+"</div>");


			if(source=="youtube-channel-uploads") {

				//update the tab with uploads's playlist id
				getChannelDetails(identifierJSON.identifierType,identifierJSON.identifier,tabId,$youmaxPro);
					

			} else if(source=="youtube-channel-playlists") {

				if(identifierJSON.identifierType=="youtube-channel-user") {

					//update the tab with channel id
					getChannelDetails(identifierJSON.identifierType,identifierJSON.identifier,tabId,$youmaxPro);

				} else {

					//load videos if default Tab
					if(settings.defaultTab==name) {
						$youmaxPro.find("#"+tabId).click();
					}					

				}

			} else if(source=="youtube-playlist-videos") {
				
				//load videos if default Tab
				if(settings.defaultTab==name) {
					$youmaxPro.find("#"+tabId).click();
				}

			} else if(source=="vimeo-user-videos") {
				
				//load videos if default Tab
				if(settings.defaultTab==name) {
					$youmaxPro.find("#"+tabId).click();
				}

			}
			
		} //for loop on tabs ends

		
	},

	sanitizeLink = function(source,link) {

		var sanityIndex,channelId,channelUser,playlistId,userName;
		var identifierJSON = {
			identifier 			:"",
			identifierType		:""
		};

		//remove trailing slashes
		link = link.replace(/\/$/, "");
		//remove "/videos" from the end of URL
		link = link.replace("/videos","");
		//remove "/playlists" from the end of URL
		link = link.replace("/playlists","");


		if(source=="youtube-channel-uploads" || source=="youtube-channel-playlists") {

			sanityIndex = link.indexOf("/user/");
			if(sanityIndex==-1) {
				
				sanityIndex = link.indexOf("/channel/");

				if(sanityIndex==-1) {

					alert("\n\nChannel Link should be of the format: \nhttps://www.youtube.com/channel/UComP_epzeKzvBX156r6pm1Q \nOR\nhttps://www.youtube.com/user/designmilk\n\n");
					identifierJSON.identifierType = "youtube-channel-id";
					identifierJSON.identifier = "error";

				} else {

					channelId = link.substring(sanityIndex+9);
					identifierJSON.identifierType = "youtube-channel-id";
					identifierJSON.identifier = channelId;
					
				}

			} else {

				channelUser = link.substring(sanityIndex+6);
				identifierJSON.identifierType = "youtube-channel-user";				
				identifierJSON.identifier = channelUser;

			}


		} else if(source=="youtube-playlist-videos") {
			
			identifierJSON.identifierType = "youtube-playlist-id";

			sanityIndex = link.indexOf("list=");
			if(sanityIndex==-1) {
				alert("\n\nPlaylist Link should be of the format: \nhttps://www.youtube.com/playlist?list=PL6_h4dV9kuuIOBDKgxu3q9DpvvJFZ6fB5\n\n");
				identifierJSON.identifier = "error";
			} else {			
				playlistId = link.substring(sanityIndex+5);
				identifierJSON.identifier = playlistId;
			}
			

		} else if(source=="vimeo-user-videos") {

			identifierJSON.identifierType = "vimeo-user";

			sanityIndex = link.indexOf("vimeo.com/");
			if(sanityIndex==-1) {
				alert("\n\nVimeo User Link should be of the format: \nhttps://vimeo.com/user123\n\n");
				identifierJSON.identifier = "error";
			} else {			
				userName = link.substring(sanityIndex+10);
				identifierJSON.identifier = userName;
			}

		}

		return identifierJSON;



	},

	getChannelDetails = function(channelType,channelIdentifier,tabId,$youmaxPro) {

		var apiURL = "";

		if(channelType=="youtube-channel-user") {
			apiURL = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails%2Csnippet&forUsername="+channelIdentifier+"&key="+settings.apiKey;	
		} else if(channelType=="youtube-channel-id") { 
			apiURL = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails%2Csnippet&id="+channelIdentifier+"&key="+settings.apiKey;	
		}
		

		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				
				if(null==tabId) {
					displayHeader(response,$youmaxPro);
				} else {
					updateTabs(tabId,response,$youmaxPro);	
				}
				
			},
			error: function(html) { 
				
				
			}
		});

	},


	getChannelPlaylists = function(channelId,$youmaxPro) {

		var apiURL, videoArray, pageTokenUrl = "";

		if(settings.nextPageToken!=null) {
			pageTokenUrl = "&pageToken="+settings.nextPageToken;
		}

		apiURL = "https://www.googleapis.com/youtube/v3/playlists?part=contentDetails%2Csnippet&channelId="+channelId+"&maxResults="+settings.maxResults+pageTokenUrl+"&key="+settings.apiKey;
			
		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				videoArray = createPlaylistObjects(response.items,$youmaxPro);				
				handleToken("youtube",response.nextPageToken,$youmaxPro);
				displayItems(videoArray,$youmaxPro);
				videoDisplayMechanism($youmaxPro);
			},
			error: function(html) { 
				
				
			}
		});

	},

	getPlaylistVideos = function(playlistId,$youmaxPro) {
		
		var apiURL, pageTokenUrl = "";

		if(settings.nextPageToken!=null) {
			pageTokenUrl = "&pageToken="+settings.nextPageToken;
		}

		apiURL = "https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="+playlistId+"&maxResults="+settings.maxResults+pageTokenUrl+"&key="+settings.apiKey;


		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				createVideoObjects(response.items,$youmaxPro);
				handleToken("youtube",response.nextPageToken,$youmaxPro);
			},
			error: function(html) { 
				
				
			}
		});			
	},


	
	getVimeoUserVideos = function (userId,$youmaxPro) {

		var apiURL, pageTokenUrl = "";
		var videoArray;

		if(settings.nextPageToken!=null) {
			pageTokenUrl = "&"+settings.nextPageToken;
		}

		apiURL = "https://api.vimeo.com/users/"+userId+"/videos?access_token="+settings.vimeoAccessToken+"&per_page="+settings.maxResults+pageTokenUrl;

		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				videoArray = createVimeoVideoObjects(response.data,$youmaxPro);
				handleToken("vimeo",response.paging.next,$youmaxPro);
				displayItems(videoArray,$youmaxPro);
				videoDisplayMechanism($youmaxPro);
			},
			error: function(html) { 
				
				
			}
		});

	},


	getYouTubeVideoLikes = function(videoId,$famaxPro) {

		var apiURL, postArray;

		apiURL = "https://www.googleapis.com/youtube/v3/commentThreads?part=id%2Csnippet&textFormat=plainText&videoId="+videoId+"&maxResults=6&key="+settings.apiKey+"&order=time";
		

		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				displayYouTubeComments(response.items,$famaxPro);
			},
			error: function(html) { 
				
				
			}
		});

	},		


	getYouTubeVideoComments = function(videoId,$famaxPro) {

		var apiURL, postArray;

		apiURL = "https://www.googleapis.com/youtube/v3/commentThreads?part=id%2Csnippet&textFormat=plainText&videoId="+videoId+"&maxResults=6&key="+settings.apiKey+"&order=time";
		

		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				displayYouTubeComments(response.items,$famaxPro);
			},
			error: function(html) { 
				
				
			}
		});

	},	



	handleToken = function(network,token,$youmaxPro) {

		if(token==null) {
			showAllDoneButtonText($youmaxPro);
			settings.nextPageToken = null;
			return;
		}

		showOriginalButtonText($youmaxPro);

		//token is not null.. next page is present
		if(network=="vimeo") {
			token = token.substring(token.lastIndexOf("&")+1);	
			settings.nextPageToken = token;
		} else if(network="youtube") {
			settings.nextPageToken = token;	
		}

	},


	getVideoStatistics = function(videoIdArray,videoArray,$youmaxPro) {

		var apiURL = "https://www.googleapis.com/youtube/v3/videos?part=statistics%2CcontentDetails%2Csnippet&id="+videoIdArray+"&key="+settings.apiKey;
		var videoArray;

		$.ajax({
			url: apiURL,
			type: "GET",
			async: true,
			cache: true,
			dataType: 'json',
			success: function(response) {
				videoArray = addStatisticsToVideos(response.items,videoArray);
				displayItems(videoArray,$youmaxPro);
				videoDisplayMechanism($youmaxPro);
			},
			error: function(html) { 
				
				
			}
		});			
	},


    createVideoObjects = function(itemArray,$youmaxPro) {

    	var videoIdArray = [], videoArray = [];
    	var proSnippet;

    	for(var i=0; i<itemArray.length; i++) {
    		proSnippet = new Object();
    		proSnippet.image = itemArray[i].snippet.thumbnails.medium.url;
    		proSnippet.title = itemArray[i].snippet.title;
    		proSnippet.description = itemArray[i].snippet.description;
    		proSnippet.playlistId = itemArray[i].snippet.playlistId;
    		proSnippet.videoId = itemArray[i].snippet.resourceId.videoId;
			proSnippet.link = "https://www.youtube.com/watch?v="+proSnippet.videoId+"&list="+proSnippet.playlistId;

			//TODO: Date will be added for uploads in next version
			//proSnippet.date = itemArray[i].snippet.publishedAt;
			//proSnippet.formattedDate = convertDate(proSnippet.date);
			
			videoArray.push(proSnippet);
			videoIdArray.push(proSnippet.videoId);
    	}

    	//get video stats
    	getVideoStatistics(videoIdArray,videoArray,$youmaxPro);    	

    },

    createVimeoVideoObjects = function(itemArray,$youmaxPro) {

    	var videoIdArray = [], videoArray = [];
    	var proSnippet;
    	var now = new Date().getTime();
		var views,viewsPerDay,duration;

    	for(var i=0; i<itemArray.length; i++) {
    		proSnippet = new Object();
    		proSnippet.image = itemArray[i].pictures.sizes[2].link;
    		proSnippet.title = itemArray[i].name;
    		proSnippet.description = itemArray[i].description;
    		if(null==proSnippet.description) {
    			proSnippet.description = "";
    		}
			
			//link
			proSnippet.link = itemArray[i].link;
    		proSnippet.videoId = proSnippet.link.substring(proSnippet.link.indexOf("/",15)+1);

			//views
			views = itemArray[i].stats.plays;
			proSnippet.views = views;
    		
    		//date
    		proSnippet.date = itemArray[i].release_time;
			proSnippet.formattedDate = convertDate(proSnippet.date);

			//calculate view per day to define trend
			viewsPerDay = (views)/((now - new Date(proSnippet.date).getTime())/1000/60/60/24);
			proSnippet.viewsPerDay = viewsPerDay;
			
			//convert views
			views = convertViews(views);
			proSnippet.commaSeparatedViews = views;

			//duration
			duration = convertVimeoDuration(itemArray[i].duration);
			proSnippet.duration = duration;
			
			videoArray.push(proSnippet);
    	}  	

		settings.currentCacheBlockStart = settings.videoCache.length;
    	settings.videoCache = settings.videoCache.concat(videoArray);
    	settings.currentCacheBlockEnd = settings.videoCache.length;

    	return videoArray;

    },


    createSearchVideoObjects = function(itemArray,$youmaxPro) {

    	var videoIdArray = [], videoArray = [];
    	var proSnippet;

    	for(var i=0; i<itemArray.length; i++) {
    		proSnippet = new Object();
    		proSnippet.image = itemArray[i].snippet.thumbnails.medium.url;
    		proSnippet.title = itemArray[i].snippet.title;
    		proSnippet.description = itemArray[i].snippet.description;
    		proSnippet.playlistId = null;
    		proSnippet.videoId = itemArray[i].id.videoId;
			proSnippet.link = "http://www.youtube.com/watch?v="+proSnippet.videoId;

			//TODO: Date will be added for uploads in next version
			//proSnippet.date = itemArray[i].snippet.publishedAt;
			//proSnippet.formattedDate = convertDate(proSnippet.date);
			
			videoArray.push(proSnippet);
			videoIdArray.push(proSnippet.videoId);
    	}

    	//get video stats
    	getVideoStatistics(videoIdArray,videoArray,$youmaxPro);    	

    },


    createPlaylistObjects = function(itemArray,$youmaxPro) {

    	var videoIdArray = [], videoArray = [];
    	var proSnippet;

    	for(var i=0; i<itemArray.length; i++) {
    		proSnippet = new Object();
    		proSnippet.isPlaylist = true;
    		proSnippet.image = itemArray[i].snippet.thumbnails.medium.url;
    		proSnippet.title = itemArray[i].snippet.title;
    		proSnippet.description = itemArray[i].snippet.description;
    		proSnippet.playlistId = itemArray[i].id;
    		proSnippet.videoId = itemArray[i].id;
			proSnippet.link = "http://www.youtube.com/playlist?list="+proSnippet.playlistId;

			
			proSnippet.date = itemArray[i].snippet.publishedAt;
			proSnippet.formattedDate = convertDate(proSnippet.date);

			//adding number of videos in a playlist inside the "commaSeparatedViews" variable
			proSnippet.itemCount = itemArray[i].contentDetails.itemCount;
			if(itemArray[i].contentDetails.itemCount <= 0) {
				//skip the playlist with 0 videos
				continue;
			}

			proSnippet.viewsPerDay = 0;
			
			videoArray.push(proSnippet);
			videoIdArray.push(proSnippet.videoId);
    	}

		settings.currentCacheBlockStart = settings.videoCache.length;
    	settings.videoCache = settings.videoCache.concat(videoArray);
    	settings.currentCacheBlockEnd = settings.videoCache.length;

    	return videoArray;	

    },



    addStatisticsToVideos = function(statisticArray,videoArray,$youmaxPro) {

		var now = new Date().getTime();
		var views,viewsPerDay,duration;


    	for(var i=0; i<statisticArray.length; i++) {
    		views = statisticArray[i].statistics.viewCount;
			videoArray[i].views = views;
    		videoArray[i].date = statisticArray[i].snippet.publishedAt;
			videoArray[i].formattedDate = convertDate(videoArray[i].date);

			//likes & comments
			videoArray[i].likes = statisticArray[i].statistics.likeCount;
			videoArray[i].commaSeparatedLikes = convertViews(statisticArray[i].statistics.likeCount);
			videoArray[i].comments = statisticArray[i].statistics.commentCount;
			videoArray[i].commaSeparatedComments = convertViews(statisticArray[i].statistics.commentCount);

			//calculate view per day to define trend
			viewsPerDay = (views)/((now - new Date(videoArray[i].date).getTime())/1000/60/60/24);
			videoArray[i].viewsPerDay = viewsPerDay;
			
			//convert views
			views = convertViews(views);
			videoArray[i].commaSeparatedViews = views;

			duration = convertDuration(statisticArray[i].contentDetails.duration);
			videoArray[i].duration = duration;


    	}

    	settings.currentCacheBlockStart = settings.videoCache.length;
    	settings.videoCache = settings.videoCache.concat(videoArray);
    	settings.currentCacheBlockEnd = settings.videoCache.length;

    	return videoArray;

    },

    updateTabs = function(tabId,channelDetails,$youmaxPro){

    	var $youmaxTab = $youmaxPro.find("#"+tabId);
    	var uploadsPlaylistId = channelDetails.items[0].contentDetails.relatedPlaylists.uploads;
    	var channelId = channelDetails.items[0].id;
    	var finalTabId;

    	if(tabId.indexOf("youtube-channel-uploads")!=-1) {
    		finalTabId = "youtube-channel-uploads-"+uploadsPlaylistId;
    		$youmaxTab.attr("id",finalTabId);
    	} else if(tabId.indexOf("youtube-channel-playlists")!=-1) {
    		finalTabId = "youtube-channel-playlists-"+channelId;
    		$youmaxTab.attr("id",finalTabId);
    	}

    	if(settings.defaultTab==$youmaxTab.text()) {
			$youmaxPro.find("#"+finalTabId).click();
		}

    },


	displayItems = function(videoArray,$youmaxPro) {

		var viewboxHTML, dateboxHTML, trendBoxHTML, itemboxHTML, durationHTML, viewStringHTML, sortOrder, containerHTML="", playlistHTML = "", hoverPlayHTML;
		var image, views, viewsPerDay, title, description, date, link, id, popupLink, duration, viewsText, isPlaylist, itemCount, likes, comments;
		var $youmaxContainer = $youmaxPro.find(".yl-item-container");
		var list = videoArray;		
		//list = settings.videoCache
		

		if(settings.clearListOnDisplay) {
			clearList($youmaxPro);
		}

		for(var count=0; count<list.length; count++) {	
			
            image = list[count].image;
			views = list[count].commaSeparatedViews;
			viewsPerDay = list[count].viewsPerDay;
			title = list[count].title;
			description = list[count].description;
			date = list[count].formattedDate;
            link = list[count].link;
            id = list[count].videoId;
            popupLink = "http://www.youtube.com/watch?v="+id;
            duration = list[count].duration;            
            isPlaylist = list[count].isPlaylist;
            itemCount = list[count].itemCount;

            likes = list[count].commaSeparatedLikes;
            comments = list[count].commaSeparatedComments;

            description = processDescription(description);

            hoverPlayHTML = "<div class='yl-play-overlay'></div>";
            //<div class='yl-play-icon-holder'><i class='fa fa-play'></i><span>"+duration+"</span></div>

            if(isPlaylist) {
            	$("body").addClass("yl-playlist");
            	viewsText = itemCount + " <span>videos</span>";
            	playlistHTML = "<div class='yl-playlist-video-count-wrapper'><div class='yl-playlist-video-count-box'><span class='yl-playlist-video-count'>"+itemCount+"</span><br>VIDEOS<br><div class='yl-playlist-line-wrapper'><span class='yl-playlist-line'></span><br><span class='yl-playlist-line'></span><br><span class='yl-playlist-line'></span></div></div></div>";
            	hoverPlayHTML = "";
            } else {
            	$("body").removeClass("yl-playlist");
            	viewsText = views + " <span>views</span>";
            }

			if(viewsPerDay>settings.minimumViewsPerDayForTrendingVideos) {
				trendBoxHTML = "<div class='yl-views-per-day'><i class='fa fa-bolt'></i></div>";
			} else {
				trendBoxHTML = "";
			}

			if(null!=duration) {
				durationHTML = "<div class='yl-duration'><i class='fa fa-play'></i>&nbsp;"+duration+"</div>";
			} else {
				durationHTML = "";
			}

			//viewboxHTML = "<div class='yl-view-bucket' data-views='"+views+"'><div class='yl-view-wrapper'><div class='yl-view-icon'><div class='triangle-with-shadow'></div></div><div class='yl-view-count'>"+viewsFancy+"</div></div></div>";

			viewboxHTML = "<div class='yl-view-bucket' data-views='"+views+"'><div class='yl-view-wrapper'><div class='yl-view-count'>"+viewsText+"</div></div></div>";


			viewStringHTML = "<div class='yl-view-string'>"+viewsText+"</div>";
		
			dateboxHTML = "<div class='yl-date-bucket'>"+date+"</div>";

			itemboxHTML = "<div class='yl-item' id='"+id+"' data-likes='"+likes+"' data-comments='"+comments+"'><div class='yl-focus' href='"+popupLink+"' data-link='"+link+"'><div class='yl-thumbnail'><img src='"+image+"''>"+durationHTML+hoverPlayHTML+"</div><br/>"+viewboxHTML+"</div><div class='yl-text'><div class='yl-title-description-wrapper'><div class='yl-title'>"+title+"</div><div class='yl-description'>"+description+"</div></div>"+"<div class='yl-separator-for-grid'></div>"+viewStringHTML+dateboxHTML+trendBoxHTML+"</div>"+playlistHTML+"</div>";

			containerHTML += "<div class='yl-item-wrapper'>"+itemboxHTML+"</div>";

		}

		$youmaxContainer.append(containerHTML);

	},


	clearList = function($youmaxPro) {
		$youmaxPro.find(".yl-item-container").empty();
	},

    videoDisplayMechanism = function($youmaxPro){

    	if(settings.videoDisplayMode=="popup") {
			registerPopup($youmaxPro);	
		} else if(settings.videoDisplayMode=="inline") {
			registerInlineEmbed($youmaxPro);	
		} else {
			registerLinkToYouTube($youmaxPro);
		}

    },

    registerPopup = function($youmaxPro) {

    	var currentTabId, playlistId, embedURL = "";
    	var autoPlayString = settings.autoPlay ? "&autoplay=1" : "&autoplay=0";

    	//get selected tab and handle the tab click
		currentTabId = $youmaxPro.find(".yl-selected-tab").attr("id");
		playlistId = currentTabId.substring(currentTabId.indexOf("-",20)+1);

    	if(currentTabId.indexOf("youtube-channel-playlists")!=-1) {
    		embedURL = "http://www.youtube.com/embed?listType=playlist&list=%id%&rel=0"+autoPlayString;
    	} else {
    		embedURL = "http://www.youtube.com/embed/%id%?&rel=0"+autoPlayString;
    	}

    	$youmaxPro.find(".yl-focus").magnificPopup({
    		gallery: {
		      enabled: false
		    },
    		type:'iframe',
    		iframe:{
    			
    			markup:
    				'<div class="mfp-iframe-scaler">'+
						'<button title="Close (Esc)" type="button" class="mfp-close">×</button>'+
						'<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
					'</div>'+
					'<div class="mfp-preloader">Loading...</div>',

    			patterns: {
					youtube: {
						src: embedURL
					},
					vimeo : {
						src: embedURL
					}
				}
    		},

    		alignTop: false,
    		
    		callbacks: {
				change: function() {
						
					// Triggers each time when content of popup changes
					var $baseElement = $(this.currItem.el[0].offsetParent);
					
					
				}			
			}
    	});

    },

	registerInlineEmbed = function($youmaxPro) {

		//get selected tab and handle the tab click
		var currentTabId = $youmaxPro.find(".yl-selected-tab").attr("id");
		var playlistId = currentTabId.substring(currentTabId.indexOf("-",20)+1);

    	$youmaxPro.on("click",".yl-focus", function(){

	    	var embedURL = "";
	    	var id = $(this).parents(".yl-item").attr("id");
	    	var $youmaxInlineContainer = $youmaxPro.find(".yl-inline-container");
	    	var autoPlayString = settings.autoPlay ? "&autoplay=1" : "&autoplay=0";
	    	var videoContainerHTML, videoDataHTML;
	    	
	    	if(currentTabId.indexOf("youtube-channel-playlists")!=-1) {
	    		embedURL = "http://www.youtube.com/embed?listType=playlist&list="+id+"&rel=0"+autoPlayString;
	    	} else {
	    		embedURL = "http://www.youtube.com/embed/"+id+"?listType=playlist&list="+playlistId+"&rel=0"+autoPlayString;
	    	}

	    	videoContainerHTML = '<div class="fluid-width-video-wrapper" style="padding-top:'+(settings.aspectRatio*100)+'%;"><iframe class="yl-inline-iframe" src="'+embedURL+'" frameborder="0" allowfullscreen></iframe></div>';

	    	videoDataHTML = '<div class="yp-popup-details yp-inline-popup"></div>';

    		$youmaxInlineContainer.html(videoContainerHTML+videoDataHTML).css("display","inline-block");

    		$('html, body').animate({scrollTop: $youmaxInlineContainer.offset().top - 150},'slow');

    		var $baseElement = $(this).parent(".yl-item");
    		displayPopupData($baseElement,$youmaxPro);

    	});

    	if(settings.displayFirstVideoOnLoad) {
    		$youmaxPro.find(".yl-focus:first").click();
    	}

    },

    registerLinkToYouTube = function($youmaxPro) {

    	$youmaxPro.find(".yl-focus").each(function(i,v){
    		var $focusElement = $(v);
    		var link = $focusElement.data("link");
    		$focusElement.wrap("<a href='"+link+"' target='_blank'></a>");
    	});

    },


	handleTabs = function ($youmaxPro) {
		$youmaxPro.on("click",".yl-tab",function() {

			var $tab = $(this);
	    	clearSettings();
	    	showLoader($youmaxPro);

	    	//add selected tab class to current tab
	    	$youmaxPro.find(".yl-tab").removeClass("yl-selected-tab");
	    	$tab.addClass("yl-selected-tab");

			displayTabItems($youmaxPro);

		});
	},

    displayTabItems = function($youmaxPro) {

    	//get selected tab and handle the tab click
		var tabId = $youmaxPro.find(".yl-selected-tab").attr("id");
    	var identifier = tabId.substring(tabId.indexOf("-",17)+1);

    	if(tabId.indexOf("youtube-channel-uploads")!=-1) {
    		getPlaylistVideos(identifier,$youmaxPro);
    	} else if(tabId.indexOf("youtube-channel-playlists")!=-1) {
    		getChannelPlaylists(identifier,$youmaxPro);
    	} else if(tabId.indexOf("youtube-playlist-videos")!=-1) {
    		getPlaylistVideos(identifier,$youmaxPro);
    	} else if(tabId.indexOf("vimeo-user-videos")!=-1) {
    		getVimeoUserVideos(identifier,$youmaxPro);
    	} 

    },



	handleLoadingMechanism = function($youmaxPro) {

		//Load More button handler
		$youmaxPro.on('click','.yl-load-more-button', function(){

			//remove first video auto load flag
			settings.displayFirstVideoOnLoad = false;

			if(settings.allDoneFlag) {
				return;
			}
			
			$(this).addClass("yl-loading").html(settings.loadingText);

			//do not clear list during load mores
			settings.clearListOnDisplay = false;

			checkCache("next",$youmaxPro);

		});

		//Next Button Handler
		$youmaxPro.on('click','.yl-next-button', function(){

			//remove first video auto load flag
			settings.displayFirstVideoOnLoad = false;

			//cannot use alldone flag for prev-next buttons
			/*if(settings.allDoneFlag) {
				return;
			}*/
			$(this).addClass("yl-loading").html(settings.loadingText);

			//Clear list during load mores
			settings.clearListOnDisplay = true;

			//fade out the current items
			$youmaxPro.find(".yl-item").addClass("yl-fading");

			checkCache("next",$youmaxPro);

		});

		//Previous Button Handler
		$youmaxPro.on('click','.yl-previous-button', function(){

			//remove first video auto load flag
			settings.displayFirstVideoOnLoad = false;

			//cannot use alldone flag for prev-next buttons
			/*if(settings.allDoneFlag) {
				return;
			}*/
			$(this).addClass("yl-loading").html(settings.loadingText);

			//fade out the current items
			$youmaxPro.find(".yl-item").addClass("yl-fading");

			//Clear list during load mores
			settings.clearListOnDisplay = true;

			checkCache("previous",$youmaxPro);

		});


	},

	checkCache = function(direction,$youmaxPro) {

		var newCacheBlockStart, newCacheBlockEnd, videoArray, maxResults;
		maxResults = parseInt(settings.maxResults,10);

		if(direction=="previous") {

			//for previous navigation
			newCacheBlockStart = settings.currentCacheBlockStart - maxResults;
			newCacheBlockEnd = settings.currentCacheBlockStart;

			
			if(newCacheBlockStart<0) {
				newCacheBlockStart = 0;
			}

			if(newCacheBlockEnd<=0) {
				showAllDoneButtonText($youmaxPro);
				return;
			}

		
		} else if(direction=="next") {

			//for next navigation
			newCacheBlockStart = settings.currentCacheBlockEnd;
			newCacheBlockEnd = newCacheBlockStart + maxResults;

			if(newCacheBlockEnd>settings.videoCache.length) {
				newCacheBlockEnd = settings.videoCache.length;
			}

			if(newCacheBlockStart>=settings.videoCache.length) {
				showMoreVideosHandler($youmaxPro);
				return;
			}			

		}

		settings.currentCacheBlockStart = newCacheBlockStart;
		settings.currentCacheBlockEnd = newCacheBlockEnd;

		videoArray = settings.videoCache.slice(newCacheBlockStart, newCacheBlockEnd);
		displayItems(videoArray,$youmaxPro);

		showOriginalButtonText($youmaxPro);

	},


	showOriginalButtonText = function($youmaxPro) {

		var originalText;

		var $nextButton = $youmaxPro.find(".yl-next-button");
		var $previousButton = $youmaxPro.find(".yl-previous-button");
		var $loadMoreButton = $youmaxPro.find(".yl-load-more-button");
		
		originalText = $nextButton.data("text");
		$nextButton.removeClass("yl-loading").html(originalText);

		originalText = $previousButton.data("text");
		$previousButton.removeClass("yl-loading").html(originalText);

		originalText = $loadMoreButton.data("text");
		$loadMoreButton.removeClass("yl-loading").html(originalText);

	},

	showAllDoneButtonText = function($youmaxPro) {

		var $loadingButton = $youmaxPro.find(".yl-loading");

		if(null==$loadingButton || $loadingButton.length==0) {
			if(settings.loadingMechanism=="load-more") {
				$loadingButton = $youmaxPro.find(".yl-load-more-button");
			} else {
				$loadingButton = $youmaxPro.find(".yl-next-button");
			}
		}

		$loadingButton.removeClass("yl-loading").html(settings.allDoneText);
		settings.allDoneFlag = true;

		//remove fading for pagination
		$youmaxPro.find(".yl-item").removeClass("yl-fading");
		
	},


	showMoreVideosHandler = function($youmaxPro) {

		//do nothing if next token is not present
		if(settings.nextPageToken==null) {
			showAllDoneButtonText($youmaxPro);
			settings.nextPageToken = null;
			return;
		}

		if(settings.searchFlag) {
			displaySearchItems($youmaxPro);
		} else {
			displayTabItems($youmaxPro);	
		}

	},

	handleYoumaxDisplay = function($youmaxPro) {

		if(settings.youmaxDisplayMode=="double-list") {
			if($youmaxPro.width()<settings.responsiveBreakpoints[0]) {
				$youmaxPro.addClass("yl-grid").removeClass("yl-double-list").removeClass("yl-list");
			}  else if($youmaxPro.width()<settings.responsiveBreakpoints[1]) {
				$youmaxPro.removeClass("yl-double-list").removeClass("yl-grid").addClass("yl-list");
			} else if($youmaxPro.width()>=settings.responsiveBreakpoints[1]) {
	    		$youmaxPro.addClass("yl-double-list").removeClass("yl-grid").removeClass("yl-list");
	    	}  
		}

		if(settings.youmaxDisplayMode=="list") {
			if($youmaxPro.width()<settings.responsiveBreakpoints[0]) {
				$youmaxPro.addClass("yl-grid").removeClass("yl-list");
			} else {
				$youmaxPro.removeClass("yl-grid").addClass("yl-list");
			}
		}

		if(settings.youmaxDisplayMode=="grid") {
    		$youmaxPro.addClass("yl-grid");
    		if($youmaxPro.width()<settings.responsiveBreakpoints[0]) {
    			$youmaxPro.addClass("yl-1-col-grid").removeClass("yl-2-col-grid yl-3-col-grid yl-4-col-grid yl-4-col-grid");
    		} else if($youmaxPro.width()<settings.responsiveBreakpoints[1]) {
    			$youmaxPro.addClass("yl-2-col-grid").removeClass("yl-1-col-grid yl-3-col-grid yl-4-col-grid yl-5-col-grid");
    		} else if($youmaxPro.width()<settings.responsiveBreakpoints[2]) {
    			$youmaxPro.addClass("yl-3-col-grid").removeClass("yl-1-col-grid yl-2-col-grid yl-4-col-grid yl-5-col-grid");
    		} else if($youmaxPro.width()<settings.responsiveBreakpoints[3]) {
    			$youmaxPro.addClass("yl-4-col-grid").removeClass("yl-1-col-grid yl-2-col-grid yl-3-col-grid yl-5-col-grid");
    		} else {
    			$youmaxPro.addClass("yl-5-col-grid").removeClass("yl-1-col-grid yl-2-col-grid yl-3-col-grid yl-4-col-grid");
    		}

    		//set thumbnail type - simple|full
	    	if(settings.gridThumbnailType=="simple") {
	    		$youmaxPro.addClass("yl-simple-thumbnails")
	    	} else if(settings.gridThumbnailType=="neat") {
	    		$youmaxPro.addClass("yl-neat-thumbnails")
	    	}
    	}

    	//set callout View - grid|list|double-list
    	if(settings.calloutType=="list") {
    		$youmaxPro.addClass("yl-list-callouts");
    	} else if(settings.calloutType=="grid") {
    		$youmaxPro.addClass("yl-grid-callouts");
    	} else if(settings.calloutType=="double-list") {
    		$youmaxPro.addClass("yl-double-list-callouts");
    	} 

    	//set simple popup view
    	if($youmaxPro.width()<900) {
    		$("body").addClass("yl-simple-popup");
    	}

	},

	handleResize = function($youmaxPro){

		$(window).resize(function() {
			handleYoumaxDisplay($youmaxPro);
		});

	},


	showLoader = function($youmaxPro) {

		$youmaxPro.find(".yl-inline-container").empty();
		$youmaxPro.find(".yl-item-container").empty().append("<div class='yl-loader'>Youmax<br><span>is loading..</span></div>");
	},


    saveSeenVideos = function($youmaxPro) {
        
        var seenVideos = [];

        $youmaxPro.find(".yl-seen").each(function(){
            seenVideos.push($(this).attr("id"));
        });

        return seenVideos;
    },

    highlightSeenVideos = function(seenVideos,$youmaxPro) {
        
        for(var k=seenVideos.length;k>=0;k--) {
            $youmaxPro.find("#"+seenVideos[k]).addClass("yl-seen");
        }
        
    },

    convertViews = function(views) {
    			
		var commaSeparatedViews = "";
		views = ""+views;
		
		while(views.length>0) {
			if(views.length > 3) {
				commaSeparatedViews = ","+views.substring(views.length-3)+commaSeparatedViews;
				views = views.substring(0,views.length-3);
			} else {
				commaSeparatedViews = views + commaSeparatedViews;
				break;
			}
		}
		
		return commaSeparatedViews;
    },

    convertDate = convertToSpecificDate,

	convertToSpecificDate = function(date) {
		//date incoming format "2016-08-26T21:48:14.000Z"
		var months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
		var innerDate = date.substring(0,date.indexOf("T"));
		var splitDate = innerDate.split("-");
		//var returnDate = splitDate[2]+"-"+months[splitDate[1]-1]+"-"+splitDate[0];
		var returnDate = "<div class='yl-date'>"+splitDate[2]+"</div><div class='yl-month'>"+months[splitDate[1]-1]+"</div><div class='yl-year'>"+splitDate[0]+"</div>";

		//date outgoing format "26 Aug 2016"
		return returnDate;
	},

	//utility function to display time
	convertDuration = function(videoDuration) {
		
		var duration,returnDuration;
		videoDuration = videoDuration.replace('PT','').replace('S','').replace('M',':').replace('H',':');
		
		var videoDurationSplit = videoDuration.split(':');
		returnDuration = videoDurationSplit[0];
		for(var i=1; i<videoDurationSplit.length; i++) {
			duration = videoDurationSplit[i];
			if(duration=="") {
				returnDuration+=":00";
			} else {
				duration = parseInt(duration,10);
				if(duration<10) {
					returnDuration+=":0"+duration;
				} else {
					returnDuration+=":"+duration;
				}
			}
		}
		if(videoDurationSplit.length==1) {
			returnDuration="0:"+returnDuration;
		}
		return returnDuration;
		
	},

	//utility function to display time
	convertVimeoDuration = function(videoDuration) {

		var hours,min,sec;
		min = parseInt(videoDuration/60,10);
		sec = videoDuration - (min*60);
		
		if(sec<10) {
			sec="0"+sec;
		}
		
		if(min>=60) {
			hours = parseInt(min/60,10);
			min = min - (hours*60);
			
			if(min<10) {
				min="0"+min;
			}
			
			return hours+":"+min+":"+sec;
		} else {
			return min+":"+sec;
		}
	
	},


	convertToRelativeDate = function (timestamp) {
	
		var dateDiffMS, dateDiffHR, dateDiffDY, dateDiffMH, dateDiffYR;
		if(null==timestamp||timestamp==""||timestamp=="undefined")
			return "?";
		
		dateDiffMS = Math.abs(new Date() - new Date(timestamp));
		
		dateDiffHR = dateDiffMS/1000/60/60;
		if(dateDiffHR>24) {
			dateDiffDY = dateDiffHR/24;
			if(dateDiffDY>30) {
				dateDiffMH = dateDiffDY/30;
				if(dateDiffMH>12) {
					dateDiffYR = dateDiffMH/12;
					dateDiffYR = Math.round(dateDiffYR);
					if(dateDiffYR<=1) {
						return dateDiffYR+" <span>year ago</span>";
					} else {
						return dateDiffYR+" <span>years ago</span>";
					}						
				} else {
					dateDiffMH = Math.round(dateDiffMH);
					if(dateDiffMH<=1) {
						return dateDiffMH+" <span>month ago</span>";
					} else {
						return dateDiffMH+" <span>months ago</span>";
					}						
				}
			} else {
				dateDiffDY = Math.round(dateDiffDY);
				if(dateDiffDY<=1) {
					return dateDiffDY+" <span>day ago</span>";
				} else {
					return dateDiffDY+" <span>days ago</span>";
				}
			}
		} else {
			dateDiffHR = Math.round(dateDiffHR);
			if(dateDiffHR<1) {
				return "just now";
			}else if(dateDiffHR==1) {
				return dateDiffHR+" <span>hour ago</span>";
			} else {
				return dateDiffHR+" <span>hours ago</span>";
			}
		}		

	
	},

	processDescription = function(description) {
	
		var spotArray,replaceLink;

		description = description.replace(/"/g, "'");
		
		spotArray = description.match(/(http(s)*:\/\/|www\.).+?(\s|\n|$)/g);

		if(null!=spotArray) {
			for(var i=0;i<spotArray.length;i++) {
				spotArray[i] = spotArray[i].trim();
				description = description.replace(spotArray[i],"~~"+i+"~~");
			}

			for(var i=0;i<spotArray.length;i++) {

				if(spotArray[i].indexOf("www.")==0) {
					replaceLink = "http://"+spotArray[i];
				} else {
					replaceLink = spotArray[i];
				}
				description = description.replace("~~"+i+"~~","<a target='_blank' href='"+replaceLink+"' class='famax-link'>"+spotArray[i]+"</a>");
			}
		}
		
		return description;					
	};


	$.fn.youmax=function(options) {

		var $youmaxPro=this;
		settings = $.extend(settings,options);

		init($youmaxPro);
		doOptions($youmaxPro);
		initHeader($youmaxPro);
		handleTabs($youmaxPro);
		createTabs($youmaxPro);
		
		handleLoadingMechanism($youmaxPro);
		handleResize($youmaxPro);
		
		return this;

	}


})(jQuery);

