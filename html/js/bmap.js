//设置信息


var map;
var isFirst = true;
var strCity = "杭州";
var iZoom = 13;
//覆盖物数组
var overlays = [];
//
var trackMarkers = new Array();
var overlaysByCicle_already=[];
var overlaysByCicle_new=[];
var overlaysBySearch=[];
var overlaysByLocSlct=[];
var drawingManager;
var overviewMapCtrol;
var token = "";
/*****
 * 获取授权码
 * @return
 */
function getTDTToken(){
	//alert(mapImgeUrl);
	$.ajax({
		url:mapImgeUrl+"RemoteTokenServer",
		type:"post",
		data:{
			request:"getToken",
	        expiration:180,
	        username:"zb_scjyb_dmtzhdd",
	        password:"dmtzhdd20170505",
	        clientid:"ref."
        },
		success:function (data){
			//alert(data);
        	token = data;
			initMap();
			bindEvtToMapTools();
			setDrawTypeToHander();
			resize();
			window.onresize=function(){resize();};
		},
		error:function(e){
			 alert("获取安全地图服务的token值失败。\n" + e);
		}
	});
}
//=============================================================================================
//创建地图对象并添加图层
//=============================================================================================
var BASEMAP_TYPE_RASTER = 0;
var BASEMAP_TYPE_VECTOR = 1;
var BASEMAP_TYPE_TERRAIN = 2;

var LAYER_ID_TDT_RASTER = "tdtRasterLayer";
var LAYER_ID_TDT_RASTER_LABEL = "tdtRasterLabelLayer";
var LAYER_ID_TDT_VECTOR = "tdtVectorLayer";
var LAYER_ID_TDT_VECTOR_LABEL = "tdtVectorLabelLayer";
var LAYER_ID_TDT_TERRAIN = "tdtTerrainLayer";
var LAYER_ID_TDT_TERRAIN_LABEL = "tdtTerrainLabelLayer";
function initTDTLayer(){
    //---------------------------------------------------------------------------------------------
    AddTDTLayer(LAYER_ID_TDT_RASTER, mapImgeUrl+"OneMapServer/rest/services/base-tdt-image-globe/WMTS", "img", token);//加载影像底图
    AddTDTLayer(LAYER_ID_TDT_RASTER_LABEL, mapImgeUrl+"OneMapServer/rest/services/base-tdt-label-image/WMTS", "cia", token);//加载影像标注
    //---------------------------------------------------------------------------------------------
    AddTDTLayer(LAYER_ID_TDT_VECTOR, mapImgeUrl+"OneMapServer/rest/services/base-tdt-vector-globe/WMTS", "vec", token);//加载矢量底图
    AddTDTLayer(LAYER_ID_TDT_VECTOR_LABEL, mapImgeUrl+"OneMapServer/rest/services/base-tdt-label-vector/WMTS", "cva", token);//加载矢量标注
    //---------------------------------------------------------------------------------------------
    AddTDTLayer(LAYER_ID_TDT_TERRAIN, mapImgeUrl+"OneMapServer/rest/services/base-tdt-ter-globe/WMTS", "ter", token);//加载矢量底图
    AddTDTLayer(LAYER_ID_TDT_TERRAIN_LABEL, mapImgeUrl+"OneMapServer/rest/services/base-tdt-label-ter/WMTS", "cta", token);//加载矢量标注
    //---------------------------------------------------------------------------------------------
    BindingEvents();
    ChangeBasemap(BASEMAP_TYPE_VECTOR);
}
//创建天地图图层

