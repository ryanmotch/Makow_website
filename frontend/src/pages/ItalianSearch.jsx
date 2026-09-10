import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './ItalianSearch.module.css';

const RECORD_TYPES = [
  { value: '', label: '— any —' },
  { value: 'nascita', label: 'Birth (Nascita)' },
  { value: 'matrimonio', label: 'Marriage (Matrimonio)' },
  { value: 'morte', label: 'Death (Morte)' },
];

const ANTENATI_URL = 'https://antenati.cultura.gov.it';

export default function ItalianSearch() {
  const [searchParams] = useSearchParams();
  const [comune, setComune] = useState(() => searchParams.get('comune') || '');
  const [provincia, setProvincia] = useState('');
  const [recordType, setRecordType] = useState('');
  const [year, setYear] = useState('');

  const handleSearch = (e) => {
    e.preventDefault();
    window.open(ANTENATI_URL, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <h2 className={styles.title}>Vital Records Search</h2>
        <p className={styles.subtitle}>
          Jot down what you know below, then click Search to open Portale
          Antenati (Italy's state civil records archive) in a new tab —
          it doesn't support pre-filled search links, so use its own
          "Esplora gli Archivi" tool by comune or provincia once there.
        </p>
      </div>

      <form className={styles.form} onSubmit={handleSearch} autoComplete="off">

        <div className={styles.field}>
          <label className={styles.label} htmlFor="comune">
            Town / Municipality <span className={styles.italian}>(Comune)</span>
          </label>
          <input
            id="comune"
            type="text"
            className={styles.input}
            placeholder="e.g. Palermo"
            value={comune}
            onChange={e => setComune(e.target.value)}
          />
          <p className={styles.hint}>The comune where the record was registered — Italian civil records are organized by comune, not parish.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="provincia">
            Province <span className={styles.italian}>(Provincia)</span>
          </label>
          <input
            id="provincia"
            type="text"
            className={styles.input}
            placeholder="e.g. Palermo"
            value={provincia}
            onChange={e => setProvincia(e.target.value)}
          />
          <p className={styles.hint}>Helps narrow results when the comune name is common to more than one province.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="recordType">
            Record Type <span className={styles.italian}>(Tipo di Atto)</span>
          </label>
          <select
            id="recordType"
            className={styles.select}
            value={recordType}
            onChange={e => setRecordType(e.target.value)}
          >
            {RECORD_TYPES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <p className={styles.hint}>Birth, marriage, and death registers are kept separately.</p>
        </div>

        <div className={styles.field}>
          <label className={styles.label} htmlFor="year">
            Year <span className={styles.italian}>(Anno)</span>
          </label>
          <input
            id="year"
            type="text"
            className={styles.input}
            placeholder="e.g. 1890"
            value={year}
            onChange={e => setYear(e.target.value)}
          />
          <p className={styles.hint}>Civil registration in Italy generally starts around 1866, though it varies by region.</p>
        </div>

        <div className={styles.actions}>
          <button type="submit" className={styles.btnPrimary}>
            Open Portale Antenati ↗
          </button>
        </div>

      </form>
    </div>
  );
}
