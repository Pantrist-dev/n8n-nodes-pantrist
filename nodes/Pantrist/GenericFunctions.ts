import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	IHttpRequestMethods,
	IHttpRequestOptions,
	ILoadOptionsFunctions,
	INodePropertyOptions,
	IPollFunctions,
	JsonObject,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an authenticated request against the Pantrist REST API.
 *
 * The base URL is read from the `pantristApi` credential (defaulting to
 * `https://api.pantrist.app`) and the bearer token is injected by the
 * credential's `authenticate` block. API errors are re-thrown as a
 * `NodeApiError` so that the `message` field returned by Pantrist surfaces to
 * the user.
 */
export async function pantristApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions | IHookFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	qs: IDataObject = {},
): Promise<unknown> {
	const credentials = await this.getCredentials('pantristApi');
	const baseUrl = ((credentials.baseUrl as string) || 'https://api.pantrist.app').replace(
		/\/+$/,
		'',
	);

	const options: IHttpRequestOptions = {
		method,
		body,
		qs,
		url: `${baseUrl}${endpoint}`,
		json: true,
	};

	if (Object.keys(body).length === 0) {
		delete options.body;
	}

	if (Object.keys(qs).length === 0) {
		delete options.qs;
	}

	try {
		return await this.helpers.httpRequestWithAuthentication.call(this, 'pantristApi', options);
	} catch (error) {
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * `loadOptions` method shared by both nodes: fetches every list the user owns
 * and maps it to a dropdown entry so users pick a list by name instead of
 * pasting a UUID.
 */
export async function getLists(
	this: ILoadOptionsFunctions,
): Promise<INodePropertyOptions[]> {
	const responseData = (await pantristApiRequest.call(this, 'GET', '/list')) as
		| IDataObject
		| IDataObject[];
	const lists: IDataObject[] = Array.isArray(responseData)
		? responseData
		: ((responseData.data as IDataObject[]) ?? []);

	return lists.map((list) => ({
		name: (list.name as string) ?? (list.id as string) ?? (list.uuid as string),
		value: (list.id ?? list.uuid) as string,
	}));
}
