import type {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class PantristApi implements ICredentialType {
	name = 'pantristApi';

	displayName = 'Pantrist API';

	documentationUrl = 'https://pantrist.app';

	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description:
				'Your Pantrist API key in the form &lt;uuid&gt;_&lt;secret&gt;. Generate it in the Pantrist web app under Settings.',
		},
		{
			displayName: 'Base URL',
			name: 'baseUrl',
			type: 'string',
			default: 'https://api.pantrist.app',
			description: 'Base URL of the Pantrist API. Only change this if you self-host Pantrist.',
		},
	];

	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			headers: {
				Authorization: '=Bearer {{$credentials.apiKey}}',
			},
		},
	};

	test: ICredentialTestRequest = {
		request: {
			baseURL: '={{$credentials.baseUrl}}',
			url: '/list',
		},
	};
}
