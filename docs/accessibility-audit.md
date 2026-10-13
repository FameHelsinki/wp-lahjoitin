# Lahjoituslomakkeen saavutettavuustarkistus

Päiväys: 13.10.2026  
Kohde: lahjoituslomakkeen frontend  
Tavoite: WCAG 2.2, tasot A ja AA niin pitkälle kuin toteutus ja testausympäristö mahdollistavat

## Yhteenveto

Automatisoidut tarkistukset eivät löytäneet virheitä jäljempänä kuvatuista lomakkeista ja käyttötilanteista. Axe-poikkeuslista on tyhjä. Tämä tulos koskee vain testattuja esimerkkejä ja selaimen emuloimia olosuhteita, eikä se yksin osoita koko lomakkeen tai sitä käyttävän sivuston WCAG 2.2 AA -vaatimustenmukaisuutta.

Ennen vaatimustenmukaisuusväitettä tarvitaan vielä testaus oikeilla ruudunlukijoilla, Windowsin suuren kontrastin tilassa, selaimen zoomauksella ja mobiililaitteella. Myös sivuston ylläpitäjän valitsemat värit ja ympäröivä WordPress-teema vaikuttavat lopputulokseen.

## Testidata ja automaation rajaus

Kolme edustavaa testilomaketta kattavat yhdessä:

- yhden ja kaksi lahjoitustyyppiä
- yhden ja useita maksupalveluita
- piilotetun, vapaaehtoisen ja pakollisen yhteystietolomakkeen
- osoite- ja puhelinkentät
- kampanjat ja useat veloituspäivät
- muun summan kentän
- yksi- ja kaksipalstaisen asettelun

Kaikkien asetusyhdistelmien ristituloa ei testata. Kukin DOM-rakennetta muuttava vaihtoehto esiintyy vähintään yhdessä lomakkeessa.

Axe ajetaan seuraavissa tiloissa:

- lomakkeen alkutila
- maksupalvelun valinnan jälkeen
- lahjoitustyypin vaihtamisen jälkeen
- kenttäkohtaisten validointivirheiden näyttämisen jälkeen
- 320 CSS-pikselin levyisessä näkymässä

## Automaattisesti varmennetut asiat

### Rakenne, nimet ja ARIA

