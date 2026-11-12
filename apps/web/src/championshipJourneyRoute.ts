function championshipTab(pathname:string,search:string):"results"|"calendar"|null {
  if (!pathname.startsWith('/season/')) return null;
  const q=new URLSearchParams(search);
  const tab=q.get('tab');
  if (tab!=='results'&&tab!=='calendar') return null;
  if(q.has('round'))return null;
  if(['classic','completed','upcoming'].includes(q.get('view')??''))return null;
  return tab;
}

/** Mobile Results and Calendar remain dedicated hub routes even in grid mode. */
export function isChampionshipMobileHubRoute(pathname:string,search:string):boolean {
  // Detail links from either destination grid stay in the dedicated hub on
  // mobile; otherwise the old combined Home/Showroom stack appears above them.
  if (!pathname.startsWith('/season/')) return false;
  const tab=new URLSearchParams(search).get('tab');
  return tab==='results'||tab==='calendar';
}

/** The scroll-controlled 2D/3D globe is an explicit alternative Calendar view. */
export function isChampionshipJourneyRoute(pathname:string,search:string):boolean {
  if(championshipTab(pathname,search)!=='calendar')return false;
  return ['world','journey'].includes(new URLSearchParams(search).get('view')??'');
}