function AddTDTLayer(id, url, layerType, token){
	require([        
        "layerEx/TDTLayer"
    ], function(TDTLayer){
    		var cTDTLayer = new TDTLayer();		    
		    cTDTLayer.id = id;
		    cTDTLayer.baseURL = url;
		    cTDTLayer.layerType = layerType;
		    cTDTLayer.tokenValue = token;
		    cTDTLayer.visible = false;
		    map.addLayer(cTDTLayer);
    	});    
}
//=============================================================================================
//切换底图部分
//=============================================================================================
function BindingEvents() {
    //document.getElementById("imgRaster").addEventListener('click', onImageClick, false);
    //document.getElementById("imgVector").addEventListener('click', onImageClick, false);
    //document.getElementById("imgTerrain").addEventListener('click', onImageClick, false);
    dojo.connect(dojo.byId("imgRaster"), "click", onImageClick);
    dojo.connect(dojo.byId("imgVector"), "click", onImageClick);
    dojo.connect(dojo.byId("imgTerrain"), "click", onImageClick);
}
function onImageClick(event) {
   switch(event.target.id)
   {
       case "imgRaster" : { ChangeBasemap(BASEMAP_TYPE_RASTER); break; };
       case "imgVector" : { ChangeBasemap(BASEMAP_TYPE_VECTOR); break; };
       case "imgTerrain" : { ChangeBasemap(BASEMAP_TYPE_TERRAIN); break; };
   }
}
function ChangeBasemap(type)
{
    switch(type)
    {
        case BASEMAP_TYPE_RASTER: {
            HideAllLayers();
            SetLayerVisible(LAYER_ID_TDT_RASTER, true);
            SetLayerVisible(LAYER_ID_TDT_RASTER_LABEL, true);
            break;
        }
        case BASEMAP_TYPE_VECTOR: {
            HideAllLayers();
            SetLayerVisible(LAYER_ID_TDT_VECTOR, true);
            SetLayerVisible(LAYER_ID_TDT_VECTOR_LABEL, true);
            break;
        }
        case BASEMAP_TYPE_TERRAIN: {
            HideAllLayers();
            SetLayerVisible(LAYER_ID_TDT_TERRAIN, true);
            SetLayerVisible(LAYER_ID_TDT_TERRAIN_LABEL, true);
            break;
        }
    }
}
function HideAllLayers()
{
    var layerIDArray = map.layerIds;
    if(layerIDArray && (layerIDArray.length > 0))
    {
        for(var i = 0; i < layerIDArray.length; i++)
        {
            SetLayerVisible(layerIDArray[i], false);
        }
    }
}
function SetLayerVisible(cID, cVisible)
{
    var lyr =  map.getLayer(cID);
    if(lyr)
    {
        if(lyr.visible != cVisible)
        {
            lyr.setVisibility(cVisible);
        }
    }
}
function initMap() {
	map = new esri.Map("map"); 
	/*
	 map = new esri.Map("map", {
		 basemap: "streets",
	     center: [-120.741, 56.39],
	     slider: false,
	     zoom: 6
	   });
	   */
	dojo.connect(map, "onLoad", function(){

		drawingManager =  new esri.toolbars.Draw(map);
		dojo.connect(map.graphics, "onClick", function(evt){
			var id = "";
			var type = "";
			var id = "";
			var obj = evt.graphic.attributes;
			if(evt.graphic.geometry.type == "point"){
				if(obj){
					if(obj.type == 'operator'){
						type = "operator";
						id = obj.operatorID;
						
					}else if(obj.type == 'employee'){
						type = "employee";
						id = obj.employeeID;
					}else if(obj.type == 'group'){
						type = "group";
						id = obj.groupID;
						var treeObj = $.fn.zTree.getZTreeObj("listTree");
						var treeNode = treeObj.getNodesByParam('groupID', id, null);
						obj = treeNode[0];
					}else if(obj.type == 'video'){
						type = "video";
						id = obj.videoID;
					}
				}
				mapAddListInfoWindow(evt.graphic, id, type, "", obj);
			}	
		});
			//回调获得覆盖物信息
	var overlaycomplete = function(e) {
        mapClearDrawAll();  //清除原先的覆盖物
        //overlays.push(e.geometry);  //记录覆盖物句柄
       	if(e.geometry.type == "point" ){
       		//graphicLayer.remove(e.geometry);
       		var point = e.geometry;
       		addMarkListToMap(point.x, point.y);
       		showOrHideTreeTools();
       		setDrawTypeToHander();
       		return;
       	}
        
        //获取覆盖物范围内的标注    
        var overlay_temp = new esri.Graphic(e.geometry, fillSymbol);
        graphicLayer.add(overlay_temp);
        overlays.push(overlay_temp);
        var str = "";
        var marks_slt = [];
        
        for(var i=0; i<listOverlays.length; i++){
        	//alert(listOverlays[i].marker.geometry.type);
        	if(listOverlays[i].marker.geometry.type == "point"){
        		var point = listOverlays[i].marker;
        		if(e.geometry.contains(point.geometry)){
        			
        			if(!listOverlays[i].marker.visible){
        				listOverlays[i].marker.show();
        				
	        			overlaysByCicle_new.push(listOverlays[i].marker);
	        		}
	        		
        			marks_slt.push(listOverlays[i]);
        		}
        		
        	}
        }
        getResultByCicle(marks_slt);
	};
		//添加鼠标绘制工具监听事件，用于获取绘制结果
		drawingManager.on("draw-end", overlaycomplete);
	});  
	map.on("load", function(){
		if (isFirst) {
			try {
				window.external.MapLoadedEvent();
			} catch (e) {
			}
			addDataToTree();
			//若存在树结构，则默认展开一级
			
			
			
		}
		isFirst = false;
	});
	initTDTLayer();//恢复
	
	//var layer = new esri.layers.ArcGISTiledMapServiceLayer("http://10.246.2.54/ArcGIS/rest/services/base-map-world-d500/MapServer");  
	//map.addLayer(layer);
	 
	var resizeTimer;                            	
	graphicLayer = new esri.layers.GraphicsLayer();
	//把图层添加到地图上
	map.addLayer(graphicLayer);
	//117.242150645996,34.2035126689453
	var location = new esri.geometry.Point(117.242150645996,34.2035126689453, map.spatialReference);
	//map.centerAndZoom(location, 8);



	dojo.require("esri.symbols.SimpleFillSymbol");
	dojo.require("esri.symbols.SimpleLineSymbol");
	dojo.require("esri.Color");
//	var fillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
//          new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
//          new esri.Color([0, 255, 0]), 2), new esri.Color([255, 255, 0, 0.25]));
	var fillSymbol = new esri.symbol.SimpleFillSymbol(esri.symbol.SimpleFillSymbol.STYLE_SOLID,
	          new esri.symbol.SimpleLineSymbol(esri.symbol.SimpleLineSymbol.STYLE_SOLID,
	      	    	  new esri.Color([255,48,48]), 2), new esri.Color([255,182,193, 0.25]));
	map.on("click", function(e){
		//alert(e.mapPoint.x+", "+e.mapPoint.y+", "+map.getZoom());
			if (closeDetailFlag) {
				closeDetail();
				zoomMarker(curMarker, 24);
			}
			closeDetailFlag = true;
	});
	map.on("mouse-drag", function(){
//		if(interval){                 //清除来电动画的定时器
//    		clearInterval(interval);
//    	}
//    	if(graphic_circle){                //来电动画的图像
//    		graphicLayer.remove(graphic_circle);
//    	}
//    	callInID = "";
		closeDetail();
		zoomMarker(curMarker, 24);
	});
}

function setDrawTypeToMark() {
	drawingManager.activate("point");
	//drawingManager.open();
}
function setDrawTypeToHander() {
	changeMapToolBtnStyle('hander');
	//alert(drawingManager);
	drawingManager.deactivate();
	//drawingManager.close();
}

//删除标注
function mapRemoveOverlay(marker) {
	map.removeOverlay(marker);

	//删除数组中的句柄
	for ( var i = overlays.length - 1; i >= 0; i--) {
		if (overlays[i] == marker) {
			overlays.splice(i, 1);
		}
	}
}

//清除覆盖物(包括标注)
function mapClearDrawAll() {
	for ( var i = overlays.length - 1; i >= 0; i--) {
		if(overlays[i].geometry.type == "circle" || overlays[i].geometry.type == "polygon" || overlays[i].geometry.type == "extent")
    {
    		mapClearDrawByCicled();
    }
		graphicLayer.remove(overlays[i]);
	}
	overlays.splice(0, overlays.length);
	overlays.length = 0;

	for ( var i = trackMarkers.length - 1; i >= 0; i--) {
		graphicLayer.remove(trackMarkers[i]);
	}
	trackMarkers.splice(0, trackMarkers.length);
	if(nodeBySearch && nodeBySearch.length>0)
	{		
	}else{
		mapClearDrawBySearch();
	}
}

//清除覆盖物(不包括标注)
function mapClearDraw() {
	for ( var i = overlays.length - 1; i >= 0; i--) {
		if (overlays[i] != "[object Marker]") {
			map.removeOverlay(overlays[i]);
			overlays.splice(i, 1);
		}
	}
}

function mapClearDrawByCicled() {
	for (var i = overlaysByCicle_new.length - 1; i >= 0; i--) {
        //map.removeOverlay(overlaysByCicle_new[i]);
		overlaysByCicle_new[i].hide();
    }
	overlaysByCicle_new.splice(0, overlaysByCicle_new.length);
}
function mapClearDrawBySearch(){
	for (var i = overlaysBySearch.length - 1; i >= 0; i--) {
        //map.removeOverlay(overlaysBySearch[i]);
		overlaysBySearch[i].hide();
    }
	overlaysBySearch.splice(0, overlaysBySearch.length);
}
//显示标注
function mapMarkerShow(marker) {
	marker.show();
}

//隐藏标注
function mapMarkerHide(marker) {
	marker.hide();
}

function mapPanToSelectedMarker(type , id){
	for(var i=0; i<listOverlays.length; i++){
		if(listOverlays[i].type == type && listOverlays[i].id == id){
			var marker = listOverlays[i].marker;
			var point = marker.geometry;
			map.centerAt(point);
			zoomOutMarker(marker, type, id);
			
//			var screenPoint = map.toScreen(point);
//			alert("x::"+screenPoint.x+"  y::"+screenPoint.y);
//			$(".pulse").css('left',screenPoint.x);
//			$(".pulse").css('top',screenPoint.y);
//			$(".pulse").css('display','block');
			break;
		}
	}
}
/*
//通讯录添加标注
function mapAddListOverlay(xx, yy, id, labelname, type) {
    var point = new BMap.Point(xx, yy);

   	var marker = new BMap.Marker(point, {
					icon: new BMap.Icon("images/iconA_32.png", new BMap.Size(32, 32))
			});
    map.addOverlay(marker); //添加标注
	var operatorMarker = {"type":type, "id":id, "marker":marker};
	listOverlays.push(operatorMarker);
    if (labelname != "") {
        //var label = new BMap.Label(labelname, { offset: new BMap.Size(20, -10) });
    	var content = "<div class='diyLabel'>"+labelname+"</div>" 
		+ "<div class='transparent-down diyTrans-border'></div>"
		+ "<div class='transparent-down diyTrans'></div>";
		var label = new BMap.Label(content, { offset: new BMap.Size(-5, -30)});
		label.setStyle({color:'block',backgroundColor: 'none', border: 'grey 0px solid'});
        marker.setLabel(label); //添加Label
    }
}
*/

 //添加带信息窗口的标注
function mapAddListOverlayAndInfoWindow(xx, yy, id, labelname, type, info, obj, showFlag) {
	var point = new esri.geometry.Point(xx, yy, map.spatialReference);
	var symbol = new esri.symbol.PictureMarkerSymbol("images/iconA_32.png", 25, 25);
	if(type=='operator' || type == 'employee') {
		symbol = new esri.symbol.PictureMarkerSymbol("img/user_online_24.png", 24, 38);
	} 
	else if(type == 'video' ){
		symbol = new esri.symbol.PictureMarkerSymbol("img/video_online_24.png", 30, 36);
	}else if(type == 'group'){
		symbol = new esri.symbol.PictureMarkerSymbol("img/user_online_24.png", 24, 38);
	}
	var height = symbol.height;
	symbol.setOffset(0, height/2);
  //要在模版中显示的参数
	var attr = obj;
  //创建图像
  var graphic = new esri.Graphic(point, symbol, attr);
  mapRemoveListOverlay(type, id);
  //把图像添加到刚才创建的图层上
  //graphicLayer.add(graphic);
  map.graphics.add(graphic);
  
  if(showFlag){
		graphic.show();
	}else{
		graphic.hide();
	}
	var operatorMarker = {"type":type, "id":id, "marker":graphic, 'name':labelname};
	listOverlays.push(operatorMarker);
	
}

//删除标注
function mapRemoveListOverlay(type, id){
	for(var i=0; i<listOverlays.length;i++){
	 	var operatorMarker = listOverlays[i];
		if(operatorMarker.type == type && operatorMarker.id==id){
			listOverlays.splice(i,1);
			//alert(1);
			map.graphics.remove(operatorMarker.marker);
			//alert(2);
		}
	}
}

function hideListOverlay(type, id){
	for(var i=0; i<listOverlays.length;i++){
	 	var operatorMarker = listOverlays[i];
		if(operatorMarker.type == type && operatorMarker.id==id){
			//map.removeOverlay(operatorMarker.marker);
			operatorMarker.marker.hide();
			operatorMarker.isVisible = false;
		}
	}
}

function showListOverlay(type, id, name){
	/*
	var point_test = new BMap.Point(120.073589, 30.351674);
	var marker_test = new BMap.Marker(point_test);
	
	map.addOverlay(marker_test);
	*/
	for(var i=0; i<listOverlays.length;i++){
	 	var operatorMarker = listOverlays[i];
		if(operatorMarker.type == type && operatorMarker.id==id){
			/*
			var content = "<div class='diyLabel'>"+name+"</div>" 
			+ "<div class='transparent-down diyTrans-border'></div>"
			+ "<div class='transparent-down diyTrans'></div>";
			var label = new BMap.Label(content, { offset: new BMap.Size(-5, -30)});
			label.setStyle({color:'block',backgroundColor: 'none', border: 'grey 0px solid'});
			operatorMarker.marker.setLabel(label); //添加Label
			map.addOverlay(operatorMarker.marker);
			*/
			operatorMarker.marker.show();
			operatorMarker.isVisible = true;
			break;
		}
	}
}
