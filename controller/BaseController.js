var globalRef;
sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/core/routing/History"
], function(controller, History) {
	"use strict";
	return controller.extend("Cloud.controller.NotFound", {
		onInit: function() {
			//get Notifications
			globalRef = this;
			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV");
			window.setInterval(this._fetchNotifcations, 10000);
		},
		_fetchNotifcations: function() {
			var oHeadModel = globalRef.getView().getModel("notifsCount");
			var aData = oHeadModel.getData();
			var oItemModel = globalRef.getView().getModel("notifs");

			globalRef.oModel.read("/JobsSet", {
				success: function(oData) {
					var iCount = oData.results.length;
					oItemModel.setData(oData);
					aData.previousCount = aData.count;
					aData.count = iCount;
					oHeadModel.refresh(true);
					oItemModel.refresh(true);
					if (aData.previousCount < aData.count) {
						sap.m.MessageToast.show("You have new notification(s)");
					}
				}
			});
		},
		getRouter: function() {
			return sap.ui.core.UIComponent.getRouterFor(this);
		},
		onNavBack: function() {
			// this.hideSideContent();
			var oHistory, sPreviousHash;
			oHistory = History.getInstance();
			sPreviousHash = oHistory.getPreviousHash();
			if (sPreviousHash !== undefined) {
				window.history.go(-1);
			} else {
				this.getRouter().navTo("appHome", {}, true /*no history*/ );
			}
		},
		handleToggleClick: function() {
			this.getView().byId("DynamicSideContent").toggle();
		},
		hideSideContent: function() {
			// var sId = this.getView().getParent().getId();
			// sap.ui.getCore().byId(sId).setShowSideContent(false);
		},
		goHome: function() {
			// this.hideSideContent();
			this.getRouter().navTo("appHome");
		},
		onPressNotifications: function() {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("Cloud.view.Alert", this);
			}
			var oItemModel = this.getView().getModel("notifs");
			this._oDialog.setModel(oItemModel, "msg");
			this._oDialog.open();
		},
		closeDialog: function() {
			this._oDialog.close();
		},
		closeLegendBox: function() {

		},
		goHotline: function() {
			// this.hideSideContent();
			this.getRouter().navTo("hotline");
		},
		goToAssembly: function() {
			// this.hideSideContent();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("Assembly");
		},
		openProject: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("msg").getPath();
			var sProject = oEvent.getSource().getBindingContext("msg").getModel().getProperty(sPath).ProjectId;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("assemblyOverview", {
				projectId: sProject
			});
		},
		deleteNotif: function(oEvent) {
			var batchChanges = [];
			var oEntry = {};
			var sPath = oEvent.getSource().getBindingContext("msg").getPath();
			var oData = oEvent.getSource().getBindingContext("msg").getModel().getProperty(sPath);
			
			oEntry = {
				ProjectId : oData.ProjectId,
				ItemId : oData.ItemId,
				JOB_NAME : oData.JOB_Name,
				JOB_COUNT : oData.JOB_COUNT
			};
			var that = this;
			sap.ui.core.BusyIndicator.show();
			var sDeletePath = "JobsSet(ProjectId='" + oData.ProjectId +"',ItemId='" + oData.ItemId + "',JOB_NAME='" + oData.JOB_NAME + "',JOB_COUNT='" + oData.JOB_COUNT + "')";
			batchChanges.push(this.oModel.createBatchOperation(sDeletePath, "DELETE", oEntry));
			this.oModel.addBatchChangeOperations(batchChanges);
			this.oModel.submitBatch(function() {
				sap.m.MessageBox.information("Deleted Successfully");
				that._fetchNotifcations();
				sap.ui.core.BusyIndicator.hide();
			});
		},
		clearAll: function(oEvent) {

		}
	});
});