- Axe ei raportoi testilomakkeista WCAG 2.0 A/AA-, 2.1 A/AA- tai 2.2 AA -tageihin kuuluvaa rikkomusta.
- Pakolliset yhteystietokentät käyttävät HTML:n `required`-attribuuttia.
- Kenttäkohtaiset virheet käyttävät `aria-invalid`- ja `aria-describedby`-attribuutteja.
- Yhteystietokenttien ja muun summan virhe-elementit sekä yksi erillinen `aria-live="polite"` -ilmoitusalue ovat DOMissa ennen validointia. Kenttien virhe-elementit eivät itse ole live-alueita.
- Yksittäinen kentästä poistumisen virhe tai muun summan virhe kirjoitetaan yhteiselle ilmoitusalueelle vasta kentästä poistuttaessa. Lähetyksen joukkovalidointi kirjoittaa kenttien virhe-elementteihin ja ohjaa fokuksen ensimmäiseen virheeseen. Jos fokus on jo siinä kentässä, sen virhe kirjoitetaan lisäksi yhteiseen ilmoitusalueeseen. Ilmoitus poistuu, kun kentän arvoa muutetaan.
- Samaa muuttumatonta virheviestiä ei kirjoiteta ilmoitusalueelle uudelleen jokaisella näppäilyllä. Todellinen kuulutuskäyttäytyminen on vielä tarkistettava ruudunlukijalla.
- Radioryhmällä on yksi yhteinen virhe-elementti fieldsetin lopussa, ja ryhmän radiot viittaavat samaan virheeseen. Ilmoitus käyttää ryhmän legend-otsikkoa. Myös toisen vaihtoehdon valitseminen poistaa ryhmän oman ilmoituksen.
- Lahjoitustyypin vaihto tyhjentää vanhan maksutapailmoituksen, kun ilmoituksen kenttä poistuu käytöstä tai jää piilotettuun ryhmään. Tyhjennys säilyttää mahdollisen toisen komponentin uudemman ilmoituksen. Yksikkötesti varmistaa myös, että näkyvän ja käytössä olevan sähköpostikentän aiheellinen ilmoitus säilyy tyypin vaihdossa.
- Kentän korjaaminen ei tyhjennä toisen komponentin myöhemmin kirjoittamaa ilmoitusta. Suojaus on testattu sekä lomakevalidoinnissa että summan käsittelijässä; selain-testissä sähköpostin korjaaminen säilyttää summan uudemman ilmoituksen.
- Alustavan sivutilan `aria-describedby`- ja `aria-labelledby`-viittaukset tarkistetaan jokaisesta testilomakkeesta. Kontaktikenttien ja maksupalveluryhmän virheviittaukset tarkistetaan lisäksi virhetilassa.
- Henkilötietokentillä on tarkoitusta vastaavat `autocomplete`-arvot.
- Lähetyspainikkeen `aria-disabled`-tila ja neutraali lomakestatus ovat ohjelmallisesti yhdistettyjä. Status ei ole live region.
- Tavallinen palvelin- tai verkkovirhe näytetään lomaketason `role="alert"` -viestinä ja kirjataan selaimen konsoliin diagnostiikkaa varten.
- Näkyvään kenttään yhdistettävä backend- tai integraatiovirhe näytetään kenttävirheenä. Piilotettuun kenttään kuuluva tai tuntematon virheavain näytetään lomaketason ilmoituksessa. Lähetyspainike palautuu käytettäväksi, jotta yrityksen voi toistaa.

Nämä tarkistukset tukevat erityisesti kriteerejä 1.3.1, 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2 ja 4.1.3. Todellinen puhekäyttäytyminen tarkistetaan vielä ruudunlukijoilla.

### Näppäimistö ja fokus

- Edustavan kaikki ominaisuudet sisältävän lomakkeen kontrolliryhmien ensimmäiset kohteet saavutetaan odotetussa järjestyksessä: lahjoitustyyppi, kampanja, summa, yhteystiedot, maksupalvelu ja lähetys.
- Natiiveja radiovalintoja voidaan vaihtaa nuolinäppäimillä.
- Lahjoitustyypin, summan, maksupalvelun ja tekstikentän laskettu fokusilmaisin sisältää sekä valkoisen että mustan osan.
- Chromiumin `forced-colors`-emulaatiossa fokusilmaisin säilyy. Valittu vaihtoehto eroaa valitsemattomasta, käyttää järjestelmän `Highlight`-väriä ja näyttää lisäksi ✓-merkin. `aria-disabled`-painikkeen teksti ja reunus käyttävät järjestelmän `GrayText`-väriä.
- Lähetysyritys hiirellä tai Enterillä näyttää virheet ja kohdistaa ensimmäisen virheellisen kentän. Jos Enter painetaan kentässä, joka on jo ensimmäinen virheellinen kenttä, sen nimi ja virhe kirjoitetaan yhteiseen live-ilmoitusalueeseen; pelkkä uudelleenfokusointi ei tuottaisi uutta fokusilmoitusta.
- Toistuva Enter summa- ja sähköpostikentässä säilyttää fokuksen ja palauttaa virheen ilmoitusalueelle. Yksikkötesti varmistaa yhden ei-tyhjän viestin kirjoituksen lähetysyritystä kohden. Tämä ei vielä todista toistuvan puhekuulutuksen toimintaa ruudunlukijalla.
- Kenttäkohtainen backend- tai integraatiovirhe, myös palvelimen palauttama summavirhe, siirtää fokuksen virheelliseen näkyvään kenttään.
- Lähetyksen aikana painikkeen fokus säilyy, ja päällekkäinen lähetys estetään tilavartijalla. Yksikkötesti varmistaa vartijan vapautumisen `pageshow`-tapahtumassa, jossa `persisted` on tosi. Vain saman dokumentin hash-osoitteeseen siirtyminen vapauttaa vartijan heti; myös täsmälleen samaan URL-osoitteeseen tehtävä uudelleenlataus pitää vartijan päällä.

