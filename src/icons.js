const paths={
paw:'<ellipse cx="16" cy="22" rx="8" ry="6" fill="currentColor" stroke="none"/><ellipse cx="6" cy="14" rx="3" ry="4" fill="currentColor" stroke="none"/><ellipse cx="12" cy="8" rx="3" ry="4" fill="currentColor" stroke="none"/><ellipse cx="21" cy="8" rx="3" ry="4" fill="currentColor" stroke="none"/><ellipse cx="27" cy="15" rx="3" ry="4" fill="currentColor" stroke="none"/>',
hand:'<path d="M10 17V6a2 2 0 0 1 4 0v9-3a2 2 0 0 1 4 0v3-2a2 2 0 0 1 4 0v4-2a2 2 0 0 1 4 0v7c0 5-4 8-9 8-5 0-8-5-11-9-2-3 1-5 3-3l2 2"/>',
ball:'<circle cx="16" cy="16" r="11" fill="#e6bd80"/><path d="M7 8q17 5 17 16M6 21q8-9 19-12"/>',
box:'<path d="m5 12 11 4 11-4v14l-11 4-11-4V12Zm11 4v14M5 12 2 6l10-3 4 7 4-7 10 3-3 6M5 12l11-3 11 3"/>',
feather:'<path d="M5 28 23 7M10 22C1 6 20 1 28 3c2 13-3 24-18 19Z" fill="#cbd8b7"/><path d="m12 19 8 1m-3-7 0-6"/>',
heart:'<path d="M16 28C-7 13 7-4 16 8 25-4 39 13 16 28Z" fill="#deb3a1"/>',
gift:'<path d="M5 14h22v15H5zM3 9h26v6H3zM16 9v20"/><path d="M16 9C1 10 7-5 16 9c9-14 15 1 0 0Z" fill="#d9c49e"/>',
sponge:'<path d="M4 14q12-7 24 0v12q-12 7-24 0Z" fill="#e9c487"/><path d="M4 14q12 6 24 0M10 19v1m7 1v1m6-3v1"/><circle cx="8" cy="6" r="3"/><circle cx="22" cy="5" r="2"/>',
shower:'<path d="m21 11-8 8-4-4 8-8 4 4ZM11 17 4 24q-4 6 6 6M15 6q6-7 13 0l-7 7-6-7ZM21 18v3m5-7v3m-8 7v3m8-3v3"/>',
cat:'<path d="M6 14 4 3l10 6h5l9-6-2 12c8 20-29 19-20-1Z" fill="#e9d7b9"/><path d="m8 19 4 1m8 0 4-1M15 23h2m-1 0v3M9 25l-7 1m21-1 7 1"/>',
map:'<path d="m3 7 9-4 9 4 8-4v23l-8 4-9-4-9 4V7Zm9-4v23m9-19v23"/><path d="M9 15q4 8 14 3" stroke-dasharray="2 3"/>',
search:'<circle cx="14" cy="14" r="9"/><path d="m21 21 8 8M10 14h8m-4-4v8"/>',

feed:'<path d="M4 13h24l-3 10H7L4 13Z"/><path d="M8 26h16M12 6c-3 3 3 3 0 6M20 4c-3 3 3 4 0 7"/>',
bath:'<path d="M5 17h22l-3 10H8L5 17ZM7 17V8a4 4 0 0 1 8 0M12 9h6M10 28v2M23 28v2"/><circle cx="22" cy="9" r="3"/><circle cx="26" cy="3" r="1"/>',
tv:'<rect x="4" y="8" width="24" height="17" rx="4"/><path d="m11 3 5 5 5-5M10 28h12"/><path d="M10 17q5-7 10 0-5 7-10 0Zm10 0 4-3v6l-4-3Z"/>',
play:'<path d="M16 28V15M16 22l-5-4M16 25l5-5"/><path d="M16 12C5-2 0 13 13 15 1 22 14 26 16 16c2 10 15 6 3-1 13-2 8-17-3-3Z"/>',
wardrobe:'<path d="m10 5-7 5 4 7 4-2v13h10V15l4 2 4-7-7-5c-2 5-10 5-12 0Z"/>',
memory:'<path d="M5 5h17a4 4 0 0 1 4 4v19H8a3 3 0 0 1-3-3V5Zm0 18h21M9 5v18"/><path d="M17 12c-4-5-7 2 0 5 7-3 4-10 0-5Z"/>'
};
export function icon(id){return `<svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id]||''}</svg>`;}
