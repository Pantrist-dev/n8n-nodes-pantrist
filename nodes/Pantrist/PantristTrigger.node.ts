import type {
	IDataObject,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
	IPollFunctions,
} from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';

import { getLists, pantristApiRequest } from './GenericFunctions';

export class PantristTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Pantrist Trigger',
		name: 'pantristTrigger',
		icon: 'file:pantrist.svg',
		group: ['trigger'],
		version: 1,
		subtitle: '={{$parameter["collection"]}}',
		description: 'Starts the workflow when Pantrist shopping or pantry items change',
		defaults: {
			name: 'Pantrist Trigger',
		},
		usableAsTool: true,
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [
			{
				name: 'pantristApi',
				required: true,
			},
		],
		properties: [
			{
				displayName: 'List Name or ID',
				name: 'listId',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getLists',
				},
				required: true,
				default: '',
				description:
					'The list to watch. Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>.',
			},
			{
				displayName: 'Collection',
				name: 'collection',
				type: 'options',
				options: [
					{
						name: 'Pantry List',
						value: 'pantryList',
					},
					{
						name: 'Shopping List',
						value: 'shoppingList',
					},
				],
				default: 'shoppingList',
				description: 'Which collection of the chosen list to watch for changes',
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

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const listId = this.getNodeParameter('listId') as string;
		const collection = this.getNodeParameter('collection') as string;
		const staticData = this.getWorkflowStaticData('node');
		const mode = this.getMode();

		// On the first live poll, start the cursor at "now" so we don't emit the
		// entire existing list as if every item had just changed. Manual test
		// executions fall through with cursor 0 so the user sees sample data.
		if (staticData.lastModified === undefined && mode !== 'manual') {
			staticData.lastModified = Date.now();
			return null;
		}

		const cursor = (staticData.lastModified as number) ?? 0;

		const responseData = await pantristApiRequest.call(
			this,
			'GET',
			`/list/${listId}/${collection}`,
			{},
			{ updatedSince: cursor },
		);

		const newItems: IDataObject[] = Array.isArray(responseData) ? responseData : [];

		if (newItems.length === 0) {
			return null;
		}

		// Advance the cursor to the newest lastModified value in this batch.
		const maxLastModified = newItems.reduce((max, item) => {
			const lastModified = Number(item.lastModified) || 0;
			return lastModified > max ? lastModified : max;
		}, cursor);

		// Manual executions must not move the persisted cursor.
		if (mode !== 'manual') {
			staticData.lastModified = maxLastModified;
		}

		return [this.helpers.returnJsonArray(newItems)];
	}
}
