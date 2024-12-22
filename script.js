let currentTab = 'watchlist';
        let watchlist = JSON.parse(localStorage.getItem('watchlist')) || [];
        let watched = JSON.parse(localStorage.getItem('watched')) || [];
        let currentModal = 'manual';

        function openAddModal(type) {
            currentModal = type;
            document.getElementById('addModal').style.display = 'block';
            document.getElementById('manualForm').style.display = type === 'manual' ? 'block' : 'none';
            document.getElementById('searchForm').style.display = type === 'search' ? 'block' : 'none';
        }

        function closeModal() {
            document.getElementById('addModal').style.display = 'none';
            document.getElementById('searchResults').style.display = 'none';
        }

        function switchTab(tab) {
            currentTab = tab;
            document.getElementById('watchlist').style.display = tab === 'watchlist' ? 'grid' : 'none';
            document.getElementById('watched').style.display = tab === 'watched' ? 'grid' : 'none';
            
            const buttons = document.querySelectorAll('.tab-btn');
            buttons.forEach(btn => {
                btn.classList.toggle('active', btn.textContent.toLowerCase().includes(tab));
            });
        }

        async function searchTVMaze(query) {
            if (query.length < 2) return;
            
            try {
                const response = await fetch(`https://api.tvmaze.com/search/shows?q=${query}`);
                const data = await response.json();
                
                const resultsDiv = document.getElementById('searchResults');
                resultsDiv.style.display = 'block';
                resultsDiv.innerHTML = data.map(item => `
                    <div class="search-item" onclick="selectTVMazeShow(${JSON.stringify(item.show).replace(/"/g, '&quot;')})">
                        ${item.show.name} (${item.show.premiered ? item.show.premiered.split('-')[0] : 'N/A'})
                    </div>
                `).join('');
            } catch (error) {
                console.error('Error searching TVMaze:', error);
            }
        }

        function selectTVMazeShow(show) {
            const series = {
                title: show.name,
                year: show.premiered ? show.premiered.split('-')[0] : 'N/A',
                genre: show.genres.join(', '),
                status: show.status.toLowerCase(),
                imageUrl: show.image ? show.image.medium : null,
                rating: show.rating.average || 'N/A',
                addedDate: new Date().toISOString()
            };

            watchlist.push(series);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            renderLists();
            closeModal();
        }

        function addSeries() {
            const series = {
                title: document.getElementById('title').value,
                year: document.getElementById('year').value,
                genre: document.getElementById('genre').value,
                status: document.getElementById('status').value,
                imageUrl: document.getElementById('imageUrl').value || null,
                addedDate: new Date().toISOString()
            };

            if (!series.title || !series.year) {
                alert('Please fill in at least the title and year');
                return;
            }

            watchlist.push(series);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            renderLists();
            closeModal();
        }

        function moveToWatched(index) {
            const series = watchlist[index];
            series.completedDate = new Date().toISOString();
            watched.push(series);
            watchlist.splice(index, 1);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            localStorage.setItem('watched', JSON.stringify(watched));
            renderLists();
        }

        function moveToWatchlist(index) {
            const series = watched[index];
            delete series.completedDate;
            watchlist.push(series);
            watched.splice(index, 1);
            localStorage.setItem('watchlist', JSON.stringify(watchlist));
            localStorage.setItem('watched', JSON.stringify(watched));
            renderLists();
        }

        function deleteSeries(index, list) {
            const targetList = list === 'watchlist' ? watchlist : watched;
            targetList.splice(index, 1);
            localStorage.setItem(list, JSON.stringify(targetList));
            renderLists();
        }

        function renderLists() {
            const watchlistHTML = watchlist.map((series, index) => createSeriesCard(series, index, 'watchlist')).join('');
            const watchedHTML = watched.map((series, index) => createSeriesCard(series, index, 'watched')).join('');
            
            document.getElementById('watchlist').innerHTML = watchlistHTML;
            document.getElementById('watched').innerHTML = watchedHTML;
        }

        function createSeriesCard(series, index, list) {
            return `
                <div class="series-card">
                    ${series.imageUrl ? 
                        `<img src="${series.imageUrl}" alt="${series.title}" class="series-image">` :
                        `<div class="placeholder-image"><i class="fas fa-tv fa-3x"></i></div>`
                    }
                    <div class="series-info">
                        <h3 class="series-title">${series.title}</h3>
                        <div class="series-meta">
                            <div>${series.year} · ${series.genre}</div>
                            <div>Status: ${series.status}</div>
                            ${series.rating ? `<div>Rating: ${series.rating}</div>` : ''}
                        </div>
                        <div class="series-actions">
                            ${list === 'watchlist' ? 
                                `<button class="btn" onclick="moveToWatched(${index})">Mark Watched</button>` :
                                `<button class="btn" onclick="moveToWatchlist(${index})">Move to Watchlist</button>`
                            }
                            <button class="btn" onclick="deleteSeries(${index}, '${list}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        }

        // Initial render
        renderLists();