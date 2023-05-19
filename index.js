import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch({headless: false, dumpio: true, slowMo: 500});
  const page = await browser.newPage();

  //prevent puppeteer from failing when one of our many console exceptions are thrown
  process.on('uncaughtException', function (err) {
    console.log('Caught exception: ' + err);
  });

  await page.goto('https://beta.near.org/');

  // Set screen size
  await page.setViewport({width: 1200, height: 1024});

  //page.on('console', msg => console.log('PAGE LOG:', msg.text()));

  // click on try it now
  const searchResultSelector = 'a[href="#/onboarding"]';
  try {
    await page.waitForSelector(searchResultSelector);
    await page.click(searchResultSelector);
  } catch(e) {
    console.log(e)
  }

  // Locate some specific element
  const textSelector = await page.waitForSelector(
    'h6'
  );
  const txt = await textSelector?.evaluate(el => el.innerHTML);


  console.log('The text displayed by element is "%s".', txt);

  await browser.close();
})();