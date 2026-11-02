# Lahjoituslomakkeen saavutettavuustarkistus

Päiväys: 20.10.2026

Kohde: lahjoituslomakkeen frontend  
Tavoite: WCAG 2.2, tasot A ja AA niin pitkälle kuin toteutus ja testausympäristö mahdollistavat

## Yhteenveto

Automatisoidut tarkistukset eivät löytäneet virheitä jäljempänä kuvatuista lomakkeista ja käyttötilanteista. Axe-poikkeuslista on tyhjä. Tämä tulos koskee vain testattuja esimerkkejä ja selaimen emuloimia olosuhteita, eikä se yksin osoita koko lomakkeen tai sitä käyttävän sivuston WCAG 2.2 AA -vaatimustenmukaisuutta.

Chrome ja Safari on varmennettu manuaalisesti macOS:n VoiceOverilla tehtyjen paikallisten demolomakkeiden käyttökokeilujen osalta. Varmennus perustuu käyttäjän testaukseen. Maksutapojen, pakollisten yhteystietokenttien ja muun summan kuulutusten korjauksista on saatu alla kuvattu vahvistus. Tämä on rajattu käyttökokeilu, ei täydellinen ruudunlukija-auditointi tai koko WCAG-vaatimustenmukaisuuden varmennus. Windows-käyttäytyminen testataan myöhemmin staging-ympäristössä.

Selaimen todellinen 200 ja 400 prosentin zoomaus on testattu käyttäjän käyttökokeilussa ja todettu toimivaksi. Raportti kuvaa tehdyt korjaukset, testitulokset sekä tunnetut puutteet ja käyttörajaukset. Testaamattomat ympäristöt ja tilanteet on erotettu todetuista ongelmista: puuttuva testitulos ei itsessään tarkoita saavutettavuusvirhettä. Sivuston ylläpitäjän valitsemat värit ja ympäröivä WordPress-teema vaikuttavat lopputulokseen.

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
- Maksutaparadioiden ja yhteystietokenttien alkutila on nimenomaisesti `aria-invalid="false"`, mutta `required` säilyy. Validointi asettaa virhetilaksi `true`, ja korjaus palauttaa arvon `false`. Muun summan omaa validointiajoitusta ei muutettu. Manuaaliset havainnot on kirjattu erikseen jäljempänä.
- Lähetysvalmius tarkistetaan lukemalla kenttien `willValidate`- ja `validity.valid`-arvot ilman `checkValidity()`-kutsun laukaisemia natiiveja `invalid`-tapahtumia. Tämä estää tilantarkistusta käynnistämästä koskemattomien kenttien virhetapahtumia. Pakolliset kentät, vääränmuotoiset arvot ja mukautetut virheet estävät yhä lähetyksen; käytöstä poistetut kentät eivät. Pelkkä passiivinen tarkistus ei riittänyt poistamaan kaikkia Safarin ennenaikaisia virhekuulutuksia, joten sitä täydennettiin eksplisiittisellä `aria-invalid="false"`-tilalla.
- Kenttäkohtaiset virheet käyttävät `aria-invalid`- ja `aria-describedby`-attribuutteja.
- Yhteystietokenttien ja muun summan virhe-elementit sekä yksi erillinen `aria-live="polite"` -ilmoitusalue ovat DOMissa ennen validointia. Kenttien virhe-elementit eivät itse ole live-alueita.
- Tekstikentän ensimmäisen kirjoituskerran aikana virhettä ei kuuluteta; kentästä poistuttaessa havaittu virhe kirjoitetaan yhteiselle ilmoitusalueelle. Jo validoidun tekstikentän muuttunut virheviesti voi päivittyä ilmoitusalueelle myös kirjoitettaessa. Muun summan virhe kuulutetaan kentästä poistuttaessa tai lähetysyrityksessä, ei kesken kirjoittamisen. Lähetyksen joukkovalidointi kirjoittaa kenttien virhe-elementteihin ja ohjaa fokuksen ensimmäiseen virheeseen. Jos fokus on jo siinä kentässä tai kyseessä on radio, virhe kirjoitetaan lisäksi yhteiseen ilmoitusalueeseen 100 ms:n viiveellä alueen tyhjennyksen jälkeen. Tekstikenttään siirtyvä fokus käyttää edelleen kentän kuvausta ilman erillistä lähetyksen live-ilmoitusta. Odottava viesti perutaan kentästä poistuttaessa, kentän tai radioryhmän arvoa muutettaessa ja uudessa joukkovalidoinnissa. Viestiä ei kirjoiteta, jos kohde on poistettu, piilotettu, pois käytöstä tai korjattu tai alueella on uudempi viesti.
- Samaa muuttumatonta virheviestiä ei kirjoiteta ilmoitusalueelle uudelleen jokaisella näppäilyllä. Manuaalisesti varmennetut kuulutukset on eritelty käyttökokeilujen tuloksissa.
- Radioryhmällä on yksi yhteinen virhe-elementti fieldsetin lopussa, ja ryhmän radiot viittaavat samaan virheeseen. Ilmoitus käyttää ryhmän legend-otsikkoa. Myös toisen vaihtoehdon valitseminen poistaa ryhmän oman ilmoituksen.
- Lahjoitustyypin vaihto tyhjentää vanhan maksutapailmoituksen, kun ilmoituksen kenttä poistuu käytöstä tai jää piilotettuun ryhmään. Tyhjennys säilyttää mahdollisen toisen komponentin uudemman ilmoituksen. Yksikkötesti varmistaa myös, että näkyvän ja käytössä olevan sähköpostikentän aiheellinen ilmoitus säilyy tyypin vaihdossa.
- Kentän korjaaminen ei tyhjennä toisen komponentin myöhemmin kirjoittamaa ilmoitusta. Suojaus on testattu sekä lomakevalidoinnissa että summan käsittelijässä; selain-testissä sähköpostin korjaaminen säilyttää summan uudemman ilmoituksen.
- Alustavan sivutilan `aria-describedby`- ja `aria-labelledby`-viittaukset tarkistetaan jokaisesta testilomakkeesta. Kontaktikenttien ja maksupalveluryhmän virheviittaukset tarkistetaan lisäksi virhetilassa.
- Henkilötietokentillä on tarkoitusta vastaavat `autocomplete`-arvot.
- Muun summan numerokentän `aria-valuetext` sisältää summan ja yksikön (esimerkiksi `25 €`). Yksikkö- ja selaintesti varmistavat arvon päivittymisen kirjoittaessa, valmista summaa valittaessa ja lahjoitustyyppiä vaihdettaessa. Korjaus korvaa aiemman prosenttikuulutuksen rahamäärällä; käyttäjän manuaalinen vahvistus on kirjattu jäljempänä.
- Lähetyspainikkeen `aria-disabled`-tila ja neutraali lomakestatus ovat ohjelmallisesti yhdistettyjä. Status ei ole live region.
- Tavallinen palvelin- tai verkkovirhe näytetään lomaketason `role="alert"` -viestinä ja kirjataan selaimen konsoliin diagnostiikkaa varten.
- Näkyvään kenttään yhdistettävä backend- tai integraatiovirhe näytetään kenttävirheenä. Piilotettuun kenttään kuuluva tai tuntematon virheavain näytetään lomaketason ilmoituksessa. Lähetyspainike palautuu käytettäväksi, jotta yrityksen voi toistaa.