Nämä tarkistukset tukevat erityisesti kriteerejä 2.1.1, 2.4.3, 2.4.7 ja 2.4.11. Testi ei todista jokaisen mahdollisen teeman tai selain–käyttöjärjestelmä-yhdistelmän visuaalista lopputulosta.

### Validointi ja virheistä palautuminen

- Tekstikentän ensimmäinen virhe näytetään kentästä poistuttaessa, ei kesken ensimmäisen kirjoituskerran.
- Kosketetun kentän virhe päivittyy ja poistuu kirjoittamisen aikana arvon korjauduttua.
- Pelkkä radioryhmän läpi siirtyminen ei näytä virhettä. Ryhmä validoidaan valinnan muuttuessa tai lomaketta lähetettäessä.
- Muu summa näyttää minimi- ja maksimivirheen heti kirjoitettaessa ja estää virheellisen summan lähettämisen. Live-ilmoitus kirjoitetaan kentästä poistuttaessa tai Enter-lähetysyrityksessä, jotta esimerkiksi summan 25 ensimmäistä numeroa 2 ei kuuluteta kesken kirjoittamisen.
- Piilotetun lahjoitustyypin summakentät poistetaan natiivista validoinnista `disabled`-attribuutilla.
- Ulkoinen virhe poistuu koko radioryhmästä uuden valinnan jälkeen sekä custom-validator-kentästä arvon muuttuessa.
- Virhe kerrotaan tekstinä eikä ainoastaan värillä.
- Lähetyspainike pysyy fokusoitavana, mutta sen toiminto estetään, kunnes lomake on kelvollinen.

### Reflow, tekstikoko ja kohdekoot

- 320 CSS-pikselin näkymässä testilomake ei aiheuta dokumenttiin vaakavieritystä.
- Tekstikoon 200 prosentin testi kasvattaa dokumentin juurielementin fonttikoon. Testissä tarkistetut label-, legend-, help-, status- ja painiketekstit eivät leikkaudu eikä dokumenttiin synny vaakavieritystä.
- Kaikki testatussa 320 pikselin näkymässä näkyvät input-, select-, textarea- ja button-kohteet tai niiden label-kohteet ovat vähintään 24 × 24 CSS-pikseliä.

Nämä tarkistukset tukevat erityisesti kriteerejä 1.4.4, 1.4.10 ja 2.5.8. Oikea selaimen zoomaus ja kosketuskäyttö testataan vielä laitteilla.

### Värit ja kontrasti

- Axe ei löydä testidatan väriyhdistelmistä tekstin kontrastivirheitä.
- Valinnan värinvaihdossa ei ole kontrastiltaan heikkoja animaation välivärejä.
- Fokusilmaisimen laskettu tyyli sisältää mustan ja valkoisen osan.
- Forced-colors-emulaatiossa valinta, fokus ja passiivinen lähetyspainike käyttävät käyttöjärjestelmän värejä. Testi vertaa valittua ja valitsematonta tilaa sekä ratkaistuja `Highlight`- ja `GrayText`-järjestelmävärejä.

Nämä tarkistukset tukevat erityisesti kriteerejä 1.4.3 ja 1.4.11 vain testidatan ja emuloidun tilan osalta.

## Vielä manuaalisesti testattavat asiat

Seuraavia kohtia ei merkitä hyväksytyiksi selainautomaation perusteella:

