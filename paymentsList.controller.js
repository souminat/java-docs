angular.module('app.pages.paymentsList.controller',[
	'ui.router',
	'ui.bootstrap',
	'ct.loadingOverlay',
	'app.config',
	'app.messages',
	'app.directives'
])

.config(function ($stateProvider, configProvider) {
	$stateProvider
		.state('pages.payments', {
			url: "/payments",
			views: {
				'content': {
					templateUrl: configProvider.templateBasePath + 'app/pages/paymentsList/paymentsList.controller.html',
					controller: 'paymentsListController as payments'
				}
			}
		});
})

.controller('paymentsListController', function ($state, $uibModal,$document, $scope, $q, config, simpleModal, messages, paymentRequestManager,lov) {
	var payments = this;
	var paginatedresult = {
		offset : 0
	};
	payments.paymentList = {};
	payments.filter = {};
	payments.shwFilterApplied = [];
	$scope.data = payments.paymentList.data;
	payments.filterObj = {};
	var filterStatus;
	angular.extend(payments, {
		isLoading: 				false,
		filterApplied : false,
	    requestDate : '',
	    valueDate : '',
	    filterButtonColor : true,
	    sortReverse : '',
	    sortPropertyName : '',
	    erpPaymentRequest : false,
		filters: {
			start_index: 		1,
			count:				10,
			currentPage:		1
		},
		channels: function() {
        	$scope.$on('customTableChangePagination', payments.changePagination);
        	$scope.$on('customTableViewObjectEmit', payments.viewPayment);
        	$scope.$on('customTableSortObject',payments.changeSortBy);
			$scope.$on('sortReverseVariable', function(event, arg){
        	    payments.sortReverse = arg;
        	  });
        	$scope.$on('sortPropertyName', function(event, arg){
        	    payments.sortPropertyName = arg;
        	  });
        	
        },        
        getRequestType : function(text){
			
			var defer = $q.defer();
        	
        	var criteria = {
                requestType: encodeURI(text)        		
        	};
        	var promise = paymentRequestManager.getRequestTypeOptions(text);
        	promise.$promise.then(function(result) {
        		payments.requests = result.requestType;
        		defer.resolve(result.requestType);
        	});
        	
        	return defer.promise;
        },
        
	getPayeeName : function(text){
			
			
        	var defer = $q.defer();
        	var payerList = {
        			
        	};
        	var criteria = {
                payeeSearchValue: encodeURI(text)        		
        	};
        	var promise = paymentRequestManager.getPayeeList(text);
        	promise.$promise.then(function(result) {
        		payments.payeeNames = result.payeeName;
        		defer.resolve(result.payeeName);
        	});
        	
        	return defer.promise;
        },
        
        getPayerName : function(text){
			
        	var defer = $q.defer();
        	var payerList = {
        			
        	};
        	var criteria = {
                payerSearchValue: encodeURI(text)        		
        	};
        	var promise = paymentRequestManager.getPayerList(text);
        	promise.$promise.then(function(result) {
        		payments.payerNames = result.payerName;
        		
        		defer.resolve(result.payerName);
        	});
        	
        	return defer.promise;
        },
        
		changePagination: function(event, page, start) {
        	payments.filters.currentPage = page;
        	payments.filters.start_index = start;
		
        	var totalNxt = payments.paymentList.total;
        	var columnName = payments.sortPropertyName;
        	var sortOrder = payments.sortReverse;
        	if(payments.filter.requestDate) {
        		payments.requestDate = moment(payments.filter.requestDate).format('DD-MM-YY');
        	}
       	    if(payments.filter.valueDate) {
       	    	payments.valueDate = moment(payments.filter.valueDate).format('DD-MM-YY');
       	    }
        	
        	var next = 0;        		
        	if(totalNxt - start <10) {
        		next = totalNxt - start;
        	} else {
        		next = 10;
        	}
        		
        	paginatedresult ={
        		offset : start,
        		next : next,
        		orderByColumn :columnName,
        		sortingOrder : sortOrder,
        		requestId : payments.filter.requestId,
     			requestType :payments.filter.requestType,
     			requestDate : payments.requestDate,
                payerDescription :payments.filter.payer,
                payeeDescripton :payments.filter.payee,
                payeeBankCountry :payments.filter.country,
                payeeCurrency:payments.filter.currency,
                payeeAmount:payments.filter.Amount,
                valueDate:payments.valueDate,
                requester:payments.filter.requester,
                assignedTo:payments.filter.assignedTo,
                status:payments.filter.status
        	}
        	payments.search(paginatedresult);
        },
        viewPayment: function(event, payment) {
        	if (payment.requestTypeCode == 'Manual Payment')
        		payments.erpPaymentRequest = false;
        	else if (payment.requestTypeCode == 'ERP Manual Payment')
        		payments.erpPaymentRequest = true;
        		
        	switch(payment.status) {
        		case 'Submitted':
        			$state.go('pages.approvalsApprover', {
                		paymentId: payment.requestId,
                		erpPaymentRequest: payments.erpPaymentRequest
                	});
        		break;
        		case 'Approved':
        			$state.go('pages.approvalsPreparer', {
        				paymentId: payment.requestId,
        				erpPaymentRequest: payments.erpPaymentRequest
                	});
            	break;
        		case 'Rejected':
        			$state.go('pages.approvalsApprover', {
        				paymentId: payment.requestId,
        				erpPaymentRequest: payments.erpPaymentRequest
                	});
                break;
        		case 'Prepared':
        			$state.go('pages.approvalsReleaser', {
        				paymentId: payment.requestId,
        				erpPaymentRequest: payments.erpPaymentRequest
                	});
                break;
        		case 'Cancelled':
        			$state.go('pages.approvalsApprover', {
        				paymentId: payment.requestId,
        				erpPaymentRequest: payments.erpPaymentRequest
                	});
                break;
        	};
        }, 
		search: function(paginatedresult) {

			payments.isLoading = true;
			var promise = paymentRequestManager.getDashboardResults(paginatedresult);

            promise.$promise.then(function(result) {
            	
                var data = result.resultList;
                var total = result.totalRecords;

                var preparer =  result.preparerList;
                
                payments.paymentList = {
                	idProperty: 'requestId',	
                    total: total,
                    preparer:preparer,
                    start: payments.filters.start_index,
                    limit: payments.filters.count,
                    currentPage: payments.filters.currentPage,
                    headers: [
                        {
                            field: 'requestId',
                            name: 'Request ID'
                            
                        },
                        {
                            field: 'requestDate',
                            name: 'Request Date'
                        },
                        {
                            field: 'requestType',
                            name: 'Request Type'
                        },
                        {
                            field: 'payerDescription',
                            name: 'Payer'
                        },
                        {
                            field: 'payeeDescripton',
                            name: 'Payee'
                        },
                        {
                            field: 'payeeBankCountry',
                            name: 'Country'
                        },
                        {
                            field: 'payeeCurrency',
                            name: 'Currency'
                        },
                        {
                            field: 'payeeAmount',
                            name: 'Amount'
                        },
                        {
                            field: 'valueDate',
                            name: 'Value Date'
                        },
                        {
                            field: 'requester',
                            name: 'Requester'
                        },
                        {
                        field: 'assignedTo',
                        name: 'Assigned To'
	                    },
	                    {
	                        field: 'status',
	                        name: 'Status'
	                    },
	                    {
	                        field: 'requestTypeCode',
	                        name: 'Payment Type Code'
	                    }
                    ],
                    data: data
                };
                payments.isLoading = false;
            });
		},
		changeSortBy: function(event,pName,page,start) {
			var columnName = payments.sortPropertyName;
    	    var sortOrder = payments.sortReverse; 
    	    if(payments.filter.requestDate) {
    	    	payments.requestDate = moment(payments.filter.requestDate).format('DD-MM-YY');
    	    }
    	    if(payments.filter.valueDate) {
    	    	payments.valueDate = moment(payments.filter.valueDate).format('DD-MM-YY');
    	    }
    	    payments.filters.currentPage = page;
       	    payments.filters.start_index = start;
		
       		var totalNxt = payments.paymentList.total;
    	    var next = 0;
    	    if(totalNxt - start <10) {
    	    	next = totalNxt - start;
    	    } else {
    	    	next = 10;
    	    }
    	    
    	    paginatedresult = {
				next : next,
           		orderByColumn :columnName,
           		sortingOrder : sortOrder,
           		requestId : payments.filter.requestId,
     			requestType :payments.filter.requestType,
     			requestDate : payments.requestDate,
                payerDescription :payments.filter.payer,
                payeeDescripton :payments.filter.payee,
                payeeBankCountry :payments.filter.country,
                payeeCurrency:payments.filter.currency,
                payeeAmount:payments.filter.Amount,
                valueDate:payments.valueDate,
                requester:payments.filter.requester,
                assignedTo:payments.filter.assignedTo,
                status:payments.filter.status
           	};
           	payments.search(paginatedresult);
         },
       	 
         applyFilter : function () {
        	 var columnName = payments.sortPropertyName;
      	   	 var sortOrder = payments.sortReverse;  
      	   	 payments.shwFilterApplied = [];
         	 payments.filterApplied = true;
         	 payments.filterButtonColor = false;
         	
         	 
         	 if(payments.filter.requestDate) {
         		 payments.requestDate = moment(payments.filter.requestDate).format('DD-MM-YY');
         	 }
        	 
        	if(payments.filter.valueDate) {
        		payments.valueDate = moment(payments.filter.valueDate).format('DD-MM-YY');
        	}
        	if (payments.filter.requestId != undefined && payments.filter.requestId != "") {
        		payments.shwFilterApplied.push("Request ID:");
      		    payments.shwFilterApplied.push(payments.filter.requestId);
        	}
        	
      	   if (payments.filter.requestType != undefined && payments.filter.requestType != "") {
      		   payments.shwFilterApplied.push("Request Type:");
      		   payments.shwFilterApplied.push(payments.filter.requestType);
      	   }
      	   if (payments.filter.requestDate != undefined && payments.filter.requestDate != "") {
      		   payments.shwFilterApplied.push("Request Date:");
      		   payments.shwFilterApplied.push(moment(payments.filter.requestDate).format('DD-MMM-YY'));
      	   }
      	   if (payments.filter.payer != undefined && payments.filter.payer != "") {
      		   payments.shwFilterApplied.push("Payer:");
      		   payments.shwFilterApplied.push(payments.filter.payer);
      	   }
      	   if (payments.filter.payee != undefined && payments.filter.payee != "") {
      		   payments.shwFilterApplied.push("Payee:");
      		   payments.shwFilterApplied.push(payments.filter.payee);
      	   }
      	   if (payments.filter.country != undefined && payments.filter.country != "") {
      		   payments.shwFilterApplied.push("Country:");
      		   payments.shwFilterApplied.push(payments.filter.country);
      	   }
      	   if (payments.filter.currency != undefined && payments.filter.currency != "") {
      		   payments.shwFilterApplied.push("Currency:");
      		   payments.shwFilterApplied.push(payments.filter.currency);
      	   }
      	   if (payments.filter.Amount != undefined && payments.filter.Amount != "") {
      		   payments.shwFilterApplied.push("Amount:");
      		   payments.shwFilterApplied.push(payments.filter.Amount);
      	   }
      	   if (payments.filter.valueDate != undefined && payments.filter.valueDate != "") {
      		   payments.shwFilterApplied.push("Value Date:");
      		   payments.shwFilterApplied.push(moment(payments.filter.valueDate).format('DD-MMM-YY'));
      	   }
      	   if (payments.filter.requester != undefined && payments.filter.requester != "") {
      		   payments.shwFilterApplied.push("Requester:");
      		   payments.shwFilterApplied.push(payments.filter.requester);
      	   }
      	   if (payments.filter.assignedTo != undefined && payments.filter.assignedTo != "") {
      		   payments.shwFilterApplied.push("Assigned To:");
      		   payments.shwFilterApplied.push(payments.filter.assignedTo);
      	   }
      	   if (payments.filter.status != undefined && payments.filter.status != "") {
      		   payments.shwFilterApplied.push("Status:");
      		   
      		   payments.filterObj = lov.getLookupCode(payments.filter.status);
        	   payments.filterObj.then(function(response){
        		    payments.filterObj = response;
        		    payments.shwFilterApplied.push(payments.filterObj.displayName);
        	 });
        	     		   
      		   
      	   }
      	   payments.filters= {
      			   start_index: 1,
      			   count: 10,
      			   currentPage: 1
      	   };
      	   paginatedresult = {
      		   orderByColumn :columnName,
      		   sortingOrder : sortOrder,
      		   requestId : payments.filter.requestId,
      		   requestType :payments.filter.requestType,
      		   requestDate : payments.requestDate,
      		   payerDescription :payments.filter.payer,
      		   payeeDescripton :payments.filter.payee,
      		   payeeBankCountry :payments.filter.country,
      		   payeeCurrency:payments.filter.currency,
      		   payeeAmount:payments.filter.Amount,
      		   valueDate:payments.valueDate,
      		   requester:payments.filter.requester,
      		   assignedTo:payments.filter.assignedTo,
      		   status:payments.filter.status
         	}
      	    payments.search(paginatedresult);
			
         },
         resetFilter : function() {
        	paginatedresult = {offset :0};
        	payments.filters= {
    			start_index: 		1,
    			count:				10,
    			currentPage:		1
    		};
        	payments.shwFilterApplied = [];
         	payments.filterApplied = false;
         	payments.filter = {};
			payments.requestDate = '';
            payments.valueDate = '';
            payments.search(paginatedresult);
         	payments.filterButtonColor = true;
         }
            	
    });
	
	payments.channels();
	payments.search(paginatedresult);
});