var ref;
sap.ui.define([
	"Cloud/controller/BaseController",
	"Cloud/model/formatter"
], function(BaseController, formatter) {
	"use strict";
	jQuery.sap.require("sap.m.MessageToast");
	return BaseController.extend("Cloud.controller.Assembly", {
		formatter: formatter,
		onInit: function() {
			ref = this;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV");
			oRouter.getRoute("Assembly").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			this._getTriggers();
			this._getTakenOver();
			this._getProjects();
		},
		_getTriggers: function() {
			var that = ref;
			var oTriggerModel = new sap.ui.model.json.JSONModel();
			ref.oModel.read("/trigger_headerSet", {
				success: function(oData) {
					oTriggerModel.setData(oData);
					var len = oData.results.length;
					that.getView().byId("__triggerTab").setCount(len);
					that.getView().byId("__triggerList").setModel(oTriggerModel, "trig");
				},
				error: function() {
					//
				}
			});
		},
		_getTakenOver: function() {
			var that = ref;
			var oTriggerModel = new sap.ui.model.json.JSONModel();
			ref.oModel.read("/trigger_takenoverSet", {
				success: function(oData) {
					oTriggerModel.setData(oData);
					var len = oData.results.length;
					that.getView().byId("__takenOver").setCount(len);
					that.getView().byId("__takenList").setModel(oTriggerModel, "trig");
				},
				error: function() {
					//
				}
			});
		},
		_getProjects: function() {
			var that = ref;
			var oProcessModel = new sap.ui.model.json.JSONModel();
			ref.oModel.read("/open_projectsSet", {
				success: function(oData) {
					oProcessModel.setData(oData);
					var len = oData.results.length;
					that.getView().byId("__projectTab").setCount(len);
					that.getView().byId("processList").setModel(oProcessModel, "process");
				}
			});
		},
		onSelectTab: function(oControlEvent) {
			var sKey = oControlEvent.getParameter("selectedKey");
			if (sKey === "triggerTab") {
				this._getTriggers();
			} else if (sKey === "projectsTab") {
				this._getProjects();
			}
			else if (sKey === "takenOver") {
				this._getTakenOver();
			}
		},
		closeDialog: function() {
			this._oDialog.close();
		},
		onTakeOver: function(oEvent) {
			var that = this;
			var sPath = oEvent.getSource().getBindingContext("trig").getPath();
			var oData = this.getView().byId("__triggerList").getModel("trig").getProperty(sPath);
			this.oModel.update("/trigger_headerSet(GroupId='" + oData.GroupId + "')", oData, {
				success: function() {
					that._getTriggers();
					sap.m.MessageToast.show('Project:'+oData.SpsName+' is moved to TakenOver Tab');
				}
			});

		},
		onReset: function(oEvent) {
			var that = this;
			var sPath = oEvent.getSource().getBindingContext("trig").getPath();
			var oData = this.getView().byId("__takenList").getModel("trig").getProperty(sPath);
			this.oModel.update("/trigger_headerSet(GroupId='" + oData.GroupId + "')", oData, {
				success: function() {
					that._getTriggers();
					sap.m.MessageToast.show('Project:'+oData.SpsName+' is moved to New Triggers Tab');
				}
			});

		},
		onListItemPress: function(oControlEvent) {
			this.hideSideContent();
			var sPath = oControlEvent.getSource().getBindingContext("process").getPath();
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("assemblyOverview", {
				projectId: oControlEvent.getSource().getModel("process").getProperty(sPath).ProjgrpId
			});
		},
		getCodelineTypeHeader: function(oGroup) {
			var sText = "";
			if (oGroup.key === "2") {
				sText = "Emergency Patch Request";
			} else if (oGroup.key === "3") {
				sText = "Verification Patch Request";
			}
			return new sap.m.GroupHeaderListItem({
				title: sText,
				upperCase: false
			});
		},
		goToProject: function(oEvent) {
			var that = this;
			var sPath = oEvent.getSource().getBindingContext("trig").getPath();
			var sFaSystem = this.getView().byId("__triggerList").getModel("trig").getProperty(sPath).FaSystem;
			this.oModel.read("/open_projectsSet('" + sFaSystem + "')", {
				success: function(oData) {
					if (oData.ProjgrpId === "0") {
						sap.m.MessageToast.show("No Projects Found");
					} else {
						var oRouter = sap.ui.core.UIComponent.getRouterFor(that);
						oRouter.navTo("assemblyOverview", {
							projectId: oData.ProjgrpId
						});
					}
				}
			});
		},
		showPatchDetails: function(oEvent) {
			var oTriggerModel = new sap.ui.model.json.JSONModel();
			var sPath = oEvent.getSource().getBindingContext("trig").getPath();
			var oData = oEvent.getSource().getBindingContext("trig").getModel().getProperty(sPath);
			var aFilters = [];
			var that = this;
			var oFilter = new sap.ui.model.Filter("GroupId", sap.ui.model.FilterOperator.EQ, oData.GroupId);
			aFilters.push(oFilter);
			if (!this._patchSheet) {
				this._patchSheet = sap.ui.xmlfragment(
					"Cloud.view.Patch",
					this
				);
				this.getView().addDependent(this._patchSheet);
			}
			this.oModel.read("/trigger_listSet", {
				filters: aFilters,
				success: function(oDetails) {
					if (oData.CodelineType === "2") {
						oDetails.type = "EP";
					} else if (oData.CodelineType === "3") {
						oDetails.type = "VP";
					}

					oTriggerModel.setData(oDetails);
					that._patchSheet.open();
				},
				error: function() {
					sap.m.MessageToast.show("Failed to get details");
				}
			});
			this._patchSheet.setModel(oTriggerModel);
		},
		closePatchDetails: function() {
			this._patchSheet.close();
			this._patchSheet = undefined;
		}
	});
});