1. VoiceOver ja Safari macOS:llä: nimien, fieldset-ryhmien, virheiden, live-ilmoitusten, alert-viestin ja painikkeen tilan todellinen puhekäyttäytyminen. Tarkista erityisesti toistuva Enter samassa virheellisessä kentässä sekä virheellisen kentän jälkeen hiirellä tehty lähetysyritys: kuuluuko virhe kerran ja kokonaan? Tarkista myös Enter-lähetys radiopainikkeesta; se on automatisoidusti varmennettu Chromiumissa.
2. NVDA ja Chrome tai Firefox Windowsilla: samat ruudunlukijapolut.
3. Windowsin todellinen suuren kontrastin tila. Chromium-emulaatio ei korvaa käyttöjärjestelmätestiä.
4. Selaimen todellinen 200 ja 400 prosentin zoomaus. Automaatiotesti muuttaa juurielementin tekstikokoa eikä vastaa täydellisesti selaimen zoomausta.
5. Kosketuskäyttö oikealla mobiililaitteella.
6. Fokusilmaisimen visuaalinen tarkistus edustavilla vaaleilla, tummilla ja kuvallisilla teemataustoilla.
7. Lähetys maksusivulle ja paluu selaimen Takaisin-painikkeella Chromessa, Firefoxissa ja Safarissa. Yksikkötestin synteettinen `pageshow` ei todista oikeaa back/forward-välimuistista palautumista.

## Avoimet riskit ja käyttörajaukset

### Ylläpitäjän valitsemat värit

Testidatan väriyhdistelmät täyttävät automaattiset kontrastitarkistukset, mutta editori sallii edelleen vapaasti valittavia värejä. Ylläpitäjä voi luoda yhdistelmän, joka ei täytä kriteerejä 1.4.3 tai 1.4.11. Ennen koko ratkaisua koskevaa vaatimustenmukaisuusväitettä editoriin tulisi lisätä kontrastitarkistus tai väriarvot tulisi rajata saavutettaviin yhdistelmiin.

### Useampi lahjoituslomake samalla sivulla

Kenttien tunnisteet ovat tällä hetkellä lomakekohtaisesti vakioita. Jos samalla sivulla tuetaan useita lahjoituslomakkeita, tunnisteet voivat toistua ja rikkoa nimi- tai kuvausviittauksia. Käyttörajaus on yksi lahjoituslomake sivua kohden, kunnes usean lomakkeen tapaus on erikseen testattu ja tarvittaessa tunnisteet yksilöity.

### Rajauksen ulkopuolella

- Gutenberg-editorin oma saavutettavuus
- maksupalveluntarjoajan sivu ja lomakkeen jälkeinen maksupolku
- WordPress-teeman muu sisältö
- editoriin käsin kirjoitetun sisällön käännökset ja saavutettavuus

## Testikomennot ja tämän tarkistuksen tulos

```sh
npm run build
npm run test:e2e
npm run test:unit
composer run-script test:php
npm run test:php:integration
npm run lint:js
npm run lint:css
composer lint:php
```

Viimeisimmässä paikallisessa testiajossa kaikki seuraavat testisarjat läpäisivät:

- koko E2E-sarja: 42 testiä
- saavutettavuussarja: 37 testiä
- JavaScript-yksikkötestit: 83 testiä
- PHP-yksikkötestit: 47 testiä
- PHP-integraatiotestit: 23 testiä
- axe-poikkeukset: 0

Testisivujen loppusiivouksen REST-pyyntö korjattiin välittämään `force: true` erillisenä `params`-arvona. Koko E2E-sarja läpäisi korjauksen jälkeen myös loppusiivouksen. PHP-testit tukevat yleistä regressiotarkistusta eivätkä yksin osoita saavutettavuusvaatimusten täyttymistä.

Lisäksi build, JavaScript- ja CSS-lint, PHPCS, PHPStan, Composer-validointi ja `git diff --check` suoritettiin onnistuneesti.
