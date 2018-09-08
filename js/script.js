let THE_ROCK_LIST = ( WINDOW => {

	/*************/
	/* MAIN DATA */
	/*************/

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
	// Spotify API URIs - accessToken, search, getTrack, ... ???
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

	/******************/
	/* SHARED OBJECTS */
	/******************/
  
	const SHARED_OBJECTS = {

		trackResultsList: null,
		artistResultsList: null,
		albumResultsList: null,
		lastSearch: null, // EVENT_LISTENERS.searchSubmit(event) adds this value
		pickedResult: {} // EVENT_LISTENERS.pickResult(event) adds pickedResult.id and pickedResult.title

	};

	/********************/
	/* HELPER FUNCTIONS */
	/********************/

	const HELPER_FUNCTIONS = {

		getURLParams: () => {

			let url = new window.URL(window.location); // Create new URL from current location

			if(url.search) return url.searchParams;

			else if(url.hash) { let params = new window.URLSearchParams(url.hash.substring(1)); return params; }

			else return null;

		},

		fetchURI: (uri, options) => {

			// Returb fetch promise or refresh Access Token
			return window.fetch(uri, options).then(response => {
		
				if(response.status === 401) { alert('Tu hora de acceso ha caducado. Vamos a renovarla...'); window.location.reload(); }
				
				else return response.json();
			
			});
		
		}

	};



	// EVENT LISTENERS
	const EVENT_LISTENERS = {

		initialize: event => {

			let urlParams = HELPER_FUNCTIONS.getURLParams(); // Get URL parameters

			// A: If no parameters, get Token (redirect)
			if(!urlParams) window.location.replace(MAIN_DATA.spotifyAPI.accessToken.location);

			// B: If parameters has access_token=[?]&token_type=[?]&expires_in=[?], set Access Token -> 2: WORK_WITH_DOM
			else if(urlParams.has('access_token') && urlParams.has('token_type') && urlParams.has('expires_in')) {
			
				window.location.hash = ''; // Remove URL hash (no need to show it)

				let token = urlParams.get('access_token'); // Get Access Token
				
				MAIN_DATA.spotifyAPI.accessToken.value = token; // Set Access Token value
				MAIN_DATA.spotifyAPI.accessToken.header['Authorization'] += token; // Set Access Token header
				
			}

			// Get DOM references
			SHARED_OBJECTS.trackResultsList = document.getElementById('spotify-track-results-list');
			SHARED_OBJECTS.artistResultsList = document.getElementById('spotify-artist-results-list');
			SHARED_OBJECTS.albumResultsList = document.getElementById('spotify-album-results-list');

			// Set DOM events
			document.forms['spotify-search'].addEventListener('submit', EVENT_LISTENERS.searchSubmit);
			document.addEventListener('mousedown', EVENT_LISTENERS.pickResult);
			document.addEventListener('mouseup', EVENT_LISTENERS.dropResult);
			document.addEventListener('click', EVENT_LISTENERS.clickUserTrack);

			document.body.style.display = 'grid'; // Show APP !!!

		},

		searchSubmit: event => {

			event.preventDefault(); // Avoid page reload
		
			let userInput = event.target.elements['spotify-search-input'].value; // Get user input

			if(userInput && userInput !== SHARED_OBJECTS.lastSearch) {

				SHARED_OBJECTS.lastSearch = userInput;

				let uri;

				for(let type of ['track', 'artist', 'album']) {

					uri = MAIN_DATA.spotifyAPI.search.uri + `&type=${type}&q=${type}:${userInput}`;

					HELPER_FUNCTIONS.fetchURI(uri, MAIN_DATA.spotifyAPI.search.options)
								.then(results => displayResults(results))
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
					
						let droppedResult = document.createElement('li');
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
				
				HELPER_FUNCTIONS.fetchURI(uri, MAIN_DATA.spotifyAPI.getTrack.options)
							.then(result => console.log(result))
								.catch(error => alert(error));
			
			}

		}

	};



	// DISPLAY_RESULTS
	const displayResults = results => {

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

					// Add track to list - set <li> item data-id attribute to Spotify track id
					list += `

						<li class="spotify-result" data-id="${track.id}">

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

			SHARED_OBJECTS.trackResultsList.innerHTML = list; // Show list (replace old one)
			SHARED_OBJECTS.trackResultsList.scrollTop = 0; // Reset list scroll to top

		}

		// B: If results have ARTIST OBJECTS
		else if(results.artists) {

			// If not empty array, add artists to list
			if(results.artists.items.length) {

				list = ''; // Reset list

				let imageSrc, genres; // Declare reusable variables for looping

				// Loop ertist results
				for(let artist of results.artists.items) {

					// If artist has images, set imageSrc to max resolution image (first in array), if not, set it to fallback
					imageSrc = artist.images.length ? artist.images[0].url : MAIN_DATA.fallbackImageUri;

					genres = artist.genres.map(genre => genre.toUpperCase()).join(', '); // Get artist genres, if any
					genres = genres ? `Estilo: <span>${genres}</span>`: 'No tiene estilo'; // Set artist genres or fallback

					// Add artists to list
					list += `

						<li class="spotify-result">

							<img src="${imageSrc}" alt="Artist Image" />
							<div>
								<h5 class="spotify-result-info pos-top">Popularidad:&nbsp;${artist.popularity}</h5>
								<h4 class="spotify-result-info pos-mid">${artist.name}</h4>
								<h6 class="spotify-result-info pos-bot">${genres}</h6>
							</div>

						</li>

					`;

				}

			}

			// If array is empty, add "NO ARTIST RESULTS" message to list
			else list = '<li class="spotify-no-results">Pues no, no tenemos ese artista</li>';

			SHARED_OBJECTS.artistResultsList.innerHTML = list; // Show list (replace old one)
			SHARED_OBJECTS.artistResultsList.scrollTop = 0; // Reset list scroll to top

		}
	
		// C: If results have ALBUM OBJECTS
		else if(results.albums) {
		
			// If not empty array, add albums to list
			if(results.albums.items.length) {

				let imageSrc, artistNames, type, info; // Declare reusable variables for looping

				// Loop album results
				for(let album of results.albums.items) {

					// If album has images, set imageSrc to max resolution image (first in array), if not, set it to fallback
					imageSrc = album.images.length ? album.images[0].url : MAIN_DATA.fallbackImageUri;

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

			SHARED_OBJECTS.albumResultsList.innerHTML = list; // Show list (replace old one)
			SHARED_OBJECTS.albumResultsList.scrollTop = 0; // Reset list scroll to top
			
		}

	};

	// 1: INITIALIZE
	WINDOW.document.addEventListener('DOMContentLoaded', EVENT_LISTENERS.initialize);

})(window);
