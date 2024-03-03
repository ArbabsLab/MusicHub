const APIController = (function(){

    const clientID = 'a97070f000754a8fbdff123be04d3692';
    const clientSecret = 'f9ef641066374dc6bf67495d1e0413fb';

    const _getToken = async () => {

        const result = await fetch("https://accounts.spotify.com/api/token", {
            method: 'POST',
            headers: {
                'Content-type' : 'application/x-www-form-urlencoded',
                'Authorization' : 'Basic ' + btoa(clientID + ':' + clientSecret)
            },
            body: 'grant_type=client_credentials'
            }   
        );

        const data = await result.json();
        return data.access_token;
    }

    const _getGenre = async (token) => {
        const result = await fetch("https://api.spotify.com/v1/browse/categories", {
            method: 'POST', 
            headers: { 'Authorization' : 'Bearer ' + token}
    });

    const data = await result.json();
    return data.categories.items;
    }

    const _getPlaylist = async (token, genreId) => {
        const limit = 10;

        const result = await fetch('https://api.spotify.com/v1/browse/categories/${genreId}/playlists?limit=${limit}',
            {
                method: 'GET',
                headers: {'Authorization' : 'Bearer ' + (token)}
            }
        );

        const data = await result.json();
        return data.playlists.items;
    }

    const _getTrackList = async (token, trackEndPoint) => {
        const limit = 10;

        const result = await fetch('${trackEndPoint}?limit=${limit}',{
            method: 'GET',
            header: {'Authorization' : 'Bearer ' + token}
        });

        const data = result.json();
        return data.items;
    }

    return {

        getToken(){
            return _getToken();
        },
        getGenre(token){
            return _getGenre(token);
        },
        getPlaylist(token, genreId){
            return _getPlaylist(token, genreId);
        },
        getTrackList(token, endPoint){
            return _getTrackList(token, trackEndPoint);
        }

    }
})();

const UIController = (function(){

    const DOMElements = {
        selectGenre: '#select_genre',
        selectPlaylist: '#select_playlist',
        buttonSubmit: '#btn_submit',
        hfToken: '#hidden_token',
        divSonglist: '.song-list'

    }

    return{

        inputField(){
            return{
                genre: document.querySelector(DOMElements.selectGenre),
                playlist: document.querySelector(DOMElements.selectPlaylist),
                tracks: document.querySelector(DOMElements.divSonglist),
                submit: document.querySelector(DOMElements.buttonSubmit)
            }
        },

        createGenre(text, value) {
            const html = '<option value="$(value)">$(text)</option>';
            document.querySelector(DOMElements.selectGenre).insertAdjacentHTML('beforeend', html);
        },

        createPlaylist(text, value) {
            const html = '<option value="$(value)">$(text)</option>';
            document.querySelector(DOMElements.selectPlaylist).insertAdjacentHTML('beforeend', html);
        },

        createTrack(id, name) {
            const html = `<a href="#" class="list-group-item list-group-item-action list-group-item-light" id="${id}">${name}</a>`;
            document.querySelector(DOMElements.divSonglist).insertAdjacentHTML('beforeend', html);
        },

        resetTracks() {
            this.inputField().tracks.innerHTML = '';
            this.resetTrackDetail();
        },

        resetTrackDetail() {
            this.inputField().songDetail.innerHTML = '';
        },

        resetPlaylist() {
            this.inputField().playlist.innerHTML = '';
            this.resetTracks();
        },
        
        storeToken(value) {
            document.querySelector(DOMElements.hfToken).value = value;
        },

        getStoredToken() {
            return {
                token: document.querySelector(DOMElements.hfToken).value
            }
        }
        
    }

})();


const APPController = (function(UICtrl, APICtrl){
    const DOMInputs = UICtrl.inputField();

    const loadGenres = async () => {
        const token = await APICtrl.getToken();

        const genres = await APICtrl.getGenre(token);

        genres.forEach(element => UICtrl.createGenre(element.name, element.id));

    }

    DOMInputs.genre.addEventListener('change', async () => {
        
        UICtrl.resetPlaylist();
        const token = UICtrl.getStoredToken().token;
        const genreSelect = UICtrl.inputField().genre;
        const genreId = genreSelect.options[genreSelect.selectedIndex].value;             
        const playlist = await APICtrl.getPlaylistByGenre(token, genreId);       

        playlist.forEach(p => UICtrl.createPlaylist(p.name, p.tracks.href));
    });

    DOMInputs.submit.addEventListener('click', async (e) => {
        e.preventDefault();
        UICtrl.resetTracks();
        const token = UICtrl.getStoredToken().token;        
        const playlistSelect = UICtrl.inputField().playlist;
        const tracksEndPoint = playlistSelect.options[playlistSelect.selectedIndex].value;
        const tracks = await APICtrl.getTracks(token, tracksEndPoint);
        tracks.forEach(el => UICtrl.createTrack(el.track.href, el.track.name))
        
    });

    return {
        init() {
            console.log('App is starting');
            loadGenres();
        }
    }


})(UIController, APIController);