Nämä tarkistukset tukevat erityisesti kriteerejä 1.3.1, 1.3.5, 3.3.1, 3.3.2, 3.3.3, 4.1.2 ja 4.1.3. VoiceOver-käyttökokeilujen tulokset on kirjattu erikseen jäljempänä.

### Näppäimistö ja fokus

- Edustavan kaikki ominaisuudet sisältävän lomakkeen kontrolliryhmien ensimmäiset kohteet saavutetaan odotetussa järjestyksessä: lahjoitustyyppi, kampanja, summa, yhteystiedot, maksupalvelu ja lähetys.
- Natiiveja radiovalintoja voidaan vaihtaa nuolinäppäimillä.
- Lahjoitustyypin, summan, maksupalvelun ja tekstikentän laskettu fokusilmaisin sisältää sekä valkoisen että mustan osan.
- Chromiumin `forced-colors`-emulaatiossa fokusilmaisin säilyy. Valittu vaihtoehto eroaa valitsemattomasta, käyttää järjestelmän `Highlight`-väriä ja näyttää lisäksi ✓-merkin. `aria-disabled`-painikkeen teksti ja reunus käyttävät järjestelmän `GrayText`-väriä.
- Lähetysyritys hiirellä tai Enterillä näyttää virheet ja kohdistaa ensimmäisen virheellisen kentän. Jos Enter painetaan kentässä, joka on jo ensimmäinen virheellinen kenttä, sen nimi ja virhe kirjoitetaan yhteiseen live-ilmoitusalueeseen; pelkkä uudelleenfokusointi ei tuottaisi uutta fokusilmoitusta.
- Toistuva Enter summa- ja sähköpostikentässä säilyttää fokuksen ja palauttaa virheen ilmoitusalueelle viiveellä. Yksikkötesti varmistaa tyhjän välivaiheen ja yhden ei-tyhjän viestin kirjoituksen valmistuvaa lähetysyritystä kohden. Selaintestit kattavat toistuvan Enterin myös maksutaparadiossa sekä maksutapaohjeen välittämisen fokuksen siirtyessä ryhmään lähetyspainikkeesta. Automaattitestien lisäksi käyttäjä on vahvistanut Enter- ja maksutapavirheiden kuulutukset VoiceOverilla jäljempänä kuvatuissa käyttökokeiluissa.
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

