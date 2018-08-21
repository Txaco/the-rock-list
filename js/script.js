let APP = (WINDOW => {

	// DATA CONSTANTS
	const DATA = {
		clientId: '52993c4622e348bb8d60b1b5a3c4dfcf',
		clientSecret: '283b2eb32d6c4112bd82c698f5588449',
		redirectUri: 'https://the-rock-list.netlify.com',
		authorizationTokensUri: 'https://accounts.spotify.com/api/token',
		resultTypes: ['track', 'artist', 'album', 'playlist'],
		fallbackImageUri: 'https://via.placeholder.com/64x64',
		resultLimit: 12
	};
	DATA.authorizationCodeUri = `
		https://accounts.spotify.com/authorize?response_type=code&client_id=${DATA.clientId}&redirect_uri=${DATA.redirectUri}
	`;
	DATA.authorizationTokensOptions = {
		method: 'POST',
		headers: {
			Authorization: `Basic ${[WINDOW.atob(DATA.clientId), WINDOW.atob(DATA.clientSecret)].join(':')}`
		},
		body: {
			grant_type: 'authorization_code',
			redirect_uri: DATA.redirect_uri
		}
	};
	DATA.implicitGrantUri =
		`https://accounts.spotify.com/authorize?response_type=token&client_id=${DATA.clientId}&redirect_uri=${DATA.redirectUri}
	`;
	DATA.searchUri = `https://api.spotify.com/v1/search?type=${DATA.resultTypes.join(',')}&limit=${DATA.resultLimit}&q=`;
	DATA.searchOptions = {
		credentials: 'same-origin',
		headers: {}
	};
  
	// SHARED OBJECTS
	const SHARED = {
		URL: WINDOW.URL,
		URLSearchParams: WINDOW.URLSearchParams,
		location: WINDOW.location,
		encode: WINDOW.encodeURIComponent,
		decode: WINDOW.decodeURIComponent,
		fetch: WINDOW.fetch
	};
  
	// HELPER FUNCTIONS
	const HELPERS = {
		getURLParams: () => {
			let shared = HELPERS.getURLParams.shared;
			let url = new shared.URL(shared.location);
			if(url.search) {
				return url.searchParams;
			}
			else if(url.hash) {
				let urlParams = new shared.URLParams(url.hash.substring(1));
				return urlParams;
			}
			else {
				return null;
			}
		}
	};
	HELPERS.getURLParams.shared = {
		URL: SHARED.URL,
		location: SHARED.location,
		URLParams: SHARED.URLSearchParams
	};
  
	// PRODUCT VALUES
	let PRODUCTS = {
		accessToken: null,
		refreshToken: null
	};

	// Append results to DOM
	function displaySearchResults(results) {
		let data = displaySearchResults.data, shared = displaySearchResults.shared;
		let wrapper, listElement, itemElement, imgElement, textNode;
		for(let type of data.resultTypes) {
			wrapper = shared[`${type}Results`];
			listElement = document.createElement('ul');
			for(let item of results[`${type}s`].items) {
				itemElement = document.createElement('li');
				imgElement = document.createElement('img');
				pElement = document.createElement('p');
				imgElement.src = item.images && item.images.length ?
					item.images[item.images.length - 1].url : data.fallbackImageUri;
				imgElement.alt = `${type} image`;
				pElement.textContent = item.name;
				itemElement.appendChild(imgElement);
				itemElement.appendChild(pElement);
				listElement.appendChild(itemElement);
			}
			wrapper.replaceChild(listElement, wrapper.lastElementChild);
		}
	}
	displaySearchResults.data = {
		resultTypes: DATA.resultTypes,
		fallbackImageUri: DATA.fallbackImageUri
	};
	displaySearchResults.shared = {};

	// Click handler for user search
	function documentClick(clickEvent) {
		let data = documentClick.data, shared = documentClick.shared, search = shared.fetch;
		if(clickEvent.target.id === 'search-button') {
			let userInput = shared.encode(clickEvent.target.previousElementSibling.value);
			let searchUri = data.searchUri + userInput;
			if(!data.searchOptions.headers['Authorization']) {
				data.searchOptions.headers['Authorization'] = `Bearer ${data.accessToken}`;
			}
			search(searchUri, data.searchOptions)
				.then(response => response.json())
					.then(results => displaySearchResults(results))
						.catch(error => shared.location.reload());
		}
	}
	documentClick.data = {
		searchUri: DATA.searchUri,
		searchOptions: DATA.searchOptions
	};
	documentClick.shared = {
		encode: SHARED.encode,
		fetch: SHARED.fetch,
		location: SHARED.location
	};

	// Get DOM references and set DOM events (search click)
	function workWithDOM() {
		let data = workWithDOM.data;
		for(let type of data.resultTypes) {
			displaySearchResults.shared[`${type}Results`] = document.getElementById(`${type}-results`);
		}
		documentClick.shared.fetch = window.fetch;
		document.addEventListener('click', documentClick);
	}
	workWithDOM.data = {
		resultTypes: DATA.resultTypes
	};

	// Authorization code flow
	function authorizationCode() {
		const data = authorizationCode.data, shared = authorizationCode.shared, helpers = authorizationCode.helpers;
		let urlParams = helpers.getURLParams();
		if(!urlParams) {
			shared.location.replace(data.codeUri);
		}
		else if(urlParams.has('code')) {
			let code = urlParams.get('code');
			data.tokenOptions.body.code = code;
			shared.fetch(data.tokenUri, data.tokenOptions).then(response => console.log(response.json()));
		}
	}
	authorizationCode.data = {
		codeUri: DATA.authorizationCodeUri,
		tokenUri: DATA.authorizationTokensUri,
		tokenOptions: DATA.authorizationTokenOptions
	};
	authorizationCode.shared = {
		location: SHARED.location,
		fetch: SHARED.fetch
	};
	authorizationCode.helpers = {
		getURLParams: HELPERS.getURLParams
	};
  
	// Implicit grant flow
	function implicitGrant() {
		const data = implicitGrant.data, shared = implicitGrant.shared, helpers = implicitGrant.helpers;
		let urlParams = helpers.getURLParams();
		if(!urlParams) {
			shared.location.replace(data.uri);
		}
		else if(urlParams.has('access_token') && urlParams.has('token_type') && urlParams.has('expires_in')) {
			shared.location.hash = '';
			documentClick.data.accessToken = urlParams.get('access_token');
			workWithDOM();
		}
	}
	implicitGrant.data = {
		uri: DATA.implicitGrantUri
	};
	implicitGrant.shared = {
		location: SHARED.location
	};
	implicitGrant.helpers = {
		getURLParams: HELPERS.getURLParams
	};

	document.addEventListener('DOMContentLoaded', implicitGrant); // Add DOM load event

})(window);
