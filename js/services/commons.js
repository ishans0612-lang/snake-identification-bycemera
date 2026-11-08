const COMMONS_API = 'https://commons.wikimedia.org/w/api.php';
const imageCache = new Map();
const normalize = (value) => String(value || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function imageMatchesSpecies(title, species) {
  const normalizedTitle = normalize(title);
  const scientificName = normalize(species.scientificName);
  return scientificName.length > 3 && normalizedTitle.includes(scientificName);
}

export async function findLicensedSpeciesPhoto(species) {
  if (imageCache.has(species.id)) return imageCache.get(species.id);

  const query = new URLSearchParams({
    action: 'query',
    format: 'json',
    formatversion: '2',
    generator: 'search',
    gsrsearch: `filetype:bitmap intitle:"${species.scientificName}"`,
    gsrnamespace: '6',
    gsrlimit: '12',
    prop: 'imageinfo',
    iiprop: 'url|extmetadata',
    iiurlwidth: '1000',
    origin: '*'
  });

  try {
    const response = await fetch(`${COMMONS_API}?${query}`);
    if (!response.ok) throw new Error(`Wikimedia Commons responded with ${response.status}`);
    const payload = await response.json();
    const pages = payload.query?.pages || [];
    const page = pages.find((candidate) => imageMatchesSpecies(candidate.title, species));
    const info = page?.imageinfo?.[0];
    if (!info?.thumburl || !info?.extmetadata) {
      imageCache.set(species.id, null);
      return null;
    }

    const metadata = info.extmetadata;
    const photo = {
      url: info.thumburl,
      sourceUrl: info.descriptionurl || info.url,
      license: metadata.LicenseShortName?.value || 'License details unavailable',
      artist: metadata.Artist?.value || metadata.Credit?.value || 'Photographer not credited in metadata',
      attribution: metadata.AttributionRequired?.value === 'true'
    };
    imageCache.set(species.id, photo);
    return photo;
  } catch (error) {
    console.warn('Could not load a licensed Wikimedia Commons photo:', error);
    imageCache.set(species.id, null);
    return null;
  }
}
