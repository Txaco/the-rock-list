let APP = (WINDOW => {

	// DATA CONSTANTS
	const DATA = {
		clientId: '52993c4622e348bb8d60b1b5a3c4dfcf',
		clientSecret: '283b2eb32d6c4112bd82c698f5588449',
		redirectUri: 'https://the-rock-list.netlify.com',
		authorizationTokensUri: 'https://accounts.spotify.com/api/token',
		fallbackImageUri: 'https://via.placeholder.com/512x512',
		resultLimit: 12,
		queryFilters: [' track:', ' artist:', ' album:', ' genre:', ' year:']
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
	DATA.searchUri = `https://api.spotify.com/v1/search?limit=${DATA.resultLimit}`;
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

	// Append results to DOM
	function displaySearchResults(results) {

		let data = displaySearchResults.data, shared = displaySearchResults.shared;
		
		let htmlItems = '';
		
		if(results.tracks.items.length) {
		
			let imageSrc;
			
			for(let item of results.tracks.items) {

				imageSrc = item.images && item.images.length ? item.images[item.images.length - 1].url : data.fallbackImageUri;

				htmlItems += `

					<li class="result-item">

						<img src="${imageSrc}" alt="Track Image" />
						<div>
							<h5 class="result-artist result-info">${item.artists[0].name}</h5>
							<h4 class="result-title result-info">${item.name}</h4>
							<h6 class="result-album result-info">Del ${item.album.album_type}&nbsp;<span>${item.album.name}</span></h6>
						</div>

					</li>

				`;

			}
		
		}
		
		else {
		
			htmlItems += `<li class="no-results"></li>`;
		
		}

		shared.songResultsList.innerHTML = htmlItems;

	}
	displaySearchResults.data = {
		fallbackImageUri: DATA.fallbackImageUri
	};
	displaySearchResults.shared = {};

	// Click handler for user search
	function documentClick(clickEvent) {
		
		if(clickEvent.target.id === 'search-button') {
			
			let userInput = clickEvent.target.previousElementSibling.value;
			
			if(userInput) {
			
				let data = documentClick.data, shared = documentClick.shared, search = shared.fetch;

				let input = shared.encode(userInput);
				
				if(!data.searchOptions.headers['Authorization']) {
					data.searchOptions.headers['Authorization'] = `Bearer ${data.accessToken}`;
				}

				let URI;

				for(let type of ['track', 'artist', 'album']) {

					URI = `${data.searchUri}&type=${type}&q=${type}:${input}`;

					search(URI, data.searchOptions)
						.then(response => response.json())
							.then(results => displaySearchResults(results))
								.catch(error => console.log(error)); /*shared.location.reload()*/

				}
			
			}
			
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

	// Get DOM references and set DOM events (search click) and SHOW APP !!!
	function workWithDOM() {
		
		displaySearchResults.shared.songResultsList = document.getElementById('songs-results');
		displaySearchResults.shared.artistResultsList = document.getElementById('artist-results');
		displaySearchResults.shared.albumResultsList = document.getElementById('album-results');
		documentClick.shared.fetch = window.fetch;
		
		document.addEventListener('click', documentClick);
		
		document.body.style.display = 'grid'; // Show APP !!!
		
	}
  
	// Implicit grant flow
	function init() {
		
		const data = init.data, shared = init.shared, helpers = init.helpers;
		
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
	init.data = {
		uri: DATA.implicitGrantUri
	};
	init.shared = {
		location: SHARED.location
	};
	init.helpers = {
		getURLParams: HELPERS.getURLParams
	};

	document.addEventListener('DOMContentLoaded', init); // Add DOM load event

})(window);

/* NOTES

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

*/
