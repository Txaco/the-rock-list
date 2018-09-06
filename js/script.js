let APP = (WINDOW => {

	// DATA CONSTANTS
	const DATA = {
		clientId: '52993c4622e348bb8d60b1b5a3c4dfcf',
		clientSecret: '283b2eb32d6c4112bd82c698f5588449',
		redirectUri: 'https://the-rock-list.netlify.com',
		authorizationTokensUri: 'https://accounts.spotify.com/api/token',
		fallbackImageUri: 'https://dummyimage.com/128x128/cccccc/000000&text=♪',
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
		
		if(results.tracks) {
		
			if(results.tracks.items.length) {

				let imageSrc, albumType, albumText, albumName;

				for(let item of results.tracks.items) {

					imageSrc = item.images && item.images.length ? item.images[0].url : data.fallbackImageUri;
					albumType = item.album.album_type;
					albumName = item.album.name;
					
					if(albumType) {
						albumText = albumType === 'compilation' ?
							`Del recopilatorio <span>${albumName}</span>`
							:
							`Del ${albumType} <span>${albumName}</span>`;
					}
					else {
						albumText = 'Tema sin clasificar';
					}

					htmlItems += `

						<li class="result-item">

							<img src="${imageSrc}" alt="Track Image" />
							<div>
								<h5 class="result-artist result-info">${item.artists[0].name}</h5>
								<h4 class="result-title result-info">${item.name}</h4>
								<h6 class="result-album result-info">${albumText}</h6>
							</div>

						</li>

					`;

				}

			}

			else {

				htmlItems += `<li class="no-results">Pues no, no tenemos ese tema</li>`;

			}

			shared.songResultsList.innerHTML = htmlItems;
			shared.songResultsList.scrollTop = 0;
			
		}
		
		else if(results.artists) {
		
			if(results.artists.items.length) {

				let imageSrc, genres, genresText;

				for(let item of results.artists.items) {

					imageSrc = item.images && item.images.length ? item.images[0].url : data.fallbackImageUri;
					genres = item.genres.map(genre => genre.split(' ').map(word => word.charAt(0).toUpperCase() + word.substr(1).toLowerCase()).join(' ')).join(', ');
					genresText = genres ? `Estilo: <span>${genres}</span>` : 'No tiene estilo';
					
					htmlItems += `

						<li class="result-item">

							<img src="${imageSrc}" alt="Artist Image" />
							<div>
								<h5 class="result-artist result-info">Popularidad:&nbsp;${item.popularity}</h5>
								<h4 class="result-title result-info">${item.name}</h4>
								<h6 class="result-album result-info">${genresText}</h6>
							</div>

						</li>

					`;

				}

			}

			else {

				htmlItems += `<li class="no-results">Pues no, no tenemos ese artista</li>`;

			}

			shared.artistResultsList.innerHTML = htmlItems;
			shared.artistResultsList.scrollTop = 0;
			
		}
		
		else if(results.albums) {
		
			if(results.albums.items.length) {

				let imageSrc, artists, albumType, infoText;

				for(let item of results.albums.items) {

					imageSrc = item.images && item.images.length ? item.images[0].url : data.fallbackImageUri;
					artists = item.artists.map(artist => artist.name).join(' | ');
					albumType = item.album_type === 'compilation' ? 'recopilatorio' : item.album_type;
					albumType = albumType.charAt(0).toUpperCase() + albumType.substr(1).toLowerCase();
					infoText = `${albumType} &copysr; <span>${item.release_date}</span>`;

					htmlItems += `

						<li class="result-item">

							<img src="${imageSrc}" alt="Album Image" />
							<div>
								<h5 class="result-artist result-info">${artists}</h5>
								<h4 class="result-title result-info">${item.name}</h4>
								<h6 class="result-album result-info">${infoText}</h6>
							</div>

						</li>

					`;

				}

			}

			else {

				htmlItems += `<li class="no-results">Pues no, no tenemos ese album</li>`;

			}

			shared.albumResultsList.innerHTML = htmlItems;
			shared.albumResultsList.scrollTop = 0;
			
		}

	}
	displaySearchResults.data = {
		fallbackImageUri: DATA.fallbackImageUri
	};
	displaySearchResults.shared = {};

	// Handler for "submit" Event
	function searchSubmit(submitEvent) {
		
		submitEvent.preventDefault();
		
		let userInput = submitEvent.target.elements['search-input'].value;

		if(userInput && userInput !== searchSubmit.data.lastInput) {

			let data = searchSubmit.data, shared = searchSubmit.shared, search = shared.fetch;
			
			data.lastInput = userInput;

			let input = shared.encode(userInput);

			if(!data.searchOptions.headers['Authorization']) {
				data.searchOptions.headers['Authorization'] = `Bearer ${data.accessToken}`;
			}

			let URI;

			for(let type of ['track', 'artist', 'album']) {

				URI = `${data.searchUri}&type=${type}&q=${type}:${input}`;

				search(URI, data.searchOptions).then(response => {
					if(response.status === 401) {
						alert('Tu hora de acceso ha caducado. Vamos a renovarla...');
						shared.location.reload();
					}
					else {
						return response.json();
					}
				}).then(results => displaySearchResults(results)).catch(error => alert(error));

			}

		}
		
	}
	searchSubmit.data = {
		searchUri: DATA.searchUri,
		searchOptions: DATA.searchOptions
	};
	searchSubmit.shared = {
		encode: SHARED.encode,
		fetch: SHARED.fetch,
		location: SHARED.location
	};

	// Get DOM references and set DOM events (search click) and SHOW APP !!!
	function workWithDOM() {
		
		displaySearchResults.shared.songResultsList = document.getElementById('songs-list');
		displaySearchResults.shared.artistResultsList = document.getElementById('artists-list');
		displaySearchResults.shared.albumResultsList = document.getElementById('albums-list');
		searchSubmit.shared.fetch = window.fetch;
		
		document.forms['search-form'].addEventListener('submit', searchSubmit);
		
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
			
			searchSubmit.data.accessToken = urlParams.get('access_token');
			
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
