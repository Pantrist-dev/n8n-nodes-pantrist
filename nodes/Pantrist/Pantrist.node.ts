import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { getLists, pantristApiRequest } from './GenericFunctions';

export class Pantrist implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pantrist',
		name: 'pantrist',
		icon: 'file:pantrist.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		description: 'Manage Pantrist shopping lists, pantry and barcodes',
		defaults: {
			name: 'Pantrist',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'pantristApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------
			//         Resource
			// ----------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'Barcode',
						value: 'barcode',
					},
					{
						name: 'List',
						value: 'list',
					},
					{
						name: 'Pantry',
						value: 'pantry',
					},
					{
						name: 'Shopping List',
						value: 'shoppingList',
					},
				],
				default: 'shoppingList',
			},

			// ----------------------------------
			//         Operations: List
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['list'],
					},
				},
				options: [
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many lists',
						description: 'Retrieve all of your lists',
					},
				],
				default: 'getMany',
			},

			// ----------------------------------
			//      Operations: Shopping List
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['shoppingList'],
					},
				},
				options: [
					{
						name: 'Add by Barcode',
						value: 'addByBarcode',
						action: 'Add a shopping item by barcode',
						description: 'Add an item to the shopping list using a barcode',
					},
					{
						name: 'Add by Name',
						value: 'addByName',
						action: 'Add a shopping item by name',
						description: 'Add an item to the shopping list using its name',
					},
					{
						name: 'Check Off',
						value: 'check',
						action: 'Check off a shopping item',
						description: 'Mark a shopping item as checked off',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a shopping item',
						description: 'Delete an item from the shopping list',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many shopping items',
						description: 'Retrieve the items on the shopping list',
					},
					{
						name: 'Search',
						value: 'search',
						action: 'Search the shopping list',
						description: 'Search the shopping list by item name',
					},
				],
				default: 'getMany',
			},

			// ----------------------------------
			//         Operations: Pantry
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['pantry'],
					},
				},
				options: [
					{
						name: 'Add by Barcode',
						value: 'addByBarcode',
						action: 'Add a pantry item by barcode',
						description: 'Add an item to the pantry using a barcode',
					},
					{
						name: 'Add by Name',
						value: 'addByName',
						action: 'Add a pantry item by name',
						description: 'Add an item to the pantry using its name',
					},
					{
						name: 'Change Amount',
						value: 'changeAmount',
						action: 'Change a pantry item amount',
						description: 'Change the amount of a pantry item by a delta',
					},
					{
						name: 'Delete',
						value: 'delete',
						action: 'Delete a pantry item',
						description: 'Delete an item from the pantry',
					},
					{
						name: 'Get Many',
						value: 'getMany',
						action: 'Get many pantry items',
						description: 'Retrieve the items in the pantry',
					},
				],
				default: 'getMany',
			},

			// ----------------------------------
			//         Operations: Barcode
			// ----------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['barcode'],
					},
				},
				options: [
					{
						name: 'Lookup',
						value: 'lookup',
						action: 'Look up a barcode',
						description: 'Look up product information for a barcode',
					},
				],
				default: 'lookup',
			},

			// ----------------------------------
			//         Shared: List ID
			// ----------------------------------
			{
				displayName: 'List Name or ID',
				name: 'listId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLists',
				},
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['shoppingList', 'pantry'],
					},
				},
				description:
					'The list to operate on. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},

			// ----------------------------------
			//         Shared: Item ID
			// ----------------------------------
			{
				displayName: 'Item ID',
				name: 'itemId',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['shoppingList', 'pantry'],
						operation: ['check', 'delete', 'changeAmount'],
					},
				},
				description: 'The UUID of the item to operate on (the "uuid" field of an item)',
			},

			// ----------------------------------
			//         Name (add / search)
			// ----------------------------------
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['shoppingList', 'pantry'],
						operation: ['addByName', 'search'],
					},
				},
				description: 'The name of the item, e.g. "Milk"',
			},

			// ----------------------------------
			//         Barcode (add / lookup)
			// ----------------------------------
			{
				displayName: 'Barcode',
				name: 'barcode',
				type: 'string',
				required: true,
				default: '',
				displayOptions: {
					show: {
						resource: ['shoppingList', 'pantry', 'barcode'],
						operation: ['addByBarcode', 'lookup'],
					},
				},
				description: 'The barcode (EAN/UPC) of the product, e.g. "4006381333931"',
			},

			// ----------------------------------
			//      Change Amount (pantry)
			// ----------------------------------
			{
				displayName: 'Amount Change',
				name: 'amountChange',
				type: 'number',
				required: true,
				default: -1,
				displayOptions: {
					show: {
						resource: ['pantry'],
						operation: ['changeAmount'],
					},
				},
				description:
					'The delta to apply to the current amount. Use a negative number to consume (e.g. -1) and a positive number to add.',
			},
			{
				displayName: 'Auto Restock',
				name: 'autoRestock',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['pantry'],
						operation: ['changeAmount'],
					},
				},
				description:
					'Whether to add the article back to the shopping list when its amount drops to or below its configured minimum',
			},

			// ----------------------------------
			//         Updated Since (get many)
			// ----------------------------------
			{
				displayName: 'Updated Since',
				name: 'updatedSince',
				type: 'number',
				default: 0,
				displayOptions: {
					show: {
						resource: ['shoppingList', 'pantry'],
						operation: ['getMany'],
					},
				},
				description:
					'Only return items modified at or after this Unix timestamp in milliseconds. Leave at 0 to return all items.',
			},

			// ----------------------------------
			//      Additional Fields (pantry adds)
			// ----------------------------------
			{
				displayName: 'Additional Fields',
				name: 'additionalFields',
				type: 'collection',
				placeholder: 'Add Field',
				default: {},
				displayOptions: {
					show: {
						resource: ['pantry'],
						operation: ['addByName', 'addByBarcode'],
					},
				},
				options: [
					{
						displayName: 'Amount',
						name: 'amount',
						type: 'number',
						default: 1,
						description: 'The amount of the item to add. Defaults to 1.',
					},
					{
						displayName: 'Unit ID',
						name: 'unitId',
						type: 'string',
						default: 'pieces',
						description: 'The unit of the amount, e.g. "pieces", "g", "ml". Defaults to "pieces".',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getLists(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				return await getLists.call(this);
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const resource = this.getNodeParameter('resource', 0) as string;
		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				let responseData: unknown;

				if (resource === 'list') {
					if (operation === 'getMany') {
						responseData = await pantristApiRequest.call(this, 'GET', '/list');
					}
				} else if (resource === 'shoppingList') {
					const listId = this.getNodeParameter('listId', i) as string;
					const base = `/list/${listId}/shoppingList`;

					if (operation === 'getMany') {
						const qs: IDataObject = {};
						const updatedSince = this.getNodeParameter('updatedSince', i, 0) as number;
						if (updatedSince) {
							qs.updatedSince = updatedSince;
						}
						responseData = await pantristApiRequest.call(this, 'GET', base, {}, qs);
					} else if (operation === 'search') {
						const name = this.getNodeParameter('name', i) as string;
						responseData = await pantristApiRequest.call(this, 'GET', `${base}/search`, {}, { name });
					} else if (operation === 'addByName') {
						const name = this.getNodeParameter('name', i) as string;
						responseData = await pantristApiRequest.call(this, 'POST', `${base}/add-by-name`, { name });
					} else if (operation === 'addByBarcode') {
						const barcode = this.getNodeParameter('barcode', i) as string;
						responseData = await pantristApiRequest.call(this, 'POST', `${base}/add-by-barcode`, {
							barcode,
						});
					} else if (operation === 'check') {
						const itemId = this.getNodeParameter('itemId', i) as string;
						responseData = await pantristApiRequest.call(this, 'POST', `${base}/${itemId}/check`);
					} else if (operation === 'delete') {
						const itemId = this.getNodeParameter('itemId', i) as string;
						responseData = await pantristApiRequest.call(this, 'DELETE', `${base}/${itemId}`);
					}
				} else if (resource === 'pantry') {
					const listId = this.getNodeParameter('listId', i) as string;
					const base = `/list/${listId}/pantryList`;

					if (operation === 'getMany') {
						const qs: IDataObject = {};
						const updatedSince = this.getNodeParameter('updatedSince', i, 0) as number;
						if (updatedSince) {
							qs.updatedSince = updatedSince;
						}
						responseData = await pantristApiRequest.call(this, 'GET', base, {}, qs);
					} else if (operation === 'addByName') {
						const name = this.getNodeParameter('name', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						responseData = await pantristApiRequest.call(this, 'POST', `${base}/add-by-name`, {
							name,
							...additionalFields,
						});
					} else if (operation === 'addByBarcode') {
						const barcode = this.getNodeParameter('barcode', i) as string;
						const additionalFields = this.getNodeParameter('additionalFields', i, {}) as IDataObject;
						responseData = await pantristApiRequest.call(this, 'POST', `${base}/add-by-barcode`, {
							barcode,
							...additionalFields,
						});
					} else if (operation === 'changeAmount') {
						const itemId = this.getNodeParameter('itemId', i) as string;
						const amountChange = this.getNodeParameter('amountChange', i) as number;
						const autoRestock = this.getNodeParameter('autoRestock', i, false) as boolean;
						const body: IDataObject = { amountChange };
						if (autoRestock) {
							body.autoRestock = true;
						}
						responseData = await pantristApiRequest.call(
							this,
							'PUT',
							`${base}/${itemId}/change-amount`,
							body,
						);
					} else if (operation === 'delete') {
						const itemId = this.getNodeParameter('itemId', i) as string;
						responseData = await pantristApiRequest.call(this, 'DELETE', `${base}/${itemId}`);
					}
				} else if (resource === 'barcode') {
					if (operation === 'lookup') {
						const barcode = this.getNodeParameter('barcode', i) as string;
						responseData = await pantristApiRequest.call(this, 'GET', `/barcodes/${barcode}`);
					}
				}

				if (Array.isArray(responseData)) {
					for (const entry of responseData) {
						returnData.push({ json: entry as IDataObject, pairedItem: { item: i } });
					}
				} else if (responseData && typeof responseData === 'object') {
					returnData.push({ json: responseData as IDataObject, pairedItem: { item: i } });
				} else {
					returnData.push({ json: { success: true }, pairedItem: { item: i } });
				}
			} catch (error) {
				if (this.continueOnFail()) {
					returnData.push({
						json: { error: (error as Error).message },
						pairedItem: { item: i },
					});
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
