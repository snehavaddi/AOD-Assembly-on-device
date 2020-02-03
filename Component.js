sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/Device",
	"Cloud/model/models"
], function(UIComponent, Device, models) {
	"use strict";
	jQuery.sap.declare("Cloud.Component");
	return UIComponent.extend("Cloud.Component", {

		metadata: {
			manifest: "json"
		},

		init: function() {
			// call the base component's init function
			UIComponent.prototype.init.apply(this, arguments);
			// set the device model
			this.setModel(models.createDeviceModel(), "device");
			this.getRouter().initialize();
			var oRootPath = jQuery.sap.getModulePath("Cloud"); // your resource root
			var oImageModel = new sap.ui.model.json.JSONModel({
				path: oRootPath
			});
			this.setModel(oImageModel, "imageModel");
			var oNotificationHeadModel = new sap.ui.model.json.JSONModel({
				count: 0,
				previousCount: 0
			});
			var oNotifs  = new sap.ui.model.json.JSONModel();
			this.setModel(oNotificationHeadModel, "notifsCount");
			this.setModel(oNotifs, "notifs");
		}
	});

});