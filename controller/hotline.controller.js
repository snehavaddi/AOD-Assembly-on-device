sap.ui.define([
	"Cloud/controller/BaseController"
], function(BaseController) {
	"use strict";
	jQuery.sap.require("sap.m.MessageToast");
	return BaseController.extend("Cloud.controller.hotline", {
		onInit: function() {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("hotline").attachPatternMatched(this._onObjectMatched, this);
		},
		_onObjectMatched: function() {
			this.oModel = new sap.ui.model.odata.ODataModel("/sap/opu/odata/BRLT/ASSEMBLY_ON_DEVICE_SRV/");
			this.oFormatYyyymmdd = sap.ui.core.format.DateFormat.getInstance({
				pattern: "yyyyMMdd",
				calendarType: sap.ui.core.CalendarType.Gregorian
			});
			var oHLModel = new sap.ui.model.json.JSONModel({
				key: "myView",
				subKey: "calendarView",
				weekDay: '0',
				showTodayList: '0'
			});
			this.getView().setModel(oHLModel, "hotlineModel");
			var sDate = new Date();
			var iMonth = sDate.getMonth();
			var iQtr = Math.ceil(iMonth / 3);
			var sYear = sDate.getFullYear();
			var oQtrModel = new sap.ui.model.json.JSONModel({
				qtr: iQtr.toString(),
				year: sYear.toString()
			});
			this.getView().setModel(oQtrModel, "date");
			this.getMyHotlines();
		},
		getMyHotlines: function() {
			var aFilters = [],
				sDate = "";
			var oMyModel = new sap.ui.model.json.JSONModel();
			//call myview
			var aData = this.getView().getModel("date").getData();
			var oFilter = new sap.ui.model.Filter("HOTLINE", sap.ui.model.FilterOperator.EQ, "CLOUD");
			aFilters.push(oFilter);

			switch (aData.qtr.toString()) {
				case "1":
					sDate = aData.year + "02" + "01";
					break;
				case "2":
					sDate = aData.year + "04" + "01";
					break;
				case "3":
					sDate = aData.year + "07" + "01";
					break;
				case "4":
					sDate = aData.year + "10" + "01";
					break;
			}
			oFilter = new sap.ui.model.Filter("FROMDATE", sap.ui.model.FilterOperator.EQ, sDate);
			aFilters.push(oFilter);
			this.oModel.read("/myView_HotlineSet", {
				filters: aFilters,
				success: function(oData) {
					oMyModel.setData(oData);
				}
			});
			this.getView().setModel(oMyModel, "my");
			//BYD

			var aFilters1 = [],
				sDate = "";
			var oMyModel1 = new sap.ui.model.json.JSONModel();
			//call myview
			var aData = this.getView().getModel("date").getData();
			var oFilter1 = new sap.ui.model.Filter("HOTLINE", sap.ui.model.FilterOperator.EQ, "BYD");
			aFilters1.push(oFilter1);

			switch (aData.qtr.toString()) {
				case "1":
					sDate = aData.year + "02" + "01";
					break;
				case "2":
					sDate = aData.year + "04" + "01";
					break;
				case "3":
					sDate = aData.year + "07" + "01";
					break;
				case "4":
					sDate = aData.year + "10" + "01";
					break;
			}
			oFilter1 = new sap.ui.model.Filter("FROMDATE", sap.ui.model.FilterOperator.EQ, sDate);
			aFilters1.push(oFilter1);
			this.oModel.read("/myView_HotlineSet", {
				filters: aFilters1,
				success: function(oData) {
					oMyModel1.setData(oData);
				}
			});
			this.getView().setModel(oMyModel1, "myBYD");
		},
		onSelectType: function() {
			var aData = this.getView().getModel("hotlineModel").getData();
			var sSelectedKey = aData.key;
			switch (sSelectedKey) {
				case "todayView":
					this.getTodayHotlines();
					break;
				case "myView":
					this.getMyHotlines();
					break;
				case "qtrView":
					if (aData.subKey === "calendarView") {
						this.getView().byId("calendar").fireSelect();
					} else {
						// call list view
					}
					break;
			}
		},
		getGroupHeader: function(oGroup) {
			return new sap.m.GroupHeaderListItem({
				title: oGroup.key,
				upperCase: false
			});
		},
		getTodayHotlines: function() {
			var aFilters1 = [];
			var aFilters2 = [];
			var oTodayModel1 = new sap.ui.model.json.JSONModel();
			var oTodayModel2 = new sap.ui.model.json.JSONModel();
			var oDate = new Date();
			var sDay = oDate.getDay().toString();
			var oModel = this.getView().getModel("hotlineModel");
			if (sDay === "0" || sDay === "6") {
				oModel.getData().showTodayList = '0';
			} else {
				oModel.getData().showTodayList = '1';
				//COUD
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
				this.getView().setModel(oTodayModel1, "today");
				//BYD
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
			}
			oModel.refresh(true);

		},
		handleCalendarSelect: function(oEvent) {
			var oDate;
			if (oEvent.getSource().getSelectedDates() <= 0) {
				oDate = new Date();
			} else {
				oDate = new Date(oEvent.getSource().getSelectedDates()[0].getStartDate());
			}
		//CLOUD	
			var aFilters = [];
			var oCalendarModel = new sap.ui.model.json.JSONModel();
			var sDate = this.oFormatYyyymmdd.format(oDate);
			var sDay = oDate.getDay().toString();
			var oModel = this.getView().getModel("hotlineModel");
			if (sDay === "0" || sDay === "6") {
				oModel.getData().weekDay = '0';
			} else {
				oModel.getData().weekDay = '1';
				var oFilter = new sap.ui.model.Filter("HOTLINE_NUM", sap.ui.model.FilterOperator.EQ, "CLOUD");
				aFilters.push(oFilter);
				oFilter = new sap.ui.model.Filter("CALENDER_DATE", sap.ui.model.FilterOperator.EQ, sDate);
				aFilters.push(oFilter);
				this.oModel.read("/Todays_HotlinersSet", {
					filters: aFilters,
					success: function(oData) {
						oCalendarModel.setData(oData.results);
					}
				});
				this.getView().setModel(oCalendarModel, "cal");
			}
			
		//BYD
			var aFilters1 = [];
			var oCalendarModel1 = new sap.ui.model.json.JSONModel();
			var sDate = this.oFormatYyyymmdd.format(oDate);
			var sDay = oDate.getDay().toString();
			var oModel = this.getView().getModel("hotlineModel");
			if (sDay === "0" || sDay === "6") {
				oModel.getData().weekDay = '0';
			} else {
				oModel.getData().weekDay = '1';
				var oFilter1 = new sap.ui.model.Filter("HOTLINE_NUM", sap.ui.model.FilterOperator.EQ, "BYD");
				aFilters1.push(oFilter1);
				oFilter1 = new sap.ui.model.Filter("CALENDER_DATE", sap.ui.model.FilterOperator.EQ, sDate);
				aFilters1.push(oFilter1);
				this.oModel.read("/Todays_HotlinersSet", {
					filters: aFilters1,
					success: function(oData) {
						oCalendarModel1.setData(oData.results);
					}
				});
				this.getView().setModel(oCalendarModel1, "calBYD");
			}
			oModel.refresh(true);

		}
	});
});