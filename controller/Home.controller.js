sap.ui.define([
	"Cloud/controller/BaseController",
	"sap/ui/core/format/DateFormat"
], function(BaseController, DateFormat) {
	"use strict";

	return BaseController.extend("Cloud.controller.Home", {
		_onObjectMatched: function() {

			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV/");
			this.getView().setModel(this.oModel);
			sap.ui.getCore().setModel(this.oModel);
			var that = this;
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyyMMdd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			this.getTodayHotlines();
		},
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("appHome").attachPatternMatched(this._onObjectMatched, this);
			var that = this;
		},

		onPost: function(oEvent) {
			var oView = this.getView();
			var oDialog = oView.byId('chatbox');
			var oModel = oDialog.getModel("newMsg");
			var oModel1 = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV/");
			sap.ui.getCore().setModel(oModel1);
			this.getView().setModel(oModel1);
			
			var that = this;

			var oFormat = DateFormat.getDateTimeInstance({
				style: "medium"
			});
			var oDate = new Date();
			var sDate = oFormat.format(oDate);
			// create new entry
			var sValue = oEvent.getParameter("value");
			var toUserId = oModel.getData().reciever_id;
			var toUserName = oModel.getData().reciever;

			var oMyViewModel = new sap.ui.model.json.JSONModel();

			var oParameter = {
				"UserToId": toUserId,
				"UserTo"  : toUserName,
				"DateTime": sDate,
				"Message": sValue
			};

			if (sValue !== undefined) {
				that.getView().getModel().create("/ChatMsgsSet", oParameter);
			}

			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("UserTo", sap.ui.model.FilterOperator.EQ, toUserId);
			aFilters.push(oFilter);

			var that = this;

			this.oModel.read("/ChatMsgsSet", {
				filters: aFilters,
				success: function(oData) {
					oMyViewModel.setData(oData);
					oMyViewModel.refresh(true);
					that.getView().setModel(oMyViewModel, "myView");
					sap.ui.core.BusyIndicator.hide();
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});

		},
		_openChatBox: function(sId, sName) {
			var oView = this.getView();
			var oDialog = oView.byId('chatbox');
			var oMessageModel = new sap.ui.model.json.JSONModel({
				reciever_id : sId,
				reciever : sName
			});
			
			var oModel1 = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV/");
			sap.ui.getCore().setModel(oModel1);
			this.getView().setModel(oModel1);

			var oMyViewModel = new sap.ui.model.json.JSONModel();
			//		var toUserName = this.getView().getModel("todayH").getData()[0].HOTLINER_IN_BLR;
			var toUserName = sName;
			var toUserId = sId;

			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("UserTo", sap.ui.model.FilterOperator.EQ, toUserId);
			aFilters.push(oFilter);

			var that = this;

			this.oModel.read("/ChatMsgsSet", {
				filters: aFilters,
				success: function(oData) {
					oMyViewModel.setData(oData);
					that.getView().setModel(oMyViewModel, "myView");
					sap.ui.core.BusyIndicator.hide();
				},
				error: function() {
					sap.ui.core.BusyIndicator.hide();
				}
			});
			if (!oDialog) {
				// create dialog via fragment factory
				oDialog = sap.ui.xmlfragment(oView.getId(), "Cloud.view.Chat", this);
				oView.addDependent(oDialog);
			}
			oDialog.setModel(oMessageModel,"newMsg");
			oDialog.open();
			sap.m.MessageToast.show(sId + "--" + sName);
		},

		getTodayHotlines: function() {
			var aFilters1 = [];
			var aFilters2 = [];
			var oTodayModel1 = new sap.ui.model.json.JSONModel();
			var oTodayModel2 = new sap.ui.model.json.JSONModel();
			var oDate = new Date();

			var oFilter1 = new sap.ui.model.Filter("HOTLINE_NUM", sap.ui.model.FilterOperator.EQ, "CLOUD");
			aFilters1.push(oFilter1);
			var sDate = this.oFormatYyyymmdd.format(oDate);
			oFilter1 = new sap.ui.model.Filter("CALENDER_DATE", sap.ui.model.FilterOperator.EQ, sDate);
			aFilters1.push(oFilter1);
			this.oModel.read("/Todays_HotlinersSet", {
				filters: aFilters1,
				success: function(oData) {
					oTodayModel1.setData(oData.results);
				}
			});
			this.getView().setModel(oTodayModel1, "todayH");
			
			// for BYD hotliners
			var oFilter2 = new sap.ui.model.Filter("HOTLINE_NUM", sap.ui.model.FilterOperator.EQ, "BYD");
			aFilters2.push(oFilter2);
			var sDate = this.oFormatYyyymmdd.format(oDate);
			oFilter2 = new sap.ui.model.Filter("CALENDER_DATE", sap.ui.model.FilterOperator.EQ, sDate);
			aFilters2.push(oFilter2);
			this.oModel.read("/Todays_HotlinersSet", {
				filters: aFilters2,
				success: function(oData) {
					oTodayModel2.setData(oData.results);
				}
			});
			this.getView().setModel(oTodayModel2, "todayBYD");
			
			var oStaticModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/StaticSet", {
				success: function(oData) {
					oStaticModel.setData(oData.results);
				}
			});
			this.getView().setModel(oStaticModel, "stat");
		},
		openChatBlr: function() {
			var sId = this.getView().getModel("todayH").getData()[0].HOT_BLR_EID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].HOTLINER_IN_BLR;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		openChatRot: function() {
			var sId = this.getView().getModel("todayH").getData()[0].HOT_ROT_EID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].HOTLINER_IN_ROT;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		openChatVan: function() {
			var sId = this.getView().getModel("todayH").getData()[0].HOT_CAN_EID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].HOTLINER_IN_CAN;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		openChatBlrBackup: function() {
			var sId = this.getView().getModel("todayH").getData()[0].BLR_BACKUP_EID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].BLR_BACKUP;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		openChatRotBackup: function() {
			var sId = this.getView().getModel("todayH").getData()[0].ROT_BACKUP_EID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].ROT_BACKUP;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		openChatVanBackup: function() {
			var sId = this.getView().getModel("todayH").getData()[0].HOT_CAN_BACK_ID;
			if (sId.length !== 0) {
				var sName = this.getView().getModel("todayH").getData()[0].HOTLINER_CAN_BACK;
				this._openChatBox(sId, sName);
			} else {
				sap.m.MessageToast.show("Oops! Looks like no one is assigned");
			}
		},
		onclose: function() {
			var oView = this.getView();
			var oDialog = oView.byId('chatbox');
			oDialog.close();
		}
	});

});