import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './PolishArchivesSearch.module.css';

const VOIVODESHIPS_1998 = [
  'Biała Podlaska', 'Białystok', 'Bielsko-Biała', 'Bydgoszcz', 'Chełm',
  'Ciechanów', 'Częstochowa', 'Elbląg', 'Gdańsk', 'Gorzów Wielkopolski',
  'Jelenia Góra', 'Kalisz', 'Katowice', 'Kielce', 'Konin', 'Koszalin',
  'Kraków', 'Krosno', 'Legnica', 'Leszno', 'Lublin', 'Łomża', 'Łódź',
  'Nowy Sącz', 'Olsztyn', 'Opole', 'Ostrołęka', 'Piła', 'Piotrków Trybunalski',
  'Płock', 'Poznań', 'Przemyśl', 'Radom', 'Rzeszów', 'Siedlce', 'Sieradz',
  'Skierniewice', 'Słupsk', 'Suwałki', 'Szczecin', 'Tarnobrzeg', 'Tarnów',
  'Toruń', 'Wałbrzych', 'Warszawa', 'Włocławek', 'Wrocław', 'Zamość',
  'Zielona Góra',
];

const CONFESSIONS = [
  { value: '', label: '— any —' },
  { value: 'rzymskokatolickie', label: 'Roman Catholic' },
  { value: 'greckokatolickie', label: 'Greek Catholic (Uniate)' },
  { value: 'prawosławne', label: 'Orthodox' },
  { value: 'ewangelicko-augsburskie', label: 'Lutheran (Augsburg)' },
  { value: 'ewangelicko-reformowane', label: 'Calvinist (Reformed)' },
  { value: 'ewangelicko-metodystyczne', label: 'Methodist' },
  { value: 'mojżeszowe', label: 'Jewish' },
  { value: 'mariawickie', label: 'Mariavite' },
  { value: 'mennonickie', label: 'Mennonite' },
  { value: 'baptystyczne', label: 'Baptist' },
  { value: 'muzułmańskie', label: 'Muslim' },
  { value: 'karaimskie', label: 'Karaite' },
];

const BASE_URL = 'https://www.szukajwarchiwach.gov.pl/wyszukiwanie-akt-metrykalnych';

export default function PolishArchivesSearch() {
  const [searchParams] = useSearchParams();
  const [location, setLocation]     = useState(() => searchParams.get('location') || '');
  const [voivodeship, setVoivodeship] = useState(() => {
    const v = searchParams.get('voivodeship') || '';
    return VOIVODESHIPS_1998.includes(v) ? v : '';
  });
  const [confession, setConfession] = useState('');
  const [churchName, setChurchName] = useState('');

  const buildSearchUrl = () => {
    const params = new URLSearchParams();
    if (location)    params.set('miejscowosc',   location.trim());
    if (voivodeship) params.set('wojewodztwo',   voivodeship);
    if (confession)  params.set('wyznanie',      confession);
    if (churchName)  params.set('nazwa_parafii', churchName.trim());
    const qs = params.toString();
    return qs ? `${BASE_URL}?${qs}` : BASE_URL;
  };

  const handleSearch = (e) => {
    e.preventDefault();
    window.open(buildSearchUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vital Records Search</h2>
        <p className={styles.subtitle}>
          Fill in what you know, then click Search — the Polish archives will open
          in a new tab with your values pre-filled.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSearch} autoComplete="off">

        <div className={styles.field}>
          <label className={styles.label} htmlFor="location">
            Location <span className={styles.polish}>(Miejscowość)</span>
          </label>
          <input
            id="location"
            type="text"
            className={styles.input}
            placeholder="e.g. Maków Mazowiecki"
            value={location}
            onChange={e => setLocation(e.target.value)}
          />
          <p className={styles.hint}>Town, village, or commune where the record was registered.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="voivodeship">
            Voivodeship until 1998 <span className={styles.polish}>(Województwo do 1998)</span>
          </label>
          <select
            id="voivodeship"
            className={styles.select}
            value={voivodeship}
            onChange={e => setVoivodeship(e.target.value)}
          >
            <option value="">— select —</option>
            {VOIVODESHIPS_1998.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <p className={styles.hint}>
            Use the pre-1999 49-province system. Maków Mazowiecki was in <strong>Ostrołęka</strong> voivodeship.
          </p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="confession">
            Confession <span className={styles.polish}>(Wyznanie)</span>
          </label>
          <select
            id="confession"
            className={styles.select}
            value={confession}
            onChange={e => setConfession(e.target.value)}
          >
            {CONFESSIONS.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <p className={styles.hint}>Religious denomination of the parish that kept the records.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="churchName">
            Church / Parish Name <span className={styles.polish}>(Nazwa parafii)</span>
          </label>
          <input
            id="churchName"
            type="text"
            className={styles.input}
            placeholder="e.g. Parafia pw. Wniebowzięcia NMP"
            value={churchName}
            onChange={e => setChurchName(e.target.value)}
          />
          <p className={styles.hint}>Full or partial name of the parish, in Polish if possible.</p>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary}>
            Search Polish Archives ↗
          </button>
        </div>

      </form>
    </div>
  );
}