Nämä tarkistukset tukevat erityisesti kriteerejä 1.4.4, 1.4.10 ja 2.5.8. Oikean selaimen zoomauksen manuaalinen tulos on kirjattu jäljempänä. Kosketuskäytöstä oikealla mobiililaitteella ei ole testitulosta.

### Värit ja kontrasti

- Axe ei löydä testidatan väriyhdistelmistä tekstin kontrastivirheitä.
- Valinnan värinvaihdossa ei ole kontrastiltaan heikkoja animaation välivärejä.
- Fokusilmaisimen laskettu tyyli sisältää mustan ja valkoisen osan.
- Forced-colors-emulaatiossa valinta, fokus ja passiivinen lähetyspainike käyttävät käyttöjärjestelmän värejä. Testi vertaa valittua ja valitsematonta tilaa sekä ratkaistuja `Highlight`- ja `GrayText`-järjestelmävärejä.

Nämä tarkistukset tukevat erityisesti kriteerejä 1.4.3 ja 1.4.11 vain testidatan ja emuloidun tilan osalta.

## Manuaaliset käyttökokeilut 19.–20.10.2026

Seuraavat havainnot perustuvat käyttäjän ilmoittamiin paikallisten demolomakkeiden VoiceOver-kokeiluihin macOS:llä. Selainten, macOS:n ja VoiceOverin tarkkoja versioita ei kirjattu. Tuloksia ei yleistetä muihin ympäristöihin tai kaikkiin lomaketiloihin.

- **Chrome ja Safari / macOS + VoiceOver: varmennettu tehtyjen käyttökokeilujen osalta.** Alla ovat yksittäiset havainnot; testauksen kattavuusrajaukset on eritelty omassa osiossaan.
- **Fokusilmaisin vaalealla ja tummalla taustalla:** käyttäjä tarkisti ilmaisimen visuaalisesti ja arvioi sen näkyvän hyvin molemmilla taustoilla. Tämä vahvistaa näkyvyyden tarkistetuissa esimerkeissä; kyse ei ole kontrastin mittauksesta tai kaikkien teemataustojen varmennuksesta. Kuvallista taustaa ei ole vielä tarkistettu.
- **Selaimen todellinen zoomaus 200 % ja 400 %:** käyttäjä vahvisti testanneensa molemmat suurennokset ja lomakkeen toimivan hyvin kummallakin. Kyse on manuaalisesta selainzoomauskokeilusta, ei automaatiotestin juurielementin tekstikoon muutoksesta. Tulos koskee käyttäjän kokeilemia näkymiä; tarkkaa ikkunakokoa ei kirjattu.

- **Maksutavat, Safari ja Chrome:** käyttäjä vahvisti maksutapavalinnan toimivan oikein korjauksen jälkeen. Aiempi ennenaikainen ”Vaaditaan, virheellistä dataa, Paytrail” -kuulutus ei enää ollut ongelma.
- **Pakolliset yhteystiedot, Safari:** välimuistin ohittavan sivupäivityksen jälkeen käyttäjä vahvisti pakollisten tekstikenttien toimivan oikein. Etu- ja sukunimen sekä sähköpostin ennenaikaista virhekuulutusta koskeva korjaus on näin vahvistettu tässä käyttökokeilussa. Kaikkien virhe- ja lähetyspolkujen kuulutuksia ei tällä vahvistuksella merkitä testatuiksi.
- **Muu summa -kentän prosenttikuulutus:** käyttäjä vahvisti testanneensa `aria-valuetext`-korjauksen: VoiceOver ei enää sano prosenttia vaan lukee luvun oikein. Prosenttikuulutusta koskeva havainto on näin vahvistettu korjatuksi tässä käyttökokeilussa. Vahvistuksessa ei eritelty selainta.

- **Paluu demon kiitossivulta selaimen Takaisin-painikkeella:** käyttäjä vahvisti, että lomake näyttää paluun jälkeen normaalilta ja sitä voi käyttää uudelleen. Demo ohittaa maksupalvelun ja siirtyy suoraan kiitossivulle, joten tämä vahvistaa vain demon paluupolun toimivuuden. Kokeilu ei yksin osoita, palautuiko sivu selaimen back/forward-välimuistista. Vahvistuksessa ei eritelty selainta.

- **Lähetysyritysten virhekuulutukset:** toisella Enterillä samassa tyhjässä kentässä virhe jäi aluksi hiljaiseksi, eikä maksutavan näkyvä ”Choose a payment method” -ohje kuulunut. Viivästetyn ilmoituksen, radioryhmän eksplisiittisen live-ilmoituksen ja alla kuvatun lisäkorjauksen jälkeen käyttäjä vahvisti VoiceOver-uusintakokeilussa Enter-virhekuulutuksen toimivan oikein ja myös ”Choose a payment method” -ohjeen kuuluvan. Käyttäjä vahvisti 20.10.2026 myös hiirellä tehdyn lähetysyrityksen toimivan viimeisimmän muutoksen jälkeen: virhe kuuluu kerran ja kokonaan. Kaikki kolme lähetysyritysten käyttökokeilua on näin vahvistettu toimiviksi.

