# everyday_web

Interactive webpage for browsing the [everyday sound design project](https://soundcloud.com/standingwave).

## Features
- Fetches all tracks from SoundCloud for the `standingwave` account.
- Displays each track with its title (linking back to SoundCloud), creation date, and embedded player.
- Shows the total number of days (tracks) in the project.
- Filter recordings by start and end date.

## Setup
1. Obtain a SoundCloud API client ID.
2. In `index.html`, replace `YOUR_CLIENT_ID` with your SoundCloud client ID.
3. Serve the directory with any static file server, e.g.
   ```bash
   python3 -m http.server
   ```
4. Open the page in your browser and interact with the filters.

## Notes
The page loads data directly from the SoundCloud API; network access and a valid client ID are required for the track list to populate.
