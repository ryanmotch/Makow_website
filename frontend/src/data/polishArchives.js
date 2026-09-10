// Polish State Archives whose office is named for one of the 49 pre-1999
// (1975-1998) voivodeship capitals - either as the primary regional archive
// or a branch (Oddział) office serving that city directly. Historical
// voivodeships without a confirmed direct match (e.g. Ciechanów,
// Ostrołęka) are intentionally omitted rather than guessed. Where an
// omitted voivodeship's records are known to be held by a pinned
// archive, that's called out via the `note` field (e.g. Elbląg -> Gdańsk).
// Source: szukajwarchiwach.gov.pl official directory, coordinates geocoded
// via OpenStreetMap Nominatim.
export const ARCHIVES = [
  { voivodeship: "Białystok", office: "Archiwum Państwowe w Białymstoku", email: "sekretariat_ap@bialystok.ap.gov.pl", lat: 53.1323980, lon: 23.1591679 },
  { voivodeship: "Bielsko-Biała", office: "Archiwum Państwowe w Katowicach, Oddział w Bielsku-Białej", email: "apbielsko@katowice.archiwa.gov.pl", lat: 49.8120785, lon: 19.0291988 },
  { voivodeship: "Bydgoszcz", office: "Archiwum Państwowe w Bydgoszczy", email: "kancelaria@bydgoszcz.ap.gov.pl", lat: 53.1297127, lon: 18.0294488 },
  { voivodeship: "Chełm", office: "Archiwum Państwowe w Lublinie, Oddział w Chełmie", email: "chelm@lublin.ap.gov.pl", lat: 51.1339221, lon: 23.4711548 },
  { voivodeship: "Częstochowa", office: "Archiwum Państwowe w Częstochowie", email: "kancelaria@czestochowa.ap.gov.pl", lat: 50.8089997, lon: 19.1244089 },
  { voivodeship: "Gdańsk", office: "Archiwum Państwowe w Gdańsku", email: "apgda@gdansk.ap.gov.pl", lat: 54.4288032, lon: 18.7983270, note: "Also holds records for the former Elbląg voivodeship." },
  { voivodeship: "Gorzów Wielkopolski", office: "Archiwum Państwowe w Gorzowie Wielkopolskim", email: "sekretariat@gorzow.ap.gov.pl", lat: 52.7305756, lon: 15.2107553 },
  { voivodeship: "Jelenia Góra", office: "Archiwum Państwowe we Wrocławiu, Oddział w Jeleniej Górze", email: "legnica@wroclaw.archiwa.gov.pl", lat: 50.8501049, lon: 15.6537492 },
  { voivodeship: "Kalisz", office: "Archiwum Państwowe w Kaliszu", email: "sekretariat@archiwum.kalisz.pl", lat: 51.7472867, lon: 18.0795320 },
  { voivodeship: "Katowice", office: "Archiwum Państwowe w Katowicach", email: "kancelaria@katowice.archiwa.gov.pl", lat: 50.2137315, lon: 19.0058848 },
  { voivodeship: "Kielce", office: "Archiwum Państwowe w Kielcach", email: "kancelaria@kielce.ap.gov.pl", lat: 50.8540285, lon: 20.6099157 },
  { voivodeship: "Konin", office: "Archiwum Państwowe w Poznaniu, Oddział w Koninie", email: "konin@poznan.ap.gov.pl", lat: 52.2301933, lon: 18.2521112 },
  { voivodeship: "Koszalin", office: "Archiwum Państwowe w Koszalinie", email: "sekretariat@koszalin.ap.gov.pl", lat: 54.2071799, lon: 16.2175411 },
  { voivodeship: "Kraków", office: "Archiwum Narodowe w Krakowie", email: "sekretariat@ank.gov.pl", lat: 50.0619474, lon: 19.9368564 },
  { voivodeship: "Legnica", office: "Archiwum Państwowe we Wrocławiu, Oddział w Legnicy", email: "legnica@ap.wroc.pl", lat: 51.2081617, lon: 16.1603187 },
  { voivodeship: "Leszno", office: "Archiwum Państwowe w Lesznie", email: "info@archiwum.leszno.pl", lat: 51.8436498, lon: 16.5744141 },
  { voivodeship: "Lublin", office: "Archiwum Państwowe w Lublinie", email: "kanc@lublin.ap.gov.pl", lat: 51.2181945, lon: 22.5546776 },
  { voivodeship: "Nowy Sącz", office: "Archiwum Narodowe w Krakowie, Oddział w Nowym Sączu", email: "nowysacz@ank.gov.pl", lat: 49.6103040, lon: 20.7149366 },
  { voivodeship: "Olsztyn", office: "Archiwum Państwowe w Olsztynie", email: "sekretariat@olsztyn.ap.gov.pl", lat: 53.7766440, lon: 20.4777531 },
  { voivodeship: "Opole", office: "Archiwum Państwowe w Opolu", email: "kancelaria@opole.archiwa.gov.pl", lat: 50.6787929, lon: 17.9298844 },
  { voivodeship: "Piotrków Trybunalski", office: "Archiwum Państwowe w Piotrkowie Trybunalskim", email: "kancelaria@piotrkow-tryb.ap.gov.pl", lat: 51.4128540, lon: 19.6886837 },
  { voivodeship: "Piła", office: "Archiwum Państwowe w Poznaniu, Oddział w Pile", email: "pila@poznan.ap.gov.pl", lat: 53.1511306, lon: 16.7380343 },
  { voivodeship: "Poznań", office: "Archiwum Państwowe w Poznaniu", email: "archiwum@poznan.ap.gov.pl", lat: 52.4082663, lon: 16.9335199 },
  { voivodeship: "Przemyśl", office: "Archiwum Państwowe w Przemyślu", email: "archiwum@przemysl.ap.gov.pl", lat: 49.7822726, lon: 22.7749654 },
  { voivodeship: "Płock", office: "Archiwum Państwowe w Płocku", email: "sekretariat@plock.ap.gov.pl", lat: 52.5353471, lon: 19.7136301 },
  { voivodeship: "Radom", office: "Archiwum Państwowe w Radomiu", email: "kancelaria@radom.ap.gov.pl", lat: 51.4167270, lon: 21.1607392 },
  { voivodeship: "Rzeszów", office: "Archiwum Państwowe w Rzeszowie", email: "sekretariat@rzeszow.archiwa.gov.pl", lat: 50.0133190, lon: 22.0161677 },
  { voivodeship: "Siedlce", office: "Archiwum Państwowe w Siedlcach", email: "archiw@siedlce.ap.gov.pl", lat: 52.1615938, lon: 22.2812533 },
  { voivodeship: "Sieradz", office: "Archiwum Państwowe w Łodzi, Oddział w Sieradzu", email: "oddzial.sieradz@lodz.ap.gov.pl", lat: 51.6017529, lon: 18.7399015 },
  { voivodeship: "Suwałki", office: "Archiwum Państwowe w Suwałkach", email: "archiwum@suwalki.ap.gov.pl", lat: 54.0990636, lon: 22.9279363 },
  { voivodeship: "Szczecin", office: "Archiwum Państwowe w Szczecinie", email: "sekretariat@szczecin.ap.gov.pl", lat: 53.4298114, lon: 14.5928676 },
  { voivodeship: "Słupsk", office: "Archiwum Państwowe w Koszalinie, Oddział w Słupsku", email: "slupsk@koszalin.ap.gov.pl", lat: 54.4649331, lon: 17.0280730 },
  { voivodeship: "Tarnów", office: "Archiwum Narodowe w Krakowie, Oddział w Tarnowie", email: "tarnow@ank.gov.pl", lat: 50.0259883, lon: 20.9640584 },
  { voivodeship: "Toruń", office: "Archiwum Państwowe w Toruniu", email: "archiwum@torun.ap.gov.pl", lat: 53.0102721, lon: 18.6048094 },
  { voivodeship: "Warszawa", office: "Archiwum Państwowe w Warszawie", email: "archiwum@warszawa.ap.gov.pl", lat: 52.2333742, lon: 21.0711489 },
  { voivodeship: "Wrocław", office: "Archiwum Państwowe we Wrocławiu", email: "sekretariat@wroclaw.archiwa.gov.pl", lat: 51.1263106, lon: 16.9781963 },
  { voivodeship: "Włocławek", office: "Archiwum Państwowe w Toruniu, Oddział we Włocławku", email: "wloclawek@torun.ap.gov.pl", lat: 52.6655636, lon: 19.0961297 },
  { voivodeship: "Zamość", office: "Archiwum Państwowe w Zamościu", email: "kancelaria@zamosc.archiwa.gov.pl", lat: 50.7212452, lon: 23.2595799 },
  { voivodeship: "Zielona Góra", office: "Archiwum Państwowe w Zielonej Górze", email: "sekretariat@archiwum.zgora.pl", lat: 51.9275737, lon: 15.5490421 },
  { voivodeship: "Łomża", office: "Archiwum Państwowe w Białymstoku, Oddział w Łomży", email: "lomza@bialystok.ap.gov.pl", lat: 53.1824307, lon: 22.0521838 },
  { voivodeship: "Łódź", office: "Archiwum Państwowe w Łodzi", email: "kancelaria@lodz.ap.gov.pl", lat: 51.4628238, lon: 19.8913198 },
]
