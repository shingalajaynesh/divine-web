export function getActiveMotherNavigationItem(location) {
  const pathname = location.pathname;
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab');

  if (pathname === '/library') {
    if (tab === 'meditation') return '/library?tab=meditation';
    if (tab === 'music') return '/library?tab=music';
    if (tab === 'videos') return '/library?tab=videos';
    return '/library?tab=meditation'; // default
  }
  if (pathname === '/store') {
    if (tab === 'orders') return '/store?tab=orders';
    return '/store';
  }
  return pathname;
}