Uusintakokeilussa pelkkä 100 ms:n viive ei korjannut toistuvaa Enter-kuulutusta: virhe kuului edelleen vain kerran. Toteutusta täydennettiin vaihtamalla peräkkäisten samanlaisten lähetysvirheviestien lopussa olevan sitovan välilyönnin (`U+00A0`) läsnäoloa. Ratkaisu perustuu [WordPressin dokumentoimaan Safari–VoiceOver-kiertotapaan](https://core.trac.wordpress.org/ticket/36853); se ei muuta virheohjeen sanamuotoa. Yksikkötesti tarkistaa neljä peräkkäistä viestiä ja ilmoituksen poistumisen korjauksen jälkeen, selaintesti kolme peräkkäistä sähköpostikentän lähetysyritystä. Käyttäjä vahvisti tämän lisäkorjauksen jälkeen Enter-kuulutuksen ja maksutapaohjeen toimivan yllä kuvatusti.

## Testauksen kattavuusrajaukset

Seuraavista ei ole manuaalista varmennusta tässä raportissa. Ne ovat testauksen rajauksia, eivät todettuja toimintahäiriöitä tai WCAG-rikkomuksia.

- **Windows / NVDA ja käyttöjärjestelmän suuren kontrastin tila:** Windows-laitetta ei ole ollut käytettävissä. Näiden testaus on sovittu tehtäväksi myöhemmin stagingissa, kun laite on saatavilla. Chromiumin forced-colors-emulaation tulokset on kirjattu automaattisiin tarkistuksiin.
- **Kosketuskäyttö oikealla mobiililaitteella:** ei testitulosta. Kapea näkymä ja kohdekoot on tarkistettu selainautomaatiolla.
- **Fokusilmaisin kuvallisilla teemataustoilla:** ei testitulosta. Vaalea ja tumma tausta on tarkistettu visuaalisesti ja arvioitu hyvin näkyviksi.
- **Paluu varsinaisesta maksupalvelusta:** paikallinen demo ohittaa maksupalvelun. Demon kiitossivulta palaaminen toimii käyttäjän kokeilussa; maksupalvelun testiympäristöstä palaaminen on sovittu testattavaksi myöhemmin stagingissa. Back/forward-välimuistin todellista käyttöä ei ole varmennettu.
- **Kuulutusten kattavuus:** raportti kattaa yllä eritellyt VoiceOver-kokeilut, ei kaikkia virhetilanteita tai ruudunlukijayhdistelmiä. Kentästä poistumisen ja virheen korjaamisen tilapäivitykset on katettu automaatiolla, mutta kaikkia puhekuulutuksia ei ole erikseen kirjattu manuaalisesti varmennetuiksi.

## Tunnetut puutteet ja käyttörajaukset

### Ylläpitäjän valitsemat värit

Testidatan väriyhdistelmät täyttävät automaattiset kontrastitarkistukset, mutta editori sallii edelleen vapaasti valittavia värejä eikä estä riittämättömiä kontrasteja. Ylläpitäjä voi luoda yhdistelmän, joka ei täytä kriteerejä 1.4.3 tai 1.4.11. Kontrastin toteutuminen riippuu siis myös sivustolla käytetyistä väreistä; kaikkien editorissa sallittujen väriyhdistelmien saavutettavuutta ei taata.

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

Testisarjojen viimeisimmät onnistuneet paikalliset ajot (JavaScript ja E2E 19.10.2026, PHP-testit 13.10.2026):

- koko E2E-sarja: 46 testiä
- saavutettavuussarja: 41 testiä
- JavaScript-yksikkötestit: 98 testiä
- PHP-yksikkötestit: 47 testiä
- PHP-integraatiotestit: 23 testiä
- axe-poikkeukset: 0

Testisivujen loppusiivouksen REST-pyyntö korjattiin välittämään `force: true` erillisenä `params`-arvona. Koko E2E-sarja läpäisi korjauksen jälkeen myös loppusiivouksen. PHP-testit tukevat yleistä regressiotarkistusta eivätkä yksin osoita saavutettavuusvaatimusten täyttymistä.

Lisäksi build, JavaScript-lint, PHPCS, PHPStan, Composer-validointi ja `git diff --check` suoritettiin onnistuneesti 19.10.2026. CSS-lint läpäisi 13.10.2026; tämän jälkeen tässä korjauksessa ei muutettu CSS:ää.
