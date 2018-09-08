let THE_ROCK_LIST = ( WINDOW => {



	// MAIN DATA
	const MAIN_DATA = {

		// Spotify API data
		spotifyAPI: {

			clientId: '52993c4622e348bb8d60b1b5a3c4dfcf',
			clientSecret: '283b2eb32d6c4112bd82c698f5588449',
			redirectURI: 'https://the-rock-list.netlify.com',
			resultLimit: 12,

		},

		fallbackImageURI: 'https://dummyimage.com/128x128/cccccc/000000&text=♪'

	};
	// Spotify API URIs - get Token, search, get Track, ... ???
	MAIN_DATA.spotifyAPI.accessToken = {
		location: `https://accounts.spotify.com/authorize?response_type=token&client_id=${MAIN_DATA.spotifyAPI.clientId}&redirect_uri=${MAIN_DATA.spotifyAPI.redirectURI}`,
		value: null,
		header: { 'Authorization': 'Bearer ' }
	};
	MAIN_DATA.spotifyAPI.search = {
		uri: `https://api.spotify.com/v1/search?limit=${MAIN_DATA.spotifyAPI.resultLimit}`,
		options: { credentials: 'same-origin', headers: MAIN_DATA.spotifyAPI.accessToken.header }
	};
	MAIN_DATA.spotifyAPI.getTrack = {
		uri: 'https://api.spotify.com/v1/tracks/',
		options: { headers: MAIN_DATA.spotifyAPI.accessToken.header }
	};


  
	// SHARED OBJECTS | workWithDOM() adds SHARED_OBJECTS.dom = DOM references object
	const SHARED_OBJECTS = {

		location: WINDOW.location,
		url: WINDOW.URL,
		urlSearchParams: WINDOW.URLSearchParams,
		encode: WINDOW.encodeURIComponent,
		decode: WINDOW.decodeURIComponent,
		fetch: WINDOW.fetch,
		lastSearch: null, // EVENT_LISTENERS.searchSubmit(event) adds this value
		pickedResult: {} // EVENT_LISTENERS.pickResult(event) adds pickedResult.id and pickedResult.title

	};



  
	// HELPER FUNCTIONS
	const HELPERS = {

		getURLParams: {

			url: SHARED_OBJECTS.url,
			location: SHARED_OBJECTS.location,
			urlSearchParams: SHARED_OBJECTS.urlSearchParams,

			go: function() {

				let url = new this.url(this.location);

				if(url.search) return url.searchParams;

				else if(url.hash) { let params = new this.urlSearchParams(url.hash.substring(1)); return params; }

				else return null;

			}

		}

		fetchURI: {

			fetch: SHARED_OBJECTS.fetch,
			location: SHARED_OBJECTS.location,
			
			go: (uri, options) => {

				return this.fetch(url, options).then(response => {
			
					if(response.status === 401) { alert('Tu hora de acceso ha caducado. Vamos a renovarla...'); this.location.reload(); }
					
					else return response.json();
				
				});
			
			}
			
		}

	};



	// EVENT LISTENERS
	const EVENT_LISTENERS = {

		searchSubmit: event => {

			event.preventDefault(); // Avoid page reload
		
			let userInput = event.target.elements['search-input'].value; // Get user input

			if(userInput && userInput !== SHARED_OBJECTS.lastSearch) {

				SHARED_OBJECTS.lastSearch = userInput;

				let uri;

				for(let type of ['track', 'artist', 'album']) {

					uri = MAIN_DATA.spotifyAPI.search.uri + `&type=${type}&q=${type}:${userInput}`;

					HELPERS.fetchURI(uri, MAIN_DATA.spotifyAPI.search.options)
								.then(results => displayResults.go(results))
									.catch(error => alert(error));

				}

			}

		},

		pickResult: event => {

			let target = event.target;
			
			while(target.parentElement) {
				
				if(target.className === 'result-item' && target.parentElement.id === 'songs-list') {
					
					SHARED_OBJECTS.pickedResult.id = target.dataset.id;
					SHARED_OBJECTS.pickedResult.title = target.querySelector('h4.result-title').textContent;
					
					break;
					
				}
				
				target = target.parentElement;
				
			}

		},

		dropResult: event => {

			if(SHARED_OBJECTS.pickedResult.id && SHARED_OBJECTS.pickedResult.title) {
			
				let target = event.target;
				
				while(target.parentElement) {
					
					if(target.id === 'user-list') {
					
						let droppedResult = SHARED_OBJECTS.dom.document.createElement('li');
						droppedResult.setAttribute('data-id', SHARED_OBJECTS.pickedResult.id);
						droppedResult.textContent = SHARED_OBJECTS.pickedResult.title;
						target.appendChild(droppedResult);
						
						SHARED_OBJECTS.pickedResult.id = null;
						SHARED_OBJECTS.pickedResult.title = null;
						
						break;
					
					}
					
					target = target.parentElement;
					
				}
			
			}

		},

		clickUserTrack: event => {

			let target = event.target;
	
			if(target.parentElement.id === 'user-list') {
			
				let uri = `${MAIN_DATA.spotifyAPI.getTrack.uri}${target.dataset.id}`;
				
				HELPERS.fetchURI(uri, MAIN_DATA.spotifyAPI.getTrack.options)
							.then(result => console.log(result))
								.catch(error => alert(error));
			
			}

		}

	};



	// DISPLAY_RESULTS
	const displayResults = {

		// Resources
		fallbackImageUri: MAIN_DATA.fallbackImageUri, // Data
		trackResultsList: SHARED_OBJECTS.dom.trackResultsList, // Shared
		artistResultsList: SHARED_OBJECTS.dom.artistResultsList, // Shared
		albumResultsList: SHARED_OBJECTS.dom.albumResultsList, // Shared

		go: function(results) {

			let list; // Reusable list (add items here)

			// A: If results have TRACK OBJECTS
			if(results.tracks) {

				// If not empty array, add tracks to list
				if(results.tracks.items.length) {

					list = ''; // Reset list

					let imageSrc = this.fallbackImageUri; // Tracks don't have images, so we set image source to fallbackImageUri
					let artistNames, albumType, albumName, albumText; // Declare reusable variables for looping

					// Loop track results
					for(let track of results.tracks.items) {

						artistNames = track.artists.map(artist => artist.name.toUpperCase()).join(' | '); // Get artist names
						albumType = track.album.album_type; // Get track album type
						albumName = track.album.name; // Get track album name

						// Set track album text (change "compilation" for "recopilatorio" if needed)
						albumText = albumType === 'compilation' ?	`Del recopilatorio <span>${albumName}</span>`:
																	`Del ${albumType} <span>${albumName}</span>`;

						// If track album type falsy (empty string ???)
						else albumText = 'Tema sin clasificar';

						// Add track to list - set <li> item data-id attribute to Spotify track id
						list += `

							<li class="spotify-result" data-id="${item.id}">

								<img src="${imageSrc}" alt="Track Image" />
								<div>
									<h5 class="spotify-result-info pos-top">${artistNames}</h5>
									<h4 class="spotify-result-info pos-mid">${track.name}</h4>
									<h6 class="spotify-result-info pos-bot">${albumText}</h6>
								</div>

							</li>

						`;

					}

				}

				// If empty array, add "NO TRACK RESULTS" message to list
				else list = '<li class="spotify-no-results">Pues no, no tenemos ese tema</li>';

				this.trackResultsList.innerHTML = list; // Show list (replace old one)
				this.trackResultsList.scrollTop = 0; // Reset list scroll to top

			}

			// B: If results have ARTIST OBJECTS
			else if(results.artists) {

				// If not empty array, add artists to list
				if(results.artists.items.length) {

					list = ''; // Reset list

					let imageSrc, genres; // Declare reusable variables for looping

					// Loop ertist results
					for(let item of results.artists.items) {

						// If artist has images, set imageSrc to max resolution image (first in array), if not, set it to fallback
						imageSrc = item.images.length ? item.images[0].url : this.fallbackImageUri;

						genres = item.genres.map(genre => genre.toUpperCase()).join(', '); // Get artist genres, if any

						// Set artist genres or fallback
						genres = genres ?	`Estilo: <span>${genres}</span>`:
											'No tiene estilo';

						// Add artists to list
						listTemplate += `

							<li class="spotify-result">

								<img src="${imageSrc}" alt="Artist Image" />
								<div>
									<h5 class="spotify-result-info pos-top">Popularidad:&nbsp;${item.popularity}</h5>
									<h4 class="spotify-result-info pos-mid">${item.name}</h4>
									<h6 class="spotify-result-info pos-bot">${genres}</h6>
								</div>

							</li>

						`;

					}

				}

				// If array is empty, add "NO ARTIST RESULTS" message to list
				else list = '<li class="spotify-no-results">Pues no, no tenemos ese artista</li>';

				this.artistResultsList.innerHTML = list; // Show list (replace old one)
				this.artistResultsList.scrollTop = 0; // Reset list scroll to top

			}
		
			// C: If results have ALBUM OBJECTS
			else if(results.albums) {
			
				// If not empty array, add albums to list
				if(results.albums.items.length) {

					let imageSrc, artistNames, type, info; // Declare reusable variables for looping

					// Loop album results
					for(let album of results.albums.items) {

						// If album has images, set imageSrc to max resolution image (first in array), if not, set it to fallback
						imageSrc = album.images.length ? album.images[0].url : this.fallbackImageUri;

						artistNames = album.artists.map(artist => artist.name.toUpperCase()).join(' | '); // Get artist names

						// Get album type (change "compilation" for "recopilatorio" if needed)
						type = album.album_type === 'compilation' ? 'recopilatorio' : album.album_type;
						type = type.charAt(0).toUpperCase() + type.substr(1).toLowerCase(); // Titlecase album type

						info = `${type} &copysr; <span>${album.release_date}</span>`; // Get album info

						// Add albums to list
						list += `

							<li class="spotify-result">

								<img src="${imageSrc}" alt="Album Image" />
								<div>
									<h5 class="spotify-result-info pos-top">${artistNames}</h5>
									<h4 class="spotify-result-info pos-mid">${album.name}</h4>
									<h6 class="spotify-result-info pos-bot">${info}</h6>
								</div>

							</li>

						`;

					}

				}

				// If array is empty, display "NO ALBUM RESULTS" message
				else list = '<li class="spotify-no-results">Pues no, no tenemos ese album</li>';

				this.albumResultsList.innerHTML = list; // Show list (replace old one)
				this.albumResultsList.scrollTop = 0; // Reset list scroll to top
				
			}

		}

	};

	// 2: WORK_WITH_DOM - Get DOM references, set Events and SHOW APP !!!
	const workWithDOM = {

		// Resources
		shared: SHARED_OBJECTS, // Output
		searchSubmit: EVENT_LISTENERS.searchSubmit, // Event
		pickResult: EVENT_LISTENERS.pickResult, // Event
		dropResult: EVENT_LISTENERS.dropResult, // Event
		clickUserTrack: EVENT_LISTENERS.clickUserTrack, // Event

		go: function() {

			let doc = this.shared.window.document; // Get document object

			// Get DOM references
			this.shared.dom = {
				document: doc,
				trackResultsList: doc.getElementById('spotify-track-results-list'),
				artistResultsList: doc.getElementById('spotify-artist-results-list'),
				albumResultsList: doc.getElementById('spotify-album-results-list')
			};

			doc.forms['spotify-search'].addEventListener('submit', this.searchSubmit); // Set searchSubmit Event
			doc.addEventListener('mousedown', this.pickResult); // Set pickResult Event
			doc.addEventListener('mouseup', this.dropResult); // Set dropResult Event
			doc.addEventListener('click', this.clickUserTrack); // Set clickUserTrack Event

			doc.body.style.display = 'grid'; // Show APP !!!
			
		}

	};

	// 1: INITIALIZE - get/set Access Token -> 2: WORK_WITH_DOM
	const initialize = {

		// Resources
		location: SHARED_OBJECTS.location, // Shared
		getURLParams: HELPERS.getURLParams, // Helper
		workWithDOM: workWithDOM, // Listener
		accessToken: MAIN_DATA.spotifyAPI.accessToken, // Output

		go: function() {

			let urlParams = this.getURLParams.go(); // Get URL parameters

			// A: If no parameters, get Token (redirect)
			if(!urlParams) this.location.replace(this.accessToken.location);

			// B: If parameters has access_token=[?]&token_type=[?]&expires_in=[?], set Access Token -> 2: WORK_WITH_DOM
			else if(urlParams.has('access_token') && urlParams.has('token_type') && urlParams.has('expires_in')) {
			
				this.location.hash = ''; // Remove URL hash (no need to show it)

				let token = urlParams.get('access_token'); // Get Access Token
				
				this.accessToken.value = token; // Set Access Token value
				this.accessToken.header['Authorization'] += token; // Set Access Token header
				
				this.workWithDOM(); // -> 2: WORK_WITH_DOM
				
			}

		}

	};

	// Add DOM load event
	WINDOW.document.addEventListener('DOMContentLoaded', initialize.go);

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
		codeUri: `
			https://accounts.spotify.com/authorize?
				response_type=code&
				client_id=${MAIN_DATA.spotifyAPI.clientId}&
				redirect_uri=${MAIN_DATA.spotifyAPI.redirectURI}
		`,
		tokenUri: 'https://accounts.spotify.com/api/token',
		tokenOptions: {
			method: 'POST',
			headers: { Authorization: `Basic ${[WINDOW.atob(MAIN_DATA.spotifyAPI.clientId), WINDOW.atob(MAIN_DATA.spotifyAPI.clientSecret)].join(':')}` },
			body: { grant_type: 'authorization_code', redirect_uri: MAIN_DATA.spotifyAPI.redirectURI }
		}
	};
	authorizationCode.shared = {
		location: SHARED.location,
		fetch: SHARED.fetch
	};
	authorizationCode.helpers = {
		getURLParams: HELPERS.getURLParams
	};

*/
