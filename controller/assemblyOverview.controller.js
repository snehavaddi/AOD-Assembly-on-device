sap.ui.define([
	"Cloud/controller/BaseController",
	"Cloud/model/formatter",
	'sap/m/MessageBox'
], function(BaseController, formatter, MessageBox) {
	"use strict";
	jQuery.sap.require("sap.m.MessageToast");
	return BaseController.extend("Cloud.controller.assemblyOverview", {
		formatter: formatter,
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("assemblyOverview").attachPatternMatched(this._onObjectMatched, this);
			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV");
		},
		_onObjectMatched: function(oEvent) {
			var sProjectId = oEvent.getParameter("arguments").projectId;
			this._fetchPhase(sProjectId); //group project or single projectid
		},
		_fetchPhase: function(projectId) {
			var oPhaseModel = new sap.ui.model.json.JSONModel();
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("ProjectId", sap.ui.model.FilterOperator.EQ, projectId);
			aFilters.push(oFilter);
			this.oModel.read("/PhaseSet", {
				filters: aFilters,
				success: function(oData) {
					oPhaseModel.setData(oData);
				}
			});
			this.getView().setModel(oPhaseModel);

		},
		syncProject: function() {
			this._fetchPhase(this.getView().getModel().getData().results[0].ProjectId);
		},
		onExpandPhase: function(oEvent) {
			var bExpand = oEvent.getParameter("expand");
			if (bExpand) {
				var sPath = oEvent.getSource().getBindingContext().getPath();
				var sId = oEvent.getSource().getId();
				var oRow = this.getView().getModel().getProperty(sPath);
				this._fetchItems(sId, oRow.ProjectId, oRow.PhaseId);
			}
		},
		_fetchItems: function(sId, projectId, phase) {
			var aFilters = [];
			var oItemModel = new sap.ui.model.json.JSONModel();
			var oFilter = new sap.ui.model.Filter("Project_ID", sap.ui.model.FilterOperator.EQ, projectId);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("Phase", sap.ui.model.FilterOperator.EQ, phase);
			aFilters.push(oFilter);
			this.oModel.read("/ItemSet", {
				filters: aFilters,
				success: function(oData) {
					oItemModel.setData(oData);
				}
			});
			sap.ui.getCore().byId(sId).setModel(oItemModel, "item");
		},
		syncPhase: function(oEvent) {
			var sId = oEvent.getSource().getParent().getParent().getId();
			var sPath = oEvent.getSource().getBindingContext().getPath();
			var oRow = this.getView().getModel().getProperty(sPath);
			this._fetchItems(sId, oRow.ProjectId, oRow.PhaseId);
		},
		onPressAction: function(oEvent) {
			var oButton = oEvent.getSource();
			var sId = oEvent.getSource().getParent().getParent().getParent().getParent().getId();
			// create action sheet only once
			if (!this._actionSheet) {
				this._actionSheet = sap.ui.xmlfragment(
					"Cloud.view.Action",
					this
				);
				this.getView().addDependent(this._actionSheet);
			}
			var sPath = oEvent.getSource().getBindingContext("item").getPath();
			var sParent = oEvent.getSource().getParent().getParent().getId();
			var oModel = sap.ui.getCore().byId(sParent).getModel("item");
			var aData = oModel.getProperty(sPath);
			aData.sId = sId;
			var oDetailModel = new sap.ui.model.json.JSONModel(aData);
			this._actionSheet.setModel(oDetailModel);
			this._actionSheet.openBy(oButton);
		},
		onPressDetail: function(oEvent) {
			if (!this._detailSheet) {
				this._detailSheet = sap.ui.xmlfragment(
					"Cloud.view.Detail",
					this
				);
				this.getView().addDependent(this._detailSheet);
			}
			var sPath = oEvent.getSource().getBindingContext("item").getPath();
			var sParent = oEvent.getSource().getParent().getParent().getId();
			var oModel = sap.ui.getCore().byId(sParent).getModel("item");
			var aData = oModel.getProperty(sPath);
			var oDetailModel = new sap.ui.model.json.JSONModel(aData);
			this._detailSheet.setModel(oDetailModel);
			//get Logs
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("WorkflowId", sap.ui.model.FilterOperator.EQ, aData.Project_ID);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("ItemId", sap.ui.model.FilterOperator.EQ, aData.Item_ID);
			aFilters.push(oFilter);
			var oLogModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/LogHeaderSet", {
				filters: aFilters,
				success: function(oData) {
					oLogModel.setData(oData);
				}
			});
			this._detailSheet.setModel(oLogModel, "log");
			this._detailSheet.open();
		},
		closeDetailDialog: function() {
			this._detailSheet.destroy();
			this._detailSheet = undefined;
		},
		/*
		Start of Item Events
		Odata entityset : ItemEventSet
		Input : ProjectId , ItemId, EventType ('E','F','S','R')
		*/
		onExecute: function(oEvent) {
			var aSelectedItem = oEvent.getSource().getParent().getModel().getData();
			this._startEvent(aSelectedItem, 'E');
		},
		onReset: function(oEvent) {
			var aSelectedItem = oEvent.getSource().getParent().getModel().getData();
			this._startEvent(aSelectedItem, 'RS');
		},
		onResetAll: function(oEvent) {
			var aSelectedItem = oEvent.getSource().getParent().getModel().getData();
			this._startEvent(aSelectedItem, 'RA');
		},
		onSkip: function(oEvent) {
			var aSelectedItem = oEvent.getSource().getParent().getModel().getData();
			this._startEvent(aSelectedItem, 'S');
		},
		onFinish: function(oEvent) {
			var aSelectedItem = oEvent.getSource().getParent().getModel().getData();
			this._startEvent(aSelectedItem, 'F');
		},
		runGroupProject: function(oEvent) {
			var aData = this.getView().getModel().getData().results;
			var aFilters = [];
			var that = this;
			var oFilter = new sap.ui.model.Filter("ProjectId", sap.ui.model.FilterOperator.EQ, aData[0].ProjectId);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("ItemId", sap.ui.model.FilterOperator.EQ, "");
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("EventType", sap.ui.model.FilterOperator.EQ, "G");
			aFilters.push(oFilter);
			this.oModel.read("/ItemEventSet", {
				filters: aFilters,
				success: function(oData) {
				//	sap.m.MessageToast.show("Job Scheduled.");
				that._showMessage(oData.results[0].RC.trim(), oData.results[0].VAR1);
				},
				error: function() {
					sap.m.MessageToast.show("Task failed, please try again later");
				}
			});
		},
		_startEvent: function(pSelectedItem, pEventType) {
			var aFilters = [];
			var that = this;
			var sGroupProject = this.getView().getModel().getData().results[0].ProjectId;
			var oFilter = new sap.ui.model.Filter("ProjectId", sap.ui.model.FilterOperator.EQ, pSelectedItem.Project_ID);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("ItemId", sap.ui.model.FilterOperator.EQ, pSelectedItem.Item_ID);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("EventType", sap.ui.model.FilterOperator.EQ, pEventType);
			aFilters.push(oFilter);
			this.oModel.read("/ItemEventSet", {
				filters: aFilters,
				success: function(oData) {
					if(oData.results.length > 0){
					that._showMessage(oData.results[0].RC.trim(), oData.results[0].VAR1);
					} else {
						sap.m.MessageToast.show("Please check log of item");
					}
					that._fetchPhase(sGroupProject);
				},
				error: function() {
					sap.m.MessageToast.show("Task failed, please try again later");
				}
			});
		},
		_showMessage: function(sRc, sMessage) {
			if (sRc === "0") {
				MessageBox.success(sMessage);
			} else if (sRc === "4") {
				MessageBox.warning(sMessage);
			} else if (sRc === "8") {
				MessageBox.error(sMessage);
			}
		},
		onLogPress: function(oEvent) {
			var sPath = oEvent.getSource().getBindingContext("log").getPath();
			var aData = this._detailSheet.getModel("log").getProperty(sPath);
			var aFilters = [];
			var oFilter = new sap.ui.model.Filter("WorkflowId", sap.ui.model.FilterOperator.EQ, aData.WorkflowId);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("ItemId", sap.ui.model.FilterOperator.EQ, aData.ItemId);
			aFilters.push(oFilter);
			oFilter = new sap.ui.model.Filter("ItemRunId", sap.ui.model.FilterOperator.EQ, aData.ItemRunId);
			aFilters.push(oFilter);
			var oLogModel = new sap.ui.model.json.JSONModel();
			this.oModel.read("/LogSet", {
				filters: aFilters,
				success: function(oData) {
					oLogModel.setData(oData);
				}
			});
			if (!this._logSheet) {
				this._logSheet = sap.ui.xmlfragment(
					"Cloud.view.Log",
					this
				);
				this.getView().addDependent(this._logSheet);
			}
			this._logSheet.setModel(oLogModel, "logDetails");
			this._logSheet.open();
		},
		closeLogDialog: function() {
			this._logSheet.destroy();
			this._logSheet = undefined;
		},
		openInfo: function() {
			if (!this._infoSheet) {
				this._infoSheet = sap.ui.xmlfragment("Cloud.view.Legend", this);
				this.getView().addDependent(this._infoSheet);
			}

			this._infoSheet.open();
		},
		closeLegendBox: function() {
			this._infoSheet.destroy();
			this._infoSheet = undefined;
		},
		openAttributes: function(oEvent) {
			var oAttrModel = new sap.ui.model.json.JSONModel();
			var aData = this.getView().getModel().getData().results;
			var aFilters = [];
			var that = this;
			var oFilter = new sap.ui.model.Filter("ProjectId", sap.ui.model.FilterOperator.EQ, aData[0].ProjectId);
			aFilters.push(oFilter);
			if (!this._attrSheet) {
				this._attrSheet = sap.ui.xmlfragment(
					"Cloud.view.Attributes",
					this
				);
				this.getView().addDependent(this._attrSheet);
			}
			this.oModel.read("/AttributesSet", {
				filters: aFilters,
				success: function(oDetails) {
					oAttrModel.setData(oDetails);
					that._attrSheet.open();
				},
				error: function() {
					sap.m.MessageToast.show("Failed to get details");
				}
			});
			this._attrSheet.setModel(oAttrModel);
		},
		closeAttributes: function() {
			this._attrSheet.close();
			this._attrSheet = undefined;
		}
	});
});