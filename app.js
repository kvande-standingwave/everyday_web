async function resolveUserId(username) {
  const url = `https://api.soundcloud.com/resolve?url=https://soundcloud.com/${username}&client_id=${SOUND_CLOUD_CLIENT_ID}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Failed to resolve user');
  }
  const data = await res.json();
  return data.id;
}

async function fetchAllTracks(userId) {
  let tracks = [];
  let url = `https://api.soundcloud.com/users/${userId}/tracks?client_id=${SOUND_CLOUD_CLIENT_ID}&linked_partitioning=1&limit=200`;
  while (url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Failed to fetch tracks');
    }
    const data = await res.json();
    tracks = tracks.concat(data.collection || data);
    url = data.next_href ? `${data.next_href}&client_id=${SOUND_CLOUD_CLIENT_ID}` : null;
  }
  return tracks;
}

function renderTracks(tracks) {
  const list = document.getElementById('track-list');
  list.innerHTML = '';
  const sorted = [...tracks].sort(
    (a, b) => new Date(a.created_at) - new Date(b.created_at)
  );
  sorted.forEach(track => {
    const container = document.createElement('article');
    container.className = 'track';

    const heading = document.createElement('h3');
    const link = document.createElement('a');
    link.href = track.permalink_url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = track.title;
    heading.appendChild(link);
    container.appendChild(heading);

    const date = document.createElement('p');
    date.className = 'track-date';
    date.textContent = new Date(track.created_at)
      .toISOString()
      .split('T')[0];
    container.appendChild(date);

    const iframe = document.createElement('iframe');
    iframe.allow = 'autoplay';
    iframe.src = `https://w.soundcloud.com/player/?url=${encodeURIComponent(
      track.permalink_url
    )}`;
    container.appendChild(iframe);

    list.appendChild(container);
  });
  document.getElementById('total-days').textContent = tracks.length;
}

function filterTracks(tracks, start, end) {
  return tracks.filter(track => {
    const created = new Date(track.created_at);
    return (!start || created >= start) && (!end || created <= end);
  });
}

async function init() {
  try {
    const userId = await resolveUserId(SOUND_CLOUD_USER);
    const tracks = await fetchAllTracks(userId);

    const startInput = document.getElementById('start-date');
    const endInput = document.getElementById('end-date');
    const form = document.getElementById('filter-form');

    // Set default date range based on tracks
    const dates = tracks.map(t => new Date(t.created_at));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    startInput.value = minDate.toISOString().split('T')[0];
    endInput.value = maxDate.toISOString().split('T')[0];

    renderTracks(tracks);

    form.addEventListener('submit', evt => {
      evt.preventDefault();
      const startDate = startInput.value ? new Date(startInput.value) : null;
      const endDate = endInput.value ? new Date(endInput.value) : null;
      const filtered = filterTracks(tracks, startDate, endDate);
      renderTracks(filtered);
    });
  } catch (err) {
    console.error(err);
    document.getElementById('track-list').textContent = 'Unable to load tracks. Ensure the client ID is set and network access is available.';
  }
}

